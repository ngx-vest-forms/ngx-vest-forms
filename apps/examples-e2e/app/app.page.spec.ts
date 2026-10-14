import { expect, test } from '@playwright/test';

/** Nav labels from `apps/examples/src/app/shared/routes.metadata.ts`. */
const NAV_LABELS = [
  'Starter Contact Form',
  'Validation Config',
  'Display Modes',
  'Business Hours',
  'Async Username',
  'Business Policy',
  'Conditional Structure',
  'Native Vest Schema',
  'Zod Schema',
  'Composite Adapter',
  'Complex Nested & Repeatable',
  'Custom Controls',
  'Accessible Wrapper',
  'Purchase Checkout',
  'Submission Patterns',
  'Auto-Save Draft',
  'Multi-Form Wizard',
];

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

  test('should render a nav link for every demo', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Demo navigation' });
    for (const label of NAV_LABELS) {
      await expect(nav.getByRole('link', { name: label })).toBeVisible();
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
