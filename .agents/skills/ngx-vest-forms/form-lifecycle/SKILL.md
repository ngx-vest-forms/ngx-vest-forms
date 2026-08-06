---
name: form-lifecycle
description: Helps developers choose the right ngx-vest-forms form-lifecycle method. Use this whenever the user mentions `clearSubmittedState`, `resetForm`, `markAllAsTouched`, `triggerFormValidation`, `focusFirstInvalidControl`, `scrollToFirstInvalidControl`, custom submit flows, submit-gated errors, or restoring focus after invalid submission.
---

# ngx-vest-forms form lifecycle guidance

Use this skill when the question is about a form action rather than a validation rule.

## Choose the narrowest action

| User outcome | Method |
|---|---|
| Re-run validation after a structure change without a value change | `triggerFormValidation()` |
| Reveal existing errors in a custom or multi-form submit flow | `markAllAsTouched()` |
| End an `'on-submit'` error-display cycle while preserving values and control metadata | `clearSubmittedState()` |
| Reset values, warnings, and Angular control metadata | `resetForm(value?)` |
| Move focus to the first invalid control after a failed custom submission | `focusFirstInvalidControl()` |
| Scroll to the first invalid control without moving focus | `scrollToFirstInvalidControl()` |

Use ordinary `(ngSubmit)` for an ordinary form submission. With the default
`'on-blur-or-submit'` display mode, the directive marks controls touched
automatically; do not add a redundant `markAllAsTouched()` call.

## Recommended workflow

1. Identify whether the request changes structure, visibility, values, submit state, or focus.
2. Call only the method that owns that outcome.
3. For a custom submission, wait until Angular has applied submitted state before focusing an invalid control.
4. Keep form-level rules in the Vest suite and error-display policy in wrappers; lifecycle methods coordinate the form state around them.

## Submit-cycle guidance

Use `clearSubmittedState()` only to close a completed submit cycle. It preserves
values and `touched` / `dirty` metadata, and it neither clears warnings nor
re-runs validation.

Use `resetForm()` when the product really needs a fresh form. It resets Angular
control metadata, clears warnings, and revalidates the new value.

## Focus after failed submission

For a custom submit flow, call `focusFirstInvalidControl()` after the submit
state and validation result are current. This scrolls and focuses the first
matching invalid control, giving keyboard and screen-reader users a direct route
to the error.

Use `scrollToFirstInvalidControl()` when moving focus would be disruptive.

## Common mistakes to correct

- Using `resetForm(form.ngForm.value)` just to hide submit-gated errors.
- Calling `markAllAsTouched()` for a normal `(ngSubmit)` flow.
- Expecting `triggerFormValidation()` to mark controls touched or show errors.
- Calling `triggerFormValidation()` for ordinary value changes or blur-driven persistence.
- Focusing an invalid control before the custom submission has updated the form state.

## Public API and references

Recommend `FormDirective` and `NgxFirstInvalidOptions` from `'ngx-vest-forms'`.

Consult these consumer docs and examples when behavior is nuanced:

- `../../../../docs/CLEAR-SUBMITTED-STATE.md`
- `../../../../docs/STRUCTURE_CHANGE_DETECTION.md`
- `../../../../projects/examples/src/app/pages/purchase-form/purchase.form.ts`
- `../../../../projects/examples/src/app/pages/wizard-form/wizard.form.ts`

## Fast heuristic

If the user asks how to reset, resubmit, reveal errors, clear submit state, or
focus the first invalid field, this skill should trigger.
