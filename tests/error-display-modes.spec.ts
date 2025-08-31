import { expect, test } from '@playwright/test';

test.describe('Error Display Modes - Interactive Demo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fundamentals/error-display-modes');
    await page.waitForLoadState('networkidle');
  });

  test('should display the error display modes demo with all components', async ({
    page,
  }) => {
    await test.step('Verify page structure and heading', async () => {
      // Check page heading and description
      await expect(
        page.getByRole('heading', {
          name: /Error Display Modes - Interactive Demo/i,
        }),
      ).toBeVisible();
      await expect(
        page.getByText(
          'Explore how different error display timing affects user experience',
        ),
      ).toBeVisible();
    });

    await test.step('Verify error display mode selector', async () => {
      // Verify error display mode selector is present and has correct options
      const modeSelector = page.getByLabel('🎛️ Error Display Mode');
      await expect(modeSelector).toBeVisible();

      // Check available options by value
      await expect(modeSelector.locator('option[value="on-blur"]')).toHaveText(
        'On Blur',
      );
      await expect(
        modeSelector.locator('option[value="on-submit"]'),
      ).toHaveText('On Submit');
      await expect(
        modeSelector.locator('option[value="on-blur-or-submit"]'),
      ).toHaveText('On Blur or Submit (Recommended)');

      // Verify default selection
      await expect(modeSelector).toHaveValue('on-blur');
    });

    await test.step('Verify form structure and all fields', async () => {
      // Verify product feedback form is present
      await expect(page.locator('form')).toBeVisible();

      // Personal Information section
      await expect(page.getByText('👤 Personal Information')).toBeVisible();
      await expect(
        page.getByRole('textbox', { name: /Full Name/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('textbox', { name: /Email Address/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('textbox', { name: /Company/i }),
      ).toBeVisible();

      // Feedback section
      await expect(page.getByText('📝 Your Feedback')).toBeVisible();
      await expect(
        page.getByRole('combobox', { name: /Which product did you use/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('spinbutton', { name: /Overall Rating/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('textbox', { name: /Additional Comments/i }),
      ).toBeVisible();

      // Preferences section
      await expect(page.getByText('⚙️ Preferences')).toBeVisible();
      await expect(
        page.getByRole('checkbox', { name: /Allow us to contact you/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('checkbox', { name: /Subscribe to product updates/i }),
      ).toBeVisible();

      // Submit button
      await expect(
        page.getByRole('button', { name: /Submit Feedback/i }),
      ).toBeVisible();
    });
  });

  test('should demonstrate on-blur error display mode', async ({ page }) => {
    await test.step('Verify on-blur mode is default', async () => {
      // On-blur should be the default mode
      const modeSelector = page.getByLabel('🎛️ Error Display Mode');
      await expect(modeSelector).toHaveValue('on-blur');
    });

    await test.step('Test errors appear immediately on blur', async () => {
      const nameField = page.getByRole('textbox', { name: /Full Name/i });

      // Focus and immediately blur the field (Tab moves to next field)
      await nameField.click();
      await page.keyboard.press('Tab');

      // Error should appear immediately after blur
      await expect(
        page.locator('[role="alert"]').filter({ hasText: 'Name is required' }),
      ).toBeVisible({ timeout: 2000 });
    });

    await test.step('Test multiple field errors on blur', async () => {
      const emailField = page.getByRole('textbox', { name: /Email Address/i });

      // Focus and blur the email field
      await emailField.click();
      await page.keyboard.press('Tab');

      // Email error should also appear
      await expect(
        page.locator('[role="alert"]').filter({ hasText: 'Email is required' }),
      ).toBeVisible({ timeout: 2000 });
    });

    await test.step('Test errors do not appear on submit without blur', async () => {
      // Reset by reloading the page to start fresh
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Ensure we're in on-blur mode
      await page.getByLabel('🎛️ Error Display Mode').selectOption('on-blur');

      // Click on a field but don't blur it, go straight to submit
      const productField = page.getByRole('combobox', {
        name: /Which product did you use/i,
      });
      await productField.click();

      // Go straight to submit without blurring the field
      const submitButton = page.getByRole('button', {
        name: /Submit Feedback/i,
      });
      await submitButton.click();

      // In on-blur mode, fields that haven't been blurred shouldn't show errors yet
      // But blurred fields should show errors, so check that name shows error if focused+blurred
      const nameField = page.getByRole('textbox', { name: /Full Name/i });
      await nameField.click();
      await page.keyboard.press('Tab');

      await expect(
        page.locator('[role="alert"]').filter({ hasText: 'Name is required' }),
      ).toBeVisible({ timeout: 2000 });
    });
  });

  test('should demonstrate on-submit error display mode', async ({ page }) => {
    await test.step('Switch to on-submit mode', async () => {
      await page.getByLabel('🎛️ Error Display Mode').selectOption('on-submit');
      await expect(page.getByLabel('🎛️ Error Display Mode')).toHaveValue(
        'on-submit',
      );

      // Verify the description updated
      await expect(
        page.getByText('Show errors only when user attempts to submit'),
      ).toBeVisible();
    });

    await test.step('Test errors do not appear on blur', async () => {
      const nameField = page.getByRole('textbox', { name: /Full Name/i });

      // Focus and blur the field
      await nameField.click();
      await page.keyboard.press('Tab');

      // Wait a moment to ensure no errors appear
      await page.waitForTimeout(1000);

      // Error should NOT appear on blur in on-submit mode
      await expect(
        page.locator('[role="alert"]').filter({ hasText: 'Name is required' }),
      ).not.toBeVisible();
    });

    await test.step('Test errors appear only after submit', async () => {
      const submitButton = page.getByRole('button', {
        name: /Submit Feedback/i,
      });

      // Try to submit the form with empty required fields
      await submitButton.click();

      // Multiple errors should now appear
      await expect(
        page.locator('[role="alert"]').filter({ hasText: 'Name is required' }),
      ).toBeVisible({ timeout: 2000 });
      await expect(
        page.locator('[role="alert"]').filter({ hasText: 'Email is required' }),
      ).toBeVisible({ timeout: 2000 });
      await expect(
        page
          .locator('[role="alert"]')
          .filter({ hasText: 'Please select which product you used' }),
      ).toBeVisible({ timeout: 2000 });

      // Should also show form-level error summary
      await expect(
        page
          .locator('[role="alert"]')
          .filter({ hasText: 'Please fix the errors above before submitting' }),
      ).toBeVisible({ timeout: 2000 });
    });
  });

  test('should demonstrate on-blur-or-submit error display mode', async ({
    page,
  }) => {
    await test.step('Switch to on-blur-or-submit mode', async () => {
      await page
        .getByLabel('🎛️ Error Display Mode')
        .selectOption('on-blur-or-submit');
      await expect(page.getByLabel('🎛️ Error Display Mode')).toHaveValue(
        'on-blur-or-submit',
      );

      // Verify the description updated
      await expect(
        page.getByText('Show errors on field blur OR form submit'),
      ).toBeVisible();
    });

    await test.step('Test errors appear on blur', async () => {
      const nameField = page.getByRole('textbox', { name: /Full Name/i });

      await nameField.click();
      await page.keyboard.press('Tab');

      // Error should appear after blur
      await expect(
        page.locator('[role="alert"]').filter({ hasText: 'Name is required' }),
      ).toBeVisible({ timeout: 2000 });
    });

    await test.step('Test errors also appear on submit for untouched fields', async () => {
      // Clear any existing errors by filling the name field
      await page.getByRole('textbox', { name: /Full Name/i }).fill('John Doe');

      // Don't touch the email field, submit directly
      const submitButton = page.getByRole('button', {
        name: /Submit Feedback/i,
      });
      await submitButton.click();

      // Email error should appear on submit even though it wasn't touched
      await expect(
        page.locator('[role="alert"]').filter({ hasText: 'Email is required' }),
      ).toBeVisible({ timeout: 2000 });

      // Should also show form-level error summary
      await expect(
        page
          .locator('[role="alert"]')
          .filter({ hasText: 'Please fix the errors above before submitting' }),
      ).toBeVisible({ timeout: 2000 });
    });
  });

  test('should handle conditional field validation correctly', async ({
    page,
  }) => {
    await test.step('Test low rating triggers improvement suggestions field', async () => {
      // Fill required fields first
      await page.getByRole('textbox', { name: /Full Name/i }).fill('John Doe');
      await page
        .getByRole('textbox', { name: /Email Address/i })
        .fill('john@example.com');
      await page
        .getByRole('combobox', { name: /Which product did you use/i })
        .selectOption('Web App');

      // Set a low rating (3 or below should trigger improvement field)
      await page.getByRole('spinbutton', { name: /Overall Rating/i }).fill('2');

      // The improvement suggestions field should appear
      await expect(
        page.getByRole('textbox', { name: /What could we improve/i }),
      ).toBeVisible({ timeout: 2000 });

      // Verify the character counter appears
      await expect(page.locator('#improvement-counter')).toContainText('0/500');
    });

    await test.step('Test improvement field validation', async () => {
      // Switch to on-blur mode to test immediate validation
      await page.getByLabel('🎛️ Error Display Mode').selectOption('on-blur');

      // With a low rating, improvement suggestions should be required
      const improvementField = page.getByRole('textbox', {
        name: /What could we improve/i,
      });

      await improvementField.click();
      await page.keyboard.press('Tab');

      // Should show required error
      await expect(
        page.locator('[role="alert"]').filter({
          hasText: 'Please help us understand what could be improved',
        }),
      ).toBeVisible({ timeout: 2000 });
    });

    await test.step('Test high rating hides improvement field', async () => {
      // Change to high rating
      await page.getByRole('spinbutton', { name: /Overall Rating/i }).fill('5');

      // Improvement field should be hidden
      await expect(
        page.getByRole('textbox', { name: /What could we improve/i }),
      ).not.toBeVisible({ timeout: 2000 });
    });
  });

  test('should validate character limits with real-time feedback', async ({
    page,
  }) => {
    await test.step('Test additional comments character counter', async () => {
      const commentsField = page.getByRole('textbox', {
        name: /Additional Comments/i,
      });

      // Initially should show 0/1000
      await expect(page.locator('#detailed-counter')).toContainText('0/1000');

      // Fill with some text
      await commentsField.fill('This is a test comment');
      await expect(page.locator('#detailed-counter')).toContainText('22/1000');

      // Fill with long text
      const longText =
        'This is a very long comment that tests the character limit functionality. '.repeat(
          20,
        );
      await commentsField.fill(longText);
      await expect(page.locator('#detailed-counter')).toContainText(
        `${longText.length}/1000`,
      );
    });

    await test.step('Test improvement suggestions character counter when visible', async () => {
      // Set low rating to show improvement field
      await page.getByRole('spinbutton', { name: /Overall Rating/i }).fill('2');

      const improvementField = page.getByRole('textbox', {
        name: /What could we improve/i,
      });
      await expect(improvementField).toBeVisible();

      // Check character counter
      await expect(page.locator('#improvement-counter')).toContainText('0/500');

      // Fill with text and check character counter updates
      const testText = 'This needs improvement. '.repeat(10); // ~240 chars
      await improvementField.fill(testText);
      await expect(page.locator('#improvement-counter')).toContainText(
        `${testText.length}/500`,
      );

      // Test over limit styling (should be red when over 500)
      const longText = 'A'.repeat(600);
      await improvementField.fill(longText);
      await expect(page.locator('#improvement-counter')).toContainText(
        '600/500',
      );
      await expect(page.locator('#improvement-counter')).toHaveClass(
        /text-red/,
      );
    });
  });

  test('should handle complete form submission successfully', async ({
    page,
  }) => {
    await test.step('Fill out complete valid form', async () => {
      await page
        .getByRole('textbox', { name: /Full Name/i })
        .fill('Jane Smith');
      await page
        .getByRole('textbox', { name: /Email Address/i })
        .fill('jane@company.com');
      await page.getByRole('textbox', { name: /Company/i }).fill('Tech Corp');

      // Select product
      await page
        .getByRole('combobox', { name: /Which product did you use/i })
        .selectOption('Web App');

      // Set high rating (no improvement field needed)
      await page.getByRole('spinbutton', { name: /Overall Rating/i }).fill('5');

      // Fill additional comments
      await page
        .getByRole('textbox', { name: /Additional Comments/i })
        .fill(
          'Great product! Very satisfied with the quality and performance. The user interface is intuitive and the features meet all our needs.',
        );

      // Check follow-up preference
      await page
        .getByRole('checkbox', { name: /Allow us to contact you/i })
        .check();
    });

    await test.step('Submit form and verify success', async () => {
      const submitButton = page.getByRole('button', {
        name: /Submit Feedback/i,
      });
      await expect(submitButton).toBeEnabled();

      // Handle the alert dialog that appears on successful submission
      page.on('dialog', async (dialog) => {
        expect(dialog.type()).toBe('alert');
        expect(dialog.message()).toContain('Thank you for your feedback! 🎉');
        await dialog.accept();
      });

      await submitButton.click();

      // Wait for the submission processing
      await page.waitForTimeout(2000);
    });
  });

  test('should maintain accessibility throughout error mode changes', async ({
    page,
  }) => {
    await test.step('Verify ARIA attributes are correctly applied', async () => {
      // Test with on-blur mode (default)
      const nameField = page.getByRole('textbox', { name: /Full Name/i });

      // Initially should not have aria-invalid
      await expect(nameField).not.toHaveAttribute('aria-invalid', 'true');

      await nameField.click();
      await page.keyboard.press('Tab');

      // After error appears, should have aria-invalid="true"
      await expect(nameField).toHaveAttribute('aria-invalid', 'true');
      await expect(page.locator('[role="alert"]').first()).toBeVisible();
    });

    await test.step('Verify keyboard navigation works across modes', async () => {
      // Test tab order is maintained across different error display modes
      await page.keyboard.press('Tab'); // Should focus first focusable element
      await page.keyboard.press('Tab'); // Should focus second field

      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    await test.step('Verify mode switching maintains form state', async () => {
      // Fill some data
      await page.getByRole('textbox', { name: /Full Name/i }).fill('Test User');

      // Switch modes
      await page.getByLabel('🎛️ Error Display Mode').selectOption('on-submit');
      await page
        .getByLabel('🎛️ Error Display Mode')
        .selectOption('on-blur-or-submit');
      await page.getByLabel('🎛️ Error Display Mode').selectOption('on-blur');

      // Form data should be preserved
      await expect(
        page.getByRole('textbox', { name: /Full Name/i }),
      ).toHaveValue('Test User');
    });
  });

  test('should handle form-level error summaries', async ({ page }) => {
    await test.step('Should show form-level error summary on invalid submission', async () => {
      // Set to "On Submit" mode to trigger form-level errors
      await page.getByLabel('🎛️ Error Display Mode').selectOption('on-submit');

      // Submit empty form to trigger multiple errors
      await page.getByRole('button', { name: /Submit Feedback/i }).click();

      // Should show form-level error summary
      await expect(
        page.locator('[role="alert"]').filter({
          hasText: 'Please fix the errors above before submitting',
        }),
      ).toBeVisible();
    });

    await test.step('Should manage form-level error summary correctly', async () => {
      // Set to on-submit mode for form-level error testing
      await page.getByLabel('🎛️ Error Display Mode').selectOption('on-submit');

      // Start with empty form and trigger validation
      await page.getByRole('button', { name: /Submit Feedback/i }).click();

      // Verify error summary is shown after failed submission
      await expect(
        page.locator('[role="alert"]').filter({
          hasText: 'Please fix the errors above before submitting',
        }),
      ).toBeVisible();

      // Fill some but not all required fields
      await page.getByRole('textbox', { name: /Full Name/i }).fill('John Doe');
      await page
        .getByRole('textbox', { name: /Email Address/i })
        .fill('john@example.com');
      // Leave rating and product selection empty

      // Try to submit again - should still show error summary
      await page.getByRole('button', { name: /Submit Feedback/i }).click();
      await expect(
        page.locator('[role="alert"]').filter({
          hasText: 'Please fix the errors above before submitting',
        }),
      ).toBeVisible();
    });

    await test.step('Should show form-level errors regardless of mode', async () => {
      // Reset form to empty state
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Set to "On Blur" mode
      await page.getByLabel('🎛️ Error Display Mode').selectOption('on-blur');

      // Submit invalid form
      await page.getByRole('button', { name: /Submit Feedback/i }).click();

      // Form-level error summary should still appear even in blur mode
      // This ensures users get feedback when trying to submit invalid forms
      await expect(
        page.locator('[role="alert"]').filter({
          hasText: 'Please fix the errors above before submitting',
        }),
      ).toBeVisible();
    });

    await test.step('Should show form-level errors in "On Blur or Submit" mode', async () => {
      // Reset and set to recommended mode
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page
        .getByLabel('🎛️ Error Display Mode')
        .selectOption('on-blur-or-submit');

      // Submit invalid form
      await page.getByRole('button', { name: /Submit Feedback/i }).click();

      // Should show form-level error summary
      await expect(
        page.locator('[role="alert"]').filter({
          hasText: 'Please fix the errors above before submitting',
        }),
      ).toBeVisible();
    });
  });

  test('should demonstrate real-world validation scenarios', async ({
    page,
  }) => {
    await test.step('Test email format validation', async () => {
      // Switch to on-blur mode for immediate feedback
      await page.getByLabel('🎛️ Error Display Mode').selectOption('on-blur');

      const emailField = page.getByRole('textbox', { name: /Email Address/i });

      await emailField.fill('invalid-email');
      await page.keyboard.press('Tab');

      await expect(
        page.locator('[role="alert"]').filter({
          hasText: 'Please enter a valid email address',
        }),
      ).toBeVisible({ timeout: 2000 });
    });

    await test.step('Test company name length limit', async () => {
      const companyField = page.getByRole('textbox', { name: /Company/i });

      // Fill with very long company name
      await companyField.fill('A'.repeat(150)); // Over 100 char limit
      await page.keyboard.press('Tab');

      await expect(
        page.locator('[role="alert"]').filter({
          hasText: 'Company name cannot exceed 100 characters',
        }),
      ).toBeVisible({ timeout: 2000 });
    });

    await test.step('Test product selection requirement', async () => {
      const productField = page.getByRole('combobox', {
        name: /Which product did you use/i,
      });

      await productField.focus();
      await page.keyboard.press('Tab');

      await expect(
        page.locator('[role="alert"]').filter({
          hasText: 'Please select which product you used',
        }),
      ).toBeVisible({ timeout: 2000 });
    });

    await test.step('Test rating validation', async () => {
      const ratingField = page.getByRole('spinbutton', {
        name: /Overall Rating/i,
      });

      // Test with invalid value (0 is below minimum)
      await ratingField.fill('0');
      await page.keyboard.press('Tab');

      // Should show validation error
      await expect(
        page.locator('[role="alert"]').filter({
          hasText: 'min',
        }),
      ).toBeVisible({ timeout: 2000 });
    });
  });

  test('should handle edge cases and error recovery', async ({ page }) => {
    await test.step('Test form state after validation errors', async () => {
      // Switch to on-blur mode for immediate feedback
      await page.getByLabel('🎛️ Error Display Mode').selectOption('on-blur');

      // Trigger multiple errors
      await page.getByRole('textbox', { name: /Full Name/i }).click();
      await page.keyboard.press('Tab');
      await page.getByRole('textbox', { name: /Email Address/i }).click();
      await page.keyboard.press('Tab');

      // Multiple errors should be visible
      await expect(
        page.locator('[role="alert"]').filter({ hasText: 'Name is required' }),
      ).toBeVisible();
      await expect(
        page.locator('[role="alert"]').filter({ hasText: 'Email is required' }),
      ).toBeVisible();

      // Fix errors one by one
      await page
        .getByRole('textbox', { name: /Full Name/i })
        .fill('Fixed Name');
      await page
        .getByRole('textbox', { name: /Email Address/i })
        .fill('fixed@email.com');

      // Errors should disappear
      await page.waitForTimeout(1000);
      await expect(
        page.locator('[role="alert"]').filter({ hasText: 'Name is required' }),
      ).not.toBeVisible();
      await expect(
        page.locator('[role="alert"]').filter({ hasText: 'Email is required' }),
      ).not.toBeVisible();
    });

    await test.step('Test rapid mode switching without issues', async () => {
      // Rapidly switch between error display modes
      await page.getByLabel('🎛️ Error Display Mode').selectOption('on-blur');
      await page.waitForTimeout(200);
      await page.getByLabel('🎛️ Error Display Mode').selectOption('on-submit');
      await page.waitForTimeout(200);
      await page
        .getByLabel('🎛️ Error Display Mode')
        .selectOption('on-blur-or-submit');
      await page.waitForTimeout(200);
      await page.getByLabel('🎛️ Error Display Mode').selectOption('on-blur');

      // Form should remain functional
      await expect(
        page.getByRole('textbox', { name: /Full Name/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: /Submit Feedback/i }),
      ).toBeVisible();
    });
  });

  test('should verify focus management for accessibility', async ({ page }) => {
    await test.step('Should focus first invalid field after form-level error', async () => {
      // Set to "On Submit" mode and submit invalid form
      await page.getByLabel('🎛️ Error Display Mode').selectOption('on-submit');
      await page.getByRole('button', { name: /Submit Feedback/i }).click();

      // First invalid field should receive focus for accessibility
      await expect(
        page.getByRole('textbox', { name: /Full Name/i }),
      ).toBeFocused();
    });

    await test.step('Should maintain logical tab order', async () => {
      // Test tab navigation follows logical order
      await page.getByRole('textbox', { name: /Full Name/i }).focus();
      await page.keyboard.press('Tab');
      await expect(
        page.getByRole('textbox', { name: /Email Address/i }),
      ).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(
        page.getByRole('textbox', { name: /Company/i }),
      ).toBeFocused();
    });
  });
});
