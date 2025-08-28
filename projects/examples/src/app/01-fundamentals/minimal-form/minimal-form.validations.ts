import { enforce, only, staticSuite, test } from 'vest';

/**
 * Form Model Type for Minimal Form Example
 */
export type MinimalFormModel = {
  email: string;
};

/**
 * Validation Suite for Minimal Form
 *
 * Demonstrates the simplest possible ngx-vest-forms validation setup:
 * - Single field validation
 * - Required field check
 * - Email format validation
 * - Performance optimization with only(field)
 */
export const minimalFormValidationSuite = staticSuite(
  (data: Partial<MinimalFormModel> = {}, field?: string) => {
    only(field);

    test('email', 'Email is required', () => {
      enforce(data.email).isNotEmpty();
    });

    test('email', 'Please enter a valid email', () => {
      enforce(data.email).matches(/^[^@]+@[^@]+\.[^@]+$/);
    });
  },
);
