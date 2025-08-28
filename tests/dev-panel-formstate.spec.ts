import { expect, test } from '@playwright/test';

// Basic E2E to ensure dev panel reflects form state updates
// Assumes the examples app is served at localhost:4200 or similar base url configured in playwright.config.
// Adjust path if routing differs.

test.describe('Dev Panel Form State', () => {
  test('updates when user types into form fields', async ({ page }) => {
    await page.goto('/');
    // Navigate to basic validation example if a link exists, else assume root contains it.
    // Try to find heading text or fallback to direct inputs.
    const nameInput = page.getByLabel(/Full Name/i);
    await nameInput.fill('John Doe');
    const emailInput = page.getByLabel(/Email Address/i);
    await emailInput.fill('john@example.com');

    // Expand panel if collapsed
    const summary = page.getByRole('button', { name: /Form State/i }).first();
    const visible = await summary.isVisible();
    await (visible
      ? summary.click()
      : page.locator('details.dev-panel > summary').click());

    // Assert JSON contains updated values
    await expect(page.locator('details.dev-panel code')).toContainText(
      'John Doe',
    );
    await expect(page.locator('details.dev-panel code')).toContainText(
      'john@example.com',
    );
  });
});
