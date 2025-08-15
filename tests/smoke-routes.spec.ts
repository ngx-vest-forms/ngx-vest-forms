import { expect, test } from '@playwright/test';

// Lightweight smoke test to ensure each example route renders without client errors.
// Uses baseURL from playwright.config.ts.

const routes = [
  '/',
  '/minimal-form',
  '/simple-form',
  '/contact-form',
  '/registration-form',
  '/profile-form',
  '/business-hours-form',
  '/survey-form',
  '/async-validation-form',
  '/control-wrapper-simple',
  '/control-wrapper-registration',
  '/zod-schema-form',
  '/valibot-schema-form',
  '/custom-schema-form',
  '/phone-numbers-form',
  '/smart-profile-form',
  '/purchase-form',
  '/wizard-form',
  '/arktype-schema-form',
  '/migration-example',
  '/basic-smart-state',
  '/realtime-sync',
  '/nested-arrays',
  '/dynamic-forms',
  '/custom-wrapper',
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
