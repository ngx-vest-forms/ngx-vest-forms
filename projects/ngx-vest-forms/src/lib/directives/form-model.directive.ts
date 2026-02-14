import { Directive, inject, input } from '@angular/core';
import {
  AbstractControl,
  AsyncValidator,
  NG_ASYNC_VALIDATORS,
  ValidationErrors,
} from '@angular/forms';
import { Observable } from 'rxjs';
import { getFormControlField } from '../utils/form-utils';
import { runAsyncValidationBridge } from './async-validator-bridge';
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
export class FormModelDirective implements AsyncValidator {
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
  private readonly formDirective: FormDirective<
    Record<string, unknown>
  > | null = inject(FormDirective, {
    optional: true,
  });

  /**
   * Runs field-level async validation for this control.
   *
   * Returns `null` (fail-open) when used outside an `ngxVestForm` context.
   */
  validate(control: AbstractControl): Observable<ValidationErrors | null> {
    return runAsyncValidationBridge(
      control,
      this.formDirective,
      (currentControl) => {
        const context = this.formDirective;
        if (!context) return '';
        return getFormControlField(context.ngForm.control, currentControl);
      },
      this.validationOptions(),
      'FormModelDirective'
    );
  }
}
