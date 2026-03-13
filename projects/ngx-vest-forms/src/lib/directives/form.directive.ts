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
  FormArray,
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
  scan,
  startWith,
  switchMap,
  take,
  tap,
  timer,
} from 'rxjs';
import { logWarning, NGX_VEST_FORMS_ERRORS } from '../errors/error-catalog';
import { NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN } from '../tokens/debounce.token';
import { DeepRequired, type NgxDeepRequired } from '../utils/deep-required';
import { fastDeepEqual } from '../utils/equality';
import type { ValidationConfigMap } from '../utils/field-path-types';
import { stringifyFieldPath } from '../utils/field-path.utils';
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
import type { NgxSuiteRunResult } from '../utils/validation-suite';
import { NgxVestSuite } from '../utils/validation-suite';
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
  host: {
    '(focusout)': 'onFormFocusOut()',
  },
})
export class FormDirective<T extends Record<string, unknown>> {
  readonly ngForm = inject(NgForm, { self: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly elementRef = inject<ElementRef<HTMLFormElement>>(ElementRef);
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
    return this.#collectTouchedPaths(this.ngForm.form, this.ngForm.submitted);
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
   * Accepts NgxVestSuite<T> (the canonical type) or its deprecated alias NgxTypedVestSuite<T>.
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
  private readonly validationFeedback$ = rxMerge(
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
    this.validationFeedback$.pipe(
      scan((count) => count + 1, 0),
      startWith(0)
    ),
    { initialValue: 0 }
  );

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
    this.validationFeedback$.pipe(
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
        takeUntilDestroyed(this.destroyRef)
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

    const root: HTMLFormElement = this.elementRef.nativeElement;
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
  onFormFocusOut(): void {
    // Run on the next microtask to ensure Angular has already applied
    // control.touched changes for the field that just blurred.
    queueMicrotask(() => {
      this.#blurTick.update((v) => v + 1);
    });
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
      const form = this.elementRef.nativeElement;
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
      control.updateValueAndValidity({ emitEvent: false });
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

      // Use timer() instead of ReplaySubject for proper debouncing
      return timer(validationOptions.debounceTime ?? 0).pipe(
        map(() => snapshot),
        switchMap(
          (snap) =>
            new Observable<ValidationErrors | null>((observer) => {
              let cancelled = false;
              observer.add(() => {
                cancelled = true;
              });

              try {
                // Vest 6: suite.only(field).run() for focused, stateful validation.
                const result = suite.only(field).run(snap);

                const processResult = (
                  suiteResult: NgxSuiteRunResult
                ): ValidationErrors | null => {
                  if (cancelled) {
                    return null;
                  }

                  const errors = suiteResult.getErrors()[field];
                  const warnings = suiteResult.getWarnings()[field];

                  // Store warnings separately so fields can remain valid while displaying warnings.
                  this.fieldWarnings.update((map) => {
                    const newMap = new Map(map);
                    if (warnings?.length) {
                      newMap.set(field, warnings);
                    } else {
                      newMap.delete(field);
                    }
                    return newMap;
                  });

                  // Errors exist → { errors, warnings? } (field invalid)
                  // Only warnings or neither → null (field valid, warnings via fieldWarnings signal)
                  const out = errors?.length
                    ? {
                        errors,
                        ...(warnings?.length && { warnings }),
                      }
                    : null;

                  queueMicrotask(() => {
                    if (cancelled) {
                      return;
                    }

                    try {
                      this.cdr.detectChanges();
                    } catch {
                      this.cdr.markForCheck();
                    }
                  });

                  return out;
                };

                const emitAndComplete = (suiteResult: NgxSuiteRunResult) => {
                  if (cancelled) {
                    return;
                  }

                  observer.next(processResult(suiteResult));
                  observer.complete();
                };

                const getLatestResult = (): NgxSuiteRunResult =>
                  suite.get?.() ?? result;

                // Sync path: emit immediately to avoid PENDING flash.
                if (!result.isPending()) {
                  emitAndComplete(result);
                  return;
                }

                // Async path: handle thenable results when available.
                if (typeof result.then === 'function') {
                  Promise.resolve(result)
                    .then(() => {
                      emitAndComplete(getLatestResult());
                    })
                    .catch(() => {
                      // Rejected thenables can still represent validation failures.
                      // Read the suite's latest state when available instead of
                      // relying on the original thenable result object, which can
                      // remain stale across runtimes after rejection.
                      if (!result.isPending()) {
                        emitAndComplete(getLatestResult());
                        return;
                      }

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
                    });
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
              } catch {
                observer.next({ vestInternalError: 'Validation failed' });
                observer.complete();
                return;
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

    const timeout$ = timer(2000).pipe(
      tap(() => {
        if (isDevMode()) {
          console.warn(
            '[ngx-vest-forms] validationConfig: timed out waiting for form to leave PENDING state (2s). Continuing dependent validation to avoid stalling.'
          );
        }
      })
    );

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

    // Wait for dependent controls to be added to the form, but bound the wait to avoid silent stalls.
    const dependentControlsReady$ = form.statusChanges.pipe(
      startWith(form.status),
      filter(() => dependents.every((depField) => !!form.get(depField))),
      take(1),
      map(() => control)
    );

    const timeout$ = timer(2000).pipe(
      tap(() => {
        if (isDevMode()) {
          const unresolved = dependents.filter(
            (depField) => !form.get(depField)
          );
          console.warn(
            `[ngx-vest-forms] validationConfig: timed out waiting for dependent controls (2s): ${unresolved.join(', ')}. Continuing without waiting further.`
          );
        }
      }),
      map(() => control)
    );

    return race(dependentControlsReady$, timeout$).pipe(take(1));
  }

  /**
   * Updates validation for all dependent fields.
   *
   * Handles:
   * - Loop prevention via validationInProgress set
   * - Silent validation updates that avoid feedback loops
   *
   * Note: Touch state is NOT propagated to prevent premature error display
   * on conditionally revealed fields.
   *
   * Note: This method does NOT propagate touch state from trigger to dependent fields.
   * Dependent fields only show errors after the user directly interacts with them.
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

        // NOTE: Touch propagation removed (PR #78)
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

  /**
   * Collects field paths of all touched (or submitted) leaf controls
   * by walking the form control tree.
   */
  #collectTouchedPaths(control: AbstractControl, submitted: boolean): string[] {
    const fields: string[] = [];

    const collect = (
      current: AbstractControl,
      path: Array<string | number>
    ): void => {
      if (current instanceof FormGroup) {
        for (const [name, child] of Object.entries(current.controls)) {
          collect(child, [...path, name]);
        }
        return;
      }

      if (current instanceof FormArray) {
        current.controls.forEach((child, index) => {
          collect(child, [...path, index]);
        });
        return;
      }

      if ((submitted || current.touched) && path.length > 0) {
        fields.push(stringifyFieldPath(path));
      }
    };

    collect(control, []);
    return fields;
  }
}
