/**
 * Converts a flat array to an object with numeric keys.
 * Does not recurse into nested arrays or objects.
 * Uses reduce() for optimal single-pass conversion.
 */
export function arrayToObject<T>(array: T[]): Record<number, T> {
  return array.reduce(
    (acc, value, index) => {
      acc[index] = value;
      return acc;
    },
    {} as Record<number, T>
  );
}

/**
 * Recursively converts arrays to objects with numeric keys, including nested arrays in objects.
 * Useful for template-driven forms that require object structure for nested arrays.
 */
export function deepArrayToObject<T>(array: T[]): Record<number, unknown> {
  return Object.fromEntries(
    array.map((value, index) => [
      index,
      Array.isArray(value)
        ? deepArrayToObject(value as unknown[])
        : value && typeof value === 'object'
          ? recursivelyConvertArrays(value)
          : value,
    ])
  );
}

/**
 * Recursively traverses an object and converts any nested arrays to objects.
 */
function recursivelyConvertArrays(object: unknown): unknown {
  if (Array.isArray(object)) {
    return deepArrayToObject(object as unknown[]);
  }
  if (object && typeof object === 'object') {
    return Object.fromEntries(
      Object.entries(object).map(([key, value]) => [
        key,
        Array.isArray(value)
          ? deepArrayToObject(value as unknown[])
          : value && typeof value === 'object'
            ? recursivelyConvertArrays(value)
            : value,
      ])
    );
  }
  return object;
}

/**
 * Converts selected numeric-keyed object properties back to arrays.
 * Only properties listed in keys will be converted; others remain untouched.
 * Useful for converting form models back to array format before saving/sending to backend.
 */

/**
 * Public API: Convert selected numeric-keyed object properties back to arrays.
 * Note: Conversion is explicit (by key) but will cascade inside converted branches
 * so nested numeric objects representing arrays become real arrays recursively.
 */
export function objectToArray(object: unknown, keys: string[]): unknown {
  const processed = objectToArrayInternal(object, keys);
  if (processed && typeof processed === 'object' && !Array.isArray(processed)) {
    const entries = Object.entries(processed as Record<string, unknown>);
    if (entries.length === 1) {
      const [k, v] = entries[0];
      if (
        keys.includes(k) &&
        Array.isArray(v) &&
        (v as unknown[]).every(
          (element) => typeof element === 'object' && element !== null
        )
      ) {
        return v;
      }
    }
  }
  return processed;
}

/**
 * Internal recursive worker with cascade flag: once a targeted key is converted, all nested numeric objects become arrays even if their keys were not explicitly listed.
 */
function objectToArrayInternal(
  object: unknown,
  keys: string[],
  currentKey?: string,
  parentCascade = false
): unknown {
  if (Array.isArray(object)) {
    // Recursively process each item in the array
    return object.map((item) =>
      objectToArrayInternal(item, keys, undefined, parentCascade)
    );
  }

  if (object && typeof object === 'object') {
    if (isNumericObject(object)) {
      // First, recursively process the contents
      const processedContents: Record<string, unknown> = {};
      let hasChanges = false;

      const explicit = !!currentKey && keys.includes(currentKey);
      const childCascade = parentCascade || explicit;

      for (const [key, value] of Object.entries(object)) {
        const processedValue = objectToArrayInternal(
          value,
          keys,
          key,
          childCascade
        );
        processedContents[key] = processedValue;
        if (processedValue !== value) {
          hasChanges = true;
        }
      }

      // Decision: should we convert this numeric object to an array?
      // Yes, if: explicitly targeted, parent was converted, or children changed.
      const shouldConvert = explicit || parentCascade || hasChanges;

      return shouldConvert
        ? Object.keys(processedContents)
            .sort((a, b) => Number(a) - Number(b))
            .map((k) => processedContents[k])
        : processedContents;
    }

    // For regular objects, process recursively
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(object)) {
      result[key] = objectToArrayInternal(value, keys, key, parentCascade);
    }
    return result;
  }

  return object;
}

/**
 * Checks if a value is an object with only numeric keys (not an array).
 */
function isNumericObject(value: unknown): value is Record<number, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.keys(value).every((k) => /^\d+$/.test(k));
}
