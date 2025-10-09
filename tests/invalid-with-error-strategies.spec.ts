import { expect, test } from '@playwright/test';

/**
 * Tests for form.invalid() behavior with different error display strategies.
 *
 * The invalid() computed should respect the error display strategy:
 * - 'immediate': invalid() is true when there are any validation errors
 * - 'on-touch': invalid() is true only when errors exist on touched fields
 * - 'on-submit': invalid() is true only after form submission attempt
 * - 'manual': invalid() is always false (errors must be manually shown)
 *
 * This ensures the debugger status badge shows:
 * - "Idle" for pristine forms (no visible errors)
 * - "Invalid" only when errors should be visible to the user
 */
test.describe('Form invalid() respects error display strategy', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200/fundamentals/basic-validation');
    await page.waitForLoadState('networkidle');
  });

  test('on-touch strategy: pristine form shows Idle', async ({ page }) => {
    // Arrange: Form loads with 'on-touch' strategy (default)
    const statusBadge = page.locator('text=Idle').first();

    // Assert: Debugger shows "Idle" for pristine form
    await expect(statusBadge).toBeVisible();

    // Assert: Invalid indicator shows "—" (not invalid)
    await expect(page.getByText('Invalid: —')).toBeVisible();
  });

  test('on-touch strategy: touched field with error shows Invalid', async ({
    page,
  }) => {
    // Arrange: Touch the name field (leave it empty)
    await page.getByRole('textbox', { name: 'Full Name *' }).click();
    await page.getByRole('textbox', { name: 'Email Address *' }).click();

    // Assert: Error appears on the field
    await expect(page.getByRole('alert')).toContainText('Name is required');

    // Assert: Debugger status shows "Invalid"
    await expect(page.locator('text=Invalid').first()).toBeVisible();

    // Assert: Invalid indicator shows "❌" (is invalid)
    await expect(page.getByText('Invalid: ❌')).toBeVisible();
  });

  test('immediate strategy: pristine form shows Invalid', async ({ page }) => {
    // Arrange: Switch to immediate error display mode
    await page.getByRole('radio', { name: 'Immediate' }).click();

    // Assert: Debugger status shows "Invalid" (errors visible immediately)
    await expect(page.locator('text=Invalid').first()).toBeVisible();

    // Assert: Errors are visible on all required fields
    await expect(page.getByRole('alert').first()).toContainText(
      'Name is required',
    );
  });

  test('on-submit strategy: pristine form shows Idle', async ({ page }) => {
    // Arrange: Switch to on-submit error display mode
    await page.getByRole('radio', { name: 'On Submit' }).click();

    // Assert: Debugger shows "Idle" before form submission
    await expect(page.locator('text=Idle').first()).toBeVisible();

    // Assert: Invalid indicator shows "—" (not invalid yet)
    await expect(page.getByText('Invalid: —')).toBeVisible();
  });

  test('on-submit strategy: after submit shows Invalid', async ({ page }) => {
    // Arrange: Switch to on-submit and try to submit
    await page.getByRole('radio', { name: 'On Submit' }).click();
    await page.getByRole('button', { name: 'Submit Application' }).click();

    // Assert: Debugger status shows "Invalid" after submit attempt
    await expect(page.locator('text=Invalid').first()).toBeVisible();

    // Assert: Errors are now visible
    await expect(page.getByRole('alert').first()).toContainText(
      'Name is required',
    );

    // Assert: Invalid indicator shows "❌"
    await expect(page.getByText('Invalid: ❌')).toBeVisible();
  });

  test('manual strategy: never shows Invalid automatically', async ({
    page,
  }) => {
    // Arrange: Switch to manual error display mode
    await page.getByRole('radio', { name: 'Manual' }).click();

    // Act: Touch fields and try to submit
    await page.getByRole('textbox', { name: 'Full Name *' }).click();
    await page.getByRole('textbox', { name: 'Email Address *' }).click();
    await page.getByRole('button', { name: 'Submit Application' }).click();

    // Assert: Debugger still shows "Idle" (no auto-error display)
    await expect(page.locator('text=Idle').first()).toBeVisible();

    // Assert: No errors are visible (manual mode)
    await expect(page.getByRole('alert')).not.toBeVisible();

    // Assert: Invalid indicator shows "—"
    await expect(page.getByText('Invalid: —')).toBeVisible();
  });

  test('no redundant error banner appears', async ({ page }) => {
    // Arrange: Touch a field to trigger errors
    await page.getByRole('textbox', { name: 'Full Name *' }).click();
    await page.getByRole('textbox', { name: 'Email Address *' }).click();

    // Assert: The redundant "Form has validation errors" banner should NOT exist
    await expect(
      page.getByText('Form has validation errors'),
    ).not.toBeVisible();

    // Assert: But the debugger still shows the Invalid state
    await expect(page.locator('text=Invalid').first()).toBeVisible();
  });
});
