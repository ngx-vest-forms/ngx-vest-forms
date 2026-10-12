# Display Modes Demo

Compare error and warning visibility timing across display modes.

## Why this demo exists

When validation feedback appears is a UX decision as important as the rules
themselves. Showing every error immediately can feel hostile; hiding it until
submit can feel unhelpful. `ngx-vest-forms` lets you choose the timing per
field for errors and warnings independently. This demo puts all of those modes
on a single form so the differences are visible side by side, and shows how a
parent component can drive an on-submit reveal programmatically.

## What it does

- One form, one model, one Vest suite. Each field is wrapped in
  `ngx-control-wrapper` with an explicit `errorDisplayMode` or
  `warningDisplayMode`.
- Error modes shown: `always` (visible even while pristine), `on-dirty`
  (after the value changes), and `on-submit` (stays quiet until the form is
  submitted programmatically).
- Warning modes shown: `always`, `on-dirty`, and `on-touch` (after blur).
- The form runs `triggerFormValidation()` on first render, so the contrast
  between modes is visible immediately without any interaction.
- An external "Programmatically submit demo form" button simulates a
  parent-controlled submit: it calls `NgForm.onSubmit()`, then
  `markAllAsTouched()`, then `triggerFormValidation()` to reveal the
  `on-submit` field.
- Errors are blocking (`enforce`); warnings are non-blocking (Vest `warn()`).
  Both are validated by the same suite but surfaced separately.

## ngx-vest-forms APIs showcased

- `ngx-control-wrapper` with `[errorDisplayMode]` and `[warningDisplayMode]`
  inputs.
- `NgxVestForms` directive bundle and the `ngxVestForm` template directive.
- `FormDirective` methods: `triggerFormValidation()`, `markAllAsTouched()`,
  and `ngForm.onSubmit()`.
- `createFormFeedbackSignals()` exposing `formState`, `warnings`,
  `validatedFields`, and `pending`.
- Vest `warn()` for non-blocking warnings alongside `enforce()` errors.

## Key files

- `display-modes-demo.page.ts` — thin page wrapper holding the model signal.
- `display-modes-demo.form.ts` / `.form.html` — the form body, per-field
  display modes, render-time validation, and programmatic submit.
- `display-modes-demo.validations.ts` — Vest suite with parallel error and
  warning tests.
- `display-modes-demo.content.ts` — in-app "What this demonstrates / learn"
  cards.

## Behavior notes

- The form deliberately validates on render so a developer can see each mode's
  timing without touching the inputs.
- The `on-submit` field only reveals its error through the external
  programmatic-submit button, mirroring a parent-controlled submit flow.
- Warnings never block submission; they are tracked and displayed separately
  from errors.
