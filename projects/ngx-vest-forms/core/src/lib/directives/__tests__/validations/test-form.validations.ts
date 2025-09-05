import { enforce, only, staticSuite, test as vestTest } from 'vest';

/**
 * Basic test validation suite for standard form testing
 */
export const testFormValidations = staticSuite(
  (data: { email: string; password: string } | undefined, field?: string) => {
    const actualData = data ?? { email: '', password: '' };
    only(field);

    vestTest('email', 'Email is required', () => {
      enforce(actualData.email).isNotEmpty();
    });

    vestTest('email', 'Please provide a valid email', () => {
      enforce(actualData.email).matches(/^[^@]+@[^@]+\.[^@]+$/);
    });

    vestTest('password', 'Password is required', () => {
      enforce(actualData.password).isNotEmpty();
    });

    vestTest('password', 'Password must be at least 8 characters', () => {
      enforce(actualData.password).longerThanOrEquals(8);
    });
  },
);

/**
 * Alternative email validation suite with stricter domain requirements
 * Used for testing suite replacement
 */
export const strictEmailValidations = staticSuite(
  (data: { email: string; password: string } | undefined, field?: string) => {
    only(field);

    vestTest('email', 'Email must be from example.org domain', () => {
      enforce(data?.email).matches(/@example\.org$/);
    });

    vestTest('password', 'Password must be at least 12 characters', () => {
      enforce(data?.password).longerThanOrEquals(12);
    });
  },
);
