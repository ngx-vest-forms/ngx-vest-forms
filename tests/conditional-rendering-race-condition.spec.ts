import { expect, test } from '@playwright/test';

test.describe('Angular 20.2 Race Condition Fix', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200/fundamentals/error-display-modes');
  });

  test('should handle conditional field rendering without race conditions', async ({
    page,
  }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Find the rating number input field
    await page.waitForSelector('input[name="overallRating"]');

    // Set a low rating (2) to trigger conditional field rendering
    await page.fill('input[name="overallRating"]', '2');

    // Wait for the conditional field to appear
    await page.waitForSelector('textarea[name="improvementSuggestions"]', {
      state: 'visible',
    });

    // Verify the conditional field is visible and functional
    const improvementField = page.locator(
      'textarea[name="improvementSuggestions"]',
    );
    await expect(improvementField).toBeVisible();

    // Test that we can interact with the conditional field
    await improvementField.fill('The product could be more user-friendly');

    // Verify the character counter is working (testing the race condition fix)
    const charCounter = page.locator('#improvement-counter');
    await expect(charCounter).toContainText('39/500'); // 39 characters in the text above

    // Change to a high rating (5) to hide the conditional field
    await page.fill('input[name="overallRating"]', '5');

    // Wait for the conditional field to disappear
    await page.waitForSelector('textarea[name="improvementSuggestions"]', {
      state: 'hidden',
    });

    // Verify the field is no longer visible
    await expect(improvementField).not.toBeVisible();
  });

  test('should handle rapid rating changes without race conditions', async ({
    page,
  }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    const ratingInput = page.locator('input[name="overallRating"]');

    // Rapidly change between low and high ratings to test race conditions
    await ratingInput.fill('1'); // Show conditional field
    await ratingInput.fill('5'); // Hide conditional field
    await ratingInput.fill('2'); // Show conditional field
    await ratingInput.fill('4'); // Hide conditional field
    await ratingInput.fill('3'); // Show conditional field

    // Wait for the DOM to stabilize
    await page.waitForTimeout(500);

    // After rating 3, the improvement field should be visible
    const improvementField = page.locator(
      'textarea[name="improvementSuggestions"]',
    );
    await expect(improvementField).toBeVisible();

    // Verify we can interact with it without errors
    await improvementField.fill('Needs improvement in user experience');

    // Check that the character counter is functioning properly
    const charCounter = page.locator('#improvement-counter');
    await expect(charCounter).toContainText('/500');
  });

  test('should not show conditional field for high ratings', async ({
    page,
  }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Set a high rating (5) that should not trigger the conditional field
    await page.fill('input[name="overallRating"]', '5');

    // Wait a moment for any potential rendering
    await page.waitForTimeout(500);

    // Verify the improvement suggestions field is not visible
    const improvementField = page.locator(
      'textarea[name="improvementSuggestions"]',
    );
    await expect(improvementField).not.toBeVisible();

    // Set rating to 4 (also should not show conditional field)
    await page.fill('input[name="overallRating"]', '4');
    await page.waitForTimeout(500);

    // Still should not be visible
    await expect(improvementField).not.toBeVisible();
  });
});
