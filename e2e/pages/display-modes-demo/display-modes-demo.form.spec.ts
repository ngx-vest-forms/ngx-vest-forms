import { expect, test } from '@playwright/test';

test.describe('Display Modes Demo Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/display-modes-demo');
    await expect(
      page.getByRole('heading', { name: /display modes demo/i, level: 1 })
    ).toBeVisible();
  });

  test('should validate fields across configured display modes', async ({
    page,
  }) => {
    const alwaysError = page.getByLabel(/username \(always mode\)/i);
    const touchWarning = page.getByLabel(/username \(on-touch warning\)/i);

    await alwaysError.focus();
    await alwaysError.blur();
    await expect(
      page.getByText(/this field is required/i).first()
    ).toBeVisible();

    await touchWarning.fill('abc');
    await touchWarning.blur();
    await expect(
      page.getByText(/username should be at least 5 characters/i).first()
    ).toBeVisible();
  });
});
