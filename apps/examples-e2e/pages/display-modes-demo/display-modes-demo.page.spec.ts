import { expect, test } from '@playwright/test';
import { getMainContentSidebar } from '../../helpers/form-helpers';

test.describe('Display Modes Demo Page', () => {
  test('should render page layout and form-state sidebar', async ({ page }) => {
    const sidebar = getMainContentSidebar(page);

    await page.goto('/display-modes-demo');

    await expect(
      page.getByRole('heading', { name: /display modes demo/i, level: 1 })
    ).toBeVisible();
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toContainText(/form value/i);
    await expect(sidebar).toContainText(/form state/i);
    await expect(
      sidebar.locator('span[aria-label="Pristine"]').first()
    ).toBeVisible();
  });
});
