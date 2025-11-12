import { expect, test } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/examples/i);
  });

  test('should navigate to purchase form', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /purchase form/i }).click();
    await expect(page).toHaveURL(/\/purchase/);
    await expect(
      page.getByRole('heading', { name: /complex form with.*validations/i })
    ).toBeVisible();
  });

  test('should navigate to business hours form', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /business hours form/i }).click();
    await expect(page).toHaveURL(/\/business-hours/);
    await expect(
      page.getByRole('heading', {
        name: /form array with complex validations/i,
      })
    ).toBeVisible();
  });

  test('should navigate to validation config demo', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /validationconfig demo/i }).click();
    await expect(page).toHaveURL(/\/validation-config-demo/);
    await expect(
      page.getByRole('heading', { name: /validationconfig demo/i, level: 1 })
    ).toBeVisible();
  });

  test('should render all navigation links', async ({ page }) => {
    await page.goto('/');

    await expect(
      page.getByRole('link', { name: /purchase form/i })
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /business hours form/i })
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /validationconfig demo/i })
    ).toBeVisible();
  });

  test('should support browser back/forward navigation', async ({ page }) => {
    await page.goto('/purchase');
    await page.getByRole('link', { name: /business hours form/i }).click();
    await expect(page).toHaveURL(/\/business-hours/);

    await page.goBack();
    await expect(page).toHaveURL(/\/purchase/);

    await page.goForward();
    await expect(page).toHaveURL(/\/business-hours/);
  });
});
