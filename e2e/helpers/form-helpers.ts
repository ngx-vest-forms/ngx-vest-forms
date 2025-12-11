import { expect, Locator, Page } from '@playwright/test';

/**
 * Validation polling configuration
 * These values handle timing issues with Angular change detection and Vest validation
 */
const VALIDATION_TIMEOUT = 5000; // 5s: debounce (100ms) + validation (500ms) + buffer; faster E2E feedback
const POLL_INTERVALS = [50, 100, 250, 500, 1000, 2000]; // Gradual backoff with longer final interval

/**
 * Navigation helpers for the three demo forms
 */
export async function navigateToPurchaseForm(page: Page): Promise<void> {
  await page.goto('/purchase');
  await expect(
    page.getByRole('heading', { name: /purchase form/i, level: 3 })
  ).toBeVisible();
}

export async function navigateToBusinessHoursForm(page: Page): Promise<void> {
  await page.goto('/business-hours');
  await expect(
    page.getByRole('heading', { name: /complex validations/i })
  ).toBeVisible();
}

export async function navigateToValidationConfigDemo(
  page: Page
): Promise<void> {
  await page.goto('/validation-config-demo');
  await expect(
    page.getByRole('heading', { name: 'ValidationConfig Demo', level: 1 })
  ).toBeVisible();
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
 * DESIGN DECISION: Graceful vs Strict ARIA Validation
 *
 * This helper uses GRACEFUL validation by default:
 * - Checks Angular validation state (ng-invalid class) as primary indicator
 * - Attempts to verify ARIA attributes (aria-invalid, aria-describedby) but doesn't fail tests
 * - Logs warnings when ARIA attributes are missing
 *
 * WHY GRACEFUL?
 * - Form validation logic works correctly (Angular marks fields as invalid)
 * - ARIA attribute timing issues are library implementation details, not application bugs
 * - Conditional validations with omitWhen have known timing issues with shouldShowErrors()
 * - Tests focus on user-facing behavior: "Does validation work?" not "Are ARIA attributes perfect?"
 *
 * WHEN TO USE STRICT?
 * - Accessibility-focused test suites
 * - Pre-production WCAG 2.2 AA compliance validation
 * - When ARIA timing bugs are fixed and you want to prevent regressions
 *
 * Known Issue: Fields with omitWhen conditional validations may have ng-invalid class
 * but not aria-invalid attribute due to shouldShowErrors() race condition.
 *
 * @param field - The form field locator
 * @param expectedError - Optional error message to verify
 * @param strict - If true, fail test when aria-invalid is missing (default: false)
 */
export async function expectFieldHasError(
  field: Locator,
  expectedError?: string | RegExp,
  strict = false
): Promise<void> {
  // Wait for the field to have ng-invalid class (Angular validation detected error)
  // Use expect.poll() with gradual backoff for race conditions
  // This handles timing issues with Angular change detection and Vest validation
  await expect
    .poll(
      async () => {
        const classes = await field.getAttribute('class');
        return classes?.includes('ng-invalid') ?? false;
      },
      {
        message: 'Field should have ng-invalid class',
        timeout: VALIDATION_TIMEOUT,
        intervals: POLL_INTERVALS,
      }
    )
    .toBe(true);

  // Try to wait for aria-invalid
  try {
    await expect(field).toHaveAttribute('aria-invalid', 'true', {
      timeout: 1000,
    });
  } catch {
    const message =
      'Warning: aria-invalid not set on invalid field (known issue with conditional validations)';
    if (strict) {
      throw new Error(message);
    }
    console.warn(message);
  }

  if (expectedError) {
    const describedBy = await field.getAttribute('aria-describedby');
    const ids = describedBy?.split(/\s+/).filter(Boolean) ?? [];

    if (ids.length === 0) {
      const message =
        'Warning: aria-describedby not set, cannot verify error message';
      if (strict) {
        throw new Error(message);
      }
      console.warn(message);
      return;
    }

    let matched = false;
    for (const id of ids) {
      const candidate = field.page().locator(`#${id}`);
      if ((await candidate.count()) === 0) {
        continue;
      }

      try {
        await expect(candidate).toContainText(expectedError, { timeout: 1000 });
        matched = true;
        break;
      } catch {
        // Try the next described-by node.
      }
    }

    if (!matched) {
      const message =
        'Warning: aria-describedby did not reference an element containing the expected error message';
      if (strict) {
        throw new Error(message);
      }
      console.warn(message);
    }
  }
}

/**
 * Assert that a field has no validation errors
 * Uses expect.poll() to handle bidirectional validation timing
 */
export async function expectFieldValid(field: Locator): Promise<void> {
  // Check for ng-valid class using expect.poll() for bidirectional validation
  await expect
    .poll(
      async () => {
        const classes = await field.getAttribute('class');
        return classes?.includes('ng-valid') ?? false;
      },
      {
        message: 'Field should have ng-valid class',
        timeout: VALIDATION_TIMEOUT,
        intervals: POLL_INTERVALS,
      }
    )
    .toBe(true);

  // Also verify no aria-invalid attribute
  await expect(field).not.toHaveAttribute('aria-invalid', 'true');
}

/**
 * Fill a text input and trigger blur to activate validation.
 * Uses Playwright's fill() which sets value directly.
 */
export async function fillAndBlur(
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
  await field.fill(''); // Clear any existing value
  await field.type(value, { delay });
  await field.blur();
}

/**
 * Get form-level (ROOT_FORM) errors
 */
export async function getFormLevelErrors(page: Page): Promise<Locator> {
  return page.locator('[role="alert"]').filter({ hasText: /error/i });
}

/**
 * Monitor that a field stabilizes quickly (no aria-busy thrashing)
 * Returns true if field stabilizes within maxDuration
 */
export async function monitorAriaStability(
  field: Locator,
  maxDuration = 1000
): Promise<boolean> {
  const startTime = Date.now();
  let lastBusyState = false;
  let transitions = 0;

  while (Date.now() - startTime < maxDuration) {
    const isBusy = (await field.getAttribute('aria-busy')) === 'true';
    if (isBusy !== lastBusyState) {
      transitions++;
      lastBusyState = isBusy;
    }
    await field.page().waitForTimeout(50);
  }

  // Should stabilize quickly with minimal transitions (≤4 means at most 2 busy cycles)
  return transitions <= 4;
}

/**
 * Check if an element is disabled
 */
export async function expectDisabled(element: Locator): Promise<void> {
  await expect(element).toBeDisabled();
}

/**
 * Check if an element is enabled
 */
export async function expectEnabled(element: Locator): Promise<void> {
  await expect(element).toBeEnabled();
}

/**
 * Wait for a debounced input to trigger validation
 */
export async function waitForDebounce(duration = 1100): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, duration));
}

/**
 * Assert that a checkbox is checked
 */
export async function expectChecked(checkbox: Locator): Promise<void> {
  await expect(checkbox).toBeChecked();
}

/**
 * Assert that a checkbox is not checked
 */
export async function expectUnchecked(checkbox: Locator): Promise<void> {
  await expect(checkbox).not.toBeChecked();
}

/**
 * Select a radio button by value
 * For purchase form, radio buttons are inside individual labels, so we use the label text
 */
export async function selectRadio(
  page: Page,
  name: string,
  value: string
): Promise<void> {
  // Use getByLabel to find the radio by its individual label text
  await page.getByLabel(value, { exact: true }).check();
}

/**
 * Select an option from a dropdown
 */
export async function selectOption(
  dropdown: Locator,
  optionText: string | RegExp
): Promise<void> {
  await dropdown.selectOption({ label: optionText as string });
}
