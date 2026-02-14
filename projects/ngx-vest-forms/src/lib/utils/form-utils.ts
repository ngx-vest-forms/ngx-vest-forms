import {
  AbstractControl,
  FormArray,
  FormGroup,
  isFormArray,
  isFormGroup,
  ValidationErrors,
} from '@angular/forms';
import { ROOT_FORM } from '../constants';
import { stringifyFieldPath } from './field-path.utils';

type UnknownRecord = Record<string, unknown>;

type ControlWithOptionalName = AbstractControl & {
  name?: unknown;
};

type FormContainer = FormGroup | FormArray;
type ErrorList = string[] & { warnings?: string[] };

const ERROR_MESSAGES_KEY = 'errors';
const WARNING_MESSAGES_KEY = 'warnings';

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Recursively calculates the path of a form control
 * @param formGroup
 * @param control
 */
function getChildEntries(
  container: FormContainer
): Array<[string, AbstractControl]> {
  if (isFormArray(container)) {
    return container.controls.map((child, index) => [String(index), child]);
  }

  return Object.entries(container.controls);
}

function getControlPath(
  formGroup: FormGroup,
  control: AbstractControl
): string {
  // First attempt: depth-first traversal from provided root
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
 * Recursively calculates the path of a form group
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

/**
 * @internal
 * Internal utility for merging form values with disabled field values.
 *
 * **Not intended for external use.** This function is used internally by the library
 * to include disabled field values in form submissions. Use Angular's `getRawValue()`
 * method on your form if you need to access disabled field values.
 *
 * This RxJS operator merges the value of the form with the raw value.
 * By doing this we can assure that we don't lose values of disabled form fields
 * @param form
 */
export function mergeValuesAndRawValues<T>(form: FormGroup): T {
  // Deep clone both values to prevent reference sharing.
  // This is necessary because:
  // 1. form.value may contain object references that could be mutated elsewhere
  // 2. form.getRawValue() also returns references to form control values
  // 3. Without cloning, mutations to the returned object would affect the original form state
  // 4. The merge operation itself requires a mutable copy to work with
  // Performance note: For large forms, this may have performance implications. However,
  // reference isolation is critical for maintaining form state integrity.
  const value = structuredClone(form.value);
  const rawValue = structuredClone(form.getRawValue());

  // Recursive function to merge rawValue into value
  function mergeRecursive(target: UnknownRecord, source: UnknownRecord): void {
    for (const key of Object.keys(source)) {
      const sourceValue = source[key];
      const targetValue = target[key];

      if (targetValue === undefined) {
        // If the key is not in the target, add it directly (for disabled fields)
        target[key] = sourceValue;
      } else if (isRecord(sourceValue) && isRecord(targetValue)) {
        // If the value is an object, merge it recursively
        mergeRecursive(targetValue, sourceValue);
      }
      // If the target already has the key with a primitive value, it's left as is to maintain references
    }
  }

  mergeRecursive(value as UnknownRecord, rawValue as UnknownRecord);
  return value;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
type Primitive = undefined | null | boolean | string | number | Function;

function isPrimitive(value: unknown): value is Primitive {
  return (
    value === null || (typeof value !== 'object' && typeof value !== 'function')
  );
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
 * Performs a deep-clone of an object
 * @param obj
 *
 * @deprecated Use official ES {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone structuredClone} instead
 *
 * Browser Support: structuredClone is available in all modern browsers (Chrome 98+, Firefox 94+, Safari 15.4+, Edge 98+)
 * and Node.js 17+. A polyfill is provided in test-setup.ts for Jest test environments.
 */
export function cloneDeep<T>(object: T): T {
  // Handle primitives (null, undefined, boolean, string, number, function)
  if (isPrimitive(object)) {
    return object;
  }

  // Handle Date
  if (object instanceof Date) {
    return new Date(object) as T;
  }

  // Handle Array
  if (Array.isArray(object)) {
    return object.map((item) => cloneDeep(item)) as T;
  }

  // Handle Object
  if (object instanceof Object) {
    const clonedObject: UnknownRecord = {};
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        clonedObject[key] = cloneDeep(
          (object as UnknownRecord)[key] as unknown
        );
      }
    }
    return clonedObject as T;
  }

  throw new Error("Unable to copy object! Its type isn't supported.");
}

/**
 * Sets a value in an object in the correct path
 * @param obj
 * @param path
 * @param value
 */
export function setValueAtPath(
  obj: object,
  path: string,
  value: unknown
): void {
  const keys = path.split('.');
  let current: UnknownRecord = obj as UnknownRecord;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (key === undefined) {
      continue;
    }

    const next = current[key];
    if (!isRecord(next)) {
      current[key] = {};
    }
    current = current[key] as UnknownRecord;
  }

  const lastKey = keys[keys.length - 1];
  if (lastKey !== undefined) {
    current[lastKey] = value;
  }
}

/**
 * @deprecated Use {@link setValueAtPath} instead
 */
export function set(obj: object, path: string, value: unknown): void {
  return setValueAtPath(obj, path, value);
}

/**
 * @internal
 * Internal utility for collecting all form errors by field path.
 *
 * **Not intended for external use.** This function is used internally by the library
 * to generate the form state. Use the `formState()` signal from the `scVestForm` directive
 * to access form errors in your components.
 *
 * Traverses the form and returns the errors by path
 * @param form
 */
export function getAllFormErrors(
  form?: AbstractControl
): Record<string, string[]> {
  const errors: Record<string, ErrorList> = {};
  if (!form) {
    return errors;
  }

  // Collect root form errors (from ValidateRootFormDirective) before processing children
  if (form.enabled) {
    const rootErrors = getStringArrayError(form.errors, ERROR_MESSAGES_KEY);
    if (rootErrors) {
      errors[ROOT_FORM] = rootErrors;
    }
  }

  function collect(
    control: AbstractControl,
    pathParts: Array<string | number>
  ): void {
    const pathString = stringifyFieldPath(pathParts);

    // Skip processing the root form control directly in NgxFormDirective
    if (pathParts.length === 0 && control === form) {
      // Instead, iterate its children if it's a group/array
      if (isFormGroup(control) || isFormArray(control)) {
        for (const [key, childControl] of getChildEntries(control)) {
          const numericKey = Number(key);
          const nextPath = [
            // ...pathParts, // pathParts is empty here
            Number.isNaN(numericKey) ? key : numericKey,
          ];
          collect(childControl, nextPath);
        }
      }
      return; // Stop processing for the root form itself at this level
    }

    if (isFormGroup(control) || isFormArray(control)) {
      for (const [key, childControl] of getChildEntries(control)) {
        const numericKey = Number(key);
        const nextPath = [
          ...pathParts,
          Number.isNaN(numericKey) ? key : numericKey,
        ];
        collect(childControl, nextPath);
      }
    }

    // Attach control errors (both errors and warnings)
    if (control.enabled) {
      const fieldErrors = getStringArrayError(
        control.errors,
        ERROR_MESSAGES_KEY
      );
      if (fieldErrors) {
        errors[pathString] = fieldErrors;
      }
      // Optionally, add warnings if present
      const fieldWarnings = getStringArrayError(
        control.errors,
        WARNING_MESSAGES_KEY
      );
      if (fieldWarnings) {
        // Attach warnings as a property on the error array (non-enumerable)
        // This is still done here for field-specific warnings, but not for root warnings.
        if (!errors[pathString]) {
          errors[pathString] = []; // Ensure array exists if only warnings are present
        }
        Object.defineProperty(errors[pathString], 'warnings', {
          value: fieldWarnings,
          enumerable: false, // Keep it non-enumerable as per previous behavior for field warnings
          configurable: true,
          writable: true,
        });
      }
    }
  }

  collect(form, []);

  // Root form errors (form.errors) are no longer processed here.
  // They are handled directly in NgxFormDirective to populate formState.root.

  return errors;
}
