import {
  ChangeDetectorRef,
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  InputSignal,
  isDevMode,
  linkedSignal,
  output,
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
  NgForm,
  PristineChangeEvent,
  StatusChangeEvent,
  ValueChangeEvent,
} from '@angular/forms';
import {
  catchError,
  distinctUntilChanged,
  filter,
  map,
  of,
  merge as rxMerge,
  scan,
  startWith,
  switchMap,
  take,
} from 'rxjs';
import { logWarning, NGX_VEST_FORMS_ERRORS } from '../errors/error-catalog';
import { NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN } from '../tokens/debounce.token';
import { NGX_EQUALITY_FN } from '../tokens/equality.token';
import type { NgxDeepRequired } from '../utils/deep-required';
import { scheduleMicrotask } from '../utils/destroy-scheduler';
import type { ValidationConfigMap } from '../utils/field-path-types';
import { collectTouchedPaths } from '../utils/collect-touched-paths';
import {
  createValidationConfigPipeline,
  type ValidationConfigPipelineOptions,
} from '../utils/validation-config-pipeline';
import {
  DEFAULT_FOCUS_SELECTOR,
  DEFAULT_INVALID_SELECTOR,
  type NgxFirstInvalidOptions,
  openCollapsedDetailsAncestors,
  resolveFirstInvalidElement,
  resolveFirstInvalidFocusTarget,
  resolveFirstInvalidScrollBehavior,
} from '../utils/first-invalid.utils';
import { NgxFormState } from '../utils/form-state.utils';
import {
  getAllFormErrors,
  mergeValuesAndRawValues,
  setValueAtPath,
} from '../utils/form-utils';
import { validateShape } from '../utils/shape-validation';
import type { NgxVestSuite } from '../utils/validation-suite';
import {
  readElementValueForBlur,
  resolveFieldFromBlur,
} from './field-path-resolver';
import {
  extractFieldErrors,
  extractFieldWarnings,
  runFieldValidation,
} from '../utils/vest-runner';
import {
  getFormSubmittedSignal,
  setAngularFormSubmittedState,
} from './form-submitted-state';
import { ValidationOptions } from './validation-options';

/**
 * Timing options passed to the validation-config pipeline.
 * These are the concrete values for the named knobs defined in
 * {@link ValidationConfigPipelineOptions}.
 */
const PIPELINE_OPTIONS = {
  idleWaitTimeoutMs: 2000,
  dependentExistenceTimeoutMs: 2000,
  validationInProgressCooldownMs: 500,
} as const satisfies Omit<ValidationConfigPipelineOptions, 'configDebounceTime'>;

/**
 * Type for validation configuration that accepts both the typed and untyped versions.
 * This ensures backward compatibility while supporting the new typed API.
 */
export type NgxValidationConfig<T = unknown> =
  | Record<string, string[]>
  | ValidationConfigMap<T>
  | null;

/**
 * Payload emitted when a named control inside the form loses focus.
 *
 * This is intentionally low-level so app code can build workflows such as
 * draft auto-save, analytics, or blur-driven side effects without the form
 * library taking ownership of persistence behavior.
 *
 * It is not intended as a blur-time workaround for dependent field validation;
 * for that pattern, prefer `validationConfig` plus each target field's own
 * `errorDisplayMode`.
 *
 * The emitted `field` is the full dotted control path (e.g.
 * `passwords.confirm`, `businessHours.values.0.from`) regardless of whether
 * the surrounding groups use static `ngModelGroup="key"` or dynamic
 * `[ngModelGroup]="expr"` bindings, because the path is read from the live
 * `NgModel` directive registered with the form.
 *
 * @publicApi
 */
export type NgxFieldBlurEvent<T = unknown> = {
  field: string;
  value: unknown;
  formValue: T | null;
  dirty: boolean;
  touched: boolean;
  valid: boolean;
  pending: boolean;
};

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
  selector: 'form[ngxVestForm]',
  exportAs: 'ngxVestForm',
  host: {
    '(focusout)': 'onFormFocusOut($event)',
  },
})
export class FormDirective<T extends Record<string, unknown>> {
  readonly ngForm = inject(NgForm, { self: true });
  readonly #destroyRef = inject(DestroyRef);
  readonly #cdr = inject(ChangeDetectorRef);
  readonly #elementRef = inject<ElementRef<HTMLFormElement>>(ElementRef);
  readonly #configDebounceTime = inject(
    NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN
  );
  /**
   * Deep-equality comparator. Defaults to `fastDeepEqual`; can be overridden
   * application-wide or per-component via {@link NGX_EQUALITY_FN}.
   */
  readonly #equal = inject(NGX_EQUALITY_FN);

  /**
   * Public signal storing field warnings keyed by field path.
   * This allows warnings to be stored and displayed without affecting field validity.
   * Angular's control.errors !== null marks a field as invalid, so we store warnings
   * separately when they exist without errors.
   */
  readonly fieldWarnings = signal<Map<string, readonly string[]>>(new Map());

  #lastSyncedFormValue: T | null = null;
  #lastSyncedModelValue: T | null = null;

  // Internal signal tracking changes that can affect the merged form snapshot.
  // ValueChangeEvent keeps the cache fresh for blur-driven consumers like
  // draft auto-save, even when a value update doesn't change form validity.
  readonly #formSnapshotTick = toSignal(
    this.ngForm.form.events.pipe(
      filter(
        (event) =>
          event instanceof ValueChangeEvent ||
          event instanceof StatusChangeEvent
      ),
      scan((count) => count + 1, 0),
      startWith(0)
    ),
    { initialValue: 0 }
  );

  /**
   * LinkedSignal that computes form values from Angular form state.
   * This eliminates timing issues with the previous dual-effect pattern.
   */
  readonly #formValueSignal = linkedSignal(() => {
    // Track changes that affect the merged form snapshot.
    this.#formSnapshotTick();
    if (Object.keys(this.ngForm.form.controls).length === 0) {
      // No controls remain (e.g. dynamic group removal): expose `null` so
      // consumers don't see ghost data from a previous form shape.
      return null;
    }
    return mergeValuesAndRawValues<T>(this.ngForm.form);
  });

  /**
   * Track the Angular form status as a signal for advanced status flags
   */
  readonly #statusSignal = toSignal(
    this.ngForm.form.statusChanges.pipe(startWith(this.ngForm.form.status)),
    { initialValue: this.ngForm.form.status }
  );

  /**
   * Reactive status helpers for template consumption without reaching into `ngForm.form`.
   * These stay aligned with Angular's form status lifecycle, including async validation.
   *
   * @publicApi
   */
  readonly status = computed(() => this.#statusSignal());
  readonly pending = computed(() => this.status() === 'PENDING');
  readonly valid = computed(() => this.status() === 'VALID');
  readonly invalid = computed(() => this.status() === 'INVALID');

  /**
   * Reactive counter incremented on any focusout within the form.
   * This guarantees recomputation for every blur/tab interaction,
   * even when the form's aggregate touched flag is already true.
   */
  readonly #blurTick = signal(0);

  /**
   * Computed signal that returns field paths for all touched (or submitted) leaf controls.
   * Updates reactively when controls are touched (blur) or when form status changes.
   *
   * This enables consumers to determine which fields the user has interacted with,
   * useful for filtering errors/warnings to match the form's visible validation state.
   *
   * @publicApi
   */
  readonly touchedFieldPaths = computed(() => {
    this.#blurTick();
    this.#statusSignal();
    return collectTouchedPaths(this.ngForm.form, this.ngForm.submitted);
  });

  /**
   * Alias for `touchedFieldPaths` using wording that better matches validation UIs.
   * Returns the field paths that have been validated for display purposes.
   *
   * @publicApi
   */
  readonly validatedFields = this.touchedFieldPaths;

  /**
   * Computed signal for form state with validity and errors.
   * Used by templates and tests as vestForm.formState().valid/errors
   *
   * Uses custom equality function to prevent unnecessary recalculations
   * when form status changes but actual values/errors remain the same.
   */
  readonly formState = computed<NgxFormState<T>>(
    () => {
      // Tie to validation feedback instead of aggregate status so errors update
      // even when the root form remains INVALID -> INVALID.
      this.#validationFeedbackTick();
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
          this.#equal(a.errors, b.errors) &&
          this.#equal(a.value, b.value)
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
   * Use `suite.only(field).run(model)` when you need field-focused validation.
   */
  readonly suite = input<NgxVestSuite<T> | null>(null);

  /**
   * The shape of our form model. This is a deep required version of the form model
   * The goal is to add default values to the shape so when the template-driven form
   * contains values that shouldn't be there (typo's) that the developer gets run-time
   * errors in dev mode
   */
  readonly formShape = input<NgxDeepRequired<T> | null>(null);

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

  /**
   * Emits whenever validation feedback may have changed, even if the aggregate
   * root form status string stays the same.
   */
  readonly #validationFeedback$ = rxMerge(
    this.ngForm.form.events.pipe(
      filter((v) => v instanceof StatusChangeEvent),
      map((v) => (v as StatusChangeEvent).status),
      filter((v) => v !== 'PENDING')
    ),
    this.ngForm.ngSubmit.pipe(
      switchMap(() => {
        if (this.ngForm.form.status === 'PENDING') {
          return this.ngForm.form.statusChanges.pipe(
            filter((status) => status !== 'PENDING'),
            take(1)
          );
        }

        return of(this.ngForm.form.status);
      })
    )
  );

  /**
   * Counter signal tied to validation feedback updates so `formState()` can
   * recompute whenever the underlying error set changes.
   */
  readonly #validationFeedbackTick = toSignal(
    this.#validationFeedback$.pipe(
      scan((count) => count + 1, 0),
      startWith(0)
    ),
    { initialValue: 0 }
  );

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
        return this.#equal(prev, curr);
      }),
      map(() => mergeValuesAndRawValues<T>(this.ngForm.form)),
      takeUntilDestroyed(this.#destroyRef)
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
    this.#validationFeedback$.pipe(
      map(() => getAllFormErrors(this.ngForm.form)),
      takeUntilDestroyed(this.#destroyRef)
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
      takeUntilDestroyed(this.#destroyRef)
    )
  );

  /**
   * Fired when the status of the root form changes.
   */
  readonly #statusChanges$ = this.ngForm.form.statusChanges.pipe(
    startWith(this.ngForm.form.status),
    distinctUntilChanged()
  );

  /**
   * Triggered When the form becomes valid but waits until the form is idle
   *
   * Cleanup is handled automatically by the directive when it's destroyed.
   */
  readonly validChange = outputFromObservable(
    this.#statusChanges$.pipe(
      filter((e) => e === 'VALID' || e === 'INVALID'),
      map((v) => v === 'VALID'),
      distinctUntilChanged(),
      takeUntilDestroyed(this.#destroyRef)
    )
  );

  /**
   * Emits when a named control inside the form loses focus.
   *
   * Useful for application-level workflows such as draft auto-save on blur.
   */
  readonly fieldBlur = output<NgxFieldBlurEvent<T>>();

  constructor() {
    this.#destroyRef.onDestroy(() => {
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
          validateShape(v, this.formShape() as NgxDeepRequired<T>);
        }
      });
    }

    /**
     * Mark all the fields as touched when the form is submitted
     */
    this.ngForm.ngSubmit
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe(() => {
        this.ngForm.form.markAllAsTouched();
        this.#blurTick.update((v) => v + 1);
      });

    this.ngForm.ngSubmit
      .pipe(
        switchMap(() => {
          if (this.ngForm.form.status === 'PENDING') {
            return this.ngForm.form.statusChanges.pipe(
              filter((status) => status !== 'PENDING'),
              take(1)
            );
          }

          return of(this.ngForm.form.status);
        }),
        takeUntilDestroyed(this.#destroyRef)
      )
      .subscribe(() => {
        this.#focusFirstInvalidField();
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
      const formChanged = !this.#equal(formValue, this.#lastSyncedFormValue);
      const modelChanged = !this.#equal(modelValue, this.#lastSyncedModelValue);

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
            // - patchValue ignores missing controls/keys, which is compatible with NgxDeepPartial form models.
            // - emitEvent:false prevents feedback loops; validation still updates internally.
            this.ngForm.form.patchValue(modelValue, { emitEvent: false });
          }
          this.#lastSyncedFormValue = modelValue;
          this.#lastSyncedModelValue = modelValue;
        });
      } else if (formChanged && modelChanged) {
        // Both form and model changed simultaneously
        // Check if they changed to the same value (synchronized change) or different values (conflict)
        const valuesEqual = this.#equal(formValue, modelValue);

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

    // Compose the validation-config pipeline.  Switching on every config change
    // automatically tears down the previous pipeline instance (and its fresh
    // validationInProgress Set) before creating the new one.
    const form = this.ngForm.form;
    toObservable(this.validationConfig)
      .pipe(
        distinctUntilChanged(),
        switchMap((config) =>
          createValidationConfigPipeline(
            form,
            config as ValidationConfigMap<T> | null | undefined,
            {
              configDebounceTime: this.#configDebounceTime,
              ...PIPELINE_OPTIONS,
            },
            this.#cdr,
            this.#destroyRef
          )
        ),
        takeUntilDestroyed(this.#destroyRef)
      )
      .subscribe();
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
    this.#blurTick.update((v) => v + 1);
  }

  /**
   * Clears the current submit cycle without resetting control values or metadata.
   *
   * Unlike {@link resetForm}, this only flips the submitted gate back to `false`.
   * Touched/dirty/pristine state is preserved so consumers can end `'on-submit'`
   * error visibility without a full form reset.
   *
   * **When to use:**
   * - You use submit-gated error visibility such as `'on-submit'`
   * - A submit attempt already happened
   * - The user resolved the current submit-time errors
   * - You want future untouched fields to wait for the next submit before showing errors
   *
   * **Why this exists:**
   * `resetForm()` would also clear touched/dirty/pristine metadata, which is often
   * too disruptive for long-form, multi-form, or mixed error-display flows.
   *
   * **What it does NOT do:**
   * - Does not change field values
   * - Does not mark controls pristine or untouched
   * - Does not re-run validation
   *
   * @example
   * ```typescript
   * submitAll(): void {
   *   for (const form of this.submitForms()) {
   *     form.ngForm.onSubmit(new Event('submit'));
   *   }
   *
   *   if (this.submitForms().every((form) => form.formState().valid)) {
   *     for (const form of this.submitForms()) {
   *       form.clearSubmittedState();
   *     }
   *   }
   * }
   * ```
   *
   * @see {@link resetForm} to fully reset values and control metadata
   * @see {@link markAllAsTouched} to manually show all errors
   * @see {@link triggerFormValidation} to re-run validation after structure changes
   */
  clearSubmittedState(): void {
    setAngularFormSubmittedState(this.ngForm, false);
    getFormSubmittedSignal(this.ngForm).set(false);
    this.#blurTick.update((v) => v + 1);
  }

  /**
   * Finds the first invalid element in this form, scrolls it into view, and focuses it.
   *
   * Useful in custom submit flows where `markAllAsTouched()` is triggered externally
   * and the app then wants to guide keyboard and assistive-technology users to the
   * first failing field.
   *
   * @returns The focused element when a focusable target exists, otherwise the first
   *          matched invalid element. Returns `null` when no invalid element is found.
   */
  focusFirstInvalidControl(
    options: NgxFirstInvalidOptions = {}
  ): HTMLElement | null {
    const {
      block = 'center',
      inline = 'nearest',
      focus = true,
      preventScrollOnFocus = true,
      openCollapsedParents = true,
      invalidSelector = DEFAULT_INVALID_SELECTOR,
      focusSelector = DEFAULT_FOCUS_SELECTOR,
    } = options;
    const behavior = resolveFirstInvalidScrollBehavior(options.behavior);

    const root: HTMLFormElement = this.#elementRef.nativeElement;
    const firstInvalid = resolveFirstInvalidElement(root, invalidSelector);
    if (!firstInvalid) {
      return null;
    }

    if (openCollapsedParents) {
      openCollapsedDetailsAncestors(root, firstInvalid);
    }

    const focusTarget = resolveFirstInvalidFocusTarget(
      firstInvalid,
      focusSelector
    );

    const scrollTarget = focusTarget ?? firstInvalid;
    scrollTarget.scrollIntoView({ behavior, block, inline });

    if (focus && focusTarget) {
      focusTarget.focus({ preventScroll: preventScrollOnFocus });
    }

    return focusTarget ?? firstInvalid;
  }

  /**
   * Finds and scrolls the first invalid element into view without moving focus.
   *
   * @returns The resolved element, or `null` when no invalid element is found.
   */
  scrollToFirstInvalidControl(
    options: NgxFirstInvalidOptions = {}
  ): HTMLElement | null {
    return this.focusFirstInvalidControl({
      ...options,
      focus: false,
    });
  }

  /**
   * Host handler: called whenever any descendant field loses focus.
   * Used to make touched-path tracking react immediately on blur/tab.
   */
  onFormFocusOut(event: FocusEvent): void {
    // Run on the next microtask to ensure Angular has already applied
    // control.touched changes for the field that just blurred.
    scheduleMicrotask(() => {
      this.#blurTick.update((v) => v + 1);
      this.#emitFieldBlurEvent(event);
    }, this.#destroyRef);
  }

  #emitFieldBlurEvent(event: FocusEvent): void {
    const resolved = this.#resolveFieldFromFocusEvent(event);
    if (!resolved) {
      return;
    }
    const { field, control, element } = resolved;

    // Read the latest value directly from the DOM element when it can be
    // trusted. For radio groups Angular keeps the bound `control.value` in
    // sync with the *selected* option, while a focused-but-unchecked radio
    // would expose its own option value via the DOM — so radios must always
    // fall back to `control.value`. For text/textarea/select we prefer the
    // element value to avoid `ngModelOptions.updateOn: 'submit'` staleness.
    const domValue = readElementValueForBlur(element);
    const value = domValue !== undefined ? domValue : control.value;

    // Prefer the cached linked-signal snapshot when it exists. Both code
    // paths produce a deep-cloned snapshot, but reusing the cached value
    // saves one of the two `structuredClone` passes performed by
    // `mergeValuesAndRawValues()` on every blur.
    const cachedSnapshot = this.#formValueSignal();
    const formValue =
      cachedSnapshot !== null
        ? (structuredClone(cachedSnapshot) as T)
        : mergeValuesAndRawValues<T>(this.ngForm.form);
    setValueAtPath(formValue as object, field, value);

    this.fieldBlur.emit({
      field,
      value,
      formValue,
      dirty: control.dirty,
      touched: control.touched,
      valid: control.valid,
      pending: control.pending,
    });
  }

  #resolveFieldFromFocusEvent(event: FocusEvent): {
    field: string;
    control: AbstractControl;
    element: HTMLElement;
  } | null {
    return resolveFieldFromBlur(this.ngForm, event.target);
  }

  /**
   * Moves keyboard focus to the first invalid, visible form control after submit.
   * This keeps error recovery predictable for keyboard and assistive-technology users.
   */
  #focusFirstInvalidField(): void {
    if (this.ngForm.form.valid) {
      return;
    }

    const focusFirstInvalid = () => {
      const form = this.#elementRef.nativeElement;
      const candidates = Array.from(
        form.querySelectorAll<HTMLElement>(
          [
            '[aria-invalid="true"]:not([disabled]):not([type="hidden"])',
            'input.ng-invalid:not([disabled]):not([type="hidden"])',
            'select.ng-invalid:not([disabled])',
            'textarea.ng-invalid:not([disabled])',
          ].join(', ')
        )
      );

      const firstInvalid = candidates.find((candidate) => {
        if (candidate.getAttribute('aria-hidden') === 'true') {
          return false;
        }

        return candidate.getClientRects().length > 0;
      });

      if (!firstInvalid) {
        return;
      }

      firstInvalid.focus({ preventScroll: true });
      firstInvalid.scrollIntoView?.({
        block: 'center',
        inline: 'nearest',
      });
    };

    if (typeof globalThis.requestAnimationFrame === 'function') {
      globalThis.requestAnimationFrame(() => {
        focusFirstInvalid();
      });
      return;
    }

    queueMicrotask(() => {
      focusFirstInvalid();
    });
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

    // Vest 6: reset the suite's accumulated validation state.
    // Since we use stateful suite.only(field).run() (not runStatic), the suite
    // accumulates results across runs. Resetting clears all persisted errors/warnings
    // so the form starts fresh.
    this.suite()?.reset();

    // Clear any stored warnings to avoid stale messages after reset
    this.fieldWarnings.set(new Map());

    // Clear the bidirectional sync tracking state so the next formValue change
    // is treated as a model change (not a conflict with stale form values)
    this.#lastSyncedFormValue = null;
    this.#lastSyncedModelValue = null;

    // Force change detection to ensure DOM updates are reflected
    // Note: This is still needed even with signals because we're modifying NgForm
    // (reactive forms), not signals. The formValue signal updates happen in the
    // consumer component. detectChanges() ensures NgForm's reset is reflected in
    // the DOM before we update validity.
    this.#cdr.detectChanges();

    // Trigger validation update to clear any stale errors
    // Now synchronous since detectChanges() has flushed DOM updates
    this.ngForm.form.updateValueAndValidity({ emitEvent: true });
    this.#blurTick.update((v) => v + 1);
  }

  /**
   * Resets validation state for a specific field in the Vest suite.
   *
   * This clears all accumulated errors and warnings for the given field
   * without affecting other fields. Useful when a field's value is
   * programmatically reset or cleared.
   *
   * **What it does:**
   * 1. Calls Vest 6's `suite.resetField(field)` to clear accumulated validation state
   * 2. Clears any stored warnings for the field
   * 3. Resets the Angular control to clear validation errors
   *
   * **When to use:**
   * - Resetting individual field values programmatically
   * - Clearing validation after a field's context changes (e.g., toggling a feature)
   * - When you need per-field reset instead of full form reset
   *
   * @param field - The field path to reset (e.g., 'email' or 'addresses.billing.street')
   *
   * @example
   * ```typescript
   * vestForm = viewChild.required('vestForm', { read: FormDirective });
   *
   * clearEmail(): void {
   *   this.formValue.update(v => ({ ...v, email: '' }));
   *   this.vestForm().resetField('email');
   * }
   * ```
   *
   * @see {@link resetForm} for resetting the entire form
   * @see {@link removeField} for permanently removing a field from validation state
   */
  resetField(field: string): void {
    this.suite()?.resetField(field);

    // Clear warnings for this field
    this.fieldWarnings.update((map) => {
      const newMap = new Map(map);
      newMap.delete(field);
      return newMap;
    });

    // Reset Angular control validation state
    const control = this.ngForm.form.get(field);
    if (control) {
      control.updateValueAndValidity({ emitEvent: true });
      this.#blurTick.update((v) => v + 1);
    }
  }

  /**
   * Removes a field from the Vest suite's accumulated validation state.
   *
   * This permanently removes all validation history for the given field,
   * including errors, warnings, and test results. Unlike `resetField()`,
   * `remove()` is intended for fields that are being destroyed (e.g.,
   * conditionally hidden via `@if`).
   *
   * **What it does:**
   * 1. Calls Vest 6's `suite.remove(field)` to purge all test history for the field
   * 2. Clears any stored warnings for the field
   *
   * **Why this matters:**
   * Vest 6 suites are stateful — `suite.only(field).run()` accumulates results.
   * When a form control is destroyed (e.g., hidden by `@if`), the suite still holds
   * stale results for that field. This can cause incorrect form-level validity
   * or ghost errors. Calling `removeField()` cleans up this stale state.
   *
   * **When to use:**
   * - Dynamic form controls removed from the DOM (e.g., `@if` toggling sections)
   * - Removing fields from a form array
   * - Any scenario where a field no longer exists in the form
   *
   * @param field - The field path to remove (e.g., 'email' or 'addresses.shipping.street')
   *
   * @example
   * ```typescript
   * vestForm = viewChild.required('vestForm', { read: FormDirective });
   *
   * onToggleShipping(enabled: boolean): void {
   *   if (!enabled) {
   *     // Clean up Vest state for removed shipping fields
   *     this.vestForm().removeField('addresses.shipping.street');
   *     this.vestForm().removeField('addresses.shipping.city');
   *   }
   * }
   * ```
   *
   * @see {@link resetField} for resetting a field without removing it
   * @see {@link resetForm} for resetting the entire form
   */
  removeField(field: string): void {
    this.suite()?.remove(field);

    // Clear warnings for this field
    this.fieldWarnings.update((map) => {
      const newMap = new Map(map);
      newMap.delete(field);
      return newMap;
    });
  }

  /**
   * Creates a one-shot async validator function for a specific field path.
   *
   * The returned validator:
   * - snapshots the current form model,
   * - injects the candidate control value at `field`,
   * - runs the Vest suite with debouncing,
   * - maps Vest errors/warnings into Angular `ValidationErrors | null`.
   *
   * Warnings are stored in `fieldWarnings` to keep warnings non-blocking when no errors exist.
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

      return runFieldValidation(
        suite,
        { only: field },
        snapshot,
        validationOptions,
        this.#destroyRef
      ).pipe(
        map((result) => {
          const warnings = extractFieldWarnings(result, field);

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

          const out = extractFieldErrors(result, field);

          // CRITICAL: Ensure DOM validity classes update for OnPush components.
          //
          // Angular's template-driven forms update `ng-valid`/`ng-invalid` host classes
          // during change detection. When async validation completes, there may be no
          // follow-up change detection pass for OnPush hosts, leaving the DOM in a stale
          // visual state (even though the control status has updated).
          //
          // We schedule a detectChanges() on the next microtask to avoid calling it
          // synchronously inside Angular's own validation pipeline. The scheduleMicrotask
          // primitive auto-cancels if the directive is destroyed before it fires.
          scheduleMicrotask(() => {
            try {
              this.#cdr.detectChanges();
            } catch {
              // Fallback: mark for check when immediate detectChanges isn't safe.
              // This keeps behavior resilient in edge cases.
              this.#cdr.markForCheck();
            }
          }, this.#destroyRef);

          return out;
        }),
        // `runFieldValidation` already applies `take(1)` and `takeUntilDestroyed`,
        // so no additional terminal operators are needed here.
        catchError(() => of({ vestInternalError: 'Validation failed' }))
      );
    };
  }

}
