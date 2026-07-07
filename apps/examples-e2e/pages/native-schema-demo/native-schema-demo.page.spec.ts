import { expect, test } from '@playwright/test';
import { getMainContentSidebar } from '../../helpers/form-helpers';

test.describe('Native Schema Demo Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/native-schema-demo');
  });

  test('should render page layout and form-state sidebar', async ({ page }) => {
    const sidebar = getMainContentSidebar(page);

    await expect(
      page.getByRole('heading', { name: /Native Vest Schema Demo/i, level: 1 })
    ).toBeVisible();
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toContainText(/form value/i);
    await expect(sidebar).toContainText(/form state/i);
    await expect(
      sidebar.locator('span[aria-label="Pristine"]').first()
    ).toBeVisible();
  });
});
