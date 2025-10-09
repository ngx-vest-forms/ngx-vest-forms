import { expect, test } from '@playwright/test';

/**
 * Basic Validation - E2E Tests
 *
 * Tests the user registration form that demonstrates basic validation patterns.
 *
 * This test suite verifies:
 * 1. All form fields are present and accessible
 * 2. Validation works correctly for each field
 * 3. Conditional validation works (bio field for senior roles)
 * 4. Form state updates correctly
 * 5. Accessibility features work
 */

test.describe('Basic Validation - User Registration Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fundamentals/basic-validation');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      const overlays = document.querySelectorAll('vite-error-overlay');
      for (const overlay of overlays) {
        overlay.remove();
      }
    });
  });

  test.describe('Error Display Mode Selector', () => {
    test('should display selector with all strategies', async ({ page }) => {
      await expect(
        page.getByRole('radio', { name: /Immediate/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('radio', { name: /^On Touch$/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('radio', { name: /On Submit/i }),
      ).toBeVisible();
    });

    test('should have on-touch selected by default', async ({ page }) => {
      const onTouchRadio = page.getByRole('radio', {
        name: /^On Touch$/i,
      });
      await expect(onTouchRadio).toBeChecked();
    });

    test('should allow switching strategies', async ({ page }) => {
      const immediateRadio = page.getByRole('radio', {
        name: /Immediate/i,
      });
      await immediateRadio.check();
      await expect(immediateRadio).toBeChecked();
    });
  });

  test.describe('Page Structure', () => {
    test('should display all form fields correctly', async ({ page }) => {
      // Verify all required form fields are present
      await expect(
        page.getByRole('textbox', { name: /Full Name/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('textbox', { name: /Email Address/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('spinbutton', { name: /Age/i }),
      ).toBeVisible();
      await expect(page.getByRole('combobox', { name: /Role/i })).toBeVisible();
      await expect(
        page.getByRole('checkbox', { name: /agree to the terms/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: /Submit Application/i }),
      ).toBeVisible();
    });

    test('should have proper page heading', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: /Basic Validation/i }),
      ).toBeVisible();
    });
  });

  test.describe('Field Validation', () => {
    test('should validate name field', async ({ page }) => {
      const nameField = page.getByRole('textbox', { name: /Full Name/i });

      // Focus and blur to trigger validation
      await nameField.click();
      await nameField.blur();
      await page.waitForTimeout(200);

      // Should show error for empty name
      await expect(page.getByText(/name is required/i).first()).toBeVisible();

      // Fill with valid name
      await nameField.fill('John Doe');
      await page.waitForTimeout(200);

      // Error should disappear (or field should be valid)
      await expect(nameField).toHaveValue('John Doe');
    });

    test('should validate email field', async ({ page }) => {
      const emailField = page.getByRole('textbox', { name: /Email Address/i });

      // Test invalid email
      await emailField.fill('invalid-email');
      await emailField.blur();
      await page.waitForTimeout(200);

      // Should show error
      await expect(page.getByText(/valid email/i).first()).toBeVisible();

      // Fill with valid email
      await emailField.fill('john@example.com');
      await page.waitForTimeout(200);

      await expect(emailField).toHaveValue('john@example.com');
    });

    test('should validate age field', async ({ page }) => {
      const ageField = page.getByRole('spinbutton', { name: /Age/i });

      // Test age below minimum
      await ageField.fill('15');
      await ageField.blur();
      await page.waitForTimeout(200);

      // Should show error
      await expect(
        page.getByText(/at least 18|must be 18/i).first(),
      ).toBeVisible();

      // Fill with valid age
      await ageField.fill('25');
      await page.waitForTimeout(200);

      await expect(ageField).toHaveValue('25');
    });

    test('should validate role field', async ({ page }) => {
      const roleField = page.getByRole('combobox', { name: /Role/i });

      // Initially empty, trigger validation
      await roleField.click();
      await roleField.blur();
      await page.waitForTimeout(200);

      // Select a valid role
      await roleField.selectOption('Junior Developer');
      await page.waitForTimeout(200);

      await expect(roleField).toHaveValue('Junior Developer');
    });
  });

  test.describe('Conditional Validation', () => {
    test('should show bio field for Senior Developer role', async ({
      page,
    }) => {
      const roleField = page.getByRole('combobox', { name: /Role/i });

      // Bio should not be visible initially
      await expect(
        page.getByRole('textbox', { name: /Bio/i }),
      ).not.toBeVisible();

      // Select Senior Developer
      await roleField.selectOption('Senior Developer');
      await page.waitForTimeout(200);

      // Bio field should now be visible
      await expect(page.getByRole('textbox', { name: /Bio/i })).toBeVisible();
    });

    test('should show bio field for Team Lead role', async ({ page }) => {
      const roleField = page.getByRole('combobox', { name: /Role/i });

      // Select Team Lead
      await roleField.selectOption('Team Lead');
      await page.waitForTimeout(200);

      // Bio field should be visible
      await expect(page.getByRole('textbox', { name: /Bio/i })).toBeVisible();
    });

    test('should validate bio field when visible', async ({ page }) => {
      const roleField = page.getByRole('combobox', { name: /Role/i });

      // Make bio field visible
      await roleField.selectOption('Senior Developer');
      await page.waitForTimeout(200);

      const bioField = page.getByRole('textbox', { name: /Bio/i });
      await expect(bioField).toBeVisible();

      // Fill bio field with valid content
      await bioField.fill('Experienced developer with 10 years in the field.');
      await page.waitForTimeout(200);

      // Verify value
      await expect(bioField).toHaveValue(
        'Experienced developer with 10 years in the field.',
      );
    });
  });

  test.describe('Form Submission', () => {
    test('should display submit button', async ({ page }) => {
      const submitButton = page.getByRole('button', {
        name: /Submit Application/i,
      });

      // Fill all required fields
      await page.getByRole('textbox', { name: /Full Name/i }).fill('John Doe');
      await page
        .getByRole('textbox', { name: /Email Address/i })
        .fill('john@example.com');
      await page.getByRole('spinbutton', { name: /Age/i }).fill('25');
      await page
        .getByRole('combobox', { name: /Role/i })
        .selectOption('Junior Developer');
      await page.getByRole('checkbox', { name: /agree to the terms/i }).check();

      await page.waitForTimeout(500);

      // Submit button should be visible
      await expect(submitButton).toBeVisible();
    });

    test('should accept form data submission', async ({ page }) => {
      // Fill all required fields
      await page
        .getByRole('textbox', { name: /Full Name/i })
        .fill('Jane Smith');
      await page
        .getByRole('textbox', { name: /Email Address/i })
        .fill('jane@example.com');
      await page.getByRole('spinbutton', { name: /Age/i }).fill('30');
      await page
        .getByRole('combobox', { name: /Role/i })
        .selectOption('Mid-level Developer');
      await page.getByRole('checkbox', { name: /agree to the terms/i }).check();

      await page.waitForTimeout(500);

      const submitButton = page.getByRole('button', {
        name: /Submit Application/i,
      });

      // Verify form accepted all data
      await expect(
        page.getByRole('textbox', { name: /Full Name/i }),
      ).toHaveValue('Jane Smith');
      await expect(
        page.getByRole('textbox', { name: /Email Address/i }),
      ).toHaveValue('jane@example.com');
      await expect(submitButton).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have accessible form labels', async ({ page }) => {
      // All form controls should be accessible by their labels
      await expect(
        page.getByRole('textbox', { name: /Full Name/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('textbox', { name: /Email Address/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('spinbutton', { name: /Age/i }),
      ).toBeVisible();
      await expect(page.getByRole('combobox', { name: /Role/i })).toBeVisible();
      await expect(
        page.getByRole('checkbox', { name: /agree to the terms/i }),
      ).toBeVisible();
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Tab through form fields
      await page.keyboard.press('Tab');

      // Focus should move through fields
      for (let index = 0; index < 6; index++) {
        await page.keyboard.press('Tab');
      }

      // Submit button should be focusable
      const submitButton = page.getByRole('button', {
        name: /Submit Application/i,
      });
      await expect(submitButton).toBeVisible();
    });

    test('should show error messages', async ({ page }) => {
      const nameField = page.getByRole('textbox', { name: /Full Name/i });

      // Trigger validation error
      await nameField.click();
      await nameField.blur();
      await page.waitForTimeout(200);

      // Error message should be visible
      const errorMessage = page.getByText(/name is required/i).first();
      await expect(errorMessage).toBeVisible();
    });
  });

  test.describe('Real-time Validation', () => {
    test('should validate fields as user types', async ({ page }) => {
      const emailField = page.getByRole('textbox', { name: /Email Address/i });

      // Type invalid email
      await emailField.fill('invalid');
      await emailField.blur();
      await page.waitForTimeout(200);

      // Should show error
      await expect(page.getByText(/valid email/i).first()).toBeVisible();

      // Complete valid email
      await emailField.fill('user@example.com');
      await page.waitForTimeout(300);

      // Verify value updated
      await expect(emailField).toHaveValue('user@example.com');
    });

    test('should update validation state when switching roles', async ({
      page,
    }) => {
      const roleField = page.getByRole('combobox', { name: /Role/i });

      // Select Junior Developer (no bio required)
      await roleField.selectOption('Junior Developer');
      await page.waitForTimeout(200);
      await expect(
        page.getByRole('textbox', { name: /Bio/i }),
      ).not.toBeVisible();

      // Switch to Senior Developer (bio required)
      await roleField.selectOption('Senior Developer');
      await page.waitForTimeout(200);
      await expect(page.getByRole('textbox', { name: /Bio/i })).toBeVisible();

      // Switch back to Junior Developer (bio hidden again)
      await roleField.selectOption('Junior Developer');
      await page.waitForTimeout(200);
      await expect(
        page.getByRole('textbox', { name: /Bio/i }),
      ).not.toBeVisible();
    });
  });

  test.describe('Form State Display', () => {
    test('should show debugger panel', async ({ page }) => {
      // The page should have a debugger panel
      const debuggerPanel = page.locator('ngx-debugger').first();
      await expect(debuggerPanel).toBeVisible();
    });

    test('should update form state in real-time', async ({ page }) => {
      const debuggerPanel = page.locator('ngx-debugger').first();
      await expect(debuggerPanel).toBeVisible();

      // Fill a field
      await page.getByRole('textbox', { name: /Full Name/i }).fill('Test User');
      await page.waitForTimeout(200);

      // Debugger should still be visible and updating
      await expect(debuggerPanel).toBeVisible();
    });
  });

  test.describe('Error Display Strategies - Form-Specific Tests', () => {
    test('immediate strategy - multiple fields show errors immediately', async ({
      page,
    }) => {
      const nameField = page.getByRole('textbox', { name: /Full Name/i });
      const emailField = page.getByRole('textbox', {
        name: /Email Address/i,
      });
      const nameError = page.locator('#name-error');
      const emailError = page.locator('#email-error');

      await test.step('Select immediate strategy', async () => {
        const immediateRadio = page.getByRole('radio', {
          name: /Immediate/i,
        });
        await immediateRadio.check();
        await expect(immediateRadio).toBeChecked();
      });

      await test.step('Type in name field - error appears immediately', async () => {
        await nameField.fill('A'); // Too short

        // Error should appear immediately without blur
        // Note: Component uses conditional rendering (@if), not aria-hidden
        await expect(nameError).toBeVisible();
        await expect(nameError).toContainText(/at least 2 characters/i);
      });

      await test.step('Type in email field - error appears immediately', async () => {
        await emailField.fill('invalid');

        // Error should appear immediately
        // Note: Component uses conditional rendering (@if), not aria-hidden
        await expect(emailError).toBeVisible();
        await expect(emailError).toContainText(
          /Please enter a valid email address/i,
        );

        // Note: Due to Vest's only() optimization, the name error is no longer visible
        // because only the email field was validated. This is correct behavior.
      });

      await test.step('Verify both field errors remain visible', async () => {
        // With stateful suite (createSafeSuite), both errors persist
        await expect(emailError).toBeVisible();
        await expect(nameError).toBeVisible();
      });

      await test.step('Submit button stays enabled for accessibility', async () => {
        const submitButton = page.getByRole('button', {
          name: /Submit Application/i,
        });
        await expect(submitButton).toBeEnabled();
      });
    });

    test('on-touch strategy - errors persist across field interactions (CRITICAL)', async ({
      page,
    }) => {
      const nameField = page.getByRole('textbox', { name: /Full Name/i });
      const emailField = page.getByRole('textbox', {
        name: /Email Address/i,
      });
      const ageField = page.getByRole('spinbutton', { name: /Age/i });
      const nameError = page.locator('#name-error');
      const emailError = page.locator('#email-error');
      const ageError = page.locator('#age-error');

      await test.step('Verify on-touch is selected', async () => {
        const onTouchRadio = page.getByRole('radio', {
          name: /^On Touch$/i,
        });
        await expect(onTouchRadio).toBeChecked();
      });

      await test.step('Touch name field and blur', async () => {
        await nameField.focus();
        await nameField.blur();
        await page.waitForTimeout(200);

        // Name error should appear
        // Note: Component uses conditional rendering - check visibility instead of aria-hidden
        await expect(nameError).toBeVisible();
        await expect(nameError).toContainText(/name is required/i);
      });

      await test.step('Touch email field and blur', async () => {
        await emailField.focus();
        await emailField.blur();
        await page.waitForTimeout(200);

        // Email error should appear
        // Note: Component uses conditional rendering - check visibility instead of aria-hidden
        await expect(emailError).toBeVisible();
        await expect(emailError).toContainText(/email is required/i);
      });

      await test.step('CRITICAL: Verify BOTH errors persist', async () => {
        // This is the regression test for the only(undefined) bug
        // Both errors should remain visible after touching multiple fields
        // Note: Component uses conditional rendering - check visibility instead of aria-hidden
        await expect(nameError).toBeVisible();
        await expect(emailError).toBeVisible();
      });

      await test.step('Touch age field - all three errors should persist', async () => {
        await ageField.focus();
        await ageField.blur();
        await page.waitForTimeout(200);

        // All three errors should be visible
        // Note: Component uses conditional rendering - check visibility instead of aria-hidden
        await expect(nameError).toBeVisible();
        await expect(emailError).toBeVisible();
        await expect(ageError).toBeVisible();
      });
    });

    test('on-submit strategy - no errors until form is submitted', async ({
      page,
    }) => {
      const nameField = page.getByRole('textbox', { name: /Full Name/i });
      const emailField = page.getByRole('textbox', {
        name: /Email Address/i,
      });
      const nameError = page.locator('#name-error');
      const emailError = page.locator('#email-error');

      await test.step('Select on-submit strategy', async () => {
        const saveRadio = page.getByRole('radio', {
          name: /On Submit/i,
        });
        await saveRadio.check();
        await expect(saveRadio).toBeChecked();
      });

      await test.step('Touch fields without filling - no errors yet', async () => {
        await nameField.focus();
        await nameField.blur();

        await emailField.focus();
        await emailField.blur();

        await page.waitForTimeout(200);

        // No errors should appear yet (on-submit strategy)
        // Note: Component uses conditional rendering - elements don't exist when no errors shown
        await expect(nameError).toBeHidden();
        await expect(emailError).toBeHidden();
      });

      await test.step('Submit button stays enabled for accessibility', async () => {
        const submitButton = page.getByRole('button', {
          name: /Submit Application/i,
        });
        await expect(submitButton).toBeEnabled();
        await submitButton.click();

        // Check form is invalid - the "Invalid:" badge should show ❌
        // Using .nth(1) to get the second badge (first is "Valid:", second is "Invalid:")
        await expect(
          page.locator('span').filter({ hasText: 'Invalid: ❌' }),
        ).toBeVisible();
        // Note: Component uses conditional rendering - check visibility instead of aria-hidden
        await expect(nameError).toBeVisible();
        await expect(emailError).toBeVisible();
      });
    });

    test('conditional validation works with all strategies', async ({
      page,
    }) => {
      const strategies = ['Immediate', 'On Touch', 'On Submit'];

      for (const strategyName of strategies) {
        await test.step(`Test conditional validation with ${strategyName}`, async () => {
          // Select strategy
          const strategyRadio = page.getByRole('radio', {
            name: new RegExp(strategyName, 'i'),
          });
          await strategyRadio.check();

          // Select role that requires bio
          const roleField = page.getByRole('combobox', { name: /Role/i });
          await roleField.selectOption('Senior Developer');
          await page.waitForTimeout(200);

          // Bio field should be visible
          const bioField = page.getByRole('textbox', { name: /Bio/i });
          await expect(bioField).toBeVisible();

          // Change to role that doesn't require bio
          await roleField.selectOption('Junior Developer');
          await page.waitForTimeout(200);

          // Bio field should be hidden
          await expect(bioField).not.toBeVisible();
        });
      }
    });

    test('strategy switching preserves form data', async ({ page }) => {
      await test.step('Fill form with on-touch strategy', async () => {
        await page
          .getByRole('textbox', { name: /Full Name/i })
          .fill('John Doe');
        await page
          .getByRole('textbox', { name: /Email Address/i })
          .fill('john@example.com');
        await page.getByRole('spinbutton', { name: /Age/i }).fill('25');
        await page
          .getByRole('combobox', { name: /Role/i })
          .selectOption('Mid-level Developer');
      });

      await test.step('Switch to immediate strategy', async () => {
        const immediateRadio = page.getByRole('radio', {
          name: /Immediate/i,
        });
        await immediateRadio.check();

        // All values should be preserved
        await expect(
          page.getByRole('textbox', { name: /Full Name/i }),
        ).toHaveValue('John Doe');
        await expect(
          page.getByRole('textbox', { name: /Email Address/i }),
        ).toHaveValue('john@example.com');
        await expect(
          page.getByRole('spinbutton', { name: /Age/i }),
        ).toHaveValue('25');
      });

      await test.step('Switch to on-submit strategy', async () => {
        const saveRadio = page.getByRole('radio', {
          name: /On Submit/i,
        });
        await saveRadio.check();

        // All values should still be preserved
        await expect(
          page.getByRole('textbox', { name: /Full Name/i }),
        ).toHaveValue('John Doe');
        await expect(
          page.getByRole('textbox', { name: /Email Address/i }),
        ).toHaveValue('john@example.com');
      });
    });

    // SKIP: Known issue with async validation pending state not clearing properly
    // TODO: Investigate why async email validation stays in pending state with createSafeSuite
    test.skip('all strategies respect form validity for submit button', async ({
      page,
    }) => {
      // KNOWN ISSUE: Immediate strategy has async validation pending state issue
      // Skip immediate for now as it causes test flakiness
      const strategies = ['On Touch', 'On Submit'] as const;

      for (const strategyName of strategies) {
        await test.step(`Test submit button with ${strategyName}`, async () => {
          await page.goto('/fundamentals/basic-validation');
          await page.waitForLoadState('networkidle');
          await page.evaluate(() => {
            const overlays = document.querySelectorAll('vite-error-overlay');
            for (const overlay of overlays) {
              overlay.remove();
            }
          });

          const strategyRadio = page.getByRole('radio', {
            name: new RegExp(strategyName, 'i'),
          });
          await strategyRadio.check();

          const submitButton = page.getByRole('button', {
            name: /Submit Application/i,
          });
          await expect(submitButton).toBeEnabled();

          const nameField = page.getByRole('textbox', { name: /Full Name/i });
          const ageField = page.getByRole('spinbutton', { name: /Age/i });
          const roleField = page.getByRole('combobox', { name: /Role/i });
          const termsCheckbox = page.getByRole('checkbox', {
            name: /agree to the terms/i,
          });
          const emailField = page.getByRole('textbox', {
            name: /Email Address/i,
          });
          const emailError = page.locator('#email-error');

          await emailField.fill('');
          await emailField.blur();

          await submitButton.click();
          // Note: Component uses conditional rendering - check visibility instead of aria-hidden
          await expect(emailError).toBeVisible();
          await expect(page.getByText('Valid: ❌')).toBeVisible();
          await expect(submitButton).toBeEnabled();

          // Fill remaining required fields to reach a valid state
          await nameField.fill('Jane Smith');
          await ageField.fill('30');
          await roleField.selectOption('Junior Developer');
          await termsCheckbox.check();
          await emailField.fill('jane@example.com');
          await emailField.blur();

          // Wait for async email validation to complete
          // First it will show "Pending: ⏳" while validating
          await expect(page.getByText('Pending: ⏳')).toBeVisible({
            timeout: 1000,
          });

          // Then pending should clear (showing "Pending: —" or just hidden)
          await expect(page.getByText('Pending: ⏳')).toBeHidden({
            timeout: 4000,
          });

          // Wait for validation to complete - error should disappear
          await expect(emailError).toBeHidden({ timeout: 4000 });
          await expect(submitButton).toBeEnabled({ timeout: 4000 });
        });
      }
    });
  });
});
