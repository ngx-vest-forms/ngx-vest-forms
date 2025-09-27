import {
  afterNextRender,
  computed,
  DestroyRef,
  Directive,
  inject,
  Injector,
  input,
  isDevMode,
} from '@angular/core';
import {
  takeUntilDestroyed,
  toObservable,
  toSignal,
} from '@angular/core/rxjs-interop';
import { AsyncValidatorFn, FormControlStatus } from '@angular/forms';
import {
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  filter,
  map,
  merge as rxMerge,
  startWith,
  switchMap,
  take,
  tap,
} from 'rxjs';
import {
  NGX_SCHEMA_STATE,
  NgxSchemaValidationState,
} from '../tokens/schema-state.token';
import { NgxFormCoreDirective } from './form-core.directive';
import { NgxValidationOptions } from './validation-options';

// Shared debounce constant for validationConfig trigger handling
// Fallback to 50ms if a central constant is not available in this entrypoint
const VALIDATION_CONFIG_DEBOUNCE_TIME = 50;

// Model typing is schema-agnostic in core/full directive; callers can narrow externally

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
  // Schema is handled by the schemas entrypoint; keep model generic for callers
  TModel = Record<string, unknown>,
> {
  // Compose the minimal core and extend it with advanced features
  readonly #core = inject(NgxFormCoreDirective, { host: true });
  // Forward core inputs for host-dependent directives (e.g., root validator)
  readonly vestSuite = this.#core.vestSuite;
  readonly validationOptions = this.#core.validationOptions;
  // Expose ngForm to match the core API for consumers that work with either directive
  readonly ngForm = this.#core.ngForm;

  /// --- DEPENDENCY INJECTION ---
  readonly #destroyRef = inject(DestroyRef);
  readonly #injector = inject(Injector);
  // Optional schema state accessor provided by schemas entrypoint wrapper
  readonly #schemaState = inject(NGX_SCHEMA_STATE, { optional: true });

  // formValue two-way binding is provided by the core directive via hostDirectives
  readonly validationConfig = input<Record<string, string[]> | null>(null);

  // --- validationConfig internal helpers ---
  // Prevent circular triggering when two fields depend on each other (Issue #19)
  readonly #validationInProgress = new Set<string>();
  // Note: No manual subscription maps needed; we compose streams and
  // rely on switchMap + takeUntilDestroyed for lifecycle management.
  // Note: using shared VALIDATION_CONFIG_DEBOUNCE_TIME constant instead

  /// --- INTERNAL BASE SIGNALS ---
  // Track the Angular form status as a signal for advanced status flags
  readonly #statusSignal = toSignal(
    this.#core.ngForm.form.statusChanges.pipe(
      startWith(this.#core.ngForm.form.status),
    ),
    {
      injector: this.#injector,
      initialValue: this.#core.ngForm.form.status as FormControlStatus,
    },
  );

  /// --- DERIVED STATUS SIGNALS ---
  readonly #isPending = computed(() => this.#statusSignal() === 'PENDING');
  readonly #isDisabled = computed(() => this.#statusSignal() === 'DISABLED');
  readonly #isIdle = computed(() => {
    const status = this.#statusSignal();
    return status !== 'PENDING' && status !== 'DISABLED';
  });

  // Root-level issues (errors/warnings/internal) straight from ngForm
  readonly #rootErrorsAndWarnings = computed<{
    errors?: string[];
    warnings?: string[];
    internalError?: string;
  } | null>(() => {
    // Tie to form status so this recomputes whenever validation runs
    // (statusChanges already tracks both sync and async validator updates)
    this.#statusSignal();
    const rootNGErrors = this.#core.ngForm.form.errors;
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
    const base = this.#core.formState();

    // Reuse core errors; warnings are only added by this directive if provided at root level
    const fieldErrors = (base.errors ?? {}) as Record<string, string[]>;
    const fieldWarnings: Record<string, string[]> = {};

    // Aggregate counts (Vest only, exclude schema-specific issues)
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

    const schemaState = this.#schemaState ? this.#schemaState() : null;
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
      schema: (schemaState ?? undefined) as
        | Exclude<NgxSchemaValidationState, null>
        | undefined,
    } satisfies NgxFormState<TModel>;
  });

  constructor() {
    // Setup validation configuration streams
    this.#setupValidationConfigStreams();

    // Use afterNextRender for better zoneless compatibility
    afterNextRender(() => {
      if (this.#core.ngForm.form && isDevMode()) {
        console.log('[NgxFormDirective] Form initialized after render', {
          status: this.#core.ngForm.form.status,
          hasControls: Object.keys(this.#core.ngForm.form.controls).length > 0,
        });
      }
    });
  }

  #setupValidationConfigStreams(): void {
    const form = this.#core.ngForm.form;
    toObservable(this.validationConfig)
      .pipe(
        distinctUntilChanged(),
        // For each config, compose a merged stream of all trigger pipelines.
        // switchMap ensures previous pipelines are torn down automatically
        // when the config object changes.
        switchMap((config) => {
          if (!config) {
            // Clear any in-progress flags when config becomes null
            this.#validationInProgress.clear();
            return EMPTY;
          }

          const streams = Object.keys(config).map((triggerField) => {
            const dependents = config[triggerField] || [];

            // Stream that rebinds to the trigger control whenever the form structure changes
            const triggerControl$ = form.statusChanges.pipe(
              startWith(form.status),
              // statusChanges also fires on control creation/removal; augment with a debounce
              debounceTime(VALIDATION_CONFIG_DEBOUNCE_TIME),
              tap(() => void 0),
              // Project to the control instance (may be undefined initially)
              // Re-run on each status change until control exists
              map(() => form.get(triggerField)),
              // Proceed only when control is available
              filter((c): c is NonNullable<typeof c> => !!c),
              // Avoid re-subscribing if the control instance is the same
              distinctUntilChanged(),
            );

            return triggerControl$.pipe(
              // For the resolved control, subscribe to valueChanges
              switchMap((control) =>
                control.valueChanges.pipe(
                  // Early guard to prevent re-entrancy during debounce window
                  filter(() => {
                    if (this.#validationInProgress.has(triggerField))
                      return false;
                    this.#validationInProgress.add(triggerField);
                    return true;
                  }),
                  debounceTime(VALIDATION_CONFIG_DEBOUNCE_TIME),
                  // Wait for the form to be idle before updating dependents
                  switchMap(() =>
                    form.statusChanges.pipe(
                      startWith(form.status),
                      filter((s) => s !== 'PENDING'),
                      take(1),
                    ),
                  ),
                  tap(() => {
                    for (const depField of dependents) {
                      const dependentControl = form.get(depField);
                      if (!dependentControl) {
                        if (isDevMode()) {
                          console.warn(
                            `[ngx-vest-forms] Dependent control '${depField}' not found for validationConfig key '${triggerField}'.`,
                          );
                        }
                        continue;
                      }
                      if (!this.#validationInProgress.has(depField)) {
                        dependentControl.updateValueAndValidity({
                          onlySelf: true,
                          emitEvent: false,
                        });
                      }
                    }
                  }),
                  tap(() => this.#validationInProgress.delete(triggerField)),
                ),
              ),
            );
          });

          return streams.length > 0 ? rxMerge(...streams) : EMPTY;
        }),
        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe();
  }

  /**
   * Delegated factory for a per-field async validator backed by Vest.
   * Forwards to the core directive’s implementation.
   */
  createAsyncValidator(
    field: string,
    validationOptions: NgxValidationOptions,
  ): AsyncValidatorFn {
    return this.#core.createAsyncValidator(field, validationOptions);
  }
}
