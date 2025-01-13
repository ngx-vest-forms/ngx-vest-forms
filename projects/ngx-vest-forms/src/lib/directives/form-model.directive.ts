import { Directive, inject, input } from '@angular/core';
import {
  AbstractControl,
  AsyncValidator,
  NG_ASYNC_VALIDATORS,
  ValidationErrors,
} from '@angular/forms';
import { Observable } from 'rxjs';
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
  standalone: true,
  providers: [
    {
      provide: NG_ASYNC_VALIDATORS,
      useExisting: FormModelDirective,
      multi: true,
    },
  ],
})
export class FormModelDirective implements AsyncValidator {
  public validationOptions = input<ValidationOptions>({ debounceTime: 0 });
  private readonly formDirective = inject(FormDirective);

  public validate(
    control: AbstractControl,
  ): Observable<ValidationErrors | null> {
    const { ngForm } = this.formDirective;
    const field = getFormControlField(ngForm.control, control);
    return this.formDirective.createAsyncValidator(
      field,
      this.validationOptions(),
    )(control.getRawValue()) as Observable<ValidationErrors | null>;
  }
}
