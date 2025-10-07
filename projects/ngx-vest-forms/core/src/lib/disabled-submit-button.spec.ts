/**
 * Tests documenting behavior when submit button is disabled based on validity
 *
 * While we recommend NOT disabling submit buttons (WCAG 2.2 compliance),
 * these tests document what happens when developers choose to do so.
 */

import { signal } from '@angular/core';
import { enforce, test } from 'vest';
import { describe, expect, it } from 'vitest';
import { runInAngular } from '../../../test-utilities';
import { createVestForm } from './create-vest-form';
import { staticSafeSuite } from './utils/safe-suite';

describe('Disabled Submit Button Scenarios', () => {
  type TestModel = {
    email: string;
    password: string;
  };

  const testSuite = staticSafeSuite<TestModel>((data = {}) => {
    test('email', 'Email is required', () => {
      enforce(data.email).isNotEmpty();
    });

    test('email', 'Invalid email format', () => {
      enforce(data.email).isEmail();
    });

    test('password', 'Password must be at least 8 characters', () => {
      enforce(data.password).longerThanOrEquals(8);
    });
  });

  describe('❌ Problem: Disabled submit with on-touch strategy', () => {
    it('should NOT show errors when button is disabled and no fields touched', () => {
      // Simulate developer disabling button based on validity
      const form = createVestForm(
        testSuite,
        signal<TestModel>({
          email: '',
          password: '',
        }),
        {
          errorStrategy: 'on-touch', // Default strategy
        },
      );

      // Initial state: form is invalid
      expect(form.valid()).toBe(false);

      // Button would be disabled: [disabled]="!form.valid()"
      const submitButtonDisabled = !form.valid();
      expect(submitButtonDisabled).toBe(true);

      // User hasn't touched any fields
      expect(form.emailTouched()).toBe(false);
      expect(form.passwordTouched()).toBe(false);

      // User can't click submit (button is disabled)
      // So hasSubmitted never becomes true
      expect(form.hasSubmitted()).toBe(false);

      // Result: NO ERRORS VISIBLE (BAD UX!)
      expect(form.emailShowErrors()).toBe(false);
      expect(form.passwordShowErrors()).toBe(false);

      // User sees: disabled button, no errors, no guidance
      // This violates WCAG 3.3.1 (Error Identification)
    });

    it('should show errors once user starts touching fields', () => {
      const form = createVestForm(
        testSuite,
        signal<TestModel>({
          email: '',
          password: '',
        }),
        {
          errorStrategy: 'on-touch',
        },
      );

      // Initial: no errors visible
      expect(form.emailShowErrors()).toBe(false);

      // User touches email field
      form.touchEmail();

      // Now email errors are visible
      expect(form.emailShowErrors()).toBe(true);
      expect(form.emailValidation().errors).toContain('Email is required');

      // But password errors still hidden (not touched)
      expect(form.passwordShowErrors()).toBe(false);
    });
  });

  describe('✅ Solution A: Use immediate strategy', () => {
    it('should show all errors immediately, even with disabled button', () => {
      const form = createVestForm(
        testSuite,
        signal<TestModel>({
          email: '',
          password: '',
        }),
        {
          errorStrategy: 'immediate', // Show errors immediately
        },
      );

      // Form is invalid
      expect(form.valid()).toBe(false);

      // Button would be disabled
      const submitButtonDisabled = !form.valid();
      expect(submitButtonDisabled).toBe(true);

      // But errors ARE visible (immediate strategy)
      expect(form.emailShowErrors()).toBe(true);
      expect(form.passwordShowErrors()).toBe(true);

      // User knows what to fix!
      expect(form.emailValidation().errors).toContain('Email is required');
      expect(form.passwordValidation().errors).toContain(
        'Password must be at least 8 characters',
      );
    });
  });

  describe('✅ Solution B: Touch all fields on mount', () => {
    it('should show all errors when fields are touched on init', async () => {
      await runInAngular(async () => {
        const form = createVestForm(
          testSuite,
          signal<TestModel>({
            email: '',
            password: '',
          }),
          {
            errorStrategy: 'on-touch',
          },
        );

        // Simulate ngOnInit touching all fields
        form.touchEmail();
        form.touchPassword();

        // Re-validate the full form to get all errors after touching
        form.validate();

        // Now all fields are touched AND validated, so errors are visible
        expect(form.emailTouched()).toBe(true);
        expect(form.passwordTouched()).toBe(true);
        expect(form.emailShowErrors()).toBe(true);
        expect(form.passwordShowErrors()).toBe(true);

        // User sees errors and knows what to fix
        expect(form.emailValidation().errors).toContain('Email is required');
        expect(form.passwordValidation().errors).toContain(
          'Password must be at least 8 characters',
        );
      });
    });
  });

  describe('✅ Recommended: Enable submit button', () => {
    it('should show all errors when user clicks submit', async () => {
      const form = createVestForm(
        testSuite,
        signal<TestModel>({
          email: '',
          password: '',
        }),
        {
          errorStrategy: 'on-touch',
        },
      );

      // Button is enabled: [disabled]="form.pending() || form.submitting()"
      expect(form.pending()).toBe(false);
      expect(form.submitting()).toBe(false);
      const submitButtonDisabled = form.pending() || form.submitting();
      expect(submitButtonDisabled).toBe(false);

      // Initial: no errors visible
      expect(form.emailShowErrors()).toBe(false);
      expect(form.passwordShowErrors()).toBe(false);

      // User clicks submit (button is enabled!)
      const result = await form.submit();

      // Expected to fail validation
      expect(result.valid).toBe(false);

      // Now hasSubmitted is true
      expect(form.hasSubmitted()).toBe(true);

      // All errors are visible (on-touch + submitted)
      expect(form.emailShowErrors()).toBe(true);
      expect(form.passwordShowErrors()).toBe(true);

      // User sees all errors and knows what to fix!
      expect(form.emailValidation().errors).toContain('Email is required');
      expect(form.passwordValidation().errors).toContain(
        'Password must be at least 8 characters',
      );
    });
  });
});
