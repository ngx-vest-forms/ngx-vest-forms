import { expect, test } from '@playwright/test';
import { fillAndBlur, waitForValidationToSettle } from '../../helpers/form-helpers';

test.describe('Starter Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/starter');
  });

  test('should show validation errors on empty submit', async ({ page }) => {
    await page.getByRole('button', { name: /send message/i }).click();
    await waitForValidationToSettle(page);

    const errorSummary = page.getByRole('alert').filter({
      hasText: /name is required/i,
    });

    await expect(errorSummary).toContainText(/name is required/i);
    await expect(errorSummary).toContainText(/email is required/i);
    await expect(errorSummary).toContainText(/subject is required/i);
    await expect(errorSummary).toContainText(/message is required/i);
  });

  test('should submit successfully and reset cleanly', async ({ page }) => {
    const name = page.getByRole('textbox', { name: /^name$/i });
    const email = page.getByRole('textbox', { name: /^email$/i });
    const subject = page.getByRole('textbox', { name: /subject/i });
    const message = page.getByRole('textbox', { name: /message/i });

    await fillAndBlur(name, 'Ada Lovelace');
    await fillAndBlur(email, 'ada@example.com');
    await fillAndBlur(subject, 'Validation help');
    await fillAndBlur(
      message,
      'We need help wiring template-driven validation with Vest.'
    );

    await page.getByRole('button', { name: /send message/i }).click();

    await expect(
      page.getByRole('status').filter({ hasText: /message sent/i })
    ).toBeVisible();

    await page.getByRole('button', { name: /reset/i }).click();
    await expect(name).toHaveValue('');
    await expect(email).toHaveValue('');
    await expect(subject).toHaveValue('');
    await expect(message).toHaveValue('');
  });
});
