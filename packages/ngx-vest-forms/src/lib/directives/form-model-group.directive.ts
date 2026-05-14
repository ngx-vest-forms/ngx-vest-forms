import { Directive, inject, input } from '@angular/core';
import {
  AbstractControl,
  AsyncValidator,
  NG_ASYNC_VALIDATORS,
  ValidationErrors,
} from '@angular/forms';
import { Observable } from 'rxjs';
import { getFormGroupField } from '../utils/form-utils';
import { runAsyncValidationBridge } from './async-validator-bridge';
import { FormDirective } from './form.directive';
import { ValidationOptions } from './validation-options';

/**
 * Hooks into `ngModelGroup`/`ngxModelGroup` and runs async group-level validation
 * through the parent `FormDirective` Vest suite bridge.
 */
@Directive({
  selector: '[ngModelGroup],[ngxModelGroup]',
  providers: [
    {
      provide: NG_ASYNC_VALIDATORS,
      useExisting: FormModelGroupDirective,
      multi: true,
    },
  ],
})
export class FormModelGroupDirective implements AsyncValidator {
  /**
   * Per-group async validation options.
   *
   * Defaults to no debounce (`{ debounceTime: 0 }`).
   */
  validationOptions = input<ValidationOptions>({ debounceTime: 0 });
  private readonly formDirective: FormDirective<
    Record<string, unknown>
  > | null = inject(FormDirective, { optional: true });

  /**
   * Runs async validation for the current model-group control.
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
        return getFormGroupField(context.ngForm.control, currentControl);
      },
      this.validationOptions(),
      'FormModelGroupDirective'
    );
  }
}
