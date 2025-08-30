import { expect, test } from '@playwright/test';

test.describe('Basic Validation - Comprehensive Form Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fundamentals/basic-validation');
    await page.waitForLoadState('networkidle');
  });

  test('should display the basic validation form with all required fields', async ({
    page,
  }) => {
    await test.step('Verify form structure and labels', async () => {
      // Check form heading
      await expect(
        page.getByRole('heading', { name: /Basic Validation/i }),
      ).toBeVisible();

      // Verify core form fields are present with correct accessible names
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

      // Submit button should be present and disabled initially
      const submitButton = page.getByRole('button', {
        name: /Submit Application/i,
      });
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toBeDisabled();
    });
  });

  test('should validate required fields and show errors on blur', async ({
    page,
  }) => {
    await test.step('Test name field validation', async () => {
      const nameField = page.getByRole('textbox', { name: /Full Name/i });
      await nameField.click();
      await nameField.press('Tab');

      // Wait for validation and look for error message
      await expect(page.getByText('Name is required')).toBeVisible({
        timeout: 2000,
      });
    });

    await test.step('Test email field validation', async () => {
      const emailField = page.getByRole('textbox', { name: /Email Address/i });
      await emailField.click();
      await emailField.press('Tab');

      await expect(page.getByText('Email is required')).toBeVisible({
        timeout: 2000,
      });
    });

    await test.step('Test age field validation', async () => {
      const ageField = page.getByRole('spinbutton', { name: /Age/i });
      await ageField.click();
      // Clear the default 0 value and leave empty
      await ageField.fill('');
      await ageField.press('Tab');

      await expect(page.getByText('Age is required')).toBeVisible({
        timeout: 2000,
      });
    });

    await test.step('Test terms checkbox validation', async () => {
      const termsField = page.getByRole('checkbox', {
        name: /agree to the terms/i,
      });
      await termsField.click(); // Check it
      await termsField.click(); // Uncheck it to trigger validation
      await termsField.press('Tab');

      await expect(
        page.getByText('You must agree to the terms and conditions'),
      ).toBeVisible({ timeout: 2000 });
    });
  });

  test('should validate field formats and constraints', async ({ page }) => {
    await test.step('Test invalid email format', async () => {
      const emailField = page.getByRole('textbox', { name: /Email Address/i });
      await emailField.fill('invalid-email');
      await emailField.press('Tab');

      await expect(
        page.getByText('Please enter a valid email address'),
      ).toBeVisible({ timeout: 2000 });
    });

    await test.step('Test age constraints', async () => {
      const ageField = page.getByRole('spinbutton', { name: /Age/i });

      // Test minimum age
      await ageField.fill('15');
      await ageField.press('Tab');
      await expect(
        page.getByText('You must be at least 18 years old'),
      ).toBeVisible({ timeout: 2000 });

      // Test maximum age
      await ageField.fill('125');
      await ageField.press('Tab');
      await expect(page.getByText('Age must be 120 or less')).toBeVisible({
        timeout: 2000,
      });
    });

    await test.step('Test name length constraints', async () => {
      const nameField = page.getByRole('textbox', { name: /Full Name/i });
      await nameField.fill('A');
      await nameField.press('Tab');

      await expect(
        page.getByText('Name must be at least 2 characters'),
      ).toBeVisible({ timeout: 2000 });
    });
  });

  test('should handle conditional validation for senior roles', async ({
    page,
  }) => {
    await test.step('Select senior role and trigger bio validation', async () => {
      // Fill required fields first
      await page.getByRole('textbox', { name: /Full Name/i }).fill('John Doe');
      await page
        .getByRole('textbox', { name: /Email Address/i })
        .fill('john@example.com');
      await page.getByRole('spinbutton', { name: /Age/i }).fill('35');

      // Select a senior role to trigger bio field appearance
      await page
        .getByRole('combobox', { name: /Role/i })
        .selectOption('Senior Developer');

      // Wait for bio field to appear
      await expect(
        page.getByRole('textbox', { name: /Professional Bio/i }),
      ).toBeVisible({
        timeout: 2000,
      });

      // Bio should now be required - test by leaving it empty and blurring
      const bioField = page.getByRole('textbox', { name: /Professional Bio/i });
      await bioField.click();
      await bioField.press('Tab');

      await expect(
        page.getByText('Bio is required for senior positions'),
      ).toBeVisible({ timeout: 2000 });
    });

    await test.step('Test bio length for senior roles', async () => {
      // Bio should have minimum length for senior roles
      const bioField = page.getByRole('textbox', { name: /Professional Bio/i });
      await bioField.fill('Short');
      await bioField.press('Tab');

      await expect(
        page.getByText(
          'Bio must be at least 50 characters for senior positions',
        ),
      ).toBeVisible({ timeout: 2000 });
    });

    await test.step('Test junior role does not require bio', async () => {
      // Change to junior role
      await page
        .getByRole('combobox', { name: /Role/i })
        .selectOption('Junior Developer');

      // Bio field should disappear
      await expect(
        page.getByRole('textbox', { name: /Professional Bio/i }),
      ).not.toBeVisible({
        timeout: 2000,
      });
    });
  });

  test('should enable/disable submit button based on form validity', async ({
    page,
  }) => {
    await test.step('Submit button should be disabled initially', async () => {
      const submitButton = page.getByRole('button', {
        name: /Submit Application/i,
      });
      await expect(submitButton).toBeDisabled();
    });

    await test.step('Submit button should remain disabled with invalid data', async () => {
      await page.getByRole('textbox', { name: /Full Name/i }).fill('A'); // Too short
      await page
        .getByRole('textbox', { name: /Email Address/i })
        .fill('invalid'); // Invalid format
      await page.getByRole('spinbutton', { name: /Age/i }).fill('15'); // Too young

      // Wait for validation
      await page.waitForTimeout(500);

      const submitButton = page.getByRole('button', {
        name: /Submit Application/i,
      });
      await expect(submitButton).toBeDisabled();
    });

    await test.step('Submit button should be enabled with valid data', async () => {
      // Fill all required fields with valid data
      await page.getByRole('textbox', { name: /Full Name/i }).fill('John Doe');
      await page
        .getByRole('textbox', { name: /Email Address/i })
        .fill('john@example.com');
      await page.getByRole('spinbutton', { name: /Age/i }).fill('30');
      await page
        .getByRole('combobox', { name: /Role/i })
        .selectOption('Junior Developer');
      await page.getByRole('checkbox', { name: /agree to the terms/i }).check();

      // Wait for validation to complete
      await page.waitForTimeout(1000);

      const submitButton = page.getByRole('button', {
        name: /Submit Application/i,
      });
      await expect(submitButton).toBeEnabled({ timeout: 3000 });
    });
  });

  test('should successfully submit valid form', async ({ page }) => {
    await test.step('Fill out complete valid form', async () => {
      await page.getByRole('textbox', { name: /Full Name/i }).fill('John Doe');
      await page
        .getByRole('textbox', { name: /Email Address/i })
        .fill('john@example.com');
      await page.getByRole('spinbutton', { name: /Age/i }).fill('30');
      await page
        .getByRole('combobox', { name: /Role/i })
        .selectOption('Junior Developer');
      await page.getByRole('checkbox', { name: /agree to the terms/i }).check();

      // Wait for form to become valid
      await page.waitForTimeout(1000);
    });

    await test.step('Submit form and verify success', async () => {
      const submitButton = page.getByRole('button', {
        name: /Submit Application/i,
      });
      await expect(submitButton).toBeEnabled();

      await submitButton.click();

      // Look for success message
      await expect(page.getByText('Success!')).toBeVisible({ timeout: 3000 });
      await expect(
        page.getByText('Your application has been submitted successfully'),
      ).toBeVisible();
    });
  });

  test('should handle rapid field interactions without race conditions', async ({
    page,
  }) => {
    await test.step('Rapidly interact with multiple fields', async () => {
      const nameField = page.getByRole('textbox', { name: /Full Name/i });
      const emailField = page.getByRole('textbox', { name: /Email Address/i });

      // Rapidly switch between fields
      await nameField.click();
      await nameField.fill('J');
      await emailField.click();
      await emailField.fill('test');
      await nameField.click();
      await nameField.fill('John');
      await emailField.click();
      await emailField.fill('test@example.com');

      // Verify final state is consistent
      await expect(nameField).toHaveValue('John');
      await expect(emailField).toHaveValue('test@example.com');
    });
  });

  test('should maintain accessibility features', async ({ page }) => {
    await test.step('Verify ARIA attributes are set correctly', async () => {
      // Trigger validation errors
      const nameField = page.getByRole('textbox', { name: /Full Name/i });
      await nameField.click();
      await nameField.press('Tab');

      // Wait for error to appear
      await expect(page.getByText('Name is required')).toBeVisible();

      // Field should have aria-invalid when in error state
      await expect(nameField).toHaveAttribute('aria-invalid', 'true');

      // Error should have proper role for screen readers
      await expect(page.locator('[role="alert"]').first()).toBeVisible();
    });

    await test.step('Verify keyboard navigation works', async () => {
      // Form should be fully keyboard accessible
      await page.keyboard.press('Tab'); // Should focus name field
      await page.keyboard.press('Tab'); // Should focus email field
      await page.keyboard.press('Tab'); // Should focus age field

      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });
  });
});
