import { expect, test } from '@playwright/test';
import {
  getMainContentSidebar,
  navigateToValidationConfigDemo,
} from '../../helpers/form-helpers';

test.describe('Validation Config Demo Page', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToValidationConfigDemo(page);
  });

  test('should render page layout and key sections', async ({ page }) => {
    const sidebar = getMainContentSidebar(page);

    await expect(
      page.getByRole('heading', { name: /validation config demo/i, level: 1 })
    ).toBeVisible();
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toContainText(/form value/i);
    await expect(sidebar).toContainText(/form state/i);
    await expect(sidebar.locator('span[aria-label="Pristine"]').first()).toBeVisible();

    await expect(
      page.getByRole('heading', {
        name: /bidirectional validation/i,
        level: 2,
      })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: /date range validation/i,
        level: 2,
      })
    ).toBeVisible();
  });
});
