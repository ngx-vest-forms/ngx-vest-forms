import { expect, test } from '@playwright/test';
import {
  fillAndBlur,
  navigateToValidationConfigDemo,
} from './helpers/form-helpers';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * WCAG 2.2 AA Compliance for Live Regions:
 *
 * IMPORTANT DISTINCTION - Field-level vs Form-level errors:
 * - FIELD-LEVEL errors (inline validation): Use role="status" with aria-live="polite"
 *   These appear as users interact with fields. Using "assertive" would be too disruptive.
 *   The primary accessibility pathway is aria-invalid="true" + aria-describedby on the input.
 * - FORM-LEVEL blocking errors (e.g., submission failed): Use role="alert" with aria-live="assertive"
 *
 * - Warnings use role="status" with aria-live="polite" (non-blocking, polite announcement)
 * - Pending state uses role="status" with aria-live="polite"
 *
 * @see https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA21 - Using aria-invalid
 * @see https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA22 - Using role=status
 */
test.describe('Accessibility - stable live regions', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToValidationConfigDemo(page);
  });

  test('should keep the error live region element stable and referenced via aria-describedby', async ({
    page,
  }) => {
    await test.step('Locate wrapper and stable error region before errors are shown', async () => {
      const password = page.getByLabel('Password', { exact: true });

      // Find the wrapper host by its element selector.
      const wrapper = page
        .locator('ngx-control-wrapper')
        .filter({ has: password });
      await expect(wrapper).toHaveCount(1);

      // Sanity check: wrapper template should render a content container.
      await expect(
        wrapper.locator('.ngx-control-wrapper__content')
      ).toHaveCount(1);

      // WCAG ARIA21: Inline field-level errors use role="status" for non-disruptive announcement
      const errorRegion = wrapper.locator('[role="status"][id$="-error"]');

      await expect(errorRegion).toHaveCount(1);

      const errorId = await errorRegion.first().getAttribute('id');
      if (!errorId) {
        throw new Error('Expected wrapper error live region to have an id');
      }

      // Before errors are shown, aria-describedby should typically be absent.
      await expect(password).not.toHaveAttribute(
        'aria-describedby',
        new RegExp(escapeRegExp(errorId))
      );
    });

    await test.step('Trigger an error and verify the same region contains text and is referenced', async () => {
      const password = page.getByLabel('Password', { exact: true });
      const wrapper = page
        .locator('ngx-control-wrapper')
        .filter({ has: password });
      // WCAG ARIA21: Inline field-level errors use role="status" for non-disruptive announcement
      const errorRegion = wrapper.locator('[role="status"][id$="-error"]');

      const errorId = await errorRegion.first().getAttribute('id');
      if (!errorId) {
        throw new Error('Expected wrapper error live region to have an id');
      }

      await fillAndBlur(password, 'Short1');

      // Wait for validation to complete (ng-invalid class appears)
      await expect
        .poll(
          async () => {
            const classes = await password.getAttribute('class');
            return classes?.includes('ng-invalid') ?? false;
          },
          { timeout: 5000, message: 'Field should have ng-invalid class' }
        )
        .toBe(true);

      await expect(errorRegion).toContainText(/8/i, { timeout: 5000 });

      // Wrapper should point aria-describedby at the error region id.
      await expect(password).toHaveAttribute(
        'aria-describedby',
        new RegExp(`(^|\\s)${escapeRegExp(errorId)}(\\s|$)`)
      );

      // WCAG: Verify the error region uses correct ARIA pattern for inline field errors
      await expect(errorRegion).toMatchAriaSnapshot(`
        - status:
          - list:
            - listitem:
              - text: Password must be at least 8 characters
      `);
    });
  });
});
