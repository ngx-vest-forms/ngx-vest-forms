/**
 * Simplified value extraction utilities for Angular form integration
 * Focuses on DOM events and direct value handling
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Check if a value is a DOM event
 * @param value - Value to check
 * @returns True if the value is a DOM event
 */
export function isEvent(value: any): value is Event {
  return (
    value != null &&
    typeof value === 'object' &&
    'target' in value &&
    typeof value.preventDefault === 'function'
  );
}

/**
 * Extract a value from either a raw value or an event object
 * @param valueOrEvent - Either a raw value or an event object
 * @returns The extracted value
 */
export function extractValueFromEventOrValue(valueOrEvent: any): any {
  if (isEvent(valueOrEvent)) {
    return extractValue(valueOrEvent);
  }
  return valueOrEvent;
}

/**
 * Extract value from a DOM Event
 * @param event - DOM Event object
 * @returns Extracted value from the event target
 */
export function extractValue(event: Event): any {
  let target = event.target as
    | HTMLInputElement
    | HTMLSelectElement
    | HTMLTextAreaElement
    | null
    | undefined;

  // Fall back to currentTarget if target is null or undefined
  if (!target && event.currentTarget) {
    target = event.currentTarget as
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement;
  }

  if (!target) {
    return undefined;
  }

  const type = target.type?.toLowerCase();

  switch (type) {
    case 'checkbox': {
      return (target as HTMLInputElement).checked;
    }

    case 'radio': {
      return (target as HTMLInputElement).checked ? target.value : undefined;
    }

    case 'file': {
      return (target as HTMLInputElement).files;
    }

    case 'number':
    case 'range': {
      const numberValue = (target as HTMLInputElement).valueAsNumber;
      return !Number.isNaN(numberValue) && numberValue !== undefined
        ? numberValue
        : target.value;
    }

    case 'select-multiple': {
      const select = target as HTMLSelectElement;
      return [...select.selectedOptions].map((option) => option.value);
    }

    default: {
      return target.value;
    }
  }
}

/**
 * Create a setter function that handles both values and events
 * @param onChange - Callback function to call with the extracted value
 * @returns Setter function that accepts either a value or event
 */
export function createFieldSetter(onChange: (value: any) => void) {
  return (valueOrEvent: any) => {
    const value = extractValueFromEventOrValue(valueOrEvent);
    onChange(value);
  };
}

/**
 * Check if a value is empty for validation purposes
 * @param value - Value to check
 * @returns True if the value is considered empty
 */
export function isEmpty(value: any): boolean {
  if (value == null) {
    return true;
  }

  if (typeof value === 'string') {
    return value.length === 0;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (
    value instanceof Date ||
    value instanceof RegExp ||
    typeof value === 'function'
  ) {
    return false;
  }

  if (value instanceof Map || value instanceof Set) {
    return value.size === 0;
  }

  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }

  return false;
}

/**
 * Normalize a value for form field assignment
 * @param value - Raw value to normalize
 * @param expectedType - Expected TypeScript type (for basic validation)
 * @returns Normalized value
 */
export function normalizeFieldValue(value: any, expectedType?: string): any {
  // Handle null/undefined
  if (value == null) {
    return value;
  }

  // If no expected type, return as-is
  if (!expectedType) {
    return value;
  }

  // Basic type coercion based on expected type
  switch (expectedType) {
    case 'string': {
      return String(value);
    }

    case 'number': {
      return typeof value === 'number' ? value : Number(value);
    }

    case 'boolean': {
      return Boolean(value);
    }

    case 'object': {
      return typeof value === 'object' ? value : { value };
    }

    default: {
      return value;
    }
  }
}

/**
 * Deep clone a value to prevent mutation
 * @param value - Value to clone
 * @returns Deep cloned value
 */
export function deepClone<T>(value: T, seen = new Map<any, any>()): T {
  if (value == null || typeof value !== 'object') {
    return value;
  }

  if (seen.has(value)) {
    return seen.get(value);
  }

  if (value instanceof Date) {
    return new Date(value) as T;
  }

  if (value instanceof RegExp) {
    return new RegExp(value.source, value.flags) as T;
  }

  if (value instanceof Map) {
    const clonedMap = new Map();
    seen.set(value, clonedMap);
    for (const [key, mapValue] of value.entries()) {
      clonedMap.set(key, deepClone(mapValue, seen));
    }
    return clonedMap as T;
  }

  if (value instanceof Set) {
    const clonedSet = new Set();
    seen.set(value, clonedSet);
    for (const setValue of value.values()) {
      clonedSet.add(deepClone(setValue, seen));
    }
    return clonedSet as T;
  }

  if (Array.isArray(value)) {
    const clonedArray: unknown[] = [];
    seen.set(value, clonedArray);
    let index = 0;
    for (const item of value) {
      clonedArray[index] = deepClone(item, seen);
      index += 1;
    }
    return clonedArray as T;
  }

  const proto = Object.getPrototypeOf(value);
  const clonedObject = Object.create(proto);
  seen.set(value, clonedObject);

  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor) {
      continue;
    }

    if ('value' in descriptor) {
      descriptor.value = deepClone(descriptor.value, seen);
    }

    Object.defineProperty(clonedObject, key, descriptor);
  }

  return clonedObject as T;
}
