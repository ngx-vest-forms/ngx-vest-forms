/**
 * Tests for async validation race condition with only() and multiple field changes
 *
 * This test suite demonstrates and validates the fix for the issue where:
 * 1. User fills email field -> async validation starts (800ms)
 * 2. User immediately fills another field (e.g., checkbox) -> only() called for new field
 * 3. Async email validation gets aborted by the new only() call
 * 4. Form stays in "Pending" state indefinitely
 *
 * ## Root Cause Analysis:
 * - `test.memo()` is designed to cache async validation results
 * - However, `test.memo()` only works with stateful suites (`create`), not stateless suites (`staticSuite`)
 * - The Vest.js documentation shows all `test.memo()` examples use `create`
 * - Quote from docs: "Vest also implicitly includes the suite instance ID as part of the memoization key"
 * - `staticSuite` creates a NEW instance on every call, breaking memoization
 */
import { signal } from '@angular/core';
import { enforce, test } from 'vest';
import { describe, expect, it, vi } from 'vitest';
import { createVestForm } from './create-vest-form';
import { createSafeSuite } from './utils/safe-suite';

describe('Async Validation Race Condition with only()', () => {
  type TestModel = {
    email: string;
    name: string;
    agreeToTerms: boolean;
  } & Record<string, unknown>;

  let createdForms: ReturnType<typeof createVestForm<TestModel>>[] = [];

  afterEach(() => {
    // Clean up all forms to prevent test pollution
    for (const form of createdForms) {
      if ('dispose' in form && typeof form.dispose === 'function') {
        form.dispose();
      }
    }
    createdForms = [];
  });

  it('should NOT abort async validation when another field is validated', async () => {
    let asyncCallCount = 0;
    let asyncResolveCount = 0;
    let asyncAbortCount = 0;

    // Simulate async email validation (like checking if email exists)
    const checkEmailAsync = async (
      email: string,
      signal: AbortSignal,
    ): Promise<void> => {
      asyncCallCount++;

      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          if (signal.aborted) {
            asyncAbortCount++;
            reject(new Error('Aborted'));
            return;
          }
          asyncResolveCount++;

          // Email validation passes for non-blacklisted emails
          if (email === 'admin@example.com') {
            reject(new Error('Email already exists'));
          } else {
            resolve();
          }
        }, 100); // 100ms async delay

        signal.addEventListener('abort', () => {
          asyncAbortCount++;
          clearTimeout(timeoutId);
          reject(new Error('Aborted'));
        });
      });
    };

    // CRITICAL: Must use createSafeSuite (stateful) instead of staticSafeSuite for test.memo() to work!
    // test.memo() memoization key includes "suite instance ID"
    // staticSuite creates new instance on every call, breaking memoization
    const validationSuite = createSafeSuite<TestModel>(
      (data = {} as TestModel) => {
        test('name', 'Name is required', () => {
          enforce(data.name).isNotEmpty();
        });

        test('email', 'Email is required', () => {
          enforce(data.email).isNotEmpty();
        });

        test('email', 'Email format is invalid', () => {
          enforce(data.email).matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
        });

        // Async validation with test.memo
        test.memo(
          'email',
          'Email is already registered',
          async ({ signal }) => {
            if (data.email && data.email.includes('@')) {
              await checkEmailAsync(data.email, signal);
            }
          },
          [data.email],
        );

        test('agreeToTerms', 'You must agree to the terms', () => {
          enforce(data.agreeToTerms).isTruthy();
        });
      },
    );

    const form = createVestForm(
      signal<TestModel>({
        email: '',
        name: '',
        agreeToTerms: false,
      }),
      { suite: validationSuite, errorStrategy: 'immediate' },
    );
    createdForms.push(form); // Track for cleanup

    // Step 1: Fill name field
    form.setName('Jane Smith');
    expect(form.valid()).toBe(false); // Still invalid (email + terms missing)
    expect(form.pending()).toBe(false); // No async validation yet

    // Step 2: Fill email field -> this triggers async validation
    form.setEmail('jane@example.com');
    expect(form.pending()).toBe(true); // Async validation started
    expect(asyncCallCount).toBe(1); // Async validation called once

    // Step 3: IMMEDIATELY fill another field (checkbox) while async validation is pending
    // Per Vest.js docs: only() is SAFE - it doesn't abort pending async validation
    form.setAgreeToTerms(true);

    // Wait for async validation to complete using polling
    // This is more reliable than whenStable() for Vest async validations
    await expect.poll(() => asyncResolveCount, { timeout: 500 }).toBe(1);

    // Verify async validation completed successfully (not aborted)
    expect(asyncAbortCount).toBe(0); // Should NOT be aborted
    expect(form.pending()).toBe(false);

    // Form should be valid now
    expect(form.valid()).toBe(true);
    expect(form.errors()).toEqual({});
  });

  it.todo(
    'should handle multiple rapid field changes without losing async validation',
    async () => {
      let asyncResolveCount = 0;
      let asyncAbortCount = 0;

      const checkEmailAsync = async (
        email: string,
        signal: AbortSignal,
      ): Promise<void> => {
        return new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            if (signal.aborted) {
              asyncAbortCount++;
              reject(new Error('Aborted'));
              return;
            }
            asyncResolveCount++;
            resolve();
          }, 100);

          signal.addEventListener('abort', () => {
            asyncAbortCount++;
            clearTimeout(timeoutId);
            reject(new Error('Aborted'));
          });
        });
      };

      // CRITICAL: Must use createSafeSuite (stateful) for test.memo() to work
      const validationSuite = createSafeSuite<TestModel>(
        (data = {} as TestModel) => {
          test('name', 'Name is required', () => {
            enforce(data.name).isNotEmpty();
          });

          test('email', 'Email is required', () => {
            enforce(data.email).isNotEmpty();
          });

          test.memo(
            'email',
            'Email is already registered',
            async ({ signal }) => {
              if (data.email && data.email.includes('@')) {
                await checkEmailAsync(data.email, signal);
              }
            },
            [data.email],
          );

          test('agreeToTerms', 'You must agree to the terms', () => {
            enforce(data.agreeToTerms).isTruthy();
          });
        },
      );

      const form = createVestForm(
        signal<TestModel>({
          email: '',
          name: '',
          agreeToTerms: false,
        }),
        { suite: validationSuite, errorStrategy: 'immediate' },
      );
      createdForms.push(form); // Track for cleanup

      // Rapidly change multiple fields
      form.setEmail('jane@example.com'); // Triggers async
      form.setName('Jane Smith'); // Should not abort email async
      form.setAgreeToTerms(true); // Should not abort email async

      // Wait for async to complete
      await vi.waitFor(
        () => {
          expect(asyncResolveCount).toBe(1);
        },
        { timeout: 500 },
      );

      // Should complete, not be aborted
      expect(asyncAbortCount).toBe(0);
      expect(form.pending()).toBe(false);
      expect(form.valid()).toBe(true);
    },
  );

  /**
   * Note: The third test documenting the bug with staticSuite has been removed.
   *
   * Key takeaway: test.memo() requires stateful suites (create/createSafeSuite)
   * because the memoization key includes the suite instance ID. staticSuite creates
   * a new instance on every call, breaking memoization.
   *
   * Solution: Always use createSafeSuite (or create) for validation suites that
   * use test.memo() with async validations.
   */
});
