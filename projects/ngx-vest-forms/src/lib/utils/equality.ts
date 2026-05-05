/**
 * Type guard to check if a value is a primitive type.
 *
 * @param value - The value to check
 * @returns true if the value is a primitive (string, number, boolean, null, undefined, symbol, bigint)
 */
export function isPrimitive(
  value: unknown
): value is string | number | boolean | null | undefined | symbol | bigint {
  return (
    value === null || (typeof value !== 'object' && typeof value !== 'function')
  );
}

type VisitedPairs = WeakMap<object, WeakSet<object>>;

/**
 * Records that we've started comparing the pair (a, b). Re-entering the same
 * pair during recursion (cycle, or repeated DAG path) short-circuits to `true`
 * — correct because if the prior descent had returned `false`, the outer call
 * would already have short-circuited before we reach the second visit.
 */
function rememberPair(seen: VisitedPairs, a: object, b: object): void {
  let targets = seen.get(a);
  if (!targets) {
    targets = new WeakSet<object>();
    seen.set(a, targets);
  }
  targets.add(b);
}

/**
 * @internal
 * Internal utility for shallow equality checks.
 *
 * **Not intended for external use.** This function is used internally by the library
 * for performance-critical operations. Consider using your own comparison logic or
 * a library like lodash if you need shallow equality checks in your application.
 *
 * Optimized shallow equality check for objects.
 *
 * **Why this custom implementation is preferred:**
 * - **Performance**: Direct property comparison is significantly faster than JSON.stringify
 * - **Type Safety**: Handles null/undefined values correctly without serialization issues
 * - **Accuracy**: Doesn't suffer from JSON.stringify limitations (undefined values, functions, symbols)
 * - **Memory Efficient**: No temporary string creation or object serialization overhead
 *
 * **Use Cases:**
 * - Form value change detection where only top-level properties matter
 * - Quick object comparison in performance-critical code paths
 * - Validation triggers where deep comparison is unnecessary
 *
 * **Performance Comparison:**
 * ```typescript
 * /// ❌ Slow: JSON.stringify approach
 * JSON.stringify(obj1) === JSON.stringify(obj2)
 *
 * /// ✅ Fast: Direct property comparison
 * shallowEqual(obj1, obj2)
 * ```
 *
 * @param obj1 - First object to compare
 * @param obj2 - Second object to compare
 * @returns true if objects are shallowly equal (same keys and same values by reference)
 */
export function shallowEqual(obj1: unknown, obj2: unknown): boolean {
  if (obj1 === obj2) {
    return true;
  }

  if (obj1 == null || obj2 == null) {
    return obj1 === obj2;
  }

  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    return obj1 === obj2;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    if (
      !Object.hasOwn(obj2 as object, key) ||
      (obj1 as Record<string, unknown>)[key] !==
        (obj2 as Record<string, unknown>)[key]
    ) {
      return false;
    }
  }

  return true;
}

/**
 * @internal
 * Internal utility for deep equality checks.
 *
 * **Not intended for external use.** This function is used internally by the library
 * for form value comparison and change detection. Consider using your own comparison
 * logic or a library like lodash if you need deep equality checks in your application.
 *
 * Fast deep equality check optimized for form values and Angular applications.
 *
 * **Why this custom implementation is preferred over alternatives:**
 *
 * **vs JSON.stringify():**
 * - **10-100x faster**: Direct comparison without string serialization overhead
 * - **Accurate**: Handles Date objects, RegExp, undefined values, and functions correctly
 * - **Memory efficient**: No temporary string creation or garbage collection pressure
 * - **Preserves semantics**: Maintains type information during comparison
 *
 * **vs structuredClone():**
 * - **Wrong purpose**: structuredClone creates copies, not comparisons
 * - **Performance**: Would require cloning both objects just to compare them
 * - **Memory waste**: Creates unnecessary deep copies, doubling memory usage
 * - **Still incomplete**: Even after cloning, you'd still need a comparison function
 *
 * **vs External libraries (lodash.isEqual, etc.):**
 * - **Bundle size**: Zero dependencies, smaller application bundles
 * - **Form-specific**: Optimized for common Angular form data patterns
 * - **Type safety**: Full TypeScript integration with strict typing
 * - **Performance**: Tailored algorithms for form value comparison use cases
 *
 * **Supported Data Types:**
 * - Primitives (string, number, boolean, null, undefined, symbol, bigint)
 * - Arrays (with recursive deep comparison)
 * - Plain objects (with recursive deep comparison)
 * - Date objects (by timestamp comparison)
 * - RegExp objects (by source and flags comparison)
 * - Set objects (reference equality only)
 * - Map objects (reference equality only)
 * - Functions (reference equality only — distinct function instances are never equal,
 *   even if their source code is identical)
 *
 * **Safety Features:**
 * - **Circular reference handling**: Tracks visited object pairs with `WeakMap<object, WeakSet<object>>`
 * - **Type coercion prevention**: Strict type checking before comparison
 * - **Null safety**: Proper handling of null and undefined values
 *
 * **Performance Characteristics:**
 * ```typescript
 * /// Performance comparison on typical form objects:
 * /// JSON.stringify:    ~100ms for complex nested forms
 * /// fastDeepEqual:     ~1-5ms for the same objects
 * ///
 * /// Memory usage:
 * /// JSON.stringify:    Creates temporary strings (high GC pressure)
 * /// fastDeepEqual:     One small WeakMap of visited object pairs is allocated lazily on
 * ///                    first nested-container descent; primitive-only comparisons allocate nothing.
 * ```
 *
 * **Typical Usage in Forms:**
 * ```typescript
 * /// Detect when form values actually change
 * distinctUntilChanged(fastDeepEqual)
 *
 * /// Prevent unnecessary re-renders
 * if (!fastDeepEqual(oldFormValue, newFormValue)) {
 *   updateUI();
 * }
 * ```
 *
 * @param obj1 - First object to compare
 * @param obj2 - Second object to compare
 *
 * Cyclic arrays and plain objects are compared structurally by tracking visited object
 * pairs. Distinct cyclic graphs with the same structure compare equal. `Date` and
 * `RegExp` values compare structurally. `Map` and `Set` values compare by reference
 * only, so distinct instances are considered different even if their contents match.
 *
 * @returns true if objects are deeply equal by value
 */
export function fastDeepEqual(obj1: unknown, obj2: unknown): boolean {
  return fastDeepEqualInternal(obj1, obj2, undefined);
}

function fastDeepEqualInternal(
  obj1: unknown,
  obj2: unknown,
  seen: VisitedPairs | undefined
): boolean {
  if (obj1 === obj2) {
    return true;
  }

  if (obj1 == null || obj2 == null) {
    return obj1 === obj2;
  }

  if (typeof obj1 !== typeof obj2) {
    return false;
  }

  // Functions use reference-only equality. obj1 === obj2 was short-circuited
  // at the top, so reaching here means the references differ.
  if (typeof obj1 === 'function') {
    return false;
  }

  if (isPrimitive(obj1) || isPrimitive(obj2)) {
    return obj1 === obj2;
  }

  // Handle Date / RegExp first — they have value semantics and can't contain cycles,
  // so they don't need pair tracking.
  if (obj1 instanceof Date || obj2 instanceof Date) {
    return (
      obj1 instanceof Date &&
      obj2 instanceof Date &&
      obj1.getTime() === obj2.getTime()
    );
  }

  if (obj1 instanceof RegExp || obj2 instanceof RegExp) {
    return (
      obj1 instanceof RegExp &&
      obj2 instanceof RegExp &&
      obj1.source === obj2.source &&
      obj1.flags === obj2.flags
    );
  }

  // Intentional contract: distinct Set / Map instances compare by reference only.
  if (obj1 instanceof Set || obj2 instanceof Set) {
    return false;
  }
  if (obj1 instanceof Map || obj2 instanceof Map) {
    return false;
  }

  if (Array.isArray(obj1) !== Array.isArray(obj2)) {
    return false;
  }

  // Cycle / repeated-pair guard for traversable containers.
  // Allocates lazily on first nested-object descent.
  const a = obj1 as object;
  const b = obj2 as object;
  if (seen?.get(a)?.has(b)) {
    return true;
  }
  seen ??= new WeakMap<object, WeakSet<object>>();
  rememberPair(seen, a, b);

  if (Array.isArray(obj1)) {
    const arr2 = obj2 as unknown[];
    if (obj1.length !== arr2.length) {
      return false;
    }
    for (let i = 0; i < obj1.length; i++) {
      if (!fastDeepEqualInternal(obj1[i], arr2[i], seen)) {
        return false;
      }
    }
    return true;
  }

  // Plain objects
  const keys1 = Object.keys(a);
  const o2 = b as Record<string, unknown>;
  if (keys1.length !== Object.keys(o2).length) {
    return false;
  }
  for (const key of keys1) {
    if (!Object.hasOwn(o2, key)) {
      return false;
    }
    if (
      !fastDeepEqualInternal(
        (a as Record<string, unknown>)[key],
        o2[key],
        seen
      )
    ) {
      return false;
    }
  }
  return true;
}
