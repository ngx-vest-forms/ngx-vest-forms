import { expect, test } from '@playwright/test';
import {
  navigateToPurchaseForm,
  waitForConsoleCheck,
  waitForFormProcessing,
} from '../../helpers/form-helpers';

test.describe('Date Field Shape Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Listen for console errors before navigation
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error('Browser console error:', msg.text());
      }
    });

    await navigateToPurchaseForm(page);
  });

  test('should not throw shape validation errors for Date fields with empty strings', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];

    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await test.step('Verify form loads without shape mismatch errors', async () => {
      // Wait for form to be visible
      const form = page.locator('form[ngxVestForm]');
      await expect(form).toBeVisible();

      // Wait a moment for any delayed validations
      await waitForConsoleCheck(page);

      // Verify no shape mismatch errors
      const shapeMismatchErrors = consoleErrors.filter(
        (error) =>
          error.includes('Shape mismatch') ||
          error.includes('[ngModel] Mismatch')
      );

      expect(shapeMismatchErrors).toHaveLength(0);
    });
  });

  test('should allow Date field to receive empty string on initial load', async ({
    page,
  }) => {
    await test.step('Verify Date field exists and is empty', async () => {
      const dateField = page.getByLabel(/birth date/i);
      await expect(dateField).toBeVisible();

      // Check that the field is empty (hasn't been filled yet)
      const value = await dateField.inputValue();
      expect(value).toBe('');
    });
  });

  test('should allow Date field to transition from empty to filled', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await test.step('Fill Date field and verify no shape errors', async () => {
      const dateField = page.getByLabel(/birth date/i);

      // Fill the date field
      await dateField.fill('2000-01-01');
      await dateField.blur();

      // Wait for validation
      await waitForFormProcessing(page);

      // Verify no shape mismatch errors
      const shapeMismatchErrors = consoleErrors.filter(
        (error) =>
          error.includes('Shape mismatch') ||
          error.includes('[ngModel] Mismatch')
      );

      expect(shapeMismatchErrors).toHaveLength(0);
    });
  });

  test('should allow Date field to be cleared back to empty string', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await test.step('Fill then clear Date field', async () => {
      const dateField = page.getByLabel(/birth date/i);

      // Fill the date field
      await dateField.fill('2000-01-01');
      await dateField.blur();
      await waitForFormProcessing(page);

      // Clear the date field
      await dateField.clear();
      await dateField.blur();
      await waitForFormProcessing(page);

      // Verify no shape mismatch errors
      const shapeMismatchErrors = consoleErrors.filter(
        (error) =>
          error.includes('Shape mismatch') ||
          error.includes('[ngModel] Mismatch')
      );

      expect(shapeMismatchErrors).toHaveLength(0);
    });
  });

  test('should handle multiple Date fields correctly', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await test.step('Verify form with Date fields loads correctly', async () => {
      // The purchase form has a birthDate field
      const dateField = page.getByLabel(/birth date/i);
      await expect(dateField).toBeVisible();

      // Wait for form initialization
      await waitForConsoleCheck(page);

      // Verify no shape mismatch errors occurred during initialization
      const shapeMismatchErrors = consoleErrors.filter(
        (error) =>
          error.includes('Shape mismatch') ||
          error.includes('[ngModel] Mismatch')
      );

      expect(shapeMismatchErrors).toHaveLength(0);
    });
  });
});
