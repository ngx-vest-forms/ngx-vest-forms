import { test } from '@playwright/test';

test('Debug - Check available buttons', async ({ page }) => {
  await page.goto('/advanced-patterns/dynamic-arrays');
  await page.waitForLoadState('networkidle');

  // Reset form
  await page.getByRole('button', { name: /Reset Form/i }).click();
  await page.waitForTimeout(1000);

  // List all buttons
  const buttons = await page.locator('button').all();
  console.log('Available buttons:');
  for (const button of buttons) {
    const text = await button.textContent();
    const title = await button.getAttribute('title');
    console.log(`- Text: "${text?.trim()}" | Title: "${title}"`);
  }

  // Check current contact count
  const contactCount = await page
    .locator('[data-testid="contact-item"]')
    .count();
  console.log(`Current contact items: ${contactCount}`);

  // Try clicking "Add Email" button
  console.log('Looking for Add Email button...');
  const addEmailButtons = await page
    .getByRole('button', { name: /Add Email/i })
    .all();
  console.log(`Found ${addEmailButtons.length} Add Email buttons`);

  if (addEmailButtons.length > 0) {
    console.log('Clicking first Add Email button...');
    await addEmailButtons[0].click();
    await page.waitForTimeout(1000);

    const newContactCount = await page
      .locator('[data-testid="contact-item"]')
      .count();
    console.log(`Contact items after click: ${newContactCount}`);
  }
});
