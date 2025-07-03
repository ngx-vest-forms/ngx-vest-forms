import { enforce, only, staticSuite, test as vestTest } from 'vest';

/**
 * Async validation suite for username testing
 */
export const asyncValidationSuite = staticSuite(
  (data: { username: string } | undefined, field?: string) => {
    const actualData = data ?? { username: '' };
    only(field);

    vestTest('username', 'Username is required', () => {
      enforce(actualData.username).isNotEmpty();
    });

    vestTest('username', 'Username must be available', async () => {
      if (actualData.username) {
        // Simulate async validation with controlled timing
        await new Promise((resolve) => setTimeout(resolve, 200));
        if (actualData.username === 'taken') {
          throw new Error('Username is already taken');
        }
      }
    });
  },
);
