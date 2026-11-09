import { expect, test } from '@playwright/test';
import { getMainContentSidebar } from '../../helpers/form-helpers';

test.describe('Signal Forms Controls Page', () => {
  test('should render the interop layout', async ({ page }) => {
    await page.goto('/signal-forms-interop', { waitUntil: 'domcontentloaded' });

    await expect(
      page.getByRole('heading', {
        name: /signal forms controls with ngmodel/i,
        level: 1,
      })
    ).toBeVisible();
    await expect(page).toHaveTitle(/signal forms controls with ngmodel/i);

    const sidebar = getMainContentSidebar(page);
    await expect(sidebar).toContainText(/form state/i);
    await expect(sidebar).toContainText(/form value/i);

    await expect(page.getByRole('spinbutton', { name: 'Seats' })).toBeVisible();
    await expect(
      page.getByRole('switch', { name: /accept the booking terms/i })
    ).toBeVisible();
  });
});
