import { expect, test } from '@playwright/test';
import {
  getMainContentSidebar,
  navigateToAutoSaveDemo,
} from '../../helpers/form-helpers';

test.describe('Auto-Save Demo Page', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToAutoSaveDemo(page);
  });

  test('should render page layout and autosave sidebar details', async ({
    page,
  }) => {
    const sidebar = getMainContentSidebar(page);

    await expect(
      page.getByRole('heading', { name: /auto-save draft demo/i, level: 1 })
    ).toBeVisible();
    await expect(sidebar).toContainText(/form state/i);
    await expect(sidebar).toContainText(/form value/i);
    await expect(sidebar).toContainText(/sessionstorage/i);
    await expect(sidebar).toContainText(/ngx-vest-forms:auto-save-demo:draft/i);
  });
});
