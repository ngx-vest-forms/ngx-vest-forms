// ... existing code ...
import {
  Directive,
  inject,
  input,
  effect,
  untracked,
  DestroyRef,
  isDevMode,
  linkedSignal,
  computed,
  InputSignal,
} from '@angular/core';
import {
  takeUntilDestroyed,
  outputFromObservable,
  toObservable,
  toSignal,
} from '@angular/core/rxjs-interop';
import {
  AsyncValidatorFn,
  NgForm,
  PristineChangeEvent,
  StatusChangeEvent,
  ValueChangeEvent,
  ValidationErrors,
  AbstractControl,
  FormGroup,
} from '@angular/forms';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  Observable,
  of,
  startWith,
  switchMap,
  take,
  tap,
  catchError,
  map,
  EMPTY,
  merge as rxMerge,
  timer,
} from 'rxjs';
import { DeepRequired } from '../utils/deep-required';
import {
  getAllFormErrors,
  mergeValuesAndRawValues,
  setValueAtPath,
} from '../utils/form-utils';
import { NgxFormState } from '../utils/form-state.utils';
import { NgxVestSuite } from '../utils/validation-suite';
import { fastDeepEqual } from '../utils/equality';
import { validateShape } from '../utils/shape-validation';
import { ValidationOptions } from './validation-options';
import { VALIDATION_CONFIG_DEBOUNCE_TIME } from '../constants';
import type { ValidationConfigMap } from '../utils/field-path-types';

/**
 * Type for validation configuration that accepts both the typed and untyped versions.
 * This ensures backward compatibility while supporting the new typed API.
 */
export type NgxValidationConfig<T = unknown> =
  | Record<string, string[]>
  | ValidationConfigMap<T>
  | null;

@Directive({
  selector: 'form[scVestForm]',
  exportAs: 'scVestForm',
})
export class FormDirective<T extends Record<string, any>> {
  public readonly ngForm = inject(NgForm, { self: true, optional: false });
  private readonly destroyRef = inject(DestroyRef);

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
   */
  public readonly formState = computed<NgxFormState<T>>(() => {
    // Tie to status signal to ensure recomputation on validation changes
    this.#statusSignal();
    return {
      valid: this.ngForm.form.valid,
      errors: getAllFormErrors(this.ngForm.form),
      value: this.#formValueSignal(),
    };
  });

  /**
   * The value of the form, this is needed for the validation part.
   * Using input() here because two-way binding is provided via formValueChange output.
   * In the minimal core directive (form-core.directive.ts), this would be model() instead.
   */
  public readonly formValue = input<T | null>(null);

  /**
   * Static vest suite that will be used to feed our angular validators
   * Accepts both NgxVestSuite (with string field) and NgxTypedVestSuite (with FormFieldName<T> field)
   * through the flexible callback signature
   */
  public readonly suite = input<NgxVestSuite<T> | null>(null);

  /**
   * The shape of our form model. This is a deep required version of the form model
   * The goal is to add default values to the shape so when the template-driven form
   * contains values that shouldn't be there (typo's) that the developer gets run-time
   * errors in dev mode
   */
  public readonly formShape = input<DeepRequired<T> | null>(null);

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
  public readonly validationConfig: InputSignal<NgxValidationConfig<T>> =
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
  public readonly idle$ = this.ngForm.form.events.pipe(
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
  public readonly formValueChange = outputFromObservable(
    this.ngForm.form.events.pipe(
      filter((v) => v instanceof ValueChangeEvent),
      map((v) => (v as ValueChangeEvent<any>).value),
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
   * Cleanup is handled automatically by the directive when it's destroyed.
   */
  public readonly errorsChange = outputFromObservable(
    this.ngForm.form.events.pipe(
      filter((v) => v instanceof StatusChangeEvent),
      map((v) => (v as StatusChangeEvent).status),
      filter((v) => v !== 'PENDING'),
      map(() => getAllFormErrors(this.ngForm.form)),
      takeUntilDestroyed(this.destroyRef)
    )
  );

  /**
   * Triggered as soon as the form becomes dirty
   *
   * Cleanup is handled automatically by the directive when it's destroyed.
   */
  public readonly dirtyChange = outputFromObservable(
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
  public readonly validChange = outputFromObservable(
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

  public constructor() {
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

      // Determine what changed using proper deep comparison
      const valuesEqual = fastDeepEqual(formValue, modelValue);

      if (!valuesEqual) {
        // Determine sync direction by tracking what actually changed
        const formChanged = !fastDeepEqual(
          formValue,
          this.#lastSyncedFormValue
        );
        const modelChanged = !fastDeepEqual(
          modelValue,
          this.#lastSyncedModelValue
        );

        if (formChanged && !modelChanged) {
          // Form was modified by user -> form wins
          // Note: We can't call this.formValue.set() since it's an input()
          // The formValueChange output will emit the new value
          untracked(() => {
            this.#lastSyncedFormValue = formValue;
            this.#lastSyncedModelValue = formValue;
          });
        } else if (modelChanged && !formChanged) {
          // Model was modified programmatically -> model wins
          untracked(() => {
            // Update form controls with new model values
            if (modelValue) {
              Object.keys(modelValue).forEach((key) => {
                const control = this.ngForm.form.get(key);
                if (control && control.value !== modelValue[key]) {
                  control.setValue(modelValue[key], { emitEvent: false });
                }
              });
            }
            this.#lastSyncedFormValue = modelValue;
            this.#lastSyncedModelValue = modelValue;
          });
        }
      }
    });

    /**
     * Set up validation config reactively using v2 pattern with toObservable + switchMap.
     * This provides automatic cleanup when config changes.
     */
    const form = this.ngForm.form;
    toObservable(this.validationConfig)
      .pipe(
        distinctUntilChanged(),
        // For each config, compose a merged stream of all trigger pipelines.
        // switchMap ensures previous pipelines are torn down automatically
        // when the config object changes.
        switchMap((config) => {
          if (!config) {
            // Clear any in-progress flags when config becomes null
            this.validationInProgress.clear();
            return EMPTY;
          }

          const streams = Object.keys(config).map((triggerField) => {
            const dependents: string[] =
              (config as Record<string, string[]>)[triggerField] || [];

            // Stream that rebinds to the trigger control whenever the form structure changes
            const triggerControl$ = form.statusChanges.pipe(
              startWith(form.status),
              // Project to the control instance (may be undefined initially)
              // Re-run on each status change until control exists
              map(() => form.get(triggerField)),
              // Proceed only when control is available
              filter((c): c is NonNullable<typeof c> => !!c),
              // Avoid re-subscribing if the control instance is the same
              distinctUntilChanged()
            );

            return triggerControl$.pipe(
              // For the resolved control, subscribe to BOTH valueChanges and statusChanges
              // This ensures validation triggers on both value changes AND touch state changes
              switchMap((control) => {
                // Create a stream that combines value changes and touch state changes
                const valueChange$ = control.valueChanges;
                const touchChange$ = control.statusChanges.pipe(
                  filter(() => control.touched)
                );

                return rxMerge(valueChange$, touchChange$).pipe(
                  // Debounce to batch rapid changes
                  debounceTime(VALIDATION_CONFIG_DEBOUNCE_TIME),
                  // Wait for the form to be idle before updating dependents
                  switchMap(() =>
                    form.statusChanges.pipe(
                      startWith(form.status),
                      filter((s) => s !== 'PENDING'),
                      take(1),
                      map(() => control) // Pass through the control
                    )
                  ),
                  tap(() => {
                    for (const depField of dependents) {
                      const dependentControl = form.get(depField);
                      if (!dependentControl) {
                        if (isDevMode()) {
                          console.warn(
                            `[ngx-vest-forms] Dependent control '${depField}' not found for validationConfig key '${triggerField}'.`
                          );
                        }
                        continue;
                      }

                      // Only mark dependent fields as touched when the trigger field was touched
                      // This preserves untouched state for programmatic value changes
                      if (control.touched && !dependentControl.touched) {
                        dependentControl.markAsTouched();
                      }

                      if (!this.validationInProgress.has(depField)) {
                        // Use emitEvent: true to ensure async validators re-run
                        // This is critical for omitWhen scenarios where validation logic
                        // depends on other field values that have changed
                        dependentControl.updateValueAndValidity({
                          onlySelf: true,
                          emitEvent: true,
                        });
                      }
                    }
                  }),
                  tap(() => this.validationInProgress.delete(triggerField))
                );
              })
            );
          });

          return streams.length > 0 ? rxMerge(...streams) : EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
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
   * ```
   */
  public triggerFormValidation(): void {
    // Update all form controls validity which will trigger all form events
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
  public createAsyncValidator(
    field: string,
    validationOptions: ValidationOptions
  ): AsyncValidatorFn {
    const suite = this.suite();
    if (!suite) return () => of(null);

    return (control: AbstractControl) => {
      const model = mergeValuesAndRawValues<T>(this.ngForm.form);

      // Targeted snapshot with candidate value injected at path
      let snapshot: T;
      try {
        snapshot = structuredClone(model) as T;
      } catch {
        try {
          const cloneFunction: (<U>(value: U) => U) | undefined = (
            globalThis as unknown as { structuredClone?: <U>(v: U) => U }
          ).structuredClone;
          snapshot = (cloneFunction ? cloneFunction(model) : model) as T;
        } catch {
          snapshot = { ...(model as object) } as T;
        }
      }
      setValueAtPath(snapshot as object, field, control.value);

      // Use timer() instead of ReplaySubject for proper debouncing
      return timer(validationOptions.debounceTime ?? 0).pipe(
        map(() => snapshot),
        switchMap(
          (snap) =>
            new Observable<ValidationErrors | null>((observer) => {
              try {
                suite(snap, field).done((result: any) => {
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
            })
        ),
        catchError(() => of({ vestInternalError: 'Validation failed' })),
        take(1)
      );
    };
  }
}
