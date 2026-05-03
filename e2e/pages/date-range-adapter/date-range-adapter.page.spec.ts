import { expect, test } from '@playwright/test';
import { navigateToDateRangeAdapter } from '../../helpers/form-helpers';

test.describe('Composite Adapter Recipe Page', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToDateRangeAdapter(page);
  });

  test('should render page layout and key sections', async ({ page }) => {
    await expect(
      page.getByRole('heading', {
        name: /composite adapter recipe/i,
        level: 1,
      })
    ).toBeVisible();
    await expect(page.locator('aside')).toBeVisible();
    await expect(page.locator('aside')).toContainText(/form state/i);
    await expect(page.locator('aside')).toContainText(/how it works/i);
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
    // Default: split wrappers
    await expect(page.locator('aside')).toContainText(/no hidden proxies/i);
    await expect(page.locator('aside')).toContainText(
      /no manual error aggregation/i
    );

    // Switch to composite adapter
    await page.getByRole('radio', { name: /composite adapter/i }).check();
    await expect(page.locator('aside')).toContainText(
      /hidden proxy fields/i
    );
  });

  test('should render date range fields in both approaches', async ({
    page,
  }) => {
    // Split wrappers (default)
    await expect(page.getByLabel(/departure date/i)).toBeVisible();
    await expect(page.getByLabel(/return date/i)).toBeVisible();

    // Switch to composite adapter
    await page.getByRole('radio', { name: /composite adapter/i }).check();
    await expect(page.getByLabel(/departure date/i)).toBeVisible();
    await expect(page.getByLabel(/return date/i)).toBeVisible();
  });

  test('should render submit and reset buttons in both approaches', async ({
    page,
  }) => {
    await expect(
      page.getByRole('button', { name: /submit/i })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /reset/i })
    ).toBeVisible();

    await page.getByRole('radio', { name: /composite adapter/i }).check();
    await expect(
      page.getByRole('button', { name: /submit/i })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /reset/i })
    ).toBeVisible();
  });
});
