import { expect, test } from '@playwright/test';
import { getMainContentSidebar } from '../../helpers/form-helpers';

test.describe('Business Policy Page', () => {
  test('should render the policy demo layout', async ({ page }) => {
    await page.goto('/business-policy', { waitUntil: 'domcontentloaded' });
    const sidebar = getMainContentSidebar(page);

    await expect(
      page.getByRole('heading', {
        name: /vest-first business policy/i,
        level: 1,
      })
    ).toBeVisible();

    await expect(sidebar).toBeVisible();
    await expect(sidebar).toContainText(/form state/i);
    await expect(sidebar).toContainText(/form value/i);

    await expect(
      page.getByRole('combobox', { name: /account type/i })
    ).toBeVisible();
    await expect(
      page.getByRole('combobox', { name: /country/i })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /submit application/i })
    ).toBeVisible();
  });
});
