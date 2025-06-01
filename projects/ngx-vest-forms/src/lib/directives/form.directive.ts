import {
  computed,
  DestroyRef,
  Directive,
  effect,
  inject,
  Injector,
  input,
  isDevMode,
  linkedSignal,
  model,
  resource,
  runInInjectionContext,
  signal,
  WritableSignal,
} from '@angular/core';
import {
  takeUntilDestroyed,
  toObservable,
  toSignal,
} from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormControlStatus,
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
  filter,
  map,
  Observable,
  of,
  ReplaySubject,
  retry,
  startWith,
  switchMap,
  take,
  tap,
  zip,
} from 'rxjs';
import { SuiteResult } from 'vest';
import {
  getAllFormErrors,
  mergeValuesAndRawValues,
  setValueAtPath,
} from '../utils/form-utils';
import {
  extractTemplateFromSchema,
  InferSchemaType,
  SchemaDefinition,
} from '../utils/schema-adapter';
import { validateModelTemplate } from '../utils/shape-validation';
import { VestSuite } from '../utils/validation-suite';
import { ValidateRootFormDirective } from './validate-root-form.directive';
import { ValidationOptions } from './validation-options';

/**
 * Type representing the complete state of a form
 * @template TModel The type of the form model/value
 */
export type FormState<TModel> = {
  /** The current value of the form */
  value: TModel | null;
  /** Current validation errors */
  errors: Record<string, string[]>;
  /** Current validation status */
  status: 'VALID' | 'INVALID' | 'PENDING' | 'DISABLED';
  /** Whether the form has been modified */
  dirty: boolean;
  /** Whether the form is valid */
  valid: boolean;
  /** Whether the form is invalid */
  invalid: boolean;
  /** Whether validation is pending */
  pending: boolean;
  /** Whether the form is disabled */
  disabled: boolean;
  /** Whether the form is idle (not validating) */
  idle: boolean;
};

@Directive({
  selector: 'form[scVestForm]',
  hostDirectives: [ValidateRootFormDirective],
  exportAs: 'scVestForm',
})
export class FormDirective<
  TSchema extends SchemaDefinition | null = null,
  TModel = TSchema extends SchemaDefinition
    ? InferSchemaType<TSchema>
    : unknown,
> {
  /// --- DEPENDENCY INJECTION ---
  readonly #destroyRef = inject(DestroyRef);
  readonly #injector = inject(Injector);
  readonly ngForm = inject(NgForm, { self: true, optional: false });

  readonly formValue = model<TModel | null>(null);
  readonly formSchema = input<TSchema | null>(null);
  readonly vestSuite = input<VestSuite<TModel> | null>(null);
  readonly validationConfig = input<Record<string, string[]> | null>(null);
  readonly validationOptions = input<ValidationOptions>({ debounceTime: 0 });

  /// --- INTERNAL STATE ---
  readonly #validationContext = computed(() => {
    const suite = this.vestSuite();
    const options = this.validationOptions();
    const config = this.validationConfig();

    return {
      suite,
      options,
      config,
      isValidationReady: !!suite,
      debounceTime: options.debounceTime,
    };
  });

  /**
   * Extract template from schema for runtime validation
   */
  readonly #schemaTemplate = computed(() => {
    const schema = this.formSchema();
    if (!schema) return null;

    return extractTemplateFromSchema(schema);
  });

  /**
   * Runtime schema-based validation effect
   * Validates form structure against extracted schema template to catch typos
   * This replaces the deprecated formShape functionality
   */
  // eslint-disable-next-line no-unused-private-class-members -- This is a private effect
  readonly #schemaValidationEffect = effect(() => {
    const template = this.#schemaTemplate();
    const formValue = this.#formValueSignal();

    if (template && formValue) {
      // The validateModelTemplate function will throw ModelTemplateMismatchError in dev mode
      // to help developers catch typos in ngModel/ngModelGroup names
      validateModelTemplate(formValue, template);
    }
  });

  /**
   * Resource-based field validator cache for performance optimization
   * Maps field names to their validation resources and model signals
   */
  readonly #fieldValidatorCache = new Map<
    string,
    {
      modelSignal: WritableSignal<TModel>;
      validationResource: ReturnType<
        typeof resource<
          ValidationErrors | null,
          { model: TModel; field: string }
        >
      >;
    }
  >();

  /// --- INTERNAL BASE SIGNALS ---
  readonly #statusSignal = toSignal<FormControlStatus>(
    this.ngForm.form.events.pipe(
      filter(
        (event): event is StatusChangeEvent =>
          event instanceof StatusChangeEvent,
      ),
      map((event) => event.status),
      startWith(this.ngForm.form.status),
      distinctUntilChanged(),
    ),
    { injector: this.#injector },
  );

  readonly #formValueSignal = toSignal<TModel | null>(
    this.ngForm.form.events.pipe(
      filter(
        (event): event is ValueChangeEvent<TModel> =>
          event instanceof ValueChangeEvent,
      ),
      map(() => mergeValuesAndRawValues<TModel>(this.ngForm.form)),
      startWith(mergeValuesAndRawValues<TModel>(this.ngForm.form)),
    ),
    { injector: this.#injector },
  );

  readonly #dirtySignal = toSignal<boolean>(
    this.ngForm.form.events.pipe(
      filter(
        (event): event is PristineChangeEvent =>
          event instanceof PristineChangeEvent,
      ),
      map((event) => !event.pristine),
      startWith(this.ngForm.form.dirty),
      distinctUntilChanged(),
    ),
    { injector: this.#injector },
  );

  /// --- DERIVED STATUS SIGNALS ---
  readonly #isValid = computed(() => this.#statusSignal() === 'VALID');
  readonly #isInvalid = computed(() => this.#statusSignal() === 'INVALID');
  readonly #isPending = computed(() => this.#statusSignal() === 'PENDING');
  readonly #isDisabled = computed(() => this.#statusSignal() === 'DISABLED');
  readonly #isIdle = computed(() => {
    const status = this.#statusSignal();
    return status !== 'PENDING' && status !== 'DISABLED';
  });

  readonly #errors = computed(() => {
    return getAllFormErrors(this.ngForm.form, { injector: this.#injector });
  });

  /// --- MODERN SIGNAL API USAGE ---
  readonly #syncedFormValue = linkedSignal(() => {
    const formValue = this.#formValueSignal();

    if (isDevMode()) {
      this.#logFormValueChanges(formValue);
    }

    return formValue;
  });

  /// --- PUBLIC API: CURRENT FORM STATE ---
  readonly formState = computed<FormState<TModel>>(
    () =>
      ({
        value: this.#formValueSignal() ?? null,
        errors: this.#errors() ?? {},
        status: this.#statusSignal() ?? 'VALID',
        dirty: this.#dirtySignal() ?? false,
        valid: this.#isValid(),
        invalid: this.#isInvalid(),
        pending: this.#isPending(),
        disabled: this.#isDisabled(),
        idle: this.#isIdle(),
      }) satisfies FormState<TModel>,
  );

  /// --- DEPRECATED PUBLIC API ---
  readonly isValid = this.#isValid;
  readonly isInvalid = this.#isInvalid;
  readonly isPending = this.#isPending;
  readonly isDisabled = this.#isDisabled;
  readonly isIdle = this.#isIdle;
  readonly dirtyChange = this.#dirtySignal;
  readonly validChange = computed(() => this.#statusSignal() === 'VALID');
  readonly errors = this.#errors;

  /// --- EFFECTS ---
  // eslint-disable-next-line no-unused-private-class-members -- This is a private effect
  readonly #formValueSyncEffect = effect(() => {
    const currentValue = this.#syncedFormValue();

    if (isDevMode()) {
      let loggableValue = currentValue;
      if (
        currentValue !== null &&
        currentValue !== undefined &&
        typeof currentValue === 'object' &&
        !(currentValue instanceof Date) &&
        !Array.isArray(currentValue)
      ) {
        try {
          loggableValue = structuredClone(currentValue);
        } catch {
          // If cloning fails, log the original value
        }
      }
      console.log(
        '[FormDirective] #syncedFormValue changed, setting formValue with:',
        loggableValue,
      );

      if (
        currentValue !== null &&
        currentValue !== undefined &&
        typeof currentValue === 'object' &&
        !(currentValue instanceof Date) &&
        !Array.isArray(currentValue) &&
        Object.keys(currentValue).length === 0
      ) {
        console.warn(
          '[FormDirective] #formValueSignal is an empty object {}. This will be emitted via formValueChange.',
        );
      }
    }
    // Coalesce undefined to null because formValue model is TModel | null
    this.formValue.set(currentValue === undefined ? null : currentValue);
  });

  /**
   * Cleanup effect to clear validator cache when the directive is destroyed.
   */
  // eslint-disable-next-line no-unused-private-class-members
  readonly #cleanupEffect = effect((onCleanup) => {
    this.#validationContext(); // Ensure effect re-runs if context changes
    onCleanup(() => {
      this.#clearValidatorCache();
    });
  });

  constructor() {
    // Moved from afterEveryRender for one-time setup
    this.#setupValidationConfigStreams();
    this.#setupFormSubmitListener();
  }

  // afterEveryRender() hook removed as setup logic is now in constructor

  #logFormValueChanges(value: TModel | null | undefined): void {
    if (!isDevMode()) return;

    let logValue = value;
    /// Attempt to clone for safer logging of objects in dev mode
    if (
      value !== null &&
      value !== undefined &&
      typeof value === 'object' &&
      !((value as object) instanceof Date) &&
      !Array.isArray(value)
    ) {
      try {
        logValue = structuredClone(value);
      } catch {
        /// If cloning fails, log the original value
      }
    }
    console.log(
      '[FormDirective] #formValueSignal changed. Current value:',
      logValue,
    );

    /// Dev-mode warning if the value is an empty object
    if (
      value !== null &&
      value !== undefined &&
      typeof value === 'object' &&
      !((value as object) instanceof Date) &&
      !Array.isArray(value) &&
      Object.keys(value).length === 0
    ) {
      console.warn(
        '[FormDirective] #formValueSignal is an empty object {}. This will be emitted via formValueChange.',
      );
    }
  }

  #setupValidationConfigStreams(): void {
    toObservable(this.validationConfig)
      .pipe(
        filter((config): config is Record<string, string[]> => !!config),
        switchMap((config) => this.#createDependencyStreams(config)),
        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe();
  }

  #setupFormSubmitListener(): void {
    this.ngForm.ngSubmit
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe(() => {
        this.ngForm.form.markAllAsTouched();
      });
  }

  #createDependencyStreams(
    config: Record<string, string[]>,
  ): Observable<unknown> {
    const streams = Object.keys(config)
      .map((key) => {
        const control = this.ngForm?.form.get(key);
        if (!control) {
          if (isDevMode()) {
            console.warn(
              `[ngx-vest-forms] Control '${key}' not found for validationConfig.`,
            );
          }
          return null;
        }
        return control.valueChanges.pipe(
          map(() => control.value),
          tap(() => this.#validateDependentFields(config[key], key)),
        );
      })
      .filter((stream): stream is Observable<unknown> => stream !== null);

    if (streams.length === 0) {
      return of(null);
    }

    return zip(streams).pipe(
      retry(3),
      catchError((error) => {
        if (isDevMode()) {
          console.error(
            '[ngx-vest-forms] Error in validationConfig stream:',
            error,
          );
        }
        return of(null);
      }),
    );
  }

  #validateDependentFields(
    dependentFields: string[],
    sourceField: string,
  ): void {
    for (const path of dependentFields || []) {
      const dependentControl = this.ngForm?.form.get(path);
      if (dependentControl) {
        dependentControl.updateValueAndValidity({
          onlySelf: true,
          emitEvent: true,
        });
      } else if (isDevMode()) {
        console.warn(
          `[ngx-vest-forms] Dependent control '${path}' not found for validationConfig key '${sourceField}'.`,
        );
      }
    }
  }

  createAsyncValidator(
    field: string,
    validationOptions: ValidationOptions,
  ): AsyncValidatorFn {
    const context = this.#validationContext();

    if (!context.isValidationReady || !context.suite) {
      return () => of(null);
    }

    return this.#createFieldValidator(field, context.suite, validationOptions);
  }

  #getCurrentModel(): TModel {
    return mergeValuesAndRawValues<TModel>(this.ngForm.form);
  }

  /**
   * Creates a field validator using Resource API with automatic loading states and abort handling
   * Replaces Observable-based validation for better performance and state management
   */
  #createFieldValidator(
    field: string,
    suite: VestSuite<TModel>,
    validationOptions: ValidationOptions,
  ): AsyncValidatorFn {
    let fieldValidatorContext = this.#fieldValidatorCache.get(field);

    if (!fieldValidatorContext) {
      fieldValidatorContext = runInInjectionContext(this.#injector, () => {
        const modelSignal = signal<TModel>(this.#getCurrentModel());

        const validationResourceInstance = resource({
          params: () => ({ model: modelSignal(), field }),
          loader: async ({
            params: { model: currentModel, field: currentField },
            abortSignal,
          }) => {
            return new Promise<ValidationErrors | null>((resolve, reject) => {
              if (abortSignal.aborted) {
                return reject(
                  new DOMException(
                    'Validation aborted (pre-execution)',
                    'AbortError',
                  ),
                );
              }

              const debounceMs = validationOptions.debounceTime;
              let timeoutId: ReturnType<typeof setTimeout> | undefined;

              const executeValidation = () => {
                if (abortSignal.aborted) {
                  return reject(
                    new DOMException(
                      'Validation aborted (pre-suite call)',
                      'AbortError',
                    ),
                  );
                }
                try {
                  suite(currentModel, currentField).done(
                    (result: SuiteResult<string, string>) => {
                      if (abortSignal.aborted) {
                        return reject(
                          new DOMException(
                            'Validation aborted (post-suite call)',
                            'AbortError',
                          ),
                        );
                      }
                      const errors = result.getErrors()[currentField];
                      const warnings = result.getWarnings()[currentField];
                      let validationOutput: ValidationErrors | null = null;
                      if (
                        (errors && errors.length > 0) ||
                        (warnings && warnings.length > 0)
                      ) {
                        validationOutput = {};
                        if (errors && errors.length > 0)
                          validationOutput['errors'] = errors;
                        if (warnings && warnings.length > 0)
                          validationOutput['warnings'] = warnings;
                      }
                      resolve(validationOutput);
                    },
                  );
                } catch (error) {
                  // Catches synchronous errors from suite() or done() callback
                  if (abortSignal.aborted) {
                    reject(
                      new DOMException(
                        'Validation aborted (during suite execution/callback)',
                        'AbortError',
                      ),
                    );
                  } else {
                    if (isDevMode()) {
                      console.error(
                        `[FormDirective] Synchronous error during Vest suite execution for field '${currentField}':`,
                        error,
                      );
                    }
                    reject({
                      // Reject to put resource in 'hasError' state
                      vestInternalError: `Vest suite execution failed for field '${currentField}'.`,
                      originalError:
                        error instanceof Error ? error.message : String(error),
                    });
                  }
                }
              };

              if (debounceMs > 0) {
                timeoutId = setTimeout(executeValidation, debounceMs);
                abortSignal.addEventListener('abort', () => {
                  if (timeoutId) clearTimeout(timeoutId);
                  reject(
                    new DOMException(
                      'Validation aborted (debounce period)',
                      'AbortError',
                    ),
                  );
                });
              } else {
                executeValidation();
              }
            });
          },
        });
        return { modelSignal, validationResource: validationResourceInstance };
      });
      this.#fieldValidatorCache.set(field, fieldValidatorContext);
      if (isDevMode()) {
        console.log(
          `[FormDirective] Created Resource-based validator for field '${field}' (debounce: ${validationOptions.debounceTime}ms)`,
        );
      }
    }

    const currentValidatorContextFromCache = fieldValidatorContext;

    return (control: AbstractControl) => {
      const modelSnapshot = structuredClone(this.#getCurrentModel());
      setValueAtPath(modelSnapshot as object, field, control.value);
      currentValidatorContextFromCache.modelSignal.set(modelSnapshot as TModel);

      return runInInjectionContext(this.#injector, () => {
        const PENDING_VALIDATION_MARKER =
          '__NG_VALIDATOR_PENDING_INTERNAL_MARKER__' as const;
        type PendingMarkerType = typeof PENDING_VALIDATION_MARKER;

        const resourceSignalReference =
          currentValidatorContextFromCache.validationResource;

        const validationResultComputed = computed<
          ValidationErrors | null | PendingMarkerType
        >(() => {
          const currentStatus = resourceSignalReference.status();
          const currentValueSignal = resourceSignalReference.value;
          const currentErrorSignal = resourceSignalReference.error;

          switch (currentStatus) {
            case 'loading':
            case 'reloading': {
              return PENDING_VALIDATION_MARKER;
            }
            case 'resolved': {
              return currentValueSignal() ?? null;
            }
            case 'error': {
              const errorData = currentErrorSignal();
              if (
                errorData instanceof DOMException &&
                errorData.name === 'AbortError'
              ) {
                return null;
              }
              if (isDevMode()) {
                console.error(
                  `[FormDirective] Validation resource encountered an error for field '${field}':`,
                  errorData,
                );
              }
              if (typeof errorData === 'object' && errorData !== null) {
                return errorData as ValidationErrors;
              }
              return {
                vestInternalError: `Validation failed for field '${field}'. Error: ${String(errorData)}`,
              };
            }
            case 'idle': {
              return null;
            }
            case 'local': {
              return currentValueSignal() ?? null;
            }
            default: {
              if (isDevMode()) {
                console.warn(
                  '[FormDirective] Encountered an unhandled resource status:',
                  currentStatus,
                );
              }
              return null;
            }
          }
        });

        return toObservable(validationResultComputed, {
          injector: this.#injector,
        }).pipe(
          filter(
            (result): result is ValidationErrors | null =>
              result !== PENDING_VALIDATION_MARKER,
          ),
          distinctUntilChanged((previousResult, currentResult) => {
            if (previousResult === currentResult) return true;
            if (!previousResult || !currentResult) return false;
            try {
              return (
                JSON.stringify(previousResult) === JSON.stringify(currentResult)
              );
            } catch {
              return false;
            }
          }),
        );
      });
    };
  }

  /**
   * Clears the validator cache to prevent memory leaks
   * Called automatically when the component is destroyed
   */
  #clearValidatorCache(): void {
    if (isDevMode()) {
      console.log(
        `[FormDirective] Clearing validator cache with ${this.#fieldValidatorCache.size} cached validators`,
      );
    }
    this.#fieldValidatorCache.clear();
  }

  static createVestAsyncValidator<M = unknown>(
    suite: VestSuite<M>,
    field: string,
    getModel: () => M,
    debounceTimeMs = 300,
  ): AsyncValidatorFn {
    let sub$$: ReplaySubject<M> | undefined;
    let debounced$: Observable<ValidationErrors | null> | undefined;

    return (control: AbstractControl) => {
      if (!sub$$) {
        sub$$ = new ReplaySubject<M>(1);
        debounced$ = sub$$.pipe(
          debounceTime(debounceTimeMs),
          switchMap(
            (debouncedModel) =>
              new Observable<ValidationErrors | null>((observer) => {
                suite(debouncedModel, field).done(
                  (result: SuiteResult<string, string>) => {
                    const errors = result.getErrors()[field];
                    const warnings = result.getWarnings()[field];
                    if (
                      (errors && errors.length > 0) ||
                      (warnings && warnings.length > 0)
                    ) {
                      observer.next({
                        ...(errors && errors.length > 0 ? { errors } : {}),
                        ...(warnings && warnings.length > 0
                          ? { warnings }
                          : {}),
                      });
                    } else {
                      observer.next(null);
                    }
                    observer.complete();
                  },
                );
              }),
          ),
          catchError(() =>
            of({ vestInternalError: 'Validation execution failed' }),
          ),
          take(1), // take(1) ensures the observable completes after one emission, which is typical for async validators.
        );
      }

      const modelSnapshot = structuredClone(getModel());
      setValueAtPath(modelSnapshot as object, field, control.value);
      sub$$.next(modelSnapshot as M);
      return debounced$ ?? of(null); // Ensure it always returns an observable
    };
  }
}
