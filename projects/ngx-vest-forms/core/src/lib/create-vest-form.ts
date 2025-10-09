/**
 * Core createVestForm factory function - the heart of ngx-vest-forms V2
 * Creates a Vest-first form instance with reactive Angular signals
 */

import {
  computed,
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  signal,
  type Signal,
  WritableSignal,
} from '@angular/core';
import type { SuiteResult } from 'vest';

import { createEnhancedProxy } from './enhanced-proxy';
import { createEnhancedVestFormArray } from './form-arrays';
import { NGX_VEST_FORM, NGX_VEST_FORMS_CONFIG } from './tokens';
import { getValueByPath, setValueByPath } from './utils/path-utils';
import { parseStructuredErrors } from './utils/structured-errors';
import { isSignal } from './utils/type-helpers';
import { createFieldSetter } from './utils/value-extraction';
import type {
  EnhancedVestForm,
  ErrorDisplayStrategy,
  Path,
  PathValue,
  SubmitResult,
  SubmittedStatus,
  VestField,
  VestForm,
  VestFormOptions,
} from './vest-form.types';

/**
 * Create a new VestForm instance with reactive state management
 *
 * **Parameter Order (v2.0 - BREAKING CHANGE):**
 * - `model` first (aligns with Angular Signal Forms pattern)
 * - `options` second (includes required `suite` + optional configuration)
 *
 * @param initialModel - Initial form data (can be signal or plain object)
 * @param options - Configuration options (includes required `suite` validation logic)
 * @returns VestForm instance with Enhanced Field Signals API
 *
 * @example
 * ```typescript
 * /// Basic usage
 * const form = createVestForm(
 *   signal({ email: '', age: 0 }),
 *   { suite: userValidations }
 * );
 *
 * /// With Standard Schema (Zod)
 * const form = createVestForm(
 *   signal({ email: '', age: 0 }),
 *   {
 *     suite: userValidations,
 *     schema: UserSchema // Two-layer validation
 *   }
 * );
 * ```
 */
export function createVestForm<TModel extends Record<string, unknown>>(
  initialModel: TModel | WritableSignal<TModel>,
  options: VestFormOptions<TModel>,
): EnhancedVestForm<TModel> {
  // Extract suite from options
  const { suite, ...restOptions } = options;

  // Validate suite is provided
  if (!suite) {
    throw new Error(
      'createVestForm: suite is required. Please provide a validation suite in the options: createVestForm(model, { suite: yourValidations })',
    );
  }

  // Try to inject global config (optional - only available in injection context)
  let globalConfig;
  try {
    globalConfig = inject(NGX_VEST_FORMS_CONFIG, { optional: true });
  } catch {
    // Not in injection context - that's fine
    globalConfig = null;
  }

  const resolvedErrorStrategy =
    restOptions.errorStrategy ?? globalConfig?.defaultErrorStrategy;

  const mergedOptions: VestFormOptions<TModel> = {
    ...restOptions,
    suite,
    errorStrategy: resolvedErrorStrategy,
  };

  // Normalize the model to a writable signal
  const model =
    typeof initialModel === 'function' && 'set' in initialModel
      ? (initialModel as WritableSignal<TModel>)
      : signal(initialModel as TModel);

  // Capture the initial value for reset operations
  const initialValue = model();

  const isReactiveSuite =
    'subscribe' in suite && typeof suite.subscribe === 'function';

  // Get initial result - for stateful suites (createSafeSuite), run the suite once
  // to initialize state, then use .get(). For static suites, just run it.
  let initialResult;
  if (isReactiveSuite && 'get' in suite && typeof suite.get === 'function') {
    // Run suite once to initialize state (createSafeSuite needs this)
    suite(model());
    initialResult = suite.get();

    // Safety check: if .get() returns undefined, run suite again
    if (!initialResult) {
      initialResult = suite(model());
    }
  } else {
    // Static suite - just run it
    initialResult = suite(model());
  }

  // Final safety check - should never be undefined
  if (!initialResult) {
    throw new Error(
      'createVestForm: Suite returned undefined result. This should not happen. Please check your validation suite implementation.',
    );
  }

  const suiteResult = signal(initialResult);
  // Disabled: See note below about subscriptions
  // let unsubscribe: (() => void) | undefined;
  let lastAsyncRunToken: symbol | null = null;

  // NOTE: Subscriptions are disabled when using `only()` because Vest emits undefined
  // during intermediate validation states. We update suiteResult in runSuite() instead.
  // See test-vest-only.spec.ts for demonstration of this Vest behavior.
  //
  // if (isReactiveSuite && suite.subscribe) {
  //   unsubscribe = suite.subscribe((result: SuiteResult<string, string>) => {
  //     if (result) {
  //       suiteResult.set(result);
  //     }
  //   });
  // }

  const valid = computed(() => {
    // Form is valid only if both schema AND Vest validation pass
    const hasSchemaErrors = Object.keys(schemaErrors()).length > 0;
    return !hasSchemaErrors && suiteResult().isValid();
  });

  /**
   * Whether the form is invalid (has errors, regardless of pending state)
   *
   * @remarks
   * Note: invalid() is NOT the same as !valid()
   * - invalid() is true when there are VISIBLE errors (respecting errorStrategy)
   * - valid() is true only when there are no errors AND no pending validators
   *
   * This means with 'on-touch' strategy, a pristine form with validation errors
   * will have invalid() = false until fields are touched or form is submitted.
   */
  const invalid = computed(() => {
    // We need to compute visible errors inline here because visibleErrors()
    // is defined later and would create a circular dependency
    const allErrors = errors();
    const isSubmitted = hasSubmittedInternal();
    const touchedFields = touched();

    // Unwrap strategy (signal or static value)
    const currentStrategy =
      typeof errorStrategy === 'function' ? errorStrategy() : errorStrategy;

    // Check if any field has errors that should be visible based on strategy
    for (const [fieldPath, messages] of Object.entries(allErrors)) {
      if (messages.length === 0) continue;

      let shouldShow = false;

      switch (currentStrategy) {
        case 'immediate': {
          shouldShow = true;
          break;
        }
        case 'on-touch': {
          shouldShow = touchedFields.has(fieldPath) || isSubmitted;
          break;
        }
        case 'on-submit': {
          shouldShow = isSubmitted;
          break;
        }
        case 'manual': {
          shouldShow = false;
          break;
        }
        default: {
          // Default to 'on-touch' behavior
          shouldShow = touchedFields.has(fieldPath) || isSubmitted;
        }
      }

      if (shouldShow) {
        return true; // At least one error should be visible
      }
    }

    return false; // No visible errors
  });

  const pending = computed(() => suiteResult().isPending());

  /**
   * Track which fields have been modified from their initial values
   * Map of field path -> initial value for comparison
   */
  const dirtyFields = signal(new Set<string>());

  /**
   * Form-level dirty state - true if any field has been modified
   */
  const dirty = computed(() => dirtyFields().size > 0);

  /**
   * Merged errors from both schema validation (Layer 1) and Vest validation (Layer 2)
   * Schema errors are prioritized (appear first) as they represent structural/type issues
   */
  const errors = computed(() => {
    const vestErrors = suiteResult().getErrors();
    const currentSchemaErrors = schemaErrors();

    // If no schema errors, return just Vest errors
    if (Object.keys(currentSchemaErrors).length === 0) {
      return vestErrors;
    }

    // Merge schema errors with Vest errors (schema errors first)
    const merged: Record<string, string[]> = { ...currentSchemaErrors };

    for (const [path, messages] of Object.entries(vestErrors)) {
      merged[path] = merged[path]
        ? [...merged[path], ...messages] // Append to existing schema errors
        : messages; // No schema errors for this field
    }

    return merged;
  });

  const submitting = signal(false);
  const hasSubmittedInternal = signal(false);

  /**
   * Form submission status (Angular Signal Forms compatible)
   * Consolidates submission state into a single signal with 3 states
   */
  const submittedStatus = computed<SubmittedStatus>(() => {
    if (submitting()) return 'submitting';
    if (hasSubmittedInternal()) return 'submitted';
    return 'unsubmitted';
  });

  /**
   * Convenience computed signal that filters errors based on the error display strategy.
   * Only includes errors for fields where showErrors() returns true.
   *
   * This is useful for components like debuggers or error summaries that should
   * respect the form's errorStrategy (immediate, on-touch, on-submit, manual).
   *
   * Note: Individual field error display should still use field.showErrors()
   * for proper field-level control.
   */
  const visibleErrors = computed(() => {
    const allErrors = errors();
    const visibleErrorsMap: Record<string, string[]> = {};

    // Filter errors based on each field's showErrors state
    for (const [fieldPath, messages] of Object.entries(allErrors)) {
      if (messages.length === 0) continue;

      // Check if this field should show errors based on the strategy
      const field = createField(fieldPath as Path<TModel>);
      if (field.showErrors()) {
        visibleErrorsMap[fieldPath] = messages;
      }
    }

    return visibleErrorsMap;
  });

  /**
   * Filtered schema errors that respect the error display strategy.
   * Only includes schema errors for fields that should show errors based on
   * touch state, submit state, and the current errorStrategy.
   *
   * This ensures schema validation errors (Layer 1) behave consistently with
   * Vest validation errors (Layer 2) in terms of when they're displayed to users.
   */
  const visibleSchemaErrors = computed(() => {
    const allSchemaErrors = schemaErrors();
    const visibleSchemaErrorsMap: Record<string, string[]> = {};
    const isSubmitted = hasSubmittedInternal();
    const touchedFields = touched();

    // Unwrap strategy (always a signal or function)
    const currentStrategy =
      typeof errorStrategy === 'function' ? errorStrategy() : errorStrategy;

    // Filter schema errors based on the error display strategy
    for (const [fieldPath, messages] of Object.entries(allSchemaErrors)) {
      if (messages.length === 0) continue;

      let shouldShow = false;

      switch (currentStrategy) {
        case 'immediate': {
          // Always show schema errors in immediate mode
          shouldShow = true;
          break;
        }

        case 'on-touch': {
          // Show errors after field has been touched OR form has been submitted
          shouldShow = touchedFields.has(fieldPath) || isSubmitted;
          break;
        }

        case 'on-submit': {
          // Show errors only after form submission attempt
          shouldShow = isSubmitted;
          break;
        }

        case 'manual': {
          // Never show errors automatically
          shouldShow = false;
          break;
        }

        default: {
          // Default to 'on-touch' behavior
          shouldShow = touchedFields.has(fieldPath) || isSubmitted;
        }
      }

      if (shouldShow) {
        visibleSchemaErrorsMap[fieldPath] = messages;
      }
    }

    return visibleSchemaErrorsMap;
  });
  // Tracks which fields the user interacted with so UX decisions aren't tied to
  // Vest's internal `isTested` flag (which fires during suite execution).
  const touched = signal(new Set<string>());

  // Options with defaults
  // Preserve errorStrategy signal reference for reactivity
  let errorStrategy: ErrorDisplayStrategy | Signal<ErrorDisplayStrategy>;
  if (isSignal(mergedOptions.errorStrategy)) {
    errorStrategy = mergedOptions.errorStrategy;
  } else if (mergedOptions.errorStrategy) {
    errorStrategy = mergedOptions.errorStrategy;
  } else {
    errorStrategy = signal<ErrorDisplayStrategy>('on-touch');
  }
  const enhancedFieldSignalsEnabled =
    mergedOptions.enhancedFieldSignals !== false;
  const includeFields = mergedOptions.includeFields;
  const excludeFields = mergedOptions.excludeFields || [];
  const schema = mergedOptions.schema;

  // Track schema validation errors separately
  const schemaErrors = signal<Record<string, string[]>>({});

  /**
   * Run schema validation (Layer 1 - Type/Structure validation)
   * Runs synchronously or asynchronously depending on schema implementation
   */
  const runSchemaValidation = (data: Partial<TModel>): void => {
    if (!schema) {
      schemaErrors.set({});
      return;
    }

    const validationResult = schema['~standard'].validate(data);

    // Handle synchronous validation
    if (!(validationResult instanceof Promise)) {
      if (validationResult.issues) {
        // Convert Standard Schema issues to field-path keyed errors
        const errors: Record<string, string[]> = {};
        for (const issue of validationResult.issues) {
          const pathString = issue.path
            ? issue.path
                .map((segment) =>
                  typeof segment === 'object' && 'key' in segment
                    ? String(segment.key)
                    : String(segment),
                )
                .join('.')
            : 'ROOT_FORM';

          if (!errors[pathString]) {
            errors[pathString] = [];
          }
          errors[pathString].push(issue.message);
        }
        schemaErrors.set(errors);
      } else {
        schemaErrors.set({});
      }
      return;
    }

    // Handle async validation
    validationResult
      .then((result) => {
        if (result.issues) {
          const errors: Record<string, string[]> = {};
          for (const issue of result.issues) {
            const pathString = issue.path
              ? issue.path
                  .map((segment) =>
                    typeof segment === 'object' && 'key' in segment
                      ? String(segment.key)
                      : String(segment),
                  )
                  .join('.')
              : 'ROOT_FORM';

            if (!errors[pathString]) {
              errors[pathString] = [];
            }
            errors[pathString].push(issue.message);
          }
          schemaErrors.set(errors);
        } else {
          schemaErrors.set({});
        }
      })
      .catch((error) => {
        console.error('Schema validation error:', error);
        schemaErrors.set({
          ROOT_FORM: ['Schema validation failed'],
        });
      });
  };

  // ✅ Run initial schema validation on form creation
  runSchemaValidation(model());

  /**
   * Run validation suite - simplified two-mode approach with optional schema pre-validation.
   *
   * Mode 1: Field-specific validation (when fieldPath provided)
   * - Validates only the specified field using Vest's only() mechanism
   * - Used during user input (set/touch operations)
   *
   * Mode 2: Full form validation (no fieldPath)
   * - Validates all fields
   * - Used during submit() and reset() operations
   *
   * Schema Integration:
   * - If schema option provided, runs StandardSchemaV1 validation first
   * - Schema errors are tracked separately and merged with Vest errors
   * - Vest validation runs regardless of schema errors (both layers always run)
   */
  const runSuite = <P extends Path<TModel>>(fieldPath?: P) => {
    const currentResult = suiteResult();

    // Run schema validation if provided (Layer 1)
    runSchemaValidation(model());

    const currentModel = model();

    // Simple two-mode logic: field-specific OR full form
    const nextResult = fieldPath
      ? suite(currentModel, fieldPath) // Mode 1: single field
      : suite(currentModel); // Mode 2: full form

    // Safety check - suite should never return undefined
    if (!nextResult) {
      console.error('createVestForm: Suite returned undefined result');
      return currentResult; // Return previous result to prevent crashes
    }

    // Update the suite result signal immediately with the new result
    suiteResult.set(nextResult);

    // Handle async validation completion
    // The .done() callback receives the FINAL result after async completes
    // We just need to update our signal with this final result
    if (nextResult.isPending()) {
      if ('done' in nextResult && typeof nextResult.done === 'function') {
        const asyncRunToken = Symbol('vest-async-run');
        lastAsyncRunToken = asyncRunToken;

        nextResult.done((finalResult: SuiteResult<string, string>) => {
          // Check if this is still the latest async run
          if (lastAsyncRunToken !== asyncRunToken) {
            return;
          }

          lastAsyncRunToken = null;

          // The finalResult passed to .done() is already the completed result
          // from Vest - we just update our signal with it
          if (finalResult) {
            suiteResult.set(finalResult);
          }
        });
      }
    } else {
      lastAsyncRunToken = null;
    }

    return nextResult;
  };

  /**
   * Create a VestField instance for a specific path with proper typing.
   * Angular's computed() provides automatic memoization, so no manual cache needed.
   */
  function createField<P extends Path<TModel>>(
    path: P,
  ): VestField<PathValue<TModel, P>> {
    // Create field signals with proper typing
    const pathKey = String(path);
    const value = computed<PathValue<TModel, P>>(
      () => getValueByPath(model(), path) as PathValue<TModel, P>,
    );
    // ✅ Use merged errors (schema + vest) instead of just vest errors
    const fieldErrors = computed(() => errors()[path] || []);
    const fieldWarnings = computed(() => suiteResult().getWarnings(path));
    const fieldValidation = computed(() => ({
      errors: fieldErrors(),
      warnings: fieldWarnings(),
      structuredErrors: parseStructuredErrors(fieldErrors()),
      structuredWarnings: parseStructuredErrors(fieldWarnings()),
    }));
    const fieldValid = computed(() => fieldErrors().length === 0);

    /**
     * Field is invalid if it has errors, regardless of pending state
     * This differs from valid() which requires no errors AND no pending
     */
    const fieldInvalid = computed(() => fieldErrors().length > 0);

    const fieldPending = computed(() => suiteResult().isPending(path));
    const fieldTouched = computed(() => touched().has(pathKey));

    /**
     * Field is dirty if it has been modified from its initial value
     */
    const fieldDirty = computed(() => dirtyFields().has(pathKey));

    // ✅ BUG FIX: computeShowErrors needs to check merged errors, not just vest errors
    // Create a wrapper computed that checks if the field has any errors (schema + vest)
    const hasFieldErrors = computed(() => fieldErrors().length > 0);
    const hasSchemaErrorsForField = computed(
      () => (schemaErrors()[path] || []).length > 0,
    );

    const showErrors = computed(() => {
      const currentHasErrors = hasFieldErrors();
      const isTested = suiteResult().isTested(path);
      const isSubmitted = hasSubmittedInternal();
      const fieldIsTouched = fieldTouched();
      const hasSchemaErrors = hasSchemaErrorsForField();
      const effectiveTouched = fieldIsTouched;

      if (!currentHasErrors) {
        return false; // No errors to show
      }

      // Unwrap strategy (always a signal or function)
      const currentStrategy =
        typeof errorStrategy === 'function' ? errorStrategy() : errorStrategy;

      switch (currentStrategy) {
        case 'immediate': {
          // Show errors as soon as validation produces them
          // For schema errors: always show immediately (no testing needed)
          // For Vest errors: show when tested
          return currentHasErrors && (isTested || hasSchemaErrors);
        }

        case 'on-touch': {
          // Show errors after field has been explicitly touched (blur) OR form has been submitted
          return (effectiveTouched || isSubmitted) && currentHasErrors;
        }

        case 'on-submit': {
          // Show errors only after form submission attempt
          // For schema errors: show after submit
          // For Vest errors: show after submit AND tested
          return (
            isSubmitted && currentHasErrors && (isTested || hasSchemaErrors)
          );
        }

        case 'manual': {
          // Never show errors automatically
          return false;
        }

        default: {
          // Default to 'on-touch' behavior
          return (effectiveTouched || isSubmitted) && currentHasErrors;
        }
      }
    });

    const showWarnings = computed(() => {
      // Show warnings when field is valid (no errors) and has been tested
      return (
        fieldValid() &&
        suiteResult().isTested(path) &&
        fieldWarnings().length > 0
      );
    });

    // Field operations with proper typing
    const set = createFieldSetter((newValue: PathValue<TModel, P>) => {
      const initialFieldValue = getValueByPath(initialValue, path);

      // Track dirty state if value differs from initial
      if (newValue === initialFieldValue) {
        // Value matches initial - remove from dirty set
        dirtyFields.update((current) => {
          if (!current.has(pathKey)) {
            return current; // Already clean
          }
          const next = new Set(current);
          next.delete(pathKey);
          return next;
        });
      } else {
        // Value differs from initial - mark as dirty
        dirtyFields.update((current) => {
          if (current.has(pathKey)) {
            return current; // Already dirty
          }
          const next = new Set(current);
          next.add(pathKey);
          return next;
        });
      }

      const updatedModel = setValueByPath(model(), path, newValue);
      model.set(updatedModel);
      // ✅ WCAG COMPLIANCE: set() validates but does NOT mark as touched
      // Only markAsTouched() should modify touch state
      // ✅ VEST BEST PRACTICE: Validate only this field (+ dependencies via include().when())
      // Vest merges results from previous runs, so other field errors remain visible
      // Cross-field validation should use Vest's include().when() pattern

      const requiresFullValidation = /\.\d+(?:\.|$)/.test(pathKey);
      runSuite((requiresFullValidation ? undefined : path) as P | undefined);
    });

    /**
     * Mark field as touched without changing value
     * Aligns with Angular Forms API
     */
    const markAsTouched = () => {
      touched.update((current) => {
        if (current.has(pathKey)) {
          return current;
        }
        const next = new Set(current);
        next.add(pathKey);
        return next;
      });
      runSuite(path);
    };

    /**
     * Mark field as dirty programmatically
     * Useful for custom validation scenarios
     */
    const markAsDirty = () => {
      dirtyFields.update((current) => {
        if (current.has(pathKey)) {
          return current;
        }
        const next = new Set(current);
        next.add(pathKey);
        return next;
      });
    };

    const reset = () => {
      const fieldInitialValue = getValueByPath(initialValue, path);
      if (fieldInitialValue !== undefined) {
        const resetModel = setValueByPath(model(), path, fieldInitialValue);
        model.set(resetModel);
      }
      // Reset field state in Vest (if supported)
      if (suite.resetField) {
        suite.resetField(path);
      }

      // Clear touched state
      touched.update((current) => {
        if (!current.has(pathKey)) {
          return current;
        }
        const next = new Set(current);
        next.delete(pathKey);
        return next;
      });

      // Clear dirty state
      dirtyFields.update((current) => {
        if (!current.has(pathKey)) {
          return current;
        }
        const next = new Set(current);
        next.delete(pathKey);
        return next;
      });
      runSuite();
    };

    const field: VestField<PathValue<TModel, P>> = {
      value,
      valid: fieldValid,
      invalid: fieldInvalid,
      dirty: fieldDirty,
      validation: fieldValidation,
      pending: fieldPending,
      touched: fieldTouched,
      showErrors,
      showWarnings,
      fieldName: pathKey,
      set,
      markAsTouched,
      markAsDirty,
      reset,
    };

    return field;
  }

  /**
   * Form-level operations
   */
  const formProviders: EnvironmentProviders = makeEnvironmentProviders([
    {
      provide: NGX_VEST_FORM,
      useFactory: () => vestForm,
    },
  ]);

  const vestForm: VestForm<TModel> = {
    model,
    result: suiteResult,
    valid,
    invalid,
    dirty,
    pending,
    errors,
    visibleErrors,
    submitting,
    submittedStatus,
    errorStrategy,
    schemaErrors: schemaErrors.asReadonly(), // ✅ Expose schema errors (unfiltered)
    visibleSchemaErrors, // ✅ Expose filtered schema errors

    field: <P extends Path<TModel>>(
      path: P,
    ): VestField<PathValue<TModel, P>> => {
      return createField(path);
    },

    array: <P extends Path<TModel>>(path: P) => {
      return createEnhancedVestFormArray(
        model,
        path,
        suite,
        suiteResult,
        (fieldPath) => createField(fieldPath as Path<TModel>),
        (targetPath) => runSuite(targetPath as Path<TModel>),
      );
    },

    validate: <P extends Path<TModel>>(fieldPath?: P) => {
      return runSuite(fieldPath);
    },

    submit: async (): Promise<SubmitResult<TModel>> => {
      submitting.set(true);
      hasSubmittedInternal.set(true);
      try {
        // Run full validation
        const result = runSuite();

        // Wait for async validations to complete (if any exist)
        // For sync suites, done() fires immediately
        // For async suites, done() fires when all pending async tests complete
        if ('done' in result && typeof result.done === 'function') {
          await new Promise<void>((resolve) => {
            // done() receives finalResult as parameter per Vest docs
            // But we don't need it - we just wait for completion
            (
              result as SuiteResult<string, string> & {
                done: (
                  callback: (finalResult: SuiteResult<string, string>) => void,
                ) => void;
              }
            ).done(() => {
              resolve(); // Signal completion
            });
          });
        }

        // Get the final result after all async operations complete
        // For sync suites, this is the same as the initial result
        // For async suites, we need to get the updated result
        const finalResult = result;

        // Return standardized result object instead of throwing
        return {
          valid: finalResult.isValid(),
          data: model(),
          errors: finalResult.getErrors(),
        };
      } finally {
        submitting.set(false);
      }
    },

    reset: () => {
      model.set(initialValue);
      if (suite.reset) {
        suite.reset();
      }
      hasSubmittedInternal.set(false);
      touched.set(new Set());
      dirtyFields.set(new Set()); // Clear dirty state on reset
      runSuite();
    },

    resetField: <P extends Path<TModel>>(path: P) => {
      const field = createField(path);
      field.reset();
    },

    dispose: () => {
      // unsubscribe?.(); // Disabled - see subscription note above
      touched.set(new Set());
      lastAsyncRunToken = null;
    },

    providers: formProviders,
  };

  // Enhanced Field Signals API using Proxy
  if (enhancedFieldSignalsEnabled) {
    return createEnhancedProxy(vestForm, includeFields, excludeFields);
  }

  return vestForm as EnhancedVestForm<TModel>;
}
