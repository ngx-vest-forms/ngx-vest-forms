import { expect, test } from '@playwright/test';

test.describe('Minimal Form - Simplest Form Pattern', () => {
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

    await test.step('Verify form state indicators', async () => {
      // Form should have state indicators for development/demo purposes
      await expect(page.getByText('Form State:')).toBeVisible();

      // Initial state should show email error in the live state display
      await expect(page.getByText('Email is required')).toBeVisible();
    });
  });

  test('should validate email field on blur', async ({ page }) => {
    await test.step('Test required field validation', async () => {
      const emailField = page.getByRole('textbox', { name: /Email Address/i });

      // Focus and blur empty field to trigger validation
      await emailField.click();
      await emailField.press('Tab');

      // Required error should appear in the form field error display
      await expect(
        page.locator('[role="alert"]').filter({ hasText: 'Email is required' }),
      ).toBeVisible({
        timeout: 2000,
      });
    });

    await test.step('Test email format validation', async () => {
      const emailField = page.getByRole('textbox', { name: /Email Address/i });

      // Enter invalid email format
      await emailField.fill('invalid-email-format');
      await emailField.press('Tab');

      // Format error should appear
      await expect(
        page
          .locator('[role="alert"]')
          .filter({ hasText: 'Please enter a valid email' }),
      ).toBeVisible({ timeout: 2000 });
    });

    await test.step('Test valid email clears errors', async () => {
      const emailField = page.getByRole('textbox', { name: /Email Address/i });

      // Enter valid email
      await emailField.fill('user@example.com');
      await emailField.press('Tab');

      // Wait for validation to complete
      await page.waitForTimeout(500);

      // Errors should disappear
      await expect(
        page.locator('[role="alert"]').filter({ hasText: 'Email is required' }),
      ).not.toBeVisible();
      await expect(
        page
          .locator('[role="alert"]')
          .filter({ hasText: 'Please enter a valid email' }),
      ).not.toBeVisible();
    });
  });

  test('should control submit button state based on form validity', async ({
    page,
  }) => {
    await test.step('Submit button should be disabled initially', async () => {
      const submitButton = page.getByRole('button', { name: /Submit/i });
      await expect(submitButton).toBeDisabled();
    });

    await test.step('Submit button should remain disabled with invalid email', async () => {
      await page
        .getByRole('textbox', { name: /Email Address/i })
        .fill('invalid');

      // Wait for validation
      await page.waitForTimeout(500);

      const submitButton = page.getByRole('button', { name: /Submit/i });
      await expect(submitButton).toBeDisabled();
    });

    await test.step('Submit button should be enabled with valid email', async () => {
      await page
        .getByRole('textbox', { name: /Email Address/i })
        .fill('user@example.com');

      // Wait for validation to complete
      await page.waitForTimeout(1000);

      const submitButton = page.getByRole('button', { name: /Submit/i });
      await expect(submitButton).toBeEnabled({ timeout: 2000 });
    });
  });

  test('should handle form submission correctly', async ({ page }) => {
    await test.step('Fill valid email and submit', async () => {
      await page
        .getByRole('textbox', { name: /Email Address/i })
        .fill('user@example.com');

      // Wait for form to become valid
      await page.waitForTimeout(500);

      // Submit the form
      await page.getByRole('button', { name: /Submit/i }).click();

      // Look for form submitted message in console or success indication
      // Note: This form logs to console, so we're just checking it doesn't error
    });

    await test.step('Form should remain functional after submission', async () => {
      // Form should still be present and functional
      await expect(
        page.getByRole('textbox', { name: /Email Address/i }),
      ).toBeVisible();
      await expect(page.getByRole('button', { name: /Submit/i })).toBeVisible();
    });
  });

  test('should demonstrate proper error display timing', async ({ page }) => {
    await test.step('Errors should not appear immediately on focus', async () => {
      const emailField = page.locator('input[name="email"]');

      // Focus field but don't blur yet
      await emailField.click();

      // Error should not appear immediately
      await expect(page.locator('text=Email is required')).not.toBeVisible({
        timeout: 500,
      });
    });

    await test.step('Errors should appear after blur (touched state)', async () => {
      const emailField = page.locator('input[name="email"]');

      // Focus and immediately blur
      await emailField.click();
      await emailField.press('Tab');

      // Error should now appear
      await expect(page.locator('text=Email is required')).toBeVisible({
        timeout: 2000,
      });
    });

    await test.step('Errors should update in real-time after initial blur', async () => {
      const emailField = page.locator('input[name="email"]');

      // Type invalid email (field is already touched from previous step)
      await emailField.fill('invalid');

      // Wait briefly for validation
      await page.waitForTimeout(500);

      // Should show format error
      await expect(
        page.locator('text=Please enter a valid email'),
      ).toBeVisible();

      // Complete the email
      await emailField.fill('invalid@example.com');

      // Wait for validation
      await page.waitForTimeout(500);

      // Error should disappear
      await expect(
        page.locator('text=Please enter a valid email'),
      ).not.toBeVisible();
    });
  });

  test('should maintain accessibility compliance', async ({ page }) => {
    await test.step('Verify proper ARIA attributes', async () => {
      const emailField = page.locator('input[name="email"]');

      // Trigger validation error
      await emailField.click();
      await emailField.press('Tab');

      // Wait for error to appear
      await expect(page.locator('text=Email is required')).toBeVisible();

      // Field should have aria-invalid when in error state
      await expect(emailField).toHaveAttribute('aria-invalid', 'true');

      // Field should have aria-describedby pointing to error
      const describedBy = await emailField.getAttribute('aria-describedby');
      if (describedBy) {
        await expect(page.locator(`#${describedBy}`)).toBeVisible();
      }
    });

    await test.step('Verify error messages have proper role', async () => {
      // Error messages should have role="alert" for screen readers
      await expect(page.locator('[role="alert"]').first()).toBeVisible();
    });

    await test.step('Verify keyboard navigation', async () => {
      // Form should be fully keyboard accessible
      await page.keyboard.press('Tab'); // Should focus email field
      await page.keyboard.press('Tab'); // Should focus submit button

      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });
  });

  test('should handle rapid interactions without race conditions', async ({
    page,
  }) => {
    await test.step('Rapidly type and clear field', async () => {
      const emailField = page.locator('input[name="email"]');

      // Rapidly interact with field
      await emailField.click();
      await emailField.fill('a');
      await emailField.fill('ab');
      await emailField.fill('abc@');
      await emailField.fill('abc@ex');
      await emailField.fill('abc@example.com');
      await emailField.press('Tab');

      // Wait for validation to stabilize
      await page.waitForTimeout(1000);

      // Should end up in valid state without errors
      await expect(page.locator('text=Email is required')).not.toBeVisible();
      await expect(
        page.locator('text=Please enter a valid email'),
      ).not.toBeVisible();

      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeEnabled();
    });
  });

  test('should demonstrate unidirectional data flow', async ({ page }) => {
    await test.step('Verify model updates reflect in UI', async () => {
      const emailField = page.locator('input[name="email"]');

      // Fill field
      await emailField.fill('test@example.com');

      // Value should be reflected in the field
      await expect(emailField).toHaveValue('test@example.com');

      // If there are any debug displays of the model, they should update too
      const modelDisplay = page.locator('[data-testid="model"], .model-debug');
      if (await modelDisplay.isVisible()) {
        await expect(modelDisplay).toContainText('test@example.com');
      }
    });
  });

  test('should work with different email formats', async ({ page }) => {
    await test.step('Test various valid email formats', async () => {
      const emailField = page.locator('input[name="email"]');
      const validEmails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.com',
        'user123@sub.example.com',
        'a@b.co',
      ];

      for (const email of validEmails) {
        await emailField.fill(email);
        await emailField.press('Tab');

        // Wait for validation
        await page.waitForTimeout(500);

        // Should not show format error
        await expect(
          page.locator('text=Please enter a valid email'),
        ).not.toBeVisible();

        // Clear for next test
        await emailField.clear();
      }
    });

    await test.step('Test invalid email formats', async () => {
      const emailField = page.locator('input[name="email"]');
      const invalidEmails = [
        'invalid',
        '@example.com',
        'user@',
        'user space@example.com',
        'user..double@example.com',
      ];

      for (const email of invalidEmails) {
        await emailField.fill(email);
        await emailField.press('Tab');

        // Wait for validation
        await page.waitForTimeout(500);

        // Should show format error
        await expect(
          page.locator('text=Please enter a valid email'),
        ).toBeVisible();

        // Clear for next test
        await emailField.clear();
        await emailField.click();
      }
    });
  });
});
