import { expect, test } from '@playwright/test';

/**
 * E2E Test: Race Condition Fix for Conditional Forms
 *
 * This test verifies that the infinite error loop bug has been fixed.
 * The bug occurred when conditional form fields appeared and templates
 * tried to access .length on potentially undefined error arrays.
 *
 * Reproduces the exact production scenario from the bug report.
 */
test.describe('Race Condition Fix - Error Display Modes', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the page that had the infinite loop bug
    await page.goto('/fundamentals/error-display-modes');
  });

  test('should handle conditional improvement field without infinite loops', async ({
    page,
  }) => {
    await test.step('Set rating to trigger conditional field', async () => {
      // Find the overall rating field and set it to 3 to trigger the conditional "improvement" field
      const ratingField = page.locator('input[name="overallRating"]');
      await ratingField.fill('3');
      await ratingField.press('Tab');
    });

    await test.step('Verify conditional field appears without errors', async () => {
      // The conditional "What could we improve?" field should appear
      const improvementField = page.locator('textarea[name="improvement"]');
      await expect(improvementField).toBeVisible({ timeout: 3000 });
    });

    await test.step('Interact with conditional field to trigger validation', async () => {
      const improvementField = page.locator('textarea[name="improvement"]');

      // Click and blur to trigger validation (which previously caused infinite loops)
      await improvementField.click();
      await improvementField.press('Tab');

      // Wait a moment to ensure no infinite loops occur
      await page.waitForTimeout(1000);
    });

    await test.step('Verify error display works correctly', async () => {
      // Since the improvement field is empty and required for low ratings,
      // an error should appear WITHOUT causing infinite loops
      const errorMessage = page
        .locator('text=Please tell us how we can improve')
        .first();
      await expect(errorMessage).toBeVisible({ timeout: 2000 });
    });

    await test.step('Test rating changes handle conditional field properly', async () => {
      const ratingField = page.locator('input[name="overallRating"]');
      const improvementField = page.locator('textarea[name="improvement"]');

      // Change rating to 5 (should hide improvement field)
      await ratingField.fill('5');
      await expect(improvementField).not.toBeVisible({ timeout: 2000 });

      // Change back to 2 (should show improvement field again)
      await ratingField.fill('2');
      await expect(improvementField).toBeVisible({ timeout: 2000 });

      // This rapid toggling previously caused race conditions
      await ratingField.fill('4');
      await ratingField.fill('1');
      await expect(improvementField).toBeVisible({ timeout: 2000 });
    });

    await test.step('Verify no console errors occurred', async () => {
      // Listen for console errors during the test
      const consoleErrors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') {
          consoleErrors.push(message.text());
        }
      });

      // Trigger one more validation cycle to ensure stability
      const improvementField = page.locator('textarea[name="improvement"]');
      await improvementField.click();
      await improvementField.press('Tab');
      await page.waitForTimeout(500);

      // No console errors should have occurred
      expect(
        consoleErrors.filter(
          (error) =>
            error.includes('Cannot read properties of undefined') ||
            error.includes('ExpressionChangedAfterItHasBeenCheckedError'),
        ),
      ).toHaveLength(0);
    });
  });

  test('should handle multiple conditional fields without race conditions', async ({
    page,
  }) => {
    await test.step('Trigger multiple conditional scenarios', async () => {
      const ratingField = page.locator('input[name="overallRating"]');

      // Rapidly trigger different conditional states
      const scenarios = [3, 5, 1, 4, 2];

      for (const rating of scenarios) {
        await ratingField.fill(String(rating));
        await page.waitForTimeout(200); // Brief pause between changes

        // Check if improvement field visibility matches rating
        const improvementField = page.locator('textarea[name="improvement"]');
        const shouldBeVisible = rating <= 3;

        await (shouldBeVisible
          ? expect(improvementField).toBeVisible()
          : expect(improvementField).not.toBeVisible());
      }
    });

    await test.step('Verify form remains functional', async () => {
      // Set to a low rating one final time
      await page.locator('input[name="overallRating"]').fill('1');

      // Fill out the improvement field
      const improvementField = page.locator('textarea[name="improvement"]');
      await improvementField.fill('The service could be faster');

      // Blur to trigger validation
      await improvementField.press('Tab');

      // Error should disappear since field now has content
      await expect(
        page.locator('text=Please tell us how we can improve'),
      ).not.toBeVisible({ timeout: 2000 });
    });
  });
});
