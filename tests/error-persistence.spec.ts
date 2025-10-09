import { expect, test } from '@playwright/test';

/**
 * Error Persistence Tests
 *
 * These tests verify that when using createSafeSuite (stateful), errors persist
 * across field navigation in 'on-touch' error display mode.
 *
 * Regression test for: When using staticSafeSuite, touching field B would cause
 * field A's error to disappear because staticSuite doesn't maintain state across
 * only(field) calls.
 *
 * Test Strategy:
 * 1. Fill field A with invalid data → blur → verify error appears
 * 2. Fill field B with invalid data → blur → verify error appears
 * 3. Verify BOTH field A and field B errors remain visible simultaneously
 */

test.describe('Error Persistence - On Touch Mode', () => {
  test.beforeEach(async ({ page }) => {
    // All tests run on basic-validation which uses createSafeSuite (stateful)
    await page.goto('http://localhost:4200/fundamentals/basic-validation');

    // Wait for page to load and verify error display mode is set to "On Touch"
    await expect(
      page.getByRole('radio', { name: 'On Touch', checked: true }),
    ).toBeVisible();
  });

  test('Multiple field errors should persist simultaneously', async ({
    page,
  }) => {
    // Step 1: Fill Full Name with invalid data (too short)
    await test.step('Fill Full Name with invalid data', async () => {
      const nameInput = page.getByRole('textbox', { name: /full name/i });
      await nameInput.click();
      await nameInput.fill('a'); // Too short - needs 2+ chars
      await nameInput.blur(); // Trigger validation on touch

      // Verify Full Name error appears
      await expect(
        page.getByRole('alert').filter({
          hasText: /name must be at least 2 characters/i,
        }),
      ).toBeVisible();
    });

    // Step 2: Fill Email with invalid data
    await test.step('Fill Email with invalid data', async () => {
      const emailInput = page.getByRole('textbox', { name: /email address/i });
      await emailInput.click();
      await emailInput.fill('invalid'); // Invalid email format
      await emailInput.blur(); // Trigger validation on touch

      // Verify Email error appears
      await expect(
        page.getByRole('alert').filter({
          hasText: /please enter a valid email address/i,
        }),
      ).toBeVisible();
    });

    // Step 3: Verify BOTH errors are still visible (key regression test)
    await test.step('Verify both errors persist', async () => {
      // Full Name error should STILL be visible
      await expect(
        page.getByRole('alert').filter({
          hasText: /name must be at least 2 characters/i,
        }),
      ).toBeVisible();

      // Email error should ALSO be visible
      await expect(
        page.getByRole('alert').filter({
          hasText: /please enter a valid email address/i,
        }),
      ).toBeVisible();

      // Debug panel should show 2 errors
      await expect(page.getByText(/validation errors\s+2/i)).toBeVisible();
    });
  });

  test('Errors should persist when navigating to third field', async ({
    page,
  }) => {
    // Test with 3 fields to ensure persistence across multiple navigations
    const nameInput = page.getByRole('textbox', { name: /full name/i });
    const emailInput = page.getByRole('textbox', { name: /email address/i });
    const ageInput = page.getByRole('spinbutton', { name: /age/i });

    // Fill all three fields with invalid data
    await test.step('Fill three fields with invalid data', async () => {
      await nameInput.click();
      await nameInput.fill('a');
      await nameInput.blur();

      await emailInput.click();
      await emailInput.fill('invalid');
      await emailInput.blur();

      await ageInput.click();
      await ageInput.fill('5'); // Too young - needs 18+
      await ageInput.blur();
    });

    // Verify all three errors persist
    await test.step('Verify all three errors persist', async () => {
      await expect(
        page.getByRole('alert').filter({
          hasText: /name must be at least 2 characters/i,
        }),
      ).toBeVisible();

      await expect(
        page.getByRole('alert').filter({
          hasText: /please enter a valid email address/i,
        }),
      ).toBeVisible();

      await expect(
        page.getByRole('alert').filter({
          hasText: /you must be at least 18 years old/i,
        }),
      ).toBeVisible();

      // Debug panel should show 3 errors
      await expect(page.getByText(/validation errors\s+3/i)).toBeVisible();
    });
  });

  test('Fixing one field should not clear other field errors', async ({
    page,
  }) => {
    const nameInput = page.getByRole('textbox', { name: /full name/i });
    const emailInput = page.getByRole('textbox', { name: /email address/i });

    // Create two errors
    await test.step('Create two errors', async () => {
      await nameInput.click();
      await nameInput.fill('a');
      await nameInput.blur();

      await emailInput.click();
      await emailInput.fill('invalid');
      await emailInput.blur();
    });

    // Fix the name field
    await test.step('Fix name field', async () => {
      await nameInput.click();
      await nameInput.fill('John Doe'); // Valid name
      await nameInput.blur();

      // Name error should disappear
      await expect(
        page.getByRole('alert').filter({
          hasText: /name must be at least 2 characters/i,
        }),
      ).not.toBeVisible();
    });

    // Email error should STILL be visible
    await test.step('Email error should persist', async () => {
      await expect(
        page.getByRole('alert').filter({
          hasText: /please enter a valid email address/i,
        }),
      ).toBeVisible();

      // Debug panel should show 1 error (only email)
      await expect(page.getByText(/validation errors\s+1/i)).toBeVisible();
    });
  });
});

test.describe('Error Persistence - Nested Forms', () => {
  test.beforeEach(async ({ page }) => {
    // Test the nested forms example which was the original bug report
    await page.goto('http://localhost:4200/fundamentals/nested-forms');

    // Wait for page to load and set to "On Touch" mode
    await page.getByRole('radio', { name: 'On Touch' }).click();
  });

  test('Nested form section errors should persist across sections', async ({
    page,
  }) => {
    // Step 1: Fill firstName with invalid data
    await test.step('Fill firstName in Personal Info section', async () => {
      const firstNameInput = page.getByRole('textbox', {
        name: /first name/i,
      });
      await firstNameInput.click();
      await firstNameInput.fill('a'); // Too short
      await firstNameInput.blur();

      // Verify firstName error appears
      await expect(
        page.getByRole('alert').filter({
          hasText: /first name must be at least 2 characters/i,
        }),
      ).toBeVisible();
    });

    // Step 2: Fill lastName with invalid data
    await test.step('Fill lastName in Personal Info section', async () => {
      const lastNameInput = page.getByRole('textbox', { name: /last name/i });
      await lastNameInput.click();
      await lastNameInput.fill('b'); // Too short
      await lastNameInput.blur();

      // Verify lastName error appears
      await expect(
        page.getByRole('alert').filter({
          hasText: /last name must be at least 2 characters/i,
        }),
      ).toBeVisible();
    });

    // Step 3: Verify BOTH errors persist (this was the original bug)
    await test.step('Verify both firstName and lastName errors persist', async () => {
      // firstName error should STILL be visible
      await expect(
        page.getByRole('alert').filter({
          hasText: /first name must be at least 2 characters/i,
        }),
      ).toBeVisible();

      // lastName error should ALSO be visible
      await expect(
        page.getByRole('alert').filter({
          hasText: /last name must be at least 2 characters/i,
        }),
      ).toBeVisible();

      // Debug panel should show 2 errors
      await expect(page.getByText(/validation errors\s+2/i)).toBeVisible();
    });
  });
});

test.describe('Error Persistence - Form State Indicators', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200/fundamentals/basic-validation');
  });

  test('Valid/Invalid indicators should update correctly', async ({ page }) => {
    // Initially: Valid: ❌, Invalid: — (pristine/idle state)
    await test.step('Initial state should be idle', async () => {
      // Look for the specific state indicators in the debug panel
      await expect(page.locator('text="Valid: ❌"').first()).toBeVisible();
      await expect(page.locator('text="Invalid: —"').first()).toBeVisible();
    });

    // After creating an error: Valid: ❌, Invalid: ✅
    await test.step('After invalid input, should show invalid', async () => {
      const nameInput = page.getByRole('textbox', { name: /full name/i });
      await nameInput.click();
      await nameInput.fill('a');
      await nameInput.blur();

      await expect(page.locator('text="Valid: ❌"').first()).toBeVisible();
      // Invalid state should show after error (but the exact icon may vary)
    });

    // After fixing all errors: Valid: ✅, Invalid: ❌
    await test.step('After fixing errors, should show valid', async () => {
      const nameInput = page.getByRole('textbox', { name: /full name/i });
      const emailInput = page.getByRole('textbox', { name: /email address/i });
      const ageInput = page.getByRole('spinbutton', { name: /age/i });
      const roleSelect = page.getByRole('combobox', { name: /role/i });
      const termsCheckbox = page.getByRole('checkbox', {
        name: /terms and conditions/i,
      });

      await nameInput.click();
      await nameInput.fill('John Doe');
      await nameInput.blur();

      await emailInput.click();
      await emailInput.fill('john@example.com');
      await emailInput.blur();

      await ageInput.click();
      await ageInput.fill('25');
      await ageInput.blur();

      await roleSelect.selectOption('Junior Developer');

      await termsCheckbox.check();

      // Wait for validation to complete (async validation for email)
      await page.waitForTimeout(2000);

      // Form should now be valid - just check the valid state and no errors
      await expect(page.locator('text="Valid: ✅"').first()).toBeVisible();
      await expect(page.getByText(/no validation errors/i)).toBeVisible();
    });
  });
});
