/* eslint-disable @typescript-eslint/no-explicit-any */
import { isDevMode } from '@angular/core';

/**
 * Clean error that improves the DX when making typo's in the `name` or `ngModelGroup` attributes
 */
export class ShapeMismatchError extends Error {
  constructor(errorList: string[]) {
    super(`Shape mismatch:\n\n${errorList.join('\n')}\n\n`);
  }
}

/**
 * Validates a form value against a shape
 * When there is something in the form value that is not in the shape, throw an error
 * This is how we throw runtime errors in develop when the developer has made a typo in the `name` or `ngModelGroup`
 * attributes.
 * @param formVal
 * @param shape
 */
export function validateShape(
  formValue: Record<string, any>,
  shape: Record<string, any>,
): void {
  // Only execute in dev mode
  if (isDevMode()) {
    const errors = validateFormValue(formValue, shape);
    if (errors.length > 0) {
      throw new ShapeMismatchError(errors);
    }
  }
}

/**
 * Validates a form value against a shape value to see if it matches
 * Returns clean errors that have a good DX
 * @param formValue
 * @param shape
 * @param path
 */
function validateFormValue(
  formValue: Record<string, any>,
  shape: Record<string, any>,
  path = '',
): string[] {
  const errors: string[] = [];
  for (const key in formValue) {
    if (Object.keys(formValue).includes(key)) {
      // In form arrays we don't know how many items there are
      // This means that we always need to provide one record in the shape of our form array
      // so every time reset the key to '0' when the key is a number and is bigger than 0
      let keyToCompareWith = key;
      if (Number.parseFloat(key) > 0) {
        keyToCompareWith = '0';
      }
      const newPath = path ? `${path}.${key}` : key;
      if (typeof formValue[key] === 'object' && formValue[key] !== null) {
        if (
          (typeof shape[keyToCompareWith] !== 'object' ||
            shape[keyToCompareWith] === null) &&
          Number.isNaN(Number.parseFloat(key))
        ) {
          errors.push(`[ngModelGroup] Mismatch: '${newPath}'`);
        }
        errors.push(
          ...validateFormValue(
            formValue[key],
            shape[keyToCompareWith],
            newPath,
          ),
        );
      } else if (
        (shape ? !(key in shape) : true) &&
        Number.isNaN(Number.parseFloat(key))
      ) {
        errors.push(`[ngModel] Mismatch '${newPath}'`);
      }
    }
  }
  return errors;
}
