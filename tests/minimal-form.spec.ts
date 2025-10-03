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
      const onSubmitRadio = page.getByRole('radio', {
        name: /^On Submit$/i,
      });

      await immediateRadio.check();
      await expect(immediateRadio).toBeChecked();

      await onSubmitRadio.check();
      await expect(onSubmitRadio).toBeChecked();
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

      await expect
        .poll(async () =>
          emailError.evaluate((node) => node.getAttribute('aria-hidden')),
        )
        .toBe('true');

      await emailField.click();
      await emailField.blur();

      await expect(emailError).toContainText(/email is required/i);
      await expect
        .poll(async () =>
          emailError.evaluate((node) => node.getAttribute('aria-hidden')),
        )
        .not.toBe('true');

      await emailField.fill('user@example.com');
      await emailField.blur();

      await expect
        .poll(async () =>
          emailError.evaluate((node) => node.getAttribute('aria-hidden')),
        )
        .toBe('true');
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

      await expect(emailError).toContainText(/valid email/i);
      await expect
        .poll(async () =>
          emailError.evaluate((node) => node.getAttribute('aria-hidden')),
        )
        .not.toBe('true');

      await emailField.fill('valid@example.com');
      await expect
        .poll(async () =>
          emailError.evaluate((node) => node.getAttribute('aria-hidden')),
        )
        .toBe('true');
    });

    test('on-submit strategy reveals errors only after submit attempt', async ({
      page,
    }) => {
      const onSubmitRadio = page.getByRole('radio', { name: /^On Submit$/i });
      const emailError = page.locator('#email-error');
      const submitButton = page.getByRole('button', { name: /Submit/i });

      await onSubmitRadio.check();

      await expect
        .poll(async () =>
          emailError.evaluate((node) => node.getAttribute('aria-hidden')),
        )
        .toBe('true');

      await submitButton.click();

      await expect(emailError).toContainText(/email is required/i);
      await expect
        .poll(async () =>
          emailError.evaluate((node) => node.getAttribute('aria-hidden')),
        )
        .not.toBe('true');
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
