/**
 * Form arrays implementation for dynamic collections
 * Provides stable keys and proper Vest memoization integration
 */

import { computed, Signal, WritableSignal } from '@angular/core';
import type { SuiteResult } from 'vest';
import { getValueByPath, setValueByPath } from './utils/path-utils';
import { deepClone } from './utils/value-extraction';
import type { VestField, VestFormArray } from './vest-form.types';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Create a VestFormArray instance for managing dynamic collections
 * @param model - Form model signal
 * @param path - Dot-notation path to the array in the model
 * @param suite - Vest suite for validation
 * @param suiteResult - Current suite result signal
 * @param createField - Function to create field instances
 * @returns VestFormArray instance
 */
export function createVestFormArray<T = any>(
  model: WritableSignal<any>,
  path: string,
  suite: any,
  suiteResult: Signal<SuiteResult<string, string>>,
  createField: (fieldPath: string) => VestField<any>,
): VestFormArray<T> {
  // Array-level computed signals
  const items = computed(() => {
    const arrayValue = getValueByPath<T[]>(model(), path);
    return arrayValue || [];
  });

  const length = computed(() => items().length);

  const valid = computed(() => {
    const currentResult = suiteResult();
    const arrayItems = items();

    // Check if the array itself is valid
    if (currentResult.hasErrors(path)) {
      return false;
    }

    // Check if all array items are valid
    return arrayItems.every((_item, index) => {
      const itemPath = `${path}.${index}`;
      return currentResult.isValid(itemPath);
    });
  });

  const errors = computed(() => {
    return suiteResult().getErrors(path);
  });

  /**
   * Update the array in the model and trigger validation
   */
  function updateArray(newArray: T[]) {
    const updatedModel = setValueByPath(model(), path, newArray);
    model.set(updatedModel);

    // Trigger validation for the array path
    suite(model(), path);

    // Also validate array items if they have validation rules
    for (const [index] of newArray.entries()) {
      const itemPath = `${path}.${index}`;
      suite(model(), itemPath);
    }
  }

  /**
   * Array manipulation methods
   */
  const push = (item: T) => {
    const currentArray = items();
    const newArray = [...currentArray, item];
    updateArray(newArray);
  };

  const remove = (index: number) => {
    const currentArray = items();
    if (index < 0 || index >= currentArray.length) {
      return; // Invalid index
    }

    const newArray = currentArray.filter((_, itemIndex) => itemIndex !== index);
    updateArray(newArray);
  };

  const move = (fromIndex: number, toIndex: number) => {
    const currentArray = items();
    if (
      fromIndex < 0 ||
      fromIndex >= currentArray.length ||
      toIndex < 0 ||
      toIndex >= currentArray.length
    ) {
      return; // Invalid indices
    }

    const newArray = [...currentArray];
    const [movedItem] = newArray.splice(fromIndex, 1);
    newArray.splice(toIndex, 0, movedItem);
    updateArray(newArray);
  };

  const insert = (index: number, item: T) => {
    const currentArray = items();
    if (index < 0 || index > currentArray.length) {
      return; // Invalid index
    }

    const newArray = [...currentArray];
    newArray.splice(index, 0, item);
    updateArray(newArray);
  };

  const at = (index: number): VestField<T> => {
    const itemPath = `${path}.${index}`;
    return createField(itemPath);
  };

  const reset = () => {
    // Reset to empty array (could be enhanced to reset to initial array)
    updateArray([]);
  };

  return {
    items,
    length,
    valid,
    errors,
    push,
    remove,
    move,
    insert,
    at,
    reset,
  };
}

/**
 * Enhanced form array with additional utilities
 */
export type EnhancedVestFormArray<T = any> = VestFormArray<T> & {
  /** Check if array is empty */
  isEmpty: Signal<boolean>;

  /** Get the first item */
  first: Signal<T | undefined>;

  /** Get the last item */
  last: Signal<T | undefined>;

  /** Map over array items with field access */
  map<R>(callback: (item: T, index: number, field: VestField<T>) => R): R[];

  /** Find an item by predicate */
  find(predicate: (item: T, index: number) => boolean): T | undefined;

  /** Find item index by predicate */
  findIndex(predicate: (item: T, index: number) => boolean): number;

  /** Check if any item matches predicate */
  some(predicate: (item: T, index: number) => boolean): boolean;

  /** Check if all items match predicate */
  every(predicate: (item: T, index: number) => boolean): boolean;

  /** Replace item at index */
  replace(index: number, item: T): void;

  /** Swap two items */
  swap(indexA: number, indexB: number): void;

  /** Clear all items */
  clear(): void;

  /** Duplicate item at index */
  duplicate(index: number): void;
};

/**
 * Create an enhanced form array with additional utility methods
 */
export function createEnhancedVestFormArray<T = any>(
  model: WritableSignal<any>,
  path: string,
  suite: any,
  suiteResult: Signal<SuiteResult<string, string>>,
  createField: (fieldPath: string) => VestField<any>,
): EnhancedVestFormArray<T> {
  const baseArray = createVestFormArray<T>(
    model,
    path,
    suite,
    suiteResult,
    createField,
  );

  // Additional computed properties
  const isEmpty = computed(() => baseArray.length() === 0);
  const first = computed(() => baseArray.items()[0]);
  const last = computed(() => {
    const arrayItems = baseArray.items();
    return arrayItems.at(-1);
  });

  // Additional methods
  const map = <R>(
    callback: (item: T, index: number, field: VestField<T>) => R,
  ): R[] => {
    return baseArray.items().map((item, index) => {
      const field = baseArray.at(index);
      return callback(item, index, field);
    });
  };

  const find = (
    predicate: (item: T, index: number) => boolean,
  ): T | undefined => {
    return baseArray.items().find((item, index) => predicate(item, index));
  };

  const findIndex = (
    predicate: (item: T, index: number) => boolean,
  ): number => {
    return baseArray.items().findIndex((item, index) => predicate(item, index));
  };

  const some = (predicate: (item: T, index: number) => boolean): boolean => {
    return baseArray.items().some((item, index) => predicate(item, index));
  };

  const every = (predicate: (item: T, index: number) => boolean): boolean => {
    return baseArray.items().every((item, index) => predicate(item, index));
  };

  const replace = (index: number, item: T): void => {
    const currentArray = baseArray.items();
    if (index < 0 || index >= currentArray.length) {
      return; // Invalid index
    }

    const newArray = [...currentArray];
    newArray[index] = item;

    const updatedModel = setValueByPath(model(), path, newArray);
    model.set(updatedModel);
    suite(model(), path);
  };

  const swap = (indexA: number, indexB: number): void => {
    const currentArray = baseArray.items();
    if (
      indexA < 0 ||
      indexA >= currentArray.length ||
      indexB < 0 ||
      indexB >= currentArray.length
    ) {
      return; // Invalid indices
    }

    const newArray = [...currentArray];
    [newArray[indexA], newArray[indexB]] = [newArray[indexB], newArray[indexA]];

    const updatedModel = setValueByPath(model(), path, newArray);
    model.set(updatedModel);
    suite(model(), path);
  };

  const clear = (): void => {
    const updatedModel = setValueByPath(model(), path, []);
    model.set(updatedModel);
    suite(model(), path);
  };

  const duplicate = (index: number): void => {
    const currentArray = baseArray.items();
    if (index < 0 || index >= currentArray.length) {
      return; // Invalid index
    }

    const itemToDuplicate = currentArray[index];
    const duplicatedItem = deepClone(itemToDuplicate);
    baseArray.insert(index + 1, duplicatedItem);
  };

  return {
    ...baseArray,
    isEmpty,
    first,
    last,
    map,
    find,
    findIndex,
    some,
    every,
    replace,
    swap,
    clear,
    duplicate,
  };
}

/**
 * Array validation helpers
 */
export const arrayValidationHelpers = {
  /**
   * Validate minimum array length
   */
  minLength: (min: number) => (array: any[]) => {
    return array && array.length >= min;
  },

  /**
   * Validate maximum array length
   */
  maxLength: (max: number) => (array: any[]) => {
    return !array || array.length <= max;
  },

  /**
   * Validate exact array length
   */
  exactLength: (length: number) => (array: any[]) => {
    return array && array.length === length;
  },

  /**
   * Validate that array has no duplicates
   */
  noDuplicates: (keySelector?: (item: any) => any) => (array: any[]) => {
    if (!array || array.length <= 1) {
      return true;
    }

    const keys = keySelector ? array.map((item) => keySelector(item)) : array;
    const uniqueKeys = new Set(keys);
    return uniqueKeys.size === keys.length;
  },

  /**
   * Validate that all array items are unique objects by a specific property
   */
  uniqueBy: (property: string) => (array: any[]) => {
    if (!array || array.length <= 1) {
      return true;
    }

    const values = array.map((item) => item && item[property]);
    const uniqueValues = new Set(values);
    return uniqueValues.size === values.length;
  },
};
