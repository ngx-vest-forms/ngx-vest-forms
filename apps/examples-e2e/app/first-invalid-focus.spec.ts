import { expect, test } from '@playwright/test';

/**
 * An empty submit moves focus to the first invalid field. These pages bind
 * `(submitSettled)` and a `validationConfig`, so the directive revalidates
 * the config's dependents on submit; focus must still land on the first
 * field once that revalidation settles.
 */
const cases = [
  {
    route: '/validation-config-demo',
    submit: /submit form/i,
    field: 'password',
  },
  {
    route: '/date-range-adapter',
    submit: /submit form/i,
    field: 'departureDate',
  },
];

test.describe('Focus after an invalid submit', () => {
  for (const { route, submit, field } of cases) {
    test(`${route} focuses ${field}`, async ({ page }) => {
      await page.goto(route);
      await page.getByRole('button', { name: submit }).click();

      await expect(page.locator(`form [name="${field}"]`)).toBeFocused();
    });
  }
});
