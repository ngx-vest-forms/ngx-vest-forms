import {
  DestroyRef,
  Directive,
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
import { Observable } from 'rxjs';
import { getFormControlField } from '../utils/form-utils';
import { runAsyncValidationBridge } from './async-validator-bridge';
import { registerControlElement } from './field-element-registry';
import { FormDirective } from './form.directive';
import { ValidationOptions } from './validation-options';

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
export class FormModelDirective implements AsyncValidator, OnInit {
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
      this.#scheduleValidatorAttachment(ngModel);
    }
  }

  /**
   * Makes sure `NgModel`'s composed validators (which include this
   * directive) are attached to its `FormControl`.
   *
   * Angular attaches them in `setUpControlValueAccessor()` for native inputs
   * and ControlValueAccessor hosts. When `[ngModel]` sits on a Signal Forms
   * custom control (`FormValueControl` / `FormCheckboxControl` from
   * `@angular/forms/signals`), Angular 22.2 takes `setupCustomControl()`
   * instead, which never calls `setUpValidators()`: the validators are
   * collected but never attached, so Vest would never run for the field.
   *
   * The check runs after Angular's own setup, which `NgForm` performs in a
   * microtask queued from `NgModel.ngOnChanges()`. Two microtask hops make
   * sure ours runs after it regardless of the order in which the two
   * directives' hooks run on the element. It compares by the exact function
   * references Angular itself would attach (`NgModel.validator` /
   * `NgModel.asyncValidator`), so it is a no-op for ControlValueAccessor
   * controls and if a future Angular version attaches them upstream, and
   * Angular's own `cleanUpControl()` can still remove them by identity.
   */
  #scheduleValidatorAttachment(ngModel: NgModel): void {
    queueMicrotask(() => {
      queueMicrotask(() => {
        if (!this.#destroyRef.destroyed) {
          attachMissingValidators(ngModel);
        }
      });
    });
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
}

/**
 * Attaches `NgModel`'s composed sync and async validators to its control
 * when Angular has not done so.
 */
function attachMissingValidators(ngModel: NgModel): void {
  const control = ngModel.control;
  const validator = ngModel.validator;
  const asyncValidator = ngModel.asyncValidator;
  let attached = false;

  if (validator && !control.hasValidator(validator)) {
    control.addValidators(validator);
    attached = true;
  }
  if (asyncValidator && !control.hasAsyncValidator(asyncValidator)) {
    control.addAsyncValidators(asyncValidator);
    attached = true;
  }
  if (attached) {
    // Same revalidation Angular runs after its own setup, so the first Vest
    // run sees the control registered at its field path.
    control.updateValueAndValidity({ emitEvent: false });
  }
}
