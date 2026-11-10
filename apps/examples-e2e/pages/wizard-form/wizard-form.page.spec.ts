import { expect, test } from '@playwright/test';
import { getMainContentSidebar } from '../../helpers/form-helpers';
import {
  fillValidStep1,
  goToProfileStep,
  navigateToWizard,
} from '../../helpers/wizard-helpers';

test.describe('Wizard Form Page', () => {
  test('should render wizard page layout and step navigation', async ({
    page,
  }) => {
    const sidebar = getMainContentSidebar(page);

    await page.goto('/wizard');

    await expect(
      page.getByRole('heading', { name: /multi-form wizard/i, level: 1 })
    ).toBeVisible();

    await expect(page.locator('ngx-wizard-steps nav')).toBeVisible();
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toContainText(/form value/i);
    await expect(
      sidebar.locator('span[aria-label="Pristine"]').first()
    ).toBeVisible();
  });

  // The sidebar reads the rendered step's form, so after Next it must drop
  // step 1's state and show step 2's instead.
  test('should show the current step errors in the sidebar', async ({
    page,
  }) => {
    const sidebar = getMainContentSidebar(page);
    await navigateToWizard(page);

    await test.step('Step 1: a blurred empty email shows up', async () => {
      const email = page.getByLabel(/email address/i);
      await email.focus();
      await email.blur();
      await expect(sidebar).toContainText('Email is required');
    });

    await test.step('Step 2: the sidebar follows the new step', async () => {
      await fillValidStep1(page);
      await goToProfileStep(page);
      await expect(sidebar).not.toContainText('Email is required');

      const firstName = page.getByLabel(/first name/i);
      await firstName.focus();
      await firstName.blur();
      await expect(sidebar).toContainText('First name is required');
    });
  });
});
