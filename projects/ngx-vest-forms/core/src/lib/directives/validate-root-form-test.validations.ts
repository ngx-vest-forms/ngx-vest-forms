import { enforce, only, staticSuite, test, warn } from 'vest';

// Test validation suite
export const createTestValidationSuite = staticSuite(
  (data: Record<string, unknown> = {}, currentField?: string) => {
    only(currentField);

    test('email', 'Email is required', () => {
      enforce(data['email']).isNotBlank();
    });

    test('email', 'Must be a valid email', () => {
      enforce(data['email']).matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    test('password', 'Password is required', () => {
      enforce(data['password']).isNotBlank();
    });

    test('password', 'Password must be at least 8 characters', () => {
      enforce(data['password']).longerThanOrEquals(8);
    });

    test('confirmPassword', 'Confirm password is required', () => {
      enforce(data['confirmPassword']).isNotBlank();
    });

    test('confirmPassword', 'Passwords must match', () => {
      enforce(data['confirmPassword']).equals(data['password']);
    });

    // Use the fallback root form key for tests to avoid DI issues
    const rootFormKey = 'rootForm';

    test(rootFormKey, 'Form level validation failed', () => {
      // Cross-field validation example
      if (data['password'] && data['confirmPassword']) {
        enforce(data['confirmPassword']).equals(data['password']);
      }
    });

    test(rootFormKey, 'This is a root warning', () => {
      warn(); // Example root-level warning
      enforce(data['email']).isNotEmpty(); // Ensure it's a valid test
    });
  },
);
