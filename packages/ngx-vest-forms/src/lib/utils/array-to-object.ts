import { isUnsafePathSegment } from './field-path.utils';

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
 * Conversion is *explicit by key*. A numeric-keyed object becomes an array
 * when its key is listed in `keys`, when it sits inside a converted branch, or
 * when it contains a converted key (it held that list as an array item). Any
 * other numeric-keyed object stays an object. As a convenience the result is
 * unwrapped to the bare converted array when the input is a single-entry
 * wrapper whose only key was converted.
 *
 * An empty `{}` under a converted key, or anywhere inside a converted branch,
 * becomes `[]`. A form model can't tell an emptied array from an empty object,
 * so a list whose items were all removed comes back as `[]`.
 *
 * A sound precise return type is not expressible here: the runtime shape
 * depends on the runtime `keys` values and the single-entry unwrap, neither of
 * which is recoverable in the type system. The return is therefore `unknown`;
 * callers that know the concrete result shape should assert it
 * (e.g. `objectToArray(model, ['list']) as { list: string[] }`).
 *
 * Security: Unsafe prototype-related keys (`__proto__`, `prototype`,
 * `constructor`) are left out at every level.
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
  const { value: processed } = objectToArrayInternal(object, keys);
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
        v.every((element) => typeof element === 'object' && element !== null)
      ) {
        return v;
      }
    }
  }
  return processed;
}

/**
 * Result of one step of {@link objectToArrayInternal}: the converted value, and
 * whether an object was turned into an array anywhere inside it.
 */
type ConvertedValue = { value: unknown; converted: boolean };

/**
 * Internal recursive worker. Conversion cascades down: once a listed key is
 * converted, every numeric-keyed object inside it becomes an array too. It
 * also runs up: a numeric-keyed object whose contents were converted becomes
 * an array, since it held them as array items.
 */
function objectToArrayInternal(
  object: unknown,
  keys: readonly string[],
  currentKey?: string,
  parentCascade = false
): ConvertedValue {
  if (Array.isArray(object)) {
    // Recursively process each item in the array
    const items = object.map((item) =>
      objectToArrayInternal(item, keys, undefined, parentCascade)
    );
    return {
      value: items.map((item) => item.value),
      converted: items.some((item) => item.converted),
    };
  }

  if (object && typeof object === 'object') {
    if (isNumericObject(object)) {
      // First, recursively process the contents
      const processedContents: Record<string, unknown> = {};
      let hasChanges = false;

      const explicit = !!currentKey && keys.includes(currentKey);
      const childCascade = parentCascade || explicit;

      for (const [key, value] of Object.entries(object)) {
        const processed = objectToArrayInternal(value, keys, key, childCascade);
        processedContents[key] = processed.value;
        if (processed.converted) {
          hasChanges = true;
        }
      }

      // Decision: should we convert this numeric object to an array?
      // Yes, if: explicitly targeted, parent was converted, or children changed.
      const shouldConvert = explicit || parentCascade || hasChanges;

      return {
        value: shouldConvert
          ? Object.keys(processedContents)
              .sort((a, b) => Number(a) - Number(b))
              .map((k) => processedContents[k])
          : processedContents,
        converted: shouldConvert,
      };
    }

    // For regular objects, process recursively. Unsafe keys (an own
    // `__proto__` from JSON.parse) are left out, so they can't set the
    // result's prototype.
    const result: Record<string, unknown> = {};
    let converted = false;
    for (const [key, value] of Object.entries(object)) {
      if (!isUnsafePathSegment(key)) {
        const processed = objectToArrayInternal(
          value,
          keys,
          key,
          parentCascade
        );
        result[key] = processed.value;
        converted = converted || processed.converted;
      }
    }
    return { value: result, converted };
  }

  return { value: object, converted: false };
}

/**
 * Checks if a value is an object with only numeric keys (not an array).
 */
function isNumericObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.keys(value).every((k) => /^\d+$/.test(k));
}
