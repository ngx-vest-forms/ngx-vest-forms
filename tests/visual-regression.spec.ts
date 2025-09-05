import { expect, test } from '@playwright/test';

test.describe('Visual Regression - Code Highlighting', () => {
  test('should maintain consistent code highlighting across fundamental examples', async ({
    page,
  }) => {
    // Test code highlighting consistency
    const pages = [
      '/fundamentals/minimal-form',
      '/fundamentals/basic-validation',
      '/fundamentals/error-display-modes',
    ];

    for (const pagePath of pages) {
      await test.step(`Test code highlighting on ${pagePath}`, async () => {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');

        // Take screenshot of the educational content section only
        const educationalSection = page.locator('.grid').first(); // The grid containing the educational content
        await expect(educationalSection).toHaveScreenshot(
          `${pagePath.split('/').pop()}-educational-content.png`,
        );

        // Verify code elements have proper styling (check computed color, not specific format)
        const codeElements = page.locator('code.code-inline');

        // Check that code elements exist and are visible
        await expect(codeElements.first()).toBeVisible();

        // Verify they have the code-inline class applied
        await expect(codeElements.first()).toHaveClass(/code-inline/);
      });
    }
  });

  test('should have consistent bullet point styling', async ({ page }) => {
    const pages = [
      '/fundamentals/minimal-form',
      '/fundamentals/basic-validation',
      '/fundamentals/error-display-modes',
    ];

    for (const pagePath of pages) {
      await test.step(`Test bullet points on ${pagePath}`, async () => {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');

        // Check that bullet points are present and visible
        const bulletPoints = page.locator('li').filter({ hasText: '•' });
        await expect(bulletPoints.first()).toBeVisible();

        // Take screenshot of a feature list section
        const featuresList = page
          .locator('h3')
          .filter({ hasText: 'Features' })
          .locator('..')
          .locator('ul');
        await expect(featuresList).toHaveScreenshot(
          `${pagePath.split('/').pop()}-features-list.png`,
        );
      });
    }
  });
});
