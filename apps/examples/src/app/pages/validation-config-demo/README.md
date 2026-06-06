# Validation Config Demo

A focused look at `createValidationConfig()` — the single map that tells
ngx-vest-forms which fields depend on which, so a change to one field
revalidates the others without manual subscriptions.

## Why it exists

Cross-field validation is easy to get subtly wrong: you update a password and
the confirm field keeps its stale error, or a conditional field never
re-validates after a toggle. This demo isolates the dependency-config concept
and shows every flavour of relationship in one form.

## What it does

Builds one `validationConfig` covering five relationships:

- `password` ↔ `confirmPassword` (bidirectional)
- `quantity` ↔ `quantityJustification` (bidirectional)
- `startDate` ↔ `endDate` (bidirectional)
- `requiresJustification` → `justification` (one-way `whenChanged`)
- `country` → `[state, zipCode]` (one-way `whenChanged`, fan-out)

The Vest suite backs these with `omitWhen`-gated rules: confirm-password and
match checks only run when a password exists, justification is required only
when the toggle is on, state/postal code only when a country is chosen, and the
"end date after start date" rule only when both dates are set. A non-blocking
`warn()` recommends 12+ character passwords.

The page splits feedback into **errors**, **info** (date-range messages routed
separately), **warnings**, **validated fields**, and **pending**.

## ngx-vest-forms APIs showcased

- `createValidationConfig()` with `.bidirectional()` and `.whenChanged()`
  (including a fan-out to multiple dependents)
- `NgxVestForms`, `FormDirective`, `provideFormContract`
- `createFormFeedbackSignals()` for `formState`, `warnings`,
  `validatedFields`, `pending`
- `FormDirective.resetForm()`
- `NgxVestSuite` / Vest `create`, `test`, `enforce`, `omitWhen`, `warn`

## Key files

- `validation-config-demo.page.ts` / `.html` — page shell and the
  `validationConfig` definition, plus error/info partitioning
- `validation-config-demo.form.ts` / `.html` — the form body component
- `validation-demo.validations.ts` — the Vest suite
- `../../models/validation-demo.model.ts` — model and contract

## Behaviour notes

- `whenChanged` is one-directional on purpose: changing `requiresJustification`
  revalidates `justification`, but typing in `justification` does not re-run the
  toggle.
- `country` → `[state, zipCode]` shows a single source fanning out to multiple
  dependents in one call.
- Date messages are pulled out of the error stream and shown as info so the
  range hint reads as guidance rather than a hard failure.
