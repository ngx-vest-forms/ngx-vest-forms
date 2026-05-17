import { expect, test } from '@playwright/test';

test.describe('Conditional Structure Demo Page', () => {
  test('should render the conditional-structure demo shell', async ({ page }) => {
    await page.goto('/conditional-structure');

    await expect(
      page.getByRole('heading', {
        name: /conditional structure & field clearing/i,
        level: 1,
      })
    ).toBeVisible();
    await expect(
      page.getByRole('textbox', { name: /contact name/i })
    ).toBeVisible();
    await expect(
      page.getByRole('combobox', { name: /delivery method/i })
    ).toBeVisible();
    await expect(page.getByText(/relevant payload/i)).toBeVisible();
  });
});
