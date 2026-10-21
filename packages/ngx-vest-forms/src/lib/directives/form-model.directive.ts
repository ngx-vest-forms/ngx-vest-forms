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
 * Hooks into `ngModel`/`ngxModel` and runs async field-level validation
 * through the parent `FormDirective` Vest suite bridge.
 */
@Directive({
  selector: '[ngModel],[ngxModel]',

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
}
