import {
  afterNextRender,
  computed,
  DestroyRef,
  Directive,
  effect,
  inject,
  Injector,
  input,
  isDevMode,
  model,
  signal,
  untracked,
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
  ValidationErrors,
} from '@angular/forms';
import {
  InferSchemaType,
  isStandardSchema,
  ngxExtractTemplateFromSchema,
  SchemaDefinition,
  toAnyRuntimeSchema,
  type NgxRuntimeSchema,
} from 'ngx-vest-forms/schemas';
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
  share,
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
import { validateModelTemplate } from '../utils/shape-validation';
import { NgxVestSuite } from '../utils/validation-suite';
import { NgxValidationOptions } from './validation-options';

/**
 * Type representing the complete state of a form
 * @template TModel The type of the form model/value
 */
export type NgxFormState<TModel> = {
  /** The current value of the form */
  value: TModel | null;
  /** Current validation errors for specific fields */
  errors: Record<string, string[]>;
  /** Current validation warnings for specific fields */
  warnings: Record<string, string[]>;
  /** Root-level form issues */
  root?: {
    errors?: string[];
    warnings?: string[];
    internalError?: string;
  } | null;
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
  /** True after the first submit attempt (successful or not) */
  submitted: boolean;
  /** Total count of Vest (field + root) errors (excludes schema issues) */
  errorCount: number;
  /** Total count of Vest warnings */
  warningCount: number;
  /** First invalid field key (field error takes precedence, then first schema issue with path) */
  firstInvalidField?: string | null;
  /** Optional schema validation result (present only when a schema is provided) */
  schema?: {
    hasRun: boolean;
    success: boolean | null;
    issues: readonly { path?: string; message: string }[];
    errorMap: Readonly<Record<string, readonly string[]>>;
  };
};

/**
 * Directive that integrates Vest validation with Angular forms.
 * This directive is used to create a reactive form that can validate its fields
 * using a Vest suite, and it provides a structured way to manage form state and validation.
 *
 * Defaults to `novalidate` attribute to prevent default HTML5 validation.
 * The validation should be handled by the Vest suite defined in the `vestSuite` input.
 *
 * @template TSchema The schema definition for the form, if any.
 * @template TModel The type of the model represented by the form.
 */
@Directive({
  selector: 'form[ngxVestForm]',
  exportAs: 'ngxVestForm',
  host: {
    '[attr.novalidate]': '""',
  },
})
export class NgxFormDirective<
  TSchema extends SchemaDefinition | NgxRuntimeSchema<unknown> | null = null,
  TModel = TSchema extends SchemaDefinition
    ? InferSchemaType<TSchema>
    : Record<string, unknown>,
> {
  // INTERNAL SCHEMA STATE (separate from Vest errors)
  readonly #schemaState = signal<{
    hasRun: boolean;
    success: boolean | null;
    issues: { path?: string; message: string }[];
    errorMap: Record<string, readonly string[]>;
  } | null>(null);
  readonly #submitted = signal(false);
  /// --- DEPENDENCY INJECTION ---
  readonly #destroyRef = inject(DestroyRef);
  readonly #injector = inject(Injector);
  readonly ngForm = inject(NgForm, { self: true, optional: false });

  readonly formValue = model<TModel | null>(null);
  // Accept both StandardSchema and NgxRuntimeSchema at the boundary
  readonly formSchema = input<
    SchemaDefinition | NgxRuntimeSchema<unknown> | null
  >(null);
  // Accept any suite at the boundary for template ergonomics. We narrow at call sites.
  readonly vestSuite = input<unknown | null>(null);
  readonly validationConfig = input<Record<string, string[]> | null>(null);
  readonly validationOptions = input(
    { debounceTime: 0 } satisfies NgxValidationOptions,
    {
      transform: (
        value: NgxValidationOptions | undefined,
      ): NgxValidationOptions => ({
        debounceTime: 0,
        ...value,
      }),
    },
  );

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
    // Extract template only for StandardSchema-based schemas (ngxModelToStandardSchema)
    if (isStandardSchema(schema)) {
      return ngxExtractTemplateFromSchema(schema);
    }
    return null;
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
   * Simple validator cache for field validators using RxJS pattern
   * Maps field names to their validation observables with shared debounced streams
   */
  readonly #fieldValidatorCache = new Map<
    string,
    {
      stream$: Observable<ValidationErrors | null>;
      modelChanges$: ReplaySubject<TModel>;
    }
  >();

  /// --- INTERNAL BASE SIGNALS ---
  readonly #statusSignal = toSignal(
    this.ngForm.form.statusChanges.pipe(startWith(this.ngForm.form.status)),
    {
      injector: this.#injector,
      initialValue: this.ngForm.form.status as FormControlStatus,
    },
  );

  readonly #formValueSignal = toSignal(
    this.ngForm.form.valueChanges.pipe(
      startWith(this.ngForm.form.value),
      map(() => mergeValuesAndRawValues<TModel>(this.ngForm.form)),
    ),
    {
      injector: this.#injector,
      initialValue: mergeValuesAndRawValues<TModel>(this.ngForm.form),
    },
  );

  readonly #dirtySignal = toSignal(
    this.ngForm.form.statusChanges.pipe(
      startWith(this.ngForm.form.status),
      map(() => this.ngForm.form.dirty),
    ),
    { injector: this.#injector, initialValue: this.ngForm.form.dirty },
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

  readonly #fieldErrorsAndWarnings = toSignal(
    this.ngForm.form.statusChanges.pipe(
      startWith(this.ngForm.form.status),
      map(() => {
        try {
          return getAllFormErrors(this.ngForm.form);
        } catch (error) {
          if (isDevMode()) {
            console.error(
              '[NgxFormDirective] Error getting form errors:',
              error,
            );
          }
          return {};
        }
      }),
    ),
    { injector: this.#injector, initialValue: {} },
  );

  readonly #rootErrorsAndWarnings = computed<{
    errors?: string[];
    warnings?: string[];
    internalError?: string;
  } | null>(() => {
    const rootNGErrors = this.ngForm.form.errors;
    if (!rootNGErrors) {
      return null;
    }
    const rootState: {
      errors?: string[];
      warnings?: string[];
      internalError?: string;
    } = {};
    if (rootNGErrors['errors'] && Array.isArray(rootNGErrors['errors'])) {
      rootState.errors = rootNGErrors['errors'];
    }
    if (rootNGErrors['warnings'] && Array.isArray(rootNGErrors['warnings'])) {
      rootState.warnings = rootNGErrors['warnings'];
    }
    if (
      rootNGErrors['vestInternalError'] &&
      typeof rootNGErrors['vestInternalError'] === 'string'
    ) {
      rootState.internalError = rootNGErrors['vestInternalError'];
    }
    return Object.keys(rootState).length > 0 ? rootState : null;
  });

  /// --- PUBLIC API: CURRENT FORM STATE ---
  readonly formState = computed<NgxFormState<TModel>>(() => {
    const allFieldMessages = this.#fieldErrorsAndWarnings() ?? {};
    const fieldErrors: Record<string, string[]> = {};
    const fieldWarnings: Record<string, string[]> = {};

    // Modern approach using for...of for better performance and readability
    for (const [key, messages] of Object.entries(allFieldMessages)) {
      fieldErrors[key] = messages;
      // Extract warnings using more efficient property access
      const warnings = (messages as string[] & { warnings?: string[] })
        .warnings;
      if (Array.isArray(warnings)) {
        fieldWarnings[key] = warnings;
      }
    }

    // Aggregate counts (Vest only, exclude schema)
    const vestRootErrors = this.#rootErrorsAndWarnings()?.errors?.length ?? 0;
    const fieldErrorCount = Object.values(fieldErrors).reduce(
      (accumulator, array) => accumulator + array.length,
      0,
    );
    const vestWarningCount =
      (this.#rootErrorsAndWarnings()?.warnings?.length ?? 0) +
      Object.values(fieldWarnings).reduce(
        (accumulator, array) => accumulator + array.length,
        0,
      );

    // Determine first invalid field
    let firstInvalidField: string | null = null;
    for (const key of Object.keys(fieldErrors)) {
      if (fieldErrors[key]?.length) {
        firstInvalidField = key;
        break;
      }
    }
    if (!firstInvalidField) {
      const schemaIssues = this.#schemaState()?.issues || [];
      const firstSchemaPath = schemaIssues.find((issue) => issue.path)?.path;
      firstInvalidField = firstSchemaPath ?? null;
    }

    return {
      value: this.#formValueSignal() ?? null,
      errors: fieldErrors,
      warnings: fieldWarnings,
      root: this.#rootErrorsAndWarnings(),
      status: this.#statusSignal() ?? 'VALID',
      dirty: this.#dirtySignal() ?? false,
      valid: this.#isValid(),
      invalid: this.#isInvalid(),
      pending: this.#isPending(),
      disabled: this.#isDisabled(),
      idle: this.#isIdle(),
      submitted: this.#submitted(),
      errorCount: vestRootErrors + fieldErrorCount,
      warningCount: vestWarningCount,
      firstInvalidField,
      schema: (() => {
        const currentSchemaState = this.#schemaState();
        if (currentSchemaState) {
          return {
            hasRun: currentSchemaState.hasRun,
            success: currentSchemaState.success,
            issues: currentSchemaState.issues,
            errorMap: currentSchemaState.errorMap,
          } as const;
        }
        if (this.formSchema()) {
          return {
            hasRun: false,
            success: null,
            issues: [],
            errorMap: {},
          } as const;
        }
        return;
      })(),
    } satisfies NgxFormState<TModel>;
  });

  /// --- DEPRECATED PUBLIC API ---
  readonly isValid = this.#isValid;
  readonly isInvalid = this.#isInvalid;
  readonly isPending = this.#isPending;
  readonly isDisabled = this.#isDisabled;
  readonly isIdle = this.#isIdle;
  readonly dirtyChange = this.#dirtySignal;
  readonly validChange = computed(() => this.#statusSignal() === 'VALID');
  readonly errors = computed(() => this.formState().errors); // Update deprecated errors to reflect new structure

  /// --- EFFECTS ---
  // Form value synchronization effect - syncs internal form value with external model
  // This is a legitimate use case for effect() as it's a side effect (updating the model signal)
  // eslint-disable-next-line no-unused-private-class-members -- This is a private effect
  readonly #formValueSyncEffect = effect(() => {
    const currentValue = this.#formValueSignal();

    // Use untracked for logging to avoid creating unnecessary dependencies
    if (isDevMode()) {
      untracked(() => this.#logFormValueChanges(currentValue));
    }

    // Only sync from form to model when we have an actual form value AND the form has controls
    // This prevents overriding the initial model value with an empty form value on initialization
    if (
      currentValue !== undefined &&
      this.ngForm?.form &&
      Object.keys(this.ngForm.form.controls).length > 0
    ) {
      this.formValue.set(currentValue);
    }
  });

  // Model-to-form synchronization effect - syncs external model changes to the Angular form
  // This handles initial model values and programmatic model updates
  // eslint-disable-next-line no-unused-private-class-members -- This is a private effect
  readonly #modelToFormSyncEffect = effect(() => {
    const modelValue = this.formValue();

    // Skip sync if model is null/undefined or if form is not yet initialized
    if (!modelValue || !this.ngForm?.form) {
      return;
    }

    // Get current form value to avoid unnecessary patches
    const currentFormValue = this.ngForm.form.value;

    // Only patch if values are different (avoid circular updates)
    if (JSON.stringify(currentFormValue) !== JSON.stringify(modelValue)) {
      // Use untracked to avoid creating dependencies on form state changes
      untracked(() => {
        if (isDevMode()) {
          console.log('[NgxFormDirective] Syncing model to form:', {
            modelValue,
            currentFormValue,
          });
        }
        this.ngForm.form.patchValue(modelValue, { emitEvent: false });
      });
    }
  });

  // Track previous validation context for comparison
  #previousValidationContext: {
    suite: unknown | null;
    options: NgxValidationOptions;
    config: Record<string, string[]> | null;
    isValidationReady: boolean;
    debounceTime: number;
  } | null = null;

  /**
   * Enhanced validation context tracking effect
   * This ensures validator cache is cleared when validation context changes
   */
  // eslint-disable-next-line no-unused-private-class-members -- This is a private effect
  readonly #validationContextEffect = effect((onCleanup) => {
    // Track validation context to re-run when it changes
    const context = this.#validationContext();

    // Log context changes in dev mode to help with debugging
    if (isDevMode()) {
      untracked(() => {
        console.log('[NgxFormDirective] Validation context changed', {
          isValidationReady: context.isValidationReady,
          debounceTime: context.debounceTime,
          hasSuite: !!context.suite,
          hasConfig: !!context.config,
        });
      });
    }

    // Only clear cache if this is not the initial run and context actually changed
    if (
      this.#previousValidationContext &&
      (this.#previousValidationContext.debounceTime !== context.debounceTime ||
        this.#previousValidationContext.suite !== context.suite ||
        this.#previousValidationContext.config !== context.config)
    ) {
      untracked(() => {
        if (this.#fieldValidatorCache.size > 0) {
          if (isDevMode()) {
            console.log(
              '[NgxFormDirective] Clearing validator cache due to context change',
            );
          }
          this.#clearValidatorCache();
        }
      });
    }

    // Store current context for next comparison
    this.#previousValidationContext = context;

    onCleanup(() => {
      if (isDevMode()) {
        console.log(
          '[NgxFormDirective] Cleaning up validator cache due to effect cleanup',
        );
      }
      this.#clearValidatorCache();
    });
  });

  constructor() {
    // Setup validation configuration streams
    this.#setupValidationConfigStreams();
    this.#setupFormSubmitListener();

    // Use afterNextRender for better zoneless compatibility
    // This ensures the form is fully rendered before we start validation setup
    afterNextRender(() => {
      // Ensure form is properly initialized after render
      if (this.ngForm.form && isDevMode()) {
        console.log('[NgxFormDirective] Form initialized after render', {
          status: this.ngForm.form.status,
          hasControls: Object.keys(this.ngForm.form.controls).length > 0,
        });
      }
    });

    // Setup automatic cleanup when directive is destroyed
    this.#destroyRef.onDestroy(() => {
      if (isDevMode()) {
        console.log(
          '[NgxFormDirective] Cleaning up validator cache on destroy',
        );
      }
      this.#clearValidatorCache();
    });
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
      '[NgxFormDirective] #formValueSignal changed. Current value:',
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
        '[NgxFormDirective] #formValueSignal is an empty object {}. This will be emitted via formValueChange.',
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
        this.#submitted.set(true);
        this.ngForm.form.markAllAsTouched();
        const schemaCandidate = this.formSchema();
        if (!schemaCandidate) return;
        try {
          const runtime = toAnyRuntimeSchema(schemaCandidate);
          const currentModel = this.#getCurrentModel();
          const result = runtime.safeParse(currentModel);
          if (result.success === false) {
            const issues: { path?: string; message: string }[] =
              result.issues.map(
                (issue: { path?: string; message: string }) => ({
                  path: issue.path,
                  message: issue.message,
                }),
              );
            const errorMap: Record<string, readonly string[]> = {};
            for (const issue of issues) {
              const key = issue.path || '_root';
              errorMap[key] = [...(errorMap[key] || []), issue.message];
            }
            this.#schemaState.set({
              hasRun: true,
              success: false,
              issues,
              errorMap,
            });
            if (isDevMode()) {
              console.warn(
                '[ngx-vest-forms][NgxFormDirective] schema safeParse failed',
                {
                  vendor: result.meta?.['vendor'],
                  issues: result.issues,
                },
              );
            }
          } else {
            this.#schemaState.set({
              hasRun: true,
              success: true,
              issues: [],
              errorMap: {},
            });
          }
        } catch (error) {
          if (isDevMode()) {
            console.error(
              '[ngx-vest-forms][NgxFormDirective] error during automatic schema validation',
              error,
            );
          }
          this.#schemaState.set({
            hasRun: true,
            success: false,
            issues: [{ message: 'Unexpected schema validation error' }],
            errorMap: { _root: ['Unexpected schema validation error'] },
          });
        } finally {
          this.ngForm.form.updateValueAndValidity({ emitEvent: true });
        }
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
    validationOptions: NgxValidationOptions,
  ): AsyncValidatorFn {
    const context = this.#validationContext();

    if (!context.isValidationReady || !context.suite) {
      return () => of(null);
    }

    // Cast the suite to the current model type when invoking
    return this.#createFieldValidator(
      field,
      context.suite as NgxVestSuite<TModel>,
      validationOptions,
    );
  }

  #getCurrentModel(): TModel {
    return mergeValuesAndRawValues<TModel>(this.ngForm.form);
  }

  /**
   * Creates a field validator using toObservable + RxJS pattern for streaming validation
   * Replaces complex resource-based validation with simpler, more efficient approach
   */
  #createFieldValidator(
    field: string,
    suite: NgxVestSuite<TModel>,
    validationOptions: NgxValidationOptions,
  ): AsyncValidatorFn {
    // Check if we already have a cached validator for this field
    let fieldValidatorContext = this.#fieldValidatorCache.get(field);

    if (!fieldValidatorContext) {
      // Create a shared validation stream for this field
      const fieldModelChanges$ = new ReplaySubject<TModel>(1);

      const fieldValidator$ = fieldModelChanges$.pipe(
        debounceTime(validationOptions.debounceTime),
        distinctUntilChanged(),
        switchMap(
          (model) =>
            new Observable<ValidationErrors | null>((observer) => {
              try {
                suite(model, field).done(
                  (result: SuiteResult<string, string>) => {
                    const errors = result.getErrors()[field];
                    const warnings = result.getWarnings()[field];

                    const validationOutput: ValidationErrors | null =
                      errors?.length || warnings?.length
                        ? {
                            ...(errors?.length && { errors }),
                            ...(warnings?.length && { warnings }),
                          }
                        : null;

                    // Use untracked for debug logging to avoid creating dependencies
                    if (isDevMode()) {
                      untracked(() => {
                        console.log(
                          `[NgxFormDirective] Field '${field}' validation result:`,
                          { errors, warnings, validationOutput },
                        );
                      });
                    }

                    observer.next(validationOutput);
                    observer.complete();
                  },
                );
              } catch (error) {
                // Use untracked for error logging to avoid creating dependencies
                if (isDevMode()) {
                  untracked(() => {
                    console.error(
                      `[NgxFormDirective] Error during Vest suite execution for field '${field}':`,
                      error,
                    );
                  });
                }
                observer.next({
                  vestInternalError: `Vest suite execution failed for field '${field}'.`,
                  originalError:
                    error instanceof Error ? error.message : String(error),
                });
                observer.complete();
              }
            }),
        ),
        catchError((error) => {
          if (isDevMode()) {
            untracked(() => {
              console.error(
                `[NgxFormDirective] Validation stream error for field '${field}':`,
                error,
              );
            });
          }
          return of({
            vestInternalError: `Validation failed for field '${field}'.`,
            originalError:
              error instanceof Error ? error.message : String(error),
          });
        }),
        share(), // Share the stream among multiple subscribers
        takeUntilDestroyed(this.#destroyRef),
      );

      // Cache the stream and subject
      fieldValidatorContext = {
        stream$: fieldValidator$,
        modelChanges$: fieldModelChanges$,
      };
      this.#fieldValidatorCache.set(field, fieldValidatorContext);

      if (isDevMode()) {
        console.log(
          `[NgxFormDirective] Created streaming validator for field '${field}' (debounce: ${validationOptions.debounceTime}ms)`,
        );
      }
    }

    return (control: AbstractControl) => {
      const modelSnapshot = structuredClone(this.#getCurrentModel());
      setValueAtPath(modelSnapshot as object, field, control.value);

      // Trigger validation with the new model
      fieldValidatorContext.modelChanges$.next(modelSnapshot as TModel);

      // Return the stream and ensure it completes properly using take(1)
      return fieldValidatorContext.stream$.pipe(take(1));
    };
  }

  /**
   * Clears the validator cache to prevent memory leaks
   * Called automatically when the component is destroyed
   */
  #clearValidatorCache(): void {
    if (isDevMode()) {
      console.log(
        `[NgxFormDirective] Clearing validator cache with ${this.#fieldValidatorCache.size} cached validators`,
      );
    }
    this.#fieldValidatorCache.clear();
  }

  static createVestAsyncValidator<M = Record<string, unknown>>(
    suite: NgxVestSuite<M>,
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

                    const validationResult =
                      errors?.length || warnings?.length
                        ? {
                            ...(errors?.length && { errors }),
                            ...(warnings?.length && { warnings }),
                          }
                        : null;

                    observer.next(validationResult);
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
