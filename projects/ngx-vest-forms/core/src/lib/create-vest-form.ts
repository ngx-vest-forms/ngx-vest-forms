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

  const runSuite = <P extends Path<TModel>>(fieldPath?: P) => {
    let nextResult = suite(model(), fieldPath);

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
