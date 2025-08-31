import { expect, test } from '@playwright/test';

// SKIPPED: Custom schema form is from old backup examples
// These tests are for forms that are no longer active in the current application
// TODO: Remove this test file or update when custom schema forms are re-implemented

test.describe.skip('Custom Schema Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/custom-schema-form');
  });

  test('shows field validation errors on initial submit with empty required fields (no success dialog)', async ({
    page,
  }) => {
    await test.step('Submit empty form', async () => {
      await page.getByRole('button', { name: 'Save Profile' }).click();
      // No dialog should appear now on invalid submit
      await page.waitForTimeout(150); // small buffer to ensure no dialog
    });

    await test.step('Verify error messages rendered (ARIA alerts)', async () => {
      const alerts = page.getByRole('alert');
      await expect(alerts).toHaveCount(5); // firstName, lastName, email, dateOfBirth, bio
      await expect(page.getByRole('alert').nth(0)).toContainText(
        'First name is required',
      );
      await expect(page.getByRole('alert').nth(1)).toContainText(
        'Last name is required',
      );
      await expect(page.getByRole('alert').nth(2)).toContainText(
        'Email is required',
      );
      await expect(page.getByRole('alert').nth(3)).toContainText(
        'Date of birth is required',
      );
      await expect(page.getByRole('alert').nth(4)).toContainText(
        'Bio is required',
      );
    });
  });

  test('successfully submits after filling required fields (alerts disappear)', async ({
    page,
  }) => {
    await test.step('Fill required fields', async () => {
      await page.getByRole('textbox', { name: 'First Name *' }).fill('Alice');
      await page.getByRole('textbox', { name: 'Last Name *' }).fill('Smith');
      await page
        .getByRole('textbox', { name: 'Email *' })
        .fill('alice@example.com');
      await page
        .getByRole('textbox', { name: 'Date of Birth *' })
        .fill('2000-01-01');
      await page
        .getByRole('textbox', { name: 'Bio *' })
        .fill('Short bio about Alice');
    });

    await test.step('Submit and accept dialog', async () => {
      const dialogPromise = new Promise<void>((resolve) => {
        page.once('dialog', async (dialog) => {
          await dialog.accept();
          resolve();
        });
      });
      await page.getByRole('button', { name: 'Save Profile' }).click();
      await dialogPromise;
    });

    await test.step('Verify no validation alerts remain', async () => {
      await expect(page.getByRole('alert')).toHaveCount(0);
      // Snapshot ARIA tree of the personal information section (sanity structure check)
      await expect(
        page.getByRole('heading', { name: 'Personal Information' }),
      ).toBeVisible();
    });
  });
});
