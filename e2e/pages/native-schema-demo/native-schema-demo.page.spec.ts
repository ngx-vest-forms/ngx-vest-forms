import { expect, test } from '@playwright/test';

test.describe('Native Schema Demo Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/native-schema-demo');
  });

  test('should render page layout and form-state sidebar', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /Native Vest Schema Demo/i, level: 1 })
    ).toBeVisible();
    await expect(page.locator('aside')).toBeVisible();
    await expect(page.locator('aside')).toContainText(/form value/i);
    await expect(page.locator('aside')).toContainText(/form state/i);
    await expect(
      page.locator('aside span[aria-label="Pristine"]').first()
    ).toBeVisible();
  });
});
