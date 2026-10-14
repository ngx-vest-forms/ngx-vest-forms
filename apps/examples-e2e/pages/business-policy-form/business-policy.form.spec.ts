import { expect, test } from '@playwright/test';
import {
  fillAndBlur,
  waitForValidationToSettle,
} from '../../helpers/form-helpers';

test.describe('Business Policy Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/business-policy', { waitUntil: 'domcontentloaded' });
  });

  test('should enforce the conditional VAT rule and allow advisory warnings', async ({
    page,
  }) => {
    const accountType = page.getByRole('combobox', { name: /account type/i });
    const legalName = page.getByLabel('Legal name', { exact: true });
    const country = page.getByRole('combobox', { name: /country/i });
    const vatId = page.getByLabel('VAT ID', { exact: true });
    const annualRevenue = page.getByLabel('Annual revenue', { exact: true });
    const requestedCreditLimit = page.getByLabel('Requested credit limit', {
      exact: true,
    });
    const paymentTerms = page.getByRole('combobox', {
      name: /payment terms \(days\)/i,
    });
    const submitButton = page.getByRole('button', {
      name: /submit application/i,
    });

    await submitButton.click();
    await expect(page.getByRole('region', { name: 'Errors' })).toBeVisible();
    await expect(
      page
        .getByRole('region', { name: 'Errors' })
        .getByText(/account type is required/i)
    ).toBeVisible();

    await accountType.selectOption('business');
    await country.selectOption('DE');
    await expect(vatId).toBeVisible();

    await fillAndBlur(legalName, 'Acme International B.V.');
    await fillAndBlur(vatId, 'NL123456789B01');
    await fillAndBlur(annualRevenue, '50000');
    await fillAndBlur(requestedCreditLimit, '30000');
    await paymentTerms.selectOption('30');

    await waitForValidationToSettle(page);
    await expect(
      page.locator('ngx-form-state-card').getByText(/expect manual review/i)
    ).toBeVisible();

    await submitButton.click();

    const successAlert = page
      .getByRole('status')
      .filter({ hasText: /application submitted/i });
    await expect(successAlert).toBeVisible();
    await expect(successAlert).toContainText(/acme international b\.v\./i);
  });

  test('should show a ROOT_FORM policy error for a low revenue band and block submit', async ({
    page,
  }) => {
    await page
      .getByRole('combobox', { name: /account type/i })
      .selectOption('business');
    await page.getByRole('combobox', { name: /country/i }).selectOption('US');
    await fillAndBlur(
      page.getByLabel('Legal name', { exact: true }),
      'Small Shop LLC'
    );
    await fillAndBlur(
      page.getByLabel('Annual revenue', { exact: true }),
      '40000'
    );
    await fillAndBlur(
      page.getByLabel('Requested credit limit', { exact: true }),
      '20000'
    );
    await page
      .getByRole('combobox', { name: /payment terms \(days\)/i })
      .selectOption('30');
    await waitForValidationToSettle(page);

    const policyPanel = page
      .getByRole('status')
      .filter({ hasText: /policy violations/i });
    await expect(policyPanel).toContainText(
      /credit limit exceeds policy for this revenue band/i
    );

    await page.getByRole('button', { name: /submit application/i }).click();
    await expect(policyPanel).toBeVisible();
    await expect(
      page.getByRole('status').filter({ hasText: /application submitted/i })
    ).toHaveCount(0);
  });
});
