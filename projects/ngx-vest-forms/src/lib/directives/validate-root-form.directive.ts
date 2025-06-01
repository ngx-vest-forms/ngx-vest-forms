/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  booleanAttribute,
  DestroyRef,
  Directive,
  inject,
  input,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  AsyncValidator,
  AsyncValidatorFn,
  NG_ASYNC_VALIDATORS,
  NgForm,
  ValidationErrors,
} from '@angular/forms';
import { debounceTime, Observable, of, take } from 'rxjs';
import { injectRootFormKey } from '../utils/form-token';
import { mergeValuesAndRawValues } from '../utils/form-utils';
import { VestSuite } from '../utils/validation-suite';
import { ValidationOptions } from './validation-options';

/**
 * Directive responsible for adding root-level (cross-field) validation to an NgForm.
 *
 * This directive is automatically applied by `FormDirective` via `hostDirectives` and should
 * not be used directly. It integrates with Angular's reactive forms validation system by
 * implementing the `AsyncValidator` interface.
 *
 * ## Purpose
 * - Enables validation rules that span multiple form fields (cross-field validation)
 * - Validates entire form state rather than individual field values
 * - Runs Vest suite tests associated with the root form key (typically 'ROOT_FORM')
 *
 * ## How it works
 * 1. Registers as an async validator with Angular Forms via `NG_ASYNC_VALIDATORS`
 * 2. Extracts current form values using `mergeValuesAndRawValues` from the injected `NgForm`
 * 3. Runs the provided Vest suite with the complete form data
 * 4. Returns validation errors for root-level validation failures
 * 5. Automatically debounces validation calls to optimize performance
 *
 * ## Key Features
 * - **Signal-based inputs**: Uses modern Angular signals for reactive configuration
 * - **Automatic cleanup**: Handles subscription cleanup via `takeUntilDestroyed`
 * - **Debounced validation**: Configurable debouncing to prevent excessive validation calls
 * - **Form value access**: Directly accesses form values from NgForm (no longer requires separate formValue input)
 *
 * @example
 * ```typescript
 * /// This directive is automatically applied when using FormDirective
 * <form ngxVestForm
 *       [vestSuite]="mySuite"
 *       [validationOptions]="{ debounceTime: 300 }"
 *       [validateRootForm]="true">
 *   <!-- form content -->
 * </form>
 * ```
 *
 * @see FormDirective - The host directive that applies this directive automatically
 * @see ROOT_FORM - The default key used for root-level validation tests
 * @see injectRootFormKey - Function to get the current root form validation key
 */
@Directive({
  selector: 'form[ngxVestForm]',
  providers: [
    {
      provide: NG_ASYNC_VALIDATORS,
      useExisting: ValidateRootFormDirective,
      multi: true,
    },
  ],
})
export class ValidateRootFormDirective<T> implements AsyncValidator {
  /**
   * Configuration options for validation behavior.
   *
   * @example
   * ```typescript
   * [validationOptions]="{ debounceTime: 500 }"
   * ```
   */
  readonly validationOptions = input<ValidationOptions>({ debounceTime: 0 });

  readonly #destroyRef = inject(DestroyRef);
  readonly #ngForm = inject(NgForm);
  readonly #rootFormKey = injectRootFormKey();

  /**
   * The Vest validation suite used for root-level validation.
   * This suite should contain validation tests that use the root form key
   * (typically obtained via `injectRootFormKey()`).
   *
   * @example
   * ```typescript
   * const suite = staticSuite((data, field) => {
   *   only(field);
   *
   *   test('ROOT_FORM', 'Passwords must match', () => {
   *     enforce(data.password).equals(data.confirmPassword);
   *   });
   * });
   *
   * [vestSuite]="suite"
   * ```
   */
  readonly vestSuite = input<VestSuite | null>(null);

  /**
   * Controls whether root-level validation should be performed.
   *
   * When `true` (default), this directive will add root-level async validation
   * using the key from `injectRootFormKey()`. When `false`, root validation is skipped.
   *
   * **BREAKING CHANGE**: The default is now `true`. If you do not want root-level
   * validation, explicitly set `[validateRootForm]="false"`.
   *
   * ## When to disable root validation:
   * - **Field-only validation**: Forms that only need individual field validation
   * - **Performance optimization**: When root validation is expensive and not always needed
   * - **Legacy forms**: Simple forms that don't require cross-field validation rules
   * - **Gradual migration**: When migrating from older validation patterns
   *
   * @example
   * ```typescript
   * <!-- Disable root validation -->
   * <form ngxVestForm [validateRootForm]="false">
   *   <!-- Only field-level validation will run -->
   * </form>
   *
   * <!-- Enable root validation (default) -->
   * <form ngxVestForm [validateRootForm]="true" [vestSuite]="crossFieldSuite">
   *   <!-- Both field and root validation will run -->
   * </form>
   * ```
   */
  readonly validateRootForm = input(true, { transform: booleanAttribute });

  /**
   * Implements the AsyncValidator interface for Angular Forms integration.
   *
   * This method is called by Angular's reactive forms system when form validation
   * is triggered. It orchestrates the validation process by:
   * 1. Checking if a Vest suite is available
   * 2. Extracting current form values from NgForm
   * 3. Delegating to the async validator function if validation should proceed
   *
   * @param control - The Angular form control being validated (typically the root form)
   * @returns Observable that emits ValidationErrors for failures, null for success
   *
   * @internal This method is called automatically by Angular Forms - do not call directly
   */
  validate(
    control: AbstractControl<any, any>,
  ): Observable<ValidationErrors | null> {
    const currentVestSuite = this.vestSuite();
    const currentFormValue = mergeValuesAndRawValues<T>(this.#ngForm.form);

    if (!currentVestSuite || !currentFormValue) {
      return of(null);
    }

    return this.createAsyncValidator(
      this.#rootFormKey,
      this.validationOptions(),
    )(control.getRawValue()) as Observable<ValidationErrors | null>;
  }

  /**
   * Creates an async validator function that runs Vest validation for the specified field.
   *
   * This factory method creates a reusable async validator that:
   * 1. Extracts current form values from NgForm
   * 2. Clones the data to prevent mutations during validation
   * 3. Runs the Vest suite with the cloned data and field key
   * 4. Processes validation results and returns appropriate error structure
   * 5. Applies debouncing and cleanup via RxJS operators
   *
   * @param field - The validation field key (typically the root form key)
   * @param validationOptions - Configuration for debouncing and other validation behavior
   * @returns AsyncValidatorFn that can be used by Angular Forms
   *
   * @internal This is a factory method - the returned function does the actual validation
   */
  createAsyncValidator(
    field: string,
    validationOptions: ValidationOptions,
  ): AsyncValidatorFn {
    const currentVestSuite = this.vestSuite();
    if (!currentVestSuite) {
      return () => of(null);
    }

    return () => {
      const currentFormValue = mergeValuesAndRawValues<T>(this.#ngForm.form);
      if (!currentFormValue) {
        return of(null);
      }

      // Clone the current value to avoid direct mutation during validation
      const formDataClone = structuredClone(currentFormValue);

      return new Observable<ValidationErrors | null>((observer) => {
        currentVestSuite(formDataClone, field).done((result: any) => {
          const errors = result.getErrors()[field];
          observer.next(errors ? { error: errors[0], errors } : null);
          observer.complete();
        });
      }).pipe(
        debounceTime(validationOptions.debounceTime),
        take(1),
        takeUntilDestroyed(this.#destroyRef),
      );
    };
  }
}
