import { isDevMode } from '@angular/core';
import { NGX_VEST_FORMS_ERRORS, logWarning } from '../errors/error-catalog';

/**
 * Validates a form value against a shape to catch typos in `name` or `ngModelGroup` attributes.
 *
 * **What it checks:**
 * - Extra properties: Keys in formValue that don't exist in shape (likely typos)
 * - Type mismatches: When formValue has an object but shape expects a primitive
 *
 * **What it does NOT check:**
 * - Missing properties: Keys in shape that don't exist in formValue
 *   (forms build incrementally with `NgxDeepPartial`, and `@if` conditionally renders fields)
 *
 * Only runs in development mode.
 *
 * @param formVal - The current form value
 * @param shape - The expected shape (created with `NgxDeepRequired<T>`)
 */
export function validateShape<
  T extends Record<string, unknown>,
  U extends Record<string, unknown>,
>(formVal: T, shape: U): void {
  if (isDevMode()) {
    validateFormValueAgainstShape(formVal, shape);
  }
}

/**
 * Recursively validates form value keys against the shape.
 * Reports warnings for extra properties and type mismatches.
 */
function validateFormValueAgainstShape(
  formValue: Record<string, unknown>,
  shape: Record<string, unknown>,
  path = ''
): void {
  for (const key of Object.keys(formValue)) {
    const value = formValue[key];
    const fieldPath = path ? `${path}.${key}` : key;

    // Skip null/undefined values (valid during form initialization)
    if (value == null) {
      continue;
    }

    // For array items (numeric keys > 0), compare against the first item in shape
    // since we only define one example item in the shape for arrays
    const isNumericKey = !isNaN(parseFloat(key));
    const shapeKey = isNumericKey && parseFloat(key) > 0 ? '0' : key;
    const shapeValue = shape?.[shapeKey];

    // Skip Date fields receiving empty strings (common in date picker libraries)
    if (shapeValue instanceof Date && value === '') {
      continue;
    }

    // Handle object values (recurse into nested objects)
    if (typeof value === 'object') {
      // Type mismatch: formValue has object, but shape expects primitive
      if (
        !isNumericKey &&
        (typeof shapeValue !== 'object' || shapeValue === null)
      ) {
        logWarning(
          NGX_VEST_FORMS_ERRORS.TYPE_MISMATCH,
          fieldPath,
          'primitive',
          'object'
        );
      }

      // Recurse into nested object
      validateFormValueAgainstShape(
        value as Record<string, unknown>,
        (shapeValue as Record<string, unknown>) ?? {},
        fieldPath
      );
      continue;
    }

    // Extra property: key exists in formValue but not in shape (likely a typo)
    if (!isNumericKey && shape && !(shapeKey in shape)) {
      logWarning(NGX_VEST_FORMS_ERRORS.EXTRA_PROPERTY, fieldPath);
    }
  }
}
