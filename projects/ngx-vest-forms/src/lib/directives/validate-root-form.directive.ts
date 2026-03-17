import {
  AfterViewInit,
  booleanAttribute,
  DestroyRef,
  Directive,
  effect,
  inject,
  Injector,
  input,
  signal,
  untracked,
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
import {
  catchError,
  map,
  Observable,
  of,
  switchMap,
  take,
  tap,
  timer,
} from 'rxjs';
import { ROOT_FORM } from '../constants';
import type { NgxSuiteRunResult } from '../utils/validation-suite';
import { NgxTypedVestSuite, NgxVestSuite } from '../utils/validation-suite';
import { ValidationOptions } from './validation-options';

/**
 * Validates the root form (cross-field validation) using a Vest suite.
 *
 * Use this directive for form-wide validations that span multiple fields, such as:
 * - Password confirmation (`password` must match `confirmPassword`)
 * - Date range validation (`startDate` must be before `endDate`)
 * - Business rules like "at least one contact method required"
 *
 * @usageNotes
 *
 * ### Basic Usage
 * ```html
 * <form ngxVestForm ngxValidateRootForm [suite]="suite" (errorsChange)="errors.set($event)">
 *   <!-- form fields -->
 *   @if (errors()['rootForm']) {
 *     <div role="alert">{{ errors()['rootForm'][0] }}</div>
 *   }
 * </form>
 * ```
 *
 * ### Validation Modes
 * - `'submit'` (default): Validates only after form submission. Better UX for complex cross-field rules.
 * - `'live'`: Validates on every value change. Use sparingly for simple two-field comparisons.
 *
 * ```html
 * <form ngxVestForm ngxValidateRootForm [ngxValidateRootFormMode]="'live'">
 * ```
 *
 * ### Vest Suite Pattern
 * ```typescript
 * import { ROOT_FORM } from 'ngx-vest-forms';
 *
 * test(ROOT_FORM, 'Passwords must match', () => {
 *   enforce(model.confirmPassword).equals(model.password);
 * });
 * ```
 *
 * @see {@link https://github.com/ngx-vest-forms/ngx-vest-forms/blob/master/docs/VALIDATION-CONFIG-VS-ROOT-FORM.md}
 *
 * @example
 * ```html
 * <form scVestForm
 *       validateRootForm
 *       [suite]="suite"
 *       [formValue]="formValue()"
 *       [validateRootFormMode]="'submit'"
 *       (errorsChange)="errors.set($event)"
 *       #form="ngForm">
 *   <!-- form fields -->
 *   @if (errors()['rootForm']) {
 *     <div role="alert">{{ errors()['rootForm'][0] }}</div>
 *   }
 * </form>
 * ```
 *
 * @example
 * Validation suite:
 * ```typescript
 * import { ROOT_FORM } from 'ngx-vest-forms';
 *
 * export const suite = create((model) => {
 *   test(ROOT_FORM, 'Passwords must match', () => {
 *     enforce(model.confirmPassword).equals(model.password);
 *   });
 * });
 * ```
 *
 * @publicApi
 */
@Directive({
  selector: 'form[validateRootForm], form[ngxValidateRootForm]',

  providers: [
    {
      provide: NG_ASYNC_VALIDATORS,
      useExisting: ValidateRootFormDirective,
      multi: true,
    },
  ],
})
export class ValidateRootFormDirective<T>
  implements AsyncValidator, AfterViewInit
{
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly lastControl = signal<NgForm | null>(null);
  validationOptions = input<ValidationOptions>({ debounceTime: 0 });
  private readonly hasSubmitted = signal(false);

  readonly formValue = input<T | null>(null);
  readonly suite = input<NgxVestSuite<T> | NgxTypedVestSuite<T> | null>(null);

  /**
   * Whether the root form should be validated or not
   * This will use the field rootForm
   * Accepts both validateRootForm and ngxValidateRootForm
   */
  readonly validateRootForm = input(false, {
    transform: booleanAttribute,
  });
  readonly ngxValidateRootForm = input(false, {
    transform: booleanAttribute,
  });

  /**
   * Validation mode:
   * - 'submit' (default): Only validates after form submission
   * - 'live': Validates on every value change
   * Accepts both validateRootFormMode and ngxValidateRootFormMode
   */
  readonly validateRootFormMode = input<'submit' | 'live'>('submit');
  readonly ngxValidateRootFormMode = input<'submit' | 'live'>('submit');

  constructor() {
    // Trigger validation when hasSubmitted or formValue changes
    effect(() => {
      // Track dependencies
      this.hasSubmitted();
      this.formValue();

      // Also track inputs that affect whether validation should run.
      // These can be set after the first validation pass and we want the
      // root form to re-evaluate once they become available.
      this.suite();
      this.validateRootForm();
      this.ngxValidateRootForm();
      this.validateRootFormMode();
      this.ngxValidateRootFormMode();
      this.validationOptions();

      // Trigger revalidation if form exists
      // Use emitEvent: true so the form directive can update its errors
      // Use untracked() to avoid making the effect reactive to lastControl changes
      const ngForm = untracked(() => this.lastControl());
      if (ngForm?.control) {
        // Defer to the next microtask so Angular has a chance to finish
        // wiring up controls/groups (ngModel/ngModelGroup) on initial render.
        queueMicrotask(() => ngForm.control.updateValueAndValidity());
      }
    });
  }

  /**
   * Subscribe to form submit event using NgForm.ngSubmit EventEmitter
   * This approach avoids conflicts with component's (ngSubmit) handlers
   * Uses Injector to lazily get NgForm, avoiding circular dependency
   * (Directive → NgForm → AsyncValidators → Directive)
   */
  ngAfterViewInit(): void {
    // Lazily inject NgForm to avoid circular dependency
    const ngForm = this.injector.get(NgForm, null);
    this.lastControl.set(ngForm);

    if (!ngForm) {
      console.error(
        '[ValidateRootFormDirective] NgForm not found. Ensure the directive is used on a <form> element with the scVestForm directive. ' +
          'Common setup mistakes: (1) Missing scVestForm directive, (2) Directive on non-form element, (3) NgForm not imported in module/component.'
      );
      return;
    }

    // Ensure we run at least one validation pass after the form is ready.
    // This matters for 'live' mode root-form errors that should appear
    // without requiring a user interaction.
    queueMicrotask(() => ngForm.control.updateValueAndValidity());

    // Subscribe to form submission to set hasSubmitted flag
    ngForm.ngSubmit
      .pipe(
        tap(() => {
          this.hasSubmitted.set(true);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  validate(control: AbstractControl): Observable<ValidationErrors | null> {
    // Skip validation if suite or formValue not set
    if (!this.suite() || !this.formValue()) {
      return of(null);
    }

    // Check both validateRootForm and ngxValidateRootForm inputs
    const isEnabled = this.validateRootForm() || this.ngxValidateRootForm();
    if (!isEnabled) {
      return of(null);
    }

    // Get mode from either input (ngx prefix takes precedence if both set)
    const mode =
      this.ngxValidateRootFormMode() !== 'submit'
        ? this.ngxValidateRootFormMode()
        : this.validateRootFormMode();

    // In 'submit' mode, skip validation until form is submitted
    if (mode === 'submit' && !this.hasSubmitted()) {
      return of(null);
    }

    // Call the validator and return its Observable
    // Angular expects this to complete after emitting once
    const validationResult = this.createAsyncValidator(
      ROOT_FORM,
      this.validationOptions()
    )(control) as Observable<ValidationErrors | null>;

    return validationResult;
  }

  createAsyncValidator(
    field: typeof ROOT_FORM,
    validationOptions: ValidationOptions
  ): AsyncValidatorFn {
    if (!this.suite()) {
      return () => of(null);
    }

    // Note: AsyncValidatorFn requires (control: AbstractControl) signature,
    // but root form validation uses formValue input (typed model) instead of control.value.
    // This is intentional - cross-field validation operates on the complete form model,
    // not individual control values. The underscore prefix indicates intentional non-use.

    return (_control: AbstractControl) => {
      const currentFormValue = this.formValue();
      if (!currentFormValue) {
        return of(null);
      }
      // Use the formValue input which contains the actual model data
      const mod = structuredClone(currentFormValue) as T;

      const debounce = validationOptions.debounceTime ?? 0;
      const source$ =
        debounce > 0 ? timer(debounce).pipe(map(() => mod)) : of(mod);

      return source$.pipe(
        switchMap(
          (model) =>
            new Observable<ValidationErrors | null>((observer) => {
              let cancelled = false;
              observer.add(() => {
                cancelled = true;
              });

              try {
                const suite = this.suite();
                if (!suite) {
                  observer.next(null);
                  observer.complete();
                  return;
                }

                // Vest 6: suite.only(field).run() for focused, stateful validation.
                const result = (suite as NgxVestSuite<T>)
                  .only(field)
                  .run(model);

                const extractErrors = (
                  suiteResult: NgxSuiteRunResult
                ): ValidationErrors | null => {
                  if (cancelled) {
                    return null;
                  }

                  const errors = suiteResult.getErrors()[field];
                  return errors ? { errors } : null;
                };

                const emitAndComplete = (suiteResult: NgxSuiteRunResult) => {
                  if (cancelled) {
                    return;
                  }

                  observer.next(extractErrors(suiteResult));
                  observer.complete();
                };

                const getLatestResult = (): NgxSuiteRunResult =>
                  (suite as NgxVestSuite<T>).get?.() ?? result;

                // Sync path: emit immediately to avoid PENDING status flash.
                if (!result.isPending()) {
                  emitAndComplete(result);
                  return;
                }

                // Async path: use thenable completion when available.
                if (typeof result.then === 'function') {
                  result.then(
                    () => {
                      emitAndComplete(getLatestResult());
                    },
                    () => {
                      // Rejected thenables can still represent validation failures.
                      // Use the suite's latest state immediately to avoid long-lived
                      // polling timers that can keep tests/processes alive.
                      emitAndComplete(getLatestResult());
                    }
                  );
                  return;
                }

                // Fallback path: poll pending state for non-thenable results.
                const intervalId = setInterval(() => {
                  if (!result.isPending()) {
                    clearInterval(intervalId);
                    clearTimeout(timeoutId);
                    emitAndComplete(getLatestResult());
                  }
                }, 25);

                const timeoutId = setTimeout(() => {
                  clearInterval(intervalId);
                  emitAndComplete(getLatestResult());
                }, 5000);

                observer.add(() => {
                  clearInterval(intervalId);
                  clearTimeout(timeoutId);
                });
                return;
              } catch (err) {
                console.error(
                  '[validate-root-form] Validation suite error:',
                  err
                );
                observer.next(null);
                observer.complete();
                return;
              }
            })
        ),
        catchError((err) => {
          console.error('[validate-root-form] Observable error:', err);
          return of(null);
        }),
        take(1),
        takeUntilDestroyed(this.destroyRef)
      );
    };
  }
}
