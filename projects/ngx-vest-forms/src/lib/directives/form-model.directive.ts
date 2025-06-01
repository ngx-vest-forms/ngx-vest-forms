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
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[ngModel]',
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
   */
  private readonly formDirective = inject(FormDirective);

  validate(control: AbstractControl): Observable<ValidationErrors | null> {
    // Add null check for control
    if (!control) {
      console.warn(
        '[ngx-vest-forms] Validate called with null control in FormModelDirective.',
      );
      return of(null);
    }

    const { ngForm } = this.formDirective;
    const field = getFormControlField(ngForm.control, control);

    if (!field) {
      console.error(
        '[ngx-vest-forms] Could not determine field name for validation in FormModelDirective.',
      );
      return of(null);
    }

    const asyncValidator = this.formDirective.createAsyncValidator(
      field,
      this.validationOptions(),
    );
    // Pass the control itself, not its raw value
    const validationResult = asyncValidator(control);

    if (validationResult instanceof Observable) {
      return validationResult;
    } else if (validationResult instanceof Promise) {
      console.warn(
        '[ngx-vest-forms] Async validator returned a Promise. Converting to Observable.',
      );
      return from(validationResult);
    } else {
      console.error(
        '[ngx-vest-forms] Async validator returned an unexpected type:',
        validationResult,
      );
      return of(null);
    }
  }
}
