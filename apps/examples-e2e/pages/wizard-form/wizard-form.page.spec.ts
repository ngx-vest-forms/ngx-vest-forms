import { expect, test } from '@playwright/test';
import { fillAndBlur, getMainContentSidebar } from '../../helpers/form-helpers';
import {
  clickPrevious,
  expectWizardStep,
  fillValidStep1,
  goToProfileStep,
  navigateToWizard,
  STEP_HEADINGS,
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

  // The sidebar reads the rendered step's form, so after Next or Previous it
  // must drop the old step's state and show the new step's instead.
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

    await test.step('Back on step 1: the sidebar follows again', async () => {
      await clickPrevious(page);
      await expectWizardStep(page, 1, STEP_HEADINGS[1]);
      await expect(sidebar).not.toContainText('First name is required');

      await fillAndBlur(page.getByLabel(/email address/i), '');
      await expect(sidebar).toContainText('Email is required');
    });
  });
});
