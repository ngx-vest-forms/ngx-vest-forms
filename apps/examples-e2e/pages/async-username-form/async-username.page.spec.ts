import { expect, test } from '@playwright/test';
import { getMainContentSidebar } from '../../helpers/form-helpers';

test.describe('Async Username Page', () => {
  test('should render the async validation example layout', async ({
    page,
  }) => {
    await page.goto('/async-username', { waitUntil: 'domcontentloaded' });
    const sidebar = getMainContentSidebar(page);

    await expect(
      page.getByRole('heading', {
        name: /async username availability/i,
        level: 1,
      })
    ).toBeVisible();

    await expect(sidebar).toBeVisible();
    await expect(sidebar).toContainText(/form state/i);
    await expect(sidebar).toContainText(/form value/i);

    await expect(
      page.getByRole('textbox', { name: /username/i })
    ).toBeVisible();
    await expect(
      page.getByRole('textbox', { name: /display name/i })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /reserve username/i })
    ).toBeVisible();
  });
});
