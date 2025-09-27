/* eslint-disable @typescript-eslint/no-explicit-any */
import { isDevMode } from '@angular/core';

/**
 * Represents an error thrown when the structure of a form value
 * does not match the expected model template defined for the form.
 * This typically indicates a typo or mismatch in `ngModel` or `ngModelGroup` names in the template.
 *
 * **N.B.**
 * - Use dedicated schema validation libraries like Zod, Valibot, or ArkType for robust schema definition and validation instead of this custom template validation.
 */
export class ModelTemplateMismatchError extends Error {
  /**
   * Path where the mismatch occurred (optional, might be empty if multiple errors)
   */
  path: string;

  /**
   * Array of error messages describing the mismatches found.
   */
  errors: string[];

  /**
   * Constructor accepts either an array of error messages or a single message with optional path.
   * @param messagesOrMessage An array of error messages or a single error message string.
   * @param path The dot-separated path indicating where the error occurred (optional).
   */
  constructor(messagesOrMessage: string[] | string, path = '') {
    const messages = Array.isArray(messagesOrMessage)
      ? messagesOrMessage
      : [messagesOrMessage];

    super(messages.join('\n'));

    this.errors = messages;
    this.path = path;
    this.name = 'ModelTemplateMismatchError';
  }
}

/**
 * @deprecated Use `ModelTemplateMismatchError` instead.
 */
export class ShapeMismatchError extends ModelTemplateMismatchError {
  constructor(messagesOrMessage: string[] | string, path = '') {
    super(messagesOrMessage, path);
    this.name = 'ShapeMismatchError';
  }
}

/**
 * Validates that a form value matches the expected model template.
 * This function only runs in development mode (`isDevMode() === true`).
 * When there is something in the form value that doesn't match the template, it throws a `ModelTemplateMismatchError`.
 * This helps catch typos in `name` or `ngModelGroup` attributes during development.
 *
 * **N.B.**
 * - Use dedicated schema validation libraries like Zod, Valibot, or ArkType for robust schema definition and validation instead of this custom template validation.
 *
 * @param formValue The current value of the form group.
 * @param modelTemplate The template object that represents the expected structure of the form value.
 * @throws {ModelTemplateMismatchError} If the structure of `formValue` does not match `modelTemplate` in development mode.
 */
export function validateModelTemplate(
  formValue: any,
  modelTemplate: any,
): void {
  // Only execute in dev mode
  if (isDevMode()) {
    const errors = validateModelTemplateStructure(formValue, modelTemplate);
    if (errors.length > 0) {
      throw new ModelTemplateMismatchError(errors);
    }
  }
}

/**
 * @deprecated Use `validateModelTemplate` instead.
 */
export function validateShape(formValue: any, shape: any): void {
  try {
    // Call the new function
    validateModelTemplate(formValue, shape);
  } catch (error) {
    if (error instanceof ModelTemplateMismatchError) {
      // ...re-throw it as the *deprecated* error type for backward compatibility.
      // Pass the original errors array and path to the ShapeMismatchError constructor.
      throw new ShapeMismatchError(error.errors, error.path);
    }
    // Re-throw any other unexpected errors
    throw error;
  }
}

/**
 * Recursive validation function to check form value structure against a model template object.
 * Identifies fields present in the form value but not in the template, which might indicate template errors.
 *
 * @param formValue The current part of the form value being validated.
 * @param modelTemplate The corresponding part of the model template object.
 * @param path The current dot-separated path for error reporting.
 *
 * @returns An array of error message strings.
 */
function validateModelTemplateStructure(
  formValue: Record<string, unknown>,
  modelTemplate: Record<string, unknown>,
  path = '',
): string[] {
  const errors: string[] = [];

  if (!formValue || typeof formValue !== 'object') {
    return errors;
  }

  const valueFields = new Set(Object.keys(formValue));
  const templateFields = new Set(Object.keys(modelTemplate));

  // Heuristic: if the template at this path looks like a record (e.g. keys are numeric strings),
  // allow additional keys in the value without treating them as template mismatches.
  const isNumericKey = (k: string) => /^\d+$/.test(k);
  const templateLooksLikeRecord =
    templateFields.size > 0 &&
    [...templateFields].every((k) => isNumericKey(k));

  // Check for fields in value that don't exist in template (potential typos in templates)
  if (!templateLooksLikeRecord) {
    const missingInTemplate = [...valueFields].filter(
      (field) => !templateFields.has(field),
    );
    if (missingInTemplate.length > 0) {
      for (const field of missingInTemplate) {
        const fieldPath = path ? `${path}.${field}` : field;
        if (typeof formValue[field] === 'object' && formValue[field] !== null) {
          errors.push(`[ngModelGroup] Mismatch: '${fieldPath}'`);
        } else {
          errors.push(`[ngModel] Mismatch '${fieldPath}'`);
        }
      }
    }
  }

  // Check for nested objects
  for (const field of valueFields) {
    if (
      templateFields.has(field) &&
      typeof formValue[field] === 'object' &&
      formValue[field] !== null &&
      typeof modelTemplate[field] === 'object' &&
      modelTemplate[field] !== null
    ) {
      const nestedPath = path ? `${path}.${field}` : field;
      errors.push(
        ...validateModelTemplateStructure(
          formValue[field] as Record<string, unknown>,
          modelTemplate[field] as Record<string, unknown>,
          nestedPath,
        ),
      );
    }
  }

  return errors;
}
