import { expect, test } from '@playwright/test';

test.describe('Wizard Form Page', () => {
  test('should render wizard page layout and step navigation', async ({
    page,
  }) => {
    await page.goto('/wizard');

    await expect(
      page.getByRole('heading', { name: /multi-form wizard/i, level: 1 })
    ).toBeVisible();

    await expect(page.locator('ngx-wizard-steps nav')).toBeVisible();
    await expect(page.locator('aside')).toBeVisible();
    await expect(page.locator('aside')).toContainText(/form value/i);
  });
});
