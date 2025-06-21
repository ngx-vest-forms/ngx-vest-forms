import {
  booleanAttribute,
  DestroyRef,
  Directive,
  inject,
  Injector,
  input,
  runInInjectionContext,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  AsyncValidator,
  NG_ASYNC_VALIDATORS,
  ValidationErrors,
} from '@angular/forms';
import { SchemaDefinition } from 'ngx-vest-forms/schemas';
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
import { injectNgxRootFormKey } from '../utils/form-token';
import { NgxVestSuite } from '../utils/validation-suite';
import { NgxFormDirective } from './form.directive';
import type { NgxValidationOptions } from './validation-options';

/**
 * Directive for adding root form validation using Vest validation suites.
 *
 * This directive provides specialized root-level validation that can validate
 * cross-field dependencies and form-wide rules. It works independently of
 * NgxFormDirective to avoid circular dependencies.
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
 * Note: Root validation is disabled by default to prevent circular dependencies
 * and improve performance. Enable it explicitly when you need cross-field validation.
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
      useExisting: NgxValidateRootFormDirective,
      multi: true,
    },
  ],
})
export class NgxValidateRootFormDirective implements AsyncValidator {
  // Modern Angular 20 injection patterns - avoiding circular dependency
  readonly #injector = inject(Injector);
  readonly #destroyRef = inject(DestroyRef);
  readonly #rootFormKey = injectNgxRootFormKey();

  // Validation options for root-level validation
  readonly validationOptions = input<NgxValidationOptions>({ debounceTime: 0 });

  // Input to control whether root validation should run
  readonly validateRootForm = input(false, {
    transform: booleanAttribute,
  });

  // Cache for validation stream to avoid recreating it
  #validationStream?: Observable<ValidationErrors | null>;
  #modelChanges?: ReplaySubject<unknown>;

  /**
   * Get the NgxFormDirective instance using modern Angular 20 injection patterns
   */
  #getFormDirective(): NgxFormDirective<
    SchemaDefinition | null,
    unknown
  > | null {
    try {
      // Use runInInjectionContext for dynamic provider access
      return runInInjectionContext(this.#injector, () => {
        // Try to get NgxFormDirective from the current injector hierarchy
        // Using NgxFormDirective<any, any> to satisfy generic constraints for now
        return inject(NgxFormDirective, { optional: true }) as NgxFormDirective<
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
  #getVestSuite(): NgxVestSuite | null {
    try {
      const formDirective = this.#getFormDirective();
      return formDirective?.vestSuite?.() || null;
    } catch {
      return null;
    }
  }

  /**
   * Create validation stream for root form validation using modern Angular 20 patterns
   * This maintains the same core logic as v1 but with modern reactive patterns
   */
  #createValidationStream(): Observable<ValidationErrors | null> {
    if (!this.#modelChanges) {
      this.#modelChanges = new ReplaySubject<unknown>(1);
    }

    const options = this.validationOptions();
    const rootFormKey = this.#rootFormKey; // Use the injected key (same as v1 'rootForm')

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
            // Call vest suite with model and rootFormKey - same as v1 pattern
            suite(model, rootFormKey).done(
              (result: SuiteResult<string, string>) => {
                const errors = result.getErrors()[rootFormKey];
                const warnings = result.getWarnings()[rootFormKey];

                // Return validation errors in the same format as v1
                // v1 returned { error: errors[0], errors } for compatibility
                let validationOutput: ValidationErrors | null = null;
                if (errors && errors.length > 0) {
                  validationOutput = {
                    error: errors[0], // Primary error message (v1 compatibility)
                    errors: errors, // All error messages
                  };

                  // Add warnings if present
                  if (warnings && warnings.length > 0) {
                    validationOutput['warnings'] = warnings;
                  }
                } else if (warnings && warnings.length > 0) {
                  // Only warnings, no errors
                  validationOutput = {
                    warnings: warnings,
                  };
                }

                observer.next(validationOutput);
                observer.complete();
              },
            );
          } catch (error) {
            // Handle vest suite execution errors
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
   * This method is called by Angular's form validation system
   */
  validate(control: AbstractControl): Observable<ValidationErrors | null> {
    // If root validation is disabled, return null (no validation)
    if (!this.validateRootForm()) {
      return of(null);
    }

    // Create validation stream if it doesn't exist
    if (!this.#validationStream) {
      this.#validationStream = this.#createValidationStream();
    }

    // Get current model from the form control and trigger validation
    const currentModel = control.getRawValue();
    this.#modelChanges?.next(currentModel);

    return this.#validationStream.pipe(take(1));
  }
}
