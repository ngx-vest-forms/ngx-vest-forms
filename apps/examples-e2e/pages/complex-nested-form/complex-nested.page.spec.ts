import { expect, test } from '@playwright/test';

test.describe('Complex Nested Page', () => {
  test('should render the nested repeatable demo layout', async ({ page }) => {
    await page.goto('/complex-nested', { waitUntil: 'domcontentloaded' });

    await expect(
      page.getByRole('heading', {
        name: /complex nested & repeatable form/i,
        level: 1,
      })
    ).toBeVisible();

    const contentAside = page
      .getByRole('complementary')
      .filter({ hasText: /key features/i });
    await expect(contentAside).toBeVisible();
    await expect(contentAside).toContainText(/form state/i);
    await expect(contentAside).toContainText(/form value/i);

    await expect(page.getByRole('button', { name: /add member/i })).toBeVisible();
    await expect(
      page.getByRole('button', { name: /register team/i })
    ).toBeVisible();
  });
});
