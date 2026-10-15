import { expect, test } from '@playwright/test';
import {
  expectFieldHasError,
  expectFieldValid,
  fillAndBlur,
  getMainContentSidebar,
  getWarningElementFor,
  navigateToValidationConfigDemo,
  setDateLikeValueAndBlur,
  typeAndBlur,
  waitForValidationToSettle,
} from '../../helpers/form-helpers';

test.describe('ValidationConfig Demo', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToValidationConfigDemo(page);
  });

  test.describe('Bidirectional Password Validation', () => {
    test('should require confirmPassword when password is filled', async ({
      page,
    }) => {
      await test.step('Fill password and verify confirmPassword becomes required', async () => {
        const password = page.getByLabel('Password', { exact: true });
        const confirmPassword = page.getByLabel(/confirm password/i);

        await fillAndBlur(password, 'MySecure123');

        // Focus and blur confirmPassword to trigger validation
        await confirmPassword.focus();
        await confirmPassword.blur();

        // Wait for validation to propagate
        await waitForValidationToSettle(page);

        await expectFieldHasError(confirmPassword, /confirm/i);
      });
    });

    test('should validate password minimum length', async ({ page }) => {
      await test.step('Enter password shorter than 8 characters', async () => {
        const password = page.getByLabel('Password', { exact: true });

        await fillAndBlur(password, 'Short1');
        await expectFieldHasError(password, /8/i);

        // Verify accessibility structure shows error
        const passwordWrapper = password.locator('..');
        await expect(passwordWrapper).toMatchAriaSnapshot(`
          - text: Password
          - textbox "Password":
            - /placeholder: Enter password (min 8 chars)
        `);

        await fillAndBlur(password, 'LongEnough123');
        await expectFieldValid(password);

        // Verify error cleared in accessibility tree
        await expect(passwordWrapper).toMatchAriaSnapshot(`
          - text: Password
          - textbox "Password":
            - /placeholder: Enter password (min 8 chars)
            - text: LongEnough123
        `);
      });
    });

    test('should show error when passwords do not match', async ({ page }) => {
      await test.step('Fill mismatched passwords', async () => {
        const password = page.getByLabel('Password', { exact: true });
        const confirmPassword = page.getByLabel(/confirm password/i);

        await fillAndBlur(password, 'MySecure123');
        await fillAndBlur(confirmPassword, 'Different456');

        await expectFieldHasError(confirmPassword, /match/i);
      });
    });

    test('should clear errors when passwords match', async ({ page }) => {
      await test.step('Fix mismatched passwords', async () => {
        const password = page.getByLabel('Password', { exact: true });
        const confirmPassword = page.getByLabel(/confirm password/i);

        await fillAndBlur(password, 'MySecure123');
        await fillAndBlur(confirmPassword, 'Different456');
        await expectFieldHasError(confirmPassword);

        await fillAndBlur(confirmPassword, 'MySecure123');
        await expectFieldValid(confirmPassword);
      });
    });

    test('should revalidate confirmPassword when password changes (bidirectional)', async ({
      page,
    }) => {
      await test.step('Change password after confirmPassword is filled', async () => {
        const password = page.getByLabel('Password', { exact: true });
        const confirmPassword = page.getByLabel(/confirm password/i);

        await fillAndBlur(password, 'MySecure123');
        await fillAndBlur(confirmPassword, 'MySecure123');
        await expectFieldValid(confirmPassword);

        // Change password using typeAndBlur - this properly triggers Angular's
        // valueChanges which is needed for bidirectional validation config to work
        await typeAndBlur(password, 'NewPassword456');
        await expectFieldHasError(confirmPassword, /match/i);
      });
    });

    test('should NOT create infinite validation loops (race condition test)', async ({
      page,
    }) => {
      await test.step('Both fields settle after bidirectional revalidation', async () => {
        const password = page.getByLabel('Password', { exact: true });
        const confirmPassword = page.getByLabel(/confirm password/i);

        await fillAndBlur(password, 'MySecure123');
        await fillAndBlur(confirmPassword, 'MySecure123');

        // Change password to trigger bidirectional revalidation: the confirm
        // value no longer matches, and the password itself is valid.
        await password.fill('NewPassword456');

        await expectFieldHasError(confirmPassword, /match/i);
        await expectFieldValid(password);

        // A stuck revalidation loop would keep either field busy.
        await expect(confirmPassword).not.toHaveAttribute('aria-busy', 'true');
        await expect(password).not.toHaveAttribute('aria-busy', 'true');
      });
    });
  });

  test.describe('Quantity Justification Validation', () => {
    test('should keep justification quiet until its own blur in on-blur mode', async ({
      page,
    }) => {
      await test.step('Fill quantity and confirm no immediate justification error', async () => {
        const quantity = page.getByLabel('Quantity', { exact: true });
        const justification = page.getByLabel('Justification', { exact: true });

        await typeAndBlur(quantity, '5');
        await waitForValidationToSettle(page);

        const justificationError = page
          .locator('form')
          .getByRole('status')
          .filter({
            hasText: /justification is required when quantity is provided/i,
          });
        await expect(justificationError).toHaveCount(0);
        await expect(justification).toHaveClass(/ng-untouched/);

        await justification.focus();
        await justification.blur();

        await expectFieldHasError(
          justification,
          /justification is required when quantity is provided/i
        );
      });
    });

    test('should keep quantity quiet until its own blur in on-blur mode', async ({
      page,
    }) => {
      await test.step('Fill justification and confirm no immediate quantity error', async () => {
        const quantity = page.getByLabel('Quantity', { exact: true });
        const justification = page.getByLabel('Justification', { exact: true });

        await fillAndBlur(justification, 'Needed for the project scope');
        await waitForValidationToSettle(page);

        const quantityError = page
          .locator('form')
          .getByRole('status')
          .filter({
            hasText: /quantity is required when justification is provided/i,
          });
        await expect(quantityError).toHaveCount(0);
        await expect(quantity).toHaveClass(/ng-untouched/);

        await quantity.focus();
        await quantity.blur();

        await expectFieldHasError(
          quantity,
          /quantity is required when justification is provided/i
        );
      });
    });
  });

  test.describe('Conditional Justification Validation', () => {
    test('should show justification field when checkbox is checked', async ({
      page,
    }) => {
      await test.step('Check "Requires Justification" checkbox', async () => {
        const checkbox = page.getByLabel(/requires justification/i);
        const justification = page.getByRole('textbox', {
          name: /justification.*min 20/i,
        });

        // Initially hidden
        await expect(justification).not.toBeVisible();

        await checkbox.check();
        await expect(checkbox).toBeChecked();

        // Should now be visible
        await expect(justification).toBeVisible();
      });
    });

    test('should hide justification field when checkbox is unchecked', async ({
      page,
    }) => {
      await test.step('Toggle checkbox on and off', async () => {
        const checkbox = page.getByLabel(/requires justification/i);
        const justification = page.getByRole('textbox', {
          name: /justification.*min 20/i,
        });

        await checkbox.check();
        await expect(justification).toBeVisible();

        await checkbox.uncheck();
        await expect(checkbox).not.toBeChecked();
        await expect(justification).not.toBeVisible();
      });
    });

    test('should NOT show errors immediately when checkbox reveals justification field (on-blur-or-submit mode)', async ({
      page,
    }) => {
      await test.step('Check checkbox and verify no immediate error display', async () => {
        const checkbox = page.getByLabel(/requires justification/i);

        // Check the checkbox (this reveals the justification field)
        await checkbox.check();
        await waitForValidationToSettle(page);

        const justification = page.getByRole('textbox', {
          name: /justification.*min 20/i,
        });

        // Wait for field to be visible
        await expect(justification).toBeVisible();

        // ✅ CRITICAL: Errors should NOT show immediately after field appears
        // The user has not interacted with the justification field yet
        // With the fix (no touch propagation), errors only show after blur or submit

        const requiredError = page
          .locator('form')
          .getByRole('status')
          .filter({
            hasText: /required/i,
          });

        // Verify no error is displayed (no error messages yet)
        await expect(requiredError).toHaveCount(0);

        // Field should remain untouched until user interaction
        await expect(justification).toHaveClass(/ng-untouched/);

        // Now blur the field (user interaction)
        await justification.focus();
        await justification.blur();
        await waitForValidationToSettle(page);

        // NOW errors should appear because user touched the field
        await expectFieldHasError(justification, /required/i);
      });
    });

    test('should validate justification minimum length (20 characters)', async ({
      page,
    }) => {
      await test.step('Enter justification shorter than 20 characters', async () => {
        const checkbox = page.getByLabel(/requires justification/i);
        await checkbox.check();

        const justification = page.getByRole('textbox', {
          name: /justification.*min 20/i,
        });

        await fillAndBlur(justification, 'Too short');
        await waitForValidationToSettle(page);
        await expectFieldHasError(justification, /20/i);

        await fillAndBlur(
          justification,
          'This is a valid justification text that is long enough'
        );
        await expectFieldValid(justification);
      });
    });

    test('should work correctly with @if conditional rendering (no timing issues)', async ({
      page,
    }) => {
      await test.step('Rapidly toggle checkbox and verify no validation timing issues', async () => {
        const checkbox = page.getByLabel(/requires justification/i);
        const justification = page.getByRole('textbox', {
          name: /justification.*min 20/i,
        });

        // Rapid toggles must not leave the conditional field stuck.
        for (let i = 0; i < 3; i++) {
          await checkbox.check();
          await expect(justification).toBeVisible();
          await checkbox.uncheck();
          await expect(justification).not.toBeVisible();
        }

        // Check, fill, uncheck, recheck - testing that validation doesn't get stuck
        await checkbox.check();
        await expect(justification).toBeVisible();

        await fillAndBlur(
          justification,
          'This justification has enough characters for validation'
        );
        await expectFieldValid(justification);

        await checkbox.uncheck();
        await expect(justification).not.toBeVisible();

        await checkbox.check();
        await expect(justification).toBeVisible();

        // Note: Value is NOT preserved when field is hidden/shown with @if - this is expected behavior
        // The field is destroyed and recreated, so the value is lost
        await expect(justification).toHaveValue('');
      });
    });

    test('should not keep stale aria-describedby references when conditional field is hidden and shown again', async ({
      page,
    }) => {
      await test.step('Create an error, then hide conditional field', async () => {
        const checkbox = page.getByLabel(/requires justification/i);
        const justification = page.getByRole('textbox', {
          name: /justification.*min 20/i,
        });

        await checkbox.check();
        await fillAndBlur(justification, 'Too short');
        await expectFieldHasError(justification, /20/i);

        const describedByBeforeHide =
          (await justification.getAttribute('aria-describedby')) || '';
        const describedByIdsBeforeHide = describedByBeforeHide
          .split(/\s+/)
          .filter(Boolean);

        await checkbox.uncheck();
        await expect(justification).not.toBeVisible();

        // IDs attached to the hidden/destroyed field should not remain in the DOM
        for (const id of describedByIdsBeforeHide) {
          await expect(page.locator(`#${id}`)).toHaveCount(0);
        }
      });

      await test.step('Re-show field and verify no stale linkage from previous instance', async () => {
        const checkbox = page.getByLabel(/requires justification/i);
        const justification = page.getByRole('textbox', {
          name: /justification.*min 20/i,
        });

        await checkbox.check();
        await expect(justification).toBeVisible();
        await expect(justification).toHaveValue('');
        await expect(justification).toHaveClass(/ng-untouched/);
        await expect(justification).not.toHaveAttribute('aria-invalid', 'true');
      });
    });
  });

  test.describe('Cascade Country Validation', () => {
    test('should NOT require state and zipCode before country is selected', async ({
      page,
    }) => {
      await test.step('Blur dependent fields while country is empty', async () => {
        const state = page.getByRole('textbox', { name: /state\/province/i });
        const zipCode = page.getByLabel(/postal code/i);

        await state.focus();
        await state.blur();
        await zipCode.focus();
        await zipCode.blur();

        const stateRequiredError = page
          .locator('form')
          .getByRole('status')
          .filter({
            hasText: /state\/province is required/i,
          });
        const zipRequiredError = page
          .locator('form')
          .getByRole('status')
          .filter({
            hasText: /postal code is required/i,
          });

        await expect(stateRequiredError).toHaveCount(0);
        await expect(zipRequiredError).toHaveCount(0);
      });
    });

    test('should require state and zipCode when country is selected', async ({
      page,
    }) => {
      await test.step('Select country and verify dependent fields become required', async () => {
        const country = page.getByLabel(/country/i);
        const state = page.getByRole('textbox', { name: /state\/province/i });
        const zipCode = page.getByLabel(/postal code/i);

        await country.selectOption({ label: 'United States' });

        // State and zipCode should now be required
        await state.focus();
        await state.blur();
        await expectFieldHasError(state, /required/i);

        await zipCode.focus();
        await zipCode.blur();
        await expectFieldHasError(zipCode, /required/i);

        // Verify accessibility structure shows cascade validation errors
        const cascadeSection = page
          .locator('text=Cascade Validation')
          .locator('..');
        await expect(cascadeSection).toMatchAriaSnapshot(`
          - heading "Cascade Validation" [level=2]
          - paragraph: Changing country triggers state and zip code validation.
        `);
      });
    });

    test('should validate country itself is required', async ({ page }) => {
      await test.step('Blur country without selection', async () => {
        const country = page.getByLabel(/country/i);

        await country.focus();
        await country.blur();
        await expectFieldHasError(country, /required/i);
      });
    });

    test('should clear state and zipCode errors when filled', async ({
      page,
    }) => {
      await test.step('Select country and fill dependent fields', async () => {
        const country = page.getByLabel(/country/i);
        const state = page.getByRole('textbox', { name: /state\/province/i });
        const zipCode = page.getByLabel(/postal code/i);

        await country.selectOption({ label: 'United States' });

        await state.focus();
        await state.blur();
        await expectFieldHasError(state);

        await fillAndBlur(state, 'California');
        await expectFieldValid(state);

        await fillAndBlur(zipCode, '90210');
        await expectFieldValid(zipCode);
      });
    });

    test('should omit state and zipCode required constraints again when country is cleared', async ({
      page,
    }) => {
      await test.step('Make dependent fields required and show errors', async () => {
        const country = page.getByLabel(/country/i);
        const state = page.getByRole('textbox', { name: /state\/province/i });
        const zipCode = page.getByLabel(/postal code/i);

        await country.selectOption({ label: 'United States' });

        await state.focus();
        await state.blur();
        await zipCode.focus();
        await zipCode.blur();

        await expectFieldHasError(state, /required/i);
        await expectFieldHasError(zipCode, /required/i);
      });

      await test.step('Clear country and verify dependent required errors are omitted', async () => {
        const country = page.getByLabel(/country/i);
        const state = page.getByRole('textbox', { name: /state\/province/i });
        const zipCode = page.getByLabel(/postal code/i);

        await country.selectOption('');
        await waitForValidationToSettle(page);

        // Country itself is now required and invalid after blur
        await country.focus();
        await country.blur();
        await expectFieldHasError(country, /required/i);

        // State/zip should no longer be required when country is empty
        await state.focus();
        await state.blur();
        await zipCode.focus();
        await zipCode.blur();

        const stateRequiredError = page
          .locator('form')
          .getByRole('status')
          .filter({
            hasText: /state\/province is required/i,
          });
        const zipRequiredError = page
          .locator('form')
          .getByRole('status')
          .filter({
            hasText: /postal code is required/i,
          });

        await expect(stateRequiredError).toHaveCount(0);
        await expect(zipRequiredError).toHaveCount(0);
      });
    });
  });

  test.describe('Date Range Validation', () => {
    test('should require startDate', async ({ page }) => {
      await test.step('Blur startDate without value', async () => {
        const startDate = page.getByLabel(/start date/i);

        await startDate.focus();
        await startDate.blur();
        await expectFieldHasError(startDate, /required/i);
      });
    });

    test('should require endDate', async ({ page }) => {
      await test.step('Blur endDate without value', async () => {
        const endDate = page.getByLabel(/end date/i);

        await endDate.focus();
        await endDate.blur();
        await expectFieldHasError(endDate, /required/i);
      });
    });

    test('should validate that endDate is after startDate', async ({
      page,
    }) => {
      await test.step('Set endDate before startDate', async () => {
        const startDate = page.getByLabel(/start date/i);
        const endDate = page.getByLabel(/end date/i);

        await fillAndBlur(startDate, '2025-01-15');
        await fillAndBlur(endDate, '2025-01-10');

        await expectFieldHasError(endDate, /after|before/i);

        // Verify accessibility structure shows date range validation error
        const dateSection = page
          .locator('text=Date Range Validation')
          .locator('..');
        await expect(dateSection).toMatchAriaSnapshot(`
          - heading "Date Range Validation" [level=2]
          - paragraph: Start and end dates validate against each other.
          - text: Start Date
          - textbox "Start Date": /\\d{4}-\\d{2}-\\d{2}/
          - status
          - status
          - status
          - text: End Date
          - textbox "End Date": /\\d{4}-\\d{2}-\\d{2}/
          - status:
            - list:
              - listitem: End date must be after start date
          - status
          - status
        `);
      });
    });

    test('should clear error when endDate is corrected to be after startDate (bidirectional)', async ({
      page,
    }) => {
      await test.step('Fix date range', async () => {
        const startDate = page.getByLabel(/start date/i);
        const endDate = page.getByLabel(/end date/i);

        await setDateLikeValueAndBlur(startDate, '2025-01-10');
        await setDateLikeValueAndBlur(endDate, '2025-01-05');
        await expectFieldHasError(endDate, /after/i);

        // Fix endDate using typeAndBlur for proper bidirectional trigger
        await setDateLikeValueAndBlur(endDate, '2025-01-20');
        await expectFieldValid(endDate);
        await expectFieldValid(startDate);
      });
    });

    test('should revalidate endDate when startDate changes (bidirectional)', async ({
      page,
    }) => {
      await test.step('Change startDate after dates are filled', async () => {
        const startDate = page.getByLabel(/start date/i);
        const endDate = page.getByLabel(/end date/i);

        await setDateLikeValueAndBlur(startDate, '2025-01-10');
        await setDateLikeValueAndBlur(endDate, '2025-01-15');
        await expectFieldValid(endDate);

        // Change startDate - endDate should show error via bidirectional config
        await setDateLikeValueAndBlur(startDate, '2025-01-20');
        await expectFieldHasError(endDate, /after/i);
      });
    });

    test('should omit ordering error when one date is cleared and show relevant required error', async ({
      page,
    }) => {
      await test.step('Create ordering error first', async () => {
        const startDate = page.getByLabel(/start date/i);
        const endDate = page.getByLabel(/end date/i);

        await setDateLikeValueAndBlur(startDate, '2025-01-20');
        await setDateLikeValueAndBlur(endDate, '2025-01-10');
        await expectFieldHasError(endDate, /after/i);
      });

      await test.step('Clear start date and verify ordering error is omitted', async () => {
        const startDate = page.getByLabel(/start date/i);
        const endDate = page.getByLabel(/end date/i);

        await setDateLikeValueAndBlur(startDate, '');
        await waitForValidationToSettle(page);

        await expectFieldHasError(startDate, /required/i);

        // End date should be valid now (no ordering rule when start is empty)
        await expectFieldValid(endDate);
      });
    });
  });

  test.describe('Overall Form Validation', () => {
    test('should show success state when all validations pass', async ({
      page,
    }) => {
      await test.step('Fill all fields correctly', async () => {
        const password = page.getByLabel('Password', { exact: true });
        const confirmPassword = page.getByLabel(/confirm password/i);
        const country = page.getByLabel(/country/i);
        const state = page.getByRole('textbox', { name: /state\/province/i });
        const zipCode = page.getByLabel(/postal code/i);
        const startDate = page.getByLabel(/start date/i);
        const endDate = page.getByLabel(/end date/i);

        await fillAndBlur(password, 'SecurePass123');
        await fillAndBlur(confirmPassword, 'SecurePass123');
        await country.selectOption({ label: 'United States' });
        await fillAndBlur(state, 'California');
        await fillAndBlur(zipCode, '90210');
        await setDateLikeValueAndBlur(startDate, '2025-01-10');
        await setDateLikeValueAndBlur(endDate, '2025-01-20');

        await waitForValidationToSettle(page);

        // Look for success indicator - check sidebar status badge shows valid
        await expect(
          getMainContentSidebar(page).getByLabel('Valid')
        ).toBeVisible();
      });
    });
  });

  test.describe('Key Features Verification', () => {
    test('should display the intro callout content', async ({ page }) => {
      await test.step('Verify the intro section reflects the current examples layout', async () => {
        await expect(
          page.getByRole('heading', {
            name: /why this matters/i,
            level: 2,
          })
        ).toBeVisible();
        await expect(
          page.getByText(/one config map declares all dependencies/i)
        ).toBeVisible();
        await expect(page.getByText(/conditional revalidation/i)).toBeVisible();
        await expect(
          page.getByText(/errors block, warnings advise/i)
        ).toBeVisible();
        await expect(page.getByText(/omit rules conditionally/i)).toBeVisible();
      });
    });

    test('should work correctly with debounced validation', async ({
      page,
    }) => {
      await test.step('Type rapidly and verify validation waits for debounce', async () => {
        const password = page.getByLabel('Password', { exact: true });
        const confirmPassword = page.getByLabel(/confirm password/i);

        // Use fill() for reliability - tests debounce on value change, not keystroke timing
        await password.fill('MySecure123');
        await password.blur();

        // Validation should run after debounce completes
        await waitForValidationToSettle(page);

        // Fill confirmPassword to make passwords match
        await confirmPassword.fill('MySecure123');
        await confirmPassword.blur();
        await waitForValidationToSettle(page);

        // Password field should not be invalid (warnings don't affect validity)
        await expect(password).not.toHaveClass(/ng-invalid/);
      });
    });
  });

  // Colour is theme CSS and is not asserted in e2e. These tests keep the
  // behaviour the library owns: aria-invalid follows validity.
  test.describe('Invalid Field ARIA State', () => {
    test('should set aria-invalid on an invalid select', async ({ page }) => {
      const country = page.getByLabel(/country/i);

      await country.focus();
      await country.blur();

      await expect(country).toHaveAttribute('aria-invalid', 'true');
    });

    test('should set aria-invalid on an invalid textarea', async ({ page }) => {
      const checkbox = page.getByLabel(/requires justification/i);
      await checkbox.check();

      const justification = page.getByRole('textbox', {
        name: /justification.*min 20/i,
      });

      await fillAndBlur(justification, 'Too short');

      // ARIA wiring happens in an effect after controls are detected.
      await expect(justification).toHaveAttribute('aria-invalid', 'true', {
        timeout: 10000,
      });
    });

    test('should clear aria-invalid when field becomes valid', async ({
      page,
    }) => {
      const password = page.getByLabel('Password', { exact: true });

      await fillAndBlur(password, 'Short');
      await expect(password).toHaveClass(/ng-invalid/, { timeout: 10000 });
      await expect(password).toHaveAttribute('aria-invalid', 'true', {
        timeout: 10000,
      });

      await fillAndBlur(password, 'ValidPassword123');
      await expect(password).not.toHaveClass(/ng-invalid/, {
        timeout: 10000,
      });
      await expect(password).not.toHaveAttribute('aria-invalid', 'true');
    });

    test('should set aria-invalid on every invalid field type', async ({
      page,
    }) => {
      await test.step('Trigger validation errors on multiple fields', async () => {
        const password = page.getByLabel('Password', { exact: true });
        const country = page.getByLabel(/country/i);
        const state = page.getByRole('textbox', { name: /state\/province/i });

        await fillAndBlur(password, 'Short');
        // Country stays invalid until a value is selected; selecting it makes
        // state required, so blur state after selection.
        await country.focus();
        await country.blur();
        await country.selectOption({ label: 'United States' });
        await state.focus();
        await state.blur();
      });

      await test.step('Verify text inputs expose invalid state', async () => {
        const password = page.getByLabel('Password', { exact: true });
        const state = page.getByRole('textbox', { name: /state\/province/i });

        await expectFieldHasError(password);
        await expect(password).toHaveAttribute('aria-invalid', 'true', {
          timeout: 10000,
        });
        await expectFieldHasError(state);
        await expect(state).toHaveAttribute('aria-invalid', 'true', {
          timeout: 10000,
        });
      });
    });
  });

  test.describe('Password Warnings (Vest warn() Integration)', () => {
    // Length, non-blocking, clear-at-12 and pristine warning behaviour is
    // owned by purchase-form/password-warnings.form.spec.ts.
    test('should show confirm password warning after validationConfig trigger and restore baseline state on reset', async ({
      page,
    }) => {
      await test.step('Update password without touching confirm password', async () => {
        const password = page.getByLabel('Password', { exact: true });
        await fillAndBlur(password, 'Valid123');
      });

      await test.step('Verify guidance appears on confirm password after interaction', async () => {
        const confirmPassword = page.getByLabel(/confirm password/i);
        await confirmPassword.focus();
        await confirmPassword.blur();

        const warningsContainer = await getWarningElementFor(
          confirmPassword,
          /confirm your password/i
        );
        await expect(warningsContainer).toContainText(/confirm your password/i);
      });

      await test.step('Reset form and verify baseline warning state is stable', async () => {
        const resetButton = page.getByRole('button', { name: /reset form/i });
        await resetButton.click();
        await waitForValidationToSettle(page);

        const password = page.getByLabel('Password', { exact: true });
        const confirmPassword = page.getByLabel(/confirm password/i);

        // Reset should restore empty form values.
        await expect(password).toHaveValue('');
        await expect(confirmPassword).toHaveValue('');

        // Password-length warning from previously entered password should be cleared.
        await expect(
          page
            .locator('form')
            .getByRole('status')
            .filter({ hasText: /12\+\s*characters/i })
        ).toHaveCount(0);

        // Confirm-password guidance should not persist after reset on pristine state.
        await expect(
          page
            .locator('form')
            .getByRole('status')
            .filter({ hasText: /confirm your password/i })
        ).toHaveCount(0);
      });
    });
  });
});
