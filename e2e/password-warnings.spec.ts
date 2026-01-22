import { expect, test } from '@playwright/test';
import { fillAndBlur, waitForValidationToSettle } from './helpers/form-helpers';

/**
 * E2E Tests for Vest warn() functionality and warningMessages() signal
 *
 * Tests the fix for issue #69 where errors() signal returned array indices
 * instead of actual warning messages when only warnings existed.
 *
 * This test ensures:
 * 1. Non-blocking warnings are displayed correctly (not array indices like "0", "1")
 * 2. Warnings don't prevent form submission (non-blocking)
 * 3. Warning messages use proper ARIA attributes for accessibility
 * 4. Warnings appear/disappear based on validation logic
 */
test.describe('Password Warnings - Vest warn() Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200/');
  });

  /**
   * Helper to fill password field and wait for warnings.
   * Uses page.fill() + blur for reliability, avoiding char-by-char typing issues.
   * Then waits for validation to settle before checking for warnings container.
   */
  async function fillPasswordAndWaitForWarnings(
    page: import('@playwright/test').Page,
    password: import('@playwright/test').Locator,
    value: string
  ): Promise<void> {
    await password.fill(value);
    await password.blur();
    await waitForValidationToSettle(page);
  }

  test('should display actual warning messages, not array indices (fixes #69)', async ({
    page,
  }) => {
    await test.step('Navigate to password field and enter weak password', async () => {
      const password = page.getByLabel('Password', { exact: true });

      // Enter a password that triggers warnings (less than 12 chars, no complexity)
      await fillAndBlur(password, 'short123');

      // Wait for validation to complete (aria-busy is on wrapper, not input)
      await waitForValidationToSettle(page);
    });

    await test.step('Verify warning messages display actual text (not indices)', async () => {
      const warningsContainer = page.getByTestId('password-warnings');

      // Should show warnings
      await expect(warningsContainer).toBeVisible();

      // Should contain actual warning messages
      await expect(warningsContainer).toContainText(/12 characters/i);
      await expect(warningsContainer).toContainText(
        /mix of uppercase, lowercase/i
      );

      // Should NOT contain array indices (bug from issue #69)
      const warningText = await warningsContainer.textContent();
      expect(warningText).not.toMatch(/^\s*0\s*$/);
      expect(warningText).not.toMatch(/^\s*1\s*$/);
      expect(warningText).not.toContain('"0"');
      expect(warningText).not.toContain('"1"');
    });

    await test.step('Verify warnings have proper ARIA attributes', async () => {
      const warningsContainer = page.getByTestId('password-warnings');

      // Should use role="status" with aria-live="polite" (non-assertive for warnings)
      await expect(warningsContainer).toHaveAttribute('role', 'status');
      await expect(warningsContainer).toHaveAttribute('aria-live', 'polite');
    });
  });

  test('should allow form submission despite warnings (non-blocking)', async ({
    page,
  }) => {
    await test.step('Fill required fields with data that triggers warnings', async () => {
      // Fill minimum required fields
      await fillAndBlur(page.getByLabel(/first name/i), 'John');
      await fillAndBlur(page.getByLabel(/last name/i), 'Doe');
      await fillAndBlur(page.getByLabel(/birth date/i), '1990-01-01');
      await fillAndBlur(page.getByLabel(/age/i), '33');

      // Gender selection - use locator by id due to label structure
      await page.locator('#gender-male').check();

      // Password with warnings (short and weak)
      await fillAndBlur(
        page.getByLabel('Password', { exact: true }),
        'Test123'
      );
      await fillAndBlur(page.getByLabel(/confirm password/i), 'Test123');

      // Order details
      await page.getByLabel(/product/i).selectOption({ index: 1 });
      await fillAndBlur(page.getByLabel(/quantity/i), '1');

      // Billing address
      await fillAndBlur(page.getByLabel(/street/i).first(), 'Main St');
      await fillAndBlur(page.getByLabel(/number/i).first(), '123');
      await fillAndBlur(page.getByLabel(/city/i).first(), 'New York');
      await fillAndBlur(page.getByLabel(/zipcode/i).first(), '10001');
      await fillAndBlur(page.getByLabel(/country/i).first(), 'USA');
    });

    await test.step('Verify warnings are displayed', async () => {
      const warningsContainer = page.getByTestId('password-warnings');
      await expect(warningsContainer).toBeVisible();
    });

    await test.step('Submit form successfully despite warnings', async () => {
      const submitButton = page.getByRole('button', { name: /submit order/i });

      // Form should be valid (warnings don't block submission)
      await submitButton.click();

      // No form-level errors should appear (warnings are non-blocking)
      const rootError = page.locator('[role="alert"]').first();
      await expect(rootError).not.toBeVisible();
    });
  });

  test('should clear warnings when password becomes strong', async ({
    page,
  }) => {
    await test.step('Enter weak password', async () => {
      const password = page.getByLabel('Password', { exact: true });

      // Use fill + blur for reliability
      await fillPasswordAndWaitForWarnings(page, password, 'weak');

      // Wait for warnings to appear
      const warningsContainer = page.getByTestId('password-warnings');
      await expect(warningsContainer).toBeVisible();
    });

    await test.step('Update to strong password', async () => {
      const password = page.getByLabel('Password', { exact: true });

      // Clear and enter strong password (12+ chars with complexity)
      // Use fill + blur for reliability
      await fillPasswordAndWaitForWarnings(page, password, 'SecureP@ssw0rd123');
    });

    await test.step('Verify warnings are cleared', async () => {
      const warningsContainer = page.getByTestId('password-warnings');

      // Warnings should no longer be visible
      await expect(warningsContainer).not.toBeVisible();
    });
  });

  test('should show different warnings for different password weaknesses', async ({
    page,
  }) => {
    await test.step('Test length warning only', async () => {
      const password = page.getByLabel('Password', { exact: true });

      // Long enough but no complexity - use fill + blur for reliability
      await fillPasswordAndWaitForWarnings(page, password, 'passwordpassword');

      // Wait for warnings container to appear
      const warningsContainer = page.getByTestId('password-warnings');
      await expect(warningsContainer).toBeVisible();

      // Should NOT show length warning (12+ chars)
      await expect(warningsContainer).not.toContainText(/12 characters/i);

      // Should show complexity warning
      await expect(warningsContainer).toContainText(
        /mix of uppercase, lowercase/i
      );
    });

    await test.step('Test complexity warning only', async () => {
      const password = page.getByLabel('Password', { exact: true });

      // Complex but short - use fill + blur for reliability
      await fillPasswordAndWaitForWarnings(page, password, 'P@ss1');

      // Wait for warnings container with updated content
      const warningsContainer = page.getByTestId('password-warnings');
      await expect(warningsContainer).toContainText(/12 characters/i);

      // Should show length warning
      await expect(warningsContainer).toContainText(/12 characters/i);

      // Should NOT show complexity warning (has all types)
      await expect(warningsContainer).not.toContainText(
        /mix of uppercase, lowercase/i
      );
    });
  });

  test('should not show warnings on pristine field', async ({ page }) => {
    await test.step('Password field starts without warnings', async () => {
      const warningsContainer = page.getByTestId('password-warnings');

      // Warnings should not be visible on page load (pristine field)
      await expect(warningsContainer).not.toBeVisible();
    });

    await test.step('Focus and blur without entering text', async () => {
      const password = page.getByLabel('Password', { exact: true });
      await password.focus();
      await password.blur();

      // Still no warnings (no value entered)
      const warningsContainer = page.getByTestId('password-warnings');
      await expect(warningsContainer).not.toBeVisible();
    });
  });

  test('should handle multiple warnings simultaneously', async ({ page }) => {
    await test.step('Enter password that triggers both warnings', async () => {
      const password = page.getByLabel('Password', { exact: true });

      // Use fill + blur for reliability
      await fillPasswordAndWaitForWarnings(page, password, 'short');

      // Wait for warnings container to appear
      const warningsContainer = page.getByTestId('password-warnings');
      await expect(warningsContainer).toBeVisible();
    });

    await test.step('Verify both warnings are displayed', async () => {
      const warningsContainer = page.getByTestId('password-warnings');

      // Should show length warning
      const lengthWarning = warningsContainer.getByText(/12 characters/i);
      await expect(lengthWarning).toBeVisible();

      // Should show complexity warning
      const complexityWarning =
        warningsContainer.getByText(/mix of uppercase/i);
      await expect(complexityWarning).toBeVisible();

      // Should have 2 warning elements
      const warnings = warningsContainer.locator('div.flex');
      await expect(warnings).toHaveCount(2);
    });
  });

  test('should maintain warning state during form interaction', async ({
    page,
  }) => {
    await test.step('Enter weak password', async () => {
      const password = page.getByLabel('Password', { exact: true });

      // Use fill + blur for reliability
      await fillPasswordAndWaitForWarnings(page, password, 'weak123');

      // Wait for warnings container to appear
      const warningsContainer = page.getByTestId('password-warnings');
      await expect(warningsContainer).toBeVisible();
    });

    await test.step('Interact with other fields', async () => {
      // Fill other fields
      await fillAndBlur(page.getByLabel(/first name/i), 'Jane');
      await fillAndBlur(page.getByLabel(/last name/i), 'Smith');
    });

    await test.step('Verify warnings persist', async () => {
      const warningsContainer = page.getByTestId('password-warnings');

      // Warnings should still be visible
      await expect(warningsContainer).toBeVisible();
      await expect(warningsContainer).toContainText(/12 characters/i);
    });
  });

  test('accessibility: warnings should be announced to screen readers', async ({
    page,
  }) => {
    await test.step('Enter weak password', async () => {
      const password = page.getByLabel('Password', { exact: true });

      // Use fill + blur for reliability
      await fillPasswordAndWaitForWarnings(page, password, 'weak');

      // Wait for warnings container to appear
      const warningsContainer = page.getByTestId('password-warnings');
      await expect(warningsContainer).toBeVisible();
    });

    await test.step('Verify ARIA live region configuration', async () => {
      const warningsContainer = page.getByTestId('password-warnings');

      // Should have proper ARIA attributes for screen reader announcement
      await expect(warningsContainer).toHaveAttribute('role', 'status');
      await expect(warningsContainer).toHaveAttribute('aria-live', 'polite');

      // Warning icons should be decorative (not read by screen readers)
      const warningIcon = warningsContainer.locator('svg').first();
      await expect(warningIcon).toBeVisible();

      // Text content should be accessible
      const warningText = await warningsContainer.textContent();
      expect(warningText).toBeTruthy();
      expect(warningText?.length).toBeGreaterThan(10);
    });
  });
});
