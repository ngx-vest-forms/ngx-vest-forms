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
        page.locator('h1, h2').filter({ hasText: 'Basic Validation' }),
      ).toBeVisible();

      // Verify core form fields are present
      await expect(page.locator('input[name="name"]')).toBeVisible();
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="age"]')).toBeVisible();
      await expect(page.locator('select[name="role"]')).toBeVisible();
      await expect(page.locator('input[name="agreeToTerms"]')).toBeVisible();

      // Bio field is conditional - only appears for senior roles
      // We'll test this separately

      // Verify labels are properly associated
      await expect(page.locator('label[for="name"]')).toContainText(
        'Full Name',
      );
      await expect(page.locator('label[for="email"]')).toContainText('Email');
      await expect(page.locator('label[for="age"]')).toContainText('Age');
      await expect(page.locator('label[for="role"]')).toContainText('Role');
      await expect(page.locator('label[for="agreeToTerms"]')).toContainText(
        'Terms',
      );

      // Submit button should be present
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });
  });

  test('should validate required fields and show errors on blur', async ({
    page,
  }) => {
    await test.step('Test name field validation', async () => {
      const nameField = page.locator('input[name="name"]');
      await nameField.click();
      await nameField.press('Tab');

      // Use more specific selector to avoid strict mode violations
      await expect(
        page
          .locator('div[role="alert"]')
          .filter({ hasText: 'Name is required' }),
      ).toBeVisible({ timeout: 2000 });
    });

    await test.step('Test email field validation', async () => {
      const emailField = page.locator('input[name="email"]');
      await emailField.click();
      await emailField.press('Tab');

      await expect(
        page
          .locator('div[role="alert"]')
          .filter({ hasText: 'Email is required' }),
      ).toBeVisible({ timeout: 2000 });
    });

    await test.step('Test age field validation', async () => {
      const ageField = page.locator('input[name="age"]');
      await ageField.click();
      await ageField.press('Tab');

      await expect(
        page
          .locator('div[role="alert"]')
          .filter({ hasText: 'Age is required' }),
      ).toBeVisible({ timeout: 2000 });
    });

    await test.step('Test terms checkbox validation', async () => {
      const termsField = page.locator('input[name="agreeToTerms"]');
      await termsField.click();
      await termsField.press('Tab');

      await expect(
        page
          .locator('div[role="alert"]')
          .filter({ hasText: 'You must agree to the terms' }),
      ).toBeVisible({ timeout: 2000 });
    });
  });

  test('should validate field formats and constraints', async ({ page }) => {
    await test.step('Test invalid email format', async () => {
      const emailField = page.locator('input[name="email"]');
      await emailField.fill('invalid-email');
      await emailField.press('Tab');

      await expect(
        page
          .locator('div[role="alert"]')
          .filter({ hasText: 'Please enter a valid email address' }),
      ).toBeVisible({ timeout: 2000 });
    });

    await test.step('Test age constraints', async () => {
      const ageField = page.locator('input[name="age"]');

      // Test minimum age
      await ageField.fill('15');
      await ageField.press('Tab');
      await expect(
        page
          .locator('div[role="alert"]')
          .filter({ hasText: 'You must be at least 18 years old' }),
      ).toBeVisible({ timeout: 2000 });

      // Test maximum age
      await ageField.fill('125');
      await ageField.press('Tab');
      await expect(
        page
          .locator('div[role="alert"]')
          .filter({ hasText: 'Age must be 120 or less' }),
      ).toBeVisible({ timeout: 2000 });
    });

    await test.step('Test name length constraints', async () => {
      const nameField = page.locator('input[name="name"]');
      await nameField.fill('A');
      await nameField.press('Tab');

      await expect(
        page
          .locator('div[role="alert"]')
          .filter({ hasText: 'Name must be at least 2 characters' }),
      ).toBeVisible({ timeout: 2000 });
    });
  });

  test('should handle conditional validation for senior roles', async ({
    page,
  }) => {
    await test.step('Select senior role and trigger bio validation', async () => {
      // Fill required fields first
      await page.fill('input[name="name"]', 'John Doe');
      await page.fill('input[name="email"]', 'john@example.com');
      await page.fill('input[name="age"]', '35');

      // Select a senior role to trigger bio field appearance
      await page.selectOption('select[name="role"]', 'Senior Developer');

      // Wait for bio field to appear
      await expect(page.locator('textarea[name="bio"]')).toBeVisible({
        timeout: 2000,
      });

      // Bio should now be required - test by leaving it empty and blurring
      const bioField = page.locator('textarea[name="bio"]');
      await bioField.click();
      await bioField.press('Tab');

      await expect(
        page
          .locator('div[role="alert"]')
          .filter({ hasText: 'Bio is required for senior positions' }),
      ).toBeVisible({ timeout: 2000 });
    });

    await test.step('Test bio length for senior roles', async () => {
      // Bio should have minimum length for senior roles
      const bioField = page.locator('textarea[name="bio"]');
      await bioField.fill('Short');
      await bioField.press('Tab');

      await expect(
        page
          .locator('div[role="alert"]')
          .filter({
            hasText: 'Bio must be at least 50 characters for senior positions',
          }),
      ).toBeVisible({ timeout: 2000 });
    });

    await test.step('Test junior role does not require bio', async () => {
      // Change to junior role
      await page.selectOption('select[name="role"]', 'Junior Developer');

      // Bio field should disappear
      await expect(page.locator('textarea[name="bio"]')).not.toBeVisible({
        timeout: 2000,
      });
    });
  });

  test('should enable/disable submit button based on form validity', async ({
    page,
  }) => {
    await test.step('Submit button should be disabled initially', async () => {
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeDisabled();
    });

    await test.step('Submit button should remain disabled with invalid data', async () => {
      await page.fill('input[name="name"]', 'A'); // Too short
      await page.fill('input[name="email"]', 'invalid'); // Invalid format
      await page.fill('input[name="age"]', '15'); // Too young

      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeDisabled();
    });

    await test.step('Submit button should be enabled with valid data', async () => {
      await page.fill('input[name="name"]', 'John Doe');
      await page.fill('input[name="email"]', 'john@example.com');
      await page.fill('input[name="age"]', '25');
      await page.selectOption('select[name="role"]', 'Junior Developer');
      await page.check('input[name="agreeToTerms"]');

      // Wait for validation to complete
      await page.waitForTimeout(500);

      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeEnabled({ timeout: 2000 });
    });
  });

  test('should successfully submit valid form', async ({ page }) => {
    await test.step('Fill out complete valid form', async () => {
      await page.fill('input[name="name"]', 'John Doe');
      await page.fill('input[name="email"]', 'john@example.com');
      await page.fill('input[name="age"]', '25');
      await page.selectOption('select[name="role"]', 'Junior Developer');
      await page.fill(
        'textarea[name="bio"]',
        'I am a passionate developer with experience in web technologies.',
      );
      await page.check('input[name="agreeToTerms"]');
    });

    await test.step('Submit form and verify success', async () => {
      await page.click('button[type="submit"]');

      // Look for success message or form submission confirmation
      await expect(
        page.locator('text=Form submitted successfully'),
      ).toBeVisible({ timeout: 3000 });

      // Form should remain functional after submission
      await expect(page.locator('input[name="name"]')).toBeVisible();
    });
  });

  test('should handle rapid field interactions without race conditions', async ({
    page,
  }) => {
    await test.step('Rapidly interact with multiple fields', async () => {
      // Quickly tab through fields to test race condition handling
      const nameField = page.locator('input[name="name"]');
      const emailField = page.locator('input[name="email"]');
      const ageField = page.locator('input[name="age"]');

      await nameField.click();
      await nameField.press('Tab');
      await emailField.press('Tab');
      await ageField.press('Tab');

      // Wait for any async validation to complete
      await page.waitForTimeout(1000);

      // All required field errors should be visible without crashes
      await expect(page.locator('text=Name is required')).toBeVisible();
      await expect(page.locator('text=Email is required')).toBeVisible();
      await expect(page.locator('text=Age is required')).toBeVisible();
    });
  });

  test('should maintain accessibility features', async ({ page }) => {
    await test.step('Verify ARIA attributes are set correctly', async () => {
      // Trigger validation errors
      await page.click('input[name="name"]');
      await page.keyboard.press('Tab');

      // Check for proper ARIA attributes on error state
      const nameField = page.locator('input[name="name"]');
      await expect(nameField).toHaveAttribute('aria-invalid', 'true');

      // Error messages should have role="alert"
      await expect(page.locator('[role="alert"]').first()).toBeVisible();
    });

    await test.step('Verify keyboard navigation works', async () => {
      // Test tab order through form
      await page.keyboard.press('Tab'); // Should focus first field
      await page.keyboard.press('Tab'); // Should focus second field
      await page.keyboard.press('Tab'); // Should focus third field

      // Form should remain keyboard accessible
      const focusedElement = await page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });
  });
});
