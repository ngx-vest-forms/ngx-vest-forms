import { expect, test } from '@playwright/test';
import {
  fillAndBlur,
  waitForValidationToSettle,
} from '../../helpers/form-helpers';

test.describe('Complex Nested Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/complex-nested', { waitUntil: 'domcontentloaded' });
  });

  test('should handle add/remove member flows and submit a valid team', async ({
    page,
  }) => {
    const addMemberButton = page.getByRole('button', { name: /add member/i });
    const registerButton = page.getByRole('button', { name: /register team/i });
    const removeMember1Button = page.getByRole('button', {
      name: /remove member 1/i,
    });

    await removeMember1Button.click();
    await expect(page.getByText(/no team members yet/i)).toBeVisible();

    await registerButton.click();

    await addMemberButton.click();
    await expect(
      page.getByRole('heading', { name: /member 1/i })
    ).toBeVisible();

    await fillAndBlur(
      page.getByLabel('Company name', { exact: true }),
      'Acme Corp'
    );
    await fillAndBlur(
      page.getByLabel('Street', { exact: true }),
      'Main Street'
    );
    await fillAndBlur(page.getByLabel('Number', { exact: true }), '42');
    await fillAndBlur(page.getByLabel('City', { exact: true }), 'Amsterdam');
    await fillAndBlur(page.getByLabel('Zipcode', { exact: true }), '1011AB');
    await fillAndBlur(page.getByLabel('Country', { exact: true }), 'NL');

    const firstMemberFullName = page
      .getByLabel('Full name', { exact: true })
      .first();
    const firstMemberEmail = page.getByLabel('Email', { exact: true }).first();
    const firstMemberRole = page.getByLabel('Role', { exact: true }).first();

    await fillAndBlur(firstMemberFullName, 'Ada Lovelace');
    await fillAndBlur(firstMemberEmail, 'ada@example.com');
    await fillAndBlur(firstMemberRole, 'Engineer');

    await waitForValidationToSettle(page);
    await registerButton.click();

    const successAlert = page
      .getByRole('status')
      .filter({ hasText: /team registered/i });
    await expect(successAlert).toBeVisible();
    await expect(successAlert).toContainText(/acme corp/i);
    await expect(successAlert).toContainText(/1 team member/i);
  });

  test('should flag a repeated member field inside its group and drop those errors when the member is removed', async ({
    page,
  }) => {
    const registerButton = page.getByRole('button', { name: /register team/i });
    const memberFullName = page.getByLabel('Full name', { exact: true });
    const memberEmail = page.getByLabel('Email', { exact: true });

    await fillAndBlur(
      page.getByLabel('Company name', { exact: true }),
      'Acme Corp'
    );
    await fillAndBlur(
      page.getByLabel('Street', { exact: true }),
      'Main Street'
    );
    await fillAndBlur(page.getByLabel('Number', { exact: true }), '42');
    await fillAndBlur(page.getByLabel('City', { exact: true }), 'Amsterdam');
    await fillAndBlur(page.getByLabel('Zipcode', { exact: true }), '1011AB');
    await fillAndBlur(page.getByLabel('Country', { exact: true }), 'NL');

    await page.getByRole('button', { name: /add member/i }).click();
    await registerButton.click();

    // Both members are empty, so each member's required fields report errors.
    await expect(memberFullName).toHaveCount(2);
    await expect(memberFullName.nth(1)).toHaveAttribute('aria-invalid', 'true');
    await expect(memberEmail.nth(1)).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByText(/email is required/i)).toHaveCount(2);

    // Member 1's Remove button must stay clickable while both cards show
    // errors (it used to sit under member 2's absolutely positioned button).
    await page.getByRole('button', { name: /remove member 1/i }).click();

    await expect(memberFullName).toHaveCount(1);
    await expect(page.getByText(/email is required/i)).toHaveCount(1);

    // The removed member's errors must not block a later valid submit.
    await fillAndBlur(memberFullName.first(), 'Ada Lovelace');
    await fillAndBlur(memberEmail.first(), 'ada@example.com');
    await fillAndBlur(
      page.getByLabel('Role', { exact: true }).first(),
      'Engineer'
    );
    await waitForValidationToSettle(page);
    await registerButton.click();

    await expect(
      page.getByRole('status').filter({ hasText: /team registered/i })
    ).toBeVisible();
  });
});
