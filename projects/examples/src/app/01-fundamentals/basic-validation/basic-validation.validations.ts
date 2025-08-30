import { enforce, only, staticSuite, test } from 'vest';

/**
 * User Form Model Type
 *
 * Represents the shape of data for the basic validation example.
 * This type is used for type safety in both the component and validation suite.
 */
export type UserFormModel = {
  name: string;
  email: string;
  age: number;
  role: string;
  bio: string;
  agreeToTerms: boolean;
};

/**
 * User Validation Suite
 *
 * This validation suite demonstrates fundamental Vest.js patterns with ngx-vest-forms:
 *
 * Key Patterns Demonstrated:
 * - Using `only(field)` for performance optimization
 * - Multiple validation rules per field
 * - Conditional validation based on other field values
 * - Different validation types (required, format, length, range, boolean)
 * - User-friendly error messages
 *
 * Best Practices:
 * - Always include `only(field)` at the start for performance
 * - Use descriptive error messages that guide users
 * - Separate validation concerns by field
 * - Use conditional logic for business rules
 */
export const userValidationSuite = staticSuite(
  (data: Partial<UserFormModel> = {}, field?: string) => {
    // CRITICAL: Always include only() for performance optimization
    // This ensures only the changed field is validated, not the entire form
    only(field);

    // Name validation - multiple rules for comprehensive validation
    test('name', 'Name is required', () => {
      enforce(data.name).isNotEmpty();
    });

    test('name', 'Name must be at least 2 characters', () => {
      enforce(data.name).longerThanOrEquals(2);
    });

    test('name', 'Name must be less than 50 characters', () => {
      enforce(data.name).shorterThanOrEquals(50);
    });

    // Email validation - required and format validation
    test('email', 'Email is required', () => {
      enforce(data.email).isNotEmpty();
    });

    test('email', 'Please enter a valid email address', () => {
      enforce(data.email).matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    // Age validation - required and range validation
    test('age', 'Age is required', () => {
      enforce(data.age).isNotEmpty();
    });

    test('age', 'Age must be a valid number', () => {
      enforce(data.age).isNumeric();
    });

    test('age', 'You must be at least 18 years old', () => {
      enforce(data.age).greaterThanOrEquals(18);
    });

    test('age', 'Age must be 120 or less', () => {
      enforce(data.age).lessThanOrEquals(120);
    });

    // Role validation - required selection
    test('role', 'Please select a role', () => {
      enforce(data.role).isNotEmpty();
    });

    test('role', 'Please select a valid role', () => {
      enforce(data.role).inside([
        'Junior Developer',
        'Mid-level Developer',
        'Senior Developer',
        'Team Lead',
      ]);
    });

    // Conditional validation for bio field
    // Bio is only required for senior positions
    if (data.role === 'Senior Developer' || data.role === 'Team Lead') {
      test('bio', 'Bio is required for senior positions', () => {
        enforce(data.bio).isNotEmpty();
      });

      test(
        'bio',
        'Bio must be at least 50 characters for senior positions',
        () => {
          enforce(data.bio).longerThanOrEquals(50);
        },
      );

      test('bio', 'Bio must be less than 500 characters', () => {
        enforce(data.bio).shorterThanOrEquals(500);
      });
    }

    // Terms agreement validation - boolean validation
    test('agreeToTerms', 'You must agree to the terms and conditions', () => {
      enforce(data.agreeToTerms).isTruthy();
    });
  },
);
