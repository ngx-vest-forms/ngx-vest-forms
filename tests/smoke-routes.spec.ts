import { expect, test } from '@playwright/test';

// Lightweight smoke test to ensure each example route renders without client errors.
// Uses baseURL from playwright.config.ts.

const routes = [
  '/',
  '/fundamentals/minimal-form',
  '/fundamentals/basic-validation',
  '/fundamentals/error-display-modes',
  '/fundamentals/form-arrays',
  '/fundamentals/nested-forms',
] as const;

for (const route of routes) {
  test(`smoke: ${route}`, async ({ page }) => {
    const errors: string[] = [];
    const ignorePatterns: RegExp[] = [
      /\[ngx-vest-forms\] Could not determine field name for validation/i,
      /\[ngx-vest-forms\] Control '.*' not found for validationConfig\./i,
    ];
    const shouldIgnore = (text: string) =>
      ignorePatterns.some((r) => r.test(text));

    page.on('pageerror', (error) => {
      const text = error.message ?? String(error);
      if (!shouldIgnore(text)) errors.push(text);
    });
    page.on('console', (message) => {
      if (message.type() !== 'error') return;
      const text = message.text();
      if (!shouldIgnore(text)) errors.push(text);
    });

    await page.goto(route);

    // Basic sanity: there's a main landmark and an H1 on most pages
    await expect(page.getByRole('main')).toBeVisible();

    // Ensure we didn't hit client-side errors
    expect(errors, `Client errors on ${route}`).toEqual([]);
  });
}
