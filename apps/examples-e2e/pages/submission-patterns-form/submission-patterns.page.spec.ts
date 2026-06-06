import { expect, test } from '@playwright/test';

test.describe('Submission Patterns Page', () => {
  test('should render the submission-state demo layout', async ({ page }) => {
    await page.goto('/submission-patterns', { waitUntil: 'domcontentloaded' });

    await expect(
      page.getByRole('heading', {
        name: /submission patterns/i,
        level: 1,
      })
    ).toBeVisible();

    const contentAside = page
      .getByRole('complementary')
      .filter({ hasText: /simulated outcome/i });
    await expect(contentAside).toBeVisible();
    await expect(contentAside).toContainText(/form state/i);
    await expect(contentAside).toContainText(/form value/i);

    await expect(page.getByLabel(/server response/i)).toBeVisible();
    await expect(
      page.getByRole('button', { name: /create account/i })
    ).toBeVisible();
  });
});
