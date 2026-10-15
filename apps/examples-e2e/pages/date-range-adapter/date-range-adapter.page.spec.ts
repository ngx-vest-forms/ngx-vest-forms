import { expect, test } from '@playwright/test';
import {
  getMainContentSidebar,
  navigateToDateRangeAdapter,
} from '../../helpers/form-helpers';

test.describe('Composite Adapter Recipe Page', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToDateRangeAdapter(page);
  });

  test('should render page layout and key sections', async ({ page }) => {
    const sidebar = getMainContentSidebar(page);
    const howItWorksCard = page.locator('ngx-card').filter({
      has: page.getByRole('heading', { name: /how it works/i, level: 3 }),
    });

    await expect(
      page.getByRole('heading', {
        name: /composite adapter recipe/i,
        level: 1,
      })
    ).toBeVisible();
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toContainText(/form state/i);
    await expect(howItWorksCard).toContainText(/how it works/i);
  });

  test('should render approach toggle with two options', async ({ page }) => {
    const radioGroup = page.getByRole('group', {
      name: /form approach/i,
    });
    await expect(radioGroup).toBeVisible();

    const compositeRadio = page.getByRole('radio', {
      name: /composite adapter/i,
    });
    const splitRadio = page.getByRole('radio', {
      name: /split wrappers/i,
    });
    await expect(compositeRadio).toBeVisible();
    await expect(splitRadio).toBeVisible();
  });

  test('should default to Split Wrappers approach', async ({ page }) => {
    const splitRadio = page.getByRole('radio', {
      name: /split wrappers/i,
    });
    await expect(splitRadio).toBeChecked();

    await expect(
      page.getByRole('heading', { name: /split wrappers/i, level: 2 })
    ).toBeVisible();
  });

  test('should switch to Composite Adapter approach', async ({ page }) => {
    const compositeRadio = page.getByRole('radio', {
      name: /composite adapter/i,
    });

    await compositeRadio.check();

    await expect(
      page.getByRole('heading', { name: /composite adapter/i, level: 2 })
    ).toBeVisible();

    await expect(compositeRadio).toBeChecked();
  });

  test('should support keyboard navigation between approach radios', async ({
    page,
  }) => {
    const splitRadio = page.getByRole('radio', {
      name: /split wrappers/i,
    });
    const compositeRadio = page.getByRole('radio', {
      name: /composite adapter/i,
    });

    await splitRadio.focus();
    await splitRadio.press('ArrowRight');

    await expect(compositeRadio).toBeChecked();
    await expect(
      page.getByRole('heading', { name: /composite adapter/i, level: 2 })
    ).toBeVisible();

    await compositeRadio.press('ArrowLeft');

    await expect(splitRadio).toBeChecked();
    await expect(
      page.getByRole('heading', { name: /split wrappers/i, level: 2 })
    ).toBeVisible();
  });

  test('should update How It Works sidebar on approach switch', async ({
    page,
  }) => {
    const howItWorksCard = page.locator('ngx-card').filter({
      has: page.getByRole('heading', { name: /how it works/i, level: 3 }),
    });

    // Default: split wrappers
    await expect(howItWorksCard).toContainText(/no hidden proxies/i);
    await expect(howItWorksCard).toContainText(/no manual error aggregation/i);

    // Switch to composite adapter
    await page.getByRole('radio', { name: /composite adapter/i }).check();
    await expect(howItWorksCard).toContainText(/hidden proxy fields/i);
  });
});
