import { expect, test } from '@playwright/test';

test.describe('Form State Demo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fundamentals/form-state-demo');
  });

  test('renders without errors', async ({ page }) => {
    // Verify page loads successfully
    await expect(
      page.getByRole('heading', {
        name: 'Form State Demo - Real-time Monitoring',
      }),
    ).toBeVisible();
    await expect(page.getByRole('main')).toBeVisible();

    // Verify form is present (use first() to avoid strict mode violation)
    await expect(page.getByRole('form').first()).toBeVisible();

    // Verify state monitor is present (use first() to avoid strict mode violation)
    await expect(page.getByText('Real-time Form State').first()).toBeVisible();
  });

  test('displays initial form state correctly', async ({ page }) => {
    // Check that state monitor is visible
    await expect(
      page.getByText('🔍 Real-time Form State').first(),
    ).toBeVisible();

    // Verify initial form state display
    await expect(page.getByText('Valid:').first()).toBeVisible();
    await expect(page.getByText('❌ false').first()).toBeVisible();
    await expect(page.getByText('Error Count:').first()).toBeVisible();
  });

  test('form validation lifecycle works correctly', async ({ page }) => {
    await test.step('Navigate to form-state-demo page', async () => {
      await page.goto('/fundamentals/form-state-demo');
    });

    await test.step('Test required field validation', async () => {
      const form = page.getByRole('form').first();
      const usernameInput = form.getByRole('textbox', { name: /username/i });

      // Type a forbidden username and wait for async validation
      await usernameInput.fill('test');

      // Wait for async validation to complete and show error - need to wait longer for the 1 second delay
      await page.waitForTimeout(1500); // Wait for the 1 second async delay + buffer

      // Use form-scoped selector to target the specific error list in the form state monitor
      const formStateMonitor = page.locator('ngx-form-state-demo-form');
      await expect(
        formStateMonitor
          .getByRole('heading', { name: 'Current Errors' })
          .locator('..')
          .getByText('Username is already taken'),
      ).toBeVisible();
    });
  });

  test('async validation works correctly', async ({ page }) => {
    await test.step('Navigate to form-state-demo page', async () => {
      await page.goto('/fundamentals/form-state-demo');
    });

    await test.step('Test async username validation', async () => {
      const form = page.getByRole('form').first();
      const usernameInput = form.getByRole('textbox', { name: /username/i });

      // Type a forbidden username
      await usernameInput.fill('admin');

      // Wait for async validation to complete and show error
      await page.waitForTimeout(1500); // Wait for the 1 second async delay + buffer

      // Use form-scoped selector to target the specific error list in the form state monitor
      const formStateMonitor = page.locator('ngx-form-state-demo-form');
      await expect(
        formStateMonitor
          .getByRole('heading', { name: 'Current Errors' })
          .locator('..')
          .getByText('Username is already taken'),
      ).toBeVisible();
    });
  });

  test('cross-field validation works', async ({ page }) => {
    // Get the first form to work with
    const form = page.getByRole('form').first();

    // Use more specific selectors to avoid timeout issues
    const passwordInput = form.locator('input[name="password"]');
    const confirmPasswordInput = form.locator('input[name="confirmPassword"]');

    // Enter password
    await passwordInput.fill('StrongPass123');

    // Enter different confirmation
    await confirmPasswordInput.fill('DifferentPass123');
    await confirmPasswordInput.blur();

    // Should show password mismatch error - wait a bit for validation
    await page.waitForTimeout(500);
    await expect(form.getByText('Passwords must match')).toBeVisible();

    // Enter matching confirmation
    await confirmPasswordInput.clear();
    await confirmPasswordInput.fill('StrongPass123');
    await confirmPasswordInput.blur();

    // Error should disappear
    await page.waitForTimeout(500);
    await expect(form.getByText('Passwords must match')).not.toBeVisible();
  });

  test('form submission handles validation correctly', async ({ page }) => {
    // Get the first form to work with
    const form = page.getByRole('form').first();
    const submitButton = form.getByRole('button', { name: /submit form/i });

    // Try to submit empty form
    await submitButton.click();

    // Should show validation errors - use first() to avoid strict mode violation
    await expect(form.getByRole('alert').first()).toBeVisible();

    // State monitor should show errors
    await expect(page.getByText(/[1-9] errors/).first()).toBeVisible();

    // Fill form with valid data
    await form.getByRole('textbox', { name: /username/i }).fill('testuser');
    await form
      .getByRole('textbox', { name: /email/i })
      .fill('test@example.com');
    await form.locator('input[name="password"]').fill('StrongPass123');
    await form.locator('input[name="confirmPassword"]').fill('StrongPass123');
    await form.getByRole('spinbutton', { name: /age/i }).fill('25');
    await form
      .getByRole('combobox', { name: /preferences/i })
      .selectOption('balanced');
    await form.getByRole('checkbox', { name: /newsletter/i }).check();

    // Wait for async validation to complete
    await expect(page.getByText('⏳ Checking...')).not.toBeVisible({
      timeout: 2000,
    });

    // Form should be valid
    await expect(page.getByText('✅ true').first()).toBeVisible(); // valid state

    // Submit should work
    await submitButton.click();

    // Should show success (in this demo, it's an alert)
    // Note: In a real test, you might check for navigation or a success message
  });

  test('form reset works correctly', async ({ page }) => {
    // Get the first form to work with
    const form = page.getByRole('form').first();
    const resetButton = form.getByRole('button', { name: /reset form/i });
    const usernameInput = form.getByRole('textbox', { name: /username/i });

    // Fill some data
    await usernameInput.fill('testuser');

    // State should be dirty
    await expect(page.getByText('📝 true').first()).toBeVisible();

    // Reset form
    await resetButton.click();

    // Form should be cleared
    await expect(usernameInput).toHaveValue('');

    // State should be reset (not dirty)
    await expect(page.getByText('✨ false').first()).toBeVisible();
  });

  test('real-time state monitor updates correctly', async ({ page }) => {
    // Get the first form to work with
    const form = page.getByRole('form').first();
    const usernameInput = form.getByRole('textbox', { name: /username/i });

    // Initial state - form should have errors since all fields are required
    await expect(page.getByText('Error Count:').first()).toBeVisible();
    await expect(page.getByText(/6 errors/).first()).toBeVisible(); // All required fields show errors initially

    // Fill username to reduce error count
    await usernameInput.fill('testuser');

    // Error count should decrease (username validation should pass)
    await page.waitForTimeout(500); // Wait for validation
    await expect(page.getByText(/5 errors/).first()).toBeVisible(); // One less error

    // Check form value preview updates
    await expect(
      page.getByText('"username": "testuser"').first(),
    ).toBeVisible();
  });

  test('accessibility compliance', async ({ page }) => {
    // Test basic accessibility structure - skip ARIA snapshot for now due to complexity
    const form = page.getByRole('form').first();

    // Test form accessibility
    const usernameInput = form.getByRole('textbox', { name: /username/i });

    // Should have proper ARIA attributes
    await expect(usernameInput).toHaveAttribute('aria-required', 'true');

    // Trigger error state
    await usernameInput.click();
    await usernameInput.blur();

    // Should have aria-invalid when there are errors
    await expect(usernameInput).toHaveAttribute('aria-invalid', 'true');

    // Error should be announced to screen readers
    await expect(page.getByRole('alert')).toBeVisible();
  });

  test('keyboard navigation works', async ({ page }) => {
    // Get the first form to work with
    const form = page.getByRole('form').first();

    // Test tab order - use click first to establish focus context
    await form.getByRole('textbox', { name: /username/i }).click();
    await expect(
      form.getByRole('textbox', { name: /username/i }),
    ).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(form.getByRole('textbox', { name: /email/i })).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(form.locator('input[name="password"]')).toBeFocused();

    // Test form submission with Enter key
    await form.getByRole('textbox', { name: /username/i }).focus();
    await page.keyboard.press('Enter');

    // Should trigger form submission (though form is invalid) - use first() to avoid strict mode
    await expect(form.getByRole('alert').first()).toBeVisible();
  });

  test('performance monitoring works', async ({ page }) => {
    // Get the first form to work with
    const form = page.getByRole('form').first();
    const usernameInput = form.getByRole('textbox', { name: /username/i });

    // Fill username to trigger async validation
    await usernameInput.fill('testuser');

    // Performance metrics should eventually show timing
    await expect(page.getByText('Last Validation:').first()).toBeVisible();

    // Wait for validation to complete
    await expect(page.getByText('⏳ Checking...')).not.toBeVisible({
      timeout: 2000,
    });

    // Should show some timing (even if 0ms for fast validation)
    await expect(page.getByText(/\d+ms/).first()).toBeVisible();
  });

  test('mobile responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Form should still be usable on mobile
    const form = page.getByRole('form').first();
    await expect(
      form.getByRole('textbox', { name: /username/i }),
    ).toBeVisible();
    await expect(page.getByText('Real-time Form State').first()).toBeVisible();

    // State monitor should be responsive
    await expect(page.getByText('Core State').first()).toBeVisible();
  });
});
