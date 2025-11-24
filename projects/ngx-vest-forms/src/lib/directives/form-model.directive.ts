import { Directive, inject, input } from '@angular/core';
import {
  AbstractControl,
  AsyncValidator,
  NG_ASYNC_VALIDATORS,
  ValidationErrors,
} from '@angular/forms';
import { Observable, from, of } from 'rxjs';
import { getFormControlField } from '../utils/form-utils';
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
    // Null check for control
    if (!control) {
      return of(null);
    }
    // Null check for form context
    const context = this.formDirective;
    if (!context) {
      return of(null);
    }
    const { ngForm } = context;
    const field = getFormControlField(ngForm.control, control);
    if (!field) {
      return of(null);
    }
    const asyncValidator = context.createAsyncValidator(
      field,
      this.validationOptions()
    );
    // Pass the control value to the validator
    const validationResult = asyncValidator(control);
    if (validationResult instanceof Observable) {
      return validationResult;
    } else if (validationResult instanceof Promise) {
      return from(validationResult);
    } else {
      return of(null);
    }
  }
}
