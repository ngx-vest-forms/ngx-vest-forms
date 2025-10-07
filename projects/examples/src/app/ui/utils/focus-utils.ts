import { DOCUMENT } from '@angular/common';
import { inject } from '@angular/core';

/**
 * Focus Utilities for Form Fields
 *
 * Provides Angular-compliant utilities for field focus management
 * following best practices with dependency injection.
 */

/**
 * Creates a focus manager that can focus fields by ID
 * Uses injected DOCUMENT token for better testability and SSR compatibility
 *
 * @returns A function that can focus the first invalid field from error state
 *
 * @example
 * ```typescript
 * export class MyFormComponent {
 *   private readonly focusFirstInvalidField = createFocusFirstInvalidField();
 *
 *   save() {
 *     if (!this.formState().valid) {
 *       this.focusFirstInvalidField(this.formState().errors);
 *     }
 *   }
 * }
 * ```
 */
export function createFocusFirstInvalidField() {
  const document = inject(DOCUMENT);

  return (errors: Partial<Record<string, string[]>>): void => {
    const firstErrorField = Object.keys(errors)[0];

    if (firstErrorField) {
      const element = document.querySelector<HTMLElement>(
        `#${firstErrorField}`,
      );
      element?.focus();
    }
  };
}

/**
 * Alternative injectable service approach for focus management
 * Use this if you prefer service-based dependency injection
 */
export class FocusUtilities {
  private readonly document = inject(DOCUMENT);

  /**
   * Focus the first field that has validation errors
   * @param errors - Error object with field names as keys
   */
  focusFirstInvalidField(errors: Partial<Record<string, string[]>>): void {
    const firstErrorField = Object.keys(errors)[0];

    if (firstErrorField) {
      const element = this.document.querySelector<HTMLElement>(
        `#${firstErrorField}`,
      );
      element?.focus();
    }
  }

  /**
   * Focus a specific field by ID
   * @param fieldId - The ID of the field to focus
   */
  focusField(fieldId: string): void {
    const element = this.document.querySelector<HTMLElement>(`#${fieldId}`);
    element?.focus();
  }
}
