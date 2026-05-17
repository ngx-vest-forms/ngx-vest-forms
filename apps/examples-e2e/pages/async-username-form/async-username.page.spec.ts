import { expect, test } from '@playwright/test';

test.describe('Async Username Page', () => {
  test('should render the async validation example layout', async ({ page }) => {
    await page.goto('/async-username', { waitUntil: 'domcontentloaded' });

    await expect(
      page.getByRole('heading', {
        name: /async username availability/i,
        level: 1,
      })
    ).toBeVisible();

    const contentAside = page
      .getByRole('complementary')
      .filter({ hasText: /how async validation behaves/i });
    await expect(contentAside).toBeVisible();
    await expect(contentAside).toContainText(/form state/i);
    await expect(contentAside).toContainText(/form value/i);

    await expect(
      page.getByRole('textbox', { name: /username/i })
    ).toBeVisible();
    await expect(
      page.getByRole('textbox', { name: /display name/i })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /reserve username/i })
    ).toBeVisible();
  });
});
