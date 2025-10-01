import { expect, test } from '@playwright/test';

test.describe('Content Accessibility - Educational Sections', () => {
  test('should have accessible content structure across all fundamental examples', async ({
    page,
  }) => {
    const examples = [
      '/fundamentals/minimal-form',
      '/fundamentals/basic-validation',
      '/fundamentals/error-display-modes',
      '/fundamentals/form-arrays',
      '/fundamentals/nested-forms',
    ];

    for (const examplePath of examples) {
      await test.step(`Test accessibility on ${examplePath}`, async () => {
        await page.goto(examplePath);
        await page.waitForLoadState('networkidle');

        const cards = page.locator('ngx-example-cards').first();
        await expect(cards).toBeVisible();

        const sectionHeadings = cards.locator('h3');
        await expect(sectionHeadings.first()).toBeVisible();

        const listItems = cards.locator('li');
        await expect(listItems.first()).toBeVisible();
        await expect(listItems.first()).toContainText('•');

        const codeElements = listItems.locator('code');
        await expect(codeElements.first()).toBeVisible();
        await expect(codeElements.first()).toHaveClass(/code-inline/);

        const strongElements = listItems.locator('strong');
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
      '/fundamentals/minimal-form',
      '/fundamentals/basic-validation',
      '/fundamentals/error-display-modes',
      '/fundamentals/form-arrays',
      '/fundamentals/nested-forms',
    ];

    for (const examplePath of examples) {
      await test.step(`Test content patterns on ${examplePath}`, async () => {
        await page.goto(examplePath);
        await page.waitForLoadState('networkidle');

        const cards = page.locator('ngx-example-cards').first();
        await expect(cards).toBeVisible();

        // Only get list items that are feature descriptions (contain bullet points)
        // Exclude validation error lists from the debugger
        const featureItems = cards.locator('li').filter({ hasText: '•' });
        const itemCount = await featureItems.count();
        expect(itemCount).toBeGreaterThan(0);

        // Verify each feature has the bullet point + strong + code pattern
        for (let index = 0; index < itemCount; index++) {
          const item = featureItems.nth(index);
          await expect(item).toContainText('•');
          await expect(item.locator('strong')).toBeVisible();
          const codeSegments = item.locator('code');
          if ((await codeSegments.count()) > 0) {
            await expect(codeSegments.first()).toBeVisible();
            await expect(codeSegments.first()).toHaveClass(/code-inline/);
          }
        }
      });
    }
  });
});
