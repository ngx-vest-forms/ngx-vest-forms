import { expect, test } from '@playwright/test';
import {
  fillAndBlur,
  typeAndBlur,
  waitForValidationToSettle,
} from '../../helpers/form-helpers';

test.describe('Async Username Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/async-username', { waitUntil: 'domcontentloaded' });
  });

  test('should surface async validation and reserve an available username', async ({
    page,
  }) => {
    const username = page.getByLabel('Username', { exact: true });
    const displayName = page.getByLabel('Display name', { exact: true });
    const reserveButton = page.getByRole('button', {
      name: /reserve username/i,
    });
    const resetButton = page.getByRole('button', { name: /reset/i });

    await fillAndBlur(displayName, 'Ada Lovelace');

    await typeAndBlur(username, 'taken', 0);
    await expect(page.getByText(/checking availability/i)).toBeVisible();
    await waitForValidationToSettle(page);
    await expect(
      page.getByRole('region', { name: 'Errors' }).getByText(/username is already taken/i)
    ).toBeVisible();

    await typeAndBlur(username, 'ada_lovelace', 0);
    await waitForValidationToSettle(page);
    await expect(page.getByText(/that username is available\./i)).toBeVisible();

    await reserveButton.click();

    const successAlert = page
      .getByRole('status')
      .filter({ hasText: /username reserved/i });
    await expect(successAlert).toBeVisible();
    await expect(successAlert).toContainText(/ada_lovelace/i);
    await expect(successAlert).toContainText(/ada lovelace/i);

    await resetButton.click();
    await expect(username).toHaveValue('');
    await expect(displayName).toHaveValue('');
    await expect(successAlert).toHaveCount(0);
  });
});
