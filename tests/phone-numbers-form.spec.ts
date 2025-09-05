import { expect, test } from '@playwright/test';

// SKIPPED: Phone numbers form is from old backup examples
// These tests are for forms that are no longer active in the current application
// TODO: Remove this test file or update when phone-numbers-form is restored

test.describe.skip('Phone Numbers Form - Dynamic Array Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the phone numbers form before each test
    await page.goto('http://localhost:4200/phone-numbers-form');
  });

  test('Initial state - Empty form with proper structure', async ({ page }) => {
    await test.step('Verify page title and description', async () => {
      await expect(page).toHaveTitle(/Phone Numbers Form/);
      await expect(
        page.getByRole('heading', { name: 'Phone Numbers Form' }),
      ).toBeVisible();
      await expect(
        page.getByText(
          'Purpose: Demonstrate array-like editing with proper ngx-vest-forms patterns',
        ),
      ).toBeVisible();
    });

    await test.step('Verify form structure and empty state', async () => {
      // Check Add Phone Number section
      await expect(page.getByText('Add Phone Number')).toBeVisible();
      await expect(
        page.getByRole('textbox', { name: 'Add Phone Number' }),
      ).toBeVisible();
      await expect(page.getByRole('button', { name: 'Add' })).toBeVisible();

      // Check empty state message
      await expect(page.getByText('No phone numbers added yet.')).toBeVisible();
      await expect(
        page.getByText('Add a phone number above to get started.'),
      ).toBeVisible();

      // Verify Save button is present
      await expect(
        page.getByRole('button', { name: 'Save Phone Numbers' }),
      ).toBeVisible();
    });

    await test.step('Verify accessibility structure', async () => {
      // Check that the input has proper labeling
      const addInput = page.getByRole('textbox', { name: 'Add Phone Number' });
      await expect(addInput).toHaveAttribute(
        'placeholder',
        /Enter phone number/,
      );
      await expect(addInput).toBeVisible();
    });
  });

  test('Add phone number with Enter key - Keyboard accessibility', async ({
    page,
  }) => {
    const phoneNumber = '+1-555-123-4567';

    await test.step('Add phone number using Enter key', async () => {
      const addInput = page.getByRole('textbox', { name: 'Add Phone Number' });
      await addInput.fill(phoneNumber);
      await addInput.press('Enter');
    });

    await test.step('Verify phone number appears in list', async () => {
      // Check that the phone number section appears
      await expect(
        page.getByRole('heading', { name: 'Phone Numbers (1)' }),
      ).toBeVisible();

      // Verify the phone number is displayed in a span element
      await expect(page.getByText(phoneNumber)).toBeVisible();

      // Check that remove button is present with proper labeling
      await expect(
        page.getByRole('button', {
          name: `Remove phone number ${phoneNumber}`,
        }),
      ).toBeVisible();
    });

    await test.step('Verify input field is cleared', async () => {
      const addInput = page.getByRole('textbox', { name: 'Add Phone Number' });
      await expect(addInput).toHaveValue('');
    });

    await test.step('Verify empty state is hidden', async () => {
      await expect(
        page.getByText('No phone numbers added yet.'),
      ).not.toBeVisible();
    });
  });

  test('Enter key prevents form submission', async ({ page }) => {
    await test.step('Test Enter key behavior with valid input', async () => {
      const addInput = page.getByRole('textbox', { name: 'Add Phone Number' });
      await addInput.fill('+1-555-999-8888');

      // Listen for form submission events (should not occur)
      let formSubmitted = false;
      page.on('request', (request) => {
        if (request.method() === 'POST') {
          formSubmitted = true;
        }
      });

      await addInput.press('Enter');

      // Wait a bit to ensure no form submission occurred
      await page.waitForTimeout(100);
      expect(formSubmitted).toBe(false);
    });

    await test.step('Verify phone number was added instead', async () => {
      await expect(
        page.getByRole('heading', { name: 'Phone Numbers (1)' }),
      ).toBeVisible();
      await expect(page.getByText('+1-555-999-8888')).toBeVisible();
    });
  });

  test('Enter key with validation errors', async ({ page }) => {
    await test.step('Enter invalid phone number and press Enter', async () => {
      const addInput = page.getByRole('textbox', { name: 'Add Phone Number' });
      await addInput.fill('invalid-phone!@#');

      // Trigger validation by blurring the field first
      await addInput.blur();

      // Wait for validation error to appear
      await expect(
        page.getByText('Phone number must be valid format'),
      ).toBeVisible();

      // Focus back and press Enter
      await addInput.focus();
      await addInput.press('Enter');
    });

    await test.step('Verify no phone number was added due to validation error', async () => {
      // Validation error shown, Add button disabled
      await expect(
        page.getByText('Phone number must be valid format'),
      ).toBeVisible();
      await expect(page.getByRole('button', { name: 'Add' })).toBeDisabled();

      // No additions
      await expect(
        page.getByRole('heading', { name: 'Phone Numbers (0)' }),
      ).toBeVisible();
      await expect(page.getByText('No phone numbers added yet.')).toBeVisible();
      await expect(page.getByText('invalid-phone!@#')).not.toBeVisible();

      // Input retains invalid value
      await expect(
        page.getByRole('textbox', { name: 'Add Phone Number' }),
      ).toHaveValue('invalid-phone!@#');
    });
  });

  test('Add single phone number - Happy path', async ({ page }) => {
    const phoneNumber = '+1-555-123-4567';

    await test.step('Add a phone number', async () => {
      const addInput = page.getByRole('textbox', { name: 'Add Phone Number' });
      await addInput.fill(phoneNumber);
      await page.getByRole('button', { name: 'Add' }).click();
    });

    await test.step('Verify phone number appears in list', async () => {
      // Check that the phone number section appears
      await expect(
        page.getByRole('heading', { name: 'Phone Numbers (1)' }),
      ).toBeVisible();

      // Verify the phone number is displayed in a span element
      await expect(page.getByText(phoneNumber)).toBeVisible();

      // Check that remove button is present with proper labeling
      await expect(
        page.getByRole('button', {
          name: `Remove phone number ${phoneNumber}`,
        }),
      ).toBeVisible();
    });

    await test.step('Verify input field is cleared', async () => {
      const addInput = page.getByRole('textbox', { name: 'Add Phone Number' });
      await expect(addInput).toHaveValue('');
    });

    await test.step('Verify empty state is hidden', async () => {
      await expect(
        page.getByText('No phone numbers added yet.'),
      ).not.toBeVisible();
    });
  });

  test('Add multiple phone numbers - List growth', async ({ page }) => {
    const phoneNumbers = [
      '+1-555-123-4567',
      '+1-555-999-8888',
      '+1-555-777-0000',
    ];

    await test.step('Add multiple phone numbers', async () => {
      const addInput = page.getByRole('textbox', { name: 'Add Phone Number' });
      const addButton = page.getByRole('button', { name: 'Add' });

      for (const [index, phoneNumber] of phoneNumbers.entries()) {
        await addInput.fill(phoneNumber);
        await addButton.click();

        // Verify count updates correctly
        await expect(
          page.getByRole('heading', {
            name: `Phone Numbers (${index + 1})`,
          }),
        ).toBeVisible();
      }
    });

    await test.step('Verify all phone numbers are displayed', async () => {
      // Check total count
      await expect(
        page.getByRole('heading', { name: 'Phone Numbers (3)' }),
      ).toBeVisible();

      // Verify each phone number is present
      for (const phoneNumber of phoneNumbers) {
        await expect(page.getByText(phoneNumber)).toBeVisible();
        await expect(
          page.getByRole('button', {
            name: `Remove phone number ${phoneNumber}`,
          }),
        ).toBeVisible();
      }
    });

    await test.step('Verify list structure', async () => {
      // Get the phone numbers list specifically by finding the ul that contains remove buttons
      const phoneNumbersList = page.locator('ul:has(button:text("Remove"))');
      await expect(phoneNumbersList).toBeVisible();

      // Get list items within the phone numbers list
      const listItems = phoneNumbersList.getByRole('listitem');
      await expect(listItems).toHaveCount(3);
    });
  });

  test('Phone numbers count updates correctly', async ({ page }) => {
    const phoneNumbers = [
      '+1-555-111-1111',
      '+1-555-222-2222',
      '+1-555-333-3333',
    ];

    await test.step('Verify initial count', async () => {
      await expect(
        page.getByRole('heading', { name: 'Phone Numbers (0)' }),
      ).toBeVisible();
    });

    await test.step('Add phone numbers and verify count updates', async () => {
      const addInput = page.getByRole('textbox', { name: 'Add Phone Number' });

      for (const [index, phoneNumber] of phoneNumbers.entries()) {
        await addInput.fill(phoneNumber);
        await addInput.press('Enter'); // Use keyboard to add

        // Verify count updates correctly after each addition
        await expect(
          page.getByRole('heading', {
            name: `Phone Numbers (${index + 1})`,
          }),
        ).toBeVisible();
      }
    });

    await test.step('Remove phone numbers and verify count decreases', async () => {
      // Remove the first phone number
      await page
        .getByRole('button', {
          name: `Remove phone number ${phoneNumbers[0]}`,
        })
        .click();

      await expect(
        page.getByRole('heading', { name: 'Phone Numbers (2)' }),
      ).toBeVisible();

      // Remove another phone number
      await page
        .getByRole('button', {
          name: `Remove phone number ${phoneNumbers[1]}`,
        })
        .click();

      await expect(
        page.getByRole('heading', { name: 'Phone Numbers (1)' }),
      ).toBeVisible();

      // Remove the last phone number
      await page
        .getByRole('button', {
          name: `Remove phone number ${phoneNumbers[2]}`,
        })
        .click();

      await expect(
        page.getByRole('heading', { name: 'Phone Numbers (0)' }),
      ).toBeVisible();

      // Verify empty state returns
      await expect(page.getByText('No phone numbers added yet.')).toBeVisible();
    });
  });

  test('Remove phone numbers - Individual removal', async ({ page }) => {
    const phoneNumbers = ['+1-555-123-4567', '+1-555-999-8888'];

    await test.step('Add multiple phone numbers', async () => {
      const addInput = page.getByRole('textbox', { name: 'Add Phone Number' });

      for (const phoneNumber of phoneNumbers) {
        await addInput.fill(phoneNumber);
        await addInput.press('Enter'); // Use Enter key to add
        // Wait for the phone number to be added
        await expect(page.getByText(phoneNumber)).toBeVisible();
      }
    });

    await test.step('Remove first phone number', async () => {
      await page
        .getByRole('button', { name: `Remove phone number ${phoneNumbers[0]}` })
        .click();
    });

    await test.step('Verify list updates correctly', async () => {
      // Count should decrease
      await expect(
        page.getByRole('heading', { name: 'Phone Numbers (1)' }),
      ).toBeVisible();

      // First number should be gone
      await expect(page.getByText(phoneNumbers[0])).not.toBeVisible();

      // Second number should remain
      await expect(page.getByText(phoneNumbers[1])).toBeVisible();
    });

    await test.step('Remove last phone number', async () => {
      await page
        .getByRole('button', { name: `Remove phone number ${phoneNumbers[1]}` })
        .click();
    });

    await test.step('Verify empty state returns', async () => {
      // Empty state should reappear
      await expect(page.getByText('No phone numbers added yet.')).toBeVisible();
      await expect(
        page.getByText('Add a phone number above to get started.'),
      ).toBeVisible();

      // Phone numbers section should show 0 count
      await expect(
        page.getByRole('heading', { name: 'Phone Numbers (0)' }),
      ).toBeVisible();
    });
  });

  test('Form validation - Invalid phone number format', async ({ page }) => {
    await test.step('Try to add invalid phone number', async () => {
      const addInput = page.getByRole('textbox', { name: 'Add Phone Number' });
      await addInput.fill('invalid-phone-number!@#');
      await addInput.blur(); // Trigger validation
    });

    await test.step('Verify validation error appears', async () => {
      // Check for validation error message
      await expect(
        page.getByText('Phone number must be valid format'),
      ).toBeVisible();

      // Verify Add button is disabled when there's a validation error
      const addButton = page.getByRole('button', { name: 'Add' });
      await expect(addButton).toBeDisabled();
    });

    await test.step('Fix the phone number format', async () => {
      const addInput = page.getByRole('textbox', { name: 'Add Phone Number' });
      await addInput.clear();
      await addInput.fill('+1-555-123-4567');
      await addInput.blur();

      // Verify error disappears
      await expect(
        page.getByText('Phone number must be valid format'),
      ).not.toBeVisible();

      // Verify Add button is enabled
      const addButton = page.getByRole('button', { name: 'Add' });
      await expect(addButton).not.toBeDisabled();
    });
  });

  test('Form validation - Duplicate phone number prevention', async ({
    page,
  }) => {
    const phoneNumber = '+1-555-123-4567';

    await test.step('Add initial phone number', async () => {
      const addInput = page.getByRole('textbox', { name: 'Add Phone Number' });
      await addInput.fill(phoneNumber);
      await page.getByRole('button', { name: 'Add' }).click();

      // Verify it was added
      await expect(
        page.getByRole('heading', { name: 'Phone Numbers (1)' }),
      ).toBeVisible();
    });

    await test.step('Try to add the same phone number again', async () => {
      const addInput = page.getByRole('textbox', { name: 'Add Phone Number' });
      await addInput.fill(phoneNumber);
      await addInput.blur(); // Trigger validation
    });

    await test.step('Verify duplicate validation error', async () => {
      // Check for duplicate error message
      await expect(
        page.getByText('This phone number already exists'),
      ).toBeVisible();

      // Verify Add button is disabled
      const addButton = page.getByRole('button', { name: 'Add' });
      await expect(addButton).toBeDisabled();
    });

    await test.step('Enter a different phone number', async () => {
      const addInput = page.getByRole('textbox', { name: 'Add Phone Number' });
      await addInput.clear();
      await addInput.fill('+1-555-999-8888');
      await addInput.blur();

      // Verify error disappears and button is enabled
      await expect(
        page.getByText('This phone number already exists'),
      ).not.toBeVisible();

      const addButton = page.getByRole('button', { name: 'Add' });
      await expect(addButton).not.toBeDisabled();
    });
  });

  test('Form validation - Empty input handling', async ({ page }) => {
    await test.step('Verify Add button is disabled when input is empty', async () => {
      const addButton = page.getByRole('button', { name: 'Add' });
      await expect(addButton).toBeDisabled();
    });

    await test.step('Verify empty state persists', async () => {
      // Empty state should remain
      await expect(page.getByText('No phone numbers added yet.')).toBeVisible();

      // Header should show 0 count
      await expect(
        page.getByRole('heading', { name: 'Phone Numbers (0)' }),
      ).toBeVisible();
    });

    await test.step('Try to add whitespace-only input', async () => {
      const addInput = page.getByRole('textbox', { name: 'Add Phone Number' });
      const addButton = page.getByRole('button', { name: 'Add' });
      await addInput.fill('   ');

      // Check if button is still disabled (might need a small wait for validation)
      await expect(addButton).toBeDisabled();
    });

    await test.step('Verify whitespace input is rejected', async () => {
      // Empty state should still be visible
      await expect(page.getByText('No phone numbers added yet.')).toBeVisible();

      // Header should still show 0 count
      await expect(
        page.getByRole('heading', { name: 'Phone Numbers (0)' }),
      ).toBeVisible();
    });
  });

  test('Form submission - Integration test', async ({ page }) => {
    const phoneNumber = '+1-555-123-4567';

    await test.step('Add a phone number', async () => {
      const addInput = page.getByRole('textbox', { name: 'Add Phone Number' });
      await addInput.fill(phoneNumber);
      await page.getByRole('button', { name: 'Add' }).click();

      // Wait for the phone number to be added
      await expect(page.getByText(phoneNumber)).toBeVisible();
    });

    await test.step('Submit the form and handle alert', async () => {
      // Set up dialog handler before clicking
      page.once('dialog', async (dialog) => {
        expect(dialog.message()).toBe('Phone numbers saved!');
        await dialog.accept();
      });

      await page.getByRole('button', { name: 'Save Phone Numbers' }).click();

      // Wait a bit to ensure dialog was handled
      await page.waitForTimeout(100);
    });

    await test.step('Verify form state after submission', async () => {
      // Form should retain the phone numbers after submission
      await expect(page.getByText(phoneNumber)).toBeVisible();
      await expect(
        page.getByRole('heading', { name: 'Phone Numbers (1)' }),
      ).toBeVisible();
    });
  });

  test('Accessibility - ARIA labels and keyboard navigation', async ({
    page,
  }) => {
    const phoneNumber = '+1-555-123-4567';

    await test.step('Verify form accessibility structure', async () => {
      // Check label association
      const addInput = page.getByRole('textbox', { name: 'Add Phone Number' });
      await expect(addInput).toBeVisible();

      // Check that the input has proper id attribute
      await expect(addInput).toHaveAttribute('id', 'add-phone-input');
    });

    await test.step('Test keyboard navigation with Enter key', async () => {
      // Focus the input directly and test typing
      const addInput = page.getByRole('textbox', { name: 'Add Phone Number' });
      await addInput.focus();
      await expect(addInput).toBeFocused();

      // Type phone number and press Enter
      await addInput.fill(phoneNumber);
      await addInput.press('Enter');

      // Verify phone number was added via keyboard
      await expect(
        page.getByRole('heading', { name: 'Phone Numbers (1)' }),
      ).toBeVisible();
      await expect(page.getByText(phoneNumber)).toBeVisible();
    });

    await test.step('Test keyboard navigation to button', async () => {
      // Clear and add another number using Tab + Enter on button
      const addInput = page.getByRole('textbox', { name: 'Add Phone Number' });
      await addInput.fill('+1-555-999-0000');

      // Tab to Add button and press Enter
      await page.keyboard.press('Tab');
      const addButton = page.getByRole('button', { name: 'Add' });
      await expect(addButton).toBeFocused();
      await page.keyboard.press('Enter');

      // Verify second phone number was added
      await expect(
        page.getByRole('heading', { name: 'Phone Numbers (2)' }),
      ).toBeVisible();
    });

    await test.step('Verify accessibility of added items', async () => {
      // Check remove button has proper aria-label
      const removeButton = page.getByRole('button', {
        name: `Remove phone number ${phoneNumber}`,
      });
      await expect(removeButton).toBeVisible();
      await expect(removeButton).toHaveAttribute(
        'aria-label',
        `Remove phone number ${phoneNumber}`,
      );
    });
  });

  test('UI Design - Visual structure verification', async ({ page }) => {
    const phoneNumbers = ['+1-555-123-4567', '+1-555-999-8888'];

    await test.step('Verify empty state design', async () => {
      // Check dashed border container for empty state
      const emptyStateContainer = page.locator('.border-dashed');
      await expect(emptyStateContainer).toBeVisible();
      await expect(emptyStateContainer).toContainText(
        'No phone numbers added yet',
      );
    });

    await test.step('Add phone numbers and verify list design', async () => {
      const addInput = page.getByRole('textbox', { name: 'Add Phone Number' });
      const addButton = page.getByRole('button', { name: 'Add' });

      for (const [index, phoneNumber] of phoneNumbers.entries()) {
        await addInput.fill(phoneNumber);
        await addButton.click();
        // Wait for the list header to reflect the new count to ensure DOM has updated
        await expect(
          page.getByRole('heading', {
            name: `Phone Numbers (${index + 1})`,
          }),
        ).toBeVisible();
      }
    });

    await test.step('Verify list styling and structure', async () => {
      // Verify the phone number is displayed with proper styling
      for (const phoneNumber of phoneNumbers) {
        await expect(page.getByText(phoneNumber)).toBeVisible();
        // Verify the phone number span has the expected classes (visual check)
        const phoneSpan = page.getByText(phoneNumber);
        await expect(phoneSpan).toHaveClass(/font-mono/);
      }

      // Verify proper list structure - target the phone numbers list specifically
      const phoneNumbersList = page.locator('ul:has(button:text("Remove"))');
      await expect(phoneNumbersList).toBeVisible();

      const listItems = phoneNumbersList.getByRole('listitem');
      await expect(listItems).toHaveCount(2);
    });

    await test.step('Verify responsive layout', async () => {
      // Check that Add section uses flex layout
      const addSection = page.locator('.flex.gap-2').first();
      await expect(addSection).toBeVisible();

      // Verify input takes flex-1 space
      const addInput = page.getByRole('textbox', { name: 'Add Phone Number' });
      await expect(addInput).toHaveClass(/flex-1/);
    });
  });
});
