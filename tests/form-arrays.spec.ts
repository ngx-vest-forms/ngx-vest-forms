import { expect, test } from '@playwright/test';

/**
 * E2E tests for Form Arrays example
 * Tests dynamic array management (add, remove, edit) with validation
 *
 * Route: /fundamentals/form-arrays
 * Component: ExampleFormArray
 * Features: Array operations, item validation, real-time error feedback
 */

test.describe('Form Arrays Example', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fundamentals/form-arrays');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Structure', () => {
    test('should have proper page heading and structure', async ({ page }) => {
      await expect(
        page.getByRole('heading', {
          name: /Form Arrays - Dynamic Collections/i,
        }),
      ).toBeVisible();

      // Input for new interest
      await expect(
        page.getByRole('textbox', { name: /add.*interest/i }),
      ).toBeVisible();

      // Add button
      await expect(
        page.getByRole('button', { name: /add interest/i }),
      ).toBeVisible();

      // Form should start valid with no errors
      await expect(page.getByText(/No validation errors/i)).toBeVisible();
    });
  });

  test.describe('Validation Behavior', () => {
    test('should show error when clicking Add Interest with empty field', async ({
      page,
    }) => {
      const addButton = page.getByRole('button', { name: /add interest/i });

      // Click add with empty input
      await addButton.click();

      // Error message should appear
      await expect(page.getByRole('alert')).toContainText(
        /interest cannot be empty/i,
      );

      // Form should still be valid (addInterest is not part of form model)
      await expect(page.getByText(/Valid: ✅/i)).toBeVisible();
    });

    test('should clear error after successfully adding interest', async ({
      page,
    }) => {
      const input = page.getByRole('textbox', { name: /add.*interest/i });
      const addButton = page.getByRole('button', { name: /add interest/i });

      // First trigger error by clicking with empty field
      await addButton.click();
      await expect(page.getByRole('alert')).toContainText(
        /interest cannot be empty/i,
      );

      // Then type valid value and add
      await input.fill('Photography');
      await addButton.click();

      // Error should be hidden (no alert element)
      await expect(page.getByRole('alert')).not.toBeVisible();

      // Interest should be added to list
      await expect(
        page.getByRole('textbox', { name: /Interest 1/i }),
      ).toHaveValue('Photography');

      // Input should be cleared and focused for next entry
      await expect(input).toHaveValue('');
      await expect(input).toBeFocused();
    });

    test('should validate interest input', async ({ page }) => {
      const input = page.getByRole('textbox', { name: /add.*interest/i });
      const addButton = page.getByRole('button', { name: /add interest/i });

      // Valid input with exactly 2 characters (minimum) should work
      await input.fill('AB');
      await addButton.click();

      // Should successfully add
      await expect(
        page.getByRole('textbox', { name: /Interest 1/i }),
      ).toHaveValue('AB');

      // Verify input is cleared for next entry
      await expect(input).toHaveValue('');
    });
  });

  test.describe('Array Operations', () => {
    test('should add new interest to array and maintain form validity', async ({
      page,
    }) => {
      const addButton = page.getByRole('button', { name: /add interest/i });
      const input = page.getByRole('textbox', {
        name: /add a new interest/i,
      });

      // Add a valid interest
      await input.fill('Reading');
      await addButton.click();

      // Input should be cleared and focused
      await expect(input).toHaveValue('');
      await expect(input).toBeFocused();

      // Interest should appear in the list
      await expect(
        page.getByRole('textbox', { name: /interest 1/i }),
      ).toHaveValue('Reading');

      // Form should be valid after adding (bug fix: changed isValid() to !hasErrors())
      await expect(page.getByText(/Valid: ✅/i)).toBeVisible();
    });

    test('should add multiple interests sequentially', async ({ page }) => {
      const input = page.getByRole('textbox', { name: /add.*interest/i });
      const addButton = page.getByRole('button', { name: /add interest/i });

      // Add three interests
      const interests = ['TypeScript', 'Angular', 'Vest.js'];

      for (const interest of interests) {
        await input.fill(interest);
        await addButton.click();
      }

      // Verify all interests are in the list
      await expect(
        page.getByRole('textbox', { name: /Interest 1/i }),
      ).toHaveValue('TypeScript');
      await expect(
        page.getByRole('textbox', { name: /Interest 2/i }),
      ).toHaveValue('Angular');
      await expect(
        page.getByRole('textbox', { name: /Interest 3/i }),
      ).toHaveValue('Vest.js');
    });

    test('should remove interest from array', async ({ page }) => {
      const input = page.getByRole('textbox', { name: /add.*interest/i });
      const addButton = page.getByRole('button', { name: /add interest/i });

      // Add two interests
      await input.fill('Cooking');
      await addButton.click();
      await input.fill('Travel');
      await addButton.click();

      // Verify both are added
      await expect(
        page.getByRole('textbox', { name: /Interest 1/i }),
      ).toHaveValue('Cooking');
      await expect(
        page.getByRole('textbox', { name: /Interest 2/i }),
      ).toHaveValue('Travel');

      // Click remove button for first interest
      await page
        .getByRole('button', { name: /Remove interest Cooking/i })
        .click();

      // Verify first interest is removed and second moved up
      await expect(
        page.getByRole('textbox', { name: /Interest 1/i }),
      ).toHaveValue('Travel');
      await expect(
        page.getByRole('textbox', { name: /Interest 2/i }),
      ).not.toBeVisible();

      // Form model should update
      await expect(
        page.locator('code').filter({ hasText: 'interests' }),
      ).toContainText('Travel');
    });

    test('should show empty state when all interests are removed', async ({
      page,
    }) => {
      const input = page.getByRole('textbox', { name: /add.*interest/i });
      const addButton = page.getByRole('button', { name: /add interest/i });

      // Add one interest
      await input.fill('Music');
      await addButton.click();

      // Remove it
      await page
        .getByRole('button', { name: /Remove interest Music/i })
        .click();

      // Empty state message should appear
      await expect(page.getByText(/No interests added yet/i)).toBeVisible();
    });

    test('should allow inline editing of interests', async ({ page }) => {
      const input = page.getByRole('textbox', { name: /add.*interest/i });
      const addButton = page.getByRole('button', { name: /add interest/i });

      // Add interest
      await input.fill('Reading');
      await addButton.click();

      // Edit the interest inline
      const interestInput = page.getByRole('textbox', { name: /Interest 1/i });
      await interestInput.click();
      await interestInput.clear();
      await interestInput.fill('Books and Literature');

      // Verify the model updates
      await expect(interestInput).toHaveValue('Books and Literature');
      await expect(
        page.locator('code').filter({ hasText: 'interests' }),
      ).toContainText('Books and Literature');
    });
  });

  test.describe('Form Submission', () => {
    test('should handle form submission with interests', async ({ page }) => {
      const input = page.getByRole('textbox', { name: /add.*interest/i });
      const addButton = page.getByRole('button', { name: /add interest/i });

      // Add some interests
      await input.fill('Programming');
      await addButton.click();
      await input.fill('Reading');
      await addButton.click();

      // Submit form (bug fix: form should now be valid and button enabled)
      await page.getByRole('button', { name: /submit/i }).click();

      // Form should be processed (check for success state or navigation)
      // This depends on your implementation
    });
  });

  test.describe('Accessibility', () => {
    test('should have accessible form labels and ARIA attributes', async ({
      page,
    }) => {
      // Input should have accessible label
      const input = page.getByRole('textbox', { name: /add.*interest/i });
      await expect(input).toBeVisible();

      // Button should have accessible name
      const addButton = page.getByRole('button', { name: /add interest/i });
      await expect(addButton).toBeVisible();

      // Test error aria attributes
      await addButton.click();
      const errorAlert = page.getByRole('alert');
      await expect(errorAlert).toContainText(/interest cannot be empty/i);

      // Input should have aria-invalid when error is shown
      await expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    test('should support keyboard navigation', async ({ page }) => {
      const input = page.getByRole('textbox', { name: /add.*interest/i });

      // Type and submit with keyboard
      await input.fill('Keyboard Test');
      await page.keyboard.press('Tab'); // Tab to add button
      await page.keyboard.press('Enter');

      // Verify interest added
      await expect(
        page.getByRole('textbox', { name: /Interest 1/i }),
      ).toHaveValue('Keyboard Test');
    });
  });
});
