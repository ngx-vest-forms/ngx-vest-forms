/**
 * Utility helpers for building the Derived Field Signals registry.
 *
 * Extracted from `create-vest-form` to make the proxy implementation easier to
 * reason about and to keep the derived API logic colocated. The registry is in
 * charge of translating dot-notation field paths into the generated camelCase
 * accessors documented in `docs/inverted-vest/derived-field-signals.md`.
 */

import type { Path, VestField, VestForm } from '../vest-form.types';

type DerivedAccessor =
  | 'value'
  | 'valid'
  | 'errors'
  | 'warnings'
  | 'validation'
  | 'pending'
  | 'touched'
  | 'showErrors'
  | 'showWarnings'
  | 'field'
  | 'set'
  | 'touch'
  | 'reset';

type DerivedDescriptor = {
  fieldPath: string;
  accessor: DerivedAccessor;
};

type DerivedRegistry = {
  has(property: string): boolean;
  get(property: string): unknown;
};

export function createDerivedRegistry<TModel extends Record<string, unknown>>(
  vestForm: VestForm<TModel>,
  includeFields?: string[],
  excludeFields: string[] = [],
): DerivedRegistry {
  const descriptors = new Map<string, DerivedDescriptor>();
  const cache = new Map<string, unknown>();
  const fieldCache = new Map<string, VestField<unknown>>();

  const modelSnapshot = vestForm.model();
  const fieldPaths = filterFieldPaths(
    collectFieldPaths(modelSnapshot),
    includeFields,
    excludeFields,
  );

  const debugEnabled =
    (typeof process !== 'undefined' &&
      process.env?.['VEST_DEBUG_REGISTRY'] === '1') ||
    (typeof globalThis !== 'undefined' &&
      Boolean(
        (globalThis as Record<string, unknown>)['__VEST_DEBUG_REGISTRY__'],
      ));

  if (debugEnabled) {
    console.log('derived registry field paths', {
      includeFields,
      excludeFields,
      fieldPaths: [...fieldPaths],
    });
  }

  const descriptorKeys: string[] = [];

  for (const fieldPath of fieldPaths) {
    const baseName = toDerivedBaseName(fieldPath);
    const capitalised = capitalise(baseName);

    // Value and state signals
    descriptors.set(baseName, { fieldPath, accessor: 'value' });
    descriptorKeys.push(baseName);
    descriptors.set(`${baseName}Valid`, { fieldPath, accessor: 'valid' });
    descriptorKeys.push(`${baseName}Valid`);
    descriptors.set(`${baseName}Pending`, { fieldPath, accessor: 'pending' });
    descriptorKeys.push(`${baseName}Pending`);
    descriptors.set(`${baseName}Touched`, { fieldPath, accessor: 'touched' });
    descriptorKeys.push(`${baseName}Touched`);
    descriptors.set(`${baseName}ShowErrors`, {
      fieldPath,
      accessor: 'showErrors',
    });
    descriptorKeys.push(`${baseName}ShowErrors`);
    descriptors.set(`${baseName}ShowWarnings`, {
      fieldPath,
      accessor: 'showWarnings',
    });
    descriptorKeys.push(`${baseName}ShowWarnings`);

    // Validation signals (errors, warnings, validation)
    descriptors.set(`${baseName}Errors`, { fieldPath, accessor: 'errors' });
    descriptorKeys.push(`${baseName}Errors`);
    descriptors.set(`${baseName}Warnings`, { fieldPath, accessor: 'warnings' });
    descriptorKeys.push(`${baseName}Warnings`);
    descriptors.set(`${baseName}Validation`, {
      fieldPath,
      accessor: 'validation',
    });
    descriptorKeys.push(`${baseName}Validation`);

    // Field object accessor (PRIMARY for ngx-form-error component)
    descriptors.set(`${baseName}Field`, { fieldPath, accessor: 'field' });
    descriptorKeys.push(`${baseName}Field`);

    // Method accessors
    descriptors.set(`set${capitalised}`, { fieldPath, accessor: 'set' });
    descriptorKeys.push(`set${capitalised}`);
    descriptors.set(`touch${capitalised}`, { fieldPath, accessor: 'touch' });
    descriptorKeys.push(`touch${capitalised}`);
    descriptors.set(`reset${capitalised}`, { fieldPath, accessor: 'reset' });
    descriptorKeys.push(`reset${capitalised}`);
  }

  return {
    has(property: string) {
      return descriptors.has(property);
    },
    get(property: string) {
      if (cache.has(property)) {
        return cache.get(property);
      }

      const descriptor = descriptors.get(property);
      if (!descriptor) {
        return;
      }

      const field = getField(descriptor.fieldPath);
      const value = selectAccessor(field, descriptor.accessor);
      cache.set(property, value);
      return value;
    },
  };

  function getField(path: string) {
    if (fieldCache.has(path)) {
      return fieldCache.get(path) as VestField<unknown>;
    }

    const field = vestForm.field(path as Path<TModel>);
    fieldCache.set(path, field as VestField<unknown>);
    return field;
  }

  function selectAccessor(
    field: VestField<unknown>,
    accessor: DerivedAccessor,
  ): unknown {
    switch (accessor) {
      case 'value': {
        return field.value;
      }
      case 'valid': {
        return field.valid;
      }
      case 'errors': {
        return field.errors;
      }
      case 'warnings': {
        return field.warnings;
      }
      case 'validation': {
        return field.validation;
      }
      case 'pending': {
        return field.pending;
      }
      case 'touched': {
        return field.touched;
      }
      case 'showErrors': {
        return field.showErrors;
      }
      case 'showWarnings': {
        return field.showWarnings;
      }
      case 'field': {
        // Return a function that returns the entire VestField object for ngx-form-error component
        // This matches the type signature: emailField(): VestField<string>
        return () => field;
      }
      case 'set': {
        return field.set;
      }
      case 'touch': {
        return field.touch;
      }
      case 'reset': {
        return field.reset;
      }
      default: {
        return field.value;
      }
    }
  }
}

export function collectFieldPaths(
  value: unknown,
  prefix = '',
  accumulator: string[] = [],
): string[] {
  if (value === null || value === undefined) {
    if (prefix) {
      accumulator.push(prefix);
    }
    return accumulator;
  }

  if (Array.isArray(value)) {
    if (prefix) {
      accumulator.push(prefix);
    }
    for (const [index, item] of value.entries()) {
      const nextPrefix = prefix ? `${prefix}.${index}` : `${index}`;
      collectFieldPaths(item, nextPrefix, accumulator);
    }
    return accumulator;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      if (prefix) {
        accumulator.push(prefix);
      }
      return accumulator;
    }

    for (const [key, nestedValue] of entries) {
      const nextPrefix = prefix ? `${prefix}.${key}` : key;
      collectFieldPaths(nestedValue, nextPrefix, accumulator);
    }
    return accumulator;
  }

  if (prefix) {
    accumulator.push(prefix);
  }

  return accumulator;
}

export function filterFieldPaths(
  paths: string[],
  include?: string[],
  exclude: string[] = [],
): string[] {
  const includeAll = !include || include.length === 0;
  return paths.filter((path) => {
    if (
      !includeAll &&
      include &&
      !include.some((pattern) => matchesPattern(pattern, path))
    ) {
      return false;
    }

    if (exclude.some((pattern) => matchesPattern(pattern, path))) {
      return false;
    }

    return true;
  });
}

export function matchesPattern(pattern: string, path: string): boolean {
  if (pattern.endsWith('.*')) {
    const prefix = pattern.slice(0, -2);
    return path === prefix || path.startsWith(`${prefix}.`);
  }

  return pattern === path;
}

export function toDerivedBaseName(path: string): string {
  const segments = path.split('.');
  return segments
    .map((segment, index) =>
      index === 0
        ? segment
        : `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`,
    )
    .join('');
}

export function capitalise(value: string): string {
  if (!value) {
    return value;
  }

  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
