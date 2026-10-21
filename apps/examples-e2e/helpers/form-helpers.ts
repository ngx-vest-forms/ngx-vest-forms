import { expect, Locator, Page, type ConsoleMessage } from '@playwright/test';

/**
 * Validation polling configuration
 * These values handle timing issues with Angular change detection and Vest validation
 */
const VALIDATION_TIMEOUT = 10000; // 10s: increased to handle cascade validations and multiple field fills

/** Quick polling intervals for stability checks */
const QUICK_INTERVALS: number[] = [50, 100, 250, 500];

/** Extended polling intervals for async operations like warnings */
const EXTENDED_INTERVALS: number[] = [50, 100, 250, 500, 1000, 2000];

/**
 * Navigation helpers for the three demo forms
 */
export async function navigateToPurchaseForm(page: Page): Promise<void> {
  await page.goto('/purchase', { waitUntil: 'domcontentloaded' });
  await expect(
    page.getByRole('heading', { name: /purchase form/i, level: 1 })
  ).toBeVisible();
}

export async function navigateToBusinessHoursForm(page: Page): Promise<void> {
  await page.goto('/business-hours', { waitUntil: 'domcontentloaded' });
  await expect(
    page.getByRole('heading', { name: /business hours form/i, level: 1 })
  ).toBeVisible();
}

export async function navigateToValidationConfigDemo(
  page: Page
): Promise<void> {
  await page.goto('/validation-config-demo', { waitUntil: 'domcontentloaded' });
  await expect(
    page.getByRole('heading', { name: /validation config demo/i, level: 1 })
  ).toBeVisible();
}

export async function navigateToAutoSaveDemo(page: Page): Promise<void> {
  await page.goto('/auto-save-demo');
  await expect(
    page.getByRole('heading', { name: /auto-save draft demo/i, level: 1 })
  ).toBeVisible();
}

export async function navigateToDateRangeAdapter(page: Page): Promise<void> {
  await page.goto('/date-range-adapter');
  await expect(
    page.getByRole('heading', {
      name: /composite adapter recipe/i,
      level: 1,
    })
  ).toBeVisible();
}

export function getMainContentSidebar(page: Page): Locator {
  return page.getByRole('main').getByRole('complementary').first();
}

/**
 * Wait for async validation to complete by monitoring aria-busy attribute
 */
export async function waitForValidationToComplete(
  field: Locator,
  timeout = 5000
): Promise<void> {
  await expect(field).not.toHaveAttribute('aria-busy', 'true', { timeout });
}

/**
 * Assert that a field has validation errors
 *
 * Checks, in order:
 * - Angular validation state (ng-invalid class), stable for a short window
 * - aria-invalid="true" on the field (hard assertion)
 * - optionally, that an aria-describedby target contains the expected error text
 *
 * @param field - The form field locator
 * @param expectedError - Optional error message to verify
 */
export async function expectFieldHasError(
  field: Locator,
  expectedError?: string | RegExp
): Promise<void> {
  const STABILITY_DURATION_MS = 100; // Field must remain invalid for this long
  const ERROR_MESSAGE_TIMEOUT = 3000; // Time to find error message in described-by elements
  const page = field.page();

  // Wait for the field to have ng-invalid class AND remain stable
  // Note: We check for stability on the FIELD itself, not the whole page.
  // Other fields may be validating concurrently.
  let stableStartTime: number | null = null;

  await expect
    .poll(
      async () => {
        // Check if THIS field is busy (not the whole page)
        const fieldBusy = (await field.getAttribute('aria-busy')) === 'true';
        if (fieldBusy) {
          stableStartTime = null;
          return false;
        }

        const classes = await field.getAttribute('class');
        const isInvalid = classes?.includes('ng-invalid') ?? false;

        if (!isInvalid) {
          stableStartTime = null;
          return false;
        }

        // Start stability timer if this is the first check where field is invalid
        if (stableStartTime === null) {
          stableStartTime = Date.now();
        }

        // Check if we've been stable for long enough
        const stableDuration = Date.now() - stableStartTime;
        return stableDuration >= STABILITY_DURATION_MS;
      },
      {
        message: `Field should have ng-invalid class (stable for ${STABILITY_DURATION_MS}ms)`,
        timeout: VALIDATION_TIMEOUT,
        intervals: QUICK_INTERVALS,
      }
    )
    .toBe(true);

  await expect(field).toHaveAttribute('aria-invalid', 'true', {
    timeout: 1500,
  });

  if (expectedError) {
    // Poll for the error message to appear in aria-describedby elements
    // This handles timing issues where describedby IDs update after validation
    await expect
      .poll(
        async () => {
          const describedBy = await field.getAttribute('aria-describedby');
          const ids = describedBy?.split(/\s+/).filter(Boolean) ?? [];

          if (ids.length === 0) {
            return { found: false, reason: 'no-describedby' };
          }

          for (const id of ids) {
            const candidate = page.locator(`#${id}`);
            if ((await candidate.count()) === 0) {
              continue;
            }

            const text = await candidate.textContent();
            if (text) {
              const matches =
                typeof expectedError === 'string'
                  ? text.includes(expectedError)
                  : expectedError.test(text);
              if (matches) {
                return { found: true };
              }
            }
          }

          return { found: false, reason: 'no-match' };
        },
        {
          message: `Error message should match: ${expectedError}`,
          timeout: ERROR_MESSAGE_TIMEOUT,
          intervals: [...QUICK_INTERVALS, 1000],
        }
      )
      .toMatchObject({ found: true });
  }
}

/**
 * Assert that a field has no validation errors
 * Uses expect.poll() with stability checking to handle bidirectional validation timing
 */
export async function expectFieldValid(field: Locator): Promise<void> {
  const STABILITY_DURATION_MS = 100; // Field must remain valid for this long

  // Wait for the field to have ng-valid class AND remain stable
  // Note: We check for stability on the FIELD itself, not the whole page.
  let stableStartTime: number | null = null;

  await expect
    .poll(
      async () => {
        // Check if THIS field is busy (not the whole page)
        const fieldBusy = (await field.getAttribute('aria-busy')) === 'true';
        if (fieldBusy) {
          stableStartTime = null;
          return false;
        }

        const classes = await field.getAttribute('class');
        const isValid = classes?.includes('ng-valid') ?? false;

        if (!isValid) {
          stableStartTime = null;
          return false;
        }

        // Start stability timer if this is the first check where field is valid
        if (stableStartTime === null) {
          stableStartTime = Date.now();
        }

        // Check if we've been stable for long enough
        const stableDuration = Date.now() - stableStartTime;
        return stableDuration >= STABILITY_DURATION_MS;
      },
      {
        message: `Field should have ng-valid class (stable for ${STABILITY_DURATION_MS}ms)`,
        timeout: VALIDATION_TIMEOUT,
        intervals: QUICK_INTERVALS,
      }
    )
    .toBe(true);

  await expect(field).not.toHaveAttribute('aria-invalid', 'true', {
    timeout: 1500,
  });
}

/**
 * Fill a text input and trigger blur to activate validation.
 * Uses keyboard interactions (select-all + backspace + type) to better
 * simulate real user input. This is important for masked inputs and for
 * Angular's template-driven forms which rely on input events.
 *
 * EXCEPTION: For date/time inputs (type="date", "time", "datetime-local"),
 * uses Playwright's fill() directly because keyboard input doesn't work
 * reliably with browser date pickers.
 */
export async function fillAndBlur(
  field: Locator,
  value: string
): Promise<void> {
  // Date/time inputs require direct fill() - keyboard typing doesn't work
  const inputType = await field.getAttribute('type');
  if (
    inputType === 'date' ||
    inputType === 'time' ||
    inputType === 'datetime-local'
  ) {
    await setDateLikeValueAndBlur(field, value);
    return;
  }

  await typeAndBlur(field, value, 0);
}

/**
 * Set value on date/time-like inputs and dispatch events to trigger Angular change detection.
 * This avoids Playwright limitations with type="date" value setting across browsers.
 */
export async function setDateLikeValueAndBlur(
  field: Locator,
  value: string
): Promise<void> {
  await field.click();
  await field.evaluate((el, nextValue) => {
    const input = el as HTMLInputElement;
    input.value = nextValue as string;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
  await field.blur();
}

/**
 * Fill a native date input using Playwright's browser-level interaction helpers.
 * This is more reliable than synthetic event dispatch for ngModel-backed date fields
 * when validating bidirectional revalidation behavior.
 */
export async function fillNativeDateInputAndBlur(
  field: Locator,
  value: string
): Promise<void> {
  await field.fill(value);
  await field.blur();
}

/**
 * Type into a text input character by character and trigger blur.
 * This simulates real user typing which properly triggers Angular's
 * input events and valueChanges - essential for bidirectional
 * validation in ValidationConfig to work correctly in tests.
 *
 * Use this instead of fillAndBlur when testing bidirectional/cross-field
 * validation where changing one field should trigger revalidation of another.
 *
 * @param field - The input locator
 * @param value - The value to type
 * @param delay - Delay between keystrokes in ms (default: 50)
 */
export async function typeAndBlur(
  field: Locator,
  value: string,
  delay = 50
): Promise<void> {
  await field.click();

  const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
  await field.press(`${modifier}+A`);
  await field.press('Backspace');

  if (value.length > 0) {
    await field.pressSequentially(value, { delay });
  }

  await field.blur();
}

/**
 * Get the warning element associated with a form field.
 * Polls until aria-describedby contains a warning id, or a nearby status element
 * with non-validating text appears (fallback for timing/association delays).
 *
 * @param field - The form field locator (typically a password input)
 * @param warningTextPattern - Optional regex to match warning text content
 * @returns The warning element locator
 */
export async function getWarningElementFor(
  field: Locator,
  warningTextPattern?: RegExp
): Promise<Locator> {
  let warningId: string | null = null;
  let fallbackLocator: Locator | null = null;
  const fieldContainer = field.locator('..').locator('..');
  const page = field.page();

  await expect
    .poll(
      async () => {
        const describedBy = await field.getAttribute('aria-describedby');
        const ids = describedBy?.split(/\s+/).filter(Boolean) ?? [];
        warningId = ids.find((id) => id.includes('-warning')) ?? null;
        if (warningId) {
          return true;
        }

        const statusCandidates = fieldContainer.locator('[role="status"]');
        const statusCount = await statusCandidates.count();
        for (let i = 0; i < statusCount; i += 1) {
          const text = (await statusCandidates.nth(i).textContent()) ?? '';
          if (!text.trim() || /validating/i.test(text)) {
            continue;
          }
          if (warningTextPattern && !warningTextPattern.test(text)) {
            continue;
          }
          fallbackLocator = statusCandidates.nth(i);
          return true;
        }

        if (warningTextPattern) {
          const globalStatus = page
            .locator('[role="status"]')
            .filter({ hasText: warningTextPattern });
          if ((await globalStatus.count()) > 0) {
            fallbackLocator = globalStatus.first();
            return true;
          }
        }

        return false;
      },
      {
        message: 'Waiting for warning id or warning status element',
        timeout: VALIDATION_TIMEOUT,
        intervals: EXTENDED_INTERVALS,
      }
    )
    .toBe(true);

  if (!warningId) {
    if (fallbackLocator) {
      return fallbackLocator;
    }
    throw new Error('Expected warning element to be present');
  }

  return page.locator(`#${warningId}`);
}

/**
 * Wait for validation to settle by checking that no elements are busy.
 * This is more reliable than hard-coded waits.
 *
 * Key improvements over a simple "check once" approach:
 * 1. Initial grace period to let Angular start validation (prevents returning before validation begins)
 * 2. Checks both aria-busy AND "Validating..." text indicators
 * 3. Requires the settled state to persist for a stability period
 *    (prevents false positives when validation restarts quickly)
 *
 * @param page - The Playwright page
 * @param timeout - Maximum time to wait for validation to settle
 */
export async function waitForValidationToSettle(
  page: Page,
  timeout = VALIDATION_TIMEOUT
): Promise<void> {
  const STABILITY_DURATION_MS = 150; // Require stable state for this long
  const STABILITY_CHECK_INTERVAL_MS = 50;

  const busyElements = page.locator('[aria-busy="true"]:visible');
  const validatingText = page.getByText('Validating…');

  let stableStartTime: number | null = null;

  await expect
    .poll(
      async () => {
        const busyCount = await busyElements.count();
        const validatingCount = await validatingText.count();
        const isCurrentlySettled = busyCount === 0 && validatingCount === 0;

        if (!isCurrentlySettled) {
          // Reset stability timer when not settled
          stableStartTime = null;
          return false;
        }

        // Start stability timer if this is the first settled check
        if (stableStartTime === null) {
          stableStartTime = Date.now();
        }

        // Check if we've been stable for long enough
        const stableDuration = Date.now() - stableStartTime;
        return stableDuration >= STABILITY_DURATION_MS;
      },
      {
        message: `Waiting for validation to settle (stable for ${STABILITY_DURATION_MS}ms)`,
        timeout,
        intervals: [STABILITY_CHECK_INTERVAL_MS], // Use consistent interval for stability checking
      }
    )
    .toBe(true);
}

/**
 * Wait for form to finish processing changes (submit, reset, etc).
 * Uses expect.poll() to ensure Angular change detection has completed.
 *
 * This function is similar to waitForValidationToSettle but with a shorter
 * stability period since form operations typically respond faster.
 *
 * @param page - The Playwright page
 * @param timeout - Maximum time to wait
 */
export async function waitForFormProcessing(
  page: Page,
  timeout = VALIDATION_TIMEOUT
): Promise<void> {
  const STABILITY_DURATION_MS = 100; // Shorter stability for form processing
  const STABILITY_CHECK_INTERVAL_MS = 50;

  const busyElements = page.locator('[aria-busy="true"]:visible');
  const validatingText = page.getByText('Validating…');

  let stableStartTime: number | null = null;

  await expect
    .poll(
      async () => {
        const busyCount = await busyElements.count();
        const validatingCount = await validatingText.count();
        const isCurrentlySettled = busyCount === 0 && validatingCount === 0;

        if (!isCurrentlySettled) {
          stableStartTime = null;
          return false;
        }

        if (stableStartTime === null) {
          stableStartTime = Date.now();
        }

        const stableDuration = Date.now() - stableStartTime;
        return stableDuration >= STABILITY_DURATION_MS;
      },
      {
        message: `Waiting for form processing to complete (stable for ${STABILITY_DURATION_MS}ms)`,
        timeout,
        intervals: [STABILITY_CHECK_INTERVAL_MS],
      }
    )
    .toBe(true);
}

const NGX_DIAGNOSTIC_PATTERN =
  /\[NGX-\d{3}\]|ValidationConfigBuilder:|validationConfig: timed out/;

export type NgxDiagnosticCapture = {
  readonly messages: string[];
  readonly dispose: () => void;
  readonly expectNoUnexpectedDiagnostics: (
    allowedPatterns?: readonly RegExp[]
  ) => void;
};

/**
 * Capture browser-side ngx-vest-forms development diagnostics during an E2E flow.
 * Use this around demo interactions that should follow recommended ownership and
 * wrapper patterns. Expected diagnostics can be allowed explicitly per test.
 */
export function captureNgxVestDiagnostics(page: Page): NgxDiagnosticCapture {
  const messages: string[] = [];
  const onConsole = (message: ConsoleMessage): void => {
    const text = message.text();
    if (NGX_DIAGNOSTIC_PATTERN.test(text)) {
      messages.push(text);
    }
  };

  page.on('console', onConsole);

  return {
    messages,
    dispose: () => page.off('console', onConsole),
    expectNoUnexpectedDiagnostics: (allowedPatterns = []) => {
      const unexpected = messages.filter(
        (message) => !allowedPatterns.some((pattern) => pattern.test(message))
      );
      expect(unexpected).toEqual([]);
    },
  };
}

/**
 * Field values for {@link fillAndSubmitInOneTick}, keyed by control `name`.
 * A boolean sets a checkbox; a string sets an input or textarea, or picks the
 * `<select>` option whose text contains it.
 */
export type OneTickFieldValues = Record<string, string | boolean>;

/**
 * Sets every field and clicks submit inside one `page.evaluate`, so no task
 * boundary separates the last edit from the submit. Playwright's `fill()` and
 * `click()` add enough delay to hide submit handlers that read validity before
 * validation has caught up; an autofill followed by Enter does not.
 */
export async function fillAndSubmitInOneTick(
  page: Page,
  values: OneTickFieldValues,
  submitLabel: RegExp
): Promise<void> {
  await page.evaluate(
    ({ values, source, flags }) => {
      for (const [name, value] of Object.entries(values)) {
        const field = document.querySelector<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >(`form [name="${name}"]`);
        if (!field) {
          throw new Error(`No field named "${name}"`);
        }
        if (field instanceof HTMLSelectElement) {
          const index = [...field.options].findIndex((option) =>
            option.text.includes(String(value))
          );
          if (index < 0) {
            throw new Error(`No option "${value}" in "${name}"`);
          }
          field.selectedIndex = index;
          field.dispatchEvent(new Event('change', { bubbles: true }));
        } else if (typeof value === 'boolean') {
          (field as HTMLInputElement).checked = value;
          field.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
          field.value = value;
          field.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
      const pattern = new RegExp(source, flags);
      const submit = [
        ...document.querySelectorAll<HTMLButtonElement>(
          'form button[type="submit"]'
        ),
      ].find((button) => pattern.test(button.textContent ?? ''));
      if (!submit) {
        throw new Error(`No submit button matching ${pattern}`);
      }
      submit.click();
    },
    { values, source: submitLabel.source, flags: submitLabel.flags }
  );
}
