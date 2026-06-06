import { expect, test } from '@playwright/test';
import {
  getMainContentSidebar,
  navigateToPurchaseForm,
} from '../../helpers/form-helpers';

test.describe('Purchase Page', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToPurchaseForm(page);
  });

  test('should render page layout and form-state sidebar', async ({ page }) => {
    const sidebar = getMainContentSidebar(page);

    await expect(
      page.getByRole('heading', { name: /purchase form/i, level: 1 })
    ).toBeVisible();
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toContainText(/form value/i);
    await expect(sidebar).toContainText(/form state/i);
    await expect(sidebar.locator('span[aria-label="Pristine"]').first()).toBeVisible();
    await expect(
      page.getByRole('button', { name: /fetch luke/i })
    ).toBeVisible();
    await expect(
      page.getByRole('combobox', { name: /response mode/i })
    ).toBeVisible();
  });
});
