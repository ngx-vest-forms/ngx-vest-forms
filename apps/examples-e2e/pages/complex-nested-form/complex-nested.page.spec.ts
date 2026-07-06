import { expect, test } from '@playwright/test';
import { getMainContentSidebar } from '../../helpers/form-helpers';

test.describe('Complex Nested Page', () => {
  test('should render the nested repeatable demo layout', async ({ page }) => {
    await page.goto('/complex-nested', { waitUntil: 'domcontentloaded' });
    const sidebar = getMainContentSidebar(page);

    await expect(
      page.getByRole('heading', {
        name: /complex nested & repeatable form/i,
        level: 1,
      })
    ).toBeVisible();

    await expect(sidebar).toBeVisible();
    await expect(sidebar).toContainText(/form state/i);
    await expect(sidebar).toContainText(/form value/i);

    await expect(
      page.getByRole('button', { name: /add member/i })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /register team/i })
    ).toBeVisible();
  });
});
