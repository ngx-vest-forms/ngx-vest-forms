/**
 * Core createVestForm factory function - the heart of ngx-vest-forms V2
 * Creates a Vest-first form instance with reactive Angular signals
 */

import { computed, signal, WritableSignal } from '@angular/core';
import type { SuiteResult } from 'vest';

import { computeShowErrors } from './error-strategies';
import { createEnhancedVestFormArray } from './form-arrays';
import { getValueByPath, setValueByPath } from './utils/path-utils';
import { createFieldSetter } from './utils/value-extraction';
import type {
  EnhancedVestForm,
  ErrorDisplayStrategy,
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
  suite: VestSuite,
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

  const initialResult =
    isReactiveSuite && 'get' in suite && typeof suite.get === 'function'
      ? suite.get()
      : suite(model());

  const suiteResult = signal(initialResult);
  let unsubscribe: (() => void) | undefined;

  if (isReactiveSuite) {
    unsubscribe = suite.subscribe((result: SuiteResult<string, string>) => {
      suiteResult.set(result);
    });
  }
  const valid = computed(() => suiteResult().isValid());
  const pending = computed(() => suiteResult().isPending());
  const errors = computed(() => suiteResult().getErrors());
  const submitting = signal(false);
  const hasSubmitted = signal(false);

  // Options with defaults
  const errorStrategy: ErrorDisplayStrategy =
    options.errorStrategy || 'on-touch';
  const enhancedFieldSignalsEnabled = options.enhancedFieldSignals !== false;
  const includeFields = options.includeFields;
  const excludeFields = options.excludeFields || [];

  // Field cache for performance
  const fieldCache = new Map<string, VestField<unknown>>();

  const runSuite = (fieldPath?: string) => {
    const nextResult = suite(model(), fieldPath);
    suiteResult.set(nextResult);
    return nextResult;
  };

  /**
   * Create a VestField instance for a specific path
   */
  function createField<T = unknown>(path: string): VestField<T> {
    // Check cache first
    if (fieldCache.has(path)) {
      const cachedField = fieldCache.get(path);
      if (cachedField) {
        return cachedField as VestField<T>;
      }
    }

    // Create field signals
    const value = computed(() => getValueByPath<T>(model(), path) as T);
    const fieldValid = computed(() => suiteResult().isValid(path));
    const fieldErrors = computed(() => suiteResult().getErrors(path));
    const fieldPending = computed(() => suiteResult().isPending(path));
    const fieldTouched = computed(() => suiteResult().isTested(path));
    const showErrors = computeShowErrors(
      suiteResult,
      path,
      errorStrategy,
      hasSubmitted,
    );

    // Field operations
    const set = createFieldSetter((newValue: T) => {
      const updatedModel = setValueByPath(model(), path, newValue);
      model.set(updatedModel);
      runSuite(path);
    });

    const touch = () => {
      runSuite(path);
    };

    const reset = () => {
      const initialValue = getValueByPath(initialModel as TModel, path);
      const resetModel = setValueByPath(model(), path, initialValue);
      model.set(resetModel);
      // Reset field state in Vest (if supported)
      if (suite.resetField) {
        suite.resetField(path);
      }
      runSuite(path);
    };

    const field: VestField<T> = {
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
    fieldCache.set(path, field);
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

    field: <K extends keyof TModel>(path: K | string): VestField<any> => {
      return createField(path as string);
    },

    array: (path: string) => {
      return createEnhancedVestFormArray(
        model,
        path,
        suite,
        suiteResult,
        createField,
      );
    },

    validate: (fieldPath?: string) => {
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
            (result as any).done(() => resolve());
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
      runSuite();
    },

    resetField: (path: string) => {
      const field = createField(path);
      field.reset();
    },

    dispose: () => {
      unsubscribe?.();
      fieldCache.clear();
    },
  };

  // Enhanced Field Signals API using Proxy
  if (enhancedFieldSignalsEnabled) {
    return createEnhancedProxy(vestForm, includeFields, excludeFields);
  }

  return vestForm as EnhancedVestForm<TModel>;
}

/**
 * Create a Proxy that provides the Enhanced Field Signals API
 * Automatically generates field accessors like form.email(), form.emailValid(), etc.
 */
function createEnhancedProxy<TModel extends Record<string, any>>(
  vestForm: VestForm<TModel>,
  includeFields?: string[],
  excludeFields: string[] = [],
): EnhancedVestForm<TModel> {
  return new Proxy(vestForm, {
    get(target, property: string | symbol, receiver) {
      // First, try to get the property from the original form
      const originalValue = Reflect.get(target, property, receiver);
      if (originalValue !== undefined) {
        return originalValue;
      }

      // Only process string properties
      if (typeof property !== 'string') {
        return originalValue;
      }

      // Check if this field should be included/excluded
      if (includeFields && !includeFields.includes(property)) {
        return originalValue;
      }
      if (excludeFields.includes(property)) {
        return originalValue;
      }

      // Try to match Enhanced Field Signals API patterns
      const field = tryMatchFieldPattern(property, target);
      if (field !== undefined) {
        return field;
      }

      return originalValue;
    },
  }) as EnhancedVestForm<TModel>;
}

/**
 * Try to match a property name against Enhanced Field Signals API patterns
 */
function tryMatchFieldPattern(property: string, vestForm: VestForm<any>): any {
  // Pattern: fieldName() - returns field value signal (as callable function)
  if (
    !property.includes('Valid') &&
    !property.includes('Errors') &&
    !property.includes('Pending') &&
    !property.includes('Touched') &&
    !property.includes('ShowErrors') &&
    !property.startsWith('set') &&
    !property.startsWith('touch') &&
    !property.startsWith('reset')
  ) {
    const field = vestForm.field(property);
    // Return the signal itself (signals are callable)
    return field.value;
  }

  // Pattern: fieldNameValid() - returns field validity signal
  if (property.endsWith('Valid')) {
    const fieldName = property.slice(0, -5); // Remove 'Valid'
    const field = vestForm.field(fieldName);
    return field.valid;
  }

  // Pattern: fieldNameErrors() - returns field errors signal
  if (property.endsWith('Errors')) {
    const fieldName = property.slice(0, -6); // Remove 'Errors'
    const field = vestForm.field(fieldName);
    return field.errors;
  }

  // Pattern: fieldNamePending() - returns field pending signal
  if (property.endsWith('Pending')) {
    const fieldName = property.slice(0, -7); // Remove 'Pending'
    const field = vestForm.field(fieldName);
    return field.pending;
  }

  // Pattern: fieldNameTouched() - returns field touched signal
  if (property.endsWith('Touched')) {
    const fieldName = property.slice(0, -7); // Remove 'Touched'
    const field = vestForm.field(fieldName);
    return field.touched;
  }

  // Pattern: fieldNameShowErrors() - returns field show errors signal
  if (property.endsWith('ShowErrors')) {
    const fieldName = property.slice(0, -10); // Remove 'ShowErrors'
    const field = vestForm.field(fieldName);
    return field.showErrors;
  }

  // Pattern: setFieldName() - returns field setter function
  if (property.startsWith('set') && property.length > 3) {
    const fieldName = property.charAt(3).toLowerCase() + property.slice(4);
    const field = vestForm.field(fieldName);
    return field.set;
  }

  // Pattern: touchFieldName() - returns field touch function
  if (property.startsWith('touch') && property.length > 5) {
    const fieldName = property.charAt(5).toLowerCase() + property.slice(6);
    const field = vestForm.field(fieldName);
    return field.touch;
  }

  // Pattern: resetFieldName() - returns field reset function
  if (property.startsWith('reset') && property.length > 5) {
    const fieldName = property.charAt(5).toLowerCase() + property.slice(6);
    const field = vestForm.field(fieldName);
    return field.reset;
  }

  return undefined;
}
