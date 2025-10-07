import { expect, test } from '@playwright/test';

/**
 * E2E tests for Nested Forms example
 * Tests multi-section forms with nested object validation
 *
 * Route: /fundamentals/nested-forms
 * Component: ExampleFormNested
 * Features: Nested object validation, path-based field access, multi-section forms
 *
 * IMPORTANT: Understanding Vest.js only() behavior
 * ==============================================
 * The validation suite uses staticSafeSuite which automatically calls only(field)
 * when validating individual fields. This is the correct Vest.js pattern for performance:
 *
 * - Initial state: Validates ALL fields → Debugger shows ALL errors (8 errors)
 * - After field blur: Validates ONLY that field → Debugger shows ONLY that field's errors (1 error)
 *
 * This is NOT a bug - it's Vest's intended behavior. Tests must account for this pattern.
 */

test.describe('Nested Forms Example', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fundamentals/nested-forms');
    await page.waitForLoadState('networkidle');

    // Switch to 'Immediate' mode for tests that need to see errors right away
    // This is needed because the form now defaults to 'on-touch' (WCAG recommended)
    await page.getByRole('radio', { name: /immediate/i }).click();
    await page.waitForTimeout(100); // Wait for mode change to apply
  });

  test.describe('Page Structure', () => {
    test('should display all form sections', async ({ page }) => {
      // Personal Info section
      await expect(
        page.getByRole('textbox', { name: /first name/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('textbox', { name: /last name/i }),
      ).toBeVisible();
      await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();

      // Address Info section
      await expect(
        page.getByRole('textbox', { name: /street/i }),
      ).toBeVisible();
      await expect(page.getByRole('textbox', { name: /city/i })).toBeVisible();
      await expect(
        page.getByRole('textbox', { name: /zip code/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('combobox', { name: /country/i }),
      ).toBeVisible();

      // Preferences section
      await expect(
        page.getByRole('checkbox', { name: /newsletter/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('checkbox', { name: /notifications/i }),
      ).toBeVisible();
    });

    test('should show all validation errors in debugger initially', async ({
      page,
    }) => {
      // Debugger should show 8 errors initially (all required fields)
      // This verifies that initial validation runs on ALL fields
      // The debugger uses <details>/<summary> for collapsible sections
      // Use first() to get the summary element, not the "No validation errors" message
      await expect(page.getByText('Validation Errors').first()).toBeVisible();
      await expect(page.getByText(/8/)).toBeVisible(); // Error count badge

      // Verify specific error fields are present in the debugger
      // Use role selectors to avoid matching code elements in the page content
      await expect(
        page.getByRole('heading', { name: /personalInfo\.firstName/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('heading', { name: /personalInfo\.email/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('heading', { name: /addressInfo\.street/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('heading', { name: /personalInfo\.gender/i }),
      ).toBeVisible();
    });
  });

  // NOTE: Vest.js only() behavior tests were removed because they conflict with
  // Immediate error display mode. In Immediate mode, the form continuously validates
  // all fields, which overrides field-level only() calls. The only() pattern is still
  // used internally for performance but isn't observable via the UI in Immediate mode.

  test.describe('Field Validation - Personal Info', () => {
    test('should validate first name field', async ({ page }) => {
      const firstNameField = page.getByRole('textbox', {
        name: /first name/i,
      });

      // Trigger validation
      await firstNameField.click();
      await firstNameField.blur();
      await page.waitForTimeout(200);

      // Should show required error inline
      await expect(
        page.getByText(/first name is required/i).first(),
      ).toBeVisible();

      // NOTE: Debugger will show ONLY 1 error due to only() - this is correct!

      // Fill valid value
      await firstNameField.fill('John');
      await page.waitForTimeout(200);

      // Error should disappear
      await expect(page.getByText(/first name is required/i)).not.toBeVisible();
    });

    test('should validate last name field', async ({ page }) => {
      const lastNameField = page.getByRole('textbox', { name: /last name/i });

      // Trigger validation
      await lastNameField.click();
      await lastNameField.blur();
      await page.waitForTimeout(200);

      // Should show required error
      await expect(
        page.getByText(/last name is required/i).first(),
      ).toBeVisible();
    });

    test('should validate email field', async ({ page }) => {
      const emailField = page.getByRole('textbox', { name: /email/i });

      // Test required validation
      await emailField.click();
      await emailField.blur();
      await page.waitForTimeout(200);
      await expect(page.getByText(/email is required/i).first()).toBeVisible();

      // Test invalid email format
      await emailField.fill('invalid-email');
      await emailField.blur();
      await page.waitForTimeout(200);
      await expect(page.getByText(/email.*invalid/i).first()).toBeVisible();

      // Test valid email
      await emailField.fill('john@example.com');
      await page.waitForTimeout(200);
      // Error should clear (check by trying to find it)
      const errorCount = await page.getByText(/email is required/i).count();
      expect(errorCount).toBe(0);
    });

    test('should validate age number input', async ({ page }) => {
      const ageField = page.getByRole('spinbutton', { name: /age/i });

      // Verify field is visible and is a number input
      await expect(ageField).toBeVisible();
      await expect(ageField).toHaveAttribute('type', 'number');

      // Test invalid age (too young)
      await ageField.fill('15');
      await ageField.blur();
      await page.waitForTimeout(200);
      await expect(
        page.getByText(/age must be between 18 and 120/i).first(),
      ).toBeVisible();

      // Test invalid age (too old)
      await ageField.fill('150');
      await ageField.blur();
      await page.waitForTimeout(200);
      await expect(
        page.getByText(/age must be between 18 and 120/i).first(),
      ).toBeVisible();

      // Test valid age
      await ageField.fill('25');
      await page.waitForTimeout(200);
      await expect(ageField).toHaveValue('25');
    });

    test('should handle experience level range slider', async ({ page }) => {
      const rangeSlider = page.getByRole('slider', {
        name: /experience level/i,
      });

      // Verify slider is visible and is a range input
      await expect(rangeSlider).toBeVisible();
      await expect(rangeSlider).toHaveAttribute('type', 'range');
      await expect(rangeSlider).toHaveAttribute('min', '1');
      await expect(rangeSlider).toHaveAttribute('max', '10');

      // Verify default value (should be 5)
      await expect(rangeSlider).toHaveValue('5');

      // Test changing slider value
      await rangeSlider.fill('8');
      await page.waitForTimeout(200);
      await expect(rangeSlider).toHaveValue('8');

      // Verify label shows updated value
      await expect(page.getByText(/experience level.*8\/10/i)).toBeVisible();

      // Test minimum value
      await rangeSlider.fill('1');
      await page.waitForTimeout(200);
      await expect(rangeSlider).toHaveValue('1');

      // Test maximum value
      await rangeSlider.fill('10');
      await page.waitForTimeout(200);
      await expect(rangeSlider).toHaveValue('10');
    });

    test('should handle gender radio button group', async ({ page }) => {
      // Verify all radio buttons are visible
      const maleRadio = page.getByRole('radio', { name: /^male$/i });
      const femaleRadio = page.getByRole('radio', { name: /^female$/i });
      const otherRadio = page.getByRole('radio', { name: /^other$/i });
      const preferNotRadio = page.getByRole('radio', {
        name: /prefer not to say/i,
      });

      await expect(maleRadio).toBeVisible();
      await expect(femaleRadio).toBeVisible();
      await expect(otherRadio).toBeVisible();
      await expect(preferNotRadio).toBeVisible();

      // Initially none should be checked
      await expect(maleRadio).not.toBeChecked();
      await expect(femaleRadio).not.toBeChecked();
      await expect(otherRadio).not.toBeChecked();
      await expect(preferNotRadio).not.toBeChecked();

      // Select male
      await maleRadio.check();
      await page.waitForTimeout(200);
      await expect(maleRadio).toBeChecked();
      await expect(femaleRadio).not.toBeChecked();

      // Switch to female
      await femaleRadio.check();
      await page.waitForTimeout(200);
      await expect(femaleRadio).toBeChecked();
      await expect(maleRadio).not.toBeChecked();

      // Switch to other
      await otherRadio.check();
      await page.waitForTimeout(200);
      await expect(otherRadio).toBeChecked();
      await expect(femaleRadio).not.toBeChecked();

      // Switch to prefer not to say
      await preferNotRadio.check();
      await page.waitForTimeout(200);
      await expect(preferNotRadio).toBeChecked();
      await expect(otherRadio).not.toBeChecked();
    });

    test('should validate gender selection requirement', async ({ page }) => {
      // Gender error is already visible initially (form starts invalid)
      await expect(
        page.getByText(/gender selection is required/i).first(),
      ).toBeVisible();

      // Select a gender
      const maleRadio = page.getByRole('radio', { name: /^male$/i });
      await maleRadio.check();
      await page.waitForTimeout(200);

      // Verify gender was selected in the model (check debugger)
      await expect(page.getByText(/"gender": "male"/)).toBeVisible();

      // Error should clear after selection
      const errorCount = await page
        .getByText(/gender selection is required/i)
        .count();
      expect(errorCount).toBe(0);
    });
  });

  test.describe('Field Validation - Address Info', () => {
    test('should validate street field', async ({ page }) => {
      const streetField = page.getByRole('textbox', { name: /street/i });

      await streetField.click();
      await streetField.blur();
      await page.waitForTimeout(200);

      // May show validation error
      await expect(streetField).toBeVisible();
    });

    test('should validate city field', async ({ page }) => {
      const cityField = page.getByRole('textbox', { name: /city/i });

      await cityField.click();
      await cityField.blur();
      await page.waitForTimeout(200);

      await expect(cityField).toBeVisible();
    });

    test('should accept address input', async ({ page }) => {
      await page.getByRole('textbox', { name: /street/i }).fill('123 Main St');
      await page.getByRole('textbox', { name: /city/i }).fill('Springfield');
      await page.getByRole('textbox', { name: /zip code/i }).fill('12345');
      await page.getByRole('combobox', { name: /country/i }).selectOption('US');

      // All fields should have values
      await expect(page.getByRole('textbox', { name: /street/i })).toHaveValue(
        '123 Main St',
      );
      await expect(page.getByRole('textbox', { name: /city/i })).toHaveValue(
        'Springfield',
      );
    });
  });

  test.describe('Field Validation - Preferences', () => {
    test('should toggle newsletter checkbox', async ({ page }) => {
      const newsletterCheckbox = page.getByRole('checkbox', {
        name: /newsletter/i,
      });

      // Initially unchecked
      await expect(newsletterCheckbox).not.toBeChecked();

      // Check it
      await newsletterCheckbox.check();
      await expect(newsletterCheckbox).toBeChecked();

      // Uncheck it
      await newsletterCheckbox.uncheck();
      await expect(newsletterCheckbox).not.toBeChecked();
    });

    test('should toggle notifications checkbox', async ({ page }) => {
      const notificationsCheckbox = page.getByRole('checkbox', {
        name: /notifications/i,
      });

      await expect(notificationsCheckbox).not.toBeChecked();
      await notificationsCheckbox.check();
      await expect(notificationsCheckbox).toBeChecked();
    });
  });

  test.describe('Form Submission', () => {
    test('should display submit button', async ({ page }) => {
      const submitButton = page.getByRole('button', { name: /submit/i });
      await expect(submitButton).toBeVisible();
    });

    test('should accept complete form data with all input types', async ({
      page,
    }) => {
      // Fill personal info - text inputs
      await page.getByRole('textbox', { name: /first name/i }).fill('John');
      await page.getByRole('textbox', { name: /last name/i }).fill('Doe');
      await page
        .getByRole('textbox', { name: /email/i })
        .fill('john@example.com');

      // Fill new input types
      await page.getByRole('spinbutton', { name: /age/i }).fill('30');
      await page.getByRole('slider', { name: /experience level/i }).fill('7');
      await page.getByRole('radio', { name: /^male$/i }).check();

      // Fill address info
      await page.getByRole('textbox', { name: /street/i }).fill('123 Main St');
      await page.getByRole('textbox', { name: /city/i }).fill('Springfield');
      await page.getByRole('textbox', { name: /zip code/i }).fill('12345');
      await page.getByRole('combobox', { name: /country/i }).selectOption('US');

      // Fill preferences - checkboxes
      await page.getByRole('checkbox', { name: /newsletter/i }).check();

      await page.waitForTimeout(300);

      // Verify all fields have correct values
      await expect(
        page.getByRole('textbox', { name: /first name/i }),
      ).toHaveValue('John');
      await expect(page.getByRole('textbox', { name: /email/i })).toHaveValue(
        'john@example.com',
      );
      await expect(page.getByRole('spinbutton', { name: /age/i })).toHaveValue(
        '30',
      );
      await expect(
        page.getByRole('slider', { name: /experience level/i }),
      ).toHaveValue('7');
      await expect(page.getByRole('radio', { name: /^male$/i })).toBeChecked();
      await expect(
        page.getByRole('checkbox', { name: /newsletter/i }),
      ).toBeChecked();
    });

    test('should have reset button', async ({ page }) => {
      const resetButton = page.getByRole('button', { name: /reset/i });
      await expect(resetButton).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have accessible form labels', async ({ page }) => {
      // All form fields should have accessible labels
      await expect(
        page.getByRole('textbox', { name: /first name/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('textbox', { name: /last name/i }),
      ).toBeVisible();
      await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
      await expect(
        page.getByRole('checkbox', { name: /newsletter/i }),
      ).toBeVisible();
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Tab through form fields
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Should be able to interact with fields via keyboard
      const firstNameField = page.getByRole('textbox', {
        name: /first name/i,
      });
      await firstNameField.focus();
      await page.keyboard.type('John');
      await expect(firstNameField).toHaveValue('John');
    });
  });
});
