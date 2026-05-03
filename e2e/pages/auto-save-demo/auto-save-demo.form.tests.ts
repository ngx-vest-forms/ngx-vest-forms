import { expect, test } from '@playwright/test';
import {
  expectFieldHasError,
  navigateToAutoSaveDemo,
  typeAndBlur,
  waitForValidationToSettle,
} from '../../helpers/form-helpers';

const STORAGE_KEY = 'ngx-vest-forms:auto-save-demo:draft';

test.describe('Auto-Save Draft Demo', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToAutoSaveDemo(page);
    await page.evaluate((key) => sessionStorage.removeItem(key), STORAGE_KEY);
    await page.reload();
    await navigateToAutoSaveDemo(page);
  });

  test('should save a draft on blur and keep the saved value in sessionStorage', async ({
    page,
  }) => {
    await test.step('Blur a changed field to trigger draft save', async () => {
      const projectName = page.getByLabel('Project name', { exact: true });

      await typeAndBlur(projectName, 'Website refresh', 0);

      await expect(
        page.getByRole('heading', { name: /saving draft/i })
      ).toBeVisible();
      await expect(
        page.getByRole('heading', { name: /draft saved/i })
      ).toBeVisible();
      await expect(page.locator('aside')).toContainText(/website refresh/i);
    });

    await test.step('Verify temporary storage contains the saved draft', async () => {
      const storedDraft = await page.evaluate((key) => {
        const raw = sessionStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      }, STORAGE_KEY);

      expect(storedDraft).toBeTruthy();
      expect(storedDraft?.draft?.projectName).toBe('Website refresh');
      expect(storedDraft?.field).toBe('projectName');
      expect(storedDraft?.version).toBeGreaterThan(0);
    });
  });

  test('should restore the latest draft after a page reload', async ({ page }) => {
    await test.step('Save a draft first', async () => {
      const projectName = page.getByLabel('Project name', { exact: true });
      const notes = page.getByLabel('Draft notes', { exact: true });

      await typeAndBlur(projectName, 'Release checklist', 0);
      await typeAndBlur(notes, 'Add deployment notes for the production team.', 0);
      await waitForValidationToSettle(page);

      await projectName.focus();
      await projectName.blur();

      await expect(
        page.getByRole('heading', { name: /draft saved/i })
      ).toBeVisible();

      await expect
        .poll(async () => {
          return await page.evaluate((key) => {
            const raw = sessionStorage.getItem(key);
            return raw ? JSON.parse(raw)?.draft?.notes ?? '' : '';
          }, STORAGE_KEY);
        })
        .toBe('Add deployment notes for the production team.');
    });

    await test.step('Reload and verify values are restored from sessionStorage', async () => {
      await page.reload();
      await navigateToAutoSaveDemo(page);

      await expect(page.getByLabel('Project name', { exact: true })).toHaveValue(
        'Release checklist'
      );
      await expect(page.getByLabel('Draft notes', { exact: true })).toHaveValue(
        'Add deployment notes for the production team.'
      );
      await expect(page.locator('aside')).toContainText(
        /restored from sessionstorage for this browser tab/i
      );
      await expect(page.locator('aside')).toContainText(/sessionstorage/i);
    });
  });

  test('should keep dependent errors quiet until the dependent field is blurred', async ({
    page,
  }) => {
    await test.step('Fill quantity and confirm justification stays quiet', async () => {
      const quantity = page.getByLabel('Quantity', { exact: true });
      const justification = page.getByLabel('Quantity justification', {
        exact: true,
      });
      const justificationWrapper = page
        .locator('ngx-control-wrapper')
        .filter({ has: justification });

      await typeAndBlur(quantity, '5', 0);
      await waitForValidationToSettle(page);

      await expect(
        justificationWrapper.getByRole('status').filter({
          hasText: /justification is required when quantity is provided/i,
        })
      ).toHaveCount(0);
      await expect(justification).toHaveClass(/ng-untouched/);

      await justification.focus();
      await justification.blur();

      await expectFieldHasError(
        justification,
        /justification is required when quantity is provided/i
      );
    });
  });

  test('should keep reverse dependent errors quiet until the original field is blurred', async ({
    page,
  }) => {
    await test.step('Fill quantity justification and confirm quantity stays quiet', async () => {
      const quantity = page.getByLabel('Quantity', { exact: true });
      const justification = page.getByLabel('Quantity justification', {
        exact: true,
      });
      const quantityWrapper = page
        .locator('ngx-control-wrapper')
        .filter({ has: quantity });

      await typeAndBlur(
        justification,
        'This purchase needs explicit quantity planning.',
        0
      );
      await waitForValidationToSettle(page);

      await expect(
        quantityWrapper.getByRole('status').filter({
          hasText: /quantity is required when a justification is provided/i,
        })
      ).toHaveCount(0);
      await expect(quantity).toHaveClass(/ng-untouched/);

      await quantity.focus();
      await quantity.blur();

      await expectFieldHasError(
        quantity,
        /quantity is required when a justification is provided/i
      );
    });
  });

  test('should show save failure and retry successfully on the next blur', async ({
    page,
  }) => {
    await test.step('Trigger a simulated save failure', async () => {
      const projectName = page.getByLabel('Project name', { exact: true });

      await typeAndBlur(projectName, 'fail', 0);

      await expect(
        page.getByRole('heading', { name: /draft save failed/i })
      ).toBeVisible();
      await expect(page.locator('aside')).toContainText(
        /simulated save failure/i
      );
    });

    await test.step('Fix the draft and retry via blur', async () => {
      const projectName = page.getByLabel('Project name', { exact: true });

      await typeAndBlur(projectName, 'Recovered draft', 0);
      await waitForValidationToSettle(page);

      await projectName.focus();
      await projectName.blur();

      await expect
        .poll(async () => {
          return await page.evaluate((key) => {
            const raw = sessionStorage.getItem(key);
            return raw ? JSON.parse(raw)?.draft?.projectName ?? '' : '';
          }, STORAGE_KEY);
        })
        .toBe('Recovered draft');

      await expect(
        page.getByRole('heading', { name: /draft saved/i })
      ).toBeVisible();

      const storedDraft = await page.evaluate((key) => {
        const raw = sessionStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      }, STORAGE_KEY);

      expect(storedDraft?.draft?.projectName).toBe('Recovered draft');
    });
  });
});
