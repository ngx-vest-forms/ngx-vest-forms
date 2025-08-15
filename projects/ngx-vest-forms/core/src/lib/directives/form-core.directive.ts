import {
  Directive,
  computed,
  effect,
  inject,
  input,
  isDevMode,
  model,
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
   * The canonical model for the form. Bind with `[(formValue)]` to get
   * two-way sync between the Angular form controls and your component state.
   */
  readonly formValue = model<TModel | null>(null);
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
  readonly formState = computed<CoreFormState<TModel>>(() => ({
    value: this.formValue() ?? null,
    errors: this.#errors(),
    valid: this.#status() === 'VALID',
    dirty: this.ngForm.form.dirty,
    submitted: this.#submitted,
  }));

  constructor() {
    // form -> model sync
    effect(() => {
      // Read the value signal so this effect re-runs when controls update.
      this.#value();
      const raw = mergeValuesAndRawValues<TModel>(this.ngForm.form);
      const hasControls = Object.keys(this.ngForm.form.controls).length > 0;
      if (hasControls) {
        this.formValue.set(raw);
        if (isDevMode()) {
          console.debug('[NgxFormCoreDirective] form -> model', raw);
        }
      }
    });

    // model -> form sync (emitEvent: false prevents loops)
    effect(() => {
      const model = this.formValue();
      if (!model) return;
      const current = this.ngForm.form.value;
      if (JSON.stringify(current) !== JSON.stringify(model)) {
        this.ngForm.form.patchValue(model, { emitEvent: false });
        if (isDevMode()) {
          console.debug('[NgxFormCoreDirective] model -> form');
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
