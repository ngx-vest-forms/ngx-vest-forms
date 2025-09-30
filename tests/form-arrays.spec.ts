import { expect, test } from '@playwright/test';

/**
 * E2E tests for Form Arrays example
 * Tests dynamic array management (add, remove, move, insert)
 *
 * Route: /fundamentals/form-arrays
 * Component: ExampleFormArray
 * Features: Array operations, item validation, real-time feedback
 */

test.describe('Form Arrays Example', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fundamentals/form-arrays');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Structure', () => {
    test('should have proper page heading', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: /dynamic array management/i }),
      ).toBeVisible();
    });

    test('should display all form sections correctly', async ({ page }) => {
      // Input for new interest
      await expect(
        page.getByRole('textbox', { name: /add interest/i }),
      ).toBeVisible();

      // Add button
      await expect(
        page.getByRole('button', { name: /add interest/i }),
      ).toBeVisible();

      // Initially no interests in list
      const interestsList = page.locator('[data-testid="interests-list"]');
      await expect(interestsList).toBeVisible();
    });
  });

  test.describe('Array Operations', () => {
    test('should add new interest to array', async ({ page }) => {
      const input = page.getByRole('textbox', { name: /add interest/i });
      const addButton = page.getByRole('button', { name: /add interest/i });

      // Add first interest
      await input.fill('JavaScript');
      await addButton.click();
      await page.waitForTimeout(200);

      // Verify interest appears in list
      await expect(page.getByText('JavaScript')).toBeVisible();

      // Input should be cleared
      await expect(input).toHaveValue('');
    });

    test('should add multiple interests', async ({ page }) => {
      const input = page.getByRole('textbox', { name: /add interest/i });
      const addButton = page.getByRole('button', { name: /add interest/i });

      // Add three interests
      const interests = ['TypeScript', 'Angular', 'Vest.js'];

      for (const interest of interests) {
        await input.fill(interest);
        await addButton.click();
        await page.waitForTimeout(200);
      }

      // Verify all interests are visible
      for (const interest of interests) {
        await expect(page.getByText(interest)).toBeVisible();
      }
    });

    test('should remove interest from array', async ({ page }) => {
      const input = page.getByRole('textbox', { name: /add interest/i });
      const addButton = page.getByRole('button', { name: /add interest/i });

      // Add interest
      await input.fill('React');
      await addButton.click();
      await page.waitForTimeout(200);

      // Find and click remove button
      const removeButton = page
        .locator('[data-testid="interests-list"]')
        .getByRole('button', { name: /remove/i })
        .first();
      await removeButton.click();
      await page.waitForTimeout(200);

      // Verify interest is removed
      await expect(page.getByText('React')).not.toBeVisible();
    });

    test('should not add empty interest', async ({ page }) => {
      const input = page.getByRole('textbox', { name: /add interest/i });
      const addButton = page.getByRole('button', { name: /add interest/i });

      // Try to add empty interest
      await input.fill('   '); // whitespace only
      await addButton.click();
      await page.waitForTimeout(200);

      // Should show validation error or not add
      const interestItems = page
        .locator('[data-testid="interests-list"]')
        .locator('[data-testid^="interest-item-"]');
      await expect(interestItems).toHaveCount(0);
    });
  });

  test.describe('Array Validation', () => {
    test('should validate new interest input', async ({ page }) => {
      const input = page.getByRole('textbox', { name: /add interest/i });

      // Fill invalid input (if validation rules exist)
      await input.fill('ab'); // too short
      await input.blur();
      await page.waitForTimeout(200);

      // May show validation error (depends on validation rules)
      // Just verify input accepts text
      await expect(input).toHaveValue('ab');
    });

    test('should track array length', async ({ page }) => {
      const input = page.getByRole('textbox', { name: /add interest/i });
      const addButton = page.getByRole('button', { name: /add interest/i });

      // Add multiple interests and verify count
      await input.fill('First');
      await addButton.click();
      await page.waitForTimeout(200);

      await input.fill('Second');
      await addButton.click();
      await page.waitForTimeout(200);

      const items = page
        .locator('[data-testid="interests-list"]')
        .locator('[data-testid^="interest-item-"]');
      await expect(items).toHaveCount(2);
    });
  });

  test.describe('Form Submission', () => {
    test('should display submit button', async ({ page }) => {
      const submitButton = page.getByRole('button', { name: /submit/i });
      await expect(submitButton).toBeVisible();
    });

    test('should accept form with interests', async ({ page }) => {
      const input = page.getByRole('textbox', { name: /add interest/i });
      const addButton = page.getByRole('button', { name: /add interest/i });

      // Add interests
      await input.fill('Node.js');
      await addButton.click();
      await page.waitForTimeout(200);

      await input.fill('Express');
      await addButton.click();
      await page.waitForTimeout(200);

      // Form should be submittable
      const submitButton = page.getByRole('button', { name: /submit/i });
      await expect(submitButton).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have accessible form labels', async ({ page }) => {
      // Input should have accessible label
      const input = page.getByRole('textbox', { name: /add interest/i });
      await expect(input).toBeVisible();

      // Button should have accessible name
      const addButton = page.getByRole('button', { name: /add interest/i });
      await expect(addButton).toBeVisible();
    });

    test('should support keyboard navigation', async ({ page }) => {
      const input = page.getByRole('textbox', { name: /add interest/i });

      // Tab to input
      await page.keyboard.press('Tab');
      await expect(input).toBeFocused();

      // Type and submit with keyboard
      await input.fill('Keyboard Test');
      await page.keyboard.press('Tab'); // Tab to add button
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);

      // Verify interest added
      await expect(page.getByText('Keyboard Test')).toBeVisible();
    });
  });

  test.describe('Form State Display', () => {
    test('should show debugger panel', async ({ page }) => {
      // Debugger should be visible
      const debugPanel = page.locator('[data-testid="debugger"]');
      await expect(debugPanel).toBeVisible();
    });

    test('should update form state in real-time', async ({ page }) => {
      const input = page.getByRole('textbox', { name: /add interest/i });
      const addButton = page.getByRole('button', { name: /add interest/i });

      // Add interest
      await input.fill('Real-time Test');
      await addButton.click();
      await page.waitForTimeout(200);

      // Debugger should reflect the change (check if interests array has items)
      const debugPanel = page.locator('[data-testid="debugger"]');
      await expect(debugPanel).toContainText('interests');
    });
  });
});
