import { expect, test } from '@playwright/test';

test.describe('Navigation and Routing - App-level UX', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('main navigation works correctly', async ({ page }) => {
    await test.step('Test fundamentals navigation', async () => {
      await page.getByRole('link', { name: 'Fundamentals' }).click();
      await expect(page).toHaveURL(/fundamentals/);
    });

    await test.step('Test control wrapper navigation', async () => {
      await page.getByRole('link', { name: 'Control Wrapper' }).click();
      await expect(page).toHaveURL(/control-wrapper/);
    });
  });

  test('sidebar navigation works correctly', async ({ page }) => {
    await test.step('Navigate to fundamentals section', async () => {
      await page.getByRole('link', { name: 'Fundamentals' }).click();

      // Use more specific locators to avoid strict mode violations
      const sidebar = page.getByRole('navigation', {
        name: 'Section navigation',
      });

      await expect(
        sidebar.getByRole('link', { name: 'Minimal Form' }),
      ).toBeVisible();
      await expect(
        sidebar.getByRole('link', { name: 'Basic Validation' }),
      ).toBeVisible();
      await expect(
        sidebar.getByRole('link', { name: 'Error Display Modes' }),
      ).toBeVisible();
      await expect(
        sidebar.getByRole('link', { name: 'Form State Demo' }),
      ).toBeVisible();
    });

    await test.step('Test sidebar link navigation', async () => {
      const sidebar = page.getByRole('navigation', {
        name: 'Section navigation',
      });

      await sidebar.getByRole('link', { name: 'Basic Validation' }).click();
      await expect(page).toHaveURL(/basic-validation/);

      await sidebar.getByRole('link', { name: 'Error Display Modes' }).click();
      await expect(page).toHaveURL(/error-display-modes/);

      await sidebar.getByRole('link', { name: 'Form State Demo' }).click();
      await expect(page).toHaveURL(/form-state-demo/);
    });
  });

  test('keyboard navigation works throughout app', async ({ page }) => {
    await test.step('Test sequential keyboard navigation', async () => {
      // Focus on first interactive element (skip to main link might be first)
      await page.keyboard.press('Tab');

      // Navigate to Fundamentals directly for testing
      await page.getByRole('link', { name: 'Fundamentals' }).focus();
      await expect(
        page.getByRole('link', { name: 'Fundamentals' }),
      ).toBeFocused();

      // Test Tab to next element
      await page.keyboard.press('Tab');
      await expect(
        page.getByRole('link', { name: 'Control Wrapper' }),
      ).toBeFocused();
    });

    await test.step('Test Enter key activation', async () => {
      await page.getByRole('link', { name: 'Fundamentals' }).focus();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/fundamentals/);
    });
  });
});
