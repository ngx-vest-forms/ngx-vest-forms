import { expect, test } from '@playwright/test';
import { navigateToBusinessHoursForm } from '../../helpers/form-helpers';

test.describe('Business Hours Page', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToBusinessHoursForm(page);
  });

  test('should render page layout and form-state sidebar', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /business hours form/i, level: 1 })
    ).toBeVisible();

    const sidebar = page.getByRole('complementary').first();
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toContainText(/form value/i);
    await expect(sidebar).toContainText(/form state/i);
    await expect(sidebar.getByLabel('Pristine').first()).toBeVisible();
  });
});
