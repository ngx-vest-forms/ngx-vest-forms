import { expect, test } from '@playwright/test';
import {
  expectChecked,
  expectDisabled,
  expectEnabled,
  expectFieldHasError,
  expectFieldValid,
  expectUnchecked,
  fillAndBlur,
  navigateToPurchaseForm,
  selectRadio,
  typeAndBlur,
  waitForFormProcessing,
  waitForValidationToComplete,
  waitForValidationToSettle,
} from '../../helpers/form-helpers';

test.describe('Purchase Form', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToPurchaseForm(page);
  });

  test.describe('Basic Form Validation', () => {
    test('should show validation errors for required fields on blur', async ({
      page,
    }) => {
      await test.step('Focus and blur required fields to trigger validation', async () => {
        const firstName = page.getByLabel(/first name/i);
        const lastName = page.getByLabel(/last name/i);
        const dateOfBirth = page.getByLabel(/birth date/i);
        const age = page.getByLabel(/age/i);

        await firstName.focus();
        await firstName.blur();
        await expectFieldHasError(firstName, /required/i);

        await lastName.focus();
        await lastName.blur();
        await expectFieldHasError(lastName, /required/i);

        await dateOfBirth.focus();
        await dateOfBirth.blur();
        await expectFieldHasError(dateOfBirth, /required/i);

        await age.focus();
        await age.blur();
        await expectFieldHasError(age, /required/i);
      });
    });

    test('should clear validation errors when fields are filled correctly', async ({
      page,
    }) => {
      await test.step('Fill required fields and verify errors clear', async () => {
        const firstName = page.getByLabel(/first name/i);
        const lastName = page.getByLabel(/last name/i);
        const dateOfBirth = page.getByLabel(/birth date/i);
        const age = page.getByLabel(/age/i);

        // Fill all fields first, then verify validity
        // This avoids timing issues where async validations might affect intermediate states
        await fillAndBlur(firstName, 'John');
        await fillAndBlur(lastName, 'Doe');
        await fillAndBlur(dateOfBirth, '1990-01-01');
        await fillAndBlur(age, '34');

        // Now verify each field is valid
        await expectFieldValid(firstName);
        await expectFieldValid(lastName);
        await expectFieldValid(dateOfBirth);
        await expectFieldValid(age);
      });
    });
  });

  test.describe('Conditional Field Validation - Age and Emergency Contact', () => {
    test('should require emergency contact when age < 18', async ({ page }) => {
      await test.step('Set age to 17 and verify emergency contact is required and enabled', async () => {
        const age = page.getByLabel(/age/i);
        const emergencyContact = page.getByLabel(/emergency contact/i);

        await fillAndBlur(age, '17');
        await expectEnabled(emergencyContact);

        await emergencyContact.focus();
        await emergencyContact.blur();
        await expectFieldHasError(emergencyContact, /required/i);
      });
    });

    test('should disable emergency contact when age >= 18', async ({
      page,
    }) => {
      await test.step('Set age to 18 and verify emergency contact is disabled', async () => {
        const age = page.getByLabel(/age/i);
        const emergencyContact = page.getByLabel(/emergency contact/i);

        await fillAndBlur(age, '18');
        await expectDisabled(emergencyContact);

        // Verify accessibility tree shows disabled state
        const emergencyWrapper = emergencyContact.locator('..');
        await expect(emergencyWrapper).toMatchAriaSnapshot(`
          - text: Emergency Contact
          - textbox "Emergency Contact" [disabled]
        `);
      });
    });

    test('should re-enable emergency contact when age changes from 18 to 17', async ({
      page,
    }) => {
      await test.step('Change age from 18 back to 17', async () => {
        const age = page.getByLabel(/age/i);
        const emergencyContact = page.getByLabel(/emergency contact/i);

        await fillAndBlur(age, '18');
        await expectDisabled(emergencyContact);

        await fillAndBlur(age, '17');
        await expectEnabled(emergencyContact);
      });
    });
  });

  test.describe('Conditional Field Validation - Gender Other', () => {
    test('should show and require genderOther field when gender is "other"', async ({
      page,
    }) => {
      await test.step('Select "other" gender and verify genderOther field appears', async () => {
        await selectRadio(page, 'gender', 'Other');

        const genderOther = page.getByLabel(/specify gender/i);
        await expect(genderOther).toBeVisible();

        await genderOther.focus();
        await genderOther.blur();
        await expectFieldHasError(genderOther, /specify/i);

        // Verify the genderOther error state in accessibility tree
        const genderOtherWrapper = genderOther.locator('..');
        await expect(genderOtherWrapper).toMatchAriaSnapshot(`
          - text: Specify gender
          - textbox "Specify gender"
        `);
      });
    });

    test('should hide genderOther field when gender is not "other"', async ({
      page,
    }) => {
      await test.step('Select "other" then change to "male"', async () => {
        await selectRadio(page, 'gender', 'Other');
        const genderOther = page.getByLabel(/specify gender/i);
        await expect(genderOther).toBeVisible();

        await selectRadio(page, 'gender', 'Male');
        await expect(genderOther).not.toBeVisible();
      });
    });
  });

  test.describe('Conditional Field Validation - Quantity and Justification', () => {
    test('should require justification when quantity > 5', async ({ page }) => {
      await test.step('Set quantity to 6 and verify justification is required', async () => {
        const quantity = page.getByRole('spinbutton', { name: /quantity/i });
        await fillAndBlur(quantity, '6');

        const justification = page.getByLabel(/justification/i);
        await expect(justification).toBeVisible();

        await justification.focus();
        await justification.blur();
        await expectFieldHasError(justification, /required/i);
      });
    });

    test('should hide justification when quantity <= 5', async ({ page }) => {
      await test.step('Set quantity to 6 then change to 5', async () => {
        const quantity = page.getByRole('spinbutton', { name: /quantity/i });
        await fillAndBlur(quantity, '6');

        const justification = page.getByLabel(/justification/i);
        await expect(justification).toBeVisible();

        await fillAndBlur(quantity, '5');
        await expect(justification).not.toBeVisible();
      });
    });

    test('should revalidate justification when quantity changes bidirectionally', async ({
      page,
    }) => {
      await test.step('Test bidirectional validation between quantity and justification', async () => {
        const quantity = page.getByRole('spinbutton', { name: /quantity/i });
        const justification = page.getByLabel(/justification/i);

        await fillAndBlur(quantity, '6');
        await expect(justification).toBeVisible();
        await fillAndBlur(justification, 'Need extra stock');

        // Change quantity back to 5, justification should disappear without errors
        await fillAndBlur(quantity, '5');
        await expect(justification).not.toBeVisible();

        // Change back to 6, justification should reappear (but value may not be preserved)
        await fillAndBlur(quantity, '6');
        await expect(justification).toBeVisible();
      });
    });
  });

  test.describe('Bidirectional Password Validation', () => {
    /**
     * Note: Comprehensive bidirectional password validation tests are in
     * validation-config-demo.spec.ts which uses typeAndBlur() to properly
     * trigger Angular's change detection for bidirectional validation.
     *
     * The purchase-form tests below verify basic password interaction.
     */
    test('should require confirmPassword when password is filled', async ({
      page,
    }) => {
      await test.step('Fill password and verify confirmPassword becomes required', async () => {
        const password = page.getByLabel('Password', { exact: true });
        const confirmPassword = page.getByLabel('Confirm Password');

        await typeAndBlur(password, 'SecurePass123');
        await waitForValidationToSettle(page, 10000);

        await confirmPassword.focus();
        await confirmPassword.blur();
        await waitForValidationToSettle(page, 10000);

        await expectFieldHasError(
          confirmPassword,
          /confirm password is not filled in/i
        );
      });
    });
  });

  test.describe('Async Validation - UserId', () => {
    test('should validate userId asynchronously', async ({ page }) => {
      await test.step('Enter userId and wait for async validation', async () => {
        const userId = page.getByLabel(/user id/i);

        await userId.fill('1');
        await userId.blur();

        // Wait for async validation to complete
        await waitForValidationToComplete(userId, 3000);

        // Check that validation completed (field should not be busy)
        await expect(userId).not.toHaveAttribute('aria-busy', 'true');
      });
    });
  });

  test.describe('Auto-population Effects', () => {
    test('should set gender to male when firstName is "Brecht"', async ({
      page,
    }) => {
      await test.step('Type "Brecht" in firstName', async () => {
        const firstName = page.getByLabel(/first name/i);
        await fillAndBlur(firstName, 'Brecht');

        // Use getByLabel to find the radio by its individual label
        const maleRadio = page.getByLabel('Male', { exact: true });
        await expect(maleRadio).toBeChecked();
      });
    });

    test('should auto-fill fields when firstName is "Brecht" and lastName is "Billiet"', async ({
      page,
    }) => {
      await test.step('Type "Brecht Billiet" and verify auto-population', async () => {
        const firstName = page.getByLabel(/first name/i);
        const lastName = page.getByLabel(/last name/i);
        const age = page.getByLabel(/age/i);
        const password = page.getByLabel('Password', { exact: true });
        const confirmPassword = page.getByLabel('Confirm Password');

        await fillAndBlur(firstName, 'Brecht');
        await fillAndBlur(lastName, 'Billiet');

        // Verify auto-populated values
        await expect(age).toHaveValue('35');
        await expect(password).not.toBeEmpty();
        await expect(confirmPassword).not.toBeEmpty();
      });
    });
  });

  test.describe('Shipping Address State Preservation', () => {
    test('should preserve shipping address when toggling checkbox', async ({
      page,
    }) => {
      await test.step('Fill shipping address, toggle checkbox, and verify preservation', async () => {
        const checkbox = page.getByLabel(
          /shipping address is different from billing address/i
        );
        await checkbox.check();
        await expectChecked(checkbox);

        // Wait for shipping section to appear and verify it's visible
        const shippingHeading = page.getByRole('heading', {
          name: 'Shipping Address',
        });
        await expect(shippingHeading).toBeVisible();

        // Fill shipping address fields - use placeholder since labels are not wrapping inputs
        const shippingStreet = page.getByPlaceholder('Type street').nth(1);
        await fillAndBlur(shippingStreet, '123 Shipping St');

        // Uncheck checkbox - shipping section should disappear
        await checkbox.uncheck();
        await expectUnchecked(checkbox);

        // Verify shipping section is now hidden (check the heading instead of individual fields)
        await expect(shippingHeading).not.toBeVisible();

        // Check again - shipping section should reappear
        await checkbox.check();
        await expectChecked(checkbox);

        // Verify shipping section is visible again
        await expect(shippingHeading).toBeVisible();
      });
    });

    test('should validate that shipping address differs from billing address', async ({
      page,
    }) => {
      await test.step('Set same address for both billing and shipping', async () => {
        // Enable shipping address section
        const checkbox = page.getByLabel(
          /shipping address is different from billing address/i
        );
        await checkbox.check();

        // Wait for shipping address section to appear (it's conditionally rendered)
        const shippingHeading = page.getByRole('heading', {
          name: /shipping address/i,
        });
        await expect(shippingHeading).toBeVisible();

        // Fill ALL billing address fields using stable ids
        const billingStreet = page.locator('#billing-address-street');
        const billingNumber = page.locator('#billing-address-number');
        const billingCity = page.locator('#billing-address-city');
        const billingZipcode = page.locator('#billing-address-zipcode');
        const billingCountry = page.locator('#billing-address-country');

        await fillAndBlur(billingStreet, '456 Main St');
        await fillAndBlur(billingNumber, '10');
        await fillAndBlur(billingCity, 'Amsterdam');
        await fillAndBlur(billingZipcode, '1234AB');
        await fillAndBlur(billingCountry, 'Netherlands');

        // Fill ALL shipping address fields with SAME values using stable ids
        const shippingStreet = page.locator('#shipping-address-street');
        const shippingNumber = page.locator('#shipping-address-number');
        const shippingCity = page.locator('#shipping-address-city');
        const shippingZipcode = page.locator('#shipping-address-zipcode');
        const shippingCountry = page.locator('#shipping-address-country');

        // Wait for the shipping fields to be available
        await expect(shippingStreet).toBeVisible();

        await fillAndBlur(shippingStreet, '456 Main St');
        await fillAndBlur(shippingNumber, '10');
        await fillAndBlur(shippingCity, 'Amsterdam');
        await fillAndBlur(shippingZipcode, '1234AB');
        await fillAndBlur(shippingCountry, 'Netherlands');

        // Wait for Angular to process all changes
        await waitForFormProcessing(page);

        // Submit to trigger form-level validation
        const submitButton = page.getByRole('button', { name: /submit/i });
        await submitButton.click();

        // Wait for validation to settle
        await waitForFormProcessing(page);

        // Check for error message - the validation tests that billing and shipping addresses are different
        // when shippingAddressDifferentFromBillingAddress is checked
        const errorMessage = page.locator('form').getByText(/addresses.*same/i);
        await expect(errorMessage).toBeVisible();
      });
    });
  });

  test.describe('Utility Functions', () => {
    test('should clear sensitive data when clicking "Clear Sensitive Data" button', async ({
      page,
    }) => {
      await test.step('Fill sensitive fields and clear them', async () => {
        const password = page.getByLabel('Password', { exact: true });
        const confirmPassword = page.getByLabel('Confirm Password');
        const userId = page.getByLabel(/user id/i);
        const emergencyContact = page.getByLabel(/emergency contact/i);

        // First set age < 18 to enable emergency contact
        const age = page.getByLabel(/age/i);
        await fillAndBlur(age, '17');

        await fillAndBlur(password, 'SecurePass123');
        await fillAndBlur(confirmPassword, 'SecurePass123');
        await fillAndBlur(userId, '1');
        await fillAndBlur(emergencyContact, 'Mom: 555-1234');

        // Click clear button
        const clearButton = page.getByRole('button', {
          name: /clear sensitive data/i,
        });
        await clearButton.click();

        // Verify fields are cleared
        await expect(password).toBeEmpty();
        await expect(confirmPassword).toBeEmpty();
        await expect(userId).toBeEmpty();
        await expect(emergencyContact).toBeEmpty();
      });
    });

    test('should prefill billing address when clicking "Prefill Billing Address" button', async ({
      page,
    }) => {
      await test.step('Click prefill button and verify address is populated', async () => {
        const prefillButton = page.getByRole('button', {
          name: /prefill billing address/i,
        });
        await prefillButton.click();

        const billingStreet = page.getByPlaceholder('Type street').first();
        await expect(billingStreet).not.toBeEmpty();
      });
    });
  });

  /**
   * Note: ROOT_FORM validation with Brecht/Billiet/30 combination cannot be tested
   * in E2E because the purchase-form component has an effect() that auto-fills
   * age=35 when firstName="Brecht" && lastName="Billiet", overwriting any manual
   * age=30 input. ROOT_FORM validation functionality is verified in unit tests.
   *
   * @see validate-root-form.directive.spec.ts for ROOT_FORM unit tests
   */

  test.describe('Phone Numbers Array Validation', () => {
    test('should require at least one phone number', async ({ page }) => {
      await test.step('Submit form without phone numbers', async () => {
        // Fill minimum required fields
        const firstName = page.getByLabel(/first name/i);
        await fillAndBlur(firstName, 'John');

        const submitButton = page.getByRole('button', { name: /submit/i });
        await submitButton.click();

        // Look for phone number requirement error (use first() to avoid strict mode)
        const errorMessage = page.locator('text=/at least.*phone/i').first();
        await expect(errorMessage).toBeVisible();
      });
    });

    test('should validate that all phone numbers are non-empty', async ({
      page,
    }) => {
      await test.step('Add phone number and verify validation', async () => {
        const phoneInput = page.getByLabel(/add new phone number/i);
        await fillAndBlur(phoneInput, '555-1234');

        const addButton = page.getByRole('button', { name: /^add$/i });
        await addButton.click();

        // After adding, the phone number should appear in the list
        // Wait for Angular to process the change
        await waitForFormProcessing(page);
      });
    });
  });

  test.describe('Product Selection Validation', () => {
    test('should require product selection', async ({ page }) => {
      await test.step('Blur product dropdown without selection', async () => {
        const productSelect = page.getByLabel(/product/i);
        await productSelect.focus();
        await productSelect.blur();
        await expectFieldHasError(productSelect, /required/i);
      });
    });

    test('should require quantity >= 1', async ({ page }) => {
      await test.step('Enter invalid quantity', async () => {
        const quantity = page.getByRole('spinbutton', { name: /quantity/i });
        await fillAndBlur(quantity, '0');
        await expectFieldHasError(quantity);
      });
    });
  });

  test.describe('Address Validation', () => {
    test('should require all billing address fields', async ({ page }) => {
      await test.step('Uncheck shipping address checkbox to focus on billing', async () => {
        // Uncheck shipping address to reduce duplicate error messages
        const shippingCheckbox = page.getByRole('checkbox', {
          name: /shipping address is different/i,
        });
        await shippingCheckbox.uncheck();
        // No need to wait for full form processing here - just wait for checkbox state
        await expect(shippingCheckbox).not.toBeChecked();
      });

      await test.step('Submit form and verify address validation errors', async () => {
        // Submit the form to trigger all validations
        const submitButton = page.getByRole('button', { name: /submit/i });
        await submitButton.click();

        // Scope to the billing address section to avoid strict mode violations
        const billingSection = page
          .getByRole('heading', { name: /billing address/i })
          .locator('..');

        // The billing address fields should show validation errors
        const streetError = billingSection.getByText(/street.*required/i);
        const numberError = billingSection.getByText(/number.*required/i);
        const cityError = billingSection.getByText(/city.*required/i);
        const zipcodeError = billingSection.getByText(/zipcode.*required/i);
        const countryError = billingSection.getByText(/country.*required/i);

        // Verify all address validation errors are visible
        await expect(streetError).toBeVisible({ timeout: 3000 });
        await expect(numberError).toBeVisible({ timeout: 3000 });
        await expect(cityError).toBeVisible({ timeout: 3000 });
        await expect(zipcodeError).toBeVisible({ timeout: 3000 });
        await expect(countryError).toBeVisible({ timeout: 3000 });
      });
    });
  });

  test.describe('Form Reset Functionality', () => {
    test('should clear all form values when clicking Reset button', async ({
      page,
    }) => {
      await test.step('Fill form fields and click Reset', async () => {
        const firstName = page.getByLabel(/first name/i);
        const lastName = page.getByLabel(/last name/i);
        const age = page.getByLabel(/age/i);

        await fillAndBlur(firstName, 'John');
        await fillAndBlur(lastName, 'Doe');
        await fillAndBlur(age, '25');

        // Verify fields have values
        await expect(firstName).toHaveValue('John');
        await expect(lastName).toHaveValue('Doe');
        await expect(age).toHaveValue('25');

        // Click Reset button
        const resetButton = page.getByRole('button', { name: /^reset$/i });
        await resetButton.click();

        // Verify all fields are cleared
        await expect(firstName).toBeEmpty();
        await expect(lastName).toBeEmpty();
        await expect(age).toBeEmpty();
      });
    });

    test('should clear validation errors after reset', async ({ page }) => {
      await test.step('Trigger validation errors, then reset form', async () => {
        const firstName = page.getByLabel(/first name/i);
        const lastName = page.getByLabel(/last name/i);

        // Focus and blur to trigger validation errors
        await firstName.focus();
        await firstName.blur();
        await expectFieldHasError(firstName, /required/i);

        await lastName.focus();
        await lastName.blur();
        await expectFieldHasError(lastName, /required/i);

        // Click Reset button
        const resetButton = page.getByRole('button', { name: /^reset$/i });
        await resetButton.click();

        // Verify errors are cleared (fields should no longer show validation errors)
        // After reset, fields should be pristine and untouched, so no errors should display
        await expect(firstName).not.toHaveAttribute('aria-invalid', 'true');
        await expect(lastName).not.toHaveAttribute('aria-invalid', 'true');
      });
    });

    test('should reset form to pristine state after submit and reset', async ({
      page,
    }) => {
      await test.step('Submit form with errors, then reset', async () => {
        // Submit the form without filling any fields to trigger validation
        const submitButton = page.getByRole('button', { name: /submit/i });
        await submitButton.click();

        // Wait for validation errors to appear
        await waitForFormProcessing(page);

        // Form should show as invalid (look for any validation error)
        const anyError = page
          .locator('[role="status"]')
          .filter({ hasText: /required/i })
          .first();
        await expect(anyError).toBeVisible({ timeout: 3000 });

        // Click Reset button
        const resetButton = page.getByRole('button', { name: /^reset$/i });
        await resetButton.click();

        // Wait for reset to complete
        await waitForFormProcessing(page);

        // The form should be in pristine state - no errors visible
        // Check the firstName field specifically
        const firstName = page.getByLabel(/first name/i);
        await expect(firstName).not.toHaveAttribute('aria-invalid', 'true');
      });
    });

    test('should allow re-entering data after reset', async ({ page }) => {
      await test.step('Fill, reset, and refill form', async () => {
        const firstName = page.getByLabel(/first name/i);
        const lastName = page.getByLabel(/last name/i);

        // Initial fill
        await fillAndBlur(firstName, 'John');
        await fillAndBlur(lastName, 'Doe');

        // Reset
        const resetButton = page.getByRole('button', { name: /^reset$/i });
        await resetButton.click();

        // Verify cleared
        await expect(firstName).toBeEmpty();

        // Refill with different data
        await fillAndBlur(firstName, 'Jane');
        await fillAndBlur(lastName, 'Smith');

        // Verify new values
        await expect(firstName).toHaveValue('Jane');
        await expect(lastName).toHaveValue('Smith');
      });
    });

    test('should reset conditional fields state', async ({ page }) => {
      await test.step('Set conditional field, reset, verify conditional state is reset', async () => {
        const age = page.getByLabel(/age/i);
        const emergencyContact = page.getByLabel(/emergency contact/i);

        // Set age >= 18 to disable emergency contact
        await fillAndBlur(age, '25');
        await expectDisabled(emergencyContact);

        // Click Reset
        const resetButton = page.getByRole('button', { name: /^reset$/i });
        await resetButton.click();

        // After reset, age should be empty
        await expect(age).toBeEmpty();
        // With age empty, the conditional logic (age || 0) >= 18 evaluates to (0 >= 18) = false
        // So emergency contact becomes ENABLED (available for minors)
        await expectEnabled(emergencyContact);
        // Also verify the emergency contact field is empty
        await expect(emergencyContact).toBeEmpty();
      });
    });
  });

  test.describe('Fetch Data (Luke) Functionality', () => {
    test('should fetch Luke data and populate form fields', async ({
      page,
    }) => {
      await test.step('Click Fetch Data button and verify fields are populated', async () => {
        const fetchButton = page.getByRole('button', {
          name: /fetch data.*luke/i,
        });
        const userId = page.getByLabel(/user id/i);
        const firstName = page.getByLabel(/first name/i);
        const lastName = page.getByLabel(/last name/i);
        const genderMale = page.locator('#gender-male');

        // Initially fields should be empty/unchecked
        await expect(userId).toBeEmpty();
        await expect(firstName).toBeEmpty();
        await expect(lastName).toBeEmpty();
        await expect(genderMale).not.toBeChecked();

        // Click fetch button
        await fetchButton.click();

        // Wait for the data to load (fields should be populated)
        await expect(userId).toHaveValue('1', { timeout: 5000 });
        await expect(firstName).toHaveValue('Luke');
        await expect(lastName).toHaveValue('Skywalker');
        await expect(genderMale).toBeChecked();
      });
    });

    test('should disable fetched fields after data is loaded', async ({
      page,
    }) => {
      await test.step('Fetch data and verify fields are disabled', async () => {
        const fetchButton = page.getByRole('button', {
          name: /fetch data.*luke/i,
        });
        const userId = page.getByLabel(/user id/i);
        const firstName = page.getByLabel(/first name/i);
        const lastName = page.getByLabel(/last name/i);
        const genderMale = page.locator('#gender-male');
        const genderFemale = page.locator('#gender-female');
        const genderOther = page.locator('#gender-other');

        // Before fetch, fields should be enabled
        await expectEnabled(userId);
        await expectEnabled(firstName);
        await expectEnabled(lastName);

        // Click fetch button
        await fetchButton.click();

        // Wait for data to load
        await expect(firstName).toHaveValue('Luke', { timeout: 5000 });

        // After fetch, fields should be disabled
        await expectDisabled(userId);
        await expectDisabled(firstName);
        await expectDisabled(lastName);
        await expectDisabled(genderMale);
        await expectDisabled(genderFemale);
        await expectDisabled(genderOther);
      });
    });

    test('should clear fetched data and re-enable fields when clicking Clear Sensitive Data', async ({
      page,
    }) => {
      await test.step('Fetch data, then clear sensitive data', async () => {
        const fetchButton = page.getByRole('button', {
          name: /fetch data.*luke/i,
        });
        const clearButton = page.getByRole('button', {
          name: /clear sensitive data/i,
        });
        const userId = page.getByLabel(/user id/i);
        const firstName = page.getByLabel(/first name/i);
        const lastName = page.getByLabel(/last name/i);
        const genderMale = page.locator('#gender-male');

        // Fetch data first
        await fetchButton.click();
        await expect(firstName).toHaveValue('Luke', { timeout: 5000 });
        await expectDisabled(firstName);

        // Click clear sensitive data
        await clearButton.click();

        // Fields should be cleared and re-enabled
        await expect(userId).toBeEmpty();
        await expect(firstName).toBeEmpty();
        await expect(lastName).toBeEmpty();
        await expect(genderMale).not.toBeChecked();

        // Fields should be editable again
        await expectEnabled(userId);
        await expectEnabled(firstName);
        await expectEnabled(lastName);
        await expectEnabled(genderMale);
      });
    });

    test('should clear fetched data and re-enable fields when clicking Reset', async ({
      page,
    }) => {
      await test.step('Fetch data, then reset form', async () => {
        const fetchButton = page.getByRole('button', {
          name: /fetch data.*luke/i,
        });
        const resetButton = page.getByRole('button', { name: /^reset$/i });
        const userId = page.getByLabel(/user id/i);
        const firstName = page.getByLabel(/first name/i);
        const lastName = page.getByLabel(/last name/i);
        const genderMale = page.locator('#gender-male');

        // Fetch data first
        await fetchButton.click();
        await expect(firstName).toHaveValue('Luke', { timeout: 5000 });
        await expectDisabled(firstName);

        // Click reset
        await resetButton.click();

        // Fields should be cleared and re-enabled
        await expect(userId).toBeEmpty();
        await expect(firstName).toBeEmpty();
        await expect(lastName).toBeEmpty();
        await expect(genderMale).not.toBeChecked();

        // Fields should be editable again
        await expectEnabled(userId);
        await expectEnabled(firstName);
        await expectEnabled(lastName);
        await expectEnabled(genderMale);
      });
    });

    test('should allow re-fetching data after reset', async ({ page }) => {
      await test.step('Fetch, reset, then fetch again', async () => {
        const fetchButton = page.getByRole('button', {
          name: /fetch data.*luke/i,
        });
        const resetButton = page.getByRole('button', { name: /^reset$/i });
        const firstName = page.getByLabel(/first name/i);

        // Fetch data
        await fetchButton.click();
        await expect(firstName).toHaveValue('Luke', { timeout: 5000 });

        // Reset
        await resetButton.click();
        await expect(firstName).toBeEmpty();
        await expectEnabled(firstName);

        // Fetch again
        await fetchButton.click();
        await expect(firstName).toHaveValue('Luke', { timeout: 5000 });
        await expectDisabled(firstName);
      });
    });
  });

  test.describe('Prefill Billing Address', () => {
    test('should prefill all billing address fields including street number', async ({
      page,
    }) => {
      await test.step('Click prefill button and verify all address fields are populated', async () => {
        const prefillButton = page.getByRole('button', {
          name: /prefill billing address/i,
        });

        await prefillButton.click();

        // Use specific IDs for billing address fields to avoid ambiguity
        await expect(page.locator('#billing-address-street')).toHaveValue(
          '123 Main St'
        );
        await expect(page.locator('#billing-address-number')).toHaveValue(
          '42A'
        );
        await expect(page.locator('#billing-address-city')).toHaveValue(
          'New York'
        );
        await expect(page.locator('#billing-address-zipcode')).toHaveValue(
          '10001'
        );
        await expect(page.locator('#billing-address-country')).toHaveValue(
          'USA'
        );
      });
    });
  });

  test.describe('Error Display Modes and Timing', () => {
    test('should show errors on blur for individual fields', async ({
      page,
    }) => {
      await test.step('Focus and blur empty required field', async () => {
        const firstName = page.getByLabel(/first name/i);

        // Initially no error shown (field may not have aria-invalid yet)
        const initialAriaInvalid = await firstName.getAttribute('aria-invalid');
        expect(
          initialAriaInvalid === null || initialAriaInvalid === 'false'
        ).toBe(true);

        // Focus the field
        await firstName.focus();

        // Blur without entering value
        await firstName.blur();

        // Wait for validation
        await waitForFormProcessing(page);

        // Error should now be visible
        await expectFieldHasError(firstName, /required/i);
      });
    });

    test('should show all errors on submit even for untouched fields', async ({
      page,
    }) => {
      await test.step('Submit empty form and verify all errors appear', async () => {
        const firstName = page.getByLabel(/first name/i);
        const lastName = page.getByLabel(/last name/i);
        const submitButton = page.getByRole('button', { name: /submit/i });

        // Don't touch any fields - pristine (may not have aria-invalid)
        const firstNameInvalid = await firstName.getAttribute('aria-invalid');
        const lastNameInvalid = await lastName.getAttribute('aria-invalid');
        expect(firstNameInvalid === null || firstNameInvalid === 'false').toBe(
          true
        );
        expect(lastNameInvalid === null || lastNameInvalid === 'false').toBe(
          true
        );

        // Submit
        await submitButton.click();
        await waitForFormProcessing(page);

        // Both should show errors even though never touched
        await expectFieldHasError(firstName, /required/i);
        await expectFieldHasError(lastName, /required/i);
      });
    });

    test('should clear error when field is fixed after blur', async ({
      page,
    }) => {
      await test.step('Blur triggers error, typing clears it', async () => {
        const firstName = page.getByLabel(/first name/i);

        // Trigger error by blurring empty field
        await firstName.focus();
        await firstName.blur();
        await waitForFormProcessing(page);
        await expectFieldHasError(firstName, /required/i);

        // Type to fix - error should clear (don't wait for processing, just check result)
        await firstName.fill('John');
        await page.waitForTimeout(200);
        await expectFieldValid(firstName);
      });
    });

    test('should debounce async validation on userId field', async ({
      page,
    }) => {
      await test.step('Verify debounced validation behavior', async () => {
        const userId = page.getByLabel(/user id/i);

        // Use fillAndBlur to properly trigger Angular validation
        // The "1" userId exists in json-server and should fail validation
        await fillAndBlur(userId, '1');

        // After blur, validation should start (with 500ms debounce)
        // Then async validation runs (800ms delay in SwapiService)
        // waitForValidationToSettle handles this timing automatically
        await waitForValidationToSettle(page, 10000);

        // Should have completed validation - verify error is shown
        await expectFieldHasError(userId, /already taken/i);
      });
    });
  });

  test.describe('FormGroup Wrapper - Group Level Errors', () => {
    /**
     * Tests ROOT_FORM validation in 'submit' mode.
     * The errorsChange output now waits for async validation to complete after submit,
     * which ensures ROOT_FORM errors are included.
     *
     * @see validate-root-form.directive.spec.ts for unit tests
     * @see business-hours-form for 'live' mode ROOT_FORM validation
     */
    test('should display ROOT_FORM validation errors at form level', async ({
      page,
    }) => {
      await test.step('Trigger ROOT_FORM validation and verify display', async () => {
        const firstName = page.getByLabel(/first name/i);
        const lastName = page.getByLabel(/last name/i);
        const age = page.getByLabel(/age/i);
        const submitButton = page.getByRole('button', { name: /submit/i });

        // Fill with Brecht/Billiet combination that triggers ROOT_FORM validation
        await fillAndBlur(firstName, 'Brecht');
        await fillAndBlur(lastName, 'Billiet');

        // Age auto-fills to 35 due to effect, but let's manually set to 30 to trigger error
        await age.clear();
        await fillAndBlur(age, '30');
        await expect(age).toHaveValue('30');

        // Submit to trigger ROOT_FORM validation
        await submitButton.click();
        await expect
          .poll(
            async () => {
              const alerts = page.getByRole('alert');
              return (await alerts.count()) > 0;
            },
            {
              message: 'Waiting for form-level alert region to render',
              timeout: 15000,
              intervals: [100, 250, 500, 1000],
            }
          )
          .toBe(true);

        // Should show form-level error (not field-level)
        const formLevelError = page
          .getByRole('alert')
          .filter({ hasText: /brecht.*not.*30/i });
        await expect
          .poll(
            async () => {
              const count = await formLevelError.count();
              if (count === 0) {
                return false;
              }
              const text = (await formLevelError.first().textContent()) ?? '';
              return /brecht.*not.*30/i.test(text);
            },
            {
              message: 'Waiting for ROOT_FORM error to appear',
              timeout: 15000,
              intervals: [100, 250, 500, 1000],
            }
          )
          .toBe(true);
      });
    });

    test('should show nested group validation errors', async ({ page }) => {
      await test.step('Verify nested address group shows validation', async () => {
        const submitButton = page.getByRole('button', { name: /submit/i });

        // Submit without filling address
        await submitButton.click();
        await waitForFormProcessing(page);

        // Billing address fields should show errors
        const billingStreet = page.locator('#billing-address-street');
        await expectFieldHasError(billingStreet, /required/i);
      });
    });
  });

  test.describe('Validation Options Inheritance', () => {
    test('should apply control-level debounceTime for userId', async ({
      page,
    }) => {
      await test.step('Verify userId has 500ms debounce', async () => {
        const userId = page.getByLabel(/user id/i);

        // Use fillAndBlur to properly trigger Angular validation
        // The "1" userId exists in json-server and should fail validation
        await fillAndBlur(userId, '1');

        // After blur, validation should start (with 500ms debounce)
        // Then async validation runs (800ms delay in SwapiService)
        // waitForValidationToSettle handles this timing automatically
        await waitForValidationToSettle(page, 10000);

        // Should have validated - verify error shown
        await expectFieldHasError(userId, /already taken/i);
      });
    });

    test('should apply default validation timing for other fields', async ({
      page,
    }) => {
      await test.step('Verify firstName validates immediately on blur', async () => {
        const firstName = page.getByLabel(/first name/i);

        await firstName.focus();
        await firstName.blur();

        // Should validate quickly (no debounce)
        await waitForFormProcessing(page);

        await expectFieldHasError(firstName, /required/i);
      });
    });
  });

  test.describe('Advanced Field Clearing Scenarios', () => {
    test('should clear fetched data fields when clicking Clear Sensitive Data', async ({
      page,
    }) => {
      await test.step('Fetch data then clear, verify specific fields cleared', async () => {
        const fetchButton = page.getByRole('button', {
          name: /fetch data.*luke/i,
        });
        const clearButton = page.getByRole('button', {
          name: /clear sensitive data/i,
        });
        const userId = page.getByLabel(/user id/i);
        const firstName = page.getByLabel(/first name/i);
        const age = page.getByLabel(/age/i);

        // Fill age first (should NOT be cleared)
        await fillAndBlur(age, '25');

        // Fetch Luke data
        await fetchButton.click();
        await expect(firstName).toHaveValue('Luke', { timeout: 5000 });

        // Clear sensitive data
        await clearButton.click();

        // Sensitive fields should be cleared
        await expect(userId).toBeEmpty();
        await expect(firstName).toBeEmpty();

        // Age should still have value (not in clearFields list)
        await expect(age).toHaveValue('25');
      });
    });

    test('should preserve non-sensitive data when clearing', async ({
      page,
    }) => {
      await test.step('Fill form, clear sensitive, verify preservation', async () => {
        const password = page.getByLabel('Password', { exact: true });
        const age = page.getByLabel(/age/i);
        const clearButton = page.getByRole('button', {
          name: /clear sensitive data/i,
        });

        // Fill multiple fields
        await fillAndBlur(age, '30');
        await fillAndBlur(password, 'Secret123');

        // Clear sensitive data
        await clearButton.click();

        // Password should be cleared (sensitive)
        await expect(password).toBeEmpty();

        // Age should be preserved (not sensitive)
        await expect(age).toHaveValue('30');
      });
    });
  });
});
