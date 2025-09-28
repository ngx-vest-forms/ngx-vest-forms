/**
 * Path utilities for accessing and manipulating nested object properties.
 *
 * These helpers provide the runtime counterpart to the static types exported by
 * `ts-essentials`. They normalise incoming paths, preserve immutability, and
 * surface rich error information so that higher-level consumers (e.g.
 * `createVestForm`) can safely manage deeply nested form models without
 * sprinkling defensive checks everywhere.
 */

import type { Path, PathValue } from '../vest-form.types';

/**
 * Error codes returned by {@link PathAccessError} so callers can pattern match
 * without relying on string parsing.
 */
export type PathAccessErrorCode =
  | 'invalid-path'
  | 'non-object-root'
  | 'missing-intermediate';

/**
 * Custom error thrown by the path utilities whenever a caller supplies an
 * invalid path or tries to traverse through a non-object segment. This keeps
 * the runtime fail-fast and makes debugging significantly easier because we
 * can surface the exact failing segment.
 */
export class PathAccessError extends Error {
  readonly code: PathAccessErrorCode;
  readonly path: string;

  constructor(code: PathAccessErrorCode, path: string, message: string) {
    super(message);
    this.name = 'PathAccessError';
    this.code = code;
    this.path = path;
  }
}

/**
 * Type guard to check if a value is a non-null object
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

/**
 * Type guard to check if a string represents a numeric array index
 */
function isNumericString(value: string): boolean {
  return /^\d+$/.test(value);
}

/**
 * Normalises a user supplied path and throws a descriptive error when the path
 * is malformed. Returning early keeps the public helpers focused on the happy
 * path logic while providing consistent failure semantics.
 */
function normaliseOrThrow(path: string): string {
  const trimmed = path.trim();

  if (
    trimmed.length === 0 ||
    trimmed.startsWith('.') ||
    trimmed.endsWith('.') ||
    trimmed.includes('..')
  ) {
    throw new PathAccessError(
      'invalid-path',
      path,
      `The provided path "${path}" cannot be normalised. Ensure it contains ` +
        'only dot-separated identifiers and optional numeric array indices.',
    );
  }

  const normalised = normalizePath(trimmed);

  if (normalised === null) {
    throw new PathAccessError(
      'invalid-path',
      path,
      `The provided path "${path}" cannot be normalised. Ensure it contains ` +
        'only dot-separated identifiers and optional numeric array indices.',
    );
  }

  return normalised;
}

/**
 * Retrieves the value located at the provided path.
 *
 * @param object - Source object to traverse.
 * @param path - Dot-notation path (typed via {@link Path}) or string input.
 * @returns The located value or `undefined` when the path does not exist.
 * @throws {@link PathAccessError} when the path cannot be normalised.
 */
export function getValueByPath<
  TModel extends Record<string, unknown>,
  P extends Path<TModel>,
>(object: TModel, path: P): PathValue<TModel, P> | undefined;
export function getValueByPath<T = unknown>(
  object: object,
  path: string,
): T | undefined;
export function getValueByPath<
  TModel extends Record<string, unknown>,
  P extends Path<TModel>,
>(
  object: TModel | object,
  path: P | string,
): PathValue<TModel, P> | unknown | undefined {
  if (!isObject(object)) {
    throw new PathAccessError(
      'non-object-root',
      String(path),
      'Cannot access a path on a non-object root value.',
    );
  }

  if (!path || path === '') {
    return object as PathValue<TModel, P> | unknown;
  }

  const normalisedPath = normaliseOrThrow(String(path));

  if (!normalisedPath.includes('.')) {
    return (object as Record<string, unknown>)[normalisedPath] as
      | PathValue<TModel, P>
      | unknown
      | undefined;
  }

  const keys = normalisedPath.split('.');
  let current: unknown = object as Record<string, unknown>;

  for (const key of keys) {
    if (!isObject(current)) {
      return undefined;
    }

    if (Array.isArray(current) && isNumericString(key)) {
      const index = Number.parseInt(key, 10);
      current = current[index];
    } else {
      current = current[key];
    }
  }

  return current as PathValue<TModel, P> | unknown | undefined;
}

/**
 * Returns a new object with the value at the provided path replaced.
 *
 * @param object - The original immutable value.
 * @param path - Dot-notation path to update.
 * @param value - Replacement value.
 * @returns A shallow-cloned structure containing the new value.
 * @throws {@link PathAccessError} when the path cannot be normalised or when a
 *         traversal encounters a non-object intermediate segment.
 */
export function setValueByPath<
  TModel extends Record<string, unknown>,
  P extends Path<TModel>,
>(object: TModel, path: P, value: PathValue<TModel, P>): TModel;
export function setValueByPath<T extends object>(
  object: T,
  path: string,
  value: unknown,
): T;
export function setValueByPath<
  TModel extends Record<string, unknown>,
  P extends Path<TModel>,
>(
  object: TModel | object,
  path: P | string,
  value: PathValue<TModel, P> | unknown,
): TModel {
  if (!isObject(object)) {
    throw new PathAccessError(
      'non-object-root',
      String(path),
      'Cannot set a path on a non-object root value.',
    );
  }

  if (!path || path === '') {
    return (
      typeof value === 'object' && value !== null ? value : object
    ) as TModel;
  }

  const normalisedPath = normaliseOrThrow(String(path));

  if (!normalisedPath.includes('.')) {
    // Preserve prototype chain for simple property updates
    const result = Array.isArray(object)
      ? [...object]
      : Object.create(
          Object.getPrototypeOf(object),
          Object.getOwnPropertyDescriptors(object),
        );
    (result as Record<string, unknown>)[normalisedPath] = value;
    return result as TModel;
  }

  const keys = normalisedPath.split('.');

  // Preserve the prototype chain when cloning
  const result = Array.isArray(object)
    ? [...(object as unknown[])]
    : Object.create(
        Object.getPrototypeOf(object),
        Object.getOwnPropertyDescriptors(object),
      );

  let current: Record<string, unknown> = result as Record<string, unknown>;

  for (let index = 0; index < keys.length - 1; index++) {
    const key = keys[index];
    const nextKey = keys[index + 1];

    const existing = current[key];

    if (existing == null) {
      const isNextArray = isNumericString(nextKey);
      current[key] = isNextArray ? [] : {};
    } else if (isObject(existing)) {
      current[key] = Array.isArray(existing)
        ? [...(existing as unknown[])]
        : { ...(existing as Record<string, unknown>) };
    } else {
      throw new PathAccessError(
        'missing-intermediate',
        normalisedPath,
        `Encountered a non-object value while traversing "${normalisedPath}" at segment "${key}".`,
      );
    }

    current = current[key] as Record<string, unknown>;
  }

  const finalKey = keys.at(-1);
  if (!finalKey) {
    return result as TModel;
  }

  if (Array.isArray(current) && isNumericString(finalKey)) {
    const index = Number.parseInt(finalKey, 10);
    (current as unknown[])[index] = value;
  } else {
    current[finalKey] = value;
  }

  return result as TModel;
}

/**
 * Delete a value from an object using type-safe dot notation path
 */
/**
 * Removes a value at the provided path while returning a new immutable copy.
 * Unlike {@link setValueByPath}, missing paths simply return the original
 * object so callers can perform idempotent deletions.
 */
export function deleteValueByPath<
  TModel extends Record<string, unknown>,
  P extends Path<TModel>,
>(object: TModel, path: P): TModel {
  if (!isObject(object)) {
    throw new PathAccessError(
      'non-object-root',
      String(path),
      'Cannot delete a path on a non-object root value.',
    );
  }

  if (!path) {
    return object;
  }

  const normalisedPath = normaliseOrThrow(String(path));

  if (!normalisedPath.includes('.')) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [normalisedPath]: _deleted, ...rest } = object;
    return rest as TModel;
  }

  const keys = normalisedPath.split('.');
  const result = Array.isArray(object) ? [...object] : { ...object };
  let current: Record<string, unknown> = result as Record<string, unknown>;

  // Navigate to parent of target property
  for (let index = 0; index < keys.length - 1; index++) {
    const key = keys[index];

    if (!isObject(current[key])) {
      return object; // Path doesn't exist
    }

    // Clone the nested object/array
    current[key] = Array.isArray(current[key])
      ? [...(current[key] as unknown[])]
      : { ...(current[key] as Record<string, unknown>) };

    current = current[key] as Record<string, unknown>;
  }

  // Delete the final property
  const finalKey = keys.at(-1);
  if (finalKey && Object.prototype.hasOwnProperty.call(current, finalKey)) {
    if (Array.isArray(current) && isNumericString(finalKey)) {
      (current as unknown[]).splice(Number.parseInt(finalKey, 10), 1);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete current[finalKey];
    }
  }

  return result as TModel;
}

/**
 * Determines whether the supplied path resolves to a value on the object.
 * Invalid paths are treated as `false` to keep the method side-effect free.
 */
export function hasPath<
  TModel extends Record<string, unknown>,
  P extends Path<TModel>,
>(object: TModel, path: P): boolean {
  try {
    return getValueByPath(object, path) !== undefined;
  } catch (error: unknown) {
    if (error instanceof PathAccessError) {
      return false;
    }
    throw error;
  }
}

/**
 * Returns every reachable dot-notation path within an object.
 * Primarily used for testing and debugging in order to snapshot complex model
 * structures.
 */
export function getAllPaths(
  object: Record<string, unknown>,
  prefix = '',
): string[] {
  if (!isObject(object)) {
    return prefix ? [prefix] : [];
  }

  const paths: string[] = [];
  const entries = Object.entries(object);

  // For empty objects, still add the path to the object itself if we have a prefix
  if (entries.length === 0 && prefix) {
    return [prefix];
  }

  for (const [key, value] of entries) {
    const currentPath = prefix ? `${prefix}.${key}` : key;
    paths.push(currentPath);

    if (Array.isArray(value)) {
      // Don't add paths for empty arrays, but do add paths for their items
      if (value.length > 0) {
        for (const [index, item] of value.entries()) {
          const indexPath = `${currentPath}.${index}`;
          paths.push(indexPath);
          if (isObject(item)) {
            paths.push(...getAllPaths(item, indexPath));
          }
        }
      }
    } else if (isObject(value) && Object.keys(value).length > 0) {
      paths.push(...getAllPaths(value, currentPath));
    }
  }

  return paths;
}

/**
 * Performs a lightweight validation of a potential path string.
 * Returning `false` enables callers to present actionable error messages
 * before attempting a modification that would otherwise throw.
 */
export function isValidPath(path: string): boolean {
  if (typeof path !== 'string' || path.length === 0) {
    return false;
  }

  // Check for invalid characters or patterns
  if (path.startsWith('.') || path.endsWith('.') || path.includes('..')) {
    return false;
  }

  // Validate each segment
  const segments = path.split('.');
  return segments.every((segment) => {
    // Allow alphanumeric, underscore, dash, dollar sign, and valid array indices
    return (
      /^[a-zA-Z_$-][a-zA-Z0-9_$-]*$/.test(segment) || /^\d+$/.test(segment)
    );
  });
}

/**
 * Normalises a path by converting bracket notation to dot notation and
 * collapsing duplicate separators. Invalid inputs return `null` so callers can
 * decide whether to recover or throw.
 */
export function normalizePath(path: string): string | null {
  if (typeof path !== 'string') {
    return null;
  }

  const trimmed = path.trim();

  if (trimmed.length === 0) {
    return '';
  }

  // Convert array notation to dot notation
  let normalized = trimmed.replaceAll(/\[(\d+)\]/g, '.$1');

  // Clean up duplicate separators and trim leading/trailing dots
  normalized = normalized
    .replaceAll(/\.{2,}/g, '.')
    .replaceAll(/^\.+|\.+$/g, '');

  if (normalized === '') {
    return trimmed.length === 0 ? '' : null;
  }

  const segments = normalized.split('.');
  const isValidSegment = (segment: string) =>
    /^[a-zA-Z_$-][a-zA-Z0-9_$-]*$/.test(segment) || /^\d+$/.test(segment);

  if (
    segments.some((segment) => segment.length === 0 || !isValidSegment(segment))
  ) {
    return null;
  }

  return segments.join('.');
}
