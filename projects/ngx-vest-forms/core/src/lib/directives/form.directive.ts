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
  signal,
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
import type {
  InferSchemaType,
  NgxRuntimeSchema,
  SchemaDefinition,
} from 'ngx-vest-forms/schemas';
import {
  catchError,
  debounceTime,
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
  safeParseWithAnySchema,
} from '../utils/schema-utils';
import { validateModelTemplate } from '../utils/shape-validation';
import { NgxVestSuite } from '../utils/validation-suite';
import { NgxFormCoreDirective } from './form-core.directive';
import { NgxValidationOptions } from './validation-options';

// Helper to resolve the model type from either a StandardSchema or an NgxRuntimeSchema
type ModelFromSchema<S> = S extends SchemaDefinition
  ? InferSchemaType<S>
  : S extends NgxRuntimeSchema<infer R>
    ? R
    : Record<string, unknown>;

// --- Minimal local schema helpers moved to ../utils/schema-utils ---

/**
 * Type representing the complete state of a form
 * @template TModel The type of the form model/value
 */
export type NgxFormState<TModel> = {
  /** The current value of the form */
  value: TModel | null;
  /** Current validation errors for specific fields */
  errors: Partial<Record<string, string[]>>;
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
 * Full-featured directive that composes the minimal core and adds advanced
 * capabilities like root issues, schema validation, metadata, and compat APIs.
 *
 * What it does
 * - Extends {@link NgxFormCoreDirective} via hostDirectives.
 * - Aggregates field errors/warnings and root issues.
 * - Optionally validates with a schema (StandardSchema or runtime schema).
 * - Exposes a richer `formState` with status, counts, firstInvalidField, etc.
 *
 * When to use it
 * - Use when you need schema validation, root-level aggregation, or advanced
 *   state metadata beyond the minimal core.
 * - For simple forms, prefer `ngxVestFormCore` for smaller surface/perf.
 *
 * Usage notes
 * - Bind model with `[(formValue)]` on the form. The full directive bridges
 *   this to the core to avoid two-way binding target mismatches.
 * - You can still use the control-wrapper UI helpers with either core or full.
 *
 * Example
 * ```html
 * <form ngxVestForm [vestSuite]="suite" [(formValue)]="model" #vest="ngxVestForm">
 *   <input name="email" ngModel required />
 *   @if ((vest.formState().errors['email'] || []).length) {
 *     <ul>
 *       @for (e of vest.formState().errors['email'] || []; track e) {
 *         <li>{{ e }}</li>
 *       }
 *     </ul>
 *   }
 * </form>
 * ```
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
  hostDirectives: [
    {
      directive: NgxFormCoreDirective,
      inputs: ['vestSuite', 'validationOptions', 'formValue'],
      outputs: ['formValueChange'],
    },
  ],
})
export class NgxFormDirective<
  TSchema extends SchemaDefinition | NgxRuntimeSchema<unknown> | null = null,
  TModel = ModelFromSchema<NonNullable<TSchema>>,
> {
  // Compose the minimal core and extend it with advanced features
  readonly #core = inject(NgxFormCoreDirective, { host: true });
  // Forward core inputs for host-dependent directives (e.g., root validator)
  // Expose as-is so callers can read the signal inputs via .()
  readonly vestSuite = this.#core.vestSuite;
  readonly validationOptions = this.#core.validationOptions;
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

  // formValue two-way binding is provided by the core directive via hostDirectives
  // Accept both StandardSchema and NgxRuntimeSchema at the boundary
  readonly formSchema = input<
    SchemaDefinition | NgxRuntimeSchema<unknown> | null
  >(null);
  readonly validationConfig = input<Record<string, string[]> | null>(null);

  /// --- INTERNAL STATE ---

  /**
   * Extract template from schema for runtime validation
   */
  readonly #schemaTemplate = computed(() => {
    const schema = this.formSchema();
    if (!schema) return null;
    // Attempt extraction (returns null for non-ngxModel-based schemas)
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
    const formValue = this.#core.formState().value;

    if (template && formValue) {
      // The validateModelTemplate function will throw ModelTemplateMismatchError in dev mode
      // to help developers catch typos in ngModel/ngModelGroup names
      validateModelTemplate(formValue, template);
    }
  });

  // Removed per-field validator cache; validation is delegated to core

  /// --- INTERNAL BASE SIGNALS ---
  readonly #statusSignal = toSignal(
    this.ngForm.form.statusChanges.pipe(startWith(this.ngForm.form.status)),
    {
      injector: this.#injector,
      initialValue: this.ngForm.form.status as FormControlStatus,
    },
  );

  // Dirty, valid and submitted flags are available via core state

  /// --- DERIVED STATUS SIGNALS ---
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
  /**
   * Rich reactive form state including field and root issues, schema results,
   * and derived metadata (status, counts, firstInvalidField, etc.).
   */
  readonly formState = computed<NgxFormState<TModel>>(() => {
    const base = this.#core.formState();
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
      value: base.value ?? null,
      errors: fieldErrors,
      warnings: fieldWarnings,
      root: this.#rootErrorsAndWarnings(),
      status: this.#statusSignal() ?? 'VALID',
      dirty: base.dirty,
      valid: base.valid,
      invalid: !base.valid,
      pending: this.#isPending(),
      disabled: this.#isDisabled(),
      idle: this.#isIdle(),
      submitted: base.submitted,
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
  readonly isValid = computed(() => this.formState().valid);
  readonly isInvalid = computed(() => this.formState().invalid);
  readonly isPending = this.#isPending;
  readonly isDisabled = this.#isDisabled;
  readonly isIdle = this.#isIdle;
  readonly dirtyChange = computed(() => this.formState().dirty);
  readonly validChange = computed(() => this.formState().valid);
  readonly errors = computed(() => this.formState().errors); // Update deprecated errors to reflect new structure

  // no additional bridging effects required; core handles [(formValue)]

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
      // core handles cleanup
    });
  }

  // afterEveryRender() hook removed as setup logic is now in constructor

  // Removed dev-only form value change logger from full directive

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
          const currentModel = this.#getCurrentModel();
          const result = safeParseWithAnySchema(schemaCandidate, currentModel);
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

  /**
   * Delegated factory for a per-field async validator backed by Vest.
   *
   * Notes
   * - This simply forwards to the core directive’s implementation.
   * - See {@link NgxFormCoreDirective.createAsyncValidator} for details.
   */
  createAsyncValidator(
    field: string,
    validationOptions: NgxValidationOptions,
  ): AsyncValidatorFn {
    // Delegate to core for minimal, reliable async validation
    return this.#core.createAsyncValidator(field, validationOptions);
  }

  #getCurrentModel(): TModel {
    return mergeValuesAndRawValues<TModel>(this.ngForm.form);
  }

  /**
   * Creates a field validator using toObservable + RxJS pattern for streaming validation
   * Replaces complex resource-based validation with simpler, more efficient approach
   */
  // Advanced streaming validator removed; core handles async validation

  /**
   * Clears the validator cache to prevent memory leaks
   * Called automatically when the component is destroyed
   */
  // No per-field validator cache in full directive anymore

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
