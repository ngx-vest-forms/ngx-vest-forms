import { expect, test } from '@playwright/test';
import {
  expectChecked,
  expectFieldHasError,
  expectFieldValid,
  expectUnchecked,
  fillAndBlur,
} from './helpers/form-helpers';

/**
 * Helper: Navigate to wizard form
 */
async function navigateToWizard(page: import('@playwright/test').Page) {
  await page.goto('/wizard');
  await expect(
    page.getByRole('heading', { name: /multi-form wizard/i, level: 2 })
  ).toBeVisible();
}

/**
 * Helper: Click navigation button
 * Waits for any "Validating…" indicators to disappear before and after clicking
 */
async function clickNext(page: import('@playwright/test').Page) {
  // Wait for any async validation to complete before clicking
  await expect(page.getByText('Validating…')).toHaveCount(0, {
    timeout: 10000,
  });
  const button = page.getByRole('button', { name: /save & continue/i });
  await button.click();
  // Wait for any validation that may have been triggered by the click
  await expect(page.getByText('Validating…')).toHaveCount(0, {
    timeout: 10000,
  });
}

async function clickPrevious(page: import('@playwright/test').Page) {
  // Wait for any async validation to complete first
  await expect(page.getByText('Validating…')).toHaveCount(0, {
    timeout: 10000,
  });
  await page.getByRole('button', { name: /previous/i }).click();
}

async function clickSubmitAll(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: /submit all/i }).click();
}

/**
 * Helper: Wait for all validations to settle.
 * Uses a longer timeout for parallel execution scenarios.
 */
async function waitForValidationsToSettle(
  page: import('@playwright/test').Page,
  timeout = 20_000
) {
  await expect(page.getByText('Validating…')).toHaveCount(0, { timeout });
}

/**
 * Helper: Wait until the Wizard State sidebar shows a specific validity state.
 * This prevents races where `validChange` hasn't propagated yet when a step is submitted.
 */
async function waitForSidebarStepValidity(
  page: import('@playwright/test').Page,
  stepLabel: 'Step 1: Account' | 'Step 2: Profile' | 'Step 3: Confirm',
  expected: 'Valid' | 'Invalid',
  timeout = 30_000
) {
  const row = page.getByText(stepLabel, { exact: true }).locator('..');
  await expect
    .poll(
      async () => {
        const text = (await row.textContent()) ?? '';
        return text.includes(expected);
      },
      {
        message: `Waiting for ${stepLabel} to be ${expected}`,
        timeout,
        intervals: [100, 250, 500, 1000],
      }
    )
    .toBe(true);
}

test.describe('Wizard Form - Multi-Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToWizard(page);
  });

  test.describe('Step 1: Account Information', () => {
    test('should validate required email field on blur', async ({ page }) => {
      await test.step('Focus and blur email field', async () => {
        const emailField = page.getByLabel(/email address/i);
        await emailField.focus();
        await emailField.blur();
        await expectFieldHasError(emailField, /required/i);
      });
    });

    test('should validate email format', async ({ page }) => {
      await test.step('Enter invalid email format', async () => {
        const emailField = page.getByLabel(/email address/i);
        await fillAndBlur(emailField, 'invalid-email');
        await expectFieldHasError(emailField, /valid email/i);
      });

      await test.step('Correct email format clears error', async () => {
        const emailField = page.getByLabel(/email address/i);
        await fillAndBlur(emailField, 'test@example.com');
        await expectFieldValid(emailField);
      });
    });

    test('should navigate to step 2 when step 1 is valid', async ({ page }) => {
      await test.step('Submit All triggers validation on all steps', async () => {
        await fillAndBlur(
          page.getByLabel(/email address/i),
          'test@example.com'
        );
        await fillAndBlur(
          page.getByLabel(/confirm email/i),
          'test@example.com'
        ); // Must match email
        await fillAndBlur(
          page.getByRole('textbox', { name: 'Password', exact: true }),
          'SecurePass123!'
        );
        await fillAndBlur(
          page.getByRole('textbox', { name: 'Confirm Password', exact: true }),
          'SecurePass123!'
        );
        await waitForValidationsToSettle(page);
        await waitForSidebarStepValidity(page, 'Step 1: Account', 'Valid');

        // Submit step 1
        await page.getByRole('button', { name: /save & continue/i }).click();

        // Should navigate to step 2
        await expect(
          page.getByRole('heading', { name: /profile information/i })
        ).toBeVisible();
      });
    });

    test('should show validation errors when trying to proceed with invalid form', async ({
      page,
    }) => {
      await test.step('Click Save & Continue on empty form shows validation errors', async () => {
        const nextButton = page.getByRole('button', {
          name: /save & continue/i,
        });

        // Button is always enabled (a11y best practice)
        await expect(nextButton).toBeEnabled();

        // Click to trigger validation
        await nextButton.click();

        // Primary required fields should show errors
        // Note: confirmEmail/confirmPassword use omitWhen(!email/!password)
        // so they only validate when primary field has a value
        await expectFieldHasError(
          page.getByLabel(/email address/i),
          /required/i
        );
        await expectFieldHasError(
          page.getByRole('textbox', { name: 'Password', exact: true }),
          /required/i
        );

        // Verify the account section has proper heading structure in accessibility tree
        const accountSection = page.getByRole('heading', {
          name: /step 1: account setup/i,
        });
        await expect(accountSection).toBeVisible();

        // Should still be on step 1 (didn't navigate)
        await expect(
          page.getByRole('heading', { name: /step 1: account setup/i })
        ).toBeVisible();
      });

      await test.step('Fill email but not confirm, click shows confirm error', async () => {
        await fillAndBlur(
          page.getByLabel(/email address/i),
          'test@example.com'
        );

        const nextButton = page.getByRole('button', {
          name: /save & continue/i,
        });
        await nextButton.click();

        // Now confirmEmail should show error (omitWhen condition no longer true)
        await expectFieldHasError(
          page.getByLabel(/confirm email/i),
          /confirm/i
        );

        // Should still be on step 1
        await expect(
          page.getByRole('heading', { name: /step 1: account setup/i })
        ).toBeVisible();
      });
    });
  });

  test.describe('Step 2: Profile Information', () => {
    // The beforeEach navigation through step 1 can be flaky in parallel execution
    // due to resource contention and async validation timing. Adding retries to handle this.
    test.describe.configure({ retries: 2 });

    test.beforeEach(async ({ page }) => {
      // Navigate to step 2 by completing step 1
      await fillAndBlur(page.getByLabel(/email address/i), 'test@example.com');
      await fillAndBlur(page.getByLabel(/confirm email/i), 'test@example.com');
      await fillAndBlur(
        page.getByRole('textbox', { name: 'Password', exact: true }),
        'SecurePass123!'
      );
      await fillAndBlur(
        page.getByRole('textbox', { name: 'Confirm Password', exact: true }),
        'SecurePass123!'
      );

      // Wait for all validations to settle (debounced validations)
      await waitForValidationsToSettle(page);

      // Ensure step 1 validity is computed before submitting
      await waitForSidebarStepValidity(page, 'Step 1: Account', 'Valid');

      await clickNext(page);

      // Verify we're on step 2 (with extended timeout for parallel test runs)
      await expect(
        page.getByRole('heading', { name: /profile information/i })
      ).toBeVisible({ timeout: 15000 });
    });

    test('should validate required profile fields', async ({ page }) => {
      await test.step('Verify firstName and lastName show errors on blur', async () => {
        const firstName = page.getByLabel(/first name/i);
        const lastName = page.getByLabel(/last name/i);

        await firstName.focus();
        await firstName.blur();
        await expectFieldHasError(firstName, /required/i);

        await lastName.focus();
        await lastName.blur();
        await expectFieldHasError(lastName, /required/i);
      });

      await test.step('Verify phone number shows error on blur', async () => {
        const phone = page.getByLabel(/phone number/i);

        await phone.focus();
        await phone.blur();
        await expectFieldHasError(phone, /required/i);
      });

      await test.step('Verify date of birth shows error on blur', async () => {
        const dateOfBirth = page.getByLabel(/date of birth/i);

        await dateOfBirth.focus();
        await dateOfBirth.blur();
        await expectFieldHasError(dateOfBirth, /required/i);
      });
    });

    test('should validate phone number format', async ({ page }) => {
      await test.step('Invalid phone format shows error', async () => {
        const phone = page.getByLabel(/phone number/i);
        await fillAndBlur(phone, '123'); // Too short
        await expectFieldHasError(phone, /valid phone/i);
      });

      await test.step('Valid phone format clears error', async () => {
        const phone = page.getByLabel(/phone number/i);
        await fillAndBlur(phone, '123-456-7890');
        await expectFieldValid(phone);
      });
    });

    test('should validate conditional newsletter frequency', async ({
      page,
    }) => {
      await test.step('Newsletter frequency not required when checkbox unchecked', async () => {
        const newsletterCheckbox = page.getByLabel(/subscribe.*newsletter/i);
        const frequencyField = page.getByRole('combobox', {
          name: /newsletter frequency/i,
        });

        // Initially unchecked
        await expectUnchecked(newsletterCheckbox);

        // Frequency field should not be visible (conditionally rendered)
        await expect(frequencyField).toBeHidden();
      });

      await test.step('Newsletter frequency required when checkbox checked', async () => {
        const newsletterCheckbox = page.getByLabel(/subscribe.*newsletter/i);
        const frequencyField = page.getByRole('combobox', {
          name: /newsletter frequency/i,
        });

        // Check newsletter subscription
        await newsletterCheckbox.check();
        await expectChecked(newsletterCheckbox);

        // Frequency field should be visible and enabled
        await expect(frequencyField).toBeVisible();

        await frequencyField.focus();
        await frequencyField.blur();
        await expectFieldHasError(
          frequencyField,
          /please select newsletter frequency/i
        );
      });

      await test.step('Unchecking newsletter should hide frequency field', async () => {
        const newsletterCheckbox = page.getByLabel(/subscribe.*newsletter/i);
        const frequencyField = page.getByRole('combobox', {
          name: /newsletter frequency/i,
        });

        // Check then uncheck
        await newsletterCheckbox.check();
        await expect(frequencyField).toBeVisible();

        await newsletterCheckbox.uncheck();
        await expectUnchecked(newsletterCheckbox);
        await expect(frequencyField).toBeHidden();
      });
    });

    test('should navigate back to step 1 using previous button', async ({
      page,
    }) => {
      await test.step('Click previous and verify step 1 is shown', async () => {
        await clickPrevious(page);

        // Should navigate back to step 1
        await expect(
          page.getByRole('heading', { name: /step 1: account setup/i })
        ).toBeVisible();

        // Step 1 data should be preserved
        const emailField = page.getByLabel(/email address/i);
        await expect(emailField).toHaveValue('test@example.com');
      });
    });

    test('should navigate to step 3 when step 2 is valid', async ({ page }) => {
      // Mark as slow test - parallel execution with 4 workers causes severe resource contention
      test.slow();

      await test.step('Fill all step 2 fields and submit', async () => {
        await fillAndBlur(page.getByLabel(/first name/i), 'John');
        await fillAndBlur(page.getByLabel(/last name/i), 'Doe');
        await fillAndBlur(page.getByLabel(/phone number/i), '123-456-7890');
        await fillAndBlur(page.getByLabel(/date of birth/i), '1990-01-15');

        // Wait for async validations to settle before clicking Next
        await waitForValidationsToSettle(page);

        // Verify all step 2 fields are valid before proceeding
        await expectFieldValid(page.getByLabel(/first name/i));
        await expectFieldValid(page.getByLabel(/last name/i));
        await expectFieldValid(page.getByLabel(/phone number/i));
        await expectFieldValid(page.getByLabel(/date of birth/i));

        // Note: Sidebar validity depends on validChange output timing which can lag behind
        // actual form validity. Field validity checks above confirm the form IS valid.

        // Submit step 2
        await clickNext(page);

        // Should navigate to step 3 (with extended timeout for parallel test runs)
        // Using 45s timeout because test.slow() triples this from 90s default
        await expect(
          page.getByRole('heading', { name: /review.*confirm/i })
        ).toBeVisible({ timeout: 45000 });
      });
    });
  });

  test.describe('Step 3: Review & Confirmation', () => {
    // The beforeEach navigation through steps 1 & 2 can be flaky in parallel execution
    // due to resource contention and async validation timing. Adding retries to handle this.
    test.describe.configure({ retries: 2 });

    test.beforeEach(async ({ page }) => {
      // Complete steps 1 and 2
      // Step 1
      await fillAndBlur(page.getByLabel(/email address/i), 'john@example.com');
      await fillAndBlur(page.getByLabel(/confirm email/i), 'john@example.com');
      await fillAndBlur(
        page.getByRole('textbox', { name: 'Password', exact: true }),
        'SecurePass123!'
      );
      await fillAndBlur(
        page.getByRole('textbox', { name: 'Confirm Password', exact: true }),
        'SecurePass123!'
      );

      // Wait for async validations to settle first, then check sidebar
      await waitForValidationsToSettle(page);
      await waitForSidebarStepValidity(page, 'Step 1: Account', 'Valid');

      await clickNext(page);

      // Wait for step 2 heading (with extended timeout for parallel test runs)
      await expect(
        page.getByRole('heading', { name: /profile information/i })
      ).toBeVisible({ timeout: 30000 });

      // Step 2: Fill all required fields
      await fillAndBlur(page.getByLabel(/first name/i), 'John');
      await fillAndBlur(page.getByLabel(/last name/i), 'Doe');
      await fillAndBlur(page.getByLabel(/phone number/i), '123-456-7890');
      await fillAndBlur(page.getByLabel(/date of birth/i), '1990-01-15');

      // Wait for async validations to complete
      await waitForValidationsToSettle(page);
      await expectFieldValid(page.getByLabel(/first name/i));
      await expectFieldValid(page.getByLabel(/last name/i));
      await expectFieldValid(page.getByLabel(/phone number/i));
      await expectFieldValid(page.getByLabel(/date of birth/i));

      // Note: Sidebar validity depends on validChange output timing which can lag behind
      // actual form validity. Field validity checks above confirm the form IS valid.

      await clickNext(page);

      // Verify we're on step 3 (with extended timeout for parallel test runs)
      await expect(
        page.getByRole('heading', { name: /review.*confirm/i })
      ).toBeVisible({ timeout: 30000 });
    });

    test('should display summary of previous steps', async ({ page }) => {
      await test.step('Verify step 1 data is summarized', async () => {
        // Look for email in summary (exact check depends on template)
        await expect(page.getByText(/john@example\.com/i)).toBeVisible();
      });
    });

    // This test is flaky in parallel execution due to navigation timing
    // Adding retry to handle occasional timeout in beforeEach setup
    test('should validate required terms and privacy checkboxes', async ({
      page,
    }) => {
      await test.step('Submit button is always enabled (a11y best practice)', async () => {
        const termsCheckbox = page.getByLabel(/accept.*terms/i);
        const privacyCheckbox = page.getByLabel(/accept.*privacy/i);

        await expectUnchecked(termsCheckbox);
        await expectUnchecked(privacyCheckbox);

        // Submit All button is always enabled (not disabled based on validity)
        // This is a11y best practice: users can click to see validation errors
        const submitButton = page.getByRole('button', { name: /submit all/i });
        await expect(submitButton).toBeEnabled();
      });

      await test.step('Click Submit All shows validation errors for unchecked fields', async () => {
        const submitButton = page.getByRole('button', { name: /submit all/i });
        await submitButton.click();

        // Error message should appear at form level
        await expect(
          page.getByText(/please complete all steps/i)
        ).toBeVisible();

        // Field-level validation errors should also appear (fields are now touched)
        await expect(
          page.getByText(/you must accept the terms/i)
        ).toBeVisible();
        await expect(
          page.getByText(/you must accept the privacy policy/i)
        ).toBeVisible();
      });

      await test.step('Check both checkboxes clears errors', async () => {
        const termsCheckbox = page.getByLabel(/accept.*terms/i);
        const privacyCheckbox = page.getByLabel(/accept.*privacy/i);

        await termsCheckbox.check();
        await privacyCheckbox.check();

        await expectChecked(termsCheckbox);
        await expectChecked(privacyCheckbox);

        // Validation errors should be gone
        await expect(
          page.getByText(/you must accept the terms/i)
        ).not.toBeVisible();
        await expect(
          page.getByText(/you must accept the privacy policy/i)
        ).not.toBeVisible();

        // Submit All button remains enabled
        const submitButton = page.getByRole('button', { name: /submit all/i });
        await expect(submitButton).toBeEnabled();
      });
    });

    test('should allow editing previous steps via summary cards', async ({
      page,
    }) => {
      await test.step('Click edit link to go back to step 1', async () => {
        // The Account Details card is the first one on the review page
        // Use first() to avoid strict mode violation since both cards have Edit buttons
        const editAccountLink = page
          .getByRole('button', { name: /edit/i })
          .first();

        await editAccountLink.click();

        // Should navigate back to step 1
        await expect(
          page.getByRole('heading', { name: /step 1: account setup/i })
        ).toBeVisible();
      });
    });
  });

  test.describe('Final Submit - All Forms Validation', () => {
    // These tests navigate through multiple steps which can be flaky in parallel execution
    test.describe.configure({ retries: 2 });

    test('CRITICAL: Submit All triggers validation on ALL forms', async ({
      page,
    }) => {
      await test.step('Complete step 1 and step 2 fully, leave step 3 incomplete', async () => {
        // Fill step 1 completely
        await fillAndBlur(
          page.getByLabel(/email address/i),
          'test@example.com'
        );
        await fillAndBlur(
          page.getByLabel(/confirm email/i),
          'test@example.com'
        );
        await fillAndBlur(
          page.getByRole('textbox', { name: 'Password', exact: true }),
          'SecurePass123!'
        );
        await fillAndBlur(
          page.getByRole('textbox', { name: 'Confirm Password', exact: true }),
          'SecurePass123!'
        );

        // Wait for validations to settle before navigating
        await waitForValidationsToSettle(page);

        await clickNext(page);

        // Wait for step 2 heading (extended timeout for parallel tests)
        await expect(
          page.getByRole('heading', { name: /profile information/i })
        ).toBeVisible({ timeout: 30000 });

        // Fill step 2 completely
        await fillAndBlur(page.getByLabel(/first name/i), 'John');
        await fillAndBlur(page.getByLabel(/last name/i), 'Doe');
        await fillAndBlur(page.getByLabel(/phone number/i), '123-456-7890');
        await fillAndBlur(page.getByLabel(/date of birth/i), '1990-01-15');

        // Wait for validations to settle before navigating
        await waitForValidationsToSettle(page);

        await expectFieldValid(page.getByLabel(/first name/i));
        await expectFieldValid(page.getByLabel(/last name/i));
        await expectFieldValid(page.getByLabel(/phone number/i));
        await expectFieldValid(page.getByLabel(/date of birth/i));

        await clickNext(page);

        // Wait for step 3 heading to appear (extended timeout for parallel tests)
        await expect(
          page.getByRole('heading', { name: /review.*confirm/i })
        ).toBeVisible({ timeout: 30000 });

        // On step 3, check only terms (not privacy) - form is incomplete
        await page.getByLabel(/accept.*terms/i).check();
        // Leave privacy unchecked

        // Submit All button is enabled (a11y: never disable based on validity)
        const submitButton = page.getByRole('button', { name: /submit all/i });
        await expect(submitButton).toBeEnabled();

        // Click submit to trigger validation
        await submitButton.click();

        // Should show error about incomplete steps
        await expect(
          page.getByText(/please complete all steps/i)
        ).toBeVisible();

        // Field-level validation error should appear for unchecked privacy checkbox
        await expect(
          page.getByText(/you must accept the privacy policy/i)
        ).toBeVisible();
      });
    });

    test('CRITICAL: Submit All with invalid step 1 navigates to step 1', async ({
      page,
    }) => {
      await test.step('Complete all steps, then break step 1, and submit', async () => {
        // Fill step 1 correctly
        await fillAndBlur(
          page.getByLabel(/email address/i),
          'test@example.com'
        );
        await fillAndBlur(
          page.getByLabel(/confirm email/i),
          'test@example.com'
        );
        await fillAndBlur(
          page.getByRole('textbox', { name: 'Password', exact: true }),
          'SecurePass123!'
        );
        await fillAndBlur(
          page.getByRole('textbox', { name: 'Confirm Password', exact: true }),
          'SecurePass123!'
        );

        // Wait for async validations to complete
        await waitForValidationsToSettle(page);

        // Verify all step 1 fields are valid before checking sidebar
        await expectFieldValid(page.getByLabel(/email address/i));
        await expectFieldValid(page.getByLabel(/confirm email/i));
        await expectFieldValid(
          page.getByRole('textbox', { name: 'Password', exact: true })
        );
        await expectFieldValid(
          page.getByRole('textbox', { name: 'Confirm Password', exact: true })
        );

        await waitForSidebarStepValidity(page, 'Step 1: Account', 'Valid');

        await clickNext(page);

        // Wait for step 2 heading (with extended timeout for parallel test runs)
        await expect(
          page.getByRole('heading', { name: /profile information/i })
        ).toBeVisible({ timeout: 20000 });

        // Fill step 2 completely
        await fillAndBlur(page.getByLabel(/first name/i), 'John');
        await fillAndBlur(page.getByLabel(/last name/i), 'Doe');
        await fillAndBlur(page.getByLabel(/phone number/i), '123-456-7890');
        await fillAndBlur(page.getByLabel(/date of birth/i), '1990-01-15');

        // Wait for async validations to complete
        await waitForValidationsToSettle(page);

        // Verify all step 2 fields are valid before proceeding
        await expectFieldValid(page.getByLabel(/first name/i));
        await expectFieldValid(page.getByLabel(/last name/i));
        await expectFieldValid(page.getByLabel(/phone number/i));
        await expectFieldValid(page.getByLabel(/date of birth/i));

        // Note: Sidebar validity depends on validChange output timing which can lag behind
        // actual form validity. Field validity checks above confirm the form IS valid.
        await clickNext(page);

        // Wait for step 3 heading (with extended timeout for parallel test runs)
        await expect(
          page.getByRole('heading', { name: /review.*confirm/i })
        ).toBeVisible({ timeout: 20000 });

        // Fill step 3 completely
        await page.getByLabel(/accept.*terms/i).check();
        await page.getByLabel(/accept.*privacy/i).check();

        // Now go back to step 1 and break the email confirmation
        await clickPrevious(page);
        await expect(
          page.getByRole('heading', { name: /profile information/i })
        ).toBeVisible({ timeout: 20_000 });
        await clickPrevious(page);

        await expect(
          page.getByRole('heading', { name: /step 1: account setup/i })
        ).toBeVisible({ timeout: 20_000 });

        // Break email confirmation (mismatch)
        const emailField = page.getByLabel(/email address/i);
        await expect(emailField).toHaveValue('test@example.com');
        
        await fillAndBlur(
          page.getByLabel(/confirm email/i),
          'broken@example.com'
        );

        // Wait for validation to process the change
        await waitForValidationsToSettle(page);

        // Save & Continue button is always enabled (a11y)
        const nextButton = page.getByRole('button', {
          name: /save & continue/i,
        });
        await expect(nextButton).toBeEnabled();

        // Click to trigger validation - should show error
        await nextButton.click();

        // Wait for validation triggered by submit
        await waitForValidationsToSettle(page);

        // Confirm email should show error
        const confirmEmail = page.getByLabel(/confirm email/i);
        await expect(confirmEmail).toBeVisible();
        await expectFieldHasError(confirmEmail, /must match/i);

        // Should still be on step 1 (didn't navigate because form invalid)
        await expect(
          page.getByRole('heading', { name: /step 1: account setup/i })
        ).toBeVisible();
      });
    });

    test('CRITICAL: Successful submission with all valid forms', async ({
      page,
    }) => {
      await test.step('Complete all steps and submit successfully', async () => {
        // Step 1: Account
        await fillAndBlur(
          page.getByLabel(/email address/i),
          'john@example.com'
        );
        await fillAndBlur(
          page.getByLabel(/confirm email/i),
          'john@example.com'
        );
        await fillAndBlur(
          page.getByRole('textbox', { name: 'Password', exact: true }),
          'SecurePass123!'
        );
        await fillAndBlur(
          page.getByRole('textbox', { name: 'Confirm Password', exact: true }),
          'SecurePass123!'
        );

        // Wait for async validations to complete
        await waitForValidationsToSettle(page);

        // Verify all step 1 fields are valid before checking sidebar
        await expectFieldValid(page.getByLabel(/email address/i));
        await expectFieldValid(page.getByLabel(/confirm email/i));
        await expectFieldValid(
          page.getByRole('textbox', { name: 'Password', exact: true })
        );
        await expectFieldValid(
          page.getByRole('textbox', { name: 'Confirm Password', exact: true })
        );

        // Wait for step 1 to become valid before navigating
        await waitForSidebarStepValidity(page, 'Step 1: Account', 'Valid');

        await clickNext(page);

        // Wait for step 2 heading (with extended timeout for parallel test runs)
        await expect(
          page.getByRole('heading', { name: /profile information/i })
        ).toBeVisible({ timeout: 30000 });

        // Step 2: Profile
        await fillAndBlur(page.getByLabel(/first name/i), 'John');
        await fillAndBlur(page.getByLabel(/last name/i), 'Doe');
        await fillAndBlur(page.getByLabel(/phone number/i), '123-456-7890');
        await fillAndBlur(page.getByLabel(/date of birth/i), '1990-01-15');

        // Wait for async validations to complete
        await waitForValidationsToSettle(page);

        // Verify all step 2 fields are valid before checking sidebar
        await expectFieldValid(page.getByLabel(/first name/i));
        await expectFieldValid(page.getByLabel(/last name/i));
        await expectFieldValid(page.getByLabel(/phone number/i));
        await expectFieldValid(page.getByLabel(/date of birth/i));

        // Note: Sidebar validity depends on validChange output timing which can lag behind
        // actual form validity. Field validity checks above confirm the form IS valid.
        await clickNext(page);

        // Wait for step 3 heading (with extended timeout for parallel test runs)
        await expect(
          page.getByRole('heading', { name: /review.*confirm/i })
        ).toBeVisible({ timeout: 30000 });

        // Step 3: Review
        await page.getByLabel(/accept.*terms/i).check();
        await page.getByLabel(/accept.*privacy/i).check();

        // Submit All
        await clickSubmitAll(page);

        // Should show success message
        await expect(page.getByText(/registration complete/i)).toBeVisible({
          timeout: 3000,
        }); // Wait for API simulation
      });
    });

    test('CRITICAL: markAllAsTouched shows errors on all untouched fields', async ({
      page,
    }) => {
      await test.step('Navigate to step 2 and click Save & Continue to show all errors', async () => {
        // Fill step 1 completely
        await fillAndBlur(
          page.getByLabel(/email address/i),
          'test@example.com'
        );
        await fillAndBlur(
          page.getByLabel(/confirm email/i),
          'test@example.com'
        );
        await fillAndBlur(
          page.getByRole('textbox', { name: 'Password', exact: true }),
          'SecurePass123!'
        );
        await fillAndBlur(
          page.getByRole('textbox', { name: 'Confirm Password', exact: true }),
          'SecurePass123!'
        );
        await waitForValidationsToSettle(page);
        await waitForSidebarStepValidity(page, 'Step 1: Account', 'Valid');

        await clickNext(page);

        // Wait for step 2 heading with explicit timeout for navigation transition
        await expect(
          page.getByRole('heading', { name: /profile information/i })
        ).toBeVisible({ timeout: 15000 });

        // On Step 2: Touch firstName only, leave others untouched
        await fillAndBlur(page.getByLabel(/first name/i), 'John');

        // Save & Continue button is always enabled (a11y)
        const nextButton = page.getByRole('button', {
          name: /save & continue/i,
        });
        await expect(nextButton).toBeEnabled();

        // Click to trigger validation on ALL fields (markAllAsTouched)
        await nextButton.click();

        // All required fields should now show errors (even untouched ones)
        const lastName = page.getByLabel(/last name/i);
        await expectFieldHasError(lastName, /required/i);

        const phone = page.getByLabel(/phone number/i);
        await expectFieldHasError(phone, /required/i);

        const dateOfBirth = page.getByLabel(/date of birth/i);
        await expectFieldHasError(dateOfBirth, /required/i);
      });
    });
  });

  test.describe('Wizard Navigation & State Persistence', () => {
    // This section can be flaky due to navigation timing in parallel execution
    test.describe.configure({ retries: 2 });

    test('should persist data when navigating back and forth', async ({
      page,
    }) => {
      await test.step('Fill step 1, navigate to step 2, go back, verify data persists', async () => {
        // Fill step 1
        await fillAndBlur(
          page.getByLabel(/email address/i),
          'persist@example.com'
        );
        await fillAndBlur(
          page.getByLabel(/confirm email/i),
          'persist@example.com'
        );
        await fillAndBlur(
          page.getByRole('textbox', { name: 'Password', exact: true }),
          'Persist123!'
        );
        await fillAndBlur(
          page.getByRole('textbox', { name: 'Confirm Password', exact: true }),
          'Persist123!'
        );

        await waitForValidationsToSettle(page);
        await expectFieldValid(page.getByLabel(/email address/i));
        await expectFieldValid(page.getByLabel(/confirm email/i));
        await expectFieldValid(
          page.getByRole('textbox', { name: 'Password', exact: true })
        );
        await expectFieldValid(
          page.getByRole('textbox', { name: 'Confirm Password', exact: true })
        );

        // Wait for step 1 to be valid before navigating
        await waitForValidationsToSettle(page);

        await clickNext(page);

        // Now on step 2 (extended timeout for parallel test runs)
        await expect(
          page.getByRole('heading', { name: /profile information/i })
        ).toBeVisible({ timeout: 30000 });

        // Go back to step 1
        await clickPrevious(page);

        // Verify data is still there
        await expect(page.getByLabel(/email address/i)).toHaveValue(
          'persist@example.com'
        );
        await expect(page.getByLabel(/confirm email/i)).toHaveValue(
          'persist@example.com'
        );
      });
    });

    test('should track completed steps via step indicator UI', async ({
      page,
    }) => {
      await test.step('Complete step 1 and verify step indicator shows checkmark', async () => {
        // Fill and submit step 1
        await fillAndBlur(
          page.getByLabel(/email address/i),
          'test@example.com'
        );
        await fillAndBlur(
          page.getByLabel(/confirm email/i),
          'test@example.com'
        );
        await fillAndBlur(
          page.getByRole('textbox', { name: 'Password', exact: true }),
          'SecurePass123!'
        );
        await fillAndBlur(
          page.getByRole('textbox', { name: 'Confirm Password', exact: true }),
          'SecurePass123!'
        );
        await clickNext(page);

        // Wait for step 2 heading
        await expect(
          page.getByRole('heading', { name: /profile information/i })
        ).toBeVisible();

        // After navigating to step 2, step 1 should show completed state
        // The wizard-steps component shows a checkmark SVG for completed steps
        // and applies blue background color (bg-blue-600) to completed steps
        const step1Circle = page
          .locator('ngx-wizard-steps li')
          .first()
          .locator('span')
          .first();

        // Completed steps have bg-blue-600 class and show checkmark
        await expect(step1Circle).toHaveClass(/bg-blue-600/);
        await expect(step1Circle.locator('svg')).toBeVisible();
      });

      await test.step('Current step (step 2) has aria-current attribute', async () => {
        // The current step indicator has aria-current="step"
        const step2Circle = page
          .locator('ngx-wizard-steps li')
          .nth(1)
          .locator('[aria-current="step"]');
        await expect(step2Circle).toBeVisible();
      });
    });
  });

  test.describe('Accessibility & ARIA', () => {
    test('should have proper ARIA attributes on form controls', async ({
      page,
    }) => {
      await test.step('Verify invalid fields have aria-invalid', async () => {
        const emailField = page.getByLabel(/email address/i);

        // Trigger validation
        await emailField.focus();
        await emailField.blur();

        // Should have aria-invalid after validation
        await expect(emailField).toHaveAttribute('aria-invalid', 'true', {
          timeout: 2000,
        });
      });
    });

    test('should associate error messages with fields via aria-describedby', async ({
      page,
    }) => {
      await test.step('Verify error messages are properly linked', async () => {
        const emailField = page.getByLabel(/email address/i);

        // Trigger validation
        await emailField.focus();
        await emailField.blur();

        // Wait for error to appear
        await expectFieldHasError(emailField, /required/i);

        // Verify aria-describedby exists and points to error
        const describedBy = await emailField.getAttribute('aria-describedby');
        expect(describedBy).toBeTruthy();

        if (describedBy) {
          const errorElement = page.locator(`#${describedBy}`);
          await expect(errorElement).toBeVisible();
          await expect(errorElement).toContainText(/required/i);
        }
      });
    });

    test('should have accessible wizard step indicators', async ({ page }) => {
      await test.step('Verify wizard steps have proper accessibility structure', async () => {
        // Verify the wizard steps navigation has proper list structure with dynamic aria-label
        const wizardSteps = page.locator('ngx-wizard-steps nav');
        await expect(wizardSteps).toMatchAriaSnapshot(`
          - 'navigation "Progress: Step 1 of 3"':
            - list:
              - listitem:
                - 'img "Step 1: Account - Current step"'
              - listitem:
                - 'img "Step 2: Profile - Not started"'
              - listitem:
                - 'img "Step 3: Review - Not started"'
        `);
      });

      await test.step('Current step should have aria-current attribute', async () => {
        // The current step indicator should have aria-current="step"
        const currentStep = page.locator('[aria-current="step"]');
        await expect(currentStep).toBeVisible();
      });
    });

    test('should show validation errors in accessible format', async ({
      page,
    }) => {
      await test.step('Submit empty form and verify error accessibility', async () => {
        // Click next to trigger validation on all fields
        await page.getByRole('button', { name: /save & continue/i }).click();

        // Wait for validation to complete
        await expect(page.getByText('Validating…')).toHaveCount(0, {
          timeout: 5000,
        });

        // Verify email field has proper error structure
        const emailField = page.getByLabel(/email address/i);
        await expect(emailField).toHaveAttribute('aria-invalid', 'true');

        // Error should be associated via aria-describedby
        const describedBy = await emailField.getAttribute('aria-describedby');
        expect(describedBy).toBeTruthy();
      });
    });
  });
});
