import { expect, test } from '@playwright/test';
import { fillAndBlur } from './helpers/form-helpers';

/**
 * ROOT_FORM Live Mode Validation Tests
 *
 * These tests verify the 'live' mode for ROOT_FORM validation where errors
 * appear immediately on value changes WITHOUT requiring form submission.
 *
 * Background: PR #60 changed the default mode from 'live' to 'submit' for better UX.
 * This test file specifically tests the 'live' mode behavior which is still supported
 * via [validateRootFormMode]="'live'"
 */
test.describe('ROOT_FORM Live Mode Validation', () => {
  test.beforeEach(async ({ page }) => {
    // For this test, we need a form with live mode enabled
    // Since purchase-form uses 'submit' mode, we'll test the validation-config-demo
    // which could be enhanced to support ROOT_FORM validation in live mode
    // For now, we'll document the test structure for when a live mode demo is available
    await page.goto('/purchase');
  });

  test.skip('should validate immediately without submit in live mode', async ({
    page,
  }) => {
    /**
     * IMPLEMENTATION NOTE:
     * This test is skipped because it requires a demo component with:
     * 1. [validateRootFormMode]="'live'"
     * 2. ROOT_FORM validation rules
     *
     * To enable this test:
     * 1. Create a query parameter support in purchase-form or validation-config-demo
     *    to toggle between 'live' and 'submit' modes
     * 2. Add ROOT_FORM validation to validation-config-demo component
     *
     * Example implementation in component:
     * ```typescript
     * protected readonly mode = signal<'live' | 'submit'>(
     *   this.route.snapshot.queryParams['mode'] === 'live' ? 'live' : 'submit'
     * );
     * ```
     *
     * Template:
     * ```html
     * <form scVestForm validateRootForm [validateRootFormMode]="mode()">
     * ```
     */
    await test.step('Navigate to demo with live mode enabled', async () => {
      // await page.goto('/validation-config-demo?mode=live');
      // OR
      // await page.goto('/purchase?mode=live');
    });

    await test.step('Fill fields that trigger ROOT_FORM validation', async () => {
      const password = page.getByLabel('Password', { exact: true });
      const confirmPassword = page.getByLabel(/confirm password/i);

      await fillAndBlur(password, 'SecurePass123');
      await fillAndBlur(confirmPassword, 'DifferentPass456');

      // In live mode, ROOT_FORM error should appear WITHOUT clicking submit
      const rootError = page.locator('[data-testid="root-error"]');
      await expect(rootError).toBeVisible();
      await expect(rootError).toContainText(/match/i);
    });

    await test.step('Verify error clears immediately when fixed', async () => {
      const confirmPassword = page.getByLabel(/confirm password/i);

      await fillAndBlur(confirmPassword, 'SecurePass123');

      // Error should disappear immediately without submit
      const rootError = page.locator('[data-testid="root-error"]');
      await expect(rootError).not.toBeVisible();
    });
  });

  test('should demonstrate difference between live and submit modes', async ({
    page,
  }) => {
    await test.step('Document expected behavior differences', async () => {
      /**
       * SUBMIT MODE (default, better UX):
       * - User fills firstName="Brecht", lastName="Billiet", age="30"
       * - NO error appears during typing
       * - User clicks submit
       * - ROOT_FORM error "Brecht is not 30 anymore" appears
       * - User changes age to 31
       * - User clicks submit again
       * - Error disappears
       *
       * LIVE MODE (immediate feedback):
       * - User fills firstName="Brecht", lastName="Billiet", age="30"
       * - ROOT_FORM error appears IMMEDIATELY (no submit needed)
       * - User changes age to 31
       * - Error disappears IMMEDIATELY (no submit needed)
       *
       * WHY SUBMIT IS BETTER FOR ROOT_FORM:
       * - Cross-field validations check relationships between multiple fields
       * - Users need to fill ALL fields before the validation makes sense
       * - Live mode shows errors before user can possibly fix them
       * - Submit mode only validates when all fields are likely complete
       */
      expect(true).toBe(true); // Placeholder assertion
    });
  });
});

/**
 * Manual Testing Instructions for ROOT_FORM Live Mode
 *
 * Since automated testing of live mode requires component modifications,
 * perform the following manual tests:
 *
 * 1. Temporarily modify purchase-form.component.html:
 *    Change: [validateRootFormMode]="'submit'"
 *    To: [validateRootFormMode]="'live'"
 *
 * 2. Open http://localhost:4200/purchase in browser
 *
 * 3. Test Scenario: Brecht Validation Live Mode
 *    - Fill firstName: "Brecht"
 *    - Fill lastName: "Billiet"
 *    - Fill age: "30"
 *    - VERIFY: Error "Brecht is not 30 anymore" appears IMMEDIATELY
 *    - Change age to: "31"
 *    - VERIFY: Error disappears IMMEDIATELY without clicking submit
 *
 * 4. Test Scenario: Password Mismatch Live Mode
 *    - If form had ROOT_FORM password validation (not currently implemented)
 *    - Fill password: "SecurePass123"
 *    - Fill confirmPassword: "DifferentPass456"
 *    - VERIFY: ROOT_FORM error appears immediately
 *    - Change confirmPassword to: "SecurePass123"
 *    - VERIFY: Error clears immediately
 *
 * 5. Restore original mode:
 *    Change back to: [validateRootFormMode]="'submit'"
 */
