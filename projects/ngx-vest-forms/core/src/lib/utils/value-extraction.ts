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
  if (valueOrEvent == null) {
    return valueOrEvent;
  }

  if (typeof valueOrEvent !== 'object') {
    return valueOrEvent;
  }

  if (isPlainObject(valueOrEvent)) {
    const candidate = valueOrEvent as Record<string, unknown>;

    if ('target' in candidate) {
      const target = candidate['target'] as unknown;
      const hasEventApi =
        typeof candidate['preventDefault'] === 'function' ||
        typeof candidate['stopPropagation'] === 'function' ||
        'nativeEvent' in candidate ||
        'isTrusted' in candidate ||
        'currentTarget' in candidate;

      const targetHasControlMarkers =
        target == null ||
        typeof target !== 'object' ||
        !isPlainObject(target) ||
        'type' in (target as Record<string, unknown>) ||
        'checked' in (target as Record<string, unknown>) ||
        'files' in (target as Record<string, unknown>);

      if (!hasEventApi && !targetHasControlMarkers) {
        return valueOrEvent;
      }
    } else if (
      !('currentTarget' in candidate) &&
      !('nativeEvent' in candidate) &&
      typeof candidate['preventDefault'] !== 'function' &&
      typeof candidate['stopPropagation'] !== 'function'
    ) {
      return valueOrEvent;
    }
  }

  if (isEventLike(valueOrEvent)) {
    return extractValueFromEvent(valueOrEvent as EventLike);
  }

  if ('value' in valueOrEvent && valueOrEvent.value !== undefined) {
    return valueOrEvent.value;
  }

  return valueOrEvent;
}

/**
 * Extract value from a DOM Event object
 * @param event - DOM Event object
 * @returns Extracted value from the event
 */
export function extractValueFromEvent(event: EventLike): any {
  const target = resolveEventTarget(event);

  if (!target) {
    return undefined;
  }

  // Mirror native form controls while remaining framework agnostic.
  const type = (target as { type?: string }).type?.toLowerCase();

  if (type === 'checkbox') {
    return Boolean((target as { checked?: boolean }).checked);
  }

  if (type === 'radio') {
    const radio = target as { checked?: boolean; value?: unknown };
    return radio.checked ? radio.value : undefined;
  }

  if (type === 'file') {
    const files = (target as { files?: unknown }).files;
    return toFileList(files) ?? null;
  }

  if (type === 'number' || type === 'range') {
    const valueAsNumber = (target as { valueAsNumber?: number }).valueAsNumber;
    if (typeof valueAsNumber === 'number' && !Number.isNaN(valueAsNumber)) {
      return valueAsNumber;
    }
  }

  if (
    'files' in target &&
    (target as { files?: unknown }).files !== undefined
  ) {
    return toFileList((target as { files?: unknown }).files) ?? null;
  }

  if (isSelectElement(target)) {
    return extractFromSelect(target as SelectLike);
  }

  if ('value' in target) {
    return (target as { value: unknown }).value;
  }

  if ('textContent' in target) {
    return (target as { textContent: string | null }).textContent ?? undefined;
  }

  return undefined;
}

/**
 * Extract value from an HTMLInputElement based on its type
 * @param input - HTMLInputElement
 * @returns Extracted value based on input type
 */
/**
 * Extract value from an HTMLSelectElement
 * @param select - HTMLSelectElement
 * @returns Selected value(s)
 */
function extractFromSelect(select: SelectLike): any {
  if (select.multiple && Array.isArray(select.selectedOptions)) {
    return select.selectedOptions.map((option) => option.value);
  }

  if (select.multiple && select.selectedOptions) {
    const selectedOptions = select.selectedOptions as unknown as {
      length: number;
      [index: number]: { value: unknown } | null | undefined;
    };

    const values: unknown[] = [];
    let index = 0;
    while (index < selectedOptions.length) {
      const option = selectedOptions[index];
      if (option != null) {
        values.push(option.value);
      }
      index += 1;
    }

    return values;
  }

  return select.value;
}

/**
 * Check if an object is likely a DOM Event
 * @param object - Object to check
 * @returns True if the object appears to be a DOM Event
 */
function isEventLike(value: unknown): boolean {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const hasEventApi =
    typeof candidate['preventDefault'] === 'function' ||
    typeof candidate['stopPropagation'] === 'function' ||
    'nativeEvent' in candidate ||
    'isTrusted' in candidate;

  if (hasEventApi) {
    return true;
  }

  if (!('target' in candidate) && !('currentTarget' in candidate)) {
    return false;
  }

  const target = (candidate['target'] ?? candidate['currentTarget']) as unknown;

  if (target == null) {
    return true;
  }

  if (typeof Node !== 'undefined' && target instanceof Node) {
    return true;
  }

  if (!isPlainObject(target)) {
    return true;
  }

  if (
    'type' in target ||
    'checked' in target ||
    'files' in target ||
    'value' in target
  ) {
    return true;
  }

  return false;
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

export type EventLike = Partial<Event> & {
  target?: EventTargetLike | null;
  currentTarget?: EventTargetLike | null;
  preventDefault?: (...arguments_: any[]) => void;
  stopPropagation?: (...arguments_: any[]) => void;
  nativeEvent?: unknown;
  isTrusted?: boolean;
};

type EventTargetLike = EventTarget | Record<string, unknown> | null | undefined;

type SelectLike = {
  multiple?: boolean;
  selectedOptions?: ArrayLike<{ value: unknown }> | { length: number } | null;
  value?: any;
};

function resolveEventTarget(event: EventLike): EventTargetLike {
  if ('target' in event && event.target != null) {
    return event.target as EventTargetLike;
  }

  if ('currentTarget' in event && event.currentTarget != null) {
    return event.currentTarget as EventTargetLike;
  }

  if ('target' in event) {
    return event.target as EventTargetLike;
  }

  return undefined;
}

function isSelectElement(target: EventTargetLike): target is SelectLike {
  if (!target || typeof target !== 'object') {
    return false;
  }

  const candidate = target as Record<string, unknown>;
  if ('multiple' in candidate || 'selectedOptions' in candidate) {
    return true;
  }

  if ('tagName' in candidate && typeof candidate['tagName'] === 'string') {
    return candidate['tagName'].toLowerCase() === 'select';
  }

  return false;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

function toFileList(files: unknown): FileList | null {
  if (!files) {
    return null;
  }

  if (typeof FileList !== 'undefined' && files instanceof FileList) {
    return files;
  }

  const fileArray: File[] = extractFiles(files);

  if (fileArray.length === 0) {
    return null;
  }

  if (typeof DataTransfer !== 'undefined') {
    const dataTransfer = new DataTransfer();
    for (const file of fileArray) {
      dataTransfer.items.add(file);
    }
    return dataTransfer.files;
  }

  if (typeof FileList !== 'undefined' && FileList.prototype) {
    const fileList = Object.create(FileList.prototype) as FileList &
      Record<number, File>;

    Object.defineProperty(fileList, 'length', {
      value: fileArray.length,
      configurable: true,
    });

    let index = 0;
    for (const file of fileArray) {
      Object.defineProperty(fileList, index, {
        value: file,
        configurable: true,
        enumerable: true,
      });
      index += 1;
    }

    Object.defineProperty(fileList, 'item', {
      value(index: number) {
        return fileArray[index] ?? null;
      },
      configurable: true,
    });

    Object.defineProperty(fileList, Symbol.iterator, {
      value: function* () {
        for (const file of fileArray) {
          yield file;
        }
      },
      configurable: true,
    });

    return fileList;
  }

  return null;
}

function extractFiles(files: unknown): File[] {
  if (!files) {
    return [];
  }

  if (Array.isArray(files)) {
    return files.filter((item): item is File => item instanceof File);
  }

  if (typeof files === 'object' && Symbol.iterator in files) {
    return [...(files as Iterable<unknown>)].filter(
      (item): item is File => item instanceof File,
    );
  }

  return [];
}
