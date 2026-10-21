import { expect, test } from '@playwright/test';

test.describe('Custom Controls Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/custom-controls', { waitUntil: 'domcontentloaded' });
  });

  test('should validate empty controls and submit a completed custom-control form', async ({
    page,
  }) => {
    const submitButton = page.getByRole('button', { name: /submit/i });

    await submitButton.click();
    await expect(
      page.getByRole('region', { name: 'Errors' }).getByText(/pick a rating/i)
    ).toBeVisible();
    await expect(
      page
        .getByRole('region', { name: 'Errors' })
        .getByText(/select your experience level/i)
    ).toBeVisible();
    await expect(
      page
        .getByRole('region', { name: 'Errors' })
        .getByText(/add at least one tag/i)
    ).toBeVisible();

    await page.getByRole('radio', { name: /5 stars/i }).click();
    await page.getByRole('radio', { name: /senior/i }).click();

    const tagInput = page.getByLabel(/add a tag/i);
    await tagInput.fill('angular');
    await tagInput.press('Enter');

    await expect(
      page.getByRole('button', { name: /remove tag angular/i })
    ).toBeVisible();

    await submitButton.click();

    const successAlert = page
      .getByRole('status')
      .filter({ hasText: /submitted/i });
    await expect(successAlert).toBeVisible();
    await expect(successAlert).toContainText(/rated 5\/5/i);
    await expect(successAlert).toContainText(/senior/i);
    await expect(successAlert).toContainText(/1 tag/i);
  });

  test('should move focus into the rating on the first invalid submit', async ({
    page,
  }) => {
    // The rating has no native input, so the directive can only find it once
    // the wrapper has rendered its invalid state. Keyboard users must not be
    // left on the submit button after the very first attempt.
    await page.getByRole('button', { name: /submit/i }).click();

    await expect(page.getByRole('radio', { name: /1 star/i })).toBeFocused();
  });

  test('should mark both radiogroups aria-invalid after an invalid submit and clear them once a value is chosen', async ({
    page,
  }) => {
    const rating = page.getByRole('radiogroup', { name: /rating/i });
    const experience = page.getByRole('radiogroup', {
      name: /experience level/i,
    });

    await page.getByRole('button', { name: /submit/i }).click();

    // The wrapper stamps button-based radiogroups like native inputs.
    await expect(rating).toHaveAttribute('aria-invalid', 'true');
    await expect(rating).toHaveAccessibleDescription(/pick a rating/i);
    await expect(experience).toHaveAttribute('aria-invalid', 'true');
    await expect(experience).toHaveAccessibleDescription(
      /select your experience level/i
    );

    await page.getByRole('radio', { name: /5 stars/i }).click();
    await page.getByRole('radio', { name: /senior/i }).click();

    await expect(rating).not.toHaveAttribute('aria-invalid');
    await expect(experience).not.toHaveAttribute('aria-invalid');
  });

  test('should confirm the experience level once it is valid and touched (ngxControlState)', async ({
    page,
  }) => {
    const confirmation = page.getByText('Experience level selected.');
    await expect(confirmation).toHaveCount(0);

    await page.getByRole('radio', { name: /senior/i }).click();
    await page.getByRole('radio', { name: /5 stars/i }).click();

    await expect(confirmation).toBeVisible();
  });

  test('should name the tag fieldset "Tags" and show its error on an invalid submit', async ({
    page,
  }) => {
    const tags = page.getByRole('group', { name: 'Tags' });

    await page.getByRole('button', { name: /submit/i }).click();

    await expect(tags.getByText(/add at least one tag/i)).toBeVisible();
  });

  test('should show the tag error when focus leaves the tag input without a tag', async ({
    page,
  }) => {
    const tagInput = page.getByLabel(/add a tag/i);
    const tags = page.getByRole('group', { name: 'Tags' });

    await tagInput.focus();
    await page.getByRole('radio', { name: /5 stars/i }).focus();

    await expect(tags.getByText(/add at least one tag/i)).toBeVisible();
  });

  test('should clear rating, level and tags when Reset is clicked', async ({
    page,
  }) => {
    await page.getByRole('radio', { name: /5 stars/i }).click();
    await page.getByRole('radio', { name: /senior/i }).click();
    const tagInput = page.getByLabel(/add a tag/i);
    await tagInput.fill('angular');
    await tagInput.press('Enter');
    await expect(
      page.getByRole('button', { name: /remove tag angular/i })
    ).toBeVisible();

    await page.getByRole('button', { name: /reset/i }).click();

    await expect(page.getByRole('radio', { name: /5 stars/i })).toHaveAttribute(
      'aria-checked',
      'false'
    );
    await expect(page.getByRole('radio', { name: /senior/i })).toHaveAttribute(
      'aria-checked',
      'false'
    );
    await expect(
      page.getByRole('button', { name: /remove tag angular/i })
    ).toHaveCount(0);
  });
});
