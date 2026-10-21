import {
  AbstractControl,
  FormArray,
  FormGroup,
  isFormArray,
  isFormGroup,
  ValidationErrors,
} from '@angular/forms';
import { ROOT_FORM } from '../constants';
import { isUnsafePathSegment, parseFieldPath } from './field-path.utils';

type UnknownRecord = Record<string, unknown>;

type ControlWithOptionalName = AbstractControl & {
  name?: unknown;
};

type FormContainer = FormGroup | FormArray;

/**
 * Result of {@link getAllFormErrors}. Errors and warnings are exposed as
 * sibling records keyed by dotted field path so consumers can iterate either
 * independently — no non-enumerable side-channels.
 *
 * @publicApi
 */
export type NgxFormErrorsByPath = {
  /** Blocking validation errors keyed by field path. */
  errors: Record<string, string[]>;
  /** Non-blocking validation warnings keyed by field path. */
  warnings: Record<string, string[]>;
};

const ERROR_MESSAGES_KEY = 'errors';
const WARNING_MESSAGES_KEY = 'warnings';

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Returns the `[key, child]` pairs of a form group or form array. Array keys
 * are the index as a string.
 */
function getChildEntries(
  container: FormContainer
): Array<[string, AbstractControl]> {
  if (isFormArray(container)) {
    return container.controls.map((child, index) => [String(index), child]);
  }

  return Object.entries(container.controls);
}

/**
 * The path of `control` below `root`, built by walking up its parent chain:
 * O(depth × siblings) instead of a search of the whole tree. Returns null
 * when the chain does not reach `root` or a parent no longer lists the
 * control, so the caller can fall back to a full search.
 */
function getPathFromParents(
  root: FormGroup,
  control: AbstractControl
): string | null {
  const segments: string[] = [];
  let current: AbstractControl = control;
  while (current !== root) {
    const parent: FormContainer | null = current.parent;
    if (!parent) {
      return null;
    }
    const entry = getChildEntries(parent).find(
      ([, child]) => child === current
    );
    if (!entry) {
      return null;
    }
    segments.unshift(entry[0]);
    current = parent;
  }
  return segments.length > 0 ? segments.join('.') : null;
}

function getControlPath(
  formGroup: FormGroup,
  control: AbstractControl
): string {
  // Fast path: the control's own parent chain.
  const fromParents = getPathFromParents(formGroup, control);
  if (fromParents !== null) {
    return fromParents;
  }

  // Depth-first traversal from provided root
  for (const [key, child] of getChildEntries(formGroup)) {
    if (child === control) {
      return key;
    }
    if (isFormGroup(child) || isFormArray(child)) {
      const subPath = getControlPath(child as FormGroup, control);
      if (subPath) {
        return `${key}.${subPath}`;
      }
    }
  }

  // Fallback: walk up the parent chain from control to root
  let current: AbstractControl | null | undefined = control;
  const segments: string[] = [];
  while (current?.parent) {
    const parent: FormContainer = current.parent;
    for (const [key, controlInParent] of getChildEntries(parent)) {
      if (controlInParent === current) {
        segments.unshift(key);
        break;
      }
    }
    current = parent;
    if (current === formGroup) {
      return segments.join('.');
    }
  }

  // Last resort: try control.name if available
  const name = (control as ControlWithOptionalName).name;
  if (typeof name === 'string') {
    return name;
  }
  return '';
}

/**
 * Returns the dotted key path from `formGroup` down to `control`, or `''` when
 * `control` is not below `formGroup`. It descends only through nested
 * FormGroups, not FormArrays.
 * @param formGroup
 * @param control
 */
function getGroupPath(formGroup: FormGroup, control: AbstractControl): string {
  for (const [key, ctrl] of getChildEntries(formGroup)) {
    if (ctrl === control) {
      return key;
    }
    if (isFormGroup(ctrl)) {
      const path = getGroupPath(ctrl, control);
      if (path) {
        return `${key}.${path}`;
      }
    }
  }
  return '';
}

/**
 * @internal
 * Internal utility for calculating form control field paths.
 *
 * **Not intended for external use.** This function is used internally by the library
 * to determine field names for validation. Use the `name` attribute on your form controls
 * instead of relying on this function.
 *
 * Calculates the field name of a form control: Eg: addresses.shippingAddress.street
 * @param rootForm
 * @param control
 */
export function getFormControlField(
  rootForm: FormGroup,
  control: AbstractControl
): string {
  return getControlPath(rootForm, control);
}

/**
 * @internal
 * Internal utility for calculating form group field paths.
 *
 * **Not intended for external use.** This function is used internally by the library
 * to determine field names for nested form groups.
 *
 * Calcuates the field name of a form group Eg: addresses.shippingAddress
 * @param rootForm
 * @param control
 */
export function getFormGroupField(
  rootForm: FormGroup,
  control: AbstractControl
): string {
  return getGroupPath(rootForm, control);
}

function isPlainRecord(value: unknown): value is UnknownRecord {
  if (!isRecord(value)) {
    return false;
  }
  // Compare against "a root prototype" rather than `Object.prototype`, so
  // objects from another realm (e.g. a jsdom `structuredClone`) still count.
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === null || Object.getPrototypeOf(prototype) === null;
}

/**
 * @internal
 * Copies plain objects and arrays at every level and keeps every other value
 * (Dates, Files, class instances, Moment/Luxon/Temporal values, functions) by
 * reference, the same way Angular's own `form.value` holds them.
 *
 * Unlike `structuredClone`, this never throws on values that hold functions
 * and never strips a class instance down to a plain object. Unsafe
 * prototype-related keys (`__proto__`, `prototype`, `constructor`) are left
 * out at every level, and circular references map to their copy.
 */
export function copyFormValue(
  value: unknown,
  seen = new Map<object, unknown>()
): unknown {
  const isArray = Array.isArray(value);
  if (!(isArray || isPlainRecord(value))) {
    return value;
  }
  const existing = seen.get(value);
  if (existing !== undefined) {
    return existing;
  }
  if (isArray) {
    const copy: unknown[] = [];
    seen.set(value, copy);
    for (const item of value) {
      copy.push(copyFormValue(item, seen));
    }
    return copy;
  }
  const copy: UnknownRecord = Object.create(
    Object.getPrototypeOf(value) as object | null
  ) as UnknownRecord;
  seen.set(value, copy);
  for (const [key, child] of Object.entries(value)) {
    if (!isUnsafePathSegment(key)) {
      copy[key] = copyFormValue(child, seen);
    }
  }
  return copy;
}

/**
 * @internal
 * Internal utility that returns the form value including disabled controls.
 *
 * **Not intended for external use.** This function is used internally by the library
 * to include disabled field values in form submissions. Use Angular's `getRawValue()`
 * method on your form if you need to access disabled field values.
 *
 * `form.getRawValue()` already holds every control, and for each enabled one
 * the same value as `form.value`: groups leave out disabled children only from
 * `value`, and FormArrays leave them out and shift the remaining items. So the
 * raw value is the whole answer, with every item of a FormArray at its index.
 *
 * Plain objects and arrays in the result are fresh copies, so callers can
 * mutate them without touching form state. Other values (Dates, class
 * instances, date-library objects) are kept by reference, because
 * `structuredClone` throws on values that hold functions and strips class
 * prototypes.
 *
 * Security: Unsafe prototype-related keys (`__proto__`, `prototype`, `constructor`)
 * are removed at every level, including inside arrays.
 * @param form
 */
export function mergeValuesAndRawValues<T>(form: FormGroup): T {
  return copyFormValue(form.getRawValue()) as T;
}

function getStringArrayError(
  errors: ValidationErrors | null,
  key: string
): string[] | undefined {
  const value = errors?.[key];
  return Array.isArray(value)
    ? value.filter((v): v is string => typeof v === 'string')
    : undefined;
}

/**
 * Sets a value in an object at the provided field path.
 *
 * Supports dot and bracket notation via `parseFieldPath()`.
 * Examples: `user.profile.name`, `addresses[0].street`.
 *
 * Security: If any path segment matches an unsafe prototype-related key
 * (`__proto__`, `prototype`, `constructor`), the write is ignored.
 *
 * Intermediate containers are created on demand: a numeric next segment
 * creates an array, otherwise a plain object.
 *
 * @param obj - Target object to mutate.
 * @param path - Dot/bracket field path.
 * @param value - Value to assign at the resolved path.
 *
 * @example
 * ```ts
 * const model: Record<string, unknown> = {};
 * setValueAtPath(model, 'user.profile.name', 'Ada');
 * // model === { user: { profile: { name: 'Ada' } } }
 *
 * setValueAtPath(model, 'addresses[0].street', 'Main St');
 * // model.addresses === [{ street: 'Main St' }]
 * ```
 */
export function setValueAtPath(
  obj: object,
  path: string,
  value: unknown
): void {
  const keys = parseFieldPath(path);
  if (keys.length === 0) {
    return;
  }

  let current: UnknownRecord = obj as UnknownRecord;

  for (let i = 0; i < keys.length - 1; i++) {
    const segment = keys[i];
    const nextSegment = keys[i + 1];
    if (segment === undefined) {
      continue;
    }
    if (isUnsafePathSegment(segment)) {
      return;
    }

    const key = String(segment);

    const next = current[key];
    if (!Array.isArray(next) && !isRecord(next)) {
      // parseFieldPath already turns numeric parts into numbers.
      const shouldCreateArray = typeof nextSegment === 'number';
      current[key] = shouldCreateArray ? [] : {};
    }
    current = current[key] as UnknownRecord;
  }

  const lastSegment = keys[keys.length - 1];
  if (lastSegment === undefined || isUnsafePathSegment(lastSegment)) {
    return;
  }

  current[String(lastSegment)] = value;
}

/**
 * Collects all errors and warnings reachable from `form` keyed by dotted
 * field path.
 *
 * Root-form (`ROOT_FORM`) entries come from `form.errors.errors` and
 * `form.errors.warnings` — the shape `ValidateRootFormDirective` writes.
 * Field-level entries come from each descendant control's `errors.errors`
 * and `errors.warnings`. Disabled controls are skipped.
 *
 * Inside templates and components, prefer the directive's `formState()` and
 * `fieldWarnings()` signals — they're reactive and already memoised. Reach
 * for this function when you need a one-shot snapshot, e.g. for logging or
 * structured-clone-friendly serialisation.
 *
 * @publicApi
 */
export function getAllFormErrors(form?: AbstractControl): NgxFormErrorsByPath {
  const errors: Record<string, string[]> = {};
  const warnings: Record<string, string[]> = {};
  if (!form) {
    return { errors, warnings };
  }

  // Collect root form errors / warnings (from ValidateRootFormDirective) before
  // processing children so they appear under the ROOT_FORM key.
  if (form.enabled) {
    const rootErrors = getStringArrayError(form.errors, ERROR_MESSAGES_KEY);
    if (rootErrors) {
      errors[ROOT_FORM] = rootErrors;
    }
    const rootWarnings = getStringArrayError(form.errors, WARNING_MESSAGES_KEY);
    if (rootWarnings) {
      warnings[ROOT_FORM] = rootWarnings;
    }
  }

  // Dot notation for every segment, array indices included (`users.0.name`),
  // matching Vest field names and the other paths the directive reports
  // (`fieldWarnings`, `fieldBlur`, validated fields).
  function collectChildren(container: AbstractControl, prefix: string): void {
    if (!isFormGroup(container) && !isFormArray(container)) {
      return;
    }
    for (const [key, childControl] of getChildEntries(container)) {
      collect(childControl, prefix ? `${prefix}.${key}` : key);
    }
  }

  function collect(control: AbstractControl, path: string): void {
    collectChildren(control, path);

    if (control.enabled) {
      const fieldErrors = getStringArrayError(
        control.errors,
        ERROR_MESSAGES_KEY
      );
      if (fieldErrors) {
        errors[path] = fieldErrors;
      }
      const fieldWarnings = getStringArrayError(
        control.errors,
        WARNING_MESSAGES_KEY
      );
      if (fieldWarnings) {
        warnings[path] = fieldWarnings;
      }
    }
  }

  // The root's own errors were collected above under ROOT_FORM.
  collectChildren(form, '');

  return { errors, warnings };
}
