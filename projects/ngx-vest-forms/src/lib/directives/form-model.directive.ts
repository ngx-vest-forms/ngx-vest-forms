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
 * Hooks into the ngModel selector and triggers an asynchronous validation for a form model
 * It will use a vest suite behind the scenes
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
