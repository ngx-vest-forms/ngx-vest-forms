import { enforce, only, staticSuite, test, warn } from 'vest';

/**
 * Simulates async username availability check
 */
const simulateUsernameCheck = async (
  username: string,
  signal?: AbortSignal,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      // Simulate taken usernames
      const takenUsernames = ['admin', 'user', 'test', 'demo', 'john', 'jane'];
      if (takenUsernames.includes(username.toLowerCase())) {
        reject(new Error('Username is already taken'));
      } else {
        resolve();
      }
    }, 1500); // 1.5 second delay

    // Handle cancellation
    signal?.addEventListener('abort', () => {
      clearTimeout(timeoutId);
      reject(new Error('Validation cancelled'));
    });
  });
};

/**
 * Control Wrapper Intro Form Model Type
 *
 * Enhanced form model to demonstrate advanced NgxControlWrapper features:
 * - Async validation (username availability)
 * - Warning system (email provider recommendations, password strength)
 * - Error display mode configuration
 * - Comprehensive validation scenarios
 */
export type ControlWrapperIntroFormModel = {
  username: string;
  email: string;
  password: string;
  phone: string;
};

/**
 * Field names for type-safe validation
 */
type ControlWrapperFieldNames = keyof ControlWrapperIntroFormModel;

/**
 * Control Wrapper Intro Validation Suite
 *
 * This enhanced validation suite demonstrates ALL NgxControlWrapper capabilities:
 *
 * 🚀 Advanced Features Demonstrated:
 * - Synchronous validation (immediate feedback)
 * - Asynchronous validation (username availability with pending states)
 * - Warning system (email provider recommendations, password strength tips)
 * - Multiple validation rules per field with clear error messages
 * - Performance optimization with only(field)
 *
 * 🎯 NgxControlWrapper Features Showcased:
 * - Automatic error display with proper timing
 * - Pending state handling (spinner, "Validating..." message, aria-busy)
 * - Warning display (yellow text, role="status" for accessibility)
 * - Error display mode configuration (on-blur, on-submit, on-blur-or-submit)
 * - Accessibility features (ARIA attributes, screen reader support)
 *
 * Purpose:
 * This suite will be used by BOTH the manual error display form AND the
 * NgxControlWrapper form to demonstrate that validation logic stays the same,
 * while NgxControlWrapper provides superior UX and accessibility automatically.
 */
export const controlWrapperIntroValidationSuite = staticSuite(
  (data: Partial<ControlWrapperIntroFormModel> = {}, field?: string) => {
    // CRITICAL: Always include only() for performance optimization
    only(field);

    // Username validation with async availability check
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

    // Async validation for username availability - demonstrates pending states
    test('username', 'Username is already taken', async ({ signal }) => {
      if (data.username && data.username.length >= 3) {
        await simulateUsernameCheck(data.username, signal);
      }
    });

    // Email validation with warning system
    test('email', 'Email is required', () => {
      enforce(data.email).isNotEmpty();
    });

    test('email', 'Please enter a valid email address', () => {
      enforce(data.email).matches(/^[^@]+@[^@]+\.[^@]+$/);
    });

    // Email provider warnings - demonstrates warning system
    test('email', 'Consider using a professional email provider', () => {
      warn();
      if (data.email && data.email.includes('@')) {
        const domain = data.email.split('@')[1]?.toLowerCase();
        const casualProviders = ['gmail.com', 'yahoo.com', 'hotmail.com'];
        // Check if domain is NOT in casual providers (throw if it IS in the list)
        if (casualProviders.includes(domain)) {
          throw new Error('Consider using a professional email provider');
        }
      }
    });

    // Password validation with strength warnings
    test('password', 'Password is required', () => {
      enforce(data.password).isNotEmpty();
    });

    test('password', 'Password must be at least 8 characters', () => {
      enforce(data.password).longerThanOrEquals(8);
    });

    test('password', 'Password must contain at least one number', () => {
      enforce(data.password).matches(/\d/);
    });

    test(
      'password',
      'Password must contain at least one uppercase letter',
      () => {
        enforce(data.password).matches(/[A-Z]/);
      },
    );

    // Password strength warnings - demonstrates warning system
    test(
      'password',
      'Consider adding special characters for stronger security',
      () => {
        warn();
        if (data.password && data.password.length >= 8) {
          enforce(data.password).matches(/[!@#$%^&*(),.?":{}|<>]/);
        }
      },
    );

    test(
      'password',
      'Password is quite long - consider using a passphrase',
      () => {
        warn();
        if (data.password) {
          enforce(data.password).shorterThan(50);
        }
      },
    );

    // Phone validation
    test('phone', 'Phone number is required', () => {
      enforce(data.phone).isNotEmpty();
    });

    test(
      'phone',
      'Please enter a valid phone number (e.g., 123-456-7890)',
      () => {
        enforce(data.phone).matches(/^\d{3}-\d{3}-\d{4}$/);
      },
    );
  },
);
