import {
  Directive,
  inject,
  input,
  effect,
  DestroyRef,
  isDevMode,
} from '@angular/core';
import {
  takeUntilDestroyed,
  outputFromObservable,
} from '@angular/core/rxjs-interop';
import {
  AsyncValidatorFn,
  NgForm,
  PristineChangeEvent,
  StatusChangeEvent,
  ValueChangeEvent,
  ValidationErrors,
} from '@angular/forms';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  Observable,
  of,
  ReplaySubject,
  startWith,
  Subscription,
  switchMap,
  take,
  tap,
  catchError,
  map,
} from 'rxjs';
import { StaticSuite } from 'vest';
import { DeepRequired } from '../utils/deep-required';
import {
  cloneDeep,
  getAllFormErrors,
  mergeValuesAndRawValues,
  set,
} from '../utils/form-utils';
import { fastDeepEqual } from '../utils/equality';
import { validateShape } from '../utils/shape-validation';
import { ValidationOptions } from './validation-options';
import { VALIDATION_CONFIG_DEBOUNCE_TIME } from '../constants';

@Directive({
  selector: 'form[scVestForm]',
  exportAs: 'scVestForm',
})
export class FormDirective<T extends Record<string, any>> {
  /**
   * Returns the current form state: validity and errors.
   * Used by templates and tests as vestForm.formState().valid/errors
   */
  public formState() {
    return {
      valid: this.ngForm.form.valid,
      errors: getAllFormErrors(this.ngForm.form),
    };
  }
  public readonly ngForm = inject(NgForm, { self: true, optional: false });
  private readonly destroyRef = inject(DestroyRef);

  /**
   * The value of the form, this is needed for the validation part
   */
  public readonly formValue = input<T | null>(null);

  /**
   * Static vest suite that will be used to feed our angular validators
   */
  public readonly suite = input<StaticSuite<
    string,
    string,
    (model: T, field?: string) => void
  > | null>(null);

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
  public readonly validationConfig = input<{ [key: string]: string[] } | null>(
    null
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
   * Used to debounce formValues to make sure vest isn't triggered all the time
   */
  // Async validator cache for debouncing and single-flight per field
  private readonly formValueCache: {
    [field: string]: ReplaySubject<T>;
  } = {};

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
     * Set up validation config reactively using effects.
     * The effect's cleanup function automatically unsubscribes from all
     * subscriptions when the config changes or the component is destroyed.
     */
    effect((onCleanup) => {
      const config = this.validationConfig();
      if (!config) {
        return;
      }

      const subscriptions: Subscription[] = [];
      const successfullySetup = new Set<string>();
      let isRetrySetup = false; // Track if this is a retry (controls added later)

      // Helper function to set up subscription for a trigger field
      const setupSubscription = (triggerField: string) => {
        if (successfullySetup.has(triggerField)) {
          return; // Already set up successfully
        }

        const dependentFields = config[triggerField];
        if (!dependentFields || dependentFields.length === 0) {
          return;
        }

        const triggerControl = this.ngForm?.form.get(triggerField);
        if (!triggerControl) {
          // Control doesn't exist yet, will be retried on next status change
          return;
        }

        // Mark as successfully set up before creating subscription
        successfullySetup.add(triggerField);

        // Only trigger immediate validation if this is a retry setup (controls added late)
        // AND the trigger field has a value. This handles the case where controls are
        // added after user interaction, but avoids duplicate validations during initial setup.
        if (isRetrySetup) {
          const triggerHasValue = triggerControl.value != null && triggerControl.value !== '';
          if (triggerHasValue) {
            // Trigger validation on dependent fields immediately
            dependentFields.forEach((dependentField) => {
              const dependentControl = this.ngForm?.form.get(dependentField);
              if (dependentControl && !this.validationInProgress.has(dependentField)) {
                dependentControl.updateValueAndValidity({
                  onlySelf: true,
                  emitEvent: false,
                });
              }
            });
          }
        }

        // Subscribe to changes in the trigger field
        const subscription = triggerControl.valueChanges
          .pipe(
            // Prevent infinite loops - check and set flag immediately
            filter(() => {
              if (this.validationInProgress.has(triggerField)) {
                return false;
              }
              this.validationInProgress.add(triggerField);
              return true;
            }),
            // Debounce to prevent excessive validation calls when trigger fields change rapidly
            debounceTime(VALIDATION_CONFIG_DEBOUNCE_TIME),
            tap(() => {
              // Trigger dependent field validation
              dependentFields.forEach((dependentField) => {
                const dependentControl = this.ngForm?.form.get(dependentField);
                if (
                  dependentControl &&
                  !this.validationInProgress.has(dependentField)
                ) {
                  dependentControl.updateValueAndValidity({
                    onlySelf: true,
                    emitEvent: false, // Don't emit to prevent extra change events
                  });
                }
              });
            }),
            // Ensure flag is cleared in all scenarios (success, error, unsubscribe)
            finalize(() => {
              this.validationInProgress.delete(triggerField);
            }),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe();

        subscriptions.push(subscription);
      };

      // Try to set up all subscriptions initially
      Object.keys(config).forEach(setupSubscription);

      // If any subscriptions couldn't be set up (controls don't exist yet),
      // watch for form structure changes and retry
      const totalConfigKeys = Object.keys(config).length;
      if (successfullySetup.size < totalConfigKeys) {
        const structureWatcher = this.ngForm.form.statusChanges
          .pipe(
            // Only retry when not currently validating
            filter(() => this.ngForm.form.status !== 'PENDING'),
            tap(() => {
              // Mark that subsequent setups are retries
              isRetrySetup = true;
              
              // Retry setting up subscriptions for fields that weren't set up yet
              Object.keys(config).forEach(setupSubscription);
              
              // Stop watching once all subscriptions are set up
              if (successfullySetup.size >= totalConfigKeys) {
                structureWatcher.unsubscribe();
              }
            }),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe();

        subscriptions.push(structureWatcher);
      }

      // Cleanup function: unsubscribe all subscriptions when config changes or component destroys
      onCleanup(() => {
        subscriptions.forEach((sub) => sub?.unsubscribe());
      });
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
   * Improved async validator: composable, debounced, robust error handling.
   * Compatible with v2 pattern, non-breaking.
   */
  public createAsyncValidator(
    field: string,
    validationOptions: ValidationOptions
  ): AsyncValidatorFn {
    return (value: any) => {
      const suite = this.suite();
      const formValue = this.formValue();
      
      if (!suite) {
        return of(null);
      }

      // If there's no formValue and the form has no controls, return null early
      // This handles test scenarios and edge cases gracefully
      if (!formValue && Object.keys(this.ngForm.form.controls).length === 0) {
        return of(null);
      }

      // Build the validation model from current form state
      // Always use form's current values to ensure validation sees the latest state
      // This is critical for validation config scenarios where dependent fields need current values
      const candidate = cloneDeep(mergeValuesAndRawValues<T>(this.ngForm.form));
      
      // Set the value for the field being validated
      set(candidate as object, field, value);

      if (!this.formValueCache[field]) {
        this.formValueCache[field] = new ReplaySubject<T>(1);
      }

      const subject = this.formValueCache[field];
      subject.next(candidate);

      const debounceMs = validationOptions?.debounceTime ?? 0;

      return subject.pipe(
        debounceTime(debounceMs),
        take(1),
        switchMap((model) => {
          if (isDevMode()) {
            console.debug(
              '[ngx-vest-forms] Running suite for field',
              field,
              'with model',
              model
            );
          }

          return new Observable<ValidationErrors | null>((observer) => {
            const emitResult = (vestResult: any) => {
              const pushResult = () => {
                try {
                  let errors: unknown;
                  if (typeof vestResult?.getErrors === 'function') {
                    const direct = vestResult.getErrors(field);
                    if (Array.isArray(direct)) {
                      errors = direct;
                    } else {
                      const bag = vestResult.getErrors();
                      errors = bag?.[field];
                    }
                  }

                  if (isDevMode()) {
                    console.debug(
                      '[ngx-vest-forms] Final result errors for field',
                      field,
                      errors
                    );
                  }

                  if (Array.isArray(errors) && errors.length > 0) {
                    observer.next({ error: errors[0], errors });
                  } else {
                    observer.next(null);
                  }
                } catch (error) {
                  observer.next({
                    vestInternalError:
                      error instanceof Error
                        ? error.message
                        : 'Unknown validation error',
                  });
                } finally {
                  observer.complete();
                }
              };

              if (typeof queueMicrotask === 'function') {
                queueMicrotask(pushResult);
              } else {
                setTimeout(pushResult, 0);
              }
            };

            let suiteResult: any;
            try {
              suiteResult = suite(model, field);
            } catch (error) {
              observer.next({
                vestInternalError:
                  error instanceof Error
                    ? error.message
                    : 'Unknown validation error',
              });
              observer.complete();
              return;
            }

            if (isDevMode()) {
              console.debug('[ngx-vest-forms] Suite returned', suiteResult);
            }

            const doneFn = suiteResult?.done;
            if (typeof doneFn === 'function') {
              try {
                doneFn.call(suiteResult, emitResult);
              } catch (error) {
                observer.next({
                  vestInternalError:
                    error instanceof Error
                      ? error.message
                      : 'Unknown validation error',
                });
                observer.complete();
              }
            } else {
              emitResult(suiteResult);
            }
          });
        }),
        catchError((err) =>
          of({
            vestInternalError:
              (err as Error)?.message || 'Unknown validation error',
          })
        ),
        takeUntilDestroyed(this.destroyRef)
      );
    };
  }
}
