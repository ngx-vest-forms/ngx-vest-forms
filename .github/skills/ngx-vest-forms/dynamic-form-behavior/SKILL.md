---
name: dynamic-form-behavior
description: Helps developers handle dynamic ngx-vest-forms layouts with `clearFieldsWhen`, `clearFields`, `keepFieldsWhen`, and `triggerFormValidation()`. Use this whenever the user conditionally shows or hides form sections, swaps inputs for static content, clears hidden values, sees stale validation after structure changes, or mentions dynamic forms, field clearing, or `triggerFormValidation`.
---

# ngx-vest-forms dynamic form guidance

Use this skill when the form structure changes at runtime.

## Most important distinction

You usually need manual help only when the UI switches between:

- a real form control (`input`, `select`, `textarea`)
- and non-form content (`p`, `div`, static explanatory content)

That is the danger zone for stale component state and stale validity.

You usually do **not** need `triggerFormValidation()` just because one input swapped to another input and Angular already emitted normal control/value changes.

## Recommended workflow

1. Update the component state first.
2. Clear now-irrelevant fields with:
   - `clearFieldsWhen()` for conditional clearing
   - `clearFields()` for unconditional cleanup
   - `keepFieldsWhen()` for whitelist-style preservation
3. If the structure changed in a way Angular will not naturally revalidate, call `triggerFormValidation()` on the `FormDirective`.
4. Keep the Vest suite aligned with the UI by using `omitWhen(...)` or similar conditional validation patterns.

Prefer public API imports from `'ngx-vest-forms'`:

- `clearFieldsWhen`
- `clearFields`
- `keepFieldsWhen`
- `FormDirective`

If you mention `triggerFormValidation()`, frame it as a capability on the public form directive/API surface instead of sending consumers into internal implementation files.

## When to call `triggerFormValidation()`

Call it when:

- a control disappears and is replaced by non-input content
- a section is cleared and no remaining control change will naturally rerun validation
- a dynamic mode change invalidates the current layout without a normal value-change path

Do not oversell it as a “show errors” API. It only re-runs validation logic. It does not mark controls touched.

## Interactions with other features

- If a field depends on another field’s value, use `validationConfig` as well.
- If the rule belongs to the whole form, use `ROOT_FORM`.
- Dynamic forms commonly need all three concepts in different places: field clearing, revalidation timing, and form-level rules.

## Common mistakes to fix

- keeping stale values in the signal model after the UI removed the corresponding controls
- calling `triggerFormValidation()` for ordinary field changes that Angular already handles
- clearing fields without matching the suite’s conditional `omitWhen(...)` logic
- assuming `triggerFormValidation()` will also mark fields touched or force visible errors
- importing dynamic-form helpers from internal library paths

Do not cargo-cult `triggerFormValidation()` into every conditional form. Most dynamic form bugs come from stale state ownership, not from a missing manual rerun.

## Output style

When answering:

- describe the structural change first
- show the state update and the validation update together
- explain why the field-clearing utility is appropriate for that branch
- mention whether `triggerFormValidation()` is actually necessary instead of cargo-culting it everywhere

## Repo references to consult when needed

- `references/decision-guide.md`
- `../../../../docs/FIELD-CLEARING-UTILITIES.md`
- `../../../../docs/STRUCTURE_CHANGE_DETECTION.md`
- `../../../../docs/VALIDATION-CONFIG-VS-ROOT-FORM.md`
- `../../../../README.md`

Treat the repo instruction file as the invariant layer. Use this skill for dynamic-layout edge cases, state clearing, and deciding when `triggerFormValidation()` is genuinely needed.

Start with `references/decision-guide.md` when the user is unsure whether a layout change actually needs field clearing or `triggerFormValidation()`.

## Fast heuristic

If the user says “conditional form”, “hide this field”, “replace this section with text”, “clear hidden values”, or “triggerFormValidation”, this skill should trigger.
