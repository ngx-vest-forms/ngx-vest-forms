import { expect, test } from '@playwright/test';

test.describe('Control Wrapper Intro - Manual Testing Verification', () => {
  test('manually verify warnings system and document current behavior', async ({
    page,
  }) => {
    await page.goto(
      'http://localhost:4200/control-wrapper/control-wrapper-intro',
    );

    await test.step('Verify page loads correctly', async () => {
      await expect(page).toHaveTitle(/Control Wrapper Introduction/);

      // Verify form elements are present
      const emailInput = page.getByRole('textbox', { name: 'Email Address *' });
      const passwordInput = page.getByRole('textbox', { name: 'Password *' });

      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();

      console.log('✅ Page loaded successfully with form elements');
    });

    await test.step('Test email warning while typing (on-change)', async () => {
      const emailInput = page.getByRole('textbox', { name: 'Email Address *' });

      // Clear and start typing
      await emailInput.clear();
      await emailInput.type('test@gmail.com', { delay: 50 });

      // Wait for debounce (180ms + buffer)
      await page.waitForTimeout(300);

      // Should show warning while still focused
      const emailWarning = page.getByText(
        'Consider using a professional email',
        { exact: false },
      );
      await expect(emailWarning).toBeVisible();

      console.log('✅ Email warning appears while typing (on-change mode)');

      // Take screenshot for documentation
      await page.screenshot({ path: 'email-warning-typing.png' });
    });

    await test.step('Test password warning while typing (on-change)', async () => {
      const passwordInput = page.getByRole('textbox', { name: 'Password *' });

      // Clear and type password without special characters
      await passwordInput.clear();
      await passwordInput.type('Password123', { delay: 50 });

      // Wait for debounce
      await page.waitForTimeout(300);

      // Should show warning while still focused
      const passwordWarning = page.getByText(
        'Consider adding special characters',
        { exact: false },
      );
      await expect(passwordWarning).toBeVisible();

      console.log('✅ Password warning appears while typing (on-change mode)');
    });

    await test.step('Verify warnings persist while focused', async () => {
      const emailInput = page.getByRole('textbox', { name: 'Email Address *' });

      // Ensure email input has focus
      await emailInput.focus();

      // Warning should still be visible
      await expect(
        page.getByText('Consider using a professional email', { exact: false }),
      ).toBeVisible();

      console.log('✅ Warnings persist while input is focused');
    });

    await test.step('Test warning behavior after blur', async () => {
      const emailInput = page.getByRole('textbox', { name: 'Email Address *' });

      // Blur the field
      await emailInput.blur();

      // Warning should still be visible (on-change mode keeps warnings visible after blur)
      await expect(
        page.getByText('Consider using a professional email', { exact: false }),
      ).toBeVisible();

      console.log('✅ Warnings remain visible after blur in on-change mode');
    });

    await test.step('Document current warning display mode', async () => {
      // Check if there's already a warning mode selector
      const warningModeSelector = page.locator(
        '[data-testid="warning-mode-selector"]',
      );
      const hasModeSelector = await warningModeSelector
        .isVisible()
        .catch(() => false);

      console.log(
        `📋 Warning mode selector present: ${hasModeSelector ? 'Yes' : 'No'}`,
      );

      if (!hasModeSelector) {
        console.log('📝 Recommendation: Add warning display mode switcher');
        console.log('   - Current mode: on-change (shows while typing)');
        console.log('   - Debounce: 180ms');
        console.log('   - Alternative modes: on-blur, disabled');
      }
    });

    // Take final screenshot of the current state
    await page.screenshot({
      path: 'control-wrapper-warnings-current-state.png',
      fullPage: true,
    });
    console.log('📸 Screenshots saved for documentation');
  });
});
