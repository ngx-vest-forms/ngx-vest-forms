/* eslint-disable @typescript-eslint/no-explicit-any */
import { AbstractControl, FormArray, FormGroup } from '@angular/forms';
import { ROOT_FORM } from '../constants';

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
    Object.keys(source).forEach((key) => {
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
    });
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
 */
export function cloneDeep<T>(obj: T): T {
  // Handle primitives (null, undefined, boolean, string, number, function)
  if (isPrimitive(obj)) {
    return obj;
  }

  // Handle Date
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any as T;
  }

  // Handle Array
  if (Array.isArray(obj)) {
    return obj.map((item) => cloneDeep(item)) as any as T;
  }

  // Handle Object
  if (obj instanceof Object) {
    const clonedObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObj[key] = cloneDeep((obj as any)[key]);
      }
    }
    return clonedObj as T;
  }

  throw new Error("Unable to copy object! Its type isn't supported.");
}

/**
 * Sets a value in an object in the correct path
 * @param obj
 * @param path
 * @param value
 */
export function set(obj: object, path: string, value: any): void {
  const keys = path.split('.');
  let current: any = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key]) {
      current[key] = {};
    }
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
}

/**
 * Traverses the form and returns the errors by path
 * @param form
 */
export function getAllFormErrors(
  form?: AbstractControl,
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form) {
    return errors;
  }

  function collect(control: AbstractControl, path: string): void {
    if (control instanceof FormGroup || control instanceof FormArray) {
      Object.keys(control.controls).forEach((key) => {
        const childControl = control.get(key);
        const controlPath = path ? `${path}.${key}` : key;
        if (path && control.errors && control.enabled) {
          Object.keys(control.errors).forEach((errorKey) => {
            errors[path] = control.errors![errorKey];
          });
        }
        if (childControl) {
          collect(childControl, controlPath);
        }
      });
    } else {
      if (control.errors && control.enabled) {
        Object.keys(control.errors).forEach((errorKey) => {
          errors[path] = control.errors![errorKey];
        });
      }
    }
  }

  collect(form, '');
  if (form.errors && form.errors!['errors']) {
    errors[ROOT_FORM] = form.errors && form.errors!['errors'];
  }

  return errors;
}
