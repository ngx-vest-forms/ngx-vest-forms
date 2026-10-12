import { expect, test } from '@playwright/test';
import { getMainContentSidebar } from '../../helpers/form-helpers';

test.describe('Submission Patterns Page', () => {
  test('should render the submission-state demo layout', async ({ page }) => {
    await page.goto('/submission-patterns', { waitUntil: 'domcontentloaded' });
    const sidebar = getMainContentSidebar(page);

    await expect(
      page.getByRole('heading', {
        name: /submission patterns/i,
        level: 1,
      })
    ).toBeVisible();

    await expect(
      page.getByRole('heading', { name: /simulated outcome/i, level: 3 })
    ).toBeVisible();
    await expect(sidebar).toContainText(/form state/i);
    await expect(sidebar).toContainText(/form value/i);

    await expect(page.getByLabel(/server response/i)).toBeVisible();
    await expect(
      page.getByRole('button', { name: /create account/i })
    ).toBeVisible();
  });
});
