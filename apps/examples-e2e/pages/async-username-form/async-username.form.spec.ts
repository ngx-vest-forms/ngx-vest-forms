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
      page
        .getByRole('region', { name: 'Errors' })
        .getByText(/username is already taken/i)
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

  test('should ignore a taken result that lands after the username was replaced', async ({
    page,
  }) => {
    const username = page.getByLabel('Username', { exact: true });

    await fillAndBlur(
      page.getByLabel('Display name', { exact: true }),
      'Ada Lovelace'
    );

    // A fake clock makes the overlap deterministic. The field debounces for
    // 500ms and the mock answers after 600ms, so at 550ms the "taken" check
    // has started and has not answered yet.
    await page.clock.install();
    await typeAndBlur(username, 'taken', 0);
    await page.clock.runFor(550);
    await expect(page.getByText(/checking availability/i)).toBeVisible();

    await typeAndBlur(username, 'ada_lovelace', 0);
    // Past both the stale response (1150ms) and the second check.
    await page.clock.runFor(3000);
    await waitForValidationToSettle(page);

    // The stale "taken" response must not surface, and only the second
    // check's result is shown.
    await expect(page.getByText(/username is already taken/i)).toHaveCount(0);
    await expect(username).not.toHaveAccessibleDescription(/already taken/i);
    await expect(page.getByText(/that username is available\./i)).toBeVisible();

    await page.getByRole('button', { name: /reserve username/i }).click();

    const successAlert = page
      .getByRole('status')
      .filter({ hasText: /username reserved/i });
    await expect(successAlert).toContainText(/ada_lovelace/i);
  });

  test('should mark the username wrapper busy and show the checking hint until the check settles', async ({
    page,
  }) => {
    const username = page.getByLabel('Username', { exact: true });
    const usernameWrapper = page
      .locator('ngx-control-wrapper')
      .filter({ has: username });

    await fillAndBlur(username, 'ada_lovelace');

    await expect(usernameWrapper).toHaveAttribute('aria-busy', 'true');
    await expect(page.getByText(/checking availability/i)).toBeVisible();

    await expect(usernameWrapper).not.toHaveAttribute('aria-busy', 'true');
    await expect(page.getByText(/checking availability/i)).toHaveCount(0);
    await expect(page.getByText(/that username is available\./i)).toBeVisible();
  });

  test('should hold the submit result until a pending availability check settles', async ({
    page,
  }) => {
    const username = page.getByLabel('Username', { exact: true });
    const reserveButton = page.getByRole('button', {
      name: /reserve username/i,
    });
    const successAlert = page
      .getByRole('status')
      .filter({ hasText: /username reserved/i });

    await fillAndBlur(
      page.getByLabel('Display name', { exact: true }),
      'Ada Lovelace'
    );

    // Submit while the check is still pending: the taken result must win.
    await username.fill('taken');
    await reserveButton.click();

    await expect(
      page
        .getByRole('region', { name: 'Errors' })
        .getByText(/username is already taken/i)
    ).toBeVisible();
    await expect(successAlert).toHaveCount(0);

    // An available name submitted at once reserves only after the check settles.
    await username.fill('ada_lovelace');
    await reserveButton.click();

    await expect(successAlert).toBeVisible();
    await expect(successAlert).toContainText(/ada_lovelace/i);
  });
});
