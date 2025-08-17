import { expect, test } from '@playwright/test';

test.describe('Basic Form Submission Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up API mocking at the page level
    await page.route('/api/**', async (route) => {
      const url = new URL(route.request().url());
      const path = url.pathname;
      const method = route.request().method();

      // Handle different API endpoints
      if (method === 'POST' && path === '/api/forms/submit') {
        const body = await route.request().postDataJSON();
        await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate delay

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Form submitted successfully',
            id: Date.now().toString(),
            data: body,
          }),
        });
        return;
      }

      if (method === 'POST' && path === '/api/forms/validate') {
        const body = await route.request().postDataJSON();
        const errors: Record<string, string[]> = {};

        if (!body.email || !body.email.includes('@')) {
          errors['email'] = ['Please provide a valid email address'];
        }

        if (!body.name || body.name.length < 2) {
          errors['name'] = ['Name must be at least 2 characters long'];
        }

        if (
          body.password &&
          body.confirmPassword &&
          body.password !== body.confirmPassword
        ) {
          errors['_root'] = ['Passwords do not match'];
        }

        const isValid = Object.keys(errors).length === 0;

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            valid: isValid,
            errors: isValid ? {} : errors,
          }),
        });
        return;
      }

      // Continue with original request for unhandled routes
      await route.continue();
    });

    // Navigate to the example application
    await page.goto('/');
  });

  test('Complete form submission with validation - Happy path', async ({
    page,
  }) => {
    await test.step('Navigate to form example', async () => {
      // Look for navigation to form examples
      const formLinks = [
        page.getByRole('link', { name: /basic.*form/i }),
        page.getByRole('link', { name: /form.*example/i }),
        page.getByRole('link', { name: /simple.*form/i }),
        page.getByText(/form/i).locator('a').first(),
      ];

      for (const link of formLinks) {
        if (await link.isVisible().catch(() => false)) {
          await link.click();
          break;
        }
      }
    });

    await test.step('Fill form with valid data', async () => {
      // Wait for form to be visible
      await expect(page.locator('form')).toBeVisible();

      // Try to find and fill common form fields
      const nameSelectors = [
        'input[name="name"]',
        'input[placeholder*="name" i]',
        page.getByRole('textbox', { name: /name/i }),
        page.getByLabel(/name/i),
      ];

      for (const selector of nameSelectors) {
        const field =
          typeof selector === 'string' ? page.locator(selector) : selector;
        if (await field.isVisible().catch(() => false)) {
          await field.fill('John Doe');
          break;
        }
      }

      const emailSelectors = [
        'input[name="email"]',
        'input[type="email"]',
        'input[placeholder*="email" i]',
        page.getByRole('textbox', { name: /email/i }),
        page.getByLabel(/email/i),
      ];

      for (const selector of emailSelectors) {
        const field =
          typeof selector === 'string' ? page.locator(selector) : selector;
        if (await field.isVisible().catch(() => false)) {
          await field.fill('john.doe@example.com');
          break;
        }
      }
    });

    await test.step('Submit form and verify success', async () => {
      const submitSelectors = [
        page.getByRole('button', { name: /submit/i }),
        page.getByRole('button', { name: /save/i }),
        'button[type="submit"]',
        'input[type="submit"]',
      ];

      let submitted = false;
      for (const selector of submitSelectors) {
        const button =
          typeof selector === 'string' ? page.locator(selector) : selector;
        if (await button.isVisible().catch(() => false)) {
          await button.click();
          submitted = true;
          break;
        }
      }

      expect(submitted).toBeTruthy();

      // Check for success indicators
      const successSelectors = [
        page.getByText(/success/i),
        page.getByText(/submitted/i),
        page.getByText(/thank you/i),
        page.locator('[role="alert"]').filter({ hasText: /success/i }),
        page.locator('.success, .alert-success'),
      ];

      let foundSuccess = false;
      for (const selector of successSelectors) {
        if (await selector.isVisible().catch(() => false)) {
          await expect(selector).toBeVisible();
          foundSuccess = true;
          break;
        }
      }

      // If no explicit success message, check that no errors are shown
      if (!foundSuccess) {
        const errorSelectors = [
          page.locator('[role="alert"]').filter({ hasText: /error|invalid/i }),
          page.locator('.error, .alert-error').filter({ hasText: /.+/ }),
        ];

        for (const errorSelector of errorSelectors) {
          await expect(errorSelector).not.toBeVisible();
        }
      }
    });
  });

  test('Form validation - Error handling', async ({ page }) => {
    await test.step('Navigate to form', async () => {
      const formLinks = [
        page.getByRole('link', { name: /form/i }),
        page.getByText(/form/i).locator('a').first(),
      ];

      for (const link of formLinks) {
        if (await link.isVisible().catch(() => false)) {
          await link.click();
          break;
        }
      }

      await expect(page.locator('form')).toBeVisible();
    });

    await test.step('Submit empty form and verify validation errors', async () => {
      // Find and click submit button
      const submitButton = page
        .getByRole('button', { name: /submit/i })
        .first();
      await submitButton.click();

      // Wait for validation to occur
      await page.waitForTimeout(500);

      // Check for validation errors using multiple strategies
      const errorIndicators = [
        page.locator('[role="alert"]'),
        page.locator('.error, .alert-error'),
        page.locator('[aria-invalid="true"]'),
        page.locator('input:invalid'),
        page.getByText(/required|invalid|error/i),
      ];

      let hasErrors = false;
      for (const indicator of errorIndicators) {
        const count = await indicator.count();
        if (
          count > 0 &&
          (await indicator
            .first()
            .isVisible()
            .catch(() => false))
        ) {
          hasErrors = true;
          break;
        }
      }

      expect(hasErrors).toBeTruthy();
    });

    await test.step('Fill fields and verify form becomes valid', async () => {
      // Fill required fields
      const nameField = page
        .locator('input[name="name"], input[placeholder*="name" i]')
        .first();
      const emailField = page
        .locator('input[name="email"], input[type="email"]')
        .first();

      if (await nameField.isVisible().catch(() => false)) {
        await nameField.fill('Jane Doe');
      }

      if (await emailField.isVisible().catch(() => false)) {
        await emailField.fill('jane.doe@example.com');
      }

      // Submit again
      const submitButton = page
        .getByRole('button', { name: /submit/i })
        .first();
      await submitButton.click();

      // Verify success or absence of errors
      await page.waitForTimeout(500);

      const hasSuccess = await page
        .getByText(/success|submitted|thank you/i)
        .first()
        .isVisible()
        .catch(() => false);
      const errorCount = await page
        .locator('[role="alert"]:visible, .error:visible')
        .count();

      expect(hasSuccess || errorCount === 0).toBeTruthy();
    });
  });

  test('Accessibility - Keyboard navigation and ARIA', async ({ page }) => {
    await test.step('Navigate to form using keyboard', async () => {
      // Use Tab to navigate to form link
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(
        () => document.activeElement?.tagName,
      );
      expect(
        ['A', 'BUTTON', 'INPUT'].includes(focusedElement || ''),
      ).toBeTruthy();
    });

    await test.step('Verify form accessibility structure', async () => {
      await expect(page.locator('form')).toBeVisible();

      // Check for proper labeling
      const inputs = page.locator(
        'input[type="text"], input[type="email"], input[name]',
      );
      const inputCount = await inputs.count();

      if (inputCount > 0) {
        const firstInput = inputs.first();

        // Check if input has accessible name (label, aria-label, etc.)
        const hasLabel = await firstInput.evaluate((input) => {
          const element = input as HTMLInputElement;

          // Check for associated label
          if (element.id) {
            const label = document.querySelector(`label[for="${element.id}"]`);
            if (label) return true;
          }

          // Check for aria-label
          if (element.getAttribute('aria-label')) return true;

          // Check for aria-labelledby
          if (element.getAttribute('aria-labelledby')) return true;

          // Check for placeholder as fallback
          if (element.placeholder) return true;

          return false;
        });

        expect(hasLabel).toBeTruthy();
      }

      // Verify submit button exists and is accessible
      const submitButton = page.getByRole('button', { name: /submit/i });
      await expect(submitButton).toBeVisible();
    });
  });
});
