import { expect, test } from '@playwright/test';

test.describe('App Shell', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test('opens the Starter Form by default', async ({ page }) => {
    await expect(page).toHaveURL(/\/starter$/);
    await expect(page).toHaveTitle('Starter Contact Form | ngx-vest-forms');
    await expect(
      page.getByRole('navigation', { name: 'Demo navigation' })
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /skip to main content/i })
    ).toBeAttached();
  });

  test('opens each example with its heading, tab title, and Form State panel', async ({
    page,
  }) => {
    const links = page
      .getByRole('navigation', { name: 'Demo navigation' })
      .getByRole('link');
    const main = page.getByRole('main');
    const heading = main.getByRole('heading', { level: 1 });
    await expect(links.first()).toBeVisible();
    const hrefs = await links.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute('href'))
    );

    for (const [index, href] of hrefs.entries()) {
      await test.step(`Open ${href}`, async () => {
        const link = links.nth(index);
        await link.click();
        await expect(page).toHaveURL((url) => url.pathname === href);
        await expect(link).toHaveAttribute('aria-current', 'page');
        await expect(heading).toBeVisible();
        await expect(page).toHaveTitle(
          `${await heading.innerText()} | ngx-vest-forms`
        );
        await expect(
          main.getByRole('heading', { name: 'Form State', exact: true })
        ).toBeVisible();
        await expect(
          main.getByRole('heading', { name: 'Form Value', exact: true })
        ).toBeVisible();
      });
    }
  });
});
