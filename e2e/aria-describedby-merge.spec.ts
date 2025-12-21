import { expect, test } from '@playwright/test';
import {
  expectFieldHasError,
  expectFieldValid,
  fillAndBlur,
  navigateToValidationConfigDemo,
} from './helpers/form-helpers';

test.describe('Accessibility - aria-describedby merge', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToValidationConfigDemo(page);
  });

  test('should preserve consumer aria-describedby tokens while adding/removing wrapper IDs', async ({
    page,
  }) => {
    await test.step('Add a consumer-provided hint and aria-describedby token', async () => {
      const password = page.getByLabel('Password', { exact: true });

      // Simulate an app author adding their own hint text + aria-describedby.
      await page.evaluate(() => {
        const existing = document.getElementById('password-hint');
        if (!existing) {
          const hint = document.createElement('div');
          hint.id = 'password-hint';
          hint.textContent = 'Use at least 8 characters.';
          document.body.append(hint);
        }
      });

      await password.evaluate((el) => {
        el.setAttribute('aria-describedby', 'password-hint');
      });

      await expect(password).toHaveAttribute(
        'aria-describedby',
        /password-hint/
      );
    });

    await test.step('Trigger validation error and verify both tokens are present', async () => {
      const password = page.getByLabel('Password', { exact: true });

      await fillAndBlur(password, 'Short1');

      // Verifies that at least one aria-describedby target contains the expected error.
      // Use non-strict mode (false) since aria-invalid timing can vary under parallel execution
      await expectFieldHasError(password, /8/i, false);

      await expect(password).toHaveAttribute(
        'aria-describedby',
        /password-hint/
      );
      await expect(password).toHaveAttribute(
        'aria-describedby',
        /ngx-control-wrapper-.*-error/
      );
    });

    await test.step('Fix validation error and verify wrapper token removed but hint remains', async () => {
      const password = page.getByLabel('Password', { exact: true });

      await fillAndBlur(password, 'LongEnough123');
      await expectFieldValid(password);

      await expect(password).toHaveAttribute(
        'aria-describedby',
        /^password-hint$/
      );
    });
  });
});
