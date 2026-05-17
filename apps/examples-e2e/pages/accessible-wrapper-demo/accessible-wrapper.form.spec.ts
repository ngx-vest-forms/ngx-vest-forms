import { expect, test } from '@playwright/test';
import { fillAndBlur } from '../../helpers/form-helpers';

test.describe('Accessible Wrapper Demo Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/accessible-wrapper');
  });

  test('should wire ARIA correctly for single-control and manual modes', async ({
    page,
  }) => {
    const preferredName = page.getByRole('textbox', { name: /preferred name/i });
    const searchQuery = page.getByRole('searchbox', { name: /search query/i });
    const clearSearch = page.getByRole('button', {
      name: /clear search query/i,
    });

    await page.getByRole('button', { name: /save preferences/i }).click();

    const errorSummary = page.getByRole('alert').filter({
      hasText: /preferred name is required/i,
    });

    await expect(errorSummary).toContainText(/preferred name is required/i);
    await expect(errorSummary).toContainText(/search query is required/i);
    await expect(searchQuery).toHaveAttribute('aria-invalid', 'true');

    const preferredDescribedBy = await preferredName.getAttribute(
      'aria-describedby'
    );
    expect(preferredDescribedBy).toMatch(/preferred-name-hint/);
    expect(preferredDescribedBy).toMatch(/ngx-error-control-\d+-error/);

    const searchDescribedBy = await searchQuery.getAttribute('aria-describedby');
    expect(searchDescribedBy).toMatch(/search-query-hint/);
    expect(searchDescribedBy).toMatch(/ngx-error-control-\d+-error/);
    expect(await clearSearch.getAttribute('aria-describedby')).toBeNull();
    expect(await clearSearch.getAttribute('aria-invalid')).toBeNull();
  });

  test('should keep validation on the input while the helper button stays neutral', async ({
    page,
  }) => {
    const preferredName = page.getByRole('textbox', { name: /preferred name/i });
    const searchQuery = page.getByRole('searchbox', { name: /search query/i });

    await fillAndBlur(preferredName, 'Ada');
    await fillAndBlur(searchQuery, 'ngx-vest-forms');
    await page.getByRole('button', { name: /clear search query/i }).click();

    await expect(searchQuery).toHaveValue('');

    await fillAndBlur(searchQuery, 'ngx-vest-forms');
    await page.getByRole('button', { name: /save preferences/i }).click();

    await expect(
      page.getByRole('status').filter({ hasText: /preferences saved/i })
    ).toBeVisible();
  });
});
