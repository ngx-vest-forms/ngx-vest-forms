import { Directive, inject, input } from '@angular/core';
import {
  AbstractControl,
  AsyncValidator,
  NG_ASYNC_VALIDATORS,
  ValidationErrors,
} from '@angular/forms';
import { Observable, from, of } from 'rxjs'; // Import 'from' and 'of'
import { getFormGroupField } from '../utils/form-utils';
import { NgxFormCoreDirective } from './form-core.directive';
import { NgxFormDirective } from './form.directive';
import { NgxValidationOptions } from './validation-options';

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
      useExisting: NgxFormModelGroupDirective,
      multi: true,
    },
  ],
})
export class NgxFormModelGroupDirective implements AsyncValidator {
  validationOptions = input<NgxValidationOptions>({ debounceTime: 0 });
  // Inject optionally to prevent runtime DI errors when used outside a ngxVestForm context
  private readonly fullFormDirective = inject(NgxFormDirective, {
    optional: true,
  });
  private readonly coreFormDirective = inject(NgxFormCoreDirective, {
    optional: true,
  });

  validate(control: AbstractControl): Observable<ValidationErrors | null> {
    // Add null check for control
    if (!control) {
      console.debug(
        '[ngx-vest-forms] Validate called with null control in NgxFormModelGroupDirective.',
      );
      return of(null); // Or handle as appropriate
    }

    // Resolve context: prefer full directive if present, else core
    const formContext = this.fullFormDirective ?? this.coreFormDirective;

    // If there is no parent ngxVestForm context, skip validation gracefully
    if (!formContext) {
      console.debug(
        '[ngx-vest-forms] ngModelGroup used outside of ngxVestForm; skipping validation.',
      );
      return of(null);
    }

    const { ngForm } = formContext;
    const field = getFormGroupField(ngForm.control, control);

    // Add check for field
    if (!field) {
      console.debug(
        '[ngx-vest-forms] Could not determine field name for validation in NgxFormModelGroupDirective (skipping).',
      );
      return of(null);
    }

    const asyncValidator = formContext.createAsyncValidator(
      field,
      this.validationOptions(),
    );
    // Pass the control itself, not its value
    const validationResult = asyncValidator(control);

    // Handle Observable and Promise results
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
