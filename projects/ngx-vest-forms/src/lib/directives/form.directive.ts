import {
  computed,
  DestroyRef,
  Directive,
  effect,
  inject,
  Injector,
  input,
  isDevMode,
  model,
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
  InferSchemaType,
  ngxExtractTemplateFromSchema,
  SchemaDefinition,
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
  readonly vestSuite = input<NgxVestSuite<TModel> | null>(null);
  readonly validationConfig = input<Record<string, string[]> | null>(null);
  readonly validationOptions = input<NgxValidationOptions>({ debounceTime: 0 });

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

    return ngxExtractTemplateFromSchema(schema);
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
   * Simple validator cache for field validators using toObservable + RxJS pattern
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

  readonly #fieldErrorsAndWarnings = computed(() => {
    return getAllFormErrors(this.ngForm.form);
  });

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

    for (const key in allFieldMessages) {
      if (Object.prototype.hasOwnProperty.call(allFieldMessages, key)) {
        // The errors array is the primary value
        fieldErrors[key] = allFieldMessages[key];
        // Warnings are attached as a property on the error array by getAllFormErrors
        const warningsProperty = Object.getOwnPropertyDescriptor(
          allFieldMessages[key],
          'warnings',
        );
        if (warningsProperty && Array.isArray(warningsProperty.value)) {
          fieldWarnings[key] = warningsProperty.value;
        }
      }
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
  // eslint-disable-next-line no-unused-private-class-members -- This is a private effect
  readonly #formValueSyncEffect = effect(() => {
    const currentValue = this.#formValueSignal();

    if (isDevMode()) {
      this.#logFormValueChanges(currentValue);
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
    validationOptions: NgxValidationOptions,
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

                    let validationOutput: ValidationErrors | null = null;
                    if (
                      (errors && errors.length > 0) ||
                      (warnings && warnings.length > 0)
                    ) {
                      validationOutput = {};
                      if (errors && errors.length > 0) {
                        validationOutput['errors'] = errors;
                      }
                      if (warnings && warnings.length > 0) {
                        validationOutput['warnings'] = warnings;
                      }
                    }

                    observer.next(validationOutput);
                    observer.complete();
                  },
                );
              } catch (error) {
                if (isDevMode()) {
                  console.error(
                    `[NgxFormDirective] Error during Vest suite execution for field '${field}':`,
                    error,
                  );
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
            console.error(
              `[NgxFormDirective] Validation stream error for field '${field}':`,
              error,
            );
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

      return fieldValidatorContext.stream$;
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

  static createVestAsyncValidator<M = unknown>(
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
