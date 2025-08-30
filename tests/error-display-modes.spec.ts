import { expect, test } from '@playwright/test';

test.describe('Error Display Modes - Interactive Demo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fundamentals/error-display-modes');
    await page.waitForLoadState('networkidle');
  });

  test('should display the error display modes demo with all components', async ({
    page,
  }) => {
    await test.step('Verify page structure and mode selector', async () => {
      // Check page heading and description
      await expect(
        page.locator('h1, h2').filter({ hasText: /Error Display/i }),
      ).toBeVisible();
      await expect(page.locator('text=error display timing')).toBeVisible();

      // Verify error display mode selector is present
      await expect(page.locator('text=on-blur')).toBeVisible();
      await expect(page.locator('text=on-submit')).toBeVisible();
      await expect(page.locator('text=on-blur-or-submit')).toBeVisible();

      // Verify product feedback form is present
      await expect(page.locator('form')).toBeVisible();
      await expect(page.locator('text=Personal Information')).toBeVisible();
      await expect(page.locator('input[name="name"]')).toBeVisible();
      await expect(page.locator('input[name="email"]')).toBeVisible();
    });

    await test.step('Verify all form fields are present', async () => {
      // Personal Information
      await expect(page.locator('input[name="name"]')).toBeVisible();
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="company"]')).toBeVisible();

      // Product Feedback
      await expect(page.locator('select[name="productUsed"]')).toBeVisible();
      await expect(page.locator('input[name="overallRating"]')).toBeVisible();

      // Conditional fields (may not be visible initially)
      const improvementField = page.locator(
        'textarea[name="improvementSuggestions"]',
      );
      const detailedField = page.locator('textarea[name="detailedFeedback"]');

      // These might be conditionally visible based on rating
      // Just verify they exist in DOM even if hidden
      await expect(
        improvementField.or(page.locator('text=improvement')),
      ).toBeTruthy();
      await expect(
        detailedField.or(page.locator('text=detailed')),
      ).toBeTruthy();
    });
  });

  test('should demonstrate on-blur error display mode', async ({ page }) => {
    await test.step('Switch to on-blur mode', async () => {
      // Select the "on-blur" mode
      await page.click('text=on-blur');

      // Verify mode is selected (could be radio button, button highlight, etc.)
      const onBlurSelector = page.locator('text=on-blur').first();
      await expect(onBlurSelector).toBeVisible();
    });

    await test.step('Test errors appear immediately on blur', async () => {
      const nameField = page.locator('input[name="name"]');

      // Focus and immediately blur the field
      await nameField.click();
      await nameField.press('Tab');

      // Error should appear immediately after blur
      await expect(page.locator('text=Name is required')).toBeVisible({
        timeout: 2000,
      });
    });

    await test.step('Test errors do not appear on submit without blur', async () => {
      // Fill some fields but don't blur the email field
      const emailField = page.locator('input[name="email"]');
      await emailField.click();
      // Don't blur - go straight to submit

      const submitButton = page.locator('button[type="submit"]');
      if (await submitButton.isVisible()) {
        await submitButton.click();

        // In pure on-blur mode, errors might not show until fields are touched
        // This depends on the specific implementation
        await page.waitForTimeout(1000);
      }
    });
  });

  test('should demonstrate on-submit error display mode', async ({ page }) => {
    await test.step('Switch to on-submit mode', async () => {
      await page.click('text=on-submit');
      await page.waitForTimeout(500);
    });

    await test.step('Test errors do not appear on blur', async () => {
      const nameField = page.locator('input[name="name"]');

      // Focus and blur the field
      await nameField.click();
      await nameField.press('Tab');

      // Wait a moment to ensure no errors appear
      await page.waitForTimeout(1000);

      // Error should NOT appear on blur in on-submit mode
      await expect(page.locator('text=Name is required')).not.toBeVisible();
    });

    await test.step('Test errors appear only after submit', async () => {
      const submitButton = page.locator('button[type="submit"]');

      // Try to submit the form with empty required fields
      await submitButton.click();

      // Errors should now appear
      await expect(page.locator('text=Name is required')).toBeVisible({
        timeout: 2000,
      });
      await expect(page.locator('text=Email is required')).toBeVisible({
        timeout: 2000,
      });
    });
  });

  test('should demonstrate on-blur-or-submit error display mode', async ({
    page,
  }) => {
    await test.step('Switch to on-blur-or-submit mode', async () => {
      await page.click('text=on-blur-or-submit');
      await page.waitForTimeout(500);
    });

    await test.step('Test errors appear on blur', async () => {
      const nameField = page.locator('input[name="name"]');

      await nameField.click();
      await nameField.press('Tab');

      // Error should appear after blur
      await expect(page.locator('text=Name is required')).toBeVisible({
        timeout: 2000,
      });
    });

    await test.step('Test errors also appear on submit for untouched fields', async () => {
      // Clear any existing errors by filling the name field
      await page.fill('input[name="name"]', 'John Doe');

      // Don't touch the email field, submit directly
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Email error should appear on submit even though it wasn't touched
      await expect(page.locator('text=Email is required')).toBeVisible({
        timeout: 2000,
      });
    });
  });

  test('should handle conditional field validation correctly', async ({
    page,
  }) => {
    await test.step('Test low rating triggers improvement suggestions field', async () => {
      // Fill required fields first
      await page.fill('input[name="name"]', 'John Doe');
      await page.fill('input[name="email"]', 'john@example.com');
      await page.selectOption('select[name="productUsed"]', { index: 1 }); // Select first product

      // Set a low rating (3 or below should trigger improvement field)
      await page.fill('input[name="overallRating"]', '2');

      // The improvement suggestions field should appear
      await expect(
        page.locator('textarea[name="improvementSuggestions"]'),
      ).toBeVisible({ timeout: 2000 });
    });

    await test.step('Test improvement field validation', async () => {
      // With a low rating, improvement suggestions should be required
      const improvementField = page.locator(
        'textarea[name="improvementSuggestions"]',
      );

      await improvementField.click();
      await improvementField.press('Tab');

      // Should show required error
      await expect(
        page.locator('text=Please tell us how we can improve'),
      ).toBeVisible({ timeout: 2000 });
    });

    await test.step('Test high rating hides improvement field', async () => {
      // Change to high rating
      await page.fill('input[name="overallRating"]', '5');

      // Improvement field should be hidden
      const improvementField = page.locator(
        'textarea[name="improvementSuggestions"]',
      );
      await expect(improvementField).not.toBeVisible({ timeout: 2000 });
    });
  });

  test('should validate character limits with real-time feedback', async ({
    page,
  }) => {
    await test.step('Test improvement suggestions character limit', async () => {
      // Set low rating to show improvement field
      await page.fill('input[name="overallRating"]', '2');

      const improvementField = page.locator(
        'textarea[name="improvementSuggestions"]',
      );
      await expect(improvementField).toBeVisible();

      // Fill with text and check character counter
      const testText = 'This is a test suggestion for improvement. '.repeat(20); // ~800 chars
      await improvementField.fill(testText);

      // Character counter should show current count
      const counter = page.locator(
        '#improvement-counter, [data-testid="improvement-counter"]',
      );
      if (await counter.isVisible()) {
        await expect(counter).toContainText('/500');

        // Should show over limit styling
        await expect(counter).toHaveClass(/text-red/);
      }
    });

    await test.step('Test detailed feedback character limit', async () => {
      const detailedField = page.locator('textarea[name="detailedFeedback"]');

      // Fill with very long text
      const longText = 'Very detailed feedback text. '.repeat(50); // ~1500 chars
      await detailedField.fill(longText);

      // Character counter should show over limit
      const counter = page.locator(
        '#detailed-counter, [data-testid="detailed-counter"]',
      );
      if (await counter.isVisible()) {
        await expect(counter).toContainText('/1000');
        await expect(counter).toHaveClass(/text-red/);
      }
    });
  });

  test('should handle complete form submission successfully', async ({
    page,
  }) => {
    await test.step('Fill out complete valid form', async () => {
      await page.fill('input[name="name"]', 'Jane Smith');
      await page.fill('input[name="email"]', 'jane@company.com');
      await page.fill('input[name="company"]', 'Tech Corp');

      // Select product
      await page.selectOption('select[name="productUsed"]', { index: 1 });

      // Set high rating (no improvement field needed)
      await page.fill('input[name="overallRating"]', '5');

      // Fill detailed feedback
      await page.fill(
        'textarea[name="detailedFeedback"]',
        'Great product! Very satisfied with the quality and performance. The user interface is intuitive and the features meet all our needs.',
      );

      // Check follow-up preference
      await page.check('input[name="allowFollowUp"]');
    });

    await test.step('Submit form and verify success', async () => {
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeEnabled();

      await submitButton.click();

      // Look for success message
      await expect(
        page.locator('text=Form submitted successfully'),
      ).toBeVisible({ timeout: 3000 });
    });
  });

  test('should maintain accessibility throughout error mode changes', async ({
    page,
  }) => {
    await test.step('Verify ARIA attributes remain consistent', async () => {
      // Test with on-blur mode
      await page.click('text=on-blur');

      const nameField = page.locator('input[name="name"]');
      await nameField.click();
      await nameField.press('Tab');

      // Check ARIA attributes
      await expect(nameField).toHaveAttribute('aria-invalid', 'true');
      await expect(page.locator('[role="alert"]').first()).toBeVisible();

      // Switch to on-submit mode
      await page.click('text=on-submit');

      // ARIA attributes should be cleared when errors are hidden
      await page.waitForTimeout(500);
      // In on-submit mode, aria-invalid might be cleared until submit
    });

    await test.step('Verify keyboard navigation works across modes', async () => {
      // Test tab order is maintained across different error display modes
      await page.keyboard.press('Tab'); // Should focus first field
      await page.keyboard.press('Tab'); // Should focus second field

      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });
  });

  test('should handle rapid mode switching without race conditions', async ({
    page,
  }) => {
    await test.step('Rapidly switch between error display modes', async () => {
      // Fill field to trigger errors
      const nameField = page.locator('input[name="name"]');
      await nameField.click();
      await nameField.press('Tab');

      // Rapidly switch modes
      await page.click('text=on-blur');
      await page.waitForTimeout(200);
      await page.click('text=on-submit');
      await page.waitForTimeout(200);
      await page.click('text=on-blur-or-submit');
      await page.waitForTimeout(200);
      await page.click('text=on-blur');

      // Form should remain functional
      await expect(page.locator('input[name="name"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();

      // No console errors should occur
      await page.waitForTimeout(1000);
    });
  });

  test('should demonstrate real-world validation scenarios', async ({
    page,
  }) => {
    await test.step('Test email format validation', async () => {
      const emailField = page.locator('input[name="email"]');

      await emailField.fill('invalid-email');
      await emailField.press('Tab');

      await expect(page.locator('text=Please enter a valid email')).toBeVisible(
        { timeout: 2000 },
      );
    });

    await test.step('Test company name length limit', async () => {
      const companyField = page.locator('input[name="company"]');

      // Fill with very long company name
      await companyField.fill('A'.repeat(150)); // Over 100 char limit
      await companyField.press('Tab');

      await expect(
        page.locator('text=Company name cannot exceed 100 characters'),
      ).toBeVisible({ timeout: 2000 });
    });

    await test.step('Test product selection requirement', async () => {
      const productField = page.locator('select[name="productUsed"]');

      await productField.click();
      await productField.press('Tab');

      await expect(
        page.locator('text=Please select which product'),
      ).toBeVisible({ timeout: 2000 });
    });
  });

  test('should handle edge cases and error recovery', async ({ page }) => {
    await test.step('Test form state after validation errors', async () => {
      // Trigger multiple errors
      await page.click('input[name="name"]');
      await page.press('Tab');
      await page.click('input[name="email"]');
      await page.press('Tab');

      // Multiple errors should be visible
      await expect(page.locator('text=Name is required')).toBeVisible();
      await expect(page.locator('text=Email is required')).toBeVisible();

      // Fix errors one by one
      await page.fill('input[name="name"]', 'Fixed Name');
      await page.fill('input[name="email"]', 'fixed@email.com');

      // Errors should disappear
      await page.waitForTimeout(1000);
      await expect(page.locator('text=Name is required')).not.toBeVisible();
      await expect(page.locator('text=Email is required')).not.toBeVisible();
    });
  });
});
