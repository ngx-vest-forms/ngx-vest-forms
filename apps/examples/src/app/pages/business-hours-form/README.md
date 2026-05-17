# Business Hours Form

Validation for a dynamic collection of time ranges, where the rules span both
individual entries and the collection as a whole.

## Why it exists

Form arrays are where validation usually breaks: entries appear and disappear,
cross-field rules need to re-run, and form-level invariants (like "no overlap")
depend on every entry at once. This demo is the canonical answer to "how do I
validate a list whose shape changes at runtime".

## What it does

- Renders a keyed map of business hours, each with a `from` and `to` time, plus
  an "add new" row.
- Validates **every entry** by iterating the record with Vest `each()` and
  emitting tests under `businessHours.values.<key>.*`.
- Applies a **per-entry cross-field rule**: `to` must be later than `from`.
- Applies two **ROOT_FORM rules**: at least one entry must exist, and no two
  ranges may overlap.
- Keeps the **add-new row** non-blocking while both inputs are empty
  (`allowEmptyPair`), and validates it as a pair once the user starts typing.
- After a structural add/remove, the page calls `triggerFormValidation()` so
  the ROOT_FORM and conditional rules re-evaluate against the new structure.

## ngx-vest-forms APIs showcased

- `NgxVestForms`, `FormDirective`, `provideFormContract`
- `createValidationConfig().bidirectional()` pairing the add-new `from`/`to`
- `FormDirective.triggerFormValidation()` for manual revalidation after
  structural changes
- `createFormFeedbackSignals()` for `formState`, `warnings`,
  `validatedFields`, `pending`
- `ROOT_FORM` token for form-level errors
- `NgxVestSuite` / Vest `create`, `each`, `test`, `enforce`, `omitWhen`

## Key files

- `business-hours.page.ts` / `.html` — page shell, validationConfig, and the
  structural-change handler that triggers revalidation
- `business-hours.form.ts` / `.html` — the form body component
- `business-hours.validations.ts` — the suite, time parsing, and overlap logic
- `ui/business-hours/business-hours.component.ts` — the add/remove UI
- `../../models/business-hours-form.model.ts` — model, contract, initial value

## Behaviour notes

- `omitWhen` controls *whether* a test runs; `validationConfig` controls *when*
  Angular asks for revalidation. The add-new pair needs both, which is why the
  suite documents the `bidirectional()` requirement inline.
- Time format accepts `HH:MM` or a 4-digit `HHMM` string; invalid times skip the
  cross-field comparison so users see a format error first.
- Adding/removing an entry clears the add-new slot to keep the UI ready for the
  next entry.
