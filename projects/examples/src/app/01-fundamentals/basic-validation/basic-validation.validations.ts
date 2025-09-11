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
  bio?: string; // Optional because it's conditionally rendered
  agreeToTerms: boolean;
};

/**
 * Field names for type-safe validation
 */
type UserFieldNames = keyof UserFormModel;

/**
 * Mock expensive validation service
 * Simulates checking if an email is already registered (e.g., database lookup)
 */
const simulateEmailExistsCheck = async (
  email: string,
  signal?: AbortSignal,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      if (signal?.aborted) {
        reject(new Error('Validation cancelled'));
        return;
      }

      // Simulate some emails being taken
      const existingEmails = [
        'admin@example.com',
        'user@example.com',
        'test@example.com',
      ];

      if (existingEmails.includes(email.toLowerCase())) {
        reject(new Error('Email is already registered'));
      } else {
        resolve();
      }
    }, 800); // Simulate network delay

    signal?.addEventListener('abort', () => {
      clearTimeout(timeoutId);
      reject(new Error('Validation cancelled'));
    });
  });
};

/**
 * User Validation Suite
 *
 * Enhanced validation suite demonstrating advanced Vest.js patterns with ngx-vest-forms:
 *
 * Key Patterns Demonstrated:
 * - TypeScript generics for compile-time type safety
 * - Using `only(field)` for performance optimization
 * - Multiple validation rules per field
 * - Conditional validation based on other field values
 * - Async validation with `test.memo()` for performance
 * - Different validation types (required, format, length, range, boolean)
 * - User-friendly error messages
 *
 * Best Practices:
 * - Always include `only(field)` at the start for performance
 * - Use `test.memo()` for expensive async validations
 * - Use descriptive error messages that guide users
 * - Separate validation concerns by field
 * - Use conditional logic for business rules
 * - Leverage TypeScript for compile-time validation safety
 */
export const userValidationSuite = staticSuite(
  (data: Partial<UserFormModel> = {}, field?: UserFieldNames) => {
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

    // Advanced: Memoized async validation for expensive operations
    // This prevents duplicate server calls for the same email
    test.memo(
      'email',
      'Email is already registered',
      async ({ signal }) => {
        if (data.email && data.email.includes('@')) {
          await simulateEmailExistsCheck(data.email, signal);
        }
      },
      [data.email], // Dependencies: only re-run if email changes
    );

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
          enforce(data.bio).isNotEmpty().longerThanOrEquals(50);
        },
      );

      test('bio', 'Bio must be less than 500 characters', () => {
        enforce(data.bio).isNotEmpty().shorterThanOrEquals(500);
      });
    }

    // Terms agreement validation - boolean validation
    test('agreeToTerms', 'You must agree to the terms and conditions', () => {
      enforce(data.agreeToTerms).isTruthy();
    });
  },
);
