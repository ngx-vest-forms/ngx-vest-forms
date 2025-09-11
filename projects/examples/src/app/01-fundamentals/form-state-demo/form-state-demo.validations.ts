import { enforce, only, skipWhen, staticSuite, test } from 'vest';

/**
 * Form State Demo Model Type
 *
 * Represents the shape of data for the form state demo example.
 * This model includes various field types to showcase different form states.
 */
export type FormStateDemoModel = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  age: number;
  preferences: string;
  newsletter: boolean;
};

/**
 * Field names for type-safe validation
 */
type FormStateDemoFieldNames = keyof FormStateDemoModel;

/**
 * Mock async service to simulate username availability check
 * This demonstrates async validation and pending states
 */
const simulateUsernameCheck = (
  username: string,
  signal?: AbortSignal,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Simulate network delay
    const timeoutId = setTimeout(() => {
      // Simulate some usernames being taken
      const takenUsernames = ['admin', 'user', 'test', 'demo', 'john', 'jane'];

      if (signal?.aborted) {
        reject(new Error('Validation cancelled'));
        return;
      }

      if (takenUsernames.includes(username.toLowerCase())) {
        reject(new Error('Username is already taken'));
      } else {
        resolve();
      }
    }, 1000); // 1 second delay to showcase pending state

    // Handle cancellation
    signal?.addEventListener('abort', () => {
      clearTimeout(timeoutId);
      reject(new Error('Validation cancelled'));
    });
  });
};

/**
 * Form State Demo Validation Suite
 *
 * Enhanced validation suite demonstrating comprehensive form state management:
 *
 * Key Features Demonstrated:
 * - TypeScript generics for type safety
 * - Synchronous validation (immediate feedback)
 * - Asynchronous validation (pending states)
 * - Cross-field validation (password confirmation)
 * - Performance optimization with skipWhen() for async validations
 * - Multiple validation rules per field
 * - Different field types and validation patterns
 * - Performance optimization with only(field)
 *
 * Form States Showcased:
 * - valid/invalid states
 * - pending states during async validation
 * - dirty/pristine tracking
 * - error and warning messages
 * - field-level and form-level validation
 */
export const formStateDemoValidationSuite = staticSuite(
  (data: Partial<FormStateDemoModel> = {}, field?: FormStateDemoFieldNames) => {
    // CRITICAL: Always include only() for performance optimization
    only(field);

    // Username validation - includes async check
    test('username', 'Username is required', () => {
      enforce(data.username).isNotEmpty();
    });

    test('username', 'Username must be at least 3 characters', () => {
      enforce(data.username).longerThanOrEquals(3);
    });

    test('username', 'Username must be less than 20 characters', () => {
      enforce(data.username).shorterThanOrEquals(20);
    });

    test(
      'username',
      'Username can only contain letters, numbers, and underscores',
      () => {
        enforce(data.username).matches(/^[a-zA-Z0-9_]+$/);
      },
    );

    // Advanced: Skip expensive async validation if basic validation fails
    // This prevents unnecessary server calls when username is invalid
    skipWhen(
      (result) => result.hasErrors('username'),
      () => {
        test('username', 'Username is already taken', async ({ signal }) => {
          if (data.username && data.username.length >= 3) {
            await simulateUsernameCheck(data.username, signal);
          }
        });
      },
    );

    // Email validation
    test('email', 'Email is required', () => {
      enforce(data.email).isNotEmpty();
    });

    test('email', 'Please enter a valid email address', () => {
      enforce(data.email).matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    // Password validation - multiple strength rules
    test('password', 'Password is required', () => {
      enforce(data.password).isNotEmpty();
    });

    test('password', 'Password must be at least 8 characters', () => {
      enforce(data.password).longerThanOrEquals(8);
    });

    test(
      'password',
      'Password must contain at least one uppercase letter',
      () => {
        enforce(data.password).matches(/[A-Z]/);
      },
    );

    test(
      'password',
      'Password must contain at least one lowercase letter',
      () => {
        enforce(data.password).matches(/[a-z]/);
      },
    );

    test('password', 'Password must contain at least one number', () => {
      enforce(data.password).matches(/[0-9]/);
    });

    // Password confirmation - cross-field validation
    test('confirmPassword', 'Password confirmation is required', () => {
      enforce(data.confirmPassword).isNotEmpty();
    });

    test('confirmPassword', 'Passwords must match', () => {
      enforce(data.confirmPassword).equals(data.password);
    });

    // Age validation
    test('age', 'Age is required', () => {
      enforce(data.age).isNotEmpty();
    });

    test('age', 'Age must be a valid number', () => {
      enforce(data.age).isNumeric();
    });

    test('age', 'Age must be between 13 and 120', () => {
      enforce(data.age).greaterThanOrEquals(13).lessThanOrEquals(120);
    });

    // Preferences validation
    test('preferences', 'Please select your preferences', () => {
      enforce(data.preferences).isNotEmpty();
    });

    test('preferences', 'Please select a valid preference', () => {
      enforce(data.preferences).inside([
        'minimal',
        'balanced',
        'comprehensive',
      ]);
    });

    // Newsletter validation (boolean)
    test('newsletter', 'Please indicate your newsletter preference', () => {
      enforce(data.newsletter).isBoolean();
    });
  },
);
