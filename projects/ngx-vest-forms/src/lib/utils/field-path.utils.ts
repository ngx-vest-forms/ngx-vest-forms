/**
 * Utilities for working with field paths in dot/bracket notation and Standard Schema path arrays.
 *
 * These utilities help convert between:
 * - **Dot/bracket notation**: `'addresses[0].street'` (used in Angular forms and Vest)
 * - **Standard Schema paths**: `['addresses', 0, 'street']` (used in schema validation)
 *
 * @example
 * ```typescript
 * // Parse string path to array
 * parseFieldPath('user.addresses[0].street')
 * // Returns: ['user', 'addresses', 0, 'street']
 *
 * // Stringify array path to string
 * stringifyFieldPath(['user', 'addresses', 0, 'street'])
 * // Returns: 'user.addresses[0].street'
 * ```
 */

/**
 * @internal
 * Internal utility for parsing field path strings.
 *
 * **Not intended for external use.** While this function can parse field paths,
 * it's primarily used internally. Most users won't need to parse field paths manually.
 * If you do need this functionality, consider using your own implementation tailored
 * to your specific needs.
 *
 * Converts a dot/bracket notation path (e.g. `'addresses[0].street'`)
 * to a Standard Schema path array (e.g. `['addresses', 0, 'street']`).
 *
 * **Use cases:**
 * - Converting Angular form paths to schema-compatible arrays
 * - Parsing Vest field names for array access
 * - Processing validation error paths from different sources
 *
 * **Supported formats:**
 * - Dot notation: `'user.name'` → `['user', 'name']`
 * - Bracket notation: `'addresses[0]'` → `['addresses', 0]`
 * - Mixed: `'user.addresses[0].street'` → `['user', 'addresses', 0, 'street']`
 *
 * @param path - The dot/bracket notation path string
 * @returns Array of path segments (strings for properties, numbers for array indices)
 *
 * @example
 * ```typescript
 * parseFieldPath('email')              // ['email']
 * parseFieldPath('user.profile.name')  // ['user', 'profile', 'name']
 * parseFieldPath('items[0]')           // ['items', 0]
 * parseFieldPath('users[0].addresses[1].street')
 * // ['users', 0, 'addresses', 1, 'street']
 * ```
 */
export function parseFieldPath(path: string): (string | number)[] {
  if (!path) return [];

  return path
    .replaceAll(/\[(\d+)\]/g, '.$1') // Convert brackets to dots: items[0] → items.0
    .split('.') // Split by dots
    .filter((part) => part !== '') // Remove empty strings from leading brackets
    .map((part) => (/^\d+$/.test(part) ? Number(part) : part)); // Convert numeric strings to numbers
}

/**
 * Converts a Standard Schema path array (e.g. `['addresses', 0, 'street']`)
 * to a dot/bracket notation string (e.g. `'addresses[0].street'`).
 *
 * **Use cases:**
 * - Converting schema validation paths to Angular form field names
 * - Generating Vest field names from path arrays
 * - Creating human-readable field identifiers
 *
 * **Format rules:**
 * - String segments joined with dots: `['user', 'name']` → `'user.name'`
 * - Number segments use brackets: `['items', 0]` → `'items[0]'`
 * - Mixed paths combine both: `['users', 0, 'email']` → `'users[0].email'`
 *
 * @param path - Array of path segments (strings for properties, numbers for indices)
 * @returns Dot/bracket notation path string
 *
 * @example
 * ```typescript
 * stringifyFieldPath(['email'])                     // 'email'
 * stringifyFieldPath(['user', 'profile', 'name'])   // 'user.profile.name'
 * stringifyFieldPath(['items', 0])                  // 'items[0]'
 * stringifyFieldPath(['users', 0, 'addresses', 1, 'street'])
 * // 'users[0].addresses[1].street'
 * ```
 */
export function stringifyFieldPath(path: (string | number)[]): string {
  if (!path || path.length === 0) return '';

  let result = '';

  for (let i = 0; i < path.length; i++) {
    const segment = path[i];

    if (typeof segment === 'number') {
      // Array index - add as bracket notation
      result += `[${segment}]`;
    } else {
      // Property name - add with dot prefix if not first segment
      if (i > 0) result += '.';
      result += segment;
    }
  }

  return result;
}
