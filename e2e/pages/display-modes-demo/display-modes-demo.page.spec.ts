import { expect, test } from '@playwright/test';

test.describe('Display Modes Demo Page', () => {
  test('should render page layout and form-state sidebar', async ({ page }) => {
    await page.goto('/display-modes-demo');

    await expect(
      page.getByRole('heading', { name: /display modes demo/i, level: 1 })
    ).toBeVisible();
    await expect(page.locator('aside')).toBeVisible();
    await expect(page.locator('aside')).toContainText(/form value/i);
    await expect(page.locator('aside')).toContainText(/form state/i);
  });
});
