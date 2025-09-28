/**
 * Path utilities for accessing and manipulating nested object properties
 * Framework-agnostic utility functions for dot-notation path access
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Get a value from an object using dot notation path
 * @param object - The object to access
 * @param path - Dot-notation path (e.g., 'user.profile.name')
 * @returns The value at the path, or undefined if not found
 */
export function getValueByPath<T = any>(
  object: any,
  path: string,
): T | undefined {
  if (!object || typeof object !== 'object' || !path) {
    return undefined;
  }

  // Handle simple property access
  if (!path.includes('.')) {
    return object[path];
  }

  // Handle nested property access
  const keys = path.split('.');
  let current = object;

  for (const key of keys) {
    if (current == null || typeof current !== 'object') {
      return undefined;
    }

    // Handle array indices
    if (Array.isArray(current) && /^\d+$/.test(key)) {
      const index = Number.parseInt(key, 10);
      current = current[index];
    } else {
      current = current[key];
    }
  }

  return current;
}

/**
 * Set a value in an object using dot notation path
 * Creates a new object with the updated value (immutable)
 * @param obj - The object to update
 * @param path - Dot-notation path (e.g., 'user.profile.name')
 * @param value - The value to set
 * @returns A new object with the updated value
 */
export function setValueByPath(object: any, path: string, value: any): any {
  if (!path) {
    return object;
  }

  // Handle simple property access
  if (!path.includes('.')) {
    return { ...object, [path]: value };
  }

  // Handle nested property access
  const keys = path.split('.');
  const result = Array.isArray(object) ? [...object] : { ...object };
  let current = result;

  for (let index = 0; index < keys.length - 1; index++) {
    const key = keys[index];
    const nextKey = keys[index + 1];

    // Create nested structure if it doesn't exist
    if (current[key] == null || typeof current[key] !== 'object') {
      // Determine if next level should be an array
      const isNextArray = /^\d+$/.test(nextKey);
      current[key] = isNextArray ? [] : {};
    } else {
      // Clone existing nested object/array
      current[key] = Array.isArray(current[key])
        ? [...current[key]]
        : { ...current[key] };
    }

    current = current[key];
  }

  // Set the final value
  const finalKey = keys.at(-1);
  if (!finalKey) {
    return result;
  }

  if (Array.isArray(current) && /^\d+$/.test(finalKey)) {
    const index = Number.parseInt(finalKey, 10);
    current[index] = value;
  } else {
    current[finalKey] = value;
  }

  return result;
}

/**
 * Delete a value from an object using dot notation path
 * Creates a new object with the property removed (immutable)
 * @param obj - The object to update
 * @param path - Dot-notation path (e.g., 'user.profile.name')
 * @returns A new object with the property removed
 */
export function deleteValueByPath(object: any, path: string): any {
  if (!path || !object) {
    return object;
  }

  // Handle simple property access
  if (!path.includes('.')) {
    const { [path]: _deleted, ...rest } = object;
    return rest;
  }

  // Handle nested property access
  const keys = path.split('.');
  const result = Array.isArray(object) ? [...object] : { ...object };
  let current = result;

  // Navigate to parent of target property
  for (let index = 0; index < keys.length - 1; index++) {
    const key = keys[index];

    if (current[key] == null || typeof current[key] !== 'object') {
      return result; // Path doesn't exist, return unchanged
    }

    // Clone nested object/array
    current[key] = Array.isArray(current[key])
      ? [...current[key]]
      : { ...current[key] };

    current = current[key];
  }

  // Delete the final property
  const finalKey = keys.at(-1);
  if (!finalKey) {
    return result;
  }

  if (Array.isArray(current) && /^\d+$/.test(finalKey)) {
    const index = Number.parseInt(finalKey, 10);
    current.splice(index, 1);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete current[finalKey];
  }

  return result;
}

/**
 * Check if a path exists in an object
 * @param obj - The object to check
 * @param path - Dot-notation path (e.g., 'user.profile.name')
 * @returns True if the path exists
 */
export function hasPath(object: any, path: string): boolean {
  return getValueByPath(object, path) !== undefined;
}

/**
 * Get all paths in an object (flattened dot-notation paths)
 * @param obj - The object to analyze
 * @param prefix - Internal prefix for recursion
 * @returns Array of all paths in the object
 */
export function getAllPaths(object: any, prefix = ''): string[] {
  if (object == null || typeof object !== 'object') {
    return prefix ? [prefix] : [];
  }

  const paths: string[] = [];

  if (Array.isArray(object)) {
    for (const [index, item] of object.entries()) {
      const currentPath = prefix ? `${prefix}.${index}` : `${index}`;
      paths.push(...getAllPaths(item, currentPath));
    }
  } else {
    for (const key of Object.keys(object)) {
      const currentPath = prefix ? `${prefix}.${key}` : key;
      paths.push(...getAllPaths(object[key], currentPath));
    }
  }

  return paths.length > 0 ? paths : prefix ? [prefix] : [];
}

/**
 * Validate a dot-notation path format
 * @param path - The path to validate
 * @returns True if the path is valid
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
    // Allow alphanumeric, underscore, and valid array indices
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(segment) || /^\d+$/.test(segment);
  });
}

/**
 * Normalize a path by removing extra dots and validating format
 * @param path - The path to normalize
 * @returns Normalized path or null if invalid
 */
export function normalizePath(path: string): string | null {
  if (!isValidPath(path)) {
    return null;
  }

  return path
    .split('.')
    .filter((segment) => segment.length > 0)
    .join('.');
}
