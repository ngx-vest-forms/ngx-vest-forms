import {
  DestroyRef,
  Directive,
  DoCheck,
  ElementRef,
  inject,
  Injector,
  input,
  OnInit,
} from '@angular/core';
import {
  AbstractControl,
  AsyncValidator,
  NG_ASYNC_VALIDATORS,
  NgModel,
  ValidationErrors,
} from '@angular/forms';
import { Observable, tap } from 'rxjs';
import { scheduleMicrotask } from '../utils/destroy-scheduler';
import { getFormControlField } from '../utils/form-utils';
import { runAsyncValidationBridge } from './async-validator-bridge';
import { registerControlElement } from './field-element-registry';
import { FormDirective } from './form.directive';
import {
  attachMissingValidators,
  AttachedValidators,
  detachValidators,
  hasValueAccessorProvider,
  isControlSetUp,
  reportNotRegistered,
} from './signal-control-validators';
import { ValidationOptions } from './validation-options';

/**
 * How many microtasks to wait for a form container to register a Signal
 * Forms custom control before giving up. Registration normally lands within
 * two.
 */
const MAX_SETUP_WAIT_MICROTASKS = 5;

/**
 * Hooks into `ngModel` and runs async field-level validation
 * through the parent `FormDirective` Vest suite bridge.
 */
@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector -- attaches to Angular's own ngModel, so it shares that selector
  selector: '[ngModel]',

  providers: [
    {
      provide: NG_ASYNC_VALIDATORS,
      useExisting: FormModelDirective,
      multi: true,
    },
  ],
})
export class FormModelDirective implements AsyncValidator, OnInit, DoCheck {
  /**
   * Per-control async validation options.
   *
   * Defaults to no debounce (`{ debounceTime: 0 }`).
   */
  validationOptions = input<ValidationOptions>({ debounceTime: 0 });
  /**
   * Reference to the form that needs to be validated
   * Injected optionally so that using ngModel outside of an ngxVestForm
   * does not crash the application. In that case, validation becomes a no-op.
   */
  readonly #formDirective: FormDirective<Record<string, unknown>> | null =
    inject(FormDirective, {
      optional: true,
    });

  readonly #injector = inject(Injector);
  readonly #elementRef = inject<ElementRef<Element>>(ElementRef);
  readonly #destroyRef = inject(DestroyRef);

  /**
   * Set when the element may take Angular's custom-control path (see
   * `signal-control-validators.ts`); `null` for native inputs and
   * provider-based ControlValueAccessors.
   */
  #customControl: { ngModel: NgModel; name: string } | null = null;
  /** What this directive attached, and to which control. */
  #attached: AttachedValidators | null = null;
  /** The control whose next `validate()` run should announce its result. */
  #announceControl: AbstractControl | null = null;

  ngOnInit(): void {
    // Register the host element so blur handling can map it back to this
    // control's path without reading Angular internals. Resolved here, not
    // in the constructor: NgModel injects this directive as an async validator,
    // so injecting it back during construction would be a DI cycle.
    const ngModel = this.#injector.get(NgModel, null, {
      self: true,
      optional: true,
    });
    const ngForm = this.#formDirective?.ngForm;
    if (ngModel && ngForm) {
      this.#destroyRef.onDestroy(
        registerControlElement(ngForm, this.#elementRef.nativeElement, ngModel)
      );
      if (
        !hasValueAccessorProvider(
          this.#injector,
          this.#elementRef.nativeElement
        )
      ) {
        this.#customControl = { ngModel, name: ngModel.name };
        this.#destroyRef.onDestroy(() => {
          this.#detach();
        });
        this.#scheduleValidatorAttachment(false);
      }
    }
  }

  /**
   * Angular sets a control up again (and may point `NgModel` at another,
   * already registered `FormControl`) when its `name` changes, so check
   * again then, and revalidate at the new path. Only hosts without an
   * `NG_VALUE_ACCESSOR` provider get past the guard.
   */
  ngDoCheck(): void {
    const customControl = this.#customControl;
    if (customControl && customControl.ngModel.name !== customControl.name) {
      customControl.name = customControl.ngModel.name;
      this.#scheduleValidatorAttachment(true);
    }
  }

  /**
   * Runs field-level async validation for this control.
   *
   * Returns `null` (fail-open) when used outside an `ngxVestForm` context.
   */
  validate(control: AbstractControl): Observable<ValidationErrors | null> {
    const result = runAsyncValidationBridge(
      control,
      this.#formDirective,
      (currentControl, context) =>
        getFormControlField(context.ngForm.control, currentControl),
      this.validationOptions(),
      'FormModelDirective'
    );
    if (control !== this.#announceControl) {
      return result;
    }
    this.#announceControl = null;
    // Angular sets the result silently (the run started with emitEvent
    // false) right after this emits; announce it once that has happened.
    return result.pipe(
      tap(() => {
        scheduleMicrotask(() => {
          if (!control.pending) {
            control.setErrors(control.errors);
          }
        }, this.#destroyRef);
      })
    );
  }

  /**
   * Attaches `NgModel`'s validators (which include this directive) where
   * Angular 22.2 does not; see `signal-control-validators.ts`.
   *
   * It must run after Angular's own setup, which a form container performs
   * in a microtask queued from `NgModel.ngOnChanges()` (and the order of the
   * two directives' hooks on the element is not fixed). Rather than counting
   * hops, it waits until the control is reachable at its path in its own
   * form, which the container makes true in the same step as the setup, and
   * gives up (with a dev-mode diagnostic) after a few microtasks.
   */
  #scheduleValidatorAttachment(revalidate: boolean, attempt = 0): void {
    const customControl = this.#customControl;
    // Never register on an already destroyed DestroyRef. A callback that
    // runs means the ref was not destroyed, so rescheduling from it is safe.
    if (!customControl || this.#destroyRef.destroyed) {
      return;
    }
    scheduleMicrotask(() => {
      const { ngModel } = customControl;
      if (isControlSetUp(ngModel)) {
        this.#syncValidators(ngModel, revalidate);
      } else if (attempt < MAX_SETUP_WAIT_MICROTASKS) {
        this.#scheduleValidatorAttachment(revalidate, attempt + 1);
      } else {
        reportNotRegistered(ngModel);
      }
    }, this.#destroyRef);
  }

  #syncValidators(ngModel: NgModel, revalidate: boolean): void {
    const control = ngModel.control;
    if (this.#attached && this.#attached.control !== control) {
      // NgModel moved to another, already registered control (a rename
      // onto a taken name): take ours off the control it left.
      this.#detach();
    }
    const added = attachMissingValidators(ngModel, this.#injector);
    if (added) {
      this.#attached = {
        control,
        validator: this.#attached?.validator ?? added.validator,
        asyncValidator: this.#attached?.asyncValidator ?? added.asyncValidator,
      };
    }
    if (added || revalidate) {
      this.#revalidateWithoutValueEvent(control);
    }
  }

  /**
   * Revalidates the control and its ancestors and announces the status
   * (`statusChanges` and `events`), without the `valueChanges` emission an
   * emitting `updateValueAndValidity()` would add for an unchanged value
   * (which value consumers and `validationConfig` triggers would take for an
   * edit). The async result is announced from `validate()` once Angular has
   * stored it.
   */
  #revalidateWithoutValueEvent(control: AbstractControl): void {
    this.#announceControl = control;
    try {
      control.updateValueAndValidity({ emitEvent: false });
    } finally {
      this.#announceControl = null;
    }
    if (control.pending) {
      control.markAsPending();
    } else {
      control.setErrors(control.errors);
    }
  }

  #detach(): void {
    if (this.#attached) {
      detachValidators(this.#attached);
      this.#attached = null;
    }
  }
}
