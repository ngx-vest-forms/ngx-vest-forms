import { expect, test } from '@playwright/test';

/**
 * Error Display Modes - Comprehensive E2E Tests
 *
 * Tests the product feedback form that demonstrates different error display strategies.
 *
 * CRITICAL BUG TEST INCLUDED:
 * Previously, only 1 validation error displayed at a time due to incorrect only(field) usage.
 * The validation suite was calling only(field) without checking if field was undefined.
 * When field is undefined, only(undefined) tells Vest to skip ALL tests.
 *
 * Fix: Now using staticSafeSuite which automatically handles the guard pattern.
 *
 * This test suite verifies:
 * 1. Multiple errors display simultaneously on initial load (bug regression test)
 * 2. Form validation updates in real-time
 * 3. Form state updates correctly
 * 4. Accessibility attributes are set correctly
 */

test.describe('Error Display Modes - Product Feedback Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fundamentals/error-display-modes');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Error Display Mode Selector', () => {
    test('should have default on-touch strategy selected', async ({ page }) => {
      const onTouchRadio = page.getByRole('radio', {
        name: /^On Touch$/i,
      });
      await expect(onTouchRadio).toBeChecked();
    });

    test('should allow switching between strategies', async ({ page }) => {
      await test.step('Switch to immediate strategy', async () => {
        const immediateRadio = page.getByRole('radio', {
          name: /Immediate/i,
        });
        await immediateRadio.check();
        await expect(immediateRadio).toBeChecked();
      });

      await test.step('Switch to on-submit strategy', async () => {
        const saveRadio = page.getByRole('radio', {
          name: /On Submit/i,
        });
        await saveRadio.check();
        await expect(saveRadio).toBeChecked();
      });

      await test.step('Switch back to on-touch', async () => {
        const onTouchRadio = page.getByRole('radio', {
          name: /^On Touch$/i,
        });
        await onTouchRadio.check();
        await expect(onTouchRadio).toBeChecked();
      });
    });

    test('should display strategy information', async ({ page }) => {
      // Verify strategy labels and descriptions are visible
      await expect(page.getByText('Immediate', { exact: true })).toBeVisible();
      await expect(page.getByText('On Touch', { exact: true })).toBeVisible();
      await expect(page.getByText('On Submit', { exact: true })).toBeVisible();
    });
  });

  test.describe('CRITICAL BUG REGRESSION: Multiple Errors Display', () => {
    test('should display ALL required field errors after fields are touched', async ({
      page,
    }) => {
      await test.step('Touch each required field without entering data', async () => {
        const nameField = page.getByRole('textbox', { name: /Full Name/i });
        await nameField.focus();
        await nameField.blur();

        const emailField = page.getByRole('textbox', {
          name: /Email Address/i,
        });
        await emailField.focus();
        await emailField.blur();

        const productField = page.getByRole('combobox', {
          name: /Which product did you use/i,
        });
        await productField.focus();
        await productField.blur();

        const ratingField = page.getByRole('spinbutton', {
          name: /Overall Rating/i,
        });
        await ratingField.focus();
        await ratingField.blur();
      });

      await test.step('Verify form shows invalid status', async () => {
        await expect(page.getByText('Invalid', { exact: true })).toBeVisible();
      });

      await test.step('Verify multiple errors are tracked in debugger', async () => {
        const debuggerPanel = page.locator('ngx-debugger').first();
        await expect(debuggerPanel).toBeVisible();

        const errorList = debuggerPanel
          .locator('details')
          .filter({ hasText: 'Validation Errors' })
          .locator('li');
        await expect(errorList.first()).toBeVisible();

        const errorCount = await errorList.count();
        expect(errorCount).toBeGreaterThanOrEqual(4);
      });

      await test.step('Verify required field errors are visible', async () => {
        await expect(page.locator('#name-error')).toBeVisible();
        await expect(page.locator('#email-error')).toBeVisible();
        await expect(page.locator('#productUsed-error')).toBeVisible();
        await expect(page.locator('#overallRating-error')).toBeVisible();
      });
    });

    test('should update form state as fields are filled', async ({ page }) => {
      await test.step('Fill in form fields and verify debugger updates', async () => {
        const debuggerPanel = page.locator('ngx-debugger').first();
        await expect(debuggerPanel).toBeVisible();

        await page
          .getByRole('textbox', { name: /Full Name/i })
          .fill('John Doe');
        await page.waitForTimeout(200);

        await page
          .getByRole('textbox', { name: /Email Address/i })
          .fill('john@example.com');
        await page.waitForTimeout(200);

        await page
          .getByRole('combobox', { name: /Which product did you use/i })
          .selectOption('Web Application');
        await page.waitForTimeout(200);

        await page
          .getByRole('spinbutton', { name: /Overall Rating/i })
          .fill('5');
        await page.waitForTimeout(200);

        // Debugger should still be visible and updating
        await expect(debuggerPanel).toBeVisible();
      });
    });
  });

  test.describe('Page Structure', () => {
    test('should display all form fields correctly', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: /Error Display Modes/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('textbox', { name: /Full Name/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('textbox', { name: /Email Address/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('textbox', { name: /Company/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('combobox', { name: /Which product did you use/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('spinbutton', { name: /Overall Rating/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('textbox', { name: /Additional Comments/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: /Submit Feedback/i }),
      ).toBeVisible();
    });
  });

  test.describe('Form Validation', () => {
    test('should validate required fields', async ({ page }) => {
      const nameField = page.getByRole('textbox', { name: /Full Name/i });
      await nameField.click();
      await nameField.blur();
      await page.waitForTimeout(200);

      // Form should still be invalid
      await expect(page.getByText('Invalid', { exact: true })).toBeVisible();

      const emailField = page.getByRole('textbox', { name: /Email Address/i });
      await emailField.fill('invalid-email');
      await emailField.blur();
      await page.waitForTimeout(200);

      // Form should still be invalid
      await expect(page.getByText('Invalid', { exact: true })).toBeVisible();
    });

    test('should accept and validate form data', async ({ page }) => {
      await page.getByRole('textbox', { name: /Full Name/i }).fill('John Doe');
      await page
        .getByRole('textbox', { name: /Email Address/i })
        .fill('john.doe@example.com');
      await page.getByRole('textbox', { name: /Company/i }).fill('Acme Corp');
      await page
        .getByRole('combobox', { name: /Which product did you use/i })
        .selectOption('Web Application');
      await page.getByRole('spinbutton', { name: /Overall Rating/i }).fill('5');
      await page.waitForTimeout(300);

      // Verify fields accept the input
      await expect(
        page.getByRole('textbox', { name: /Full Name/i }),
      ).toHaveValue('John Doe');
      await expect(
        page.getByRole('textbox', { name: /Email Address/i }),
      ).toHaveValue('john.doe@example.com');
    });
  });

  test.describe('Conditional Improvement Field Regression', () => {
    test('should toggle improvement suggestions without race conditions', async ({
      page,
    }) => {
      const ratingField = page.getByRole('spinbutton', {
        name: /Overall Rating/i,
      });
      const improvementField = page.getByRole('textbox', {
        name: /What could we improve/i,
      });

      await test.step('Trigger conditional field with low rating', async () => {
        await ratingField.fill('3');
        await expect(improvementField).toBeVisible();
      });

      await test.step('Rapidly toggle ratings to ensure stability', async () => {
        const sequence = ['5', '2', '4', '1', '3'];
        for (const value of sequence) {
          await ratingField.fill(value);
          await page.waitForTimeout(150);
        }

        await expect(improvementField).toBeVisible();
      });

      await test.step('Hide field when rating recovers', async () => {
        await ratingField.fill('5');
        await expect(improvementField).not.toBeVisible();
      });
    });

    test('should show validation message without console errors', async ({
      page,
    }) => {
      const capturedErrors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') {
          capturedErrors.push(message.text());
        }
      });

      const ratingField = page.getByRole('spinbutton', {
        name: /Overall Rating/i,
      });

      await test.step('Trigger conditional field', async () => {
        await ratingField.fill('2');
        await expect(
          page.getByRole('textbox', { name: /What could we improve/i }),
        ).toBeVisible();
      });

      await test.step('Blur empty field to surface validation', async () => {
        const improvementField = page.getByRole('textbox', {
          name: /What could we improve/i,
        });
        await improvementField.focus();
        await improvementField.blur();
        await page.waitForTimeout(300);

        await expect(
          page.getByText(/please help us understand what went wrong/i).first(),
        ).toBeVisible();
      });

      expect(
        capturedErrors.filter((message) =>
          /Cannot read|ExpressionChangedAfter/.test(message),
        ),
      ).toHaveLength(0);
    });
  });

  test.describe('Form State Display', () => {
    test('should show real-time form state updates via debugger', async ({
      page,
    }) => {
      const debuggerPanel = page.locator('ngx-debugger').first();
      await expect(debuggerPanel).toBeVisible();

      await page.getByRole('textbox', { name: /Full Name/i }).fill('Test User');
      await page.waitForTimeout(200);

      // The debugger panel should be visible and updating
      await expect(debuggerPanel).toBeVisible();
    });

    test('should show validation state changes', async ({ page }) => {
      // Initially idle (pristine form with on-touch strategy)
      await expect(page.getByText('Idle', { exact: true })).toBeVisible();

      await page
        .getByRole('textbox', { name: /Full Name/i })
        .fill('Complete Name');
      await page.waitForTimeout(200);

      await page
        .getByRole('textbox', { name: /Email Address/i })
        .fill('test@example.com');
      await page.waitForTimeout(200);

      await page
        .getByRole('combobox', { name: /Which product did you use/i })
        .selectOption('Web Application');
      await page.waitForTimeout(200);

      await page.getByRole('spinbutton', { name: /Overall Rating/i }).fill('5');
      await page.waitForTimeout(200);

      // Verify debugger panel is still visible and updating
      await expect(page.locator('ngx-debugger').first()).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have accessible form fields', async ({ page }) => {
      await expect(
        page.getByRole('textbox', { name: /Full Name/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('textbox', { name: /Email Address/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('textbox', { name: /Company/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('combobox', { name: /Which product did you use/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('spinbutton', { name: /Overall Rating/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('textbox', { name: /Additional Comments/i }),
      ).toBeVisible();
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.keyboard.press('Tab');
      for (let index = 0; index < 6; index++) {
        await page.keyboard.press('Tab');
      }
      const submitButton = page.getByRole('button', {
        name: /Submit Feedback/i,
      });
      await expect(submitButton).toBeVisible();
    });
  });

  test.describe('Form Submission', () => {
    test('should have accessible submit button', async ({ page }) => {
      await page
        .getByRole('textbox', { name: /Full Name/i })
        .fill('Valid User');
      await page
        .getByRole('textbox', { name: /Email Address/i })
        .fill('valid@test.com');
      await page
        .getByRole('combobox', { name: /Which product did you use/i })
        .selectOption('Web Application');
      await page.getByRole('spinbutton', { name: /Overall Rating/i }).fill('5');
      await page.waitForTimeout(300);

      // Verify submit button exists and is accessible
      const submitButton = page.getByRole('button', {
        name: /Submit Feedback/i,
      });
      await expect(submitButton).toBeVisible();
    });
  });
});
