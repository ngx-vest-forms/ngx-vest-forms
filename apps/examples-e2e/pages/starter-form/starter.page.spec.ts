import { expect, test } from '@playwright/test';

test.describe('Starter Form Page', () => {
  test('should render the starter demo shell', async ({ page }) => {
    await page.goto('/starter');

    await expect(
      page.getByRole('heading', { name: /starter contact form/i, level: 1 })
    ).toBeVisible();
    await expect(page.getByRole('textbox', { name: /^name$/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /^email$/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /subject/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /message/i })).toBeVisible();
  });
});
