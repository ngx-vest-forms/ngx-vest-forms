import { Directive, inject, input } from '@angular/core';
import {
  AbstractControl,
  AsyncValidator,
  NG_ASYNC_VALIDATORS,
  ValidationErrors,
} from '@angular/forms';
import { Observable, from, of } from 'rxjs';
import { getFormGroupField } from '../utils/form-utils';
import { FormDirective } from './form.directive';
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
      return of(null);
    }
    // Null check for form context
    const context = this.formDirective;
    if (!context) {
      return of(null);
    }
    const { ngForm } = context;
    const field = getFormGroupField(ngForm.control, control);
    if (!field) {
      return of(null);
    }
    const asyncValidator = context.createAsyncValidator(
      field,
      this.validationOptions()
    );
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
