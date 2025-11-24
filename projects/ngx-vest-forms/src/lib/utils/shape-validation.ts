import { isDevMode } from '@angular/core';
import { NGX_VEST_FORMS_ERRORS, logWarning } from '../errors/error-catalog';

/**
 * Validates a form value against a shape
 * When there is something in the form value that is not in the shape, throw an error
 * This is how we throw runtime errors in develop when the developer has made a typo in the `name` or `ngModelGroup`
 * attributes.
 * @param formVal
 * @param shape
 */
export function validateShape<
  T extends Record<string, unknown>,
  U extends Record<string, unknown>,
>(formVal: T, shape: U): void {
  // Only execute in dev mode
  if (isDevMode()) {
    validateFormValue(formVal, shape);
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
  formValue: Record<string, unknown>,
  shape: Record<string, unknown>,
  path = ''
): void {
  for (const key in formValue) {
    if (Object.keys(formValue).includes(key)) {
      // In form arrays we don't know how many items there are
      // This means that we always need to provide one record in the shape of our form array
      // so every time reset the key to '0' when the key is a number and is bigger than 0
      let keyToCompareWith = key;
      if (parseFloat(key) > 0) {
        keyToCompareWith = '0';
      }
      const newPath = path ? `${path}.${key}` : key;
      const shapeValue = shape?.[keyToCompareWith];

      // Skip validation for Date fields that receive empty strings
      // This is a common pattern in UI libraries (Angular Material, PrimeNG, etc.)
      // where date inputs emit empty strings before a date is selected
      if (shapeValue instanceof Date && formValue[key] === '') {
        continue;
      }

      // Skip validation for null or undefined values
      // These are valid states during form initialization
      if (formValue[key] == null) {
        continue;
      }

      if (typeof formValue[key] === 'object' && formValue[key] !== null) {
        if (
          (typeof shape[keyToCompareWith] !== 'object' ||
            shape[keyToCompareWith] === null) &&
          isNaN(parseFloat(key))
        ) {
          logWarning(NGX_VEST_FORMS_ERRORS.SHAPE_MISMATCH, newPath);
        }
        validateFormValue(
          formValue[key] as Record<string, unknown>,
          shape[keyToCompareWith] as Record<string, unknown>,
          newPath
        );
      } else if ((shape ? !(key in shape) : true) && isNaN(parseFloat(key))) {
        logWarning(NGX_VEST_FORMS_ERRORS.SHAPE_MISMATCH, newPath);
      }
    }
  }

  // Check for missing keys in formValue
  // We skip arrays because empty arrays are valid even if shape defines an item structure (at key '0')
  if (
    shape &&
    typeof formValue === 'object' &&
    formValue !== null &&
    !Array.isArray(formValue)
  ) {
    for (const key of Object.keys(shape)) {
      if (!(key in formValue)) {
        const newPath = path ? `${path}.${key}` : key;
        logWarning(NGX_VEST_FORMS_ERRORS.SHAPE_MISMATCH, newPath);
      }
    }
  }
}
