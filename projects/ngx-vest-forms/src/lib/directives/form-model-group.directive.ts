import { Directive, inject, input, isDevMode } from '@angular/core';
import {
  AbstractControl,
  AsyncValidator,
  NG_ASYNC_VALIDATORS,
  ValidationErrors,
} from '@angular/forms';
import { FormDirective } from './form.directive';
import { Observable, from, of } from 'rxjs';
import { getFormGroupField } from '../utils/form-utils';
import { ValidationOptions } from './validation-options';

/**
 * Hooks into the ngModelGroup selector and triggers an asynchronous validation for a form group
 * It will use a vest suite behind the scenes
 */
@Directive({
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
  public validationOptions = input<ValidationOptions>({ debounceTime: 0 });
  private readonly formDirective: FormDirective<Record<string, any>> | null =
    inject(FormDirective, { optional: true });

  public validate(
    control: AbstractControl
  ): Observable<ValidationErrors | null> {
    // Null check for control
    if (!control) {
      if (isDevMode()) {
        console.debug(
          '[ngx-vest-forms] Validate called with null control in FormModelGroupDirective.'
        );
      }
      return of(null);
    }
    // Null check for form context
    const context = this.formDirective;
    if (!context) {
      if (isDevMode()) {
        console.debug(
          '[ngx-vest-forms] ngModelGroup used outside of ngxVestForm; skipping validation.'
        );
      }
      return of(null);
    }
    const { ngForm } = context;
    const field = getFormGroupField(ngForm.control, control);
    if (!field) {
      if (isDevMode()) {
        console.debug(
          '[ngx-vest-forms] Could not determine field name for validation in FormModelGroupDirective (skipping).'
        );
      }
      return of(null);
    }
    const asyncValidator = context.createAsyncValidator(
      field,
      this.validationOptions()
    );
    const validationResult = asyncValidator(control.value);
    if (validationResult instanceof Observable) {
      return validationResult;
    } else if (validationResult instanceof Promise) {
      if (isDevMode()) {
        console.debug(
          '[ngx-vest-forms] Async validator returned a Promise. Converting to Observable.'
        );
      }
      return from(validationResult);
    } else {
      if (isDevMode()) {
        console.error(
          '[ngx-vest-forms] Async validator returned an unexpected type:',
          validationResult
        );
      }
      return of(null);
    }
  }
}
