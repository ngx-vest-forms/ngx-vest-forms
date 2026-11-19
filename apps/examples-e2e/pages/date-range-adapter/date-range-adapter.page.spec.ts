import { expect, test } from '@playwright/test';
import { navigateToDateRangeAdapter } from '../../helpers/form-helpers';

test('changes the date form and its explanation when the user changes approach with the keyboard', async ({
  page,
}) => {
  await navigateToDateRangeAdapter(page);

  const approaches = page.getByRole('group', { name: /form approach/i });
  const split = approaches.getByRole('radio', { name: /split wrappers/i });
  const composite = approaches.getByRole('radio', {
    name: /composite adapter/i,
  });
  const splitHeading = page.getByRole('heading', {
    name: /split wrappers/i,
    level: 3,
  });
  const compositeHeading = page.getByRole('heading', {
    name: /composite adapter/i,
    level: 3,
  });
  const explanation = page.locator('ngx-card').filter({
    has: page.getByRole('heading', { name: /how it works/i, level: 2 }),
  });

  await expect(split).toBeChecked();
  await expect(splitHeading).toBeVisible();
  await expect(explanation).toContainText(/no hidden proxies/i);
  await expect(explanation).toContainText(/no manual error aggregation/i);

  await split.focus();
  await split.press('ArrowRight');
  await expect(composite).toBeChecked();
  await expect(compositeHeading).toBeVisible();
  await expect(explanation).toContainText(/hidden proxy fields/i);

  await composite.press('ArrowLeft');
  await expect(split).toBeChecked();
  await expect(splitHeading).toBeVisible();
  await expect(explanation).toContainText(/no hidden proxies/i);
});
