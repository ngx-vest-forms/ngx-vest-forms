import { expect, test } from '@playwright/test';
import { navigateToAutoSaveDemo } from '../../helpers/form-helpers';

test.describe('Auto-Save Demo Page', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToAutoSaveDemo(page);
  });

  test('should render page layout and autosave sidebar details', async ({
    page,
  }) => {
    await expect(
      page.getByRole('heading', { name: /auto-save draft demo/i, level: 1 })
    ).toBeVisible();
    await expect(page.locator('aside')).toContainText(/key features/i);
    await expect(page.locator('aside')).toContainText(/draft status/i);
    await expect(page.locator('aside')).toContainText(/sessionstorage/i);
    await expect(page.locator('aside')).toContainText(
      /ngx-vest-forms:auto-save-demo:draft/i
    );
  });
});
