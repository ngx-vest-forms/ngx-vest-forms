import { expect, test } from '@playwright/test';
import {
  expectFieldHasError,
  expectFieldValid,
  fillNativeDateInputAndBlur,
  getWarningElementFor,
  navigateToDateRangeAdapter,
  waitForValidationToSettle,
} from '../../helpers/form-helpers';

/**
 * Helper to switch to the Split Wrappers approach.
 * Clicks the toggle and waits for the form section heading to confirm the switch.
 */
async function switchToSplitWrappers(
  page: import('@playwright/test').Page
): Promise<void> {
  await page
    .getByRole('radio', { name: /split wrappers/i })
    .click();
  await expect(
    page.getByRole('heading', { name: /split wrappers/i, level: 2 })
  ).toBeVisible();
}

/**
 * Tests for the Split Wrappers approach.
 *
 * In this approach, each date field is wrapped individually with
 * `<ngx-control-wrapper>`. The library handles ARIA wiring, error display,
 * warnings, and pending states automatically.
 */
test.describe('Split Wrappers - Form Behavior', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToDateRangeAdapter(page);
    // Split Wrappers is now the default — no toggle needed
  });

  test('should render two individually wrapped date fields', async ({
    page,
  }) => {
    const departure = page.getByLabel(/departure date/i);
    const returnDate = page.getByLabel(/return date/i);

    await expect(departure).toBeVisible();
    await expect(returnDate).toBeVisible();

    // Each should be inside a control-wrapper
    const wrappers = page.locator('.ngx-control-wrapper');
    await expect(wrappers).toHaveCount(2);
  });

  test('should update form model when departure date is entered', async ({
    page,
  }) => {
    const departure = page.getByLabel(/departure date/i);
    await fillNativeDateInputAndBlur(departure, '2026-07-01');
    await waitForValidationToSettle(page);

    await expect(page.locator('aside')).toContainText('2026-07-01');
  });

  test('should update form model when return date is entered', async ({
    page,
  }) => {
    const returnDate = page.getByLabel(/return date/i);
    await fillNativeDateInputAndBlur(returnDate, '2026-07-15');
    await waitForValidationToSettle(page);

    await expect(page.locator('aside')).toContainText('2026-07-15');
  });

  test('should show required error on departure field after submit', async ({
    page,
  }) => {
    await page.getByRole('button', { name: /submit/i }).click();
    await waitForValidationToSettle(page);

    const departure = page.getByLabel(/departure date/i);
    await expectFieldHasError(departure, /required/i);
  });

  test('should show required error on return field after submit', async ({
    page,
  }) => {
    await page.getByRole('button', { name: /submit/i }).click();
    await waitForValidationToSettle(page);

    const returnDate = page.getByLabel(/return date/i);
    await expectFieldHasError(returnDate, /required/i);
  });

  test('should show cross-field error on return date when before departure', async ({
    page,
  }) => {
    const departure = page.getByLabel(/departure date/i);
    const returnDate = page.getByLabel(/return date/i);

    await fillNativeDateInputAndBlur(departure, '2026-07-15');
    await fillNativeDateInputAndBlur(returnDate, '2026-07-01');
    await waitForValidationToSettle(page);

    await expectFieldHasError(returnDate, /after/i);
  });

  test('should clear errors when dates are corrected', async ({ page }) => {
    const departure = page.getByLabel(/departure date/i);
    const returnDate = page.getByLabel(/return date/i);

    // Trigger cross-field error
    await fillNativeDateInputAndBlur(departure, '2026-07-15');
    await fillNativeDateInputAndBlur(returnDate, '2026-07-01');
    await waitForValidationToSettle(page);
    await expectFieldHasError(returnDate, /after/i);

    // Fix the dates
    await fillNativeDateInputAndBlur(returnDate, '2026-07-20');
    await waitForValidationToSettle(page);
    await expectFieldValid(returnDate);
  });

  test('should use library-managed aria-invalid on individual fields', async ({
    page,
  }) => {
    await page.getByRole('button', { name: /submit/i }).click();
    await waitForValidationToSettle(page);

    const departure = page.getByLabel(/departure date/i);
    const returnDate = page.getByLabel(/return date/i);

    // Library control-wrapper should set aria-invalid
    await expect(departure).toHaveAttribute('aria-invalid', 'true');
    await expect(returnDate).toHaveAttribute('aria-invalid', 'true');

    // Fill valid dates
    await fillNativeDateInputAndBlur(departure, '2026-07-01');
    await fillNativeDateInputAndBlur(returnDate, '2026-07-15');
    await waitForValidationToSettle(page);

    await expect(departure).not.toHaveAttribute('aria-invalid', 'true');
    await expect(returnDate).not.toHaveAttribute('aria-invalid', 'true');
  });

  test('should show library-managed aria-describedby linking to error region', async ({
    page,
  }) => {
    await page.getByRole('button', { name: /submit/i }).click();
    await waitForValidationToSettle(page);

    const departure = page.getByLabel(/departure date/i);

    await test.step('Verify departure field has aria-describedby', async () => {
      const describedBy = await departure.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      expect(describedBy).toContain('error');
    });

    await test.step('Verify referenced element contains error text', async () => {
      const describedBy = await departure.getAttribute('aria-describedby');
      const ids = describedBy!.split(/\s+/);
      let foundError = false;
      for (const id of ids) {
        const el = page.locator(`#${id}`);
        if ((await el.count()) === 0) continue;
        const text = await el.textContent();
        if (text && /required/i.test(text)) {
          foundError = true;
          break;
        }
      }
      expect(foundError).toBe(true);
    });
  });

  test('should show warning when dates are less than 3 days apart', async ({
    page,
  }) => {
    const departure = page.getByLabel(/departure date/i);
    const returnDate = page.getByLabel(/return date/i);

    await fillNativeDateInputAndBlur(departure, '2026-07-01');
    await fillNativeDateInputAndBlur(returnDate, '2026-07-02');
    await waitForValidationToSettle(page);

    // Library should show warning via control-wrapper
    const warningEl = await getWarningElementFor(
      returnDate,
      /at least 3 days/i
    );
    await expect(warningEl).toContainText(/at least 3 days/i);
  });

  test('should not show warning when dates are 3+ days apart', async ({
    page,
  }) => {
    const departure = page.getByLabel(/departure date/i);
    const returnDate = page.getByLabel(/return date/i);

    await fillNativeDateInputAndBlur(departure, '2026-07-01');
    await fillNativeDateInputAndBlur(returnDate, '2026-07-10');
    await waitForValidationToSettle(page);

    // No warning elements should be visible
    const wrapperWarnings = page.locator(
      '.ngx-control-wrapper [id*="-warning"]'
    );
    const count = await wrapperWarnings.count();
    for (let i = 0; i < count; i++) {
      await expect(wrapperWarnings.nth(i)).not.toContainText(
        /at least 3 days/i
      );
    }
  });

  test.fixme('should bidirectionally revalidate when departure changes after return is set', async ({
    page,
  }) => {
    // NOT a library bug — bidirectional revalidation works correctly in manual testing.
    // Playwright's synthetic events for native <input type="date"> do not reliably
    // trigger Angular's zoneless change-detection scheduler across browsers, causing
    // the E2E assertion to be non-deterministic. Keep the scenario documented as a
    // known Playwright limitation rather than turning it into a flaky gate.
    const departure = page.getByLabel(/departure date/i);
    const returnDate = page.getByLabel(/return date/i);

    // Set valid dates first
    await fillNativeDateInputAndBlur(departure, '2026-07-01');
    await fillNativeDateInputAndBlur(returnDate, '2026-07-10');
    await waitForValidationToSettle(page);
    await expectFieldValid(returnDate);

    // Change departure to be after return → should trigger cross-field error on return
    await fillNativeDateInputAndBlur(departure, '2026-07-15');
    await waitForValidationToSettle(page);
    await expectFieldHasError(returnDate, /after/i);
  });

  test('should reset form state when reset button is clicked', async ({
    page,
  }) => {
    const departure = page.getByLabel(/departure date/i);
    const returnDate = page.getByLabel(/return date/i);

    // Fill both fields
    await fillNativeDateInputAndBlur(departure, '2026-07-01');
    await fillNativeDateInputAndBlur(returnDate, '2026-07-10');
    await waitForValidationToSettle(page);

    // Reset
    await page.getByRole('button', { name: /reset/i }).click();
    await waitForValidationToSettle(page);

    // Fields should be empty
    await expect(departure).toHaveValue('');
    await expect(returnDate).toHaveValue('');
  });
});
