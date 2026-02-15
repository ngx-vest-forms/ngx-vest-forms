import { expect, test } from '@playwright/test';
import { navigateToValidationConfigDemo } from '../../helpers/form-helpers';

test.describe('Validation Config Demo Page', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToValidationConfigDemo(page);
  });

  test('should render page layout and key sections', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /validation config demo/i, level: 1 })
    ).toBeVisible();
    await expect(page.locator('aside')).toBeVisible();
    await expect(page.locator('aside')).toContainText(/form value/i);
    await expect(page.locator('aside')).toContainText(/form state/i);
    await expect(
      page.locator('aside span[aria-label="Pristine"]').first()
    ).toBeVisible();

    await expect(page.locator('text=/bidirectional.*password/i')).toBeVisible();
    await expect(page.locator('text=/date range/i')).toBeVisible();
  });
});
