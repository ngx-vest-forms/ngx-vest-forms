import { expect, test } from '@playwright/test';
import {
  expectFieldHasError,
  expectFieldValid,
  fillAndBlur,
  waitForFormProcessing,
} from '../../helpers/form-helpers';

test.describe('Zod Schema Demo Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/zod-schema-demo');
    await expect(
      page.getByRole('heading', { name: /Zod Schema Demo/i, level: 1 })
    ).toBeVisible();
  });

  test.describe('Basic Form Validation', () => {
    test('should show validation errors for required fields on blur (handled by test() rules)', async ({
      page,
    }) => {
      await test.step('Focus and blur required fields to trigger validation', async () => {
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
    });

    test('should validate regex and structural types on field fill', async ({ page }) => {
      await test.step('Fill email with invalid format', async () => {
        const email = page.getByLabel(/email/i);
        await fillAndBlur(email, 'not-an-email');
        await expectFieldHasError(email, /valid email address/i);
      });

      await test.step('Fill age with out-of-bounds number', async () => {
        const age = page.getByLabel(/age/i);
        await fillAndBlur(age, '10');
        await expectFieldHasError(age, /at least 18/i);

        await fillAndBlur(age, '150');
        await expectFieldHasError(age, /at most 120/i);
      });

      await test.step('Fill ZIP code with invalid pattern', async () => {
        const zipCode = page.getByLabel(/zip code/i);
        await fillAndBlur(zipCode, '12'); // Too short
        await expectFieldHasError(zipCode, /4-6 digits/i);

        await fillAndBlur(zipCode, '1234567'); // Too long
        await expectFieldHasError(zipCode, /4-6 digits/i);
      });
    });
    
    test('should show all validation errors on submit', async ({
      page,
    }) => {
      await test.step('Submit empty form to trigger full Zod and Vest validation', async () => {
        const submitButton = page.getByRole('button', { name: /submit/i });
        await submitButton.click();
        await waitForFormProcessing(page);

        // Required fields
        await expectFieldHasError(page.getByLabel(/first name/i), /required/i);
        await expectFieldHasError(page.getByLabel(/last name/i), /required/i);
        await expectFieldHasError(page.getByLabel(/email/i), /required/i);
        await expectFieldHasError(page.getByLabel(/age/i), /required/i);

        // Address fields
        await expectFieldHasError(page.getByLabel(/street/i), /required/i);
        await expectFieldHasError(page.getByLabel(/city/i), /required/i);
        await expectFieldHasError(page.getByLabel(/zip code/i), /required/i);
      });
    });

    test('should allow successful form submission with valid data', async ({ page }) => {
      await test.step('Fill out entire form correctly', async () => {
        await fillAndBlur(page.getByLabel(/first name/i), 'Arjen');
        await fillAndBlur(page.getByLabel(/last name/i), 'Robben');
        await fillAndBlur(page.getByLabel(/email/i), 'arjen@example.com');
        await fillAndBlur(page.getByLabel(/age/i), '40');
        
        await fillAndBlur(page.getByLabel(/street/i), 'Allianz Arena 1');
        await fillAndBlur(page.getByLabel(/city/i), 'Munich');
        await fillAndBlur(page.getByLabel(/zip code/i), '80939');

        await waitForFormProcessing(page);

        // Check one field to ensure it is valid
        await expectFieldValid(page.getByLabel(/first name/i));

        // Submit form
        const submitButton = page.getByRole('button', { name: /submit/i });
        await submitButton.click();
        await waitForFormProcessing(page);

        // At this point, no fields should have errors, meaning validation passed
        await expectFieldValid(page.getByLabel(/zip code/i));
        // We can check if the form state says valid
        await expect(page.locator('ngx-status-badge')).toContainText('Valid');
      });
    });
  });
});
