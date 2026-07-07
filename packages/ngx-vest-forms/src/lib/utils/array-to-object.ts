/**
 * Recursively maps array element types to records keyed by numeric index.
 *
 * This is the type-level counterpart of {@link deepArrayToObject}: arrays
 * become `Record<number, ...>` while non-array objects keep their keys.
 */
export type DeepArrayToObject<T> =
  T extends ReadonlyArray<infer U>
    ? Record<number, DeepArrayToObject<U>>
    : T extends object
      ? { [K in keyof T]: DeepArrayToObject<T[K]> }
      : T;

/**
 * Converts a flat array to an object with numeric keys.
 *
 * Does not recurse into nested arrays or objects. Useful for template-driven
 * forms that require an object structure (numeric keys) instead of an array.
 *
 * @param array - The flat array to convert.
 * @returns An object whose keys are the original array indices.
 *
 * @example
 * ```ts
 * arrayToObject(['a', 'b', 'c']);
 * // => { 0: 'a', 1: 'b', 2: 'c' }
 * ```
 */
export function arrayToObject<T>(array: readonly T[]): Record<number, T> {
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
 *
 * @param array - The (possibly nested) array to convert.
 * @returns A deeply converted object where every array level is keyed by index.
 *
 * @example
 * ```ts
 * deepArrayToObject([{ tags: ['x', 'y'] }]);
 * // => { 0: { tags: { 0: 'x', 1: 'y' } } }
 * ```
 */
export function deepArrayToObject<T>(
  array: readonly T[]
): Record<number, DeepArrayToObject<T>> {
  return Object.fromEntries(
    array.map((value, index) => [
      index,
      Array.isArray(value)
        ? deepArrayToObject(value as unknown[])
        : value && typeof value === 'object'
          ? recursivelyConvertArrays(value)
          : value,
    ])
  ) as Record<number, DeepArrayToObject<T>>;
}

/**
 * Recursively traverses an object and converts any nested arrays to objects.
 */
function recursivelyConvertArrays<T>(object: T): DeepArrayToObject<T> {
  if (Array.isArray(object)) {
    return deepArrayToObject(object as unknown[]) as DeepArrayToObject<T>;
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
    ) as DeepArrayToObject<T>;
  }
  return object as DeepArrayToObject<T>;
}

/**
 * Converts selected numeric-keyed object properties back to arrays.
 * Only properties listed in keys will be converted; others remain untouched.
 * Useful for converting form models back to array format before saving/sending to backend.
 */

/**
 * Public API: Convert selected numeric-keyed object properties back to arrays.
 *
 * Conversion is *explicit by key* (only `keys` are converted) and cascades
 * inside converted branches, so nested numeric-keyed objects representing
 * arrays become real arrays recursively. As a convenience the result is
 * unwrapped to the bare converted array when the input is a single-entry
 * wrapper whose only key was converted.
 *
 * A sound precise return type is not expressible here: the runtime shape
 * depends on the runtime `keys` values and the single-entry unwrap, neither of
 * which is recoverable in the type system. The return is therefore `unknown`;
 * callers that know the concrete result shape should assert it
 * (e.g. `objectToArray(model, ['list']) as { list: string[] }`).
 *
 * @typeParam K - The literal keys whose numeric-keyed sub-objects become arrays.
 * @param object - The (object-shaped) form model being converted.
 * @param keys - The keys whose numeric-keyed sub-objects become arrays.
 * @returns The converted value as `unknown` (assert the concrete shape).
 *
 * @example
 * ```ts
 * const model = { addresses: { 0: { city: 'A' }, 1: { city: 'B' } } };
 * objectToArray(model, ['addresses']) as { addresses: { city: string }[] };
 * // => { addresses: [{ city: 'A' }, { city: 'B' }] }
 *
 * // Single-entry wrapper is unwrapped to the bare array:
 * objectToArray({ list: { 0: { id: 1 } } }, ['list']);
 * // => [{ id: 1 }]
 * ```
 */
export function objectToArray<const K extends readonly string[]>(
  object: object,
  keys: K
): unknown {
  const processed = objectToArrayInternal(object, keys);
  if (processed && typeof processed === 'object' && !Array.isArray(processed)) {
    const entries: Array<[string, unknown]> = Object.entries(
      processed as Record<string, unknown>
    );
    if (entries.length === 1) {
      const firstEntry = entries[0];
      if (!firstEntry) {
        return processed;
      }
      const [k, v] = firstEntry;
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
  keys: readonly string[],
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
function isNumericObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.keys(value).every((k) => /^\d+$/.test(k));
}
