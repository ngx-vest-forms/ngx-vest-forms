---
name: playwright
description: Playwright E2E testing guidance for writing, refactoring, and stabilizing browser tests. Use when creating or updating Playwright tests, improving flaky test reliability, adding network mocking, or validating accessibility-focused UI behavior in this repository.
---

# Playwright E2E Testing Guidance

Apply this skill for Playwright tests in this workspace.

## Core Principles

1. Use user-facing locators first: `getByRole`, `getByLabel`, `getByText`.
2. Use web-first assertions with `await expect(...)` and avoid manual waits.
3. Avoid brittle selectors and fixed sleeps.
4. Test behavior users observe, not internal implementation.
5. Keep tests isolated and deterministic.

## Repository Conventions

- Import from `@playwright/test`.
- Group related scenarios with `test.describe()`.
- Use `test.beforeEach()` for shared setup.
- Use `test.step()` for readability of multi-step flows.
- Use descriptive titles: `Feature - scenario`.
- Prefer one test file per major page/feature.

## Locator and Assertion Rules

- Prefer semantic locators over CSS/XPath selectors.
- Use assertions like:
  - `toHaveText` / `toContainText`
  - `toHaveURL`
  - `toHaveCount`
  - `toMatchAriaSnapshot` for accessibility-tree checks where valuable
- Use `toBeVisible` when visibility is the behavior under test.

## Flake-Resistance Rules

- Do not use hard-coded sleeps (`waitForTimeout`) unless explicitly justified.
- Rely on Playwright auto-waiting and web-first assertions.
- Keep each test independent; avoid state leakage between tests.
- Stabilize async UI checks with locator assertions instead of manual polling loops.

## Network and Third-Party Dependencies

- Mock external/third-party dependencies you do not control.
- Use Playwright routing (`page.route` / `context.route`) and `route.fulfill` for deterministic responses.
- Use MSW where project test architecture already uses it and shared mock behavior is beneficial.

## Recommended Workflow

1. Identify user journey and expected outcomes.
2. Write the happy path using semantic locators.
3. Add edge/error states.
4. Add network mocks for unstable dependencies.
5. Run focused tests, then broader suite.
6. Refine for clarity and flake resistance.

## Minimal Pattern

```ts
import { test, expect } from '@playwright/test';

test.describe('Feature - action', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Feature - happy path', async ({ page }) => {
    await test.step('Submit form', async () => {
      await page.getByRole('textbox', { name: 'Email' }).fill('user@example.com');
      await page.getByRole('button', { name: 'Submit' }).click();
    });

    await test.step('Verify outcome', async () => {
      await expect(page.getByRole('status')).toContainText('Success');
      await expect(page).toHaveURL(/success/);
    });
  });
});
```

## Final Checklist

- Locators are semantic and resilient.
- Assertions are web-first and meaningful.
- No unnecessary hard waits.
- Tests are logically grouped and clearly named.
- Coverage includes happy path and edge/error scenarios.
