import { Directive, inject, input } from '@angular/core';
import {
  AbstractControl,
  AsyncValidator,
  NG_ASYNC_VALIDATORS,
  ValidationErrors,
} from '@angular/forms';
import { Observable, from, of } from 'rxjs'; // Import 'from' and 'of'
import { getFormGroupField } from '../utils/form-utils';
import { FormDirective } from './form.directive';
import { ValidationOptions } from './validation-options';

/**
 * Hooks into the ngModelGroup selector and triggers an asynchronous validation for a form group
 * It will use a vest suite behind the scenes
 */
@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[ngModelGroup]',
  providers: [
    {
      provide: NG_ASYNC_VALIDATORS,
      useExisting: FormModelGroupDirective,
      multi: true,
    },
  ],
})
export class FormModelGroupDirective implements AsyncValidator {
  validationOptions = input<ValidationOptions>({ debounceTime: 0 });
  private readonly formDirective = inject(FormDirective);

  validate(control: AbstractControl): Observable<ValidationErrors | null> {
    // Add null check for control
    if (!control) {
      console.warn(
        '[ngx-vest-forms] Validate called with null control in FormModelGroupDirective.',
      );
      return of(null); // Or handle as appropriate
    }

    const { ngForm } = this.formDirective;
    const field = getFormGroupField(ngForm.control, control);

    // Add check for field
    if (!field) {
      console.error(
        '[ngx-vest-forms] Could not determine field name for validation in FormModelGroupDirective.',
      );
      return of(null);
    }

    const asyncValidator = this.formDirective.createAsyncValidator(
      field,
      this.validationOptions(),
    );
    // Pass the control itself, not its value
    const validationResult = asyncValidator(control);

    // Handle Observable and Promise results
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
