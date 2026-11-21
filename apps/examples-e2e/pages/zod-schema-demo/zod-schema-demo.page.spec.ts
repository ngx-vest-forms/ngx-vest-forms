import { expect, test } from '@playwright/test';

test('explains the Form Contract and links to the native Vest schema example', async ({
  page,
}) => {
  await page.goto('/zod-schema-demo');

  await expect(page.getByText('Zod describes the structure.')).toBeVisible();
  await expect(page.getByText('Vest owns the rules.')).toBeVisible();

  await page.getByRole('link', { name: 'Native Vest Schema demo' }).click();
  await expect(page).toHaveURL(/\/native-schema-demo$/);
  await expect(
    page.getByRole('heading', { name: 'Native Vest Schema Demo', level: 1 })
  ).toBeVisible();
});
