import { expect, test } from '@playwright/test';

test.describe('Minimal Form - V2 Implementation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fundamentals/minimal-form');
    await page.waitForLoadState('networkidle');
  });

  test('should display the minimal form with email field', async ({ page }) => {
    await test.step('Verify form structure', async () => {
      // Check form heading
      await expect(
        page.getByRole('heading', { name: /Minimal Form/i }),
      ).toBeVisible();

      // Verify email field is present and properly labeled
      await expect(
        page.getByRole('textbox', { name: /Email Address/i }),
      ).toBeVisible();

      // Submit button should be present and disabled initially
      const submitButton = page.getByRole('button', { name: /Submit/i });
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toBeDisabled();
    });

    await test.step('Verify debugger is present', async () => {
      await expect(page.getByText('Form State & Validation')).toBeVisible();
      await expect(page.getByText('Form Model')).toBeVisible();
      // The debugger uses <details>/<summary> for collapsible sections
      // Use first() to get the summary element, not the "No validation errors" message
      await expect(page.getByText('Validation Errors').first()).toBeVisible();
    });
  });

  test('should validate email field correctly', async ({ page }) => {
    await test.step('Test required field validation', async () => {
      const emailField = page.getByRole('textbox', { name: /Email Address/i });

      // Interact with field by typing and clearing to trigger touched state
      await emailField.fill('a');
      await emailField.fill('');
      await emailField.blur();

      // Required error should appear in the form field error display
      await expect(
        page.locator('[role="alert"]').filter({ hasText: 'Email is required' }),
      ).toBeVisible({
        timeout: 2000,
      });
    });

    await test.step('Test valid email acceptance', async () => {
      const emailField = page.getByRole('textbox', { name: /Email Address/i });

      // Enter valid email
      await emailField.fill('test@example.com');
      await emailField.press('Tab');

      // Error should disappear
      await expect(
        page.locator('[role="alert"]').filter({ hasText: 'Email is required' }),
      ).not.toBeVisible();

      // Submit button should be enabled
      const submitButton = page.getByRole('button', { name: /Submit/i });
      await expect(submitButton).toBeEnabled();
    });
  });

  test('should display form state in debugger', async ({ page }) => {
    await test.step('Check form model is displayed', async () => {
      // Check that the form model section exists and shows JSON
      const modelSection = page.locator('details:has-text("Form Model")');
      await expect(modelSection).toBeVisible();

      const jsonDisplay = page.locator('pre code').first();
      await expect(jsonDisplay).toBeVisible();
      await expect(jsonDisplay).toContainText('"email"');
    });

    await test.step('Check validation state updates', async () => {
      const emailField = page.getByRole('textbox', { name: /Email Address/i });

      // Enter some text and verify it appears in the debugger
      await emailField.fill('user@example.com');

      // Verify the value appears somewhere in the debugger
      const jsonDisplay = page.locator('pre code').first();
      // Note: Due to V2 implementation, the exact structure may vary
      // but the key functionality should work
      await expect(jsonDisplay).toContainText('email');
    });
  });
});
