import { expect, test } from '@playwright/test';

test.describe('Performance and Loading - App-level Monitoring', () => {
  test('pages load within acceptable time', async ({ page }) => {
    await test.step('Test initial page load', async () => {
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      // Should load within 3 seconds in development
      expect(loadTime).toBeLessThan(3000);
    });

    await test.step('Test lazy-loaded route performance', async () => {
      const startTime = Date.now();
      await page.getByRole('link', { name: 'Control Wrapper' }).click();
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      // Route changes should be fast
      expect(loadTime).toBeLessThan(1000);
    });
  });

  test('no console errors during normal usage', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (message) => {
      if (message.type() === 'error') {
        errors.push(message.text());
      }
    });

    await test.step('Navigate through app without errors', async () => {
      await page.goto('/');
      await page.getByRole('link', { name: 'Fundamentals' }).click();
      await page.getByRole('link', { name: 'Minimal Form' }).click();
      await page.getByRole('link', { name: 'Control Wrapper' }).click();
      await page
        .getByRole('link', { name: 'Control Wrapper Introduction' })
        .click();

      // Should not have any console errors (ignoring vite dev server messages)
      expect(errors.filter((error) => !error.includes('[vite]'))).toHaveLength(
        0,
      );
    });
  });

  test('theme switcher accessibility', async ({ page }) => {
    await page.goto('/');

    await test.step('Test theme button', async () => {
      const themeButton = page.getByRole('button', { name: /Change theme/ });
      await expect(themeButton).toBeVisible();

      // Should be keyboard accessible
      await themeButton.focus();
      await expect(themeButton).toBeFocused();
    });
  });
});
