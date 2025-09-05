import { expect, test } from '@playwright/test';

test.describe('Control Wrapper Introduction Page - NgxControlWrapper Automation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the control wrapper intro page
    await page.goto('/control-wrapper/control-wrapper-intro');
  });

  test('loads page correctly with simplified structure', async ({ page }) => {
    await test.step('Verify page metadata and navigation', async () => {
      // Verify page title
      await expect(page).toHaveTitle(
        'Control Wrapper Introduction - Bridge to Automation',
      );

      // Verify main heading
      await expect(
        page.getByRole('heading', {
          name: 'Control Wrapper Introduction - Bridge to Automation',
          level: 1,
        }),
      ).toBeVisible();

      // Verify link to fundamentals section
      await expect(
        page.getByRole('link', { name: 'fundamentals section' }),
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: 'fundamentals section' }),
      ).toHaveAttribute('href', '/01-fundamentals');

      // Verify navigation structure
      await expect(
        page.getByRole('navigation', { name: 'Primary navigation' }),
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: 'Control Wrapper', exact: true }),
      ).toHaveClass(/active/);
    });

    await test.step('Verify NgxControlWrapper form is present and accessible', async () => {
      // Verify single NgxControlWrapper form is present
      const wrapperForm = page.getByRole('form', {
        name: 'Enhanced Registration Form',
      });

      await expect(wrapperForm).toBeVisible();

      // Verify automation badge and title
      await expect(page.getByText('Automated', { exact: true })).toBeVisible();
      await expect(
        page.getByRole('heading', {
          name: 'Automated NgxControlWrapper',
          level: 3,
        }),
      ).toBeVisible();

      // Verify automation description
      await expect(
        page.getByText(
          'Complete form automation with <ngx-control-wrapper> - no manual error handling required',
        ),
      ).toBeVisible();
    });

    await test.step('Verify enhanced fields are present', async () => {
      // Enhanced fields: username, email, password, phone
      const requiredFields = [
        'Username *',
        'Email Address *',
        'Password *',
        'Phone Number *',
      ];

      for (const fieldName of requiredFields) {
        await expect(
          page.getByRole('textbox', { name: fieldName }),
        ).toBeVisible();
      }
    });

    await test.step('Verify error display mode configuration is present', async () => {
      // Form should have error display mode radio controls
      const errorDisplayModes = ['On Blur', 'On Submit', 'On Blur or Submit (Recommended)'];

      for (const mode of errorDisplayModes) {
        await expect(
          page.getByRole('radio', { name: mode, exact: true }),
        ).toBeVisible();
      }
    });
  });

  test('async username validation works correctly', async ({ page }) => {
    await test.step('Test async validation with taken username', async () => {
      // Enter a taken username (admin)
      const usernameInput = page.getByRole('textbox', { name: 'Username *' });

      await usernameInput.fill('admin');

      // Blur to trigger async validation
      await usernameInput.blur();

      // Should show pending state briefly
      await expect(page.getByText('🔄 Checking availability...')).toBeVisible();

      // Wait for async validation to complete and show errors
      await expect(
        page.getByText('Username is already taken', { exact: true }),
      ).toBeVisible({ timeout: 3000 });
    });

    await test.step('Test async validation with available username', async () => {
      const usernameInput = page.getByRole('textbox', { name: 'Username *' });

      // Clear and enter available username
      await usernameInput.fill('available_user');

      await usernameInput.blur();

      // Wait for async validation to complete without blocking
      await expect
        .poll(
          async () => {
            const hasError = await page
              .getByText('Username is already taken', { exact: true })
              .isVisible();
            return !hasError;
          },
          { timeout: 3000 },
        )
        .toBe(true);
    });
  });

  test('warning system works for email and password', async ({ page }) => {
    await test.step('Test email warning for common providers', async () => {
      const emailInput = page.getByRole('textbox', { name: 'Email Address *' });

      // Enter gmail.com email to trigger warning
      await emailInput.fill('user@gmail.com');
      await emailInput.blur();

      // Should show email warning (check for part of the warning text)
      await expect(
        page.getByText('Consider using a professional email', { exact: false }),
      ).toBeVisible();
    });

    await test.step('Test password warning for missing special characters', async () => {
      const passwordInput = page.getByRole('textbox', { name: 'Password *' });

      // Enter password without special characters to trigger warning
      await passwordInput.fill('Password123');
      await passwordInput.blur();

      // Should show password warning (check for part of the warning text)
      await expect(
        page.getByText('Consider adding special characters', { exact: false }),
      ).toBeVisible();
    });
  });

  test('accessibility features are properly implemented', async ({ page }) => {
    await test.step('Verify error messages have proper ARIA roles', async () => {
      // Trigger validation errors
      const usernameInput = page.getByRole('textbox', { name: 'Username *' });

      await usernameInput.focus();
      await usernameInput.blur();

      // Error messages should have role="alert"
      const errorMessage = page.locator('[role="alert"]').first();
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText('Username is required');
    });

    await test.step('Verify warning messages have proper ARIA roles', async () => {
      // Enter email that triggers warning
      const emailInput = page.getByRole('textbox', { name: 'Email Address *' });

      await emailInput.fill('user@yahoo.com');
      await emailInput.blur();

      // Warning messages should have role="status"
      const warningMessage = page.locator('[role="status"]').first();
      await expect(warningMessage).toBeVisible();
      await expect(warningMessage).toContainText(
        'Consider using a professional email provider',
      );
    });

    await test.step('Verify async validation works without ARIA busy states', async () => {
      // Enter username to trigger async validation
      const usernameInput = page.getByRole('textbox', { name: 'Username *' });

      await usernameInput.fill('admin');
      await usernameInput.blur();

      // Verify async validation result shows
      await expect(
        page.getByText('Username is already taken', { exact: true }),
      ).toBeVisible({ timeout: 3000 });
    });
  });

  test('complete registration flow works end-to-end', async ({ page }) => {
    await test.step('Fill valid registration form with NgxControlWrapper', async () => {
      const form = page.getByRole('form', {
        name: 'Enhanced Registration Form',
      });

      // Fill all fields with valid data
      await form
        .getByRole('textbox', { name: 'Username *' })
        .fill('newuser123');
      await form
        .getByRole('textbox', { name: 'Email Address *' })
        .fill('user@company.com');
      await form
        .getByRole('textbox', { name: 'Password *' })
        .fill('StrongPass123!');
      await form
        .getByRole('textbox', { name: 'Phone Number *' })
        .fill('555-123-4567');

      // Blur last field to trigger final validation
      await form.getByRole('textbox', { name: 'Phone Number *' }).blur();

      // Wait for async validation to complete
      await page.waitForTimeout(1500);
    });

    await test.step('Verify form becomes valid and submittable', async () => {
      const submitButton = page.getByRole('button', {
        name: 'Submit Registration',
      });

      // Submit button should be enabled
      await expect(submitButton).toBeEnabled();

      // Click submit
      await submitButton.click();

      // Should show success message or navigate (depending on implementation)
      // This would depend on the actual submit handler implementation
    });

    await test.step('Verify form state shows as valid', async () => {
      // Check that form state display shows valid state
      await expect(
        page.getByText('NgxControlWrapper Form State:'),
      ).toBeVisible();

      // Form should be in valid state - check for valid: true in JSON
      await expect(
        page.getByText('"valid": true', { exact: false }),
      ).toBeVisible();
    });
  });

  test('error display modes work correctly', async ({ page }) => {
    await test.step('Test error display mode configuration options', async () => {
      // Select "On Submit" mode
      await page.getByRole('radio', { name: 'On Submit', exact: true }).click();
      await expect(
        page.getByRole('radio', { name: 'On Submit', exact: true }),
      ).toBeChecked();

      // Select "On Blur" mode
      await page.getByRole('radio', { name: 'On Blur', exact: true }).click();
      await expect(
        page.getByRole('radio', { name: 'On Blur', exact: true }),
      ).toBeChecked();

      // Select "On Blur or Submit (Recommended)" mode
      await page
        .getByRole('radio', { name: 'On Blur or Submit (Recommended)', exact: true })
        .click();
      await expect(
        page.getByRole('radio', { name: 'On Blur or Submit (Recommended)', exact: true }),
      ).toBeChecked();
    });

    await test.step('Test on-blur error display mode', async () => {
      // Ensure "On Blur" mode is selected
      await page.getByRole('radio', { name: 'On Blur', exact: true }).click();

      // Focus and blur username field without filling
      const usernameInput = page.getByRole('textbox', { name: 'Username *' });

      await usernameInput.focus();
      await usernameInput.blur();

      // Should show errors immediately on blur (check in form area)
      await expect(
        page.getByRole('form').getByText('Username is required'),
      ).toBeVisible();
    });
  });
});
