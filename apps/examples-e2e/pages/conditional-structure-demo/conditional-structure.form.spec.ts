import { expect, test } from '@playwright/test';
import {
  captureNgxVestDiagnostics,
  fillAndBlur,
  waitForFormProcessing,
  waitForValidationToSettle,
} from '../../helpers/form-helpers';

test.describe('Conditional Structure Demo Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/conditional-structure');
  });

  test('should clear stale values when an input branch becomes static content without diagnostics', async ({
    page,
  }) => {
    const diagnostics = captureNgxVestDiagnostics(page);
    const contactName = page.getByLabel(/contact name/i);
    const deliveryMethod = page.getByRole('combobox', {
      name: /delivery method/i,
    });

    await fillAndBlur(contactName, 'Ada Lovelace');
    await deliveryMethod.selectOption('shipment');

    const shippingAddress = page.getByLabel(/shipping address/i);
    await fillAndBlur(shippingAddress, '123 Analytical Engine Way');
    await expect(shippingAddress).toHaveValue('123 Analytical Engine Way');

    await deliveryMethod.selectOption('pickup');

    await expect(shippingAddress).toHaveCount(0);
    await expect(
      page.getByText(/no extra delivery field is required for pickup orders/i)
    ).toBeVisible();
    await expect(page.getByText(/123 Analytical Engine Way/i)).toHaveCount(0);

    await page.getByRole('button', { name: /save delivery plan/i }).click();

    const submittedPayloadCard = page.locator('ngx-card').filter({
      hasText: /submitted payload/i,
    });

    await expect(
      page.getByRole('status').filter({ hasText: /delivery plan submitted/i })
    ).toBeVisible();
    await expect(submittedPayloadCard).toContainText(
      '"deliveryMode": "pickup"'
    );
    await expect(submittedPayloadCard).not.toContainText('shippingAddress');

    await waitForFormProcessing(page);
    diagnostics.expectNoUnexpectedDiagnostics();
    diagnostics.dispose();
  });

  test('should switch validation to the active branch after a structure change', async ({
    page,
  }) => {
    const contactName = page.getByLabel(/contact name/i);
    const deliveryMethod = page.getByRole('combobox', {
      name: /delivery method/i,
    });

    await fillAndBlur(contactName, 'Ada Lovelace');
    await deliveryMethod.selectOption('digital');
    await page.getByRole('button', { name: /save delivery plan/i }).click();
    await waitForValidationToSettle(page);

    const errorSummary = page.getByRole('alert').filter({
      hasText: /delivery email is required/i,
    });

    const deliveryEmail = page.getByLabel(/delivery email/i);
    await expect(deliveryEmail).toBeFocused();
    await expect(errorSummary).toContainText(/delivery email is required/i);

    await fillAndBlur(deliveryEmail, 'ada@example.com');
    await page.getByRole('button', { name: /save delivery plan/i }).click();

    const submittedPayloadCard = page.locator('ngx-card').filter({
      hasText: /submitted payload/i,
    });

    await expect(
      page.getByRole('status').filter({ hasText: /delivery plan submitted/i })
    ).toBeVisible();
    await expect(submittedPayloadCard).toContainText('ada@example.com');
  });
});
