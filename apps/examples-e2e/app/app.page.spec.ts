import { expect, test } from '@playwright/test';

test.describe('App Shell', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test('should load the application shell on the default demo', async ({
    page,
  }) => {
    await expect(page).toHaveURL(/\/starter$/);
    await expect(page).toHaveTitle('Starter Contact Form | ngx-vest-forms');
    await expect(
      page.getByRole('navigation', { name: 'Demo navigation' })
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /skip to main content/i })
    ).toBeAttached();
  });

  test('should open a page with a heading for every nav link', async ({
    page,
  }) => {
    // Visits every lazy route; on a cold dev server each first visit compiles.
    test.slow();

    // Links come from the rendered nav, so a new demo needs no change here.
    const links = page
      .getByRole('navigation', { name: 'Demo navigation' })
      .getByRole('link');
    // evaluateAll() does not wait, so let the nav render first.
    await expect(links.first()).toBeVisible();
    const hrefs = await links.evaluateAll((els) =>
      els.map((el) => el.getAttribute('href') ?? '')
    );
    expect(hrefs.length).toBeGreaterThan(0);

    // Click through the nav instead of reloading each route: it exercises the
    // router the way a user does and keeps the test within its timeout.
    for (const [index, href] of hrefs.entries()) {
      await links.nth(index).click();
      await expect(page).toHaveURL((url) => url.pathname === href);
      await expect(
        page.getByRole('heading', { level: 1 }).first()
      ).toBeVisible();
    }
  });

  test('should update the heading and document title on navigation', async ({
    page,
  }) => {
    const nav = page.getByRole('navigation', { name: 'Demo navigation' });
    await nav.getByRole('link', { name: 'Business Policy' }).click();

    await expect(page).toHaveURL(/\/business-policy$/);
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Vest-First Business Policy',
      })
    ).toBeVisible();
    await expect(page).toHaveTitle(
      'Vest-First Business Policy | ngx-vest-forms'
    );
  });
});
