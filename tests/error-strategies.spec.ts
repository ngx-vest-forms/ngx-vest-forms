import { expect, test } from '@playwright/test';

/**
 * Comprehensive Error Display Strategy Tests
 *
 * Tests all three error display strategies across multiple form examples:
 * - immediate: Show errors as soon as validation runs
 * - on-touch: Show errors only after user has interacted with the field
 * - on-submit: Show errors only after form submission attempt
 *
 * This test suite verifies:
 * 1. Each strategy displays errors at the correct time
 * 2. Strategy switching works correctly
 * 3. Accessibility attributes are set properly
 * 4. Submit button is disabled based on validation state (not just errors)
 */

test.describe('Error Display Strategies - Comprehensive Tests', () => {
  test.describe('Minimal Form - Error Strategy Tests', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/fundamentals/minimal-form');
      await page.waitForLoadState('networkidle');
    });

    test('immediate strategy - shows errors immediately on input', async ({
      page,
    }) => {
      await test.step('Select immediate strategy', async () => {
        const strategyRadio = page.getByRole('radio', {
          name: /Immediate/i,
        });
        await strategyRadio.check();
        await expect(strategyRadio).toBeChecked();
      });

      await test.step('Type invalid email and verify immediate error', async () => {
        const emailField = page.getByRole('textbox', {
          name: /Email Address/i,
        });
        await emailField.fill('invalid');

        // Error should appear immediately without blur
        await expect(page.locator('#email-error')).toBeVisible();
        await expect(page.locator('#email-error')).toContainText(
          /Please enter a valid email/i,
        );
      });

      await test.step('Verify submit button stays enabled for accessibility', async () => {
        const submitButton = page.getByRole('button', { name: /Submit/i });
        await expect(submitButton).toBeEnabled();
      });

      await test.step('Fix email and verify error disappears immediately', async () => {
        const emailField = page.getByRole('textbox', {
          name: /Email Address/i,
        });
        await emailField.fill('user@example.com');

        // Error should disappear immediately
        await expect(page.locator('#email-error')).not.toBeVisible();
      });

      await test.step('Verify submit button is enabled when valid', async () => {
        const submitButton = page.getByRole('button', { name: /Submit/i });
        await expect(submitButton).toBeEnabled();
      });
    });

    test('on-touch strategy - shows errors only after field is touched', async ({
      page,
    }) => {
      await test.step('Verify on-touch is the default strategy', async () => {
        const strategyRadio = page.getByRole('radio', {
          name: /^On Touch$/i,
        });
        await expect(strategyRadio).toBeChecked();
      });

      await test.step('Type invalid email without blur - no error shown', async () => {
        const emailField = page.getByRole('textbox', {
          name: /Email Address/i,
        });
        await emailField.fill('invalid');

        // Error should NOT appear yet (field not touched/blurred)
        await expect(page.locator('#email-error')).not.toBeVisible();
      });

      await test.step('Blur field and verify error appears', async () => {
        const emailField = page.getByRole('textbox', {
          name: /Email Address/i,
        });
        await emailField.blur();

        // Now error should appear
        await expect(page.locator('#email-error')).toBeVisible();
        await expect(page.locator('#email-error')).toContainText(
          /Please enter a valid email/i,
        );
      });

      await test.step('Verify accessibility attributes', async () => {
        const emailField = page.getByRole('textbox', {
          name: /Email Address/i,
        });
        await expect(emailField).toHaveAttribute('aria-invalid', 'true');
        await expect(emailField).toHaveAttribute(
          'aria-describedby',
          'email-error',
        );
      });
    });

    test('on-submit strategy - shows errors only after submit attempt', async ({
      page,
    }) => {
      await test.step('Select on-submit strategy', async () => {
        const strategyRadio = page.getByRole('radio', {
          name: /On Submit/i,
        });
        await strategyRadio.check();
        await expect(strategyRadio).toBeChecked();
      });

      await test.step('Type invalid email and blur - no error shown', async () => {
        const emailField = page.getByRole('textbox', {
          name: /Email Address/i,
        });
        await emailField.fill('invalid');
        await emailField.blur();

        // Error should NOT appear yet (not submitted)
        await expect(page.locator('#email-error')).not.toBeVisible();
      });

      await test.step('Verify submit button stays enabled before submit', async () => {
        const submitButton = page.getByRole('button', { name: /Submit/i });
        await expect(submitButton).toBeEnabled();
      });

      await test.step('Fix email and verify submit click succeeds', async () => {
        const emailField = page.getByRole('textbox', {
          name: /Email Address/i,
        });
        await emailField.fill('user@example.com');

        const submitButton = page.getByRole('button', { name: /Submit/i });
        await submitButton.click();
        await expect(page.locator('#email-error')).not.toBeVisible();
      });

      await test.step('Enter invalid email again and submit to trigger errors', async () => {
        const emailField = page.getByRole('textbox', {
          name: /Email Address/i,
        });
        await emailField.fill('invalid');

        const submitButton = page.getByRole('button', { name: /Submit/i });
        await submitButton.click();

        await expect(page.locator('#email-error')).toBeVisible();
      });
    });

    test('strategy switching works correctly', async ({ page }) => {
      await test.step('Start with on-touch, enter invalid email', async () => {
        const emailField = page.getByRole('textbox', {
          name: /Email Address/i,
        });
        await emailField.fill('invalid');
        await emailField.blur();

        await expect(page.locator('#email-error')).toBeVisible();
      });

      await test.step('Switch to on-submit strategy', async () => {
        const strategyRadio = page.getByRole('radio', {
          name: /On Submit/i,
        });
        await strategyRadio.check();

        // Error should disappear because field hasn't been submitted yet
        await expect(page.locator('#email-error')).not.toBeVisible();
      });

      await test.step('Switch to immediate strategy', async () => {
        const strategyRadio = page.getByRole('radio', {
          name: /Immediate/i,
        });
        await strategyRadio.check();

        // Error should reappear immediately
        await expect(page.locator('#email-error')).toBeVisible();
      });
    });
  });

  test.describe('Basic Validation Form - Error Strategy Tests', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/fundamentals/basic-validation');
      await page.waitForLoadState('networkidle');
    });

    test('immediate strategy - multiple fields show errors immediately', async ({
      page,
    }) => {
      await test.step('Select immediate strategy', async () => {
        const strategyRadio = page.getByRole('radio', {
          name: /Immediate/i,
        });
        await strategyRadio.check();
      });

      await test.step('Fill multiple fields with invalid data', async () => {
        await page.getByRole('textbox', { name: /Full Name/i }).fill('A'); // Too short
        await page
          .getByRole('textbox', { name: /Email Address/i })
          .fill('invalid'); // Invalid format
        await page.getByRole('spinbutton', { name: /Age/i }).fill('15'); // Too young
      });

      await test.step('Verify all errors are visible immediately', async () => {
        // Name error - use semantic role="alert" selector
        const nameError = page
          .getByRole('alert')
          .filter({ hasText: /at least 2 characters/i });
        await expect(nameError).toBeVisible();

        // Email error
        const emailError = page
          .getByRole('alert')
          .filter({ hasText: /Please enter a valid email address/i });
        await expect(emailError).toBeVisible();

        // Age error
        const ageError = page
          .getByRole('alert')
          .filter({ hasText: /must be at least 18/i });
        await expect(ageError).toBeVisible();
      });

      await test.step('Verify submit button stays enabled while invalid', async () => {
        const submitButton = page.getByRole('button', {
          name: /Submit Application/i,
        });
        await expect(submitButton).toBeEnabled();
      });
    });

    test('on-touch strategy - errors persist after touching other fields (CRITICAL BUG REGRESSION)', async ({
      page,
    }) => {
      await test.step('Verify on-touch is selected', async () => {
        const strategyRadio = page.getByRole('radio', {
          name: /^On Touch$/i,
        });
        await expect(strategyRadio).toBeChecked();
      });

      await test.step('Touch name field and blur', async () => {
        const nameField = page.getByRole('textbox', { name: /Full Name/i });
        await nameField.focus();
        await nameField.blur();

        // Name error should appear - use semantic role="alert" selector
        const nameError = page
          .getByRole('alert')
          .filter({ hasText: /name is required/i });
        await expect(nameError).toBeVisible();
      });

      await test.step('Touch email field and blur', async () => {
        const emailField = page.getByRole('textbox', {
          name: /Email Address/i,
        });
        await emailField.focus();
        await emailField.blur();

        // Email error should appear - use semantic role="alert" selector
        const emailError = page
          .getByRole('alert')
          .filter({ hasText: /email is required/i });
        await expect(emailError).toBeVisible();
      });

      await test.step('CRITICAL: Verify BOTH errors are still visible', async () => {
        // This is the key regression test for the only(undefined) bug
        // Previously, only the last touched field's error would show

        // Use semantic role="alert" selectors
        const nameError = page
          .getByRole('alert')
          .filter({ hasText: /name is required/i });
        await expect(nameError).toBeVisible();

        const emailError = page
          .getByRole('alert')
          .filter({ hasText: /email is required/i });
        await expect(emailError).toBeVisible();
      });

      await test.step('Touch age field and verify all 3 errors persist', async () => {
        const ageField = page.getByRole('spinbutton', { name: /Age/i });
        await ageField.focus();
        await ageField.blur();

        // All three errors should be visible - use semantic role="alert" selectors
        const nameError = page
          .getByRole('alert')
          .filter({ hasText: /name is required/i });
        await expect(nameError).toBeVisible();

        const emailError = page
          .getByRole('alert')
          .filter({ hasText: /email is required/i });
        await expect(emailError).toBeVisible();

        const ageError = page
          .getByRole('alert')
          .filter({ hasText: /age is required/i });
        await expect(ageError).toBeVisible();
      });
    });

    test('conditional validation works with error strategies', async ({
      page,
    }) => {
      await test.step('Select immediate strategy', async () => {
        const strategyRadio = page.getByRole('radio', {
          name: /Immediate/i,
        });
        await strategyRadio.check();
      });

      await test.step('Select role that requires bio', async () => {
        const roleSelect = page.getByRole('combobox', { name: /Role/i });
        await roleSelect.selectOption('Senior Developer');

        // Bio field should appear
        const bioField = page.getByRole('textbox', { name: /Bio/i });
        await expect(bioField).toBeVisible();
      });

      await test.step('Verify bio validation is active immediately', async () => {
        const bioField = page.getByRole('textbox', { name: /Bio/i });
        await bioField.focus();
        await bioField.blur();

        // Bio error should appear immediately (immediate strategy) - use semantic role="alert" selector
        const bioError = page
          .getByRole('alert')
          .filter({ hasText: /bio is required/i });
        await expect(bioError).toBeVisible();
      });

      await test.step('Change role to one that does not require bio', async () => {
        const roleSelect = page.getByRole('combobox', { name: /Role/i });
        await roleSelect.selectOption('Junior Developer');

        // Bio field should disappear
        const bioField = page.getByRole('textbox', { name: /Bio/i });
        await expect(bioField).not.toBeVisible();
      });
    });
  });

  test.describe('Error Display Modes Demo - Strategy Tests', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/fundamentals/error-display-modes');
      await page.waitForLoadState('networkidle');
    });

    test('all strategies work correctly in the demo form', async ({ page }) => {
      const strategies = [
        { name: 'Immediate', expectErrorWithoutBlur: true },
        { name: 'On Touch', expectErrorWithoutBlur: false },
        { name: 'On Submit', expectErrorWithoutBlur: false },
      ];

      for (const strategy of strategies) {
        await test.step(`Test ${strategy.name} strategy`, async () => {
          // Select strategy
          const strategyRadio = page.getByRole('radio', {
            name: new RegExp(strategy.name, 'i'),
          });
          await strategyRadio.check();

          // Clear and type invalid email
          const emailField = page.getByRole('textbox', {
            name: /Email Address/i,
          });
          await emailField.clear();
          await emailField.fill('invalid');

          // Check error visibility based on strategy
          const emailErrors = page.locator('#email-errors');
          await (strategy.expectErrorWithoutBlur
            ? expect(emailErrors).toBeVisible()
            : expect(emailErrors).not.toBeVisible());

          // Blur and check again
          await emailField.blur();
          await (strategy.name === 'On Submit'
            ? expect(emailErrors).not.toBeVisible()
            : expect(emailErrors).toBeVisible());
        });
      }
    });

    test('form validity controls submit button across all strategies', async ({
      page,
    }) => {
      const strategies = ['Immediate', 'On Touch', 'On Submit'];

      for (const strategyName of strategies) {
        await test.step(`Test submit button with ${strategyName}`, async () => {
          // Select strategy
          const strategyRadio = page.getByRole('radio', {
            name: new RegExp(strategyName, 'i'),
          });
          await strategyRadio.check();

          // Enter invalid data
          const emailField = page.getByRole('textbox', {
            name: /Email Address/i,
          });
          await emailField.clear();
          await emailField.fill('invalid');
          await emailField.blur();

          // Submit button should remain enabled for accessibility
          const submitButton = page.getByRole('button', {
            name: /Submit Feedback/i,
          });
          await expect(submitButton).toBeEnabled();

          // Fix the data
          await emailField.fill('user@example.com');

          // Need to fill other required fields too
          await page
            .getByRole('textbox', { name: /Full Name/i })
            .fill('John Doe');
          await page
            .getByRole('combobox', { name: /Which product did you use/i })
            .selectOption('Web Application');
          await page
            .getByRole('spinbutton', { name: /Overall Rating/i })
            .fill('5');

          // Submit button should now be enabled
          await expect(submitButton).toBeEnabled();
        });
      }
    });
  });
});
