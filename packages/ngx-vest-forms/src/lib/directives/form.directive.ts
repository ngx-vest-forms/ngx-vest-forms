import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectorRef,
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  ErrorHandler,
  inject,
  Injector,
  input,
  InputSignal,
  isDevMode,
  output,
  signal,
  untracked,
} from '@angular/core';
import {
  outputFromObservable,
  takeUntilDestroyed,
  toSignal,
} from '@angular/core/rxjs-interop';
import {
  AsyncValidatorFn,
  NgForm,
  PristineChangeEvent,
  StatusChangeEvent,
} from '@angular/forms';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import {
  distinctUntilChanged,
  filter,
  map,
  of,
  merge as rxMerge,
  scan,
  startWith,
} from 'rxjs';
import { logWarning, NGX_VEST_FORMS_ERRORS } from '../errors/error-catalog';
import { NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN } from '../tokens/debounce.token';
import { NGX_EQUALITY_FN } from '../tokens/equality.token';
import {
  NGX_FORM_CONTRACT,
  type NgxFormContractSource,
  readFormContract,
} from '../tokens/form-contract.token';
import { collectTouchedPaths } from '../utils/collect-touched-paths';
import type { NgxDeepRequired } from '../utils/deep-required';
import { scheduleMicrotask } from '../utils/destroy-scheduler';
import {
  DEFAULT_FOCUS_SELECTOR,
  DEFAULT_INVALID_SELECTOR,
  type NgxFirstInvalidOptions,
  openCollapsedDetailsAncestors,
  resolveFirstInvalidElement,
  resolveFirstInvalidFocusTarget,
  resolveFirstInvalidScrollBehavior,
} from '../utils/first-invalid.utils';
import { validateFormContract } from '../utils/form-contract';
import { NgxFormState } from '../utils/form-state.utils';
import {
  getAllFormErrors,
  mergeValuesAndRawValues,
  setValueAtPath,
} from '../utils/form-utils';
import type { NgxVestSuite } from '../utils/validation-suite';
import {
  readElementValueForBlur,
  resolveFieldFromBlur,
} from './field-path-resolver';
import { createFieldValidator, setFieldWarnings } from './field-validator';
import type {
  NgxFieldBlurEvent,
  NgxSubmitSettledEvent,
  NgxValidationConfig,
  NgxValidationFocus,
} from './form-directive.types';
import {
  getFormSubmittedSignal,
  runSubmitValidation,
  setAngularFormSubmittedState,
} from './form-submitted-state';
import { formValueChanges } from './form-value-changes';
import { FormValueSnapshot } from './form-value-snapshot';
import { ModelFormSync } from './model-form-sync';
import {
  connectValidationConfig,
  revalidateOnSuiteChange,
} from './revalidation-triggers';
import { submitOutcomes } from './submit-pipeline';
import { ValidationOptions } from './validation-options';
import { notifyValidationReset } from './validation-reset';

export type {
  NgxFieldBlurEvent,
  NgxSubmitSettledEvent,
  NgxValidationConfig,
  NgxValidationFocus,
} from './form-directive.types';

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
  readonly #injector = inject(Injector);
  readonly #errorHandler = inject(ErrorHandler);
  readonly #elementRef = inject<ElementRef<HTMLFormElement>>(ElementRef);
  readonly #configDebounceTime = inject(NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN);
  readonly #injectedFormContract = inject(NGX_FORM_CONTRACT, {
    optional: true,
  });
  /**
   * Deep-equality comparator. Defaults to `fastDeepEqual`; can be overridden
   * application-wide or per-component via {@link NGX_EQUALITY_FN}.
   */
  readonly #equal = inject(NGX_EQUALITY_FN);

  /**
   * The merged form value as a signal, and the memoized `#equal` that
   * compares snapshots and models. Created here, before any other
   * subscription to `ngForm.form.events`, so its tick is current when the
   * `formValueChange` pipeline reads the snapshot.
   */
  readonly #snapshot = new FormValueSnapshot<T>(this.ngForm.form, this.#equal);

  /**
   * Public signal storing field warnings keyed by field path.
   * This allows warnings to be stored and displayed without affecting field validity.
   * Angular's control.errors !== null marks a field as invalid, so we store warnings
   * separately when they exist without errors.
   */
  readonly fieldWarnings = signal<Map<string, readonly string[]>>(new Map());

  /**
   * Two-way sync between the `formValue` input and the form controls (the
   * "model wins" / "form wins" decisions and their baselines).
   */
  readonly #modelSync = new ModelFormSync<T>(this.ngForm.form, this.#snapshot);

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
  readonly status = this.#statusSignal;
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
        errors: getAllFormErrors(this.ngForm.form).errors,
        value: this.#snapshot.value(),
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
          this.#snapshot.isEqual(a.value, b.value)
        );
      },
    }
  );

  /**
   * The value of the form, this is needed for the validation part.
   * Using input() here because two-way binding is provided via formValueChange output.
   */
  readonly formValue = input<T | null>(null);

  /**
   * Static vest suite that will be used to feed our angular validators.
   * Use `suite.only(field).run(model)` when you need field-focused validation.
   */
  readonly suite = input<NgxVestSuite<NoInfer<T>> | null>(null);

  /**
   * Optional structural contract for the form model. Accepts either:
   * - A {@link StandardSchemaV1} schema (e.g. a Zod schema, or any
   *   spec-compliant validator) — used in dev-mode for typo/structure
   *   warnings via the existing error catalog logger
   * - A legacy "shape" object ({@link NgxDeepRequired}) describing the
   *   expected form structure with default values — internally normalized
   *   via `toFormContract`
   *
   * The contract is a typing carrier and dev-mode lint only; it does not
   * affect runtime form validity (validity comes from the Vest `suite`).
   *
   * When omitted, the directive falls back to any `provideFormContract(...)`
   * provider in scope. Binding `null` disables that fallback explicitly.
   */
  readonly formContract = input<
    StandardSchemaV1<NoInfer<T>> | NgxDeepRequired<T> | null | undefined
  >(undefined);

  readonly #resolvedFormContract = computed<
    StandardSchemaV1<NoInfer<T>> | NgxDeepRequired<T> | null
  >(() => {
    const explicitContract = this.formContract();
    if (explicitContract !== undefined) {
      return explicitContract;
    }

    return readFormContract(
      this.#injectedFormContract as NgxFormContractSource<T> | undefined
    );
  });

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
   */
  readonly validationConfig: InputSignal<NgxValidationConfig<T>> =
    input<NgxValidationConfig<T>>(null);

  /**
   * Optional focus options forwarded to the Vest runner for field validation.
   *
   * Useful for step-based flows where group focus should be applied on top of
   * the field-level `only` focus.
   */
  readonly validationFocus = input<NgxValidationFocus | null>(null);

  /**
   * Whether a failed submit automatically scrolls to and focuses the first
   * invalid control (via {@link focusFirstInvalidControl}).
   *
   * Focus moves after async validation settles and the next render, so a
   * custom control found only through its wrapper's invalid class is focused
   * on the first submit too.
   *
   * Defaults to `true`. Set to `false` when the application manages its own
   * post-submit focus target — for example a WCAG-style error summary with
   * `role="alert"` that receives focus on submit — or when multiple forms are
   * submitted programmatically and viewport jumps are undesirable.
   */
  readonly focusFirstInvalidOnSubmit = input(true, {
    transform: booleanAttribute,
  });

  /**
   * The root status once a submit has settled, one emission per submit. A
   * new submit while one is still waiting replaces it.
   *
   * It starts one microtask after `ngSubmit`, so every synchronous
   * `(ngSubmit)` handler has run first, then revalidates the
   * `validationConfig` dependents. Shared and subscribed in the constructor,
   * so that runs once per submit whether or not `submitSettled` is bound.
   */
  readonly #submitOutcome$ = submitOutcomes(this.ngForm, () =>
    this.validationConfig()
  );

  /**
   * Emits whenever validation feedback may have changed, even if the aggregate
   * root form status string stays the same.
   */
  readonly #validationFeedback$ = rxMerge(
    this.ngForm.form.events.pipe(
      filter((v) => v instanceof StatusChangeEvent),
      map((v) => v.status),
      filter((v) => v !== 'PENDING')
    ),
    this.#submitOutcome$
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

  /**
   * Emits the root form status each time it settles on a non-PENDING value.
   *
   * @deprecated Not used by the library and will be removed in v4. Use the
   * `status`/`pending` signals, or `ngForm.form.statusChanges`.
   */
  readonly idle$ = this.ngForm.form.events.pipe(
    filter((v) => v instanceof StatusChangeEvent),
    map((v) => v.status),
    filter((v) => v !== 'PENDING'),
    distinctUntilChanged()
  );

  /**
   * Triggered as soon as the form value changes
   * It also contains the disabled values (raw values)
   *
   * `outputFromObservable` unsubscribes when the directive is destroyed.
   */
  readonly formValueChange = outputFromObservable(
    formValueChanges(this.ngForm.form, this.#snapshot, this.#modelSync)
  );

  /**
   * Emits an object with all the errors of the form
   * every time a form control or form groups changes its status to valid or invalid
   *
   * Each submit also emits once after the config dependents have revalidated
   * and async validation (including ROOT_FORM) has settled, so that emission
   * includes ROOT_FORM and dependent-field errors.
   *
   * `outputFromObservable` unsubscribes when the directive is destroyed.
   */
  readonly errorsChange = outputFromObservable(
    this.#validationFeedback$.pipe(
      map(() => getAllFormErrors(this.ngForm.form).errors)
    )
  );

  /**
   * Triggered as soon as the form becomes dirty
   *
   * `outputFromObservable` unsubscribes when the directive is destroyed.
   */
  readonly dirtyChange = outputFromObservable(
    this.ngForm.form.events.pipe(
      filter((v) => v instanceof PristineChangeEvent),
      map((v) => !v.pristine),
      startWith(this.ngForm.form.dirty),
      distinctUntilChanged()
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
   * `outputFromObservable` unsubscribes when the directive is destroyed.
   */
  readonly validChange = outputFromObservable(
    this.#statusChanges$.pipe(
      filter((e) => e === 'VALID' || e === 'INVALID'),
      map((v) => v === 'VALID'),
      distinctUntilChanged()
    )
  );

  /**
   * Emits once per submit, after validation for that submit has settled.
   *
   * Unlike `(ngSubmit)`, which fires while async Vest tests may still be
   * PENDING, this waits until the form is VALID or INVALID, so the handler
   * can decide on the real outcome. A new submit while one is still waiting
   * replaces it, so only the latest submit emits.
   *
   * With a `validationConfig`, the dependent fields are revalidated first, so
   * the outcome never rests on a dependent that the config's debounced
   * revalidation has not caught up with yet.
   *
   * ```html
   * <form ngxVestForm (submitSettled)="$event.valid && save($event.value)">
   * ```
   *
   * `outputFromObservable` unsubscribes when the directive is destroyed.
   */
  readonly submitSettled = outputFromObservable<NgxSubmitSettledEvent<T>>(
    this.#submitOutcome$.pipe(
      map((status) => ({
        valid: status === 'VALID',
        value: this.#snapshot.read(),
        errors: getAllFormErrors(this.ngForm.form).errors,
      }))
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
     * Trigger contract validation if the form gets updated.
     * In dev mode, runs the contract through one Standard Schema-based
     * diagnostic seam. Legacy `NgxDeepRequired<T>` contracts are normalized
     * internally, synchronous issues are logged as warnings, and runtime
     * form validity is unaffected.
     */
    if (isDevMode()) {
      effect(() => {
        const v = this.formValue();
        const contract = this.#resolvedFormContract();
        if (!v || !contract) {
          return;
        }
        validateFormContract(v, contract);
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
        // Run form-level validation (submit-mode `ngxValidateRootForm`) now.
        // This subscription is made in the constructor, so it runs before
        // the consumer's `(ngSubmit)` handler. That handler then sees the
        // settled status for synchronous suites, or PENDING while async Vest
        // tests run, instead of a stale VALID. Root-level only: field
        // validators already ran on value changes.
        if (this.ngForm.form.asyncValidator) {
          runSubmitValidation(this.ngForm);
        }
      });

    // Focus only once the submit has settled, dependents included: a field
    // that is still pending matches neither `ng-invalid` nor the wrapper.
    this.#submitOutcome$
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe(() => {
        if (this.ngForm.form.valid || !this.focusFirstInvalidOnSubmit()) {
          return;
        }
        // Wait for the render that follows the submit: wrapper `--invalid`
        // classes and `aria-invalid` only appear then, and for a custom
        // control they are the only way to find the failing field.
        this.#cdr.markForCheck();
        afterNextRender(
          () => {
            if (!this.ngForm.form.valid) {
              this.focusFirstInvalidControl();
            }
          },
          { injector: this.#injector }
        );
      });

    // Re-run every control's validators when the `suite` input changes
    // (a lazily supplied suite or a runtime swap); see the helper for why.
    revalidateOnSuiteChange(this.suite, this.ngForm.form, this.#destroyRef);

    /**
     * Single bidirectional synchronization effect.
     * Uses proper deep comparison and change tracking for correct sync direction.
     * Note: formValue is read-only input(), so we emit changes via formValueChange output.
     */
    effect(() => {
      this.#modelSync.sync(this.#snapshot.value(), this.formValue());
    });

    // Compose the validation-config pipeline, switched on every config
    // change.
    connectValidationConfig(this.ngForm.form, this.validationConfig, {
      configDebounceTime: this.#configDebounceTime,
      cdr: this.#cdr,
      destroyRef: this.#destroyRef,
      errorHandler: this.#errorHandler,
    });
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
    const firstInvalid = resolveFirstInvalidElement(
      root,
      invalidSelector,
      openCollapsedParents
    );
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
   *
   * @internal Wired only via the `(focusout)` host binding. Not part of the
   * public API; consume the `fieldBlur` output instead.
   */
  protected onFormFocusOut(event: FocusEvent): void {
    // Run on the next microtask to ensure Angular has already applied
    // control.touched changes for the field that just blurred.
    scheduleMicrotask(() => {
      this.#blurTick.update((v) => v + 1);
      this.#emitFieldBlurEvent(event);
    }, this.#destroyRef);
  }

  #emitFieldBlurEvent(event: FocusEvent): void {
    const resolved = resolveFieldFromBlur(this.ngForm, event.target);
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

    const formValue = mergeValuesAndRawValues<T>(this.ngForm.form);
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

  /**
   * Resets the form to a pristine, untouched state with optional new values.
   *
   * This method properly resets the form by:
   * 1. Resetting Angular's underlying NgForm with the provided value
   * 2. Resetting the bidirectional sync tracking, so the reset values stay
   *    unless the consumer passes a new `formValue` (see below)
   * 3. Forcing a form validity update to clear any stale validation errors
   *
   * **Why this method exists:**
   * When using the pattern `formValue.set({})` to reset a form, there can be a timing
   * issue where the form controls in the DOM still hold their old values while the
   * signal has already been updated. This creates a conflict in the bidirectional
   * sync logic, requiring workarounds like calling `formValue.set({})` twice with
   * a setTimeout. This method provides a proper solution by:
   * - Calling Angular's `NgForm.resetForm()` which properly clears all controls
   * - Resetting the internal sync tracking to avoid stale comparisons
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
   * **Without a new `formValue`:** `resetForm()` and `resetForm(value)` keep
   * the reset values even if the `[formValue]` input still holds the old model
   * (for example with a one-way binding). With `(formValueChange)` bound, the
   * reset values are emitted so the model follows. To reset to the current
   * model, pass it: `resetForm(this.formValue())`.
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

    // Reset the bidirectional sync tracking. The form baseline is cleared so
    // the reset values count as a form change. The model baseline is the
    // model input as it is now: if the consumer does not also pass a new
    // `formValue`, the sync effect sees only the form change and keeps the
    // reset values instead of writing the old model back. If the consumer
    // does pass a new model (`formValue.set(...)` next to `resetForm()`), the
    // next run sees a model change and that model wins.
    this.#modelSync.resetBaselines(untracked(this.formValue));

    // Mark the view for check so the zoneless scheduler re-renders the
    // ng-* host classes (ng-pristine, ng-valid, …) after NgForm.resetForm()
    // mutated template-driven form state outside the signal graph.
    // NgForm.resetForm() already wrote input values to the DOM synchronously
    // via value accessors; only the host-class bindings need a CD pass.
    this.#cdr.markForCheck();

    // Trigger validation update to clear any stale errors
    this.ngForm.form.updateValueAndValidity({ emitEvent: true });
    this.#blurTick.update((v) => v + 1);
  }

  /**
   * Resets validation state for a specific field in the Vest suite.
   *
   * This clears all accumulated errors and warnings for the given field
   * without affecting other fields. Useful when a field's value is
   * programmatically reset or cleared. A pending async test for the field is
   * cancelled, so its late result cannot bring the errors back (Vest >= 6.3.4).
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
    setFieldWarnings(this.fieldWarnings, field, undefined);

    // Reset Angular control validation state
    const control = this.ngForm.form.get(field);
    if (control) {
      // Error display holds the last settled messages while a field
      // re-validates; a reset field must not keep showing them.
      notifyValidationReset(control);
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
   * conditionally hidden via `@if`). The field's pending async tests are
   * dropped with it, so a late result cannot bring the field back
   * (Vest >= 6.3.4).
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
    setFieldWarnings(this.fieldWarnings, field, undefined);
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
   *
   * @deprecated Library plumbing for `FormModelDirective` and
   * `FormModelGroupDirective`, not meant to be called from applications. It
   * will leave the public API in v4.
   */
  createAsyncValidator(
    field: string,
    validationOptions: ValidationOptions
  ): AsyncValidatorFn {
    const suite = this.suite();
    if (!suite) return () => of(null);

    return createFieldValidator(
      {
        form: this.ngForm.form,
        suite,
        validationFocus: () => this.validationFocus(),
        fieldWarnings: this.fieldWarnings,
        cdr: this.#cdr,
        destroyRef: this.#destroyRef,
        errorHandler: this.#errorHandler,
      },
      field,
      validationOptions
    );
  }
}
