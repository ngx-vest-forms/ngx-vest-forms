import { expect, test } from '@playwright/test';

test.describe('App Page', () => {
  test('should load the application shell', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/examples/i);
    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(
      page.getByRole('link', { name: /skip to main content/i })
    ).toBeVisible();
  });

  test('should render all page navigation links', async ({ page }) => {
    await page.goto('/');

    await expect(
      page.getByRole('link', { name: /purchase form/i })
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /business hours form/i })
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /validation\s*config demo/i })
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /multi-form wizard/i })
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /display modes demo/i })
    ).toBeVisible();
  });
});
