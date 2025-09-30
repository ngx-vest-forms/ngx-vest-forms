/**
 * Core createVestForm factory function - the heart of ngx-vest-forms V2
 * Creates a Vest-first form instance with reactive Angular signals
 */

import { computed, signal, WritableSignal } from '@angular/core';
import type { SuiteResult } from 'vest';

import { createEnhancedProxy } from './enhanced-proxy';
import { computeShowErrors } from './error-strategies';
import { createEnhancedVestFormArray } from './form-arrays';
import { getValueByPath, setValueByPath } from './utils/path-utils';
import { createFieldSetter } from './utils/value-extraction';
import type {
  EnhancedVestForm,
  ErrorDisplayStrategy,
  Path,
  PathValue,
  VestField,
  VestForm,
  VestFormOptions,
  VestSuite,
} from './vest-form.types';

/**
 * Create a new VestForm instance with reactive state management
 * @param suite - Vest static suite for validation
 * @param initialModel - Initial form data (can be signal or plain object)
 * @param options - Configuration options
 * @returns VestForm instance with Enhanced Field Signals API
 */
export function createVestForm<TModel extends Record<string, unknown>>(
  suite: VestSuite<TModel>,
  initialModel: TModel | WritableSignal<TModel>,
  options: VestFormOptions = {},
): EnhancedVestForm<TModel> {
  // Normalize the model to a writable signal
  const model =
    typeof initialModel === 'function' && 'set' in initialModel
      ? (initialModel as WritableSignal<TModel>)
      : signal(initialModel as TModel);

  const isReactiveSuite =
    'subscribe' in suite && typeof suite.subscribe === 'function';

  // For static suites, get an empty result first to avoid marking fields as tested
  const initialResult =
    isReactiveSuite && 'get' in suite && typeof suite.get === 'function'
      ? suite.get()
      : suite(model());

  const suiteResult = signal(initialResult);
  let unsubscribe: (() => void) | undefined;

  if (isReactiveSuite && suite.subscribe) {
    unsubscribe = suite.subscribe((result: SuiteResult<string, string>) => {
      suiteResult.set(result);
    });
  }
  const valid = computed(() => suiteResult().isValid());
  const pending = computed(() => suiteResult().isPending());
  const errors = computed(() => suiteResult().getErrors());
  const submitting = signal(false);
  const hasSubmitted = signal(false);

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
  // Tracks which fields the user interacted with so UX decisions aren't tied to
  // Vest's internal `isTested` flag (which fires during suite execution).
  const touched = signal(new Set<string>());

  // Options with defaults
  const errorStrategy: ErrorDisplayStrategy =
    options.errorStrategy || 'on-touch';
  const enhancedFieldSignalsEnabled = options.enhancedFieldSignals !== false;
  const includeFields = options.includeFields;
  const excludeFields = options.excludeFields || [];

  // Field cache for performance
  const fieldCache = new Map<string, VestField<unknown>>();

  /**
   * Run validation suite with proper field accumulation.
   *
   * IMPORTANT: To meet WCAG 2.2 accessibility requirements, we MUST show all
   * validation errors for fields the user has touched, not just the current field.
   *
   * When a user touches field A (gets error), then touches field B (gets error),
   * BOTH errors must remain visible. Errors should never disappear when touching
   * another field - this creates confusion and violates accessibility standards.
   *
   * Strategy:
   * - If no field specified (form-level validation): validate ALL fields
   * - If field specified AND it's the only touched field: validate just that field (optimization)
   * - If field specified AND other fields are touched: validate ALL touched fields (accumulation)
   */
  const runSuite = <P extends Path<TModel>>(fieldPath?: P) => {
    const touchedFields = touched();

    // Add current field to touched set if specified
    if (fieldPath) {
      const fieldPathString = String(fieldPath);
      if (!touchedFields.has(fieldPathString)) {
        touched.update((current) => {
          const next = new Set(current);
          next.add(fieldPathString);
          return next;
        });
      }
    }

    // Determine validation strategy based on touched fields
    let nextResult: SuiteResult<string, string>;

    if (!fieldPath || touchedFields.size === 0) {
      // Form-level validation or no touched fields: validate everything
      nextResult = suite(model());
    } else if (
      touchedFields.size === 1 &&
      touchedFields.has(String(fieldPath))
    ) {
      // Only one field touched (current field): optimize by validating just this field
      nextResult = suite(model(), fieldPath);
    } else {
      // Multiple fields touched: validate ALL touched fields to accumulate errors
      // This ensures errors don't disappear when user moves to another field
      nextResult = suite(model());

      // Vest doesn't support validating multiple specific fields via only(),
      // so we validate all fields and filter the result to only show touched fields
      // This is intentional: we need all errors for touched fields to remain visible
    }

    // Fallback: if field validation didn't test the field, run full validation
    if (fieldPath && !nextResult.isTested(String(fieldPath))) {
      nextResult = suite(model());
    }

    suiteResult.set(nextResult);
    return nextResult;
  };

  /**
   * Create a VestField instance for a specific path with proper typing
   */
  function createField<P extends Path<TModel>>(
    path: P,
  ): VestField<PathValue<TModel, P>> {
    // Check cache first
    const cacheKey = String(path);
    if (fieldCache.has(cacheKey)) {
      const cachedField = fieldCache.get(cacheKey);
      if (cachedField) {
        return cachedField as VestField<PathValue<TModel, P>>;
      }
    }

    // Create field signals with proper typing
    const pathKey = String(path);
    const value = computed<PathValue<TModel, P>>(
      () => getValueByPath(model(), path) as PathValue<TModel, P>,
    );
    const fieldErrors = computed(() => suiteResult().getErrors(path));
    const fieldValid = computed(() => fieldErrors().length === 0);
    const fieldPending = computed(() => suiteResult().isPending(path));
    const fieldTouched = computed(() => touched().has(pathKey));
    const showErrors = computeShowErrors(
      suiteResult,
      path,
      errorStrategy,
      hasSubmitted,
      fieldTouched,
    );

    // Field operations with proper typing
    const set = createFieldSetter((newValue: PathValue<TModel, P>) => {
      const updatedModel = setValueByPath(model(), path, newValue);
      model.set(updatedModel);
      touched.update((current) => {
        if (current.has(pathKey)) {
          return current;
        }
        const next = new Set(current);
        next.add(pathKey);
        return next;
      });
      runSuite(path);
    });

    const touch = () => {
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

    const reset = () => {
      const initialValue = getValueByPath(initialModel as TModel, path);
      if (initialValue !== undefined) {
        const resetModel = setValueByPath(model(), path, initialValue);
        model.set(resetModel);
      }
      // Reset field state in Vest (if supported)
      if (suite.resetField) {
        suite.resetField(path);
      }
      touched.update((current) => {
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
      errors: fieldErrors,
      pending: fieldPending,
      touched: fieldTouched,
      showErrors,
      set,
      touch,
      reset,
    };

    // Cache the field
    fieldCache.set(cacheKey, field);
    return field;
  }

  /**
   * Form-level operations
   */
  const vestForm: VestForm<TModel> = {
    model,
    result: suiteResult,
    valid,
    pending,
    errors,
    visibleErrors,
    submitting,
    hasSubmitted,

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
      );
    },

    validate: <P extends Path<TModel>>(fieldPath?: P) => {
      runSuite(fieldPath);
    },

    submit: async (): Promise<TModel> => {
      submitting.set(true);
      hasSubmitted.set(true);
      try {
        // Run full validation
        const result = runSuite();

        // Wait for async validations to complete (if supported)
        if ('done' in result && typeof result.done === 'function') {
          await new Promise<void>((resolve) => {
            // Type assertion for Vest's done method which is not in official types
            (
              result as SuiteResult<string, string> & {
                done: (callback: () => void) => void;
              }
            ).done(() => resolve());
          });
        }

        if (result.isValid()) {
          return model();
        } else {
          throw new Error('Form validation failed');
        }
      } finally {
        submitting.set(false);
      }
    },

    reset: () => {
      model.set(initialModel as TModel);
      fieldCache.clear();
      if (suite.reset) {
        suite.reset();
      }
      hasSubmitted.set(false);
      touched.set(new Set());
      runSuite();
    },

    resetField: <P extends Path<TModel>>(path: P) => {
      const field = createField(path);
      field.reset();
    },

    dispose: () => {
      unsubscribe?.();
      fieldCache.clear();
      touched.set(new Set());
    },
  };

  // Enhanced Field Signals API using Proxy
  if (enhancedFieldSignalsEnabled) {
    return createEnhancedProxy(vestForm, includeFields, excludeFields);
  }

  return vestForm as EnhancedVestForm<TModel>;
}
