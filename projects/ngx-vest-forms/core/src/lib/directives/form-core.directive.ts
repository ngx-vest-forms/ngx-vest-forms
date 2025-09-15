import {
  Directive,
  effect,
  inject,
  input,
  linkedSignal,
  model,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormControlStatus,
  NgForm,
  ValidationErrors,
} from '@angular/forms';
import {
  Observable,
  ReplaySubject,
  catchError,
  debounceTime,
  map,
  of,
  startWith,
  switchMap,
  take,
} from 'rxjs';
import {
  getAllFormErrors,
  mergeValuesAndRawValues,
  setValueAtPath,
} from '../utils/form-utils';
import { NgxVestSuite } from '../utils/validation-suite';
import { NgxValidationOptions } from './validation-options';

/**
 * Fast deep equality check for form values.
 * Optimized for common form data structures.
 */
function deepEqual<T>(a: T, b: T): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return a === b;

  // Handle arrays
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    const arrayA = a as unknown[];
    const arrayB = b as unknown[];
    if (arrayA.length !== arrayB.length) return false;
    return arrayA.every((item, index) => deepEqual(item, arrayB[index]));
  }

  // Handle objects
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  return keysA.every(
    (key) =>
      keysB.includes(key) &&
      deepEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key],
      ),
  );
}

/**
 * Shape of the minimal form state exposed by {@link NgxFormCoreDirective}.
 *
 * Notes:
 * - `errors` is a partial record: a field key may be missing until that field
 *   is validated at least once. Templates should guard accordingly.
 */
export type CoreFormState<TModel> = {
  value: TModel | null;
  // Errors are keyed by field path. A key may be absent until that field has been validated.
  errors: Partial<Record<string, string[]>>;
  valid: boolean;
  dirty: boolean;
  submitted: boolean;
};

/**
 * Minimal, fast, and composable core directive used by ngx-vest-forms.
 *
 * What it does
 * - Wires a template-driven `<form>` to a model signal via `[(formValue)]`.
 * - Runs Vest validations per field through an async validator.
 * - Exposes a minimal reactive `formState` with value/errors/valid/dirty/submitted.
 *
 * Why use it
 * - Keeps the mental model simple (no schemas, no root error aggregation).
 * - Small surface optimised for performance and tree-shaking.
 * - Works great for most forms; opt-in to the full directive only when needed.
 *
 * Usage notes
 * - Bind form controls with `ngModel` and the overall form with `[(formValue)]`.
 * - Guard access to `formState().errors[field]` as it may be undefined.
 * - Use `validationOptions.debounceTime` to tame async validation frequency.
 *
 * @example
 *
 * ```html
 * <form ngxVestFormCore [vestSuite]="suite" [(formValue)]="model" #vest="ngxVestFormCore">
 *   <input name="email" ngModel required />
 *   @if ((vest.formState().errors['email'] || []).length) {
 *     <ul>
 *       @for (msg of vest.formState().errors['email'] || []; track msg) {
 *         <li>{{ msg }}</li>
 *       }
 *     </ul>
 *   }
 * </form>
 * ```
 */
@Directive({
  selector: 'form[ngxVestFormCore]',
  exportAs: 'ngxVestFormCore',
  host: { '[attr.novalidate]': '""' },
})
export class NgxFormCoreDirective<TModel = Record<string, unknown>> {
  readonly ngForm = inject(NgForm);

  // Core inputs
  /**
   * Public model binding surface (`[(formValue)]`). Must remain a `model()` for two-way binding.
   */
  readonly formValue = model<TModel | null>(null);
  #lastLinkedValue: TModel | null = null;
  #lastSyncedFormValue: TModel | null = null;
  #lastSyncedModelValue: TModel | null = null;

  /**
   * Internal LinkedSignal that computes form values from Angular form state.
   * This eliminates timing issues with the previous dual-effect pattern.
   */
  readonly #formValueSignal = linkedSignal(() => {
    console.log(
      '[NgxFormCoreDirective] #formValueSignal linkedSignal executed',
    );
    // Track form value changes
    this.#value();
    const raw = mergeValuesAndRawValues<TModel>(this.ngForm.form);
    console.log('[NgxFormCoreDirective] raw value computed:', raw);

    if (Object.keys(this.ngForm.form.controls).length > 0) {
      this.#lastLinkedValue = raw;
      console.log('[NgxFormCoreDirective] returning raw value:', raw);
      return raw;
    } else if (this.#lastLinkedValue !== null) {
      console.log(
        '[NgxFormCoreDirective] returning last linked value:',
        this.#lastLinkedValue,
      );
      return this.#lastLinkedValue;
    }
    console.log('[NgxFormCoreDirective] returning null');
    return null;
  });
  /**
   * A Vest suite to execute per field. When omitted, validation is disabled
   * and the produced async validators always resolve to `null` (valid).
   */
  readonly vestSuite = input<NgxVestSuite<TModel> | null>(null);
  /**
   * Validation configuration. Currently supports `debounceTime` (ms) applied
   * to per-field async validation streams.
   */
  readonly validationOptions = input<NgxValidationOptions>({ debounceTime: 0 });

  // Internal state
  #submitted = false;
  /**
   * Baseline snapshot of the form's raw value used to compute a robust
   * dirty state that survives programmatic resets. We refresh this snapshot
   * whenever the underlying Angular form becomes pristine.
   */
  #baseline: TModel | null = null;

  // Signals from Angular forms
  // Track Angular form status as a signal for `valid` derivation.
  readonly #status = toSignal(
    this.ngForm.form.statusChanges.pipe(startWith(this.ngForm.form.status)),
    { initialValue: this.ngForm.form.status as FormControlStatus },
  );

  // Flatten Angular (non-Vest) validation errors to a field->messages map.
  readonly #errors = toSignal(
    this.ngForm.form.statusChanges.pipe(
      startWith(this.ngForm.form.status),
      map(() => getAllFormErrors(this.ngForm.form)),
    ),
    { initialValue: {} as Record<string, string[]> },
  );

  // Track the form value as a signal so effects can react to control changes.
  readonly #value = toSignal(
    this.ngForm.form.valueChanges.pipe(startWith(this.ngForm.form.value)),
    { initialValue: this.ngForm.form.value as Record<string, unknown> },
  );

  // Public state
  /** Reactive snapshot of the core state for templates and consumers. */
  readonly formState = linkedSignal(() => {
    console.log('[NgxFormCoreDirective] formState linkedSignal executed');
    // Use the internal linkedSignal for consistent form value computation
    const valueSnapshot = this.#formValueSignal();
    console.log(
      '[NgxFormCoreDirective] valueSnapshot from #formValueSignal:',
      valueSnapshot,
    );

    // Track other necessary signals to ensure reactive updates
    const status = this.#status();
    const errors = this.#errors();

    const formState = {
      value: valueSnapshot,
      errors,
      valid: status === 'VALID',
      dirty: (() => {
        const current = valueSnapshot;
        if (this.#baseline == null && current) {
          try {
            this.#baseline = structuredClone(current);
          } catch {
            this.#baseline = { ...(current as object) } as unknown as TModel;
          }
          return false;
        }
        if (!current) return false;
        return !deepEqual(current, this.#baseline);
      })(),
      submitted: this.#submitted,
    } satisfies CoreFormState<TModel>;

    console.log(
      '[NgxFormCoreDirective] final formState being returned:',
      formState,
    );
    return formState;
  });

  constructor() {
    // Initial validation bootstrap: trigger native async validators once.
    let bootstrapped = false;
    effect(
      () => {
        // Tie to form status so this effect re-evaluates when controls register
        // or when the form recalculates its status.
        // This makes the bootstrap resilient to timing of control registration.
        this.#status();
        if (bootstrapped) return;
        if (!this.vestSuite()) return;
        const controls = this.ngForm.form.controls;
        const keys = Object.keys(controls);
        if (keys.length === 0) return;
        for (const key of keys) {
          const control = (controls as Record<string, AbstractControl>)[key];
          // Trigger validation (including async) without marking dirty
          control.updateValueAndValidity({ onlySelf: true, emitEvent: true });
        }
        bootstrapped = true;
      },
      { allowSignalWrites: true },
    );

    // Also perform a one-time bootstrap after the next render to cover cases
    // where controls register only after view init in template-driven forms.
    // This complements the effect above and guarantees an initial validation pass.
    queueMicrotask(() => {
      if (bootstrapped) return;
      if (!this.vestSuite()) return;
      const controls = this.ngForm.form.controls;
      const keys = Object.keys(controls);
      if (keys.length === 0) return;
      for (const key of keys) {
        const control = (controls as Record<string, AbstractControl>)[key];
        control.updateValueAndValidity({ onlySelf: true, emitEvent: true });
      }
      bootstrapped = true;
    });

    // Single bidirectional synchronization effect
    // Uses proper deep comparison and change tracking for correct sync direction
    effect(() => {
      const formValue = this.#formValueSignal();
      const modelValue = this.formValue();

      // Skip if either is null
      if (!formValue && !modelValue) return;

      // Determine what changed using proper deep comparison
      const valuesEqual = deepEqual(formValue, modelValue);

      if (!valuesEqual) {
        // Determine sync direction by tracking what actually changed
        const formChanged = !deepEqual(formValue, this.#lastSyncedFormValue);
        const modelChanged = !deepEqual(modelValue, this.#lastSyncedModelValue);

        if (formChanged && !modelChanged) {
          // Form was modified by user -> form wins
          untracked(() => {
            this.formValue.set(formValue);
            this.#lastSyncedFormValue = formValue;
            this.#lastSyncedModelValue = formValue;
          });
        } else if (modelChanged && !formChanged) {
          // Model was set programmatically -> model wins
          untracked(() => {
            if (modelValue) {
              this.ngForm.form.patchValue(
                modelValue as Record<string, unknown>,
                { emitEvent: true },
              );
              // Ensure view updates for all controls
              for (const key of Object.keys(this.ngForm.form.controls)) {
                const control =
                  this.ngForm.form.controls[
                    key as keyof typeof this.ngForm.form.controls
                  ];
                if (control) {
                  control.updateValueAndValidity({ emitEvent: false });
                }
              }
            }
            this.#lastSyncedFormValue = modelValue;
            this.#lastSyncedModelValue = modelValue;
          });
        } else if (formChanged && modelChanged) {
          // Both changed - form wins (user interaction takes priority)
          untracked(() => {
            this.formValue.set(formValue);
            this.#lastSyncedFormValue = formValue;
            this.#lastSyncedModelValue = formValue;
          });
        }
      }

      // Update tracking values if they're in sync
      if (
        valuesEqual &&
        (this.#lastSyncedFormValue === null ||
          this.#lastSyncedModelValue === null)
      ) {
        this.#lastSyncedFormValue = formValue;
        this.#lastSyncedModelValue = modelValue;
      }

      // Update baseline when form becomes pristine
      if (!this.ngForm.form.dirty && formValue) {
        try {
          this.#baseline = structuredClone(formValue);
        } catch {
          this.#baseline = { ...(formValue as object) } as unknown as TModel;
        }
      }
    });

    // submit handling (touch all controls + expose submitted flag)
    this.ngForm.ngSubmit.subscribe(() => {
      this.#submitted = true;
      this.ngForm.form.markAllAsTouched();
    });
  }

  /**
   * Factory for a per-field async validator backed by Vest.
   *
   * What
   * - Returns an {@link AsyncValidatorFn} that executes the provided Vest suite
   *   for a specific `field` and emits `{ errors?, warnings? } | null`.
   *
   * Why
   * - Decouples validation from control wiring. Consumers (or helper directives)
   *   can attach the returned validator to controls without knowing Vest internals.
   *
   * How
   * - The validator debounces input using `options.debounceTime`.
   * - It constructs a snapshot of the current model where only the targeted
   *   `field` is set to the candidate control value, then runs the suite.
   * - On success it emits a single result and completes; on error it emits a
   *   stable `vestInternalError` structure so the UI can surface issues.
   *
   * Usage
   * ```ts
   * const v = core.createAsyncValidator('email', { debounceTime: 150 });
   * control.setAsyncValidators(v);
   * control.updateValueAndValidity();
   * ```
   */
  createAsyncValidator(
    field: string,
    options: NgxValidationOptions,
  ): AsyncValidatorFn {
    const suite = this.vestSuite();
    if (!suite) return () => of(null);

    let subj: ReplaySubject<TModel> | undefined;
    let stream$: Observable<ValidationErrors | null> | undefined;

    return (control: AbstractControl) => {
      if (!subj) {
        subj = new ReplaySubject<TModel>(1);
        stream$ = subj.pipe(
          debounceTime(options.debounceTime ?? 0),
          switchMap(
            (model) =>
              new Observable<ValidationErrors | null>((observer) => {
                try {
                  suite(model, field).done((result) => {
                    const errors = result.getErrors()[field];
                    const warnings = result.getWarnings()[field];
                    const out =
                      errors?.length || warnings?.length
                        ? {
                            ...(errors?.length && { errors }),
                            ...(warnings?.length && { warnings }),
                          }
                        : null;
                    observer.next(out);
                    observer.complete();
                  });
                } catch {
                  observer.next({ vestInternalError: 'Validation failed' });
                  observer.complete();
                }
              }),
          ),
          catchError(() => of({ vestInternalError: 'Validation failed' })),
          take(1),
        );
      }

      const model = mergeValuesAndRawValues<TModel>(this.ngForm.form);
      // create a targeted snapshot with the candidate control value
      try {
        const snapshot = structuredClone(model);
        setValueAtPath(snapshot as object, field, control.value);
        (subj as ReplaySubject<TModel>).next(snapshot as TModel);
      } catch {
        // fallback if structuredClone not available
        try {
          const cloneFunction: (<U>(value: U) => U) | undefined = (
            globalThis as unknown as { structuredClone?: <U>(v: U) => U }
          ).structuredClone;
          const snapshot = (
            cloneFunction ? cloneFunction(model) : (model as TModel)
          ) as TModel;
          setValueAtPath(snapshot as object, field, control.value);
          (subj as ReplaySubject<TModel>).next(snapshot);
        } catch {
          const snapshot = { ...(model as object) } as TModel;
          setValueAtPath(snapshot as object, field, control.value);
          (subj as ReplaySubject<TModel>).next(snapshot);
        }
      }
      return stream$ ?? of(null);
    };
  }
}
