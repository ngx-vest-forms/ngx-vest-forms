import { staticSafeSuite } from 'ngx-vest-forms';
import { enforce, test } from 'vest';

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
 * - Automatic performance optimization with staticSafeSuite
 */
export const minimalFormValidationSuite = staticSafeSuite<MinimalFormModel>(
  (data: Partial<MinimalFormModel> = {}) => {
    // ✅ No need for manual only(field) guard - staticSafeSuite handles it automatically!

    test('email', 'Email is required', () => {
      enforce(data.email).isNotEmpty();
    });

    test('email', 'Please enter a valid email', () => {
      enforce(data.email)
        .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
        .notMatches(/\.{2,}/); // No consecutive dots
    });
  },
);
