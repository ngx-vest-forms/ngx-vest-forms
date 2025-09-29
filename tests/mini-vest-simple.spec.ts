import { expect, test } from '@playwright/test';

const SIMPLE_FORM_URL = '/mini-vest/simple';

test.describe('Mini Vest - Simple Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SIMPLE_FORM_URL);
    await page.waitForLoadState('networkidle');
  });

  test('surfaces both email validation errors when both inputs are invalid', async ({
    page,
  }) => {
    await test.step('Leave email empty to trigger required validation', async () => {
      const emailField = page.getByRole('textbox', {
        name: /^E-mail address:/i,
      });
      await emailField.click();
      await emailField.press('Tab');

      await expect(page.locator('#email-error')).toHaveText(
        'Email is required',
      );
    });

    await test.step('Leave verify email empty to trigger required validation', async () => {
      const verifyField = page.getByRole('textbox', {
        name: /^Verify e-mail address:/i,
      });
      await verifyField.click();
      await verifyField.press('Tab');

      await expect(page.locator('#verifyEmail-error')).toHaveText(
        'Email verification is required',
      );
    });

    await test.step('Both errors remain visible together', async () => {
      await expect(page.locator('#email-error')).toBeVisible();
      await expect(page.locator('#verifyEmail-error')).toBeVisible();
    });

    await test.step('Correct the primary email and keep verification invalid', async () => {
      const emailField = page.getByRole('textbox', {
        name: /^E-mail address:/i,
      });

      await emailField.fill('user@example.com');

      await expect(page.locator('#email-error')).toBeHidden();
      await expect(page.locator('#verifyEmail-error')).toBeVisible();
    });
  });
});
