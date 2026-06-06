import { expect, test } from '@playwright/test';

test.describe('Custom Controls Page', () => {
  test('should render the custom controls layout', async ({ page }) => {
    await page.goto('/custom-controls', { waitUntil: 'domcontentloaded' });

    await expect(
      page.getByRole('heading', {
        name: /custom controls \(controlvalueaccessor\)/i,
        level: 1,
      })
    ).toBeVisible();

    const contentAside = page
      .getByRole('complementary')
      .filter({ hasText: /why this works/i });
    await expect(contentAside).toBeVisible();
    await expect(contentAside).toContainText(/form state/i);
    await expect(contentAside).toContainText(/form value/i);

    await expect(
      page.getByRole('radiogroup', { name: /rating/i })
    ).toBeVisible();
    await expect(
      page.getByRole('radiogroup', { name: /experience level/i })
    ).toBeVisible();
    await expect(page.getByLabel(/add a tag/i)).toBeVisible();
  });
});
