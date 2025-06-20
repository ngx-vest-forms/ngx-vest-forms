import { computed, WritableSignal } from '@angular/core';
import {
  ConflictState,
  SmartStateOptions,
} from './smart-state-extension.types';

/**
 * Utility class for smart state management operations.
 * This provides pure functions for conflict detection, state merging, and field comparison.
 *
 * Note: Smart state management is already integrated into FormDirective.
 * This utility class provides helper functions for advanced use cases and testing.
 *
 * @template TModel The type of the form model/value
 *
 * @example
 * ```typescript
 * /// Create utility instance for type safety
 * const smartState = new SmartStateExtension<UserProfile>();
 *
 * /// Check if a field was edited
 * const wasEdited = smartState.hasUserEditedField(
 *   currentValue,
 *   originalValue,
 *   'email'
 * );
 *
 * /// Merge states with conflict detection
 * const mergedValue = smartState.smartMerge(
 *   formValue,
 *   externalValue,
 *   currentValue,
 *   originalExternalValue,
 *   { mergeStrategy: 'smart', preserveFields: ['firstName'] },
 *   isDirty,
 *   isValid
 * );
 * ```
 */
export class SmartStateExtension<TModel> {
  #conflictDetected: WritableSignal<ConflictState<TModel>> | null = null;

  /**
   * Creates a new SmartStateExtension instance
   * @param conflictSignal Optional WritableSignal to manage conflict state
   */
  constructor(conflictSignal?: WritableSignal<ConflictState<TModel>>) {
    this.#conflictDetected = conflictSignal || null;
  }

  /**
   * Returns whether there is currently a conflict
   */
  readonly hasConflict = computed(() =>
    this.#conflictDetected ? !!this.#conflictDetected() : false,
  );

  /**
   * Performs intelligent merging of form states based on configuration
   *
   * @param formValue Current form value (local state)
   * @param newExternal New external data
   * @param currentValue Current merged value
   * @param oldExternal Previous external data
   * @param options Smart state configuration options
   * @param isDirty Whether the form has been modified by the user
   * @param isValid Whether the form is currently valid
   * @returns Merged value or null
   *
   * @example
   * ```typescript
   * const merged = smartState.smartMerge(
   *   { name: 'John', email: 'john@local.com' },
   *   { name: 'John', email: 'john@external.com' },
   *   { name: 'John', email: 'john@local.com' },
   *   { name: 'John', email: 'john@original.com' },
   *   { mergeStrategy: 'smart', preserveFields: ['email'] },
   *   true, // form is dirty
   *   true  // form is valid
   * );
   * // Result: { name: 'John', email: 'john@local.com' } - preserves local email
   * ```
   */
  smartMerge(
    formValue: TModel | null,
    newExternal: TModel | null,
    currentValue: TModel | null,
    oldExternal: TModel | null,
    options: SmartStateOptions<TModel>,
    isDirty: boolean,
    isValid: boolean,
  ): TModel | null {
    if (!newExternal) return formValue;
    if (!currentValue) return newExternal;

    // No external change detected
    if (this.deepEqual(oldExternal, newExternal)) {
      return formValue; // Keep current form state
    }

    // Form is dirty and valid - preserve user changes for specified fields
    if (isDirty && isValid && options.preserveFields?.length) {
      const merged = { ...newExternal };

      for (const field of options.preserveFields) {
        // Always preserve specified fields from current form value, regardless of edit state
        const currentFieldValue = this.getNestedValue(currentValue, field);
        if (currentFieldValue !== undefined) {
          this.setNestedValue(merged, field, currentFieldValue);
        }
      }
      return merged;
    }

    // Conflict resolution
    if (options.conflictResolution && options.onConflict) {
      const resolution = options.onConflict(currentValue, newExternal);
      if (resolution === 'prompt-user') {
        // Set conflict state for manual resolution
        this.#conflictDetected?.set({
          local: currentValue,
          external: newExternal,
          timestamp: Date.now(),
        });
        return currentValue; // Keep current until resolved
      }
      return resolution;
    }

    // Default: merge external with current form data
    return { ...newExternal, ...formValue };
  }

  /**
   * Resolves a detected conflict with the specified resolution strategy
   *
   * @param resolution How to resolve the conflict
   * @param formValueSignal Signal to update with resolved value
   *
   * @example
   * ```typescript
   * // Keep local changes
   * smartState.resolveConflict('local', formValue);
   *
   * // Accept external changes
   * smartState.resolveConflict('external', formValue);
   *
   * // Merge both (external takes precedence, then local)
   * smartState.resolveConflict('merge', formValue);
   * ```
   */
  resolveConflict(
    resolution: 'local' | 'external' | 'merge',
    formValueSignal?: WritableSignal<TModel | null>,
  ): TModel | null {
    const conflict = this.#conflictDetected?.();
    if (!conflict) return null;

    let resolvedValue: TModel;
    switch (resolution) {
      case 'local': {
        resolvedValue = conflict.local;
        break;
      }
      case 'external': {
        resolvedValue = conflict.external;
        break;
      }
      case 'merge': {
        resolvedValue = { ...conflict.external, ...conflict.local };
        break;
      }
    }

    // Update form with resolved value if signal provided
    formValueSignal?.set(resolvedValue);

    // Clear conflict state
    this.#conflictDetected?.set(null);

    return resolvedValue;
  }

  /**
   * Checks if a specific field has been edited by the user
   * Supports dot notation for nested fields (e.g., 'user.profile.email')
   *
   * @param current Current state to check
   * @param original Original state to compare against
   * @param fieldPath Field path in dot notation
   * @returns True if the field has been modified
   *
   * @example
   * ```typescript
   * const wasEdited = smartState.hasUserEditedField(
   *   { user: { name: 'John Doe' } },
   *   { user: { name: 'John' } },
   *   'user.name'
   * );
   * // Result: true
   * ```
   */
  hasUserEditedField(
    current: TModel,
    original: TModel | null,
    fieldPath: string,
  ): boolean {
    if (!original) return true;

    const currentValue = this.getNestedValue(current, fieldPath);
    const originalValue = this.getNestedValue(original, fieldPath);

    return !this.deepEqual(currentValue, originalValue);
  }

  /**
   * Gets a nested value from an object using dot notation
   *
   * @param target Object to get value from
   * @param path Dot notation path (e.g., 'user.profile.email')
   * @returns The value at the specified path
   *
   * @example
   * ```typescript
   * const value = smartState.getNestedValue(
   *   { user: { profile: { email: 'test@example.com' } } },
   *   'user.profile.email'
   * );
   * /// Result: 'test@example.com'
   * ```
   */
  getNestedValue(target: unknown, path: string): unknown {
    if (!target || typeof target !== 'object') return undefined;
    if (!path || path.trim() === '') return target;

    const parts = path.split('.');
    let current: unknown = target;

    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      if (typeof current !== 'object' || current === null) return undefined;
      current = (current as Record<string, unknown>)[part];
    }

    return current;
  }

  /**
   * Sets a nested value in an object using dot notation
   *
   * @param target Object to set value on
   * @param path Dot notation path (e.g., 'user.profile.email')
   * @param value Value to set
   *
   * @example
   * ```typescript
   * const obj = { user: { profile: {} } };
   * smartState.setNestedValue(obj, 'user.profile.email', 'new@example.com');
   * // obj is now: { user: { profile: { email: 'new@example.com' } } }
   * ```
   */
  setNestedValue(target: unknown, path: string, value: unknown): void {
    if (!target || typeof target !== 'object') return;

    const parts = path.split('.');
    const lastPart = parts.pop();
    if (!lastPart) return;

    let current = target as Record<string, unknown>;

    for (const part of parts) {
      if (
        !(part in current) ||
        typeof current[part] !== 'object' ||
        current[part] === null
      ) {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }

    current[lastPart] = value;
  }

  /**
   * Performs deep equality comparison between two values
   *
   * @param a First value to compare
   * @param b Second value to compare
   * @returns True if values are deeply equal
   *
   * @example
   * ```typescript
   * const isEqual = smartState.deepEqual(
   *   { user: { name: 'John' } },
   *   { user: { name: 'John' } }
   * );
   * // Result: true
   * ```
   */
  deepEqual(a: unknown, b: unknown, visited = new Set<unknown>()): boolean {
    if (a === b) return true;

    if (a === null || b === null || a === undefined || b === undefined) {
      return a === b;
    }

    if (typeof a !== typeof b) return false;

    if (typeof a !== 'object') return false;

    // Handle circular references
    if (visited.has(a) || visited.has(b)) {
      return a === b;
    }

    visited.add(a);
    visited.add(b);

    try {
      if (Array.isArray(a) !== Array.isArray(b)) return false;

      if (Array.isArray(a)) {
        const arrayA = a as unknown[];
        const arrayB = b as unknown[];
        if (arrayA.length !== arrayB.length) return false;

        for (const [index, item] of arrayA.entries()) {
          if (!this.deepEqual(item, arrayB[index], visited)) return false;
        }
        return true;
      }

      const objectA = a as Record<string, unknown>;
      const objectB = b as Record<string, unknown>;

      const keysA = Object.keys(objectA);
      const keysB = Object.keys(objectB);

      if (keysA.length !== keysB.length) return false;

      for (const key of keysA) {
        if (!(key in objectB)) return false;
        if (!this.deepEqual(objectA[key], objectB[key], visited)) return false;
      }

      return true;
    } finally {
      visited.delete(a);
      visited.delete(b);
    }
  }
}
