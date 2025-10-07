import { expect, test } from '@playwright/test';

const removeViteOverlays = async (page: import('@playwright/test').Page) => {
  await page.evaluate(() => {
    const overlays = document.querySelectorAll('vite-error-overlay');
    for (const overlay of overlays) {
      overlay.remove();
    }
  });
};

test.describe('Minimal Form - V2 Implementation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fundamentals/minimal-form');
    await page.waitForLoadState('networkidle');
    await removeViteOverlays(page);
  });

  test.describe('page structure', () => {
    test('renders primary layout elements', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: /Minimal Form/i }),
      ).toBeVisible();

      await expect(
        page.getByRole('textbox', { name: /Email Address/i }),
      ).toBeVisible();

      const submitButton = page.getByRole('button', { name: /Submit/i });
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toBeEnabled();

      await expect(
        page.getByRole('heading', { name: /Form State & Validation/i }),
      ).toBeVisible();
      await expect(page.getByText('Form Model').first()).toBeVisible();
      await expect(page.getByText('Validation Errors').first()).toBeVisible();
    });
  });

  test.describe('error display selector', () => {
    test('lists all available strategies', async ({ page }) => {
      await expect(
        page.getByRole('radio', { name: /^Immediate$/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('radio', { name: /^On Touch$/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('radio', { name: /^On Submit$/i }),
      ).toBeVisible();
    });

    test('defaults to on-touch strategy', async ({ page }) => {
      const onTouchRadio = page.getByRole('radio', { name: /^On Touch$/i });
      await expect(onTouchRadio).toBeChecked();
    });

    test('allows switching strategies', async ({ page }) => {
      const immediateRadio = page.getByRole('radio', {
        name: /^Immediate$/i,
      });
      const saveRadio = page.getByRole('radio', {
        name: /^On Submit$/i,
      });

      await immediateRadio.check();
      await expect(immediateRadio).toBeChecked();

      await saveRadio.check();
      await expect(saveRadio).toBeChecked();
    });
  });

  test.describe('email field validation', () => {
    test('shows required error after blur in default on-touch strategy', async ({
      page,
    }) => {
      const emailField = page.getByRole('textbox', {
        name: /Email Address/i,
      });
      const emailError = page.locator('#email-error');

      // Initially, error container should not exist (no errors)
      await expect(emailError).not.toBeAttached();

      // Focus field, then blur to trigger on-touch validation
      await emailField.focus();
      await page.waitForTimeout(100); // Wait for focus to register
      await emailField.blur();
      await page.waitForTimeout(500); // Wait for blur event and validation

      // After blur, error should be visible (on-touch strategy)
      // Note: Using toBeVisible instead of toBeAttached as fallback
      await expect(emailError).toBeVisible({ timeout: 10_000 });
      await expect(emailError).toContainText(/email is required/i);

      await emailField.fill('user@example.com');
      await page.waitForTimeout(300); // Wait for validation

      // After entering valid email, error should not exist
      await expect(emailError).not.toBeAttached();
    });

    test('maintains field value when switching strategies', async ({
      page,
    }) => {
      const emailField = page.getByRole('textbox', {
        name: /Email Address/i,
      });

      await emailField.fill('persist@example.com');
      await emailField.blur();

      await page.getByRole('radio', { name: /^Immediate$/i }).check();
      await page.getByRole('radio', { name: /^On Submit$/i }).check();
      await page.getByRole('radio', { name: /^On Touch$/i }).check();

      await expect(emailField).toHaveValue('persist@example.com');
    });
  });

  test.describe('error strategies', () => {
    test('immediate strategy surfaces invalid input during typing', async ({
      page,
    }) => {
      const immediateRadio = page.getByRole('radio', { name: /^Immediate$/i });
      const emailField = page.getByRole('textbox', { name: /Email Address/i });
      const emailError = page.locator('#email-error');

      await immediateRadio.check();
      await emailField.fill('invalid');

      // With immediate strategy, errors show while typing
      await expect(emailError).toBeAttached();
      await expect(emailError).toContainText(/valid email/i);

      await emailField.fill('valid@example.com');

      // After entering valid email, error should disappear
      await expect(emailError).not.toBeAttached();
    });

    test('on-submit strategy reveals errors only after submit attempt', async ({
      page,
    }) => {
      const saveRadio = page.getByRole('radio', { name: /^On Submit$/i });
      const emailError = page.locator('#email-error');
      const submitButton = page.getByRole('button', { name: /Submit/i });

      await saveRadio.check();

      // Initially, no errors should be visible
      await expect(emailError).not.toBeAttached();

      await submitButton.click();

      // After submit attempt, errors should appear
      await expect(emailError).toBeAttached();
      await expect(emailError).toContainText(/email is required/i);
      await expect(submitButton).toBeEnabled();
    });
  });

  test.describe('submit button accessibility', () => {
    test('remains enabled even when the form has validation errors', async ({
      page,
    }) => {
      const emailField = page.getByRole('textbox', { name: /Email Address/i });
      const submitButton = page.getByRole('button', { name: /Submit/i });

      await emailField.click();
      await emailField.blur();

      await expect(submitButton).toBeEnabled();
    });
  });

  test('debugger reflects validation state changes', async ({ page }) => {
    const emailField = page.getByRole('textbox', { name: /Email Address/i });
    const debuggerValidity = page.getByText(/Valid: ❌/i);

    await expect(debuggerValidity).toBeVisible();

    await emailField.fill('debugger@example.com');
    await emailField.blur();

    await expect(page.getByText(/debugger@example.com/i)).toBeVisible();
  });
});
