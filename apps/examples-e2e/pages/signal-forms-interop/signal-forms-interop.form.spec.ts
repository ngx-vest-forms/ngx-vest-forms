import { expect, test } from '@playwright/test';

/**
 * A FormValueControl (seat stepper) and a FormCheckboxControl (switch) from
 * @angular/forms/signals, bound with [ngModel] inside ngxVestForm.
 */
test.describe('Signal Forms controls with ngModel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signal-forms-interop', { waitUntil: 'domcontentloaded' });
  });

  test('should focus the stepper input on the first invalid submit and wire ARIA to both controls', async ({
    page,
  }) => {
    const seats = page.getByRole('spinbutton', { name: 'Seats' });
    const terms = page.getByRole('switch', {
      name: /accept the booking terms/i,
    });

    await page.getByRole('button', { name: /book seats/i }).click();

    await expect(seats).toBeFocused();
    await expect(seats).toHaveAttribute('aria-invalid', 'true');
    await expect(seats).toHaveAccessibleDescription(
      /between 1 and 8.*choose how many seats you need/i
    );
    await expect(terms).toHaveAttribute('aria-invalid', 'true');
    await expect(terms).toHaveAccessibleDescription(
      /accept the booking terms to continue/i
    );
  });

  test('should focus the switch when it is the only invalid field', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'One seat more' }).click();
    await page.getByRole('button', { name: /book seats/i }).click();

    await expect(
      page.getByRole('switch', { name: /accept the booking terms/i })
    ).toBeFocused();
  });

  test('should show the error on blur, not before', async ({ page }) => {
    const seats = page.getByRole('spinbutton', { name: 'Seats' });

    await seats.fill('12');
    await expect(seats).not.toHaveAttribute('aria-invalid');

    await page.getByRole('switch', { name: /accept/i }).focus();

    await expect(seats).toHaveAttribute('aria-invalid', 'true');
    await expect(seats).toHaveAccessibleDescription(
      /book between 1 and 8 seats/i
    );
  });

  test('should step with the buttons and arrow keys and clear the error', async ({
    page,
  }) => {
    const seats = page.getByRole('spinbutton', { name: 'Seats' });

    await page.getByRole('button', { name: /book seats/i }).click();
    await expect(seats).toHaveAttribute('aria-invalid', 'true');

    await page.getByRole('button', { name: 'One seat more' }).click();
    await expect(seats).toHaveValue('1');
    await seats.press('ArrowUp');
    await seats.press('ArrowUp');
    await expect(seats).toHaveValue('3');
    await expect(seats).toHaveAttribute('aria-valuenow', '3');

    await expect(seats).not.toHaveAttribute('aria-invalid');
  });

  test('should disable the stepper through ngModel and drop it from the form value', async ({
    page,
  }) => {
    const seats = page.getByRole('spinbutton', { name: 'Seats' });

    await page.getByLabel(/lock the seat count/i).check();

    await expect(seats).toBeDisabled();
    await expect(
      page.getByRole('button', { name: 'One seat more' })
    ).toBeDisabled();

    await page.getByRole('switch', { name: /accept/i }).click();
    await page.getByRole('button', { name: /book seats/i }).click();

    await expect(
      page.getByRole('status').filter({ hasText: /booked/i })
    ).toContainText(/seat count locked/i);
  });

  test('should submit once both controls are valid', async ({ page }) => {
    const terms = page.getByRole('switch', { name: /accept/i });

    await page.getByRole('spinbutton', { name: 'Seats' }).fill('4');
    await terms.click();
    await expect(terms).toHaveAttribute('aria-checked', 'true');

    await page.getByRole('button', { name: /book seats/i }).click();

    await expect(
      page.getByRole('status').filter({ hasText: /booked/i })
    ).toContainText(/4 seat\(s\) booked/i);
  });
});
