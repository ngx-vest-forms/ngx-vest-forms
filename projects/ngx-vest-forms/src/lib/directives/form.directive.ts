import {
  ChangeDetectorRef,
  computed,
  DestroyRef,
  Directive,
  effect,
  inject,
  input,
  InputSignal,
  isDevMode,
  linkedSignal,
  signal,
  untracked,
} from '@angular/core';
import {
  outputFromObservable,
  takeUntilDestroyed,
  toObservable,
  toSignal,
} from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormGroup,
  NgForm,
  PristineChangeEvent,
  StatusChangeEvent,
  ValidationErrors,
  ValueChangeEvent,
} from '@angular/forms';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  filter,
  map,
  Observable,
  of,
  race,
  merge as rxMerge,
  startWith,
  switchMap,
  take,
  tap,
  timer,
} from 'rxjs';
import { logWarning, NGX_VEST_FORMS_ERRORS } from '../errors/error-catalog';
import { NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN } from '../tokens/debounce.token';
import { DeepRequired } from '../utils/deep-required';
import { fastDeepEqual } from '../utils/equality';
import type { ValidationConfigMap } from '../utils/field-path-types';
import { NgxFormState } from '../utils/form-state.utils';
import {
  getAllFormErrors,
  mergeValuesAndRawValues,
  setValueAtPath,
} from '../utils/form-utils';
import { validateShape } from '../utils/shape-validation';
import { NgxTypedVestSuite, NgxVestSuite } from '../utils/validation-suite';
import { ValidationOptions } from './validation-options';

/**
 * Duration (in milliseconds) to keep fields marked as "in-progress" after validation.
 * This prevents immediate re-triggering of bidirectional validations.
 * Increased from 100ms to 500ms to give validators enough time to complete and propagate.
 */
const VALIDATION_IN_PROGRESS_TIMEOUT_MS = 500;

/**
 * Type for validation configuration that accepts both the typed and untyped versions.
 * This ensures backward compatibility while supporting the new typed API.
 */
export type NgxValidationConfig<T = unknown> =
  | Record<string, string[]>
  | ValidationConfigMap<T>
  | null;

/**
 * Main form directive for ngx-vest-forms that bridges Angular template-driven forms with Vest.js validation.
 *
 * This directive provides:
 * - **Unidirectional data flow**: Use `[ngModel]` (not `[(ngModel)]`) with `(formValueChange)` for predictable state updates
 * - **Vest.js integration**: Automatic async validators from Vest suites with field-level optimization
 * - **Validation dependencies**: Configure cross-field validation triggers via `validationConfig`
 * - **Form state**: Access validity, errors, and values through the `formState` signal
 *
 * @usageNotes
 *
 * ### Basic Usage
 * ```html
 * <form ngxVestForm [suite]="validationSuite" (formValueChange)="formValue.set($event)">
 *   <input name="email" [ngModel]="formValue().email" />
 * </form>
 * ```
 *
 * ### With Validation Dependencies
 * ```html
 * <form ngxVestForm [suite]="suite" [validationConfig]="validationConfig">
 *   <input name="password" [ngModel]="formValue().password" />
 *   <input name="confirmPassword" [ngModel]="formValue().confirmPassword" />
 * </form>
 * ```
 * ```typescript
 * validationConfig = { 'password': ['confirmPassword'] };
 * ```
 *
 * ### Accessing Form State
 * ```typescript
 * vestForm = viewChild.required('vestForm', { read: FormDirective });
 * isValid = computed(() => this.vestForm().formState().valid);
 * ```
 *
 * @see {@link https://github.com/ngx-vest-forms/ngx-vest-forms} for full documentation
 * @publicApi
 */
@Directive({
  selector: 'form[scVestForm], form[ngxVestForm]',
  exportAs: 'scVestForm, ngxVestForm',
})
export class FormDirective<T extends Record<string, unknown>> {
  readonly ngForm = inject(NgForm, { self: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly configDebounceTime = inject(
    NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN
  );

  /**
   * Public signal storing field warnings keyed by field path.
   * This allows warnings to be stored and displayed without affecting field validity.
   * Angular's control.errors !== null marks a field as invalid, so we store warnings
   * separately when they exist without errors.
   */
  readonly fieldWarnings = signal<Map<string, readonly string[]>>(new Map());

  // Track last linked value to prevent unnecessary updates
  #lastLinkedValue: T | null = null;
  #lastSyncedFormValue: T | null = null;
  #lastSyncedModelValue: T | null = null;

  // Internal signal tracking form value changes via statusChanges
  readonly #value = toSignal(
    this.ngForm.form.statusChanges.pipe(startWith(this.ngForm.form.status)),
    { initialValue: this.ngForm.form.status }
  );

  /**
   * LinkedSignal that computes form values from Angular form state.
   * This eliminates timing issues with the previous dual-effect pattern.
   */
  readonly #formValueSignal = linkedSignal(() => {
    // Track form value changes
    this.#value();
    const raw = mergeValuesAndRawValues<T>(this.ngForm.form);
    if (Object.keys(this.ngForm.form.controls).length > 0) {
      this.#lastLinkedValue = raw;
      return raw;
    } else if (this.#lastLinkedValue !== null) {
      return this.#lastLinkedValue;
    }
    return null;
  });

  /**
   * Track the Angular form status as a signal for advanced status flags
   */
  readonly #statusSignal = toSignal(
    this.ngForm.form.statusChanges.pipe(startWith(this.ngForm.form.status)),
    { initialValue: this.ngForm.form.status }
  );

  /**
   * Computed signal for form state with validity and errors.
   * Used by templates and tests as vestForm.formState().valid/errors
   *
   * Uses custom equality function to prevent unnecessary recalculations
   * when form status changes but actual values/errors remain the same.
   */
  readonly formState = computed<NgxFormState<T>>(
    () => {
      // Tie to status signal to ensure recomputation on validation changes
      this.#statusSignal();
      return {
        valid: this.ngForm.form.valid,
        errors: getAllFormErrors(this.ngForm.form),
        value: this.#formValueSignal(),
      };
    },
    {
      equal: (a, b) => {
        // Fast path: reference equality
        if (a === b) return true;
        // Null/undefined check
        if (!a || !b) return false;
        // Deep equality check for form state properties
        return (
          a.valid === b.valid &&
          fastDeepEqual(a.errors, b.errors) &&
          fastDeepEqual(a.value, b.value)
        );
      },
    }
  );

  /**
   * The value of the form, this is needed for the validation part.
   * Using input() here because two-way binding is provided via formValueChange output.
   * In the minimal core directive (form-core.directive.ts), this would be model() instead.
   */
  readonly formValue = input<T | null>(null);

  /**
   * Static vest suite that will be used to feed our angular validators.
   * Accepts both NgxVestSuite and NgxTypedVestSuite through compatible type signatures.
   * NgxTypedVestSuite<T> is assignable to NgxVestSuite<T> due to bivariance and
   * FormFieldName<T> (string literal union) being assignable to string.
   */
  readonly suite = input<NgxVestSuite<T> | NgxTypedVestSuite<T> | null>(null);

  /**
   * The shape of our form model. This is a deep required version of the form model
   * The goal is to add default values to the shape so when the template-driven form
   * contains values that shouldn't be there (typo's) that the developer gets run-time
   * errors in dev mode
   */
  readonly formShape = input<DeepRequired<T> | null>(null);

  /**
   * Updates the validation config which is a dynamic object that will be used to
   * trigger validations on the dependant fields
   * Eg: ```typescript
   * validationConfig = {
   *     'passwords.password': ['passwords.confirmPassword']
   * }
   * ```
   *
   * This will trigger the updateValueAndValidity on passwords.confirmPassword every time the passwords.password gets a new value
   *
   * @param v
   */
  readonly validationConfig: InputSignal<NgxValidationConfig<T>> =
    input<NgxValidationConfig<T>>(null);

  private readonly pending$ = this.ngForm.form.events.pipe(
    filter((v) => v instanceof StatusChangeEvent),
    map((v) => (v as StatusChangeEvent).status),
    filter((v) => v === 'PENDING'),
    distinctUntilChanged()
  );

  /**
   * Emits every time the form status changes in a state
   * that is not PENDING
   * We need this to assure that the form is in 'idle' state
   */
  readonly idle$ = this.ngForm.form.events.pipe(
    filter((v) => v instanceof StatusChangeEvent),
    map((v) => (v as StatusChangeEvent).status),
    filter((v) => v !== 'PENDING'),
    distinctUntilChanged()
  );

  /**
   * Triggered as soon as the form value changes
   * It also contains the disabled values (raw values)
   *
   * Cleanup is handled automatically by the directive when it's destroyed.
   */
  readonly formValueChange = outputFromObservable(
    this.ngForm.form.events.pipe(
      filter((v) => v instanceof ValueChangeEvent),
      map((v) => (v as ValueChangeEvent<unknown>).value),
      distinctUntilChanged((prev, curr) => {
        // Use efficient deep equality instead of JSON.stringify for better performance
        return fastDeepEqual(prev, curr);
      }),
      map(() => mergeValuesAndRawValues<T>(this.ngForm.form)),
      takeUntilDestroyed(this.destroyRef)
    )
  );

  /**
   * Emits an object with all the errors of the form
   * every time a form control or form groups changes its status to valid or invalid
   *
   * For submit events, waits for async validation (including ROOT_FORM) to complete
   * before emitting errors. This ensures ROOT_FORM errors are included in the output.
   *
   * Cleanup is handled automatically by the directive when it's destroyed.
   */
  readonly errorsChange = outputFromObservable(
    rxMerge(
      // Status change events (non-PENDING) - emit immediately
      this.ngForm.form.events.pipe(
        filter((v) => v instanceof StatusChangeEvent),
        map((v) => (v as StatusChangeEvent).status),
        filter((v) => v !== 'PENDING')
      ),
      // Submit events - wait for async validation to complete before emitting
      this.ngForm.ngSubmit.pipe(
        switchMap(() => {
          // If form is PENDING (async validation in progress), wait for it to complete
          if (this.ngForm.form.status === 'PENDING') {
            return this.ngForm.form.statusChanges.pipe(
              filter((status) => status !== 'PENDING'),
              take(1)
            );
          }
          // Form not pending, emit immediately
          return of(this.ngForm.form.status);
        })
      )
    ).pipe(
      map(() => getAllFormErrors(this.ngForm.form)),
      takeUntilDestroyed(this.destroyRef)
    )
  );

  /**
   * Triggered as soon as the form becomes dirty
   *
   * Cleanup is handled automatically by the directive when it's destroyed.
   */
  readonly dirtyChange = outputFromObservable(
    this.ngForm.form.events.pipe(
      filter((v) => v instanceof PristineChangeEvent),
      map((v) => !(v as PristineChangeEvent).pristine),
      startWith(this.ngForm.form.dirty),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    )
  );

  /**
   * Fired when the status of the root form changes.
   */
  private readonly statusChanges$ = this.ngForm.form.statusChanges.pipe(
    startWith(this.ngForm.form.status),
    distinctUntilChanged()
  );

  /**
   * Triggered When the form becomes valid but waits until the form is idle
   *
   * Cleanup is handled automatically by the directive when it's destroyed.
   */
  readonly validChange = outputFromObservable(
    this.statusChanges$.pipe(
      filter((e) => e === 'VALID' || e === 'INVALID'),
      map((v) => v === 'VALID'),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    )
  );

  /**
   * Track validation in progress to prevent circular triggering (Issue #19)
   */
  private readonly validationInProgress = new Set<string>();

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.fieldWarnings.set(new Map());
    });

    /**
     * Trigger shape validations if the form gets updated
     * This is how we can throw run-time errors
     */
    if (isDevMode()) {
      effect(() => {
        const v = this.formValue();
        if (v && this.formShape()) {
          validateShape(v, this.formShape() as DeepRequired<T>);
        }
      });
    }

    /**
     * Mark all the fields as touched when the form is submitted
     */
    this.ngForm.ngSubmit
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.ngForm.form.markAllAsTouched();
      });

    /**
     * Single bidirectional synchronization effect using linkedSignal.
     * Uses proper deep comparison and change tracking for correct sync direction.
     * Note: formValue is read-only input(), so we emit changes via formValueChange output.
     */
    effect(() => {
      const formValue = this.#formValueSignal();
      const modelValue = this.formValue();

      // Skip if either is null
      if (!formValue && !modelValue) return;

      // Compute change flags first
      const formChanged = !fastDeepEqual(formValue, this.#lastSyncedFormValue);
      const modelChanged = !fastDeepEqual(
        modelValue,
        this.#lastSyncedModelValue
      );

      // Early return if nothing changed
      if (!formChanged && !modelChanged) {
        return;
      }

      if (formChanged && !modelChanged) {
        // Form was modified by user -> form wins
        // Note: We can't call this.formValue.set() since it's an input()
        // The formValueChange output will emit the new value
        // Use untracked() to avoid infinite loops - we're updating tracking state here
        untracked(() => {
          this.#lastSyncedFormValue = formValue;
          this.#lastSyncedModelValue = formValue;
        });
      } else if (modelChanged && !formChanged) {
        // Model was modified programmatically -> model wins
        // Use untracked() to avoid infinite loops - we're updating tracking state here
        untracked(() => {
          // Update form controls with new model values
          if (modelValue) {
            // IMPORTANT: Use root patchValue instead of per-key setValue.
            // - Supports nested objects (ngModelGroup) without throwing when partial objects are provided.
            // - patchValue ignores missing controls/keys, which is compatible with DeepPartial form models.
            // - emitEvent:false prevents feedback loops; validation still updates internally.
            this.ngForm.form.patchValue(modelValue, { emitEvent: false });
          }
          this.#lastSyncedFormValue = modelValue;
          this.#lastSyncedModelValue = modelValue;
        });
      } else if (formChanged && modelChanged) {
        // Both form and model changed simultaneously
        // Check if they changed to the same value (synchronized change) or different values (conflict)
        const valuesEqual = fastDeepEqual(formValue, modelValue);

        if (valuesEqual) {
          // Both changed to the same value - this is a synchronized change, not a conflict
          // Just update tracking to acknowledge the change
          untracked(() => {
            this.#lastSyncedFormValue = formValue;
            this.#lastSyncedModelValue = formValue;
          });
        } else {
          // Both changed to different values - this is a true conflict
          // This is an edge case that should rarely happen in practice.
          // We intentionally do nothing here to avoid breaking the Angular event flow.
          // The form will continue with its current values, and validation will run normally.
          // The next change (either form or model) will trigger proper synchronization.
        }
      }
    });

    // Set up validation config reactively
    this.#setupValidationConfig();
  }

  /**
   * Manually trigger form validation update.
   *
   * This is useful when form structure changes but no control values change,
   * which means validation state might be stale. This method forces a re-evaluation
   * of all form validators and updates the form validity state.
   *
   * **IMPORTANT: This method validates ALL form fields by design.**
   * This is intentional for structure changes as conditional validators may now
   * apply to different fields, requiring a complete validation refresh.
   *
   * **CRITICAL: This method does NOT mark fields as touched or show errors.**
   * It only re-runs validation logic. To show all errors (e.g., on submit),
   * use `markAllAsTouched()` instead or in combination.
   *
   * **When to use each:**
   * - `triggerFormValidation()` - Re-run validation when structure changes
   * - `markAllAsTouched()` - Show all errors to user (e.g., on submit)
   * - Both together - Rare, only if structure changed AND you want to show errors
   *
   * **Note on form submission:**
   * When using the default error display mode (`on-blur-or-submit`), you typically
   * don't need to call this method on submit. The form directive automatically marks
   * all fields as touched on `ngSubmit`, and errors will display automatically.
   * Only use this method when form structure changes without value changes.
   *
   * **Use Cases:**
   * - Conditionally showing/hiding form controls based on other field values
   * - Adding or removing form controls dynamically
   * - Switching between different form layouts where validation requirements change
   * - Any scenario where form structure changes but no ValueChangeEvent is triggered
   *
   * **Example:**
   * When switching from a form with required input fields to one with only informational content,
   * the form should become valid, but this won't happen automatically
   * when no value changes occur (e.g., switching from input fields to informational content).
   *
   * **Performance Note:**
   * This method calls `updateValueAndValidity({ emitEvent: true })` on the root form,
   * which validates all form controls. For large forms, consider if more granular
   * validation updates are possible.
   *
   * @example
   * ```typescript
   * /// After changing form structure
   * onProcedureTypeChange(newType: string) {
   *   this.procedureType.set(newType);
   *   /// Structure changed but no control values changed
   *   this.formDirective.triggerFormValidation();
   * }
   *
   * /// For submit with multiple forms (show all errors)
   * submitAll() {
   *   // Mark all as touched to show errors
   *   this.form1Ref().markAllAsTouched();
   *   this.form2Ref().markAllAsTouched();
   *   // Only needed if structure changed without value changes
   *   // this.form1Ref().triggerFormValidation();
   *   // this.form2Ref().triggerFormValidation();
   * }
   * ```
   */
  triggerFormValidation(path?: string): void {
    if (path) {
      const control = this.ngForm.form.get(path);
      if (control) {
        control.updateValueAndValidity({ emitEvent: true });
      } else if (isDevMode()) {
        logWarning(NGX_VEST_FORMS_ERRORS.CONTROL_NOT_FOUND, path);
      }
    } else {
      // Update all form controls validity which will trigger all form events
      this.ngForm.form.updateValueAndValidity({ emitEvent: true });
    }
  }

  /**
   * Convenience method to mark all form controls as touched.
   *
   * This is useful for showing all validation errors at once, typically when
   * the user clicks a submit button. When a field is marked as touched,
   * the error display logic (based on `errorDisplayMode`) will show its errors.
   *
   * **Note on automatic behavior:**
   * When using the default error display mode (`on-blur-or-submit`), you typically
   * don't need to call this method manually for regular form submissions. The form
   * directive automatically marks all fields as touched on `ngSubmit`, so errors
   * will display automatically when the user submits the form.
   *
   * **When to use this method:**
   * - Multiple forms with a single submit button (forms without their own submit)
   * - Programmatic form submission without triggering `ngSubmit`
   * - Custom validation flows outside the normal submit process
   *
   * **Note:** This method only marks fields as touched—it does NOT re-run validation.
   * If you also need to re-run validation (e.g., after structure changes), call
   * `triggerFormValidation()` as well.
   *
   * @example
   * ```typescript
   * /// Standard form submission - NO need to call markAllAsTouched()
   * /// The directive handles this automatically on ngSubmit
   * <form ngxVestForm (ngSubmit)="save()">
   *   <button type="submit">Submit</button>
   * </form>
   *
   * /// Multiple forms with one submit button
   * submitAll() {
   *   this.form1().markAllAsTouched();
   *   this.form2().markAllAsTouched();
   *   if (this.form1().formState().valid && this.form2().formState().valid) {
   *     /// Submit all forms
   *   }
   * }
   * ```
   */
  markAllAsTouched(): void {
    this.ngForm.form.markAllAsTouched();
  }

  /**
   * Resets the form to a pristine, untouched state with optional new values.
   *
   * This method properly resets the form by:
   * 1. Resetting Angular's underlying NgForm with the provided value
   * 2. Clearing the bidirectional sync tracking state
   * 3. Forcing a form validity update to clear any stale validation errors
   *
   * **Why this method exists:**
   * When using the pattern `formValue.set({})` to reset a form, there can be a timing
   * issue where the form controls in the DOM still hold their old values while the
   * signal has already been updated. This creates a conflict in the bidirectional
   * sync logic, requiring workarounds like calling `formValue.set({})` twice with
   * a setTimeout. This method provides a proper solution by:
   * - Calling Angular's `NgForm.resetForm()` which properly clears all controls
   * - Clearing the internal sync tracking state to avoid stale comparisons
   * - Triggering a form validity update to ensure validation state is current
   *
   * **Usage:**
   * Instead of the double-set workaround:
   * ```typescript
   * // ❌ Old workaround (avoid)
   * reset(): void {
   *   this.formValue.set({});
   *   setTimeout(() => this.formValue.set({}), 0);
   * }
   *
   * // ✅ Preferred approach
   * vestForm = viewChild.required('vestForm', { read: FormDirective });
   * reset(): void {
   *   this.formValue.set({});
   *   this.vestForm().resetForm();
   * }
   * ```
   *
   * **With new values:**
   * ```typescript
   * // Reset and set new initial values
   * resetWithDefaults(): void {
   *   const defaults = { firstName: '', lastName: '', age: 18 };
   *   this.formValue.set(defaults);
   *   this.vestForm().resetForm(defaults);
   * }
   * ```
   *
   * @param value - Optional new value to reset the form to. If not provided,
   *                resets to empty/default values.
   *
   * @see {@link markAllAsTouched} for showing validation errors
   * @see {@link triggerFormValidation} for re-running validation without reset
   */
  resetForm(value?: T | null): void {
    // Reset Angular's form to clear all controls and mark as pristine/untouched
    this.ngForm.resetForm(value ?? undefined);

    // Clear any stored warnings to avoid stale messages after reset
    this.fieldWarnings.set(new Map());

    // Clear the bidirectional sync tracking state so the next formValue change
    // is treated as a model change (not a conflict with stale form values)
    this.#lastSyncedFormValue = null;
    this.#lastSyncedModelValue = null;
    this.#lastLinkedValue = null;

    // Force change detection to ensure DOM updates are reflected
    // Note: This is still needed even with signals because we're modifying NgForm
    // (reactive forms), not signals. The formValue signal updates happen in the
    // consumer component. detectChanges() ensures NgForm's reset is reflected in
    // the DOM before we update validity.
    this.cdr.detectChanges();

    // Trigger validation update to clear any stale errors
    // Now synchronous since detectChanges() has flushed DOM updates
    this.ngForm.form.updateValueAndValidity({ emitEvent: true });
  }

  /**
   * This will feed the formValueCache, debounce it till the next tick
   * and create an asynchronous validator that runs a vest suite
   * @param field
   * @param validationOptions
   * @returns an asynchronous validator function
   */
  /**
   * V2 async validator pattern: uses timer() + switchMap for proper re-validation.
   * Each invocation builds a fresh one-shot observable, ensuring progressive validation.
   */
  createAsyncValidator(
    field: string,
    validationOptions: ValidationOptions
  ): AsyncValidatorFn {
    const suite = this.suite();
    if (!suite) return () => of(null);

    return (control: AbstractControl) => {
      const model = mergeValuesAndRawValues<T>(this.ngForm.form);

      // Targeted snapshot with candidate value injected at path
      // mergeValuesAndRawValues already returns a deep clone (via structuredClone),
      // so we can modify it directly without affecting the form state.
      const snapshot = model;
      setValueAtPath(snapshot as object, field, control.value);

      // Use timer() instead of ReplaySubject for proper debouncing
      return timer(validationOptions.debounceTime ?? 0).pipe(
        map(() => snapshot),
        switchMap(
          (snap) =>
            new Observable<ValidationErrors | null>((observer) => {
              try {
                // Cast to NgxVestSuite to accept string field parameter
                // Both NgxVestSuite and NgxTypedVestSuite work with string at runtime
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (suite as NgxVestSuite<T>)(snap, field).done((result: any) => {
                  const errors = result.getErrors()[field];
                  const warnings = result.getWarnings()[field];

                  // Store warnings in the fieldWarnings signal for access by control wrappers.
                  // This is necessary because Angular marks a field as invalid when control.errors !== null.
                  // By storing warnings separately, fields can remain valid while still displaying warnings.
                  this.fieldWarnings.update((map) => {
                    const newMap = new Map(map);
                    if (warnings?.length) {
                      newMap.set(field, warnings);
                    } else {
                      newMap.delete(field);
                    }
                    return newMap;
                  });

                  // Build the validation result:
                  // - Errors exist → return { errors, warnings? } (field invalid, Angular shows ng-invalid)
                  // - Only warnings → return null (field valid, warnings accessed via fieldWarnings signal)
                  // - Neither → return null (field valid)
                  //
                  // When errors exist, we also include warnings in control.errors for backwards compatibility
                  // with code that reads warnings from control.errors.warnings.
                  const out = errors?.length
                    ? {
                        errors,
                        ...(warnings?.length && { warnings }),
                      }
                    : null;

                  // CRITICAL: Ensure DOM validity classes update for OnPush components.
                  //
                  // Angular's template-driven forms update `ng-valid`/`ng-invalid` host classes
                  // during change detection. When async validation completes, there may be no
                  // follow-up change detection pass for OnPush hosts, leaving the DOM in a stale
                  // visual state (even though the control status has updated).
                  //
                  // We schedule a detectChanges() on the next microtask to avoid calling it
                  // synchronously inside Angular's own validation pipeline.
                  queueMicrotask(() => {
                    try {
                      this.cdr.detectChanges();
                    } catch {
                      // Fallback: mark for check when immediate detectChanges isn't safe.
                      // This keeps behavior resilient in edge cases.
                      this.cdr.markForCheck();
                    }
                  });

                  observer.next(out);
                  observer.complete();
                });
              } catch {
                observer.next({ vestInternalError: 'Validation failed' });
                observer.complete();
              }
            })
        ),
        catchError(() => of({ vestInternalError: 'Validation failed' })),
        take(1)
      );
    };
  }

  /**
   * Set up validation config reactively using v2 pattern with toObservable + switchMap.
   * This provides automatic cleanup when config changes.
   */
  #setupValidationConfig(): void {
    const form = this.ngForm.form;
    toObservable(this.validationConfig)
      .pipe(
        distinctUntilChanged(),
        switchMap((config) => {
          // Cast to the expected type for the helper method
          const typedConfig = config as
            | ValidationConfigMap<T>
            | null
            | undefined;
          return this.#createValidationStreams(form, typedConfig);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /**
   * Creates validation streams for the provided configuration.
   * Returns EMPTY if config is null/undefined, otherwise merges all trigger field streams.
   *
   * @param form - The NgForm instance
   * @param config - The validation configuration mapping trigger fields to dependent fields
   * @returns Observable that emits when any trigger field changes and dependent fields need validation
   */
  #createValidationStreams(
    form: FormGroup,
    config: ValidationConfigMap<T> | null | undefined
  ): Observable<unknown> {
    if (!config) {
      this.validationInProgress.clear();
      return EMPTY;
    }

    const streams = Object.keys(config).map((triggerField) => {
      const dependents =
        (config as Record<string, string[]>)[triggerField] || [];
      return this.#createTriggerStream(form, triggerField, dependents);
    });

    return streams.length > 0 ? rxMerge(...streams) : EMPTY;
  }

  /**
   * Creates a stream for a single trigger field that revalidates its dependent fields.
   *
   * This method handles:
   * 1. Waiting for the trigger control to exist in the form (for @if scenarios)
   * 2. Listening to value changes with debouncing
   * 3. Waiting for form to be idle before triggering dependents
   * 4. Waiting for all dependent controls to exist
   * 5. Updating dependent field validity with loop prevention
   * 6. Touch state propagation from trigger to dependents
   *
   * @param form - The NgForm instance
   * @param triggerField - Field path that triggers validation (e.g., 'password')
   * @param dependents - Array of dependent field paths to revalidate (e.g., ['confirmPassword'])
   * @returns Observable that completes after dependent fields are validated
   */
  #createTriggerStream(
    form: FormGroup,
    triggerField: string,
    dependents: string[]
  ): Observable<unknown> {
    // Wait for trigger control to exist, then stop listening (take(1) prevents feedback loops)
    const triggerControl$ = form.statusChanges.pipe(
      startWith(form.status),
      map(() => form.get(triggerField)),
      filter((c): c is AbstractControl => !!c),
      // CRITICAL: take(1) to stop listening after control is found
      // Without this, the pipeline continues to listen to statusChanges,
      // creating a feedback loop where validation triggers re-trigger the pipeline
      take(1)
    );

    return triggerControl$.pipe(
      switchMap((control) => {
        return control.valueChanges.pipe(
          // CRITICAL: Filter out changes when this field is being validated by another field's config
          // This prevents circular triggers in bidirectional validationConfig
          filter(() => !this.validationInProgress.has(triggerField)),
          debounceTime(this.configDebounceTime),
          switchMap(() => {
            return this.#waitForFormIdle(form, control);
          }),
          switchMap(() =>
            this.#waitForDependentControls(form, dependents, control)
          ),
          tap(() =>
            this.#updateDependentFields(form, control, triggerField, dependents)
          )
        );
      })
    );
  }

  /**
   * Waits for the form to reach a non-PENDING state before proceeding.
   * This prevents validation race conditions where dependent field validation
   * triggers while the trigger field's validation is still running.
   *
   * If the form stays PENDING for longer than 2 seconds (e.g., slow async validators),
   * proceeds anyway to prevent blocking the validation pipeline.
   *
   * @param form - The NgForm instance
   * @param control - The trigger control to pass through
   * @returns Observable that emits the control once form is idle or timeout
   */
  #waitForFormIdle(
    form: FormGroup,
    control: AbstractControl
  ): Observable<AbstractControl> {
    // If form is already non-PENDING, return immediately
    if (form.status !== 'PENDING') {
      return of(control);
    }

    // Form is PENDING, wait for it to become idle

    const idle$ = form.statusChanges.pipe(
      filter((s) => s !== 'PENDING'),
      take(1)
    );

    const timeout$ = timer(2000);

    return race(idle$, timeout$).pipe(map(() => control));
  }

  /**
   * Waits for all dependent controls to exist in the form.
   * This handles @if scenarios where controls are conditionally rendered.
   *
   * @param form - The NgForm instance
   * @param dependents - Array of dependent field paths
   * @param control - The trigger control to pass through
   * @returns Observable that emits the control once all dependents exist
   */
  #waitForDependentControls(
    form: FormGroup,
    dependents: string[],
    control: AbstractControl
  ): Observable<AbstractControl> {
    const allDependentsExist = dependents.every(
      (depField) => !!form.get(depField)
    );

    if (allDependentsExist) {
      return of(control);
    }

    // Wait for dependent controls to be added to the form
    return form.statusChanges.pipe(
      startWith(form.status),
      filter(() => dependents.every((depField) => !!form.get(depField))),
      take(1),
      map(() => control)
    );
  }

  /**
   * Updates validation for all dependent fields.
   *
   * Handles:
   * - Touch state propagation (mark dependents touched when trigger is touched)
   * - Loop prevention via validationInProgress set
   * - Silent validation (emitEvent: false) to prevent feedback loops
   *
   * @param form - The NgForm instance
   * @param control - The trigger control
   * @param triggerField - Field path of the trigger
   * @param dependents - Array of dependent field paths to update
   */
  #updateDependentFields(
    form: FormGroup,
    control: AbstractControl,
    triggerField: string,
    dependents: string[]
  ): void {
    // Mark trigger field as in-progress to prevent it from being re-triggered
    this.validationInProgress.add(triggerField);

    for (const depField of dependents) {
      const dependentControl = form.get(depField);
      if (!dependentControl) {
        continue;
      }

      // Only validate if not already in progress (prevents bidirectional loops)
      if (!this.validationInProgress.has(depField)) {
        // CRITICAL: Mark the dependent field as in-progress BEFORE calling updateValueAndValidity
        // This prevents the dependent field's valueChanges from triggering its own validationConfig
        this.validationInProgress.add(depField);

        // NOTE: Touch propagation removed (PR #XXX)
        // Previously, we propagated touch state from trigger to dependent fields.
        // This caused UX issues where dependent fields showed errors immediately
        // after being revealed by a toggle, even though the user never interacted with them.
        //
        // With this change:
        // - Errors on dependent fields only show after the user directly touches/blurs them
        // - ARIA attributes (aria-invalid) still work correctly via isInvalid check
        // - Warnings still show after validation via hasBeenValidated check
        //
        // The removed code was:
        // if (control.touched && !dependentControl.touched) {
        //   dependentControl.markAsTouched({ onlySelf: true });
        // }

        // emitEvent: true is REQUIRED for async validators to actually run
        // The validationInProgress Set prevents infinite loops:
        // 1. Field A changes → triggers validation on dependent field B
        // 2. B is added to validationInProgress Set
        // 3. B's statusChanges emits → #handleValueChange checks validationInProgress
        // 4. Since B is in validationInProgress, its validationConfig is not triggered
        // 5. After 500ms timeout, B is removed from validationInProgress
        // This way:
        // - Async validators CAN run (emitEvent: true)
        // - BUT circular triggers are prevented (validationInProgress check)
        dependentControl.updateValueAndValidity({
          onlySelf: true,
          emitEvent: true, // Changed from false - REQUIRED for validators to run!
        });

        // CRITICAL: Force immediate change detection for OnPush components
        // updateValueAndValidity updates the control's status, but doesn't automatically
        // trigger change detection. Components using OnPush won't see the ng-invalid class
        // update in the DOM without this. Using detectChanges() instead of markForCheck()
        // to force immediate synchronous update rather than waiting for next CD cycle.
        this.cdr.detectChanges();
      }
    }

    // Keep fields marked as in-progress for a short time to prevent immediate re-triggering
    // Use setTimeout to ensure async validators have time to complete before allowing new triggers
    setTimeout(() => {
      this.validationInProgress.delete(triggerField);
      for (const depField of dependents) {
        this.validationInProgress.delete(depField);
      }
    }, VALIDATION_IN_PROGRESS_TIMEOUT_MS);
  }
}
