/* eslint-disable @typescript-eslint/no-explicit-any */
import { AbstractControl, FormArray, FormGroup } from '@angular/forms';
import { injectRootFormKey } from './form-token';

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
 * Sets a value in an object in the correct path
 * @param obj
 * @param path
 * @param value
 */
export function set(object: object, path: string, value: any): void {
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
 * Traverses the form and returns the errors by path
 * @param form The form to get errors from
 * @param rootFormKey Optional custom root form key, if not provided uses the injected ROOT_FORM value
 */
export function getAllFormErrors(
  form?: AbstractControl,
  rootFormKey?: string,
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form) {
    return errors;
  }

  // Get the root form key using the utility function if not provided
  const formKey = rootFormKey ?? injectRootFormKey();

  function collect(control: AbstractControl, path: string): void {
    if (control instanceof FormGroup || control instanceof FormArray) {
      for (const key of Object.keys(control.controls)) {
        const childControl = control.get(key);
        const controlPath = path ? `${path}.${key}` : key;
        if (path && control.errors && control.enabled) {
          for (const errorKey of Object.keys(control.errors)) {
            errors[path] = control.errors![errorKey];
          }
        }
        if (childControl) {
          collect(childControl, controlPath);
        }
      }
    } else {
      if (control.errors && control.enabled) {
        for (const errorKey of Object.keys(control.errors)) {
          errors[path] = control.errors![errorKey];
        }
      }
    }
  }

  collect(form, '');
  if (form.errors && form.errors!['errors']) {
    errors[formKey] = form.errors && form.errors!['errors'];
  }

  return errors;
}
