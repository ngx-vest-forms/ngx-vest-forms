import {
  DestroyRef,
  Directive,
  inject,
  Injector,
  input,
  runInInjectionContext,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NG_ASYNC_VALIDATORS, NgForm, ValidationErrors } from '@angular/forms';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  Observable,
  of,
  ReplaySubject,
  share,
  switchMap,
  take,
} from 'rxjs';
import { SuiteResult } from 'vest';
import { injectRootFormKey } from '../utils/form-token';
import { mergeValuesAndRawValues } from '../utils/form-utils';
import { SchemaDefinition } from 'ngx-vest-forms/schemas';
import { VestSuite } from '../utils/validation-suite';
import { FormDirective } from './form.directive';
import type { ValidationOptions } from './validation-options';

/**
 * Directive for adding root form validation using Vest validation suites.
 *
 * This directive provides specialized root-level validation that can validate
 * cross-field dependencies and form-wide rules. It works independently of
 * FormDirective to avoid circular dependencies.
 *
 * ## Usage
 * ```html
 * <form ngxVestForm
 *       validateRootForm
 *       [vestSuite]="validationSuite"
 *       [validationOptions]="options"
 *       [validateRootForm]="true">
 *   <!-- form content -->
 * </form>
 * ```
 *
 * The directive provides:
 * - Root-level validation for cross-field validation
 * - Integration with Angular's form validation system
 * - Configurable validation behavior via validateRootForm input
 * - Independent operation without circular dependencies
 */
@Directive({
  selector: 'form[ngxVestForm][validateRootForm]',
  providers: [
    {
      provide: NG_ASYNC_VALIDATORS,
      useExisting: ValidateRootFormDirective,
      multi: true,
    },
  ],
})
export class ValidateRootFormDirective {
  // Modern Angular 20 injection patterns - avoiding circular dependency
  readonly #ngForm = inject(NgForm, { optional: true });
  readonly #injector = inject(Injector);
  readonly #destroyRef = inject(DestroyRef);
  readonly #rootFormKey = injectRootFormKey();

  // Validation options for root-level validation
  readonly validationOptions = input<ValidationOptions>({ debounceTime: 0 });

  // Input to control whether root validation should run
  readonly validateRootForm = input<boolean>(true);

  // Cache for validation stream to avoid recreating it
  #validationStream?: Observable<ValidationErrors | null>;
  #modelChanges?: ReplaySubject<unknown>;

  /**
   * Get the FormDirective instance using modern Angular 20 injection patterns
   */
  #getFormDirective(): FormDirective<SchemaDefinition | null, unknown> | null {
    try {
      // Use runInInjectionContext for dynamic provider access
      return runInInjectionContext(this.#injector, () => {
        // Try to get FormDirective from the current injector hierarchy
        // Using FormDirective<any, any> to satisfy generic constraints for now
        return inject(FormDirective, { optional: true }) as FormDirective<
          SchemaDefinition | null,
          unknown
        > | null;
      });
    } catch {
      return null;
    }
  }

  /**
   * Get the vest suite using modern provider resolution
   */
  #getVestSuite(): VestSuite | null {
    try {
      const formDirective = this.#getFormDirective();
      return formDirective?.vestSuite?.() || null;
    } catch {
      return null;
    }
  }

  /**
   * Get current form model/value - with null safety
   */
  #getCurrentModel(): unknown {
    if (!this.#ngForm?.form) {
      return null;
    }
    return mergeValuesAndRawValues(this.#ngForm.form);
  }

  /**
   * Create validation stream for root form validation using modern Angular 20 patterns
   */
  #createValidationStream(): Observable<ValidationErrors | null> {
    if (!this.#modelChanges) {
      this.#modelChanges = new ReplaySubject<unknown>(1);
    }

    const options = this.validationOptions();
    const rootFormKey = this.#rootFormKey; // Use the injected key

    return this.#modelChanges.pipe(
      debounceTime(options.debounceTime),
      distinctUntilChanged(),
      switchMap((model) => {
        const suite = this.#getVestSuite();

        if (!suite) {
          return of(null);
        }

        return new Observable<ValidationErrors | null>((observer) => {
          try {
            suite(model, rootFormKey).done(
              // Use the injected key
              (result: SuiteResult<string, string>) => {
                const errors = result.getErrors()[rootFormKey]; // Use the injected key
                const warnings = result.getWarnings()[rootFormKey]; // Use the injected key

                let validationOutput: ValidationErrors | null = null;
                if (
                  (errors && errors.length > 0) ||
                  (warnings && warnings.length > 0)
                ) {
                  validationOutput = {};
                  if (errors && errors.length > 0) {
                    validationOutput['errors'] = errors;
                  }
                  if (warnings && warnings.length > 0) {
                    validationOutput['warnings'] = warnings;
                  }
                }

                observer.next(validationOutput);
                observer.complete();
              },
            );
          } catch (error) {
            observer.next({
              vestInternalError: `Vest suite execution failed for root form validation.`,
              originalError:
                error instanceof Error ? error.message : String(error),
            });
            observer.complete();
          }
        });
      }),
      catchError(() =>
        of({ vestInternalError: 'Root form validation execution failed' }),
      ),
      share(),
      takeUntilDestroyed(this.#destroyRef),
    );
  }

  /**
   * Implements Angular's AsyncValidator interface for root form validation
   */
  validate(): Observable<ValidationErrors | null> {
    // If root validation is disabled, return null (no validation)
    if (!this.validateRootForm()) {
      return of(null);
    }

    // Create validation stream if it doesn't exist
    if (!this.#validationStream) {
      this.#validationStream = this.#createValidationStream();
    }

    // Get current model and trigger validation
    const currentModel = this.#getCurrentModel();
    this.#modelChanges?.next(currentModel);

    return this.#validationStream.pipe(take(1));
  }
}
