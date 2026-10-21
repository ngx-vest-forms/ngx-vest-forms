import { expect, test } from '@playwright/test';
import {
  fillAndSubmitInOneTick,
  type OneTickFieldValues,
} from '../helpers/form-helpers';

/**
 * A valid form submitted in the same tick as its last edit must still submit.
 * `(ngSubmit)` can fire while the field validators are still running; pages
 * that decide in `(submitSettled)` wait for the real outcome instead of
 * dropping the submit without a message.
 */
const cases: {
  route: string;
  values: OneTickFieldValues;
  submit: RegExp;
  success: RegExp;
}[] = [
  {
    route: '/conditional-structure',
    values: { contactName: 'Ada Lovelace' },
    submit: /save delivery plan/i,
    success: /delivery plan submitted/i,
  },
  {
    route: '/submission-patterns',
    values: {
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'CorrectHorse9!',
      acceptTerms: true,
    },
    submit: /create account/i,
    success: /account created/i,
  },
  {
    route: '/business-policy',
    values: {
      accountType: 'Personal',
      legalName: 'Ada Lovelace',
      country: 'United Kingdom',
      annualRevenue: '120000',
      requestedCreditLimit: '5000',
      paymentTermsDays: '30',
    },
    submit: /submit application/i,
    success: /application submitted/i,
  },
  {
    route: '/complex-nested',
    values: {
      name: 'Analytical Engines Ltd',
      street: 'Main Street',
      number: '12',
      city: 'London',
      zipcode: '1234AB',
      country: 'United Kingdom',
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      role: 'Engineer',
    },
    submit: /register team/i,
    success: /submitted payload/i,
  },
];

test.describe('Submitting in the same tick as the last edit', () => {
  for (const { route, values, submit, success } of cases) {
    test(`${route} submits a valid form`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator('form')).toBeVisible();

      await fillAndSubmitInOneTick(page, values, submit);

      await expect(page.getByText(success).first()).toBeVisible();
    });
  }
});
