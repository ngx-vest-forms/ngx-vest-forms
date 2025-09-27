/**
 * Utilities for working with field paths in dot/bracket notation and Standard Schema path arrays.
 *
 * - parseFieldPath('addresses[0].street') => ['addresses', 0, 'street']
 * - stringifyFieldPath(['addresses', 0, 'street']) => 'addresses[0].street'
 */

/**
 * Converts a dot/bracket notation path (e.g. 'addresses[0].street')
 * to a Standard Schema path array (e.g. ['addresses', 0, 'street']).
 */
export function parseFieldPath(path: string): (string | number)[] {
  if (!path) return [];
  return path
    .replaceAll(/\[(\d+)\]/g, '.$1')
    .split('.')
    .map((part) => (/^\d+$/.test(part) ? Number(part) : part));
}

/**
 * Converts a Standard Schema path array (e.g. ['addresses', 0, 'street'])
 * to a dot/bracket notation string (e.g. 'addresses[0].street').
 */
export function stringifyFieldPath(parts: (string | number)[]): string {
  return parts
    .map((part: string | number, index: number) => {
      if (typeof part === 'number') return `[${part}]`;
      if (index > 0) return `.${part}`;
      return part;
    })
    .join('');
}

/**
 * Gets a value at a given path from an object.
 * @param obj The object to traverse
 * @param path The path string (dot/bracket notation)
 */
export function getValueAtPath<T = unknown>(object: T, path: string): unknown {
  const parts = parseFieldPath(path);
  if (parts.length === 0) return object;
  let current: unknown = object;
  for (const key of parts) {
    if (current == null) return undefined;
    if (typeof current === 'object' && current !== null) {
      current = (current as Record<string | number, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return current;
}

/**
 * Sets a value at a given path in an object (mutates the object).
 * @param obj The object to mutate
 * @param path The path string (dot/bracket notation)
 * @param value The value to set
 */
export function setValueAtPath<T extends object>(
  object: T,
  path: string,
  value: unknown,
): void {
  const parts = parseFieldPath(path);
  if (parts.length === 0) return;
  let current: unknown = object;
  for (let index = 0; index < parts.length - 1; index++) {
    const key = parts[index];
    if (
      typeof current !== 'object' ||
      current === null ||
      !(key in (current as Record<string | number, unknown>)) ||
      typeof (current as Record<string | number, unknown>)[key] !== 'object' ||
      (current as Record<string | number, unknown>)[key] === null
    ) {
      (current as Record<string | number, unknown>)[key] =
        typeof parts[index + 1] === 'number' ? [] : {};
    }
    current = (current as Record<string | number, unknown>)[key];
  }
  const lastKey = parts.at(-1);
  if (
    typeof current === 'object' &&
    current !== null &&
    lastKey !== undefined
  ) {
    (current as Record<string | number, unknown>)[lastKey] = value;
  }
}
