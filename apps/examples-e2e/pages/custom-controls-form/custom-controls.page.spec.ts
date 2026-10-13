import { expect, test } from '@playwright/test';
import { getMainContentSidebar } from '../../helpers/form-helpers';

test.describe('Custom Controls Page', () => {
  test('should render the custom controls layout', async ({ page }) => {
    await page.goto('/custom-controls', { waitUntil: 'domcontentloaded' });
    const sidebar = getMainContentSidebar(page);

    await expect(
      page.getByRole('heading', {
        name: /custom controls \(controlvalueaccessor\)/i,
        level: 1,
      })
    ).toBeVisible();

    await expect(sidebar).toBeVisible();
    await expect(sidebar).toContainText(/form state/i);
    await expect(sidebar).toContainText(/form value/i);

    await expect(
      page.getByRole('radiogroup', { name: /rating/i })
    ).toBeVisible();
    await expect(
      page.getByRole('radiogroup', { name: /experience level/i })
    ).toBeVisible();
    await expect(page.getByLabel(/add a tag/i)).toBeVisible();
  });
});
