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
  NgForm,
  NgModel,
  ValidationErrors,
} from '@angular/forms';
import { Observable } from 'rxjs';
import { scheduleMicrotask } from '../utils/destroy-scheduler';
import { getFormControlField } from '../utils/form-utils';
import { runAsyncValidationBridge } from './async-validator-bridge';
import { registerControlElement } from './field-element-registry';
import { FormDirective } from './form.directive';
import {
  attachMissingValidators,
  isControlSetUp,
  usesCustomControlPath,
} from './signal-control-validators';
import { ValidationOptions } from './validation-options';

/**
 * How many microtasks to wait for `NgForm` to register a Signal Forms custom
 * control before giving up. Registration normally lands within two.
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
  /** Set only when `NgModel` binds a Signal Forms custom control. */
  #customControl: { ngModel: NgModel; ngForm: NgForm; name: string } | null =
    null;

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
        usesCustomControlPath(
          ngModel,
          this.#injector,
          this.#elementRef.nativeElement
        )
      ) {
        this.#customControl = { ngModel, ngForm, name: ngModel.name };
        this.#scheduleValidatorAttachment();
      }
    }
  }

  /**
   * Angular sets a control up again (and may point `NgModel` at another,
   * already registered `FormControl`) when its `name` changes, so check
   * again then. Only Signal Forms custom-control hosts get past the guard.
   */
  ngDoCheck(): void {
    const customControl = this.#customControl;
    if (customControl && customControl.ngModel.name !== customControl.name) {
      customControl.name = customControl.ngModel.name;
      this.#scheduleValidatorAttachment();
    }
  }

  /**
   * Runs field-level async validation for this control.
   *
   * Returns `null` (fail-open) when used outside an `ngxVestForm` context.
   */
  validate(control: AbstractControl): Observable<ValidationErrors | null> {
    return runAsyncValidationBridge(
      control,
      this.#formDirective,
      (currentControl, context) =>
        getFormControlField(context.ngForm.control, currentControl),
      this.validationOptions(),
      'FormModelDirective'
    );
  }

  /**
   * Attaches `NgModel`'s validators (which include this directive) on a
   * Signal Forms custom-control host, where Angular 22.2 does not; see
   * `signal-control-validators.ts`.
   *
   * It must run after Angular's own setup, which `NgForm` performs in a
   * microtask queued from `NgModel.ngOnChanges()` (and the order of the two
   * directives' hooks on the element is not fixed). Rather than counting
   * hops, it waits until the control is reachable at its path, which `NgForm`
   * makes true in the same step as the setup, and gives up after a few
   * microtasks if the control never registers.
   */
  #scheduleValidatorAttachment(attempt = 0): void {
    const customControl = this.#customControl;
    // Never register on an already destroyed DestroyRef. A callback that
    // runs means the ref was not destroyed, so rescheduling from it is safe.
    if (!customControl || this.#destroyRef.destroyed) {
      return;
    }
    scheduleMicrotask(() => {
      const { ngModel, ngForm } = customControl;
      if (isControlSetUp(ngModel, ngForm)) {
        attachMissingValidators(ngModel, this.#injector);
      } else if (attempt < MAX_SETUP_WAIT_MICROTASKS) {
        this.#scheduleValidatorAttachment(attempt + 1);
      }
    }, this.#destroyRef);
  }
}
