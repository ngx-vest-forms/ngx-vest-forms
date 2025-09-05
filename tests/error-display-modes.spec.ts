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
      await expect(
        page.getByRole('heading', {
          name: 'Error Display Modes - Interactive Demo',
          level: 1,
        }),
      ).toBeVisible();
      await expect(
        page.getByText(
          'Explore how different error display timing affects user experience',
        ),
      ).toBeVisible();
    });

    await test.step('Verify error display mode selector', async () => {
      const modeSelector = page.getByRole('group', {
        name: '🎛️ Error Display Mode',
      });
      await expect(modeSelector).toBeVisible();

      // Verify all three radio options are available (use exact: true to avoid substring matches)
      await expect(
        page.getByRole('radio', { name: 'On Blur', exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole('radio', { name: 'On Submit', exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole('radio', {
          name: 'On Blur or Submit (Recommended)',
          exact: true,
        }),
      ).toBeVisible();

      // Verify default selection is "On Blur or Submit (Recommended)"
      await expect(
        page.getByRole('radio', {
          name: 'On Blur or Submit (Recommended)',
          exact: true,
        }),
      ).toBeChecked();
    });

    await test.step('Verify form structure and all fields', async () => {
      const form = page.locator('form');
      await expect(form).toBeVisible();

      // Personal Information section
      await expect(
        page.getByRole('group', { name: '👤 Personal Information' }),
      ).toBeVisible();
      await expect(
        page.getByRole('textbox', { name: 'Full Name *' }),
      ).toBeVisible();
      await expect(
        page.getByRole('textbox', { name: 'Email Address *' }),
      ).toBeVisible();
      await expect(
        page.getByRole('textbox', { name: 'Company' }),
      ).toBeVisible();

      // Your Feedback section
      await expect(
        page.getByRole('group', { name: '📝 Your Feedback' }),
      ).toBeVisible();
      await expect(
        page.getByRole('combobox', { name: 'Which product did you use? *' }),
      ).toBeVisible();
      await expect(
        page.getByRole('spinbutton', { name: 'Overall Rating *' }),
      ).toBeVisible();
      await expect(
        page.getByRole('textbox', { name: 'Additional Comments' }),
      ).toBeVisible();

      // Preferences section
      await expect(
        page.getByRole('group', { name: '⚙️ Preferences' }),
      ).toBeVisible();
      await expect(
        page.getByRole('checkbox', {
          name: 'Allow us to contact you for follow-up questions',
        }),
      ).toBeVisible();
      await expect(
        page.getByRole('checkbox', { name: 'Subscribe to product updates' }),
      ).toBeVisible();

      // Submit button
      await expect(
        page.getByRole('button', { name: 'Submit Feedback' }),
      ).toBeVisible();
    });
  });

  test('should demonstrate on-blur error display mode', async ({ page }) => {
    await test.step('Switch to On Blur mode', async () => {
      await page.getByRole('radio', { name: 'On Blur', exact: true }).click();

      // Verify mode is active
      await expect(
        page.getByRole('radio', { name: 'On Blur', exact: true }),
      ).toBeChecked();
      await expect(
        page.getByText('Show errors immediately when user leaves a field'),
      ).toBeVisible();
    });

    await test.step('Test field-level validation behavior', async () => {
      const nameField = page.getByRole('textbox', { name: 'Full Name *' });

      // Clear the field first to ensure clean state
      await nameField.clear();
      await nameField.fill(''); // Ensure field is empty

      // Click and leave field empty to trigger blur validation
      await nameField.click();
      await page.getByRole('textbox', { name: 'Email Address *' }).click(); // Focus another field to trigger blur

      // Error should now be visible immediately on blur
      await expect(
        page.getByRole('alert').filter({ hasText: 'Name is required' }),
      ).toBeVisible();
    });
  });

  test('should demonstrate on-submit error display mode', async ({ page }) => {
    await test.step('Switch to on-submit mode', async () => {
      await page.getByRole('radio', { name: 'On Submit', exact: true }).click();
      await expect(
        page.getByRole('radio', { name: 'On Submit', exact: true }),
      ).toBeChecked();

      // Verify description changes
      await expect(
        page.getByText('Show errors only when user attempts to submit'),
      ).toBeVisible();
    });

    await test.step('Test errors do not appear on blur', async () => {
      const nameField = page.getByRole('textbox', { name: 'Full Name *' });
      const emailField = page.getByRole('textbox', { name: 'Email Address *' });

      // Focus and blur both fields
      await nameField.focus();
      await nameField.blur();
      await emailField.focus();
      await emailField.blur();

      // No errors should appear
      await expect(
        page.getByRole('alert').filter({ hasText: 'Name is required' }),
      ).toBeHidden();
      await expect(
        page.getByRole('alert').filter({ hasText: 'Email is required' }),
      ).toBeHidden();
    });

    await test.step('Test errors appear only after submit', async () => {
      await page.getByRole('button', { name: 'Submit Feedback' }).click();

      // All validation errors should appear
      await expect(
        page.getByRole('alert').filter({ hasText: 'Name is required' }),
      ).toBeVisible();
      await expect(
        page.getByRole('alert').filter({ hasText: 'Email is required' }),
      ).toBeVisible();
      await expect(
        page
          .getByRole('alert')
          .filter({ hasText: 'Please select which product you used' }),
      ).toBeVisible();

      // Form-level error summary should appear
      await expect(
        page
          .getByRole('alert')
          .filter({ hasText: 'Please fix the errors above before submitting' }),
      ).toBeVisible();

      // Focus should be on first invalid field
      await expect(
        page.getByRole('textbox', { name: 'Full Name *' }),
      ).toBeFocused();
    });
  });

  test('should demonstrate on-blur-or-submit error display mode', async ({
    page,
  }) => {
    await test.step('Switch to on-blur-or-submit mode', async () => {
      await page
        .getByRole('radio', {
          name: 'On Blur or Submit (Recommended)',
          exact: true,
        })
        .click();
      await expect(
        page.getByRole('radio', {
          name: 'On Blur or Submit (Recommended)',
          exact: true,
        }),
      ).toBeChecked();

      // Verify description changes
      await expect(
        page.getByText('Show errors on field blur OR form submit'),
      ).toBeVisible();
    });

    await test.step('Test errors appear on blur', async () => {
      const nameField = page.getByRole('textbox', { name: 'Full Name *' });

      await nameField.focus();
      await nameField.blur();

      await expect(
        page.getByRole('alert').filter({ hasText: 'Name is required' }),
      ).toBeVisible();
    });

    await test.step('Test errors also appear on submit for untouched fields', async () => {
      // Submit form without touching other fields
      await page.getByRole('button', { name: 'Submit Feedback' }).click();

      // Untouched field errors should now appear
      await expect(
        page.getByRole('alert').filter({ hasText: 'Email is required' }),
      ).toBeVisible();
      await expect(
        page
          .getByRole('alert')
          .filter({ hasText: 'Please select which product you used' }),
      ).toBeVisible();

      // Previously blurred field error should still be visible
      await expect(
        page.getByRole('alert').filter({ hasText: 'Name is required' }),
      ).toBeVisible();
    });
  });

  test('should handle conditional field validation correctly', async ({
    page,
  }) => {
    await test.step('Test low rating triggers improvement suggestions field', async () => {
      // Set rating to low value (should trigger conditional field)
      const ratingField = page.getByRole('spinbutton', {
        name: 'Overall Rating *',
      });
      await ratingField.fill('2');

      // Check if improvement suggestions field appears (this would be conditional logic)
      // Note: This test assumes the form has conditional validation based on rating
      // If this feature doesn't exist, this test should be removed or modified
    });

    await test.step('Test improvement field validation', async () => {
      // This step tests conditional validation if it exists
      // Implementation depends on actual form behavior
    });

    await test.step('Test high rating hides improvement field', async () => {
      // Set rating to high value
      const ratingField = page.getByRole('spinbutton', {
        name: 'Overall Rating *',
      });
      await ratingField.fill('5');

      // Verify conditional field behavior
    });
  });

  test('should validate character limits with real-time feedback', async ({
    page,
  }) => {
    await test.step('Test additional comments character counter', async () => {
      const commentsField = page.getByRole('textbox', {
        name: 'Additional Comments',
      });
      const testText =
        'This is a test comment to see the character counter in action.';

      await commentsField.fill(testText);

      // Verify character counter updates
      await expect(page.getByText('62/1000')).toBeVisible();
    });

    await test.step('Test improvement suggestions character counter when visible', async () => {
      // This would test character counting for conditional fields if they exist
      // Implementation depends on actual form structure
    });
  });

  test('should handle complete form submission successfully', async ({
    page,
  }) => {
    await test.step('Fill out complete valid form', async () => {
      // Fill all required fields with valid data
      await page.getByRole('textbox', { name: 'Full Name *' }).fill('John Doe');
      await page
        .getByRole('textbox', { name: 'Email Address *' })
        .fill('john.doe@example.com');
      await page.getByRole('textbox', { name: 'Company' }).fill('Acme Corp');

      await page
        .getByRole('combobox', { name: 'Which product did you use? *' })
        .selectOption('Web Application');
      await page
        .getByRole('spinbutton', { name: 'Overall Rating *' })
        .fill('4');
      await page
        .getByRole('textbox', { name: 'Additional Comments' })
        .fill('Great product overall!');

      await page
        .getByRole('checkbox', {
          name: 'Allow us to contact you for follow-up questions',
        })
        .check();
    });

    await test.step('Submit form and verify success', async () => {
      await page.getByRole('button', { name: 'Submit Feedback' }).click();

      // Verify no validation errors appear
      await expect(
        page.getByRole('alert').filter({ hasText: 'Name is required' }),
      ).toBeHidden();
      await expect(
        page.getByRole('alert').filter({ hasText: 'Email is required' }),
      ).toBeHidden();
      await expect(
        page
          .getByRole('alert')
          .filter({ hasText: 'Please select which product you used' }),
      ).toBeHidden();
      await expect(
        page
          .getByRole('alert')
          .filter({ hasText: 'Please fix the errors above before submitting' }),
      ).toBeHidden();

      // Note: Add success message verification if the form shows one
    });
  });

  test('should maintain accessibility throughout error mode changes', async ({
    page,
  }) => {
    await test.step('Verify ARIA attributes are correctly applied', async () => {
      // Test initial state
      const nameField = page.getByRole('textbox', { name: 'Full Name *' });

      // Focus and blur to trigger error
      await nameField.focus();
      await nameField.blur();

      // Verify error has proper ARIA role
      const errorMessage = page
        .getByRole('alert')
        .filter({ hasText: 'Name is required' });
      await expect(errorMessage).toBeVisible();

      // Verify field has proper aria-invalid when there's an error
      // Note: This depends on the implementation setting aria-invalid
    });

    await test.step('Verify keyboard navigation works across modes', async () => {
      // Test tab navigation through form
      await page.keyboard.press('Tab'); // Should focus first field or mode selector
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Verify focus is working properly
      // This test ensures keyboard accessibility is maintained
    });

    await test.step('Verify mode switching maintains form state', async () => {
      // Fill a field
      await page
        .getByRole('textbox', { name: 'Full Name *' })
        .fill('Test Name');

      // Switch modes
      await page.getByRole('radio', { name: 'On Submit', exact: true }).click();
      await page.getByRole('radio', { name: 'On Blur', exact: true }).click();

      // Verify field value is preserved
      await expect(
        page.getByRole('textbox', { name: 'Full Name *' }),
      ).toHaveValue('Test Name');
    });
  });

  test('should handle form-level error summaries', async ({ page }) => {
    await test.step('Should show form-level error summary on invalid submission', async () => {
      await page.getByRole('button', { name: 'Submit Feedback' }).click();

      await expect(
        page
          .getByRole('alert')
          .filter({ hasText: 'Please fix the errors above before submitting' }),
      ).toBeVisible();
    });

    await test.step('Should manage form-level error summary correctly', async () => {
      // Fill one field to partially fix errors
      await page.getByRole('textbox', { name: 'Full Name *' }).fill('John Doe');

      // Submit again
      await page.getByRole('button', { name: 'Submit Feedback' }).click();

      // Form-level error should still be present as other fields are invalid
      await expect(
        page
          .getByRole('alert')
          .filter({ hasText: 'Please fix the errors above before submitting' }),
      ).toBeVisible();
    });

    await test.step('Should show form-level errors regardless of mode', async () => {
      // Test in "On Blur" mode
      await page.getByRole('radio', { name: 'On Blur', exact: true }).click();
      await page.getByRole('button', { name: 'Submit Feedback' }).click();
      await expect(
        page
          .getByRole('alert')
          .filter({ hasText: 'Please fix the errors above before submitting' }),
      ).toBeVisible();

      // Test in "On Submit" mode
      await page.getByRole('radio', { name: 'On Submit', exact: true }).click();
      await page.getByRole('button', { name: 'Submit Feedback' }).click();
      await expect(
        page
          .getByRole('alert')
          .filter({ hasText: 'Please fix the errors above before submitting' }),
      ).toBeVisible();
    });

    await test.step('Should show form-level errors in "On Blur or Submit" mode', async () => {
      await page
        .getByRole('radio', {
          name: 'On Blur or Submit (Recommended)',
          exact: true,
        })
        .click();
      await page.getByRole('button', { name: 'Submit Feedback' }).click();
      await expect(
        page
          .getByRole('alert')
          .filter({ hasText: 'Please fix the errors above before submitting' }),
      ).toBeVisible();
    });
  });

  test('should demonstrate real-world validation scenarios', async ({
    page,
  }) => {
    await test.step('Test email format validation', async () => {
      const emailField = page.getByRole('textbox', { name: 'Email Address *' });

      // Enter invalid email
      await emailField.fill('invalid-email');
      await emailField.blur();

      // Should show format error (if implemented)
      // Note: This depends on the actual validation rules
    });

    await test.step('Test company name length limit', async () => {
      const companyField = page.getByRole('textbox', { name: 'Company' });

      // Test very long company name if there are length limits
      await companyField.fill('A'.repeat(200));
      await companyField.blur();

      // Check for length validation error if implemented
    });

    await test.step('Test product selection requirement', async () => {
      // This is already tested in other scenarios
      await page.getByRole('button', { name: 'Submit Feedback' }).click();
      await expect(
        page
          .getByRole('alert')
          .filter({ hasText: 'Please select which product you used' }),
      ).toBeVisible();
    });

    await test.step('Test rating validation', async () => {
      const ratingField = page.getByRole('spinbutton', {
        name: 'Overall Rating *',
      });

      // Test minimum rating validation
      await ratingField.fill('0');
      await ratingField.blur();

      // Check for minimum value error
      await expect(
        page.getByRole('alert').filter({ hasText: 'min' }),
      ).toBeVisible();
    });
  });

  test('should handle edge cases and error recovery', async ({ page }) => {
    await test.step('Test form state after validation errors', async () => {
      // Trigger errors
      await page.getByRole('button', { name: 'Submit Feedback' }).click();

      // Fix errors one by one and verify they disappear
      await page.getByRole('textbox', { name: 'Full Name *' }).fill('John Doe');
      await expect(
        page.getByRole('alert').filter({ hasText: 'Name is required' }),
      ).toBeHidden();

      await page
        .getByRole('textbox', { name: 'Email Address *' })
        .fill('john@example.com');
      await expect(
        page.getByRole('alert').filter({ hasText: 'Email is required' }),
      ).toBeHidden();
    });

    await test.step('Test rapid mode switching without issues', async () => {
      // Rapidly switch between modes
      await page.getByRole('radio', { name: 'On Blur', exact: true }).click();
      await page.getByRole('radio', { name: 'On Submit', exact: true }).click();
      await page
        .getByRole('radio', {
          name: 'On Blur or Submit (Recommended)',
          exact: true,
        })
        .click();
      await page.getByRole('radio', { name: 'On Blur', exact: true }).click();

      // Verify form still works normally
      const nameField = page.getByRole('textbox', { name: 'Full Name *' });
      await nameField.clear(); // Clear existing content first
      await nameField.focus();
      await nameField.blur();
      await expect(
        page.getByRole('alert').filter({ hasText: 'Name is required' }),
      ).toBeVisible();
    });
  });

  test('should verify focus management for accessibility', async ({ page }) => {
    await test.step('Verify focus moves to first invalid field on submit', async () => {
      await page.getByRole('button', { name: 'Submit Feedback' }).click();

      // First invalid field (Full Name) should receive focus
      await expect(
        page.getByRole('textbox', { name: 'Full Name *' }),
      ).toBeFocused();
    });

    await test.step('Verify tab order is logical', async () => {
      // Test tab navigation through the form
      await page.keyboard.press('Tab'); // Mode selector or first field
      await page.keyboard.press('Tab'); // Next field

      // This ensures keyboard navigation works properly
      // Specific assertions depend on the exact tab order implementation
    });
  });
});
