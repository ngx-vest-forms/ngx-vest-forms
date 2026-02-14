import { isDevMode } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { Observable, from, of } from 'rxjs';
import { FormDirective } from './form.directive';
import { ValidationOptions } from './validation-options';

type FieldResolver = (control: AbstractControl) => string;

type ValidationResult =
  | Observable<ValidationErrors | null>
  | Promise<ValidationErrors | null>
  | ValidationErrors
  | null;

/**
 * @internal
 * Shared bridge for resolving a field path and invoking FormDirective async validation.
 * Keeps fail-open semantics for missing context/path while consolidating behavior.
 *
 * @param control - Control being validated by Angular forms.
 * @param context - Optional parent form directive context.
 * @param resolveField - Resolver that maps the control to a field path.
 * @param validationOptions - Per-control validation options.
 * @param source - Caller identifier for diagnostics.
 */
export function runAsyncValidationBridge(
  control: AbstractControl,
  context: FormDirective<Record<string, unknown>> | null,
  resolveField: FieldResolver,
  validationOptions: ValidationOptions,
  source: 'FormModelDirective' | 'FormModelGroupDirective'
): Observable<ValidationErrors | null> {
  if (!control) {
    return of(null);
  }

  if (!context) {
    if (isDevMode()) {
      console.warn(
        `[ngx-vest-forms] ${source}: No FormDirective context found. Validation skipped (fail-open).`
      );
    }
    return of(null);
  }

  const field = resolveField(control);
  if (!field) {
    if (isDevMode()) {
      console.warn(
        `[ngx-vest-forms] ${source}: Could not resolve control path. Ensure the control has a valid name/path and is registered in the form tree.`
      );
    }
    return of(null);
  }

  const asyncValidator = context.createAsyncValidator(field, validationOptions);
  const validationResult: ValidationResult = asyncValidator(control);

  if (validationResult instanceof Observable) {
    return validationResult;
  }

  if (validationResult instanceof Promise) {
    return from(validationResult);
  }

  return of(validationResult ?? null);
}
