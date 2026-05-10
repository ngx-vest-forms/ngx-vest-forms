import { expect, test } from '@playwright/test';
import {
  expectFieldHasError,
  expectFieldValid,
  fillAndBlur,
  waitForFormProcessing,
} from '../../helpers/form-helpers';

test.describe('Native Schema Demo Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/native-schema-demo');
    await expect(
      page.getByRole('heading', { name: /Native Vest Schema Demo/i, level: 1 })
    ).toBeVisible();
  });

  test('should show validation errors for required fields on blur', async ({
    page,
  }) => {
    const firstName = page.getByLabel(/first name/i);
    const lastName = page.getByLabel(/last name/i);
    const email = page.getByLabel(/email/i);

    await firstName.focus();
    await firstName.blur();
    await expectFieldHasError(firstName, /required/i);

    await lastName.focus();
    await lastName.blur();
    await expectFieldHasError(lastName, /required/i);

    await email.focus();
    await email.blur();
    await expectFieldHasError(email, /required/i);
  });

  test('should validate nested fields and allow a successful submit with valid data', async ({
    page,
  }) => {
    await fillAndBlur(page.getByLabel(/first name/i), 'Arjen');
    await fillAndBlur(page.getByLabel(/last name/i), 'Robben');
    await fillAndBlur(page.getByLabel(/email/i), 'arjen@example.com');
    await fillAndBlur(page.getByLabel(/age/i), '40');

    await fillAndBlur(page.getByLabel(/street/i), 'Allianz Arena 1');
    await fillAndBlur(page.getByLabel(/city/i), 'Munich');
    await fillAndBlur(page.getByLabel(/zip code/i), '80939');

    await waitForFormProcessing(page);
    await expectFieldValid(page.getByLabel(/first name/i));

    await page.getByRole('button', { name: /submit/i }).click();
    await waitForFormProcessing(page);

    await expectFieldValid(page.getByLabel(/zip code/i));
    await expect(
      page.locator('ngx-form-state-card').getByLabel('Valid')
    ).toBeVisible();
  });
});
