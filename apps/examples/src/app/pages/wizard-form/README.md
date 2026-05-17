# Multi-Form Wizard

Run three coordinated forms with per-step validation and one final submission
flow.

## Why this demo exists

Multi-step registration and checkout flows are a common requirement, and they
raise two hard questions: how do you validate each step independently while
still treating the whole thing as one submission, and how do you keep entered
data and validity intact as the user moves back and forth? This demo answers
both with `ngx-vest-forms`, using one Vest suite and one model per step plus a
parent page that orchestrates navigation, validity, and the final submit.

## What it does

- Three steps — **Account**, **Profile**, **Review** — each rendered by its own
  form component (`wizard-step1/2/3.form.ts`) with its own suite and model.
- `Next` validates only the current step. If valid it advances; if not, focus
  moves to the step's first invalid control.
- The final submit calls `submitAll()`, which re-validates every step, and on
  failure jumps to and focuses the first invalid step.
- Step 1 demonstrates bidirectional confirmation validation (email and
  password). Step 2 demonstrates conditional validation (newsletter frequency
  required only when subscribed), with the validation config rebuilt inside a
  `computed()`. Step 3 demonstrates an `optional()` comments field.
- Step data and per-step validity live in page-level signals, so navigating
  back never discards what the user entered.
- Sidebar status badges reflect per-step validity and overall readiness.

## ngx-vest-forms APIs showcased

- `createValidationConfig<T>()` with `.bidirectional()` (Step 1) and
  `.whenChanged()` rebuilt reactively (Step 2).
- Per-step form components exposing `isValid()`, `validatedFields()`,
  `pending()`, `markAllAsTouched()`, and `focusFirstInvalidControl()`.
- `NgxFirstInvalidOptions` to customize scroll/focus on Step 2's invalid
  submit.
- Vest `optional()` so a blank `comments` field does not block validity but
  is still validated when filled.

## Key files

- `wizard-form.page.ts` — step state, validity signals, navigation, final
  submit, focus orchestration.
- `wizard.form.ts` / `wizard.form.html` — body that switches the active step
  component and forwards step APIs to the page.
- `wizard-step1.form.ts`, `wizard-step2.form.ts`, `wizard-step3.form.ts` —
  individual step forms.
- `wizard.validations.ts` — the three Vest suites (bidirectional, conditional,
  optional).
- `wizard-form.content.ts` — in-app "What this demonstrates / learn" cards.

## Behavior notes

- Advancing requires the current step to be valid; the final submit re-checks
  all steps regardless of how the user navigated.
- Validity and entered data persist across step navigation by design.
- Focus management deliberately differs on Step 2 to show
  `NgxFirstInvalidOptions` in use.
