import { expect, test } from '@playwright/test';
import {
  fillAndBlur,
  navigateToValidationConfigDemo,
} from './helpers/form-helpers';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test.describe('Accessibility - stable live regions', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToValidationConfigDemo(page);
  });

  test('should keep the error live region element stable and referenced via aria-describedby', async ({
    page,
  }) => {
    await test.step('Locate wrapper and stable error region before errors are shown', async () => {
      const password = page.getByLabel('Password', { exact: true });

      // Find the wrapper host by its attribute selector to avoid brittle DOM traversal.
      const wrapper = page
        .locator('[ngx-control-wrapper]')
        .filter({ has: password });
      await expect(wrapper).toHaveCount(1);

      // Sanity check: wrapper template should render a content container.
      await expect(
        wrapper.locator('.ngx-control-wrapper__content')
      ).toHaveCount(1);

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
        .locator('[ngx-control-wrapper]')
        .filter({ has: password });
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

      await expect(errorRegion).toMatchAriaSnapshot(`
        - status:
          - list:
            - listitem:
              - text: Password must be at least 8 characters
      `);
    });
  });
});
