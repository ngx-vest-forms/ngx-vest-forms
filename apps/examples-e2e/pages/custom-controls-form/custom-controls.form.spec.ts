import { expect, test } from '@playwright/test';

test.describe('Custom Controls Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/custom-controls', { waitUntil: 'domcontentloaded' });
  });

  test('should validate empty controls and submit a completed custom-control form', async ({
    page,
  }) => {
    const submitButton = page.getByRole('button', { name: /submit/i });

    await submitButton.click();
    await expect(
      page.getByRole('alert').getByText(/pick a rating/i)
    ).toBeVisible();
    await expect(
      page.getByRole('alert').getByText(/select your experience level/i)
    ).toBeVisible();
    await expect(
      page.getByRole('alert').getByText(/add at least one tag/i)
    ).toBeVisible();

    await page.getByRole('radio', { name: /5 stars/i }).click();
    await page.getByRole('radio', { name: /senior/i }).click();

    const tagInput = page.getByLabel(/add a tag/i);
    await tagInput.fill('angular');
    await tagInput.press('Enter');

    await expect(
      page.getByRole('button', { name: /remove tag angular/i })
    ).toBeVisible();

    await submitButton.click();

    const successAlert = page
      .getByRole('status')
      .filter({ hasText: /submitted/i });
    await expect(successAlert).toBeVisible();
    await expect(successAlert).toContainText(/rated 5\/5/i);
    await expect(successAlert).toContainText(/senior/i);
    await expect(successAlert).toContainText(/1 tag/i);
  });
});
