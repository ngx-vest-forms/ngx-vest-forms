import { expect, test } from '@playwright/test';
import { getMainContentSidebar } from '../../helpers/form-helpers';

test.describe('Wizard Form Page', () => {
  test('should render wizard page layout and step navigation', async ({
    page,
  }) => {
    const sidebar = getMainContentSidebar(page);

    await page.goto('/wizard');

    await expect(
      page.getByRole('heading', { name: /multi-form wizard/i, level: 1 })
    ).toBeVisible();

    await expect(page.locator('ngx-wizard-steps nav')).toBeVisible();
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toContainText(/form value/i);
    await expect(
      sidebar.locator('span[aria-label="Pristine"]').first()
    ).toBeVisible();
  });
});
