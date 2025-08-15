import { Directive, inject, input } from '@angular/core';
import {
  AbstractControl,
  AsyncValidator,
  NG_ASYNC_VALIDATORS,
  ValidationErrors,
} from '@angular/forms';
import { Observable, from, of } from 'rxjs';
import { getFormControlField } from '../utils/form-utils';
import { NgxFormDirective } from './form.directive';
import { NgxValidationOptions } from './validation-options';

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
      useExisting: NgxFormModelDirective,
      multi: true,
    },
  ],
})
export class NgxFormModelDirective implements AsyncValidator {
  validationOptions = input<NgxValidationOptions>({ debounceTime: 0 });
  /**
   * Reference to the form that needs to be validated
   * Injected optionally so that using ngModel outside of an ngxVestForm
   * does not crash the application. In that case, validation becomes a no-op.
   */
  private readonly formDirective = inject(NgxFormDirective, {
    optional: true,
  });

  validate(control: AbstractControl): Observable<ValidationErrors | null> {
    // Add null check for control
    if (!control) {
      console.debug(
        '[ngx-vest-forms] Validate called with null control in NgxFormModelDirective.',
      );
      return of(null);
    }

    // If there is no parent NgxFormDirective, skip validation gracefully
    if (!this.formDirective) {
      console.debug(
        '[ngx-vest-forms] ngModel used outside of ngxVestForm; skipping validation.',
      );
      return of(null);
    }

    const { ngForm } = this.formDirective;
    const field = getFormControlField(ngForm.control, control);

    if (!field) {
      console.debug(
        '[ngx-vest-forms] Could not determine field name for validation in NgxFormModelDirective (skipping).',
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
      console.debug(
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
