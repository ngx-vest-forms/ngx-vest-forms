import { Directive, inject, input, isDevMode } from '@angular/core';
import {
  AbstractControl,
  AsyncValidator,
  NG_ASYNC_VALIDATORS,
  ValidationErrors,
} from '@angular/forms';
import { Observable, from, of } from 'rxjs';
import { getFormControlField } from '../utils/form-utils';
import { NgxFormCoreDirective } from './form-core.directive';
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
  private readonly fullForm = inject(NgxFormDirective, { optional: true });
  private readonly coreForm = inject(NgxFormCoreDirective, {
    optional: true,
    host: true,
  });

  validate(control: AbstractControl): Observable<ValidationErrors | null> {
    // Add null check for control
    if (!control) {
      if (isDevMode()) {
        console.debug(
          '[ngx-vest-forms] Validate called with null control in NgxFormModelDirective.',
        );
      }
      return of(null);
    }

    // If there is no parent NgxFormDirective, skip validation gracefully
    const context = this.fullForm ?? this.coreForm;
    if (!context) {
      if (isDevMode()) {
        console.debug(
          '[ngx-vest-forms] ngModel used outside of ngxVestForm; skipping validation.',
        );
      }
      return of(null);
    }

    const { ngForm } = context;
    const field = getFormControlField(ngForm.control, control);

    if (!field) {
      if (isDevMode()) {
        console.debug(
          '[ngx-vest-forms] Could not determine field name for validation in NgxFormModelDirective (skipping).',
        );
      }
      return of(null);
    }

    const asyncValidator = context.createAsyncValidator(
      field,
      this.validationOptions(),
    );
    // Pass the control itself, not its raw value
    const validationResult = asyncValidator(control);

    if (validationResult instanceof Observable) {
      return validationResult;
    } else if (validationResult instanceof Promise) {
      if (isDevMode()) {
        console.debug(
          '[ngx-vest-forms] Async validator returned a Promise. Converting to Observable.',
        );
      }
      return from(validationResult);
    } else {
      if (isDevMode()) {
        console.error(
          '[ngx-vest-forms] Async validator returned an unexpected type:',
          validationResult,
        );
      }
      return of(null);
    }
  }
}
