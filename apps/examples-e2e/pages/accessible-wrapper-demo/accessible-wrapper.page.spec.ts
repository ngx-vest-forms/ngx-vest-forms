import { expect, test } from '@playwright/test';

test.describe('Accessible Wrapper Demo Page', () => {
  test('should render the accessible-wrapper demo shell', async ({ page }) => {
    await page.goto('/accessible-wrapper');

    await expect(
      page.getByRole('heading', {
        name: /accessible custom wrapper/i,
        level: 1,
      })
    ).toBeVisible();
    await expect(
      page.getByRole('textbox', { name: /preferred name/i })
    ).toBeVisible();
    await expect(
      page.getByRole('searchbox', { name: /search query/i })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /clear search query/i })
    ).toBeVisible();
  });
});
