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
    await expect(page.locator('aside')).toBeVisible();
    await expect(page.locator('aside')).toContainText(/form value/i);
    await expect(page.locator('aside')).toContainText(/form state/i);
    await expect(
      page.locator('aside span[aria-label="Pristine"]').first()
    ).toBeVisible();
  });
});
