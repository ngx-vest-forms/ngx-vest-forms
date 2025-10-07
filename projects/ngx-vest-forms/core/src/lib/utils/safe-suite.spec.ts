/**
 * Unit tests for safe suite wrappers
 * Tests that the wrappers prevent the only(undefined) bug
 */

import { enforce, include, test } from 'vest';
import { describe, expect, it } from 'vitest';
import { createSafeSuite, staticSafeSuite } from './safe-suite';

type TestModel = {
  email: string;
  password: string;
  confirmPassword?: string;
  username?: string;
} & Record<string, unknown>;

describe('staticSafeSuite', () => {
  describe('basic validation', () => {
    it('should run all tests when field parameter is undefined', () => {
      const suite = staticSafeSuite<TestModel>((data) => {
        test('email', 'Email is required', () => {
          enforce(data?.email).isNotEmpty();
        });

        test('password', 'Password is required', () => {
          enforce(data?.password).isNotEmpty();
        });
      });

      const result = suite({ email: '', password: '' });

      // ✅ Both tests should run (not zero tests)
      expect(result.getErrors('email')).toHaveLength(1);
      expect(result.getErrors('password')).toHaveLength(1);
      expect(result.errorCount).toBe(2);
    });

    it('should run only specified field tests when field parameter is provided', () => {
      const suite = staticSafeSuite<TestModel>((data) => {
        test('email', 'Email is required', () => {
          enforce(data?.email).isNotEmpty();
        });

        test('password', 'Password is required', () => {
          enforce(data?.password).isNotEmpty();
        });
      });

      const result = suite({ email: '', password: '' }, 'email');

      // ✅ Only email test should run
      expect(result.isTested('email')).toBe(true);
      expect(result.isTested('password')).toBe(false);
      expect(result.getErrors('email')).toHaveLength(1);
      expect(result.errorCount).toBe(1);
    });

    it('should validate correctly when all fields are valid', () => {
      const suite = staticSafeSuite<TestModel>((data) => {
        test('email', 'Email is required', () => {
          enforce(data?.email).isNotEmpty();
        });

        test('password', 'Password must be at least 8 characters', () => {
          enforce(data?.password).longerThan(7);
        });
      });

      const result = suite({
        email: 'user@example.com',
        password: 'password123',
      });

      expect(result.isValid()).toBe(true);
      expect(result.hasErrors()).toBe(false);
      expect(result.errorCount).toBe(0);
    });
  });

  describe('type safety', () => {
    it('should enforce type-safe field names', () => {
      type UserFields = 'email' | 'password';

      const suite = staticSafeSuite<TestModel, UserFields>((data) => {
        test('email', 'Email is required', () => {
          enforce(data?.email).isNotEmpty();
        });

        test('password', 'Password is required', () => {
          enforce(data?.password).isNotEmpty();
        });
      });

      // TypeScript should allow valid field names
      const result1 = suite({ email: '' }, 'email');
      const result2 = suite({ password: '' }, 'password');

      expect(result1.isTested('email')).toBe(true);
      expect(result2.isTested('password')).toBe(true);

      // TypeScript should reject invalid field names (tested at compile time)
      // @ts-expect-error - 'invalidField' is not a valid field name
      suite({ email: '' }, 'invalidField');
    });
  });

  describe('cross-field validation', () => {
    it('should handle include().when() for dependent fields', () => {
      const suite = staticSafeSuite<TestModel>((data) => {
        test('password', 'Password is required', () => {
          enforce(data?.password).isNotEmpty();
        });

        include('confirmPassword').when('password');
        test('confirmPassword', 'Passwords must match', () => {
          enforce(data?.confirmPassword).equals(data?.password);
        });
      });

      // When validating password, confirmPassword should also be validated
      const result = suite(
        { password: 'secret', confirmPassword: 'different' },
        'password',
      );

      expect(result.isTested('password')).toBe(true);
      expect(result.isTested('confirmPassword')).toBe(true);
      expect(result.getErrors('confirmPassword')).toHaveLength(1);
    });

    it('should validate dependent fields when validating all fields', () => {
      const suite = staticSafeSuite<TestModel>((data) => {
        test('password', 'Password is required', () => {
          enforce(data?.password).isNotEmpty();
        });

        include('confirmPassword').when('password');
        test('confirmPassword', 'Passwords must match', () => {
          enforce(data?.confirmPassword).equals(data?.password);
        });
      });

      // When validating all fields (no field parameter)
      const result = suite({
        password: 'secret',
        confirmPassword: 'different',
      });

      expect(result.isTested('password')).toBe(true);
      expect(result.isTested('confirmPassword')).toBe(true);
      expect(result.hasErrors('confirmPassword')).toBe(true);
    });
  });

  describe('stateless behavior', () => {
    it('should not maintain state between calls', () => {
      const suite = staticSafeSuite<TestModel>((data) => {
        test('email', 'Email is required', () => {
          enforce(data?.email).isNotEmpty();
        });
      });

      // First call with invalid data
      const result1 = suite({ email: '' });
      expect(result1.hasErrors('email')).toBe(true);

      // Second call with valid data
      const result2 = suite({ email: 'user@example.com' });
      expect(result2.hasErrors('email')).toBe(false);

      // First result should still have errors (stateless)
      expect(result1.hasErrors('email')).toBe(true);
    });

    it('should not have subscribe, get, reset methods', () => {
      const suite = staticSafeSuite<TestModel>((data) => {
        test('email', 'Email is required', () => {
          enforce(data?.email).isNotEmpty();
        });
      });

      expect(suite.subscribe).toBeUndefined();
      expect(suite.get).toBeUndefined();
      expect(suite.reset).toBeUndefined();
      expect(suite.resetField).toBeUndefined();
    });
  });
});

describe('createSafeSuite', () => {
  describe('basic validation', () => {
    it('should run all tests when field parameter is undefined', () => {
      const suite = createSafeSuite<TestModel>((data) => {
        test('email', 'Email is required', () => {
          enforce(data?.email).isNotEmpty();
        });

        test('password', 'Password is required', () => {
          enforce(data?.password).isNotEmpty();
        });
      });

      const result = suite({ email: '', password: '' });

      // ✅ Both tests should run (not zero tests)
      expect(result.getErrors('email')).toHaveLength(1);
      expect(result.getErrors('password')).toHaveLength(1);
      expect(result.errorCount).toBe(2);
    });

    it('should run only specified field tests when field parameter is provided', () => {
      const suite = createSafeSuite<TestModel>((data) => {
        test('email', 'Email is required', () => {
          enforce(data?.email).isNotEmpty();
        });

        test('password', 'Password is required', () => {
          enforce(data?.password).isNotEmpty();
        });
      });

      const result = suite({ email: '', password: '' }, 'email');

      // ✅ Only email test should run
      expect(result.isTested('email')).toBe(true);
      expect(result.isTested('password')).toBe(false);
      expect(result.getErrors('email')).toHaveLength(1);
    });
  });

  describe('stateful behavior', () => {
    it('should maintain state between calls', () => {
      const suite = createSafeSuite<TestModel>((data) => {
        test('email', 'Email is required', () => {
          enforce(data?.email).isNotEmpty();
        });
      });

      // First call with invalid data
      suite({ email: '' });
      expect(suite.get().hasErrors('email')).toBe(true);

      // Second call with valid data
      suite({ email: 'user@example.com' });
      expect(suite.get().hasErrors('email')).toBe(false);
    });

    it('should provide subscribe method', () => {
      const suite = createSafeSuite<TestModel>((data) => {
        test('email', 'Email is required', () => {
          enforce(data?.email).isNotEmpty();
        });
      });

      expect(suite.subscribe).toBeDefined();
      expect(typeof suite.subscribe).toBe('function');

      let callCount = 0;
      const unsubscribe = suite.subscribe?.(() => {
        callCount++;
      });

      if (!unsubscribe) {
        throw new Error('subscribe should be defined');
      }

      // Should trigger subscription
      suite({ email: '' });
      expect(callCount).toBeGreaterThan(0);
      const firstCallCount = callCount;

      suite({ email: 'user@example.com' });
      expect(callCount).toBeGreaterThan(firstCallCount);
      const secondCallCount = callCount;

      // Clean up
      unsubscribe();

      // Should not trigger after unsubscribe
      suite({ email: 'test' });
      expect(callCount).toBe(secondCallCount);
    });

    it('should provide get method', () => {
      const suite = createSafeSuite<TestModel>((data) => {
        test('email', 'Email is required', () => {
          enforce(data?.email).isNotEmpty();
        });
      });

      expect(suite.get).toBeDefined();
      expect(typeof suite.get).toBe('function');

      suite({ email: '' });
      const result = suite.get?.();

      if (!result) {
        throw new Error('get should return a result');
      }

      expect(result.hasErrors('email')).toBe(true);
      expect(result.isTested('email')).toBe(true);
    });

    it('should provide reset method', () => {
      const suite = createSafeSuite<TestModel>((data) => {
        test('email', 'Email is required', () => {
          enforce(data?.email).isNotEmpty();
        });
      });

      expect(suite.reset).toBeDefined();
      expect(typeof suite.reset).toBe('function');

      if (!suite.get || !suite.reset) {
        throw new Error('get and reset should be defined');
      }

      // Run validation
      suite({ email: '' });
      expect(suite.get().hasErrors('email')).toBe(true);

      // Reset state
      suite.reset();
      expect(suite.get().hasErrors('email')).toBe(false);
      expect(suite.get().isTested('email')).toBe(false);
    });

    it('should provide resetField method', () => {
      const suite = createSafeSuite<TestModel>((data) => {
        test('email', 'Email is required', () => {
          enforce(data?.email).isNotEmpty();
        });

        test('password', 'Password is required', () => {
          enforce(data?.password).isNotEmpty();
        });
      });

      expect(suite.resetField).toBeDefined();
      expect(typeof suite.resetField).toBe('function');

      if (!suite.get || !suite.resetField) {
        throw new Error('get and resetField should be defined');
      }

      // Run validation on both fields
      suite({ email: '', password: '' });
      expect(suite.get().hasErrors('email')).toBe(true);
      expect(suite.get().hasErrors('password')).toBe(true);

      // Reset only email
      suite.resetField('email');
      expect(suite.get().isTested('email')).toBe(false);
      expect(suite.get().hasErrors('email')).toBe(false);

      // Password should still have errors
      expect(suite.get().isTested('password')).toBe(true);
      expect(suite.get().hasErrors('password')).toBe(true);
    });
  });

  describe('type safety', () => {
    it('should enforce type-safe field names', () => {
      type UserFields = 'email' | 'password';

      const suite = createSafeSuite<TestModel, UserFields>((data) => {
        test('email', 'Email is required', () => {
          enforce(data?.email).isNotEmpty();
        });

        test('password', 'Password is required', () => {
          enforce(data?.password).isNotEmpty();
        });
      });

      // TypeScript should allow valid field names
      const result1 = suite({ email: '' }, 'email');
      const result2 = suite({ password: '' }, 'password');

      expect(result1.isTested('email')).toBe(true);
      expect(result2.isTested('password')).toBe(true);

      // TypeScript should reject invalid field names (tested at compile time)
      // @ts-expect-error - 'invalidField' is not a valid field name
      suite({ email: '' }, 'invalidField');
    });
  });
});

describe('Regression: only(undefined) bug', () => {
  it('should NOT exhibit the only(undefined) bug with staticSafeSuite', () => {
    const suite = staticSafeSuite<TestModel>((data) => {
      test('email', 'Email is required', () => {
        enforce(data?.email).isNotEmpty();
      });

      test('password', 'Password is required', () => {
        enforce(data?.password).isNotEmpty();
      });

      test('username', 'Username is required', () => {
        enforce(data?.username).isNotEmpty();
      });
    });

    // When field is undefined, ALL tests should run (not zero)
    const result = suite({ email: '', password: '', username: '' });

    // ✅ All 3 tests should run and report errors
    expect(result.errorCount).toBe(3);
    expect(result.getErrors('email')).toHaveLength(1);
    expect(result.getErrors('password')).toHaveLength(1);
    expect(result.getErrors('username')).toHaveLength(1);
  });

  it('should NOT exhibit the only(undefined) bug with createSafeSuite', () => {
    const suite = createSafeSuite<TestModel>((data) => {
      test('email', 'Email is required', () => {
        enforce(data?.email).isNotEmpty();
      });

      test('password', 'Password is required', () => {
        enforce(data?.password).isNotEmpty();
      });

      test('username', 'Username is required', () => {
        enforce(data?.username).isNotEmpty();
      });
    });

    // When field is undefined, ALL tests should run (not zero)
    const result = suite({ email: '', password: '', username: '' });

    // ✅ All 3 tests should run and report errors
    expect(result.errorCount).toBe(3);
    expect(result.getErrors('email')).toHaveLength(1);
    expect(result.getErrors('password')).toHaveLength(1);
    expect(result.getErrors('username')).toHaveLength(1);
  });

  it('should show difference between safe wrapper and unsafe pattern', () => {
    // ✅ SAFE: Uses wrapper's built-in guard
    const safeSuite = staticSafeSuite<TestModel>((data) => {
      // No manual only() call - wrapper handles it
      test('email', 'Email is required', () => {
        enforce(data?.email).isNotEmpty();
      });

      test('password', 'Password is required', () => {
        enforce(data?.password).isNotEmpty();
      });
    });

    const safeResult = safeSuite({ email: '', password: '' });

    // Safe suite should run all tests
    expect(safeResult.errorCount).toBe(2);
    expect(safeResult.getErrors('email')).toHaveLength(1);
    expect(safeResult.getErrors('password')).toHaveLength(1);
  });
});
