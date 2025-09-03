import type { NgxFieldKey, NgxVestSuite } from 'ngx-vest-forms';
import { enforce, only, staticSuite, test } from 'vest';

/**
 * Defines the shape of the data for the registration form.
 */
export type RegistrationFormData = {
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
};

const defaultRegistrationFormData: RegistrationFormData = {
  email: '',
  password: '',
  confirmPassword: '',
  agreeToTerms: false,
};

/**
 * Creates a validation suite for the registration form.
 * Demonstrates cross-field validation for password confirmation.
 *
 * @returns A Vest validation suite for the registration form
 */
export const createRegistrationValidationSuite =
  (): NgxVestSuite<RegistrationFormData> =>
    staticSuite(
      (
        data: RegistrationFormData = defaultRegistrationFormData,
        field?: NgxFieldKey<RegistrationFormData>,
      ) => {
        only(field);

        // Email validation
        test('email', 'Email is required', () => {
          enforce(data.email).isNotEmpty();
        });
        test('email', 'Email must be a valid email address', () => {
          enforce(data.email).matches(/^[^@]+@[^@]+\.[^@]+$/);
        });

        // Password validation
        test('password', 'Password is required', () => {
          enforce(data.password).isNotEmpty();
        });
        test('password', 'Password must be at least 8 characters long', () => {
          enforce(data.password).longerThanOrEquals(8);
        });
        test(
          'password',
          'Password must contain at least one uppercase letter',
          () => {
            enforce(data.password).matches(/[A-Z]/);
          },
        );
        test('password', 'Password must contain at least one number', () => {
          enforce(data.password).matches(/[0-9]/);
        });

        // Confirm password validation (cross-field validation)
        test('confirmPassword', 'Please confirm your password', () => {
          enforce(data.confirmPassword).isNotEmpty();
        });
        test('confirmPassword', 'Passwords must match', () => {
          enforce(data.confirmPassword).equals(data.password);
        });

        // Terms and conditions validation
        test(
          'agreeToTerms',
          'You must agree to the terms and conditions',
          () => {
            enforce(data.agreeToTerms).isTruthy();
          },
        );
      },
    );
