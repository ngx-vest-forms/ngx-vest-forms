---
description: 'Minimal Playwright guardrails; delegate detailed guidance to the playwright skill'
applyTo: 'e2e/**/*.{spec,test}.{ts,tsx,js,jsx}, tests/**/*.{spec,test}.{ts,tsx,js,jsx}'
---

# Playwright testing instructions (minimal)

Use the detailed skill at `.github/skills/playwright/SKILL.md` for full guidance.

Non-negotiables for this repository:

- Prefer user-facing locators (`getByRole`, `getByLabel`, `getByText`) over brittle selectors.
- Use web-first assertions with `await expect(...)`; avoid hard waits unless explicitly justified.
- Keep tests deterministic: mock unstable external dependencies (Playwright route mocking or MSW where appropriate).
- Use descriptive scenario naming and structure tests with `test.describe`, `test.beforeEach`, and `test.step` when helpful.
