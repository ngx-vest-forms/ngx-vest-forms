// Minimal example: simple-form.validations.ts
// Vest validation suite for a single required email field
import type { NgxFieldKey, NgxVestSuite } from 'ngx-vest-forms';
import { enforce, only, staticSuite, test } from 'vest';

/**
 * Defines the shape of the data for the simple form.
 */
type SimpleFormData = {
  email: string;
  email2: string;
};

const defaultSimpleFormData: SimpleFormData = { email: '', email2: '' };

/**
 * Creates a validation suite for the simple form
 *
 * @returns A Vest validation suite for the simple form
 */
export const createSimpleFormValidationSuite =
  (): NgxVestSuite<SimpleFormData> =>
    staticSuite(
      (
        data: SimpleFormData = defaultSimpleFormData,
        field?: NgxFieldKey<SimpleFormData>,
      ) => {
        only(field);

        test('email', 'Email is required', () => {
          enforce(data.email).isNotEmpty();
        });
        test('email', 'Email must be a valid email address', () => {
          enforce(data.email).matches(/^[^@]+@[^@]+\.[^@]+$/);
        });

        test('email2', 'Email is required', () => {
          enforce(data.email2).isNotEmpty();
        });
        test('email2', 'Email must be a valid email address', () => {
          enforce(data.email2).matches(/^[^@]+@[^@]+\.[^@]+$/);
        });
      },
    );
