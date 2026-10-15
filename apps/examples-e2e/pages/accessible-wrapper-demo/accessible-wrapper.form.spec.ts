import { expect, test } from '@playwright/test';
import { fillAndBlur } from '../../helpers/form-helpers';

test.describe('Accessible Wrapper Demo Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/accessible-wrapper');
  });

  test('should wire ARIA correctly for single-control and manual modes', async ({
    page,
  }) => {
    const preferredName = page.getByRole('textbox', {
      name: /preferred name/i,
    });
    const searchQuery = page.getByRole('searchbox', { name: /search query/i });
    const clearSearch = page.getByRole('button', {
      name: /clear search query/i,
    });

    await page.getByRole('button', { name: /save preferences/i }).click();

    const errorSummary = page.getByRole('region', { name: 'Errors' }).filter({
      hasText: /preferred name is required/i,
    });

    await expect(errorSummary).toContainText(/preferred name is required/i);
    await expect(errorSummary).toContainText(/search query is required/i);
    await expect(searchQuery).toHaveAttribute('aria-invalid', 'true');

    await expect(preferredName).toHaveAttribute(
      'aria-describedby',
      /preferred-name-hint/
    );
    await expect(preferredName).toHaveAttribute(
      'aria-describedby',
      /ngx-error-control-\d+-error/
    );

    await expect(searchQuery).toHaveAttribute(
      'aria-describedby',
      /search-query-hint/
    );
    await expect(searchQuery).toHaveAttribute(
      'aria-describedby',
      /ngx-error-control-\d+-error/
    );
    await expect(clearSearch).not.toHaveAttribute('aria-describedby');
    await expect(clearSearch).not.toHaveAttribute('aria-invalid');
  });

  test('should keep aria-invalid on the search input while the helper button stays unmarked (ADR-0006)', async ({
    page,
  }) => {
    const preferredName = page.getByRole('textbox', {
      name: /preferred name/i,
    });
    const searchQuery = page.getByRole('searchbox', { name: /search query/i });
    const clearSearch = page.getByRole('button', {
      name: /clear search query/i,
    });

    await fillAndBlur(preferredName, 'Ada');
    await fillAndBlur(searchQuery, 'ngx-vest-forms');
    await clearSearch.click();

    await expect(searchQuery).toHaveValue('');

    await page.getByRole('button', { name: /save preferences/i }).click();

    await expect(searchQuery).toHaveAttribute('aria-invalid', 'true');
    await expect(clearSearch).not.toHaveAttribute('aria-invalid');
    await expect(clearSearch).not.toHaveAttribute('aria-describedby');

    await fillAndBlur(searchQuery, 'ngx-vest-forms');
    await page.getByRole('button', { name: /save preferences/i }).click();

    await expect(
      page.getByRole('status').filter({ hasText: /preferences saved/i })
    ).toBeVisible();
  });
});
