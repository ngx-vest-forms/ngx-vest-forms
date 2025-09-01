import { expect, test } from '@playwright/test';

test.describe('Content Accessibility - Educational Sections', () => {
  test('should have accessible content structure across all fundamental examples', async ({
    page,
  }) => {
    const examples = [
      '/fundamentals/minimal-form',
      '/fundamentals/basic-validation',
      '/fundamentals/error-display-modes',
    ];

    for (const examplePath of examples) {
      await test.step(`Test accessibility on ${examplePath}`, async () => {
        await page.goto(examplePath);
        await page.waitForLoadState('networkidle');

        // Verify educational sections have proper heading structure
        const featuresHeading = page.getByRole('heading', {
          name: /ngx-vest-forms Features/i,
        });
        await expect(featuresHeading).toBeVisible();

        // Verify it's an h3 element (level 3)
        await expect(featuresHeading.locator('xpath=self::h3')).toBeAttached();

        // Verify feature lists have proper structure with bullet points
        const featuresList = featuresHeading.locator('..').locator('ul');
        await expect(featuresList).toBeVisible();

        // Check for bullet points in list items
        const listItems = featuresList.locator('li');
        await expect(listItems.first()).toContainText('•');

        // Verify code elements are properly highlighted
        const codeElements = featuresList.locator('code.code-inline');
        await expect(codeElements.first()).toBeVisible();
        await expect(codeElements.first()).toHaveClass(/code-inline/);

        // Verify strong elements for emphasis
        const strongElements = featuresList.locator('strong');
        await expect(strongElements.first()).toBeVisible();

        // Check for proper landmark structure
        await expect(page.getByRole('main')).toBeVisible();

        // Verify navigation landmarks
        await expect(
          page.getByRole('navigation', { name: /primary/i }),
        ).toBeVisible();
        await expect(
          page.getByRole('navigation', { name: /section/i }),
        ).toBeVisible();
      });
    }
  });

  test('should have consistent content patterns across examples', async ({
    page,
  }) => {
    const examples = [
      { path: '/fundamentals/minimal-form', expectedFeatures: 5 },
      { path: '/fundamentals/basic-validation', expectedFeatures: 5 },
      { path: '/fundamentals/error-display-modes', expectedFeatures: 5 },
    ];

    for (const example of examples) {
      await test.step(`Test content patterns on ${example.path}`, async () => {
        await page.goto(example.path);
        await page.waitForLoadState('networkidle');

        // Verify consistent number of features listed
        const featuresSection = page
          .getByRole('heading', { name: /ngx-vest-forms Features/i })
          .locator('..');
        const featureItems = featuresSection.locator('li');
        await expect(featureItems).toHaveCount(example.expectedFeatures);

        // Verify each feature has the bullet point + strong + code pattern
        for (let index = 0; index < example.expectedFeatures; index++) {
          const item = featureItems.nth(index);
          await expect(item).toContainText('•');
          await expect(item.locator('strong')).toBeVisible();
          await expect(item.locator('code')).toBeVisible();
        }
      });
    }
  });
});
