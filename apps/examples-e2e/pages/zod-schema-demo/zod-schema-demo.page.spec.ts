import { expect, test } from '@playwright/test';
import { getMainContentSidebar } from '../../helpers/form-helpers';

test.describe('Zod Schema Demo Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/zod-schema-demo');
  });

  test('should render page layout and form-state sidebar', async ({ page }) => {
    const sidebar = getMainContentSidebar(page);

    await expect(
      page.getByRole('heading', { name: /Zod Schema Demo/i, level: 1 })
    ).toBeVisible();
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toContainText(/form value/i);
    await expect(sidebar).toContainText(/form state/i);
    await expect(
      sidebar.locator('span[aria-label="Pristine"]').first()
    ).toBeVisible();
  });

  test('should explain the contract/rules split and link to the native schema demo', async ({
    page,
  }) => {
    await expect(page.getByText('Zod describes the structure.')).toBeVisible();
    await expect(page.getByText('Vest owns the rules.')).toBeVisible();

    const link = page.getByRole('link', { name: 'Native Vest Schema demo' });
    await expect(link).toHaveAttribute('href', '/native-schema-demo');
    await link.click();
    await expect(page).toHaveURL(/\/native-schema-demo$/);
  });
});
