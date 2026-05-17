import { expect, test } from '@playwright/test';
import {
  fillAndBlur,
  waitForValidationToSettle,
} from '../../helpers/form-helpers';

test.describe('Submission Patterns Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/submission-patterns', { waitUntil: 'domcontentloaded' });
  });

  test('should focus the first invalid field when submitted empty', async ({
    page,
  }) => {
    const fullName = page.getByLabel('Full name', { exact: true });
    const submitButton = page.getByRole('button', { name: /create account/i });

    await submitButton.click();
    await waitForValidationToSettle(page);

    await expect(fullName).toBeFocused();
    await expect(
      page.getByRole('alert').filter({ hasText: /errors/i })
    ).toBeVisible();
    await expect(
      page.getByRole('alert').getByText(/full name is required/i)
    ).toBeVisible();
  });

  test('should retry a server failure and reach the success state', async ({
    page,
  }) => {
    const fullName = page.getByLabel('Full name', { exact: true });
    const email = page.getByLabel('Email', { exact: true });
    const password = page.getByLabel('Password', { exact: true });
    const acceptTerms = page.getByLabel('I accept the terms of service', {
      exact: true,
    });
    const serverResponse = page.getByRole('combobox', {
      name: /server response/i,
    });

    await fillAndBlur(fullName, 'Ada Lovelace');
    await fillAndBlur(email, 'ada@example.com');
    await fillAndBlur(password, 'password123456');
    await acceptTerms.check();

    await serverResponse.selectOption('Email already taken (409)');
    await page.getByRole('button', { name: /create account/i }).click();

    const serverErrorAlert = page
      .getByRole('alert')
      .filter({ hasText: /couldn't create your account/i });
    await expect(serverErrorAlert).toBeVisible();
    await expect(page.getByRole('button', { name: /retry/i })).toBeVisible();

    await serverResponse.selectOption('Normal — succeeds (201)');
    await page.getByRole('button', { name: /retry/i }).click();

    const successAlert = page
      .getByRole('status')
      .filter({ hasText: /account created/i });
    await expect(successAlert).toBeVisible();
    await expect(successAlert).toContainText(/acct_/i);

    await page.getByRole('button', { name: /create another/i }).click();
    await expect(fullName).toHaveValue('');
    await expect(email).toHaveValue('');
    await expect(password).toHaveValue('');
    await expect(acceptTerms).not.toBeChecked();
  });
});
