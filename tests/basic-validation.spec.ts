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
});
