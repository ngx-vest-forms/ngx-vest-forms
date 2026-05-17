import { expect, test } from '@playwright/test';

test.describe('Business Policy Page', () => {
  test('should render the policy demo layout', async ({ page }) => {
    await page.goto('/business-policy', { waitUntil: 'domcontentloaded' });

    await expect(
      page.getByRole('heading', {
        name: /vest-first business policy/i,
        level: 1,
      })
    ).toBeVisible();

    const contentAside = page
      .getByRole('complementary')
      .filter({ hasText: /policy at a glance/i });
    await expect(contentAside).toBeVisible();
    await expect(contentAside).toContainText(/form state/i);
    await expect(contentAside).toContainText(/form value/i);

    await expect(
      page.getByRole('combobox', { name: /account type/i })
    ).toBeVisible();
    await expect(
      page.getByRole('combobox', { name: /country/i })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /submit application/i })
    ).toBeVisible();
  });
});
