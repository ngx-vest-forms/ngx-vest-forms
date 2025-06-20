/* eslint-disable @typescript-eslint/no-explicit-any */
import { AbstractControl, FormArray, FormGroup } from '@angular/forms';
import { stringifyFieldPath } from './field-path.utils';

/**
 * Recursively calculates the path of a form control
 * @param formGroup
 * @param control
 */
function getControlPath(
  formGroup: FormGroup,
  control: AbstractControl,
): string {
  for (const key in formGroup.controls) {
    if (Object.prototype.hasOwnProperty.call(formGroup.controls, key)) {
      const ctrl = formGroup.get(key);
      if (ctrl instanceof FormGroup) {
        const path = getControlPath(ctrl, control);
        if (path) {
          return key + '.' + path;
        }
      } else if (ctrl === control) {
        return key;
      }
    }
  }
  return '';
}

/**
 * Recursively calculates the path of a form group
 * @param formGroup
 * @param control
 */
function getGroupPath(formGroup: FormGroup, control: AbstractControl): string {
  for (const key in formGroup.controls) {
    if (Object.prototype.hasOwnProperty.call(formGroup.controls, key)) {
      const ctrl = formGroup.get(key);
      if (ctrl === control) {
        return key;
      }
      if (ctrl instanceof FormGroup) {
        const path = getGroupPath(ctrl, control);
        if (path) {
          return key + '.' + path;
        }
      }
    }
  }
  return '';
}

/**
 * Calculates the field name of a form control: Eg: addresses.shippingAddress.street
 * @param rootForm
 * @param control
 */
export function getFormControlField(
  rootForm: FormGroup,
  control: AbstractControl,
): string {
  return getControlPath(rootForm, control);
}

/**
 * Calcuates the field name of a form group Eg: addresses.shippingAddress
 * @param rootForm
 * @param control
 */
export function getFormGroupField(
  rootForm: FormGroup,
  control: AbstractControl,
): string {
  return getGroupPath(rootForm, control);
}

/**
 * This RxJS operator merges the value of the form with the raw value.
 * By doing this we can assure that we don't lose values of disabled form fields
 * @param form
 */
export function mergeValuesAndRawValues<T>(form: FormGroup): T {
  // Retrieve the standard values (respecting references)
  const value = { ...form.value };

  // Retrieve the raw values (including disabled values)
  const rawValue = form.getRawValue();

  // Recursive function to merge rawValue into value
  function mergeRecursive(target: any, source: any) {
    for (const key of Object.keys(source)) {
      if (target[key] === undefined) {
        // If the key is not in the target, add it directly (for disabled fields)
        target[key] = source[key];
      } else if (
        typeof source[key] === 'object' &&
        source[key] !== null &&
        !Array.isArray(source[key])
      ) {
        // If the value is an object, merge it recursively
        mergeRecursive(target[key], source[key]);
      }
      // If the target already has the key with a primitive value, it's left as is to maintain references
    }
  }

  mergeRecursive(value, rawValue);
  return value;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
type Primitive = undefined | null | boolean | string | number | Function;

function isPrimitive(value: any): value is Primitive {
  return (
    value === null || (typeof value !== 'object' && typeof value !== 'function')
  );
}

/**
 * Performs a deep-clone of an object
 * @param obj
 *
 * @deprecated Use official ES {@link [structuredClone](https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone)} instead
 */
export function cloneDeep<T>(object: T): T {
  // Handle primitives (null, undefined, boolean, string, number, function)
  if (isPrimitive(object)) {
    return object;
  }

  // Handle Date
  if (object instanceof Date) {
    return new Date(object) as any as T;
  }

  // Handle Array
  if (Array.isArray(object)) {
    return object.map((item) => cloneDeep(item)) as any as T;
  }

  // Handle Object
  if (object instanceof Object) {
    const clonedObject: any = {};
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        clonedObject[key] = cloneDeep((object as any)[key]);
      }
    }
    return clonedObject as T;
  }

  throw new Error("Unable to copy object! Its type isn't supported.");
}

/**
 *
 * Sets a value in an object in the correct path
 * @param obj
 * @param path
 * @param value
 */
export function setValueAtPath(object: object, path: string, value: any): void {
  const keys = path.split('.');
  let current: any = object;

  for (let index = 0; index < keys.length - 1; index++) {
    const key = keys[index];
    if (!current[key]) {
      current[key] = {};
    }
    current = current[key];
  }

  // eslint-disable-next-line unicorn/prefer-at
  current[keys[keys.length - 1]] = value;
}

/**
 * Traverses the form and returns the errors by path (dot/bracket notation).
 * Uses field-path.utils for robust path handling (arrays, nested, etc).
 *
 * @param form The form to get errors from
 */
export function getAllFormErrors(
  form?: AbstractControl,
): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  if (!form) {
    return errors;
  }

  function collect(control: AbstractControl, pathParts: (string | number)[]) {
    // Skip processing the root form itself here, as its errors are handled directly in FormDirective
    if (pathParts.length === 0 && control === form) {
      // Instead, iterate its children if it's a group/array
      if (control instanceof FormGroup || control instanceof FormArray) {
        for (const key of Object.keys(control.controls)) {
          const childControl = control.get(key);
          const nextPath = [
            // ...pathParts, // pathParts is empty here
            Number.isNaN(Number(key)) ? key : Number(key),
          ];
          if (childControl) {
            collect(childControl, nextPath);
          }
        }
      }
      return; // Stop processing for the root form itself at this level
    }

    if (control instanceof FormGroup || control instanceof FormArray) {
      for (const key of Object.keys(control.controls)) {
        const childControl = control.get(key);
        const nextPath = [
          ...pathParts,
          Number.isNaN(Number(key)) ? key : Number(key),
        ];
        if (childControl) {
          collect(childControl, nextPath);
        }
      }
    }

    // Process errors for actual child controls (not the root form itself)
    if (control.errors && control.enabled) {
      const pathString = stringifyFieldPath(pathParts); // pathParts will not be empty here

      if (control.errors['errors'] && Array.isArray(control.errors['errors'])) {
        errors[pathString] = control.errors['errors'];
      }
      // Optionally, add warnings if present
      if (
        control.errors['warnings'] &&
        Array.isArray(control.errors['warnings'])
      ) {
        // Attach warnings as a property on the error array (non-enumerable)
        // This is still done here for field-specific warnings, but not for root warnings.
        if (!errors[pathString]) {
          errors[pathString] = []; // Ensure array exists if only warnings are present
        }
        Object.defineProperty(errors[pathString], 'warnings', {
          value: control.errors['warnings'],
          enumerable: false, // Keep it non-enumerable as per previous behavior for field warnings
          configurable: true,
          writable: true,
        });
      }
    }
  }

  collect(form, []);
  // Root form errors (form.errors) are no longer processed here.
  // They are handled directly in FormDirective to populate formState.root.

  return errors;
}
