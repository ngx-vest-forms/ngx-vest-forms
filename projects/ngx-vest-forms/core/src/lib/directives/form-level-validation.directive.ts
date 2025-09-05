import { booleanAttribute, Directive, input, signal } from '@angular/core';
import {
  AbstractControl,
  AsyncValidator,
  NG_ASYNC_VALIDATORS,
  ValidationErrors,
} from '@angular/forms';
import {
  catchError,
  debounceTime,
  Observable,
  of,
  switchMap,
  take,
} from 'rxjs';
import { SuiteResult } from 'vest';
import { injectNgxRootFormKey } from '../utils/form-token';
import { NgxVestSuite } from '../utils/validation-suite';
import type { NgxValidationOptions } from './validation-options';

/**
 * Form-level (root) validation using a Vest suite.
 *
 * Contract
 * - Inputs
 *   - `formLevelValidation`: boolean flag that enables the validator on the root form. Disabled by default.
 *   - `formLevelValidationMode`: 'submit' | 'live'. In 'submit' mode (default), the suite runs only after first submit. In 'live' mode, it runs on value changes.
 *   - `formLevelSuite`: Vest suite specifically for root-level rules (password confirmation, cross-field checks, etc.). No implicit fallback is used.
 *   - `validationOptions`: { debounceTime?: number } to debounce live validation.
 * - Output (error shape)
 *   - When errors exist on the root key: `{ errors: string[] }`.
 *   - When only warnings exist: `{ warnings: string[] }`.
 *   - Otherwise: `null`.
 *
 * Usage
 * ```html
 * <form
 *   ngxVestForm
 *   formLevelValidation
 *   [formLevelValidationMode]="'submit'"
 *   [formLevelSuite]="rootSuite"
 *   [validationOptions]="{ debounceTime: 150 }"
 * >
 *   <!-- controls -->
 * </form>
 * ```
 *
 * Notes
 * - The directive intentionally does not fall back to the field-level suite to avoid DI cycles and unclear semantics. Provide `formLevelSuite` explicitly.
 * - In 'submit' mode, the first submit sets an internal submitted flag and immediately revalidates the latest control to surface root errors.
 * - Errors and warnings are placed on the injected root form key; consuming error display components should read that key accordingly.
 */
@Directive({
  selector: 'form[ngxVestForm][formLevelValidation]',
  host: {
    '(ngSubmit)': 'onSubmit()',
  },
  providers: [
    {
      provide: NG_ASYNC_VALIDATORS,
      useExisting: NgxFormLevelValidationDirective,
      multi: true,
    },
  ],
})
export class NgxFormLevelValidationDirective implements AsyncValidator {
  readonly #rootFormKey = injectNgxRootFormKey();

  // State: whether the form has been submitted at least once
  #hasSubmitted = signal(false);
  // Keep last control reference to trigger revalidation after submit
  #lastControl: AbstractControl | null = null;

  // Options
  readonly validationOptions = input<NgxValidationOptions>({ debounceTime: 0 });

  // Inputs
  readonly formLevelValidation = input(false, { transform: booleanAttribute });
  readonly formLevelValidationMode = input<'submit' | 'live'>('submit');
  readonly formLevelSuite = input<NgxVestSuite<Record<string, unknown>> | null>(
    null,
  );

  // Submit handler
  onSubmit(): void {
    this.#hasSubmitted.set(true);
    this.#lastControl?.updateValueAndValidity({
      onlySelf: true,
      emitEvent: true,
    });
  }

  // Helpers
  #enabled(): boolean {
    return this.formLevelValidation();
  }

  #mode(): 'submit' | 'live' {
    return this.formLevelValidationMode() ?? 'submit';
  }

  #getSuite(): NgxVestSuite<Record<string, unknown>> | null {
    const local = this.formLevelSuite();
    if (local) return local as NgxVestSuite<Record<string, unknown>>;
    // No implicit fallback to avoid DI cycles; if absent, validation is a no-op
    return null;
  }

  // AsyncValidator
  validate(control: AbstractControl): Observable<ValidationErrors | null> {
    this.#lastControl = control;

    if (!this.#enabled()) return of(null);
    if (this.#mode() === 'submit' && !this.#hasSubmitted()) return of(null);

    const suite = this.#getSuite();
    if (!suite) return of(null);

    const rootFormKey = this.#rootFormKey;
    const options = this.validationOptions();
    const model = control.getRawValue();

    type RootValidationErrors = ValidationErrors & {
      errors?: string[];
      warnings?: string[];
    };

    return of(model).pipe(
      debounceTime(options.debounceTime ?? 0),
      switchMap(
        (m) =>
          new Observable<ValidationErrors | null>((observer) => {
            try {
              suite(m, rootFormKey).done(
                (result: SuiteResult<string, string>) => {
                  const errors = result.getErrors()[rootFormKey];
                  const warnings = result.getWarnings()[rootFormKey];

                  let out: RootValidationErrors | null = null;
                  if (errors?.length) {
                    out = { errors } as RootValidationErrors;
                    if (warnings?.length) out.warnings = warnings;
                  } else if (warnings?.length) {
                    out = { warnings } as RootValidationErrors;
                  }
                  observer.next(out);
                  observer.complete();
                },
              );
            } catch (error) {
              observer.next({
                vestInternalError:
                  'Vest suite execution failed for form-level validation.',
                originalError:
                  error instanceof Error ? error.message : String(error),
              });
              observer.complete();
            }
          }),
      ),
      catchError(() =>
        of({ vestInternalError: 'Form-level validation execution failed' }),
      ),
      take(1),
    );
  }
}
