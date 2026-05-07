import { expect, Locator, Page, test } from '@playwright/test';
import {
  navigateToDateRangeAdapter,
  waitForValidationToSettle,
} from '../../helpers/form-helpers';

/**
 * Set a date on the composite adapter's visible input and blur.
 *
 * The adapter's visible `<input type="date">` uses `[value]` + `(input)` bindings
 * (not `ngModel`). While Playwright's `fill()` and `evaluate()` correctly dispatch
 * the DOM event (the Angular handler fires and the page signal updates), Angular's
 * zoneless change detection scheduler does not pick up the signal change for re-render
 * because synthetic events (`isTrusted: false`) don't trigger the zoneless CD scheduler.
 *
 * Workaround: after setting the value, press Escape to trigger a real browser event
 * (`isTrusted: true`) which nudges Angular's zoneless scheduler to run change detection.
 */
async function setAdapterDate(field: Locator, value: string): Promise<void> {
  await field.fill(value);
  await field.blur();
  // Nudge Angular's zoneless CD scheduler with a real user event
  await field.page().keyboard.press('Escape');
}

/**
 * Helper to switch to the Composite Adapter approach.
 * Split Wrappers is now the default — tests must explicitly switch.
 */
async function switchToCompositeAdapter(page: Page): Promise<void> {
  await page.getByRole('radio', { name: /composite adapter/i }).check();
  await expect(
    page.getByRole('heading', { name: /composite adapter/i, level: 2 })
  ).toBeVisible();
}

function getAdapterErrorRegion(page: Page): Locator {
  return page.locator('[id*="date-range-errors"]');
}

/**
 * Tests for the Composite Adapter approach.
 *
 * In this approach, hidden proxy fields register `departureDate` and `returnDate`
 * in the form tree, and a single adapter component provides the composite UI.
 * Errors are aggregated from both fields into one shared display region.
 */
test.describe('Composite Adapter - Form Behavior', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToDateRangeAdapter(page);
    // Split Wrappers is the default — switch to Composite Adapter
    await switchToCompositeAdapter(page);
  });

  test('should NOT show errors on initial page load', async ({ page }) => {
    const errorRegion = getAdapterErrorRegion(page);
    await expect(errorRegion).not.toContainText(/required/i);

    const departure = page.getByLabel(/departure date/i);
    await expect(departure).not.toHaveAttribute('aria-invalid', 'true');
  });

  test('should show errors after blurring an empty adapter input', async ({
    page,
  }) => {
    const departure = page.getByLabel(/departure date/i);
    await departure.click();
    await departure.blur();
    // Nudge zoneless CD
    await page.keyboard.press('Escape');
    await waitForValidationToSettle(page);

    const errorRegion = getAdapterErrorRegion(page);
    await expect(errorRegion).toContainText('Departure date is required');
    await expect(page.getByLabel(/return date/i)).not.toHaveAttribute(
      'aria-invalid',
      'true'
    );
  });

  test('should update form model when departure date is entered', async ({
    page,
  }) => {
    const departure = page.getByLabel(/departure date/i);
    await setAdapterDate(departure, '2026-07-01');
    await waitForValidationToSettle(page);

    await expect(page.locator('aside')).toContainText('2026-07-01');
  });

  test('should update form model when return date is entered', async ({
    page,
  }) => {
    const returnDate = page.getByLabel(/return date/i);
    await setAdapterDate(returnDate, '2026-07-15');
    await waitForValidationToSettle(page);

    await expect(page.locator('aside')).toContainText('2026-07-15');
  });

  test('should show required errors on submit with empty fields', async ({
    page,
  }) => {
    await page.getByRole('button', { name: /submit/i }).click();
    await waitForValidationToSettle(page);

    const errorRegion = getAdapterErrorRegion(page);
    await expect(errorRegion).toContainText(/required/i);
  });

  test('should show cross-field error when return date is before departure', async ({
    page,
  }) => {
    const departure = page.getByLabel(/departure date/i);
    const returnDate = page.getByLabel(/return date/i);

    await setAdapterDate(departure, '2026-07-15');
    await setAdapterDate(returnDate, '2026-07-01');
    await waitForValidationToSettle(page);

    const errorRegion = getAdapterErrorRegion(page);
    await expect(errorRegion).toContainText(/after/i);
  });

  test('should clear errors when dates are corrected', async ({ page }) => {
    const departure = page.getByLabel(/departure date/i);
    const returnDate = page.getByLabel(/return date/i);

    await setAdapterDate(departure, '2026-07-15');
    await setAdapterDate(returnDate, '2026-07-01');
    await waitForValidationToSettle(page);

    const errorRegion = getAdapterErrorRegion(page);
    await expect(errorRegion).toContainText(/after/i);

    await setAdapterDate(returnDate, '2026-07-20');
    await waitForValidationToSettle(page);

    await expect(errorRegion).not.toContainText(/after/i);
  });

  test('should toggle aria-invalid on adapter inputs', async ({ page }) => {
    await page.getByRole('button', { name: /submit/i }).click();
    await waitForValidationToSettle(page);

    const departure = page.getByLabel(/departure date/i);
    const returnDate = page.getByLabel(/return date/i);

    await expect(departure).toHaveAttribute('aria-invalid', 'true');
    await expect(returnDate).toHaveAttribute('aria-invalid', 'true');

    await setAdapterDate(departure, '2026-07-01');
    await setAdapterDate(returnDate, '2026-07-15');
    await waitForValidationToSettle(page);

    await expect(departure).not.toHaveAttribute('aria-invalid', 'true');
    await expect(returnDate).not.toHaveAttribute('aria-invalid', 'true');
  });

  test('should show warning when dates are less than 3 days apart', async ({
    page,
  }) => {
    const departure = page.getByLabel(/departure date/i);
    const returnDate = page.getByLabel(/return date/i);

    await setAdapterDate(departure, '2026-07-01');
    await setAdapterDate(returnDate, '2026-07-02');
    await waitForValidationToSettle(page);

    // The adapter's warning region should show the warning
    const warningRegion = page.locator('[id*="date-range-warnings"]');
    await expect(warningRegion).toContainText(/at least 3 days/i);
  });

  test('should not show warning when dates are 3+ days apart', async ({
    page,
  }) => {
    const departure = page.getByLabel(/departure date/i);
    const returnDate = page.getByLabel(/return date/i);

    await setAdapterDate(departure, '2026-07-01');
    await setAdapterDate(returnDate, '2026-07-10');
    await waitForValidationToSettle(page);

    const warningRegion = page.locator('[id*="date-range-warnings"]');
    await expect(warningRegion).not.toContainText(/at least 3 days/i);
  });

  test('should use aria-describedby linking inputs to error region', async ({
    page,
  }) => {
    await page.getByRole('button', { name: /submit/i }).click();
    await waitForValidationToSettle(page);

    const departure = page.getByLabel(/departure date/i);
    const describedBy = await departure.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();

    // The referenced element should contain the error text
    const ids = describedBy!.split(/\s+/);
    let foundError = false;
    for (const id of ids) {
      const el = page.locator(`#${id}`);
      const text = await el.textContent();
      if (text && /required/i.test(text)) {
        foundError = true;
        break;
      }
    }
    expect(foundError).toBe(true);
  });

  test('should clear errors and touched state after reset', async ({
    page,
  }) => {
    // Submit to show errors
    await page.getByRole('button', { name: /submit/i }).click();
    await waitForValidationToSettle(page);

    const departure = page.getByLabel(/departure date/i);
    await expect(departure).toHaveAttribute('aria-invalid', 'true');

    const errorRegion = getAdapterErrorRegion(page);
    await expect(errorRegion).toContainText(/required/i);

    // Reset the form
    await page.getByRole('button', { name: /reset/i }).click();
    await waitForValidationToSettle(page);

    // Errors and aria-invalid should be cleared
    await expect(departure).not.toHaveAttribute('aria-invalid', 'true');
    await expect(errorRegion).not.toContainText(/required/i);
  });
});
