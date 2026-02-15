import { expect, test } from '@playwright/test';
import { navigateToPurchaseForm } from '../../helpers/form-helpers';

test.describe('Purchase Page', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToPurchaseForm(page);
  });

  test('should render page layout and form-state sidebar', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /purchase form/i, level: 1 })
    ).toBeVisible();
    await expect(page.locator('aside')).toBeVisible();
    await expect(page.locator('aside')).toContainText(/form value/i);
    await expect(page.locator('aside')).toContainText(/form state/i);
  });
});
