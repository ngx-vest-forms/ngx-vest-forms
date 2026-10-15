import { expect, test } from '@playwright/test';
import {
  expectFieldValid,
  fillAndBlur,
  navigateToValidationConfigDemo,
} from '../../helpers/form-helpers';

/**
 * Enhanced ValidationConfig tests: cascade dependencies on the
 * validation-config demo page. The @if rapid-toggle case is owned by
 * validation-config-demo.form.spec.ts.
 */
test.describe('Enhanced ValidationConfig - Complex Cascade Dependencies', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToValidationConfigDemo(page);
  });

  test('should not create validation deadlocks with cascade dependencies', async ({
    page,
  }) => {
    await test.step('Rapidly change country multiple times', async () => {
      const country = page.getByRole('combobox', { name: /country/i });
      const state = page.getByRole('textbox', { name: /state/i });
      const zipCode = page.getByRole('textbox', { name: /postal code/i });

      // Select country and fill dependents
      await country.selectOption({ label: 'United States' });
      await fillAndBlur(state, 'California');
      await fillAndBlur(zipCode, '90210');

      // Rapidly change country to test for deadlocks
      const countries = ['Canada', 'United Kingdom', 'United States'];
      for (const countryName of countries) {
        await country.selectOption({ label: countryName });
      }
      await expect(country.locator('option:checked')).toHaveText(
        'United States'
      );

      // Verify form is still responsive (no deadlock)
      await fillAndBlur(state, 'New York');
      await expectFieldValid(state);
    });
  });
});
