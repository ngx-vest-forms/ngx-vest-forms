/**
 * Value extraction utilities for handling events and values in form field setters
 * Framework-agnostic utilities for extracting values from various input sources
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Extract a value from either a raw value or an event object
 * Handles common DOM events like input, change, and custom events
 * @param valueOrEvent - Either a raw value or an event object
 * @returns The extracted value
 */
export function extractValueFromEventOrValue(valueOrEvent: any): any {
  // If it's null or undefined, return as-is
  if (valueOrEvent == null) {
    return valueOrEvent;
  }

  // If it's not an object, it's likely a raw value
  if (typeof valueOrEvent !== 'object') {
    return valueOrEvent;
  }

  // Check if it's a DOM Event
  if (isEvent(valueOrEvent)) {
    return extractValueFromEvent(valueOrEvent);
  }

  // If it has a 'value' property, extract it (custom event objects)
  if ('value' in valueOrEvent && valueOrEvent.value !== undefined) {
    return valueOrEvent.value;
  }

  // Otherwise, return the object as-is
  return valueOrEvent;
}

/**
 * Extract value from a DOM Event object
 * @param event - DOM Event object
 * @returns Extracted value from the event
 */
export function extractValueFromEvent(event: Event): any {
  let target = event.target as HTMLElement;

  // Fallback to currentTarget if target is null
  if (!target) {
    target = event.currentTarget as HTMLElement;
  }

  if (!target) {
    return undefined;
  }

  // Handle different input types
  if (target instanceof HTMLInputElement) {
    return extractFromInput(target);
  }

  if (target instanceof HTMLSelectElement) {
    return extractFromSelect(target);
  }

  if (target instanceof HTMLTextAreaElement) {
    return target.value;
  }

  // For other elements, try to extract common properties
  if ('value' in target) {
    return (target as any).value;
  }

  if ('textContent' in target) {
    return target.textContent;
  }

  return undefined;
}

/**
 * Extract value from an HTMLInputElement based on its type
 * @param input - HTMLInputElement
 * @returns Extracted value based on input type
 */
function extractFromInput(input: HTMLInputElement): any {
  switch (input.type) {
    case 'checkbox': {
      return input.checked;
    }

    case 'radio': {
      return input.checked ? input.value : undefined;
    }

    case 'number':
    case 'range': {
      return input.valueAsNumber;
    }

    case 'date':
    case 'datetime-local':
    case 'time': {
      return input.valueAsDate || input.value;
    }

    case 'file': {
      return input.files;
    }

    default: {
      return input.value;
    }
  }
}

/**
 * Extract value from an HTMLSelectElement
 * @param select - HTMLSelectElement
 * @returns Selected value(s)
 */
function extractFromSelect(select: HTMLSelectElement): any {
  if (select.multiple) {
    // For multiple select, return array of selected values
    // TypeScript struggles with HTMLCollection iteration
    // eslint-disable-next-line unicorn/prefer-spread
    return Array.from(select.selectedOptions).map((option) => option.value);
  }

  return select.value;
}

/**
 * Check if an object is likely a DOM Event
 * @param object - Object to check
 * @returns True if the object appears to be a DOM Event
 */
function isEvent(object: any): object is Event {
  return (
    object &&
    typeof object === 'object' &&
    'target' in object &&
    // Check if target has expected form control properties
    object.target &&
    ('value' in object.target ||
      'checked' in object.target ||
      'files' in object.target)
  );
}

/**
 * Normalize a value for form field assignment
 * Handles type coercion and validation
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
    return value.trim().length === 0;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }

  return false;
}

/**
 * Deep clone a value to prevent mutation
 * @param value - Value to clone
 * @returns Deep cloned value
 */
export function deepClone(value: any): any {
  if (value == null || typeof value !== 'object') {
    return value;
  }

  if (value instanceof Date) {
    return new Date(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => deepClone(item));
  }

  if (typeof value === 'object') {
    const cloned: any = {};
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        cloned[key] = deepClone(value[key]);
      }
    }
    return cloned;
  }

  return value;
}
