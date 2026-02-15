import { expect, test } from '@playwright/test';

test.describe('Display Modes Demo Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/display-modes-demo');
    await expect(
      page.getByRole('heading', { name: /display modes demo/i, level: 1 })
    ).toBeVisible();
  });

  test('should show always-mode error immediately on pristine field', async ({
    page,
  }) => {
    const alwaysError = page.getByLabel(/username \(always mode\)/i);

    await expect(alwaysError).toHaveAttribute('aria-invalid', 'true');
    await expect(
      page
        .locator('form')
        .getByRole('status')
        .filter({
          hasText: /this field is required/i,
        })
    ).toHaveCount(1);
  });

  test('should show on-dirty error after typing in dirty error field', async ({
    page,
  }) => {
    const dirtyError = page.getByLabel(/username \(on-dirty mode\)/i);
    const dirtyWrapper = dirtyError.locator(
      'xpath=ancestor::ngx-control-wrapper[1]'
    );

    await dirtyError.fill('a');
    await dirtyError.fill('');
    await dirtyError.blur();

    await expect(
      dirtyWrapper.getByRole('status').filter({
        hasText: /this field is required/i,
      })
    ).toHaveCount(1);
    await expect(dirtyError).toHaveAttribute('aria-invalid', 'true');
  });

  test('should show always warning for short value', async ({ page }) => {
    const alwaysWarning = page.getByLabel(/username \(always warning\)/i);
    const alwaysWarningWrapper = alwaysWarning.locator(
      'xpath=ancestor::ngx-control-wrapper[1]'
    );

    await alwaysWarning.fill('abc');
    await alwaysWarning.blur();

    await expect(
      alwaysWarningWrapper.getByRole('status').filter({
        hasText: /username should be at least 5 characters/i,
      })
    ).toHaveCount(1);
  });

  test('should show on-dirty warning after typing in dirty warning field', async ({
    page,
  }) => {
    const dirtyWarning = page.getByLabel(/username \(on-dirty warning\)/i);
    const dirtyWarningWrapper = dirtyWarning.locator(
      'xpath=ancestor::ngx-control-wrapper[1]'
    );

    await dirtyWarning.fill('abc');

    await expect(
      dirtyWarningWrapper.getByRole('status').filter({
        hasText: /username should be at least 5 characters/i,
      })
    ).toHaveCount(1);
  });

  test('should show on-touch warning only after blur for touch warning field', async ({
    page,
  }) => {
    const touchWarning = page.getByLabel(/username \(on-touch warning\)/i);
    const touchWarningWrapper = touchWarning.locator(
      'xpath=ancestor::ngx-control-wrapper[1]'
    );

    await touchWarning.fill('abc');
    await expect(
      touchWarningWrapper.getByRole('status').filter({
        hasText: /username should be at least 5 characters/i,
      })
    ).toHaveCount(0);

    await touchWarning.blur();

    await expect(
      touchWarningWrapper.getByRole('status').filter({
        hasText: /username should be at least 5 characters/i,
      })
    ).toHaveCount(1);
  });
});
