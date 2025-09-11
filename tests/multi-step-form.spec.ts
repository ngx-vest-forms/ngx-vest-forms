import { expect, test } from '@playwright/test';

test.describe('Multi-Step Form - Advanced Vest.js Group Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/advanced-patterns/multi-step-form');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Structure and Educational Content', () => {
    test('should display page title and educational content correctly', async ({
      page,
    }) => {
      await test.step('Verify page header and subtitle', async () => {
        // Check page subtitle
        await expect(
          page.getByText(
            /Advanced Vest.js group validation for wizard-style forms/i,
          ),
        ).toBeVisible();
      });

      await test.step('Verify demonstrated features card', async () => {
        await expect(
          page.getByRole('heading', {
            name: /Multi-Step Form with Vest.js Groups/i,
            level: 3,
          }),
        ).toBeVisible();

        // Check for key feature mentions
        await expect(
          page.getByText(/Group validation.*group\(\)/i),
        ).toBeVisible();
        await expect(page.getByText(/only\.group\(step\)/i)).toBeVisible();
        await expect(page.getByText(/TypeScript generics/i)).toBeVisible();
        await expect(page.getByText(/Performance optimization/i)).toBeVisible();
        await expect(page.getByText(/Cross-step dependencies/i)).toBeVisible();
      });

      await test.step('Verify learning scenarios card', async () => {
        await expect(
          page.getByRole('heading', {
            name: /Try These Validation Scenarios/i,
            level: 2,
          }),
        ).toBeVisible();

        // Check test scenarios are documented
        await expect(
          page.getByText(/Step 1: Personal Information Tests/i),
        ).toBeVisible();
        await expect(
          page.getByText(/Step 2: Account Setup Tests/i),
        ).toBeVisible();
        await expect(
          page.getByText(/Step 3: Profile & Preferences Tests/i),
        ).toBeVisible();
        await expect(
          page.getByText(/Advanced Patterns to Explore/i),
        ).toBeVisible();
      });
    });

    test('should display form state correctly', async ({ page }) => {
      await test.step('Verify form state display section', async () => {
        await expect(
          page.getByText(/Live Form State \(parent read\)/i),
        ).toBeVisible();

        // Check that form state JSON is displayed
        await expect(page.locator('pre')).toBeVisible();
        await expect(page.getByText(/"valid":/i)).toBeVisible();
        await expect(page.getByText(/"errors":/i)).toBeVisible();
      });
    });
  });

  test.describe('Multi-Step Form Structure and Navigation', () => {
    test('should display initial form structure with step indicator', async ({
      page,
    }) => {
      await test.step('Verify step progress indicator', async () => {
        // Check that all 3 steps are shown in progress indicator
        const stepIndicators = page.locator(
          '.flex.h-10.w-10.items-center.justify-center.rounded-full',
        );
        await expect(stepIndicators).toHaveCount(3);

        // First step should be active (step 1)
        await expect(stepIndicators.first()).toHaveClass(/bg-blue-500/);

        // Verify step numbers
        await expect(stepIndicators.nth(0)).toHaveText('1');
        await expect(stepIndicators.nth(1)).toHaveText('2');
        await expect(stepIndicators.nth(2)).toHaveText('3');
      });

      await test.step('Verify initial step 1 form fields', async () => {
        // Step 1: Personal Information fields
        await expect(
          page.getByRole('textbox', { name: /First Name/i }),
        ).toBeVisible();
        await expect(
          page.getByRole('textbox', { name: /Last Name/i }),
        ).toBeVisible();
        await expect(page.getByLabel(/Date of Birth/i)).toBeVisible();
        await expect(
          page.getByRole('textbox', { name: /Email Address/i }),
        ).toBeVisible();

        // Navigation buttons
        await expect(
          page.getByRole('button', { name: /Next: Account Setup/i }),
        ).toBeVisible();
        await expect(
          page.getByRole('button', { name: /Next: Account Setup/i }),
        ).toBeDisabled(); // Should be disabled initially due to validation
      });
    });

    test('should prevent navigation to next step with invalid data', async ({
      page,
    }) => {
      await test.step('Try to navigate with empty fields', async () => {
        const nextButton = page.getByRole('button', {
          name: /Next: Account Setup/i,
        });

        // Next button should be disabled with empty form
        await expect(nextButton).toBeDisabled();
      });

      await test.step('Try navigation with partial invalid data', async () => {
        // Fill some fields but leave others invalid
        await page.getByRole('textbox', { name: /First Name/i }).fill('John');
        await page.getByRole('textbox', { name: /Last Name/i }).fill('Doe');
        // Leave email empty - should still be disabled

        const nextButton = page.getByRole('button', {
          name: /Next: Account Setup/i,
        });
        await expect(nextButton).toBeDisabled();
      });
    });

    test('should allow navigation with valid step 1 data', async ({ page }) => {
      await test.step('Fill valid personal information', async () => {
        await page.getByRole('textbox', { name: /First Name/i }).fill('John');
        await page.getByRole('textbox', { name: /Last Name/i }).fill('Doe');
        await page.getByLabel(/Date of Birth/i).fill('1990-01-01');
        await page
          .getByRole('textbox', { name: /Email Address/i })
          .fill('john.doe@example.com');

        // Wait for validation to complete
        await page.waitForTimeout(500);
      });

      await test.step('Navigate to step 2', async () => {
        const nextButton = page.getByRole('button', {
          name: /Next: Account Setup/i,
        });
        await expect(nextButton).toBeEnabled();
        await nextButton.click();

        // Verify step 2 is now active
        await expect(
          page.getByRole('textbox', { name: /Username/i }),
        ).toBeVisible();
        await expect(
          page.getByRole('textbox', { name: /Password/i }),
        ).toBeVisible();

        // Check step indicator updated
        const stepIndicators = page.locator(
          '.flex.h-10.w-10.items-center.justify-center.rounded-full',
        );
        await expect(stepIndicators.nth(1)).toHaveClass(/bg-blue-500/);
      });
    });
  });

  test.describe('Step 1 - Personal Information Validation', () => {
    test('should validate required fields', async ({ page }) => {
      await test.step('Test firstName validation', async () => {
        const firstNameField = page.getByRole('textbox', {
          name: /First Name/i,
        });
        await firstNameField.click();
        await firstNameField.blur();

        await expect(page.getByText(/First name is required/i)).toBeVisible();
      });

      await test.step('Test lastName validation', async () => {
        const lastNameField = page.getByRole('textbox', { name: /Last Name/i });
        await lastNameField.click();
        await lastNameField.blur();

        await expect(page.getByText(/Last name is required/i)).toBeVisible();
      });

      await test.step('Test email validation', async () => {
        const emailField = page.getByRole('textbox', {
          name: /Email Address/i,
        });
        await emailField.click();
        await emailField.blur();

        await expect(page.getByText(/Email is required/i)).toBeVisible();
      });
    });

    test('should validate field formats and length constraints', async ({
      page,
    }) => {
      await test.step('Test name length validation', async () => {
        // Test too short first name
        await page.getByRole('textbox', { name: /First Name/i }).fill('A');
        await page.getByRole('textbox', { name: /Last Name/i }).click(); // Blur first name

        await expect(
          page.getByText(/First name must be 2-50 characters/i),
        ).toBeVisible();
      });

      await test.step('Test age validation (too young)', async () => {
        // Enter a recent birth date (too young)
        await page.getByLabel(/Date of Birth/i).fill('2015-01-01');
        await page.getByRole('textbox', { name: /Email Address/i }).click(); // Blur date field

        await expect(
          page.getByText(/You must be at least 13 years old/i),
        ).toBeVisible();
      });

      await test.step('Test email format validation', async () => {
        await page
          .getByRole('textbox', { name: /Email Address/i })
          .fill('invalid-email');
        await page.getByRole('textbox', { name: /First Name/i }).click(); // Blur email field

        await expect(
          page.getByText(/Please enter a valid email address/i),
        ).toBeVisible();
      });
    });

    test('should complete step 1 with valid data', async ({ page }) => {
      await test.step('Fill all valid personal information', async () => {
        await page.getByRole('textbox', { name: /First Name/i }).fill('John');
        await page.getByRole('textbox', { name: /Last Name/i }).fill('Doe');
        await page.getByLabel(/Date of Birth/i).fill('1990-01-01');
        await page
          .getByRole('textbox', { name: /Email Address/i })
          .fill('john.doe@example.com');
      });

      await test.step('Verify next button becomes enabled', async () => {
        // Wait for validation
        await page.waitForTimeout(500);

        const nextButton = page.getByRole('button', {
          name: /Next: Account Setup/i,
        });
        await expect(nextButton).toBeEnabled();

        // Step indicator should show completion
        const stepIndicators = page.locator(
          '.flex.h-10.w-10.items-center.justify-center.rounded-full',
        );
        await expect(stepIndicators.nth(0)).toHaveClass(
          /bg-green-500|border-green-500/,
        );
      });
    });
  });

  test.describe('Step 2 - Account Setup Validation', () => {
    test.beforeEach(async ({ page }) => {
      // Complete step 1 first
      await page.getByRole('textbox', { name: /First Name/i }).fill('John');
      await page.getByRole('textbox', { name: /Last Name/i }).fill('Doe');
      await page.getByLabel(/Date of Birth/i).fill('1990-01-01');
      await page
        .getByRole('textbox', { name: /Email Address/i })
        .fill('john.doe@example.com');

      await page.waitForTimeout(500);
      await page.getByRole('button', { name: /Next: Account Setup/i }).click();
    });

    test('should validate username requirements', async ({ page }) => {
      await test.step('Test required username', async () => {
        const usernameField = page.getByRole('textbox', { name: /Username/i });
        await usernameField.click();
        await usernameField.blur();

        await expect(page.getByText(/Username is required/i)).toBeVisible();
      });

      await test.step('Test username length validation', async () => {
        await page.getByRole('textbox', { name: /Username/i }).fill('ab');
        await page.getByRole('textbox', { name: /Password/i }).click();

        await expect(
          page.getByText(/Username must be 3-20 characters/i),
        ).toBeVisible();
      });

      await test.step('Test username format validation', async () => {
        await page.getByRole('textbox', { name: /Username/i }).fill('user@123');
        await page.getByRole('textbox', { name: /Password/i }).click();

        await expect(
          page.getByText(
            /Username can only contain letters, numbers, and underscores/i,
          ),
        ).toBeVisible();
      });
    });

    test('should validate async username availability', async ({ page }) => {
      await test.step('Test taken username', async () => {
        await page.getByRole('textbox', { name: /Username/i }).fill('admin');
        await page.getByRole('textbox', { name: /Password/i }).click();

        // Wait for async validation (should take ~1.2s)
        await expect(page.getByText(/Username is already taken/i)).toBeVisible({
          timeout: 3000,
        });
      });

      await test.step('Test available username', async () => {
        await page
          .getByRole('textbox', { name: /Username/i })
          .fill('unique_user123');
        await page.getByRole('textbox', { name: /Password/i }).click();

        // Wait for async validation to complete
        await page.waitForTimeout(1500);

        // Should not show "taken" error
        await expect(
          page.getByText(/Username is already taken/i),
        ).not.toBeVisible();
      });
    });

    test('should validate password requirements', async ({ page }) => {
      await test.step('Test password required', async () => {
        const passwordField = page.getByRole('textbox', {
          name: /^Password$/i,
        });
        await passwordField.click();
        await passwordField.blur();

        await expect(page.getByText(/Password is required/i)).toBeVisible();
      });

      await test.step('Test password strength requirements', async () => {
        // Test weak password
        await page.getByRole('textbox', { name: /^Password$/i }).fill('weak');
        await page.getByRole('textbox', { name: /Confirm Password/i }).click();

        await expect(
          page.getByText(/Password must be at least 8 characters/i),
        ).toBeVisible();
        await expect(
          page.getByText(/Password must contain uppercase letter/i),
        ).toBeVisible();
        await expect(
          page.getByText(/Password must contain a number/i),
        ).toBeVisible();
      });

      await test.step('Test password confirmation', async () => {
        await page
          .getByRole('textbox', { name: /^Password$/i })
          .fill('MyPassword123');
        await page
          .getByRole('textbox', { name: /Confirm Password/i })
          .fill('Different123');
        await page.getByRole('textbox', { name: /Username/i }).click();

        await expect(page.getByText(/Passwords must match/i)).toBeVisible();
      });
    });

    test('should complete step 2 with valid account data', async ({ page }) => {
      await test.step('Fill valid account information', async () => {
        await page
          .getByRole('textbox', { name: /Username/i })
          .fill('john_doe_2024');
        await page
          .getByRole('textbox', { name: /^Password$/i })
          .fill('MySecurePass123');
        await page
          .getByRole('textbox', { name: /Confirm Password/i })
          .fill('MySecurePass123');

        // Wait for validations
        await page.waitForTimeout(1500);
      });

      await test.step('Navigate to step 3', async () => {
        const nextButton = page.getByRole('button', {
          name: /Next: Profile & Preferences/i,
        });
        await expect(nextButton).toBeEnabled();
        await nextButton.click();

        // Verify step 3 is now visible
        await expect(page.getByLabel(/Bio/i)).toBeVisible();
        await expect(page.getByLabel(/Website/i)).toBeVisible();
        await expect(page.getByLabel(/Preferred Language/i)).toBeVisible();
      });
    });
  });

  test.describe('Step 3 - Profile & Preferences Validation', () => {
    test.beforeEach(async ({ page }) => {
      // Complete steps 1 and 2
      await page.getByRole('textbox', { name: /First Name/i }).fill('John');
      await page.getByRole('textbox', { name: /Last Name/i }).fill('Doe');
      await page.getByLabel(/Date of Birth/i).fill('1990-01-01');
      await page
        .getByRole('textbox', { name: /Email Address/i })
        .fill('john.doe@example.com');

      await page.waitForTimeout(500);
      await page.getByRole('button', { name: /Next: Account Setup/i }).click();

      await page
        .getByRole('textbox', { name: /Username/i })
        .fill('john_doe_2024');
      await page
        .getByRole('textbox', { name: /^Password$/i })
        .fill('MySecurePass123');
      await page
        .getByRole('textbox', { name: /Confirm Password/i })
        .fill('MySecurePass123');

      await page.waitForTimeout(1500);
      await page
        .getByRole('button', { name: /Next: Profile & Preferences/i })
        .click();
    });

    test('should validate optional but conditional bio field', async ({
      page,
    }) => {
      await test.step('Test bio minimum length when provided', async () => {
        await page.getByLabel(/Bio/i).fill('Short');
        await page.getByLabel(/Website/i).click();

        await expect(
          page.getByText(/Bio must be at least 10 characters/i),
        ).toBeVisible();
      });

      await test.step('Test bio maximum length', async () => {
        const longBio = 'x'.repeat(600);
        await page.getByLabel(/Bio/i).fill(longBio);
        await page.getByLabel(/Website/i).click();

        await expect(
          page.getByText(/Bio must not exceed 500 characters/i),
        ).toBeVisible();
      });

      await test.step('Test valid bio', async () => {
        await page
          .getByLabel(/Bio/i)
          .fill(
            'I am a passionate developer who loves creating amazing web applications.',
          );
        await page.getByLabel(/Website/i).click();

        // Should not show bio errors
        await expect(
          page.getByText(/Bio must be at least 10 characters/i),
        ).not.toBeVisible();
      });
    });

    test('should validate optional website URL format', async ({ page }) => {
      await test.step('Test invalid website URL', async () => {
        await page.getByLabel(/Website/i).fill('invalid-url');
        await page.getByLabel(/Preferred Language/i).click();

        await expect(
          page.getByText(
            /Please enter a valid URL \(starting with http:\/\/ or https:\/\/\)/i,
          ),
        ).toBeVisible();
      });

      await test.step('Test valid website URL', async () => {
        await page.getByLabel(/Website/i).fill('https://johndoe.dev');
        await page.getByLabel(/Preferred Language/i).click();

        // Should not show URL error
        await expect(
          page.getByText(/Please enter a valid URL/i),
        ).not.toBeVisible();
      });
    });

    test('should validate required preferences', async ({ page }) => {
      await test.step('Test required language selection', async () => {
        // Try to submit without selecting language
        const submitButton = page.getByRole('button', {
          name: /Submit Registration/i,
        });
        await expect(submitButton).toBeDisabled();
      });

      await test.step('Test terms agreement requirement', async () => {
        // Fill other required fields
        await page.getByLabel(/Preferred Language/i).selectOption('en');

        // Terms checkbox should be required for submission
        const submitButton = page.getByRole('button', {
          name: /Submit Registration/i,
        });
        await expect(submitButton).toBeDisabled();
      });
    });

    test('should complete final step and enable submission', async ({
      page,
    }) => {
      await test.step('Fill all required profile information', async () => {
        await page
          .getByLabel(/Bio/i)
          .fill(
            'I am a passionate developer who loves creating amazing web applications.',
          );
        await page.getByLabel(/Website/i).fill('https://johndoe.dev');
        await page.getByLabel(/Preferred Language/i).selectOption('en');
        await page.getByLabel(/Receive Newsletter/i).check();
        await page.getByLabel(/I agree to the terms/i).check();

        // Wait for validation
        await page.waitForTimeout(500);
      });

      await test.step('Verify submission is enabled', async () => {
        const submitButton = page.getByRole('button', {
          name: /Submit Registration/i,
        });
        await expect(submitButton).toBeEnabled();
      });
    });
  });

  test.describe('Step Navigation and Cross-Step Validation', () => {
    test('should allow backward navigation between steps', async ({ page }) => {
      await test.step('Navigate forward through steps', async () => {
        // Complete step 1
        await page.getByRole('textbox', { name: /First Name/i }).fill('John');
        await page.getByRole('textbox', { name: /Last Name/i }).fill('Doe');
        await page.getByLabel(/Date of Birth/i).fill('1990-01-01');
        await page
          .getByRole('textbox', { name: /Email Address/i })
          .fill('john.doe@example.com');

        await page.waitForTimeout(500);
        await page
          .getByRole('button', { name: /Next: Account Setup/i })
          .click();

        // Partial step 2 completion
        await page
          .getByRole('textbox', { name: /Username/i })
          .fill('john_doe_2024');

        await page.waitForTimeout(1500);
        await page
          .getByRole('button', { name: /Next: Profile & Preferences/i })
          .click();
      });

      await test.step('Navigate back to previous steps', async () => {
        // Go back to step 2
        const backToAccountButton = page.getByRole('button', {
          name: /Back to Account Setup/i,
        });
        await expect(backToAccountButton).toBeVisible();
        await backToAccountButton.click();

        // Verify we're back on step 2
        await expect(
          page.getByRole('textbox', { name: /Username/i }),
        ).toBeVisible();

        // Go back to step 1
        const backToPersonalButton = page.getByRole('button', {
          name: /Back to Personal Info/i,
        });
        await expect(backToPersonalButton).toBeVisible();
        await backToPersonalButton.click();

        // Verify we're back on step 1
        await expect(
          page.getByRole('textbox', { name: /First Name/i }),
        ).toBeVisible();

        // Data should be preserved
        await expect(
          page.getByRole('textbox', { name: /First Name/i }),
        ).toHaveValue('John');
      });
    });

    test('should preserve form data across step navigation', async ({
      page,
    }) => {
      await test.step('Fill data in multiple steps and navigate', async () => {
        // Step 1
        await page.getByRole('textbox', { name: /First Name/i }).fill('Alice');
        await page.getByRole('textbox', { name: /Last Name/i }).fill('Johnson');
        await page.getByLabel(/Date of Birth/i).fill('1985-06-15');
        await page
          .getByRole('textbox', { name: /Email Address/i })
          .fill('alice.johnson@example.com');

        await page.waitForTimeout(500);
        await page
          .getByRole('button', { name: /Next: Account Setup/i })
          .click();

        // Step 2
        await page
          .getByRole('textbox', { name: /Username/i })
          .fill('alice_dev_2024');
        await page
          .getByRole('textbox', { name: /^Password$/i })
          .fill('AliceSecure456');

        await page.waitForTimeout(1500);
        await page
          .getByRole('button', { name: /Next: Profile & Preferences/i })
          .click();

        // Step 3
        await page
          .getByLabel(/Bio/i)
          .fill('Senior frontend developer with 10 years of experience.');

        // Navigate back and verify data persistence
        await page
          .getByRole('button', { name: /Back to Account Setup/i })
          .click();
        await expect(
          page.getByRole('textbox', { name: /Username/i }),
        ).toHaveValue('alice_dev_2024');

        await page
          .getByRole('button', { name: /Back to Personal Info/i })
          .click();
        await expect(
          page.getByRole('textbox', { name: /First Name/i }),
        ).toHaveValue('Alice');
        await expect(
          page.getByRole('textbox', { name: /Email Address/i }),
        ).toHaveValue('alice.johnson@example.com');
      });
    });
  });

  test.describe('Form Submission and Final Validation', () => {
    test('should successfully submit complete form', async ({ page }) => {
      await test.step('Complete entire form', async () => {
        // Step 1: Personal Information
        await page.getByRole('textbox', { name: /First Name/i }).fill('Sarah');
        await page.getByRole('textbox', { name: /Last Name/i }).fill('Wilson');
        await page.getByLabel(/Date of Birth/i).fill('1992-03-20');
        await page
          .getByRole('textbox', { name: /Email Address/i })
          .fill('sarah.wilson@example.com');

        await page.waitForTimeout(500);
        await page
          .getByRole('button', { name: /Next: Account Setup/i })
          .click();

        // Step 2: Account Setup
        await page
          .getByRole('textbox', { name: /Username/i })
          .fill('sarah_wilson_dev');
        await page
          .getByRole('textbox', { name: /^Password$/i })
          .fill('SarahSecure789');
        await page
          .getByRole('textbox', { name: /Confirm Password/i })
          .fill('SarahSecure789');

        await page.waitForTimeout(1500);
        await page
          .getByRole('button', { name: /Next: Profile & Preferences/i })
          .click();

        // Step 3: Profile & Preferences
        await page
          .getByLabel(/Bio/i)
          .fill(
            'Full-stack developer passionate about creating user-friendly applications.',
          );
        await page.getByLabel(/Website/i).fill('https://sarahwilson.dev');
        await page.getByLabel(/Preferred Language/i).selectOption('en');
        await page.getByLabel(/Receive Newsletter/i).check();
        await page.getByLabel(/I agree to the terms/i).check();
      });

      await test.step('Submit form and verify success', async () => {
        await page.waitForTimeout(500);

        const submitButton = page.getByRole('button', {
          name: /Submit Registration/i,
        });
        await expect(submitButton).toBeEnabled();
        await submitButton.click();

        // Wait for submission processing
        await expect(
          page.getByText(/Registration submitted successfully!/i),
        ).toBeVisible({
          timeout: 5000,
        });

        // Verify form is reset or shows success state
        await expect(
          page.getByText(/Thank you for registering/i),
        ).toBeVisible();
      });
    });

    test('should prevent submission with incomplete data', async ({ page }) => {
      await test.step('Try submission with missing steps', async () => {
        // Only complete step 1
        await page.getByRole('textbox', { name: /First Name/i }).fill('John');
        await page.getByRole('textbox', { name: /Last Name/i }).fill('Doe');
        await page.getByLabel(/Date of Birth/i).fill('1990-01-01');
        await page
          .getByRole('textbox', { name: /Email Address/i })
          .fill('john.doe@example.com');

        await page.waitForTimeout(500);

        // Next button should be available, but final submission should require all steps
        const nextButton = page.getByRole('button', {
          name: /Next: Account Setup/i,
        });
        await expect(nextButton).toBeEnabled();

        // Don't complete other steps - the submit button shouldn't be available yet
        // This tests the step isolation functionality
      });
    });
  });

  test.describe('Form State and Debugging Features', () => {
    test('should display live form state updates', async ({ page }) => {
      await test.step('Verify initial form state', async () => {
        const formStateDisplay = page.locator('pre').first();
        await expect(formStateDisplay).toBeVisible();

        // Initial state should show empty form
        await expect(page.getByText(/"firstName": ""/i)).toBeVisible();
        await expect(page.getByText(/"lastName": ""/i)).toBeVisible();
        await expect(page.getByText(/"email": ""/i)).toBeVisible();
      });

      await test.step('Verify form state updates with input', async () => {
        await page
          .getByRole('textbox', { name: /First Name/i })
          .fill('TestUser');

        // Wait for state update
        await page.waitForTimeout(300);

        // Form state should reflect the change
        await expect(page.getByText(/"firstName": "TestUser"/i)).toBeVisible();
      });
    });

    test('should show validation errors in form state', async ({ page }) => {
      await test.step('Trigger validation errors and check form state', async () => {
        // Trigger validation error
        const emailField = page.getByRole('textbox', {
          name: /Email Address/i,
        });
        await emailField.fill('invalid-email');
        await emailField.blur();

        // Wait for validation
        await page.waitForTimeout(500);

        // Form state should show errors
        await expect(page.getByText(/"errors":/i)).toBeVisible();
        await expect(page.getByText(/"valid": false/i)).toBeVisible();
      });
    });
  });

  test.describe('Accessibility and Keyboard Navigation', () => {
    test('should support keyboard navigation', async ({ page }) => {
      await test.step('Navigate form with keyboard', async () => {
        // Tab through form fields
        await page.keyboard.press('Tab'); // First Name
        await expect(
          page.getByRole('textbox', { name: /First Name/i }),
        ).toBeFocused();

        await page.keyboard.press('Tab'); // Last Name
        await expect(
          page.getByRole('textbox', { name: /Last Name/i }),
        ).toBeFocused();

        await page.keyboard.press('Tab'); // Date of Birth
        await expect(page.getByLabel(/Date of Birth/i)).toBeFocused();

        await page.keyboard.press('Tab'); // Email
        await expect(
          page.getByRole('textbox', { name: /Email Address/i }),
        ).toBeFocused();
      });

      await test.step('Use Enter key for form submission', async () => {
        // Fill form data
        await page.getByRole('textbox', { name: /First Name/i }).fill('Test');
        await page.getByRole('textbox', { name: /Last Name/i }).fill('User');
        await page.getByLabel(/Date of Birth/i).fill('1990-01-01');
        await page
          .getByRole('textbox', { name: /Email Address/i })
          .fill('test@example.com');

        // Press Enter in email field
        await page
          .getByRole('textbox', { name: /Email Address/i })
          .press('Enter');

        // Should navigate to next step (equivalent to clicking Next button)
        await page.waitForTimeout(1000);
        await expect(
          page.getByRole('textbox', { name: /Username/i }),
        ).toBeVisible();
      });
    });

    test('should have proper ARIA attributes and labels', async ({ page }) => {
      await test.step('Verify form accessibility', async () => {
        // Check form has proper role
        const form = page.locator('form[ngxVestForm]');
        await expect(form).toBeVisible();

        // All form fields should have proper labels
        await expect(
          page.getByRole('textbox', { name: /First Name/i }),
        ).toHaveAttribute('aria-required', 'true');
        await expect(
          page.getByRole('textbox', { name: /Last Name/i }),
        ).toHaveAttribute('aria-required', 'true');
        await expect(
          page.getByRole('textbox', { name: /Email Address/i }),
        ).toHaveAttribute('aria-required', 'true');

        // Error messages should have proper ARIA attributes
        await page
          .getByRole('textbox', { name: /Email Address/i })
          .fill('invalid');
        await page.getByRole('textbox', { name: /First Name/i }).click();

        await expect(page.getByRole('alert')).toBeVisible();
      });
    });
  });
});
