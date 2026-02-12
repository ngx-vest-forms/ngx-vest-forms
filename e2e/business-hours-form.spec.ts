import { expect, test, type Page } from '@playwright/test';
import {
  expectFieldHasError,
  expectFieldValid,
  fillAndBlur,
  navigateToBusinessHoursForm,
  typeAndBlur,
} from './helpers/form-helpers';

function digitsToMaskedTime(value: string): string {
  // Expect 4 digits: HHMM -> HH:MM
  if (!/^\d{4}$/.test(value)) return value;
  return `${value.slice(0, 2)}:${value.slice(2, 4)}`;
}

function selectAllShortcut(): string {
  return process.platform === 'darwin' ? 'Meta+A' : 'Control+A';
}

/**
 * Helper to wait for the add form to be ready for new input.
 * After adding a slot, Angular clears the addValue inputs via unidirectional flow.
 * This helper waits for those inputs to be cleared before filling them again.
 */
async function waitForAddFormReady(
  fromTime: ReturnType<Page['locator']>,
  toTime: ReturnType<Page['locator']>
): Promise<void> {
  // Wait for both inputs to be cleared (empty value)
  await expect(fromTime).toHaveValue('');
  await expect(toTime).toHaveValue('');
}

/**
 * Helper to fill a masked time input.
 * The ngx-mask directive requires specific input handling.
 * This helper clears the input first, then types the value sequentially
 * to ensure the mask processes each character correctly.
 */
async function fillMaskedTimeInput(
  input: ReturnType<Page['locator']>,
  value: string
): Promise<void> {
  await input.focus();

  // Clearing masked inputs with keyboard shortcuts tends to be more reliable
  // than programmatic value setting.
  await input.press(selectAllShortcut());
  await input.press('Backspace');

  await input.type(value, { delay: 50 });
  await input.blur();

  // Ensure the mask actually processed the input.
  await expect(input).toHaveValue(digitsToMaskedTime(value));
}

/**
 * Helper to add a time slot (fill inputs and click Add button).
 * Uses sequential key presses for reliable input handling with ngx-mask.
 */
async function addTimeSlot(
  page: Page,
  fromValue: string,
  toValue: string
): Promise<void> {
  const fromTime = getAddFromTime(page);
  const toTime = getAddToTime(page);
  const addButton = getAddButton(page);

  await fillMaskedTimeInput(fromTime, fromValue);
  await fillMaskedTimeInput(toTime, toValue);

  // The Add button is disabled until the unidirectional model sync completes.
  await expect(addButton).toBeEnabled();
  await addButton.click();
}

async function readJsonPanel(
  page: Page,
  panelHeading: 'Form Value' | 'Errors'
) {
  const pre = page
    .getByRole('heading', { name: panelHeading })
    .locator('..')
    .locator('pre');
  const text = await pre.innerText();
  return JSON.parse(text) as Record<string, any>;
}

function firstErrorMessage(value: unknown): string | null {
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : null;
  }
  return typeof value === 'string' ? value : null;
}

function normalizeTime(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  return value.replace(':', '');
}

function readBusinessHoursValues(
  formValue: Record<string, any>
): Array<Record<string, unknown>> | [] {
  const values = formValue['businessHours']?.['values'];
  if (!values) return [];
  if (Array.isArray(values)) return values;
  if (typeof values === 'object') return Object.values(values);
  return [];
}

function getAddFromTime(page: Page) {
  return page.locator('#business-hours-add-from');
}

function getAddToTime(page: Page) {
  return page.locator('#business-hours-add-to');
}

function getAddButton(page: Page) {
  return page.getByRole('button', { name: /^Add$/i });
}

test.describe('Business Hours Form', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToBusinessHoursForm(page);
  });

  test.describe('ROOT_FORM Array Validation', () => {
    test('should show ROOT_FORM error when no business hours are added', async ({
      page,
    }) => {
      await test.step('Verify empty form shows ROOT_FORM error', async () => {
        await expect(
          page.getByText('You should have at least one business hour', {
            exact: true,
          })
        ).toBeVisible();

        await expect
          .poll(async () => {
            const errors = await readJsonPanel(page, 'Errors');
            return firstErrorMessage(errors['rootForm']);
          })
          .toMatch(/at least one business hour/i);
      });
    });

    test('should clear ROOT_FORM error when a valid business hour is added', async ({
      page,
    }) => {
      await test.step('Add valid business hour', async () => {
        const fromTime = getAddFromTime(page);
        const toTime = getAddToTime(page);

        await fillAndBlur(fromTime, '0900');
        await fillAndBlur(toTime, '1700');

        await getAddButton(page).click();

        await expect
          .poll(async () => {
            const errors = await readJsonPanel(page, 'Errors');
            return errors['rootForm'] ?? null;
          })
          .toBeFalsy();

        // Verify the business hour was added successfully
        // Check that the form value now contains the added business hour
        const formValue = await readJsonPanel(page, 'Form Value');
        const values = readBusinessHoursValues(formValue);
        await expect(normalizeTime(values[0]?.['from'])).toBe('0900');
        await expect(normalizeTime(values[0]?.['to'])).toBe('1700');
      });
    });
  });

  test.describe('Time Field Validation', () => {
    test('should not show addValue errors when empty', async ({ page }) => {
      await test.step('Focus and blur without input', async () => {
        const fromTime = getAddFromTime(page);
        const toTime = getAddToTime(page);

        await fromTime.focus();
        await fromTime.blur();
        await toTime.focus();
        await toTime.blur();

        const errors = await readJsonPanel(page, 'Errors');
        await expect(errors['businessHours.addValue.from']).toBeUndefined();
        await expect(errors['businessHours.addValue.to']).toBeUndefined();
      });
    });

    test('should validate time format (4 digits, HH < 24, MM < 60)', async ({
      page,
    }) => {
      await test.step('Enter invalid time formats', async () => {
        const fromTime = getAddFromTime(page);

        // Invalid: too few digits
        await fillAndBlur(fromTime, '090');
        await expectFieldHasError(fromTime, 'Should be a valid time');

        // Invalid: hour >= 24
        await fillAndBlur(fromTime, '2500');
        await expectFieldHasError(fromTime, 'Should be a valid time');

        // Invalid: minute >= 60
        await fillAndBlur(fromTime, '0965');
        await expectFieldHasError(fromTime, 'Should be a valid time');

        // Valid format
        await fillAndBlur(fromTime, '0900');
        await expectFieldValid(fromTime);
      });
    });

    test('should validate that "to" time is after "from" time', async ({
      page,
    }) => {
      await test.step('Enter "to" time before "from" time', async () => {
        const fromTime = getAddFromTime(page);
        const toTime = getAddToTime(page);

        // Use typeAndBlur to better simulate real user typing so the bidirectional
        // validationConfig triggers reliably.
        await typeAndBlur(fromTime, '1700');
        await typeAndBlur(toTime, '0900');

        await expect
          .poll(async () => {
            const errors = await readJsonPanel(page, 'Errors');
            return firstErrorMessage(errors['businessHours.addValue']);
          })
          .toMatch(/earlier/i);
      });
    });

    test('should clear error when "to" time is corrected to be after "from" time', async ({
      page,
    }) => {
      await test.step('Fix time order', async () => {
        const fromTime = getAddFromTime(page);
        const toTime = getAddToTime(page);

        await typeAndBlur(fromTime, '1700');
        await typeAndBlur(toTime, '0900');
        await expect
          .poll(async () => {
            const errors = await readJsonPanel(page, 'Errors');
            return errors['businessHours.addValue'] ?? null;
          })
          .not.toBeNull();

        await typeAndBlur(toTime, '1800');
        await expect
          .poll(async () => {
            const errors = await readJsonPanel(page, 'Errors');
            return errors['businessHours.addValue'] ?? null;
          })
          .toBeNull();
      });
    });
  });

  test.describe('Multiple Time Slots Validation', () => {
    test('should add multiple valid time slots', async ({ page }) => {
      await test.step('Add two valid, non-overlapping time slots', async () => {
        const fromTime = getAddFromTime(page);
        const toTime = getAddToTime(page);
        const valuesGroup = page.locator('[ngModelGroup="values"]');

        // Add first slot
        await addTimeSlot(page, '0900', '1200');

        await expect(valuesGroup.locator('input[name="from"]')).toHaveCount(1);

        // Wait for add form to be ready (inputs cleared by Angular)
        await waitForAddFormReady(fromTime, toTime);

        // Add second slot
        await addTimeSlot(page, '1300', '1700');

        await expect(valuesGroup.locator('input[name="from"]')).toHaveCount(2);

        const formValue = await readJsonPanel(page, 'Form Value');
        const values = readBusinessHoursValues(formValue);
        await expect(normalizeTime(values[0]?.['from'])).toBe('0900');
        await expect(normalizeTime(values[1]?.['from'])).toBe('1300');
      });
    });

    test('should detect overlapping time slots', async ({ page }) => {
      await test.step('Add overlapping time slots', async () => {
        const fromTime = getAddFromTime(page);
        const toTime = getAddToTime(page);
        const valuesGroup = page.locator('[ngModelGroup="values"]');

        // Add first slot: 09:00 - 12:00
        await addTimeSlot(page, '0900', '1200');

        await expect(valuesGroup.locator('input[name="from"]')).toHaveCount(1);

        // Wait for add form to be ready (inputs cleared by Angular)
        await waitForAddFormReady(fromTime, toTime);

        // Add overlapping slot: 11:00 - 14:00
        await addTimeSlot(page, '1100', '1400');

        await expect(valuesGroup.locator('input[name="from"]')).toHaveCount(2);

        await expect
          .poll(async () => {
            const errors = await readJsonPanel(page, 'Errors');
            return firstErrorMessage(errors['businessHours.values']);
          })
          .toMatch(/overlap/i);
      });
    });

    test('should invalidate out-of-order time slots', async ({ page }) => {
      await test.step('Add time slots out of order', async () => {
        const fromTime = getAddFromTime(page);
        const toTime = getAddToTime(page);
        const valuesGroup = page.locator('[ngModelGroup="values"]');

        // Add first slot: 13:00 - 17:00
        await addTimeSlot(page, '1300', '1700');

        await expect(valuesGroup.locator('input[name="from"]')).toHaveCount(1);

        // Wait for add form to be ready (inputs cleared by Angular)
        await waitForAddFormReady(fromTime, toTime);

        // Add earlier slot: 09:00 - 12:00
        await addTimeSlot(page, '0900', '1200');

        await expect(valuesGroup.locator('input[name="from"]')).toHaveCount(2);

        await expect
          .poll(async () => {
            const errors = await readJsonPanel(page, 'Errors');
            return firstErrorMessage(errors['businessHours.values']);
          })
          .toMatch(/overlap/i);
      });
    });

    test('should clear overlap error when overlapping slot is removed', async ({
      page,
    }) => {
      await test.step('Add overlapping slots, then remove one', async () => {
        const fromTime = getAddFromTime(page);
        const toTime = getAddToTime(page);
        const valuesGroup = page.locator('[ngModelGroup="values"]');

        // Add first slot
        await addTimeSlot(page, '0900', '1200');

        await expect(valuesGroup.locator('input[name="from"]')).toHaveCount(1);

        // Wait for add form to be ready (inputs cleared by Angular)
        await waitForAddFormReady(fromTime, toTime);

        // Add overlapping slot
        await addTimeSlot(page, '1100', '1400');

        await expect(valuesGroup.locator('input[name="from"]')).toHaveCount(2);

        await expect
          .poll(async () => {
            const errors = await readJsonPanel(page, 'Errors');
            return firstErrorMessage(errors['businessHours.values']);
          })
          .toMatch(/overlap/i);

        // Remove the second slot
        await page
          .getByRole('button', { name: /^Remove$/i })
          .nth(1)
          .click();

        await expect
          .poll(async () => {
            const errors = await readJsonPanel(page, 'Errors');
            return errors['businessHours.values'] ?? null;
          })
          .toBeNull();
      });
    });

    test('should validate each added slot individually', async ({ page }) => {
      await test.step('Add slot with invalid time format', async () => {
        const fromTime = getAddFromTime(page);
        const toTime = getAddToTime(page);
        const addButton = getAddButton(page);

        // Add slot with valid times
        await fillAndBlur(fromTime, '0900');
        await fillAndBlur(toTime, '1200');
        await addButton.click();

        // Edit the added slot to have invalid format
        const firstSlotFrom = page
          .locator('[ngModelGroup="values"]')
          .locator('input[name="from"]')
          .first();
        await fillAndBlur(firstSlotFrom, '2500');

        await expectFieldHasError(firstSlotFrom, 'Should be a valid time');
      });
    });
  });

  test.describe('Edit Business Hour', () => {
    test('should allow editing existing business hours', async ({ page }) => {
      await test.step('Add a business hour and edit it', async () => {
        const fromTime = getAddFromTime(page);
        const toTime = getAddToTime(page);
        const addButton = getAddButton(page);

        await fillAndBlur(fromTime, '0900');
        await fillAndBlur(toTime, '1200');
        await addButton.click();

        // Edit the added slot
        const valuesGroup = page.locator('[ngModelGroup="values"]');
        const firstSlotFrom = valuesGroup.locator('input[name="from"]').first();
        const firstSlotTo = valuesGroup.locator('input[name="to"]').first();

        await fillAndBlur(firstSlotFrom, '1000');
        await fillAndBlur(firstSlotTo, '1300');

        await expect(firstSlotFrom).toHaveValue('10:00');
        await expect(firstSlotTo).toHaveValue('13:00');
      });
    });

    test('should maintain validation rules when editing', async ({ page }) => {
      await test.step('Edit business hour to create invalid state', async () => {
        const fromTime = getAddFromTime(page);
        const toTime = getAddToTime(page);
        const addButton = getAddButton(page);

        await fillAndBlur(fromTime, '0900');
        await fillAndBlur(toTime, '1200');
        await addButton.click();

        // Edit to make "to" before "from"
        const firstSlotTo = page
          .locator('[ngModelGroup="values"]')
          .locator('input[name="to"]')
          .first();
        await fillAndBlur(firstSlotTo, '0800');

        await expect
          .poll(async () => {
            const errors = await readJsonPanel(page, 'Errors');
            return firstErrorMessage(errors['businessHours.values[0]']);
          })
          .toMatch(/earlier/i);
      });
    });
  });

  test.describe('Remove Business Hour', () => {
    test('should remove business hour and revalidate form', async ({
      page,
    }) => {
      await test.step('Add two business hours and remove one', async () => {
        const fromTime = getAddFromTime(page);
        const toTime = getAddToTime(page);
        const addButton = getAddButton(page);

        // Add first slot
        await fillAndBlur(fromTime, '0900');
        await fillAndBlur(toTime, '1200');
        await addButton.click();

        // Add second slot
        await fillAndBlur(fromTime, '1300');
        await fillAndBlur(toTime, '1700');
        await addButton.click();

        await page
          .getByRole('button', { name: /^Remove$/i })
          .first()
          .click();

        // Wait for form value to update after removal
        await expect
          .poll(async () => {
            const formValue = await readJsonPanel(page, 'Form Value');
            return normalizeTime(
              formValue['businessHours']?.['values']?.['0']?.['from']
            );
          })
          .toBe('1300');
      });
    });

    test('should show ROOT_FORM error if all business hours are removed', async ({
      page,
    }) => {
      await test.step('Add and then remove all business hours', async () => {
        const fromTime = getAddFromTime(page);
        const toTime = getAddToTime(page);
        const addButton = getAddButton(page);

        await fillAndBlur(fromTime, '0900');
        await fillAndBlur(toTime, '1200');
        await addButton.click();

        await page.getByRole('button', { name: /^Remove$/i }).click();

        await expect
          .poll(async () => {
            const errors = await readJsonPanel(page, 'Errors');
            return firstErrorMessage(errors['rootForm']);
          })
          .toMatch(/at least one business hour/i);
      });
    });
  });

  test.describe('Form State Display', () => {
    test('should successfully add a valid business hour', async ({ page }) => {
      await test.step('Add valid business hour and verify it appears in the list', async () => {
        const fromTime = getAddFromTime(page);
        const toTime = getAddToTime(page);
        const addButton = getAddButton(page);
        const valuesGroup = page.locator('[ngModelGroup="values"]');

        await fillAndBlur(fromTime, '0900');
        await fillAndBlur(toTime, '1700');
        await addButton.click();

        await expect(valuesGroup.locator('input[name="from"]')).toHaveCount(1);

        const formValue = await readJsonPanel(page, 'Form Value');
        const values = readBusinessHoursValues(formValue);
        await expect(normalizeTime(values[0]?.['from'])).toBe('0900');
        await expect(normalizeTime(values[0]?.['to'])).toBe('1700');
        await expect(valuesGroup.locator('input[name="from"]')).toHaveCount(1);
        await expect(valuesGroup.locator('input[name="to"]')).toHaveCount(1);
      });
    });

    // FIXME: Requirements list wording doesn't match test expectations
    test('should display validation requirements list', async ({ page }) => {
      await test.step('Verify validation requirements are listed', async () => {
        await expect(
          page.getByText(/at least one business hour must be added/i)
        ).toBeVisible();
        await expect(
          page.getByText(/'from' and 'to' must be valid times/i)
        ).toBeVisible();
        await expect(
          page.getByText(/'to' time must be later than 'from' time/i)
        ).toBeVisible();
        await expect(
          page.getByText(/multiple time ranges cannot overlap/i)
        ).toBeVisible();
      });
    });
  });
});
