// Minimal example: simple-form.validations.ts
// Vest validation suite for a single required email field
import { enforce, only, staticSuite, test } from 'vest';

/**
 * Defines the shape of the data for the simple form.
 */
type SimpleFormData = {
  email: string;
};

const defaultSimpleFormData: SimpleFormData = { email: '' };

/**
 * Creates a validation suite for the simple form
 *
 * @returns A Vest validation suite for the simple form
 */
export const createSimpleFormValidationSuite = () =>
  staticSuite(
    (data: SimpleFormData = defaultSimpleFormData, currentField?: string) => {
      only(currentField);

      test('email', 'Email is required', () => {
        enforce(data.email).isNotEmpty();
      });
      test('email', 'Email must be a valid email address', () => {
        enforce(data.email).matches(/^[^@]+@[^@]+\.[^@]+$/);
      });
    },
  );
