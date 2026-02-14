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
 * Hooks into the ngModelGroup selector and triggers an asynchronous validation for a form group
 * It will use a vest suite behind the scenes
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
  validationOptions = input<ValidationOptions>({ debounceTime: 0 });
  private readonly formDirective: FormDirective<
    Record<string, unknown>
  > | null = inject(FormDirective, { optional: true });

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
