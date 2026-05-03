---
name: root-form-validation
description: Helps developers model form-level validation with `ROOT_FORM` and `ngxValidateRootForm` in ngx-vest-forms. Use this whenever the user mentions form-wide business rules, submission summaries, “at least one field required”, `ROOT_FORM`, `validateRootForm`, `validateRootFormMode`, or is unsure whether a cross-field rule belongs at field level or the whole-form level.
---

# ngx-vest-forms root-form validation guidance

Use this skill when the error belongs to the **entire form**, not a single field.

## Decision rule

Use `ROOT_FORM` only when no one field should “own” the error.

Good fits:

- at least one contact method is required
- two address blocks must differ
- whole-form business rules that should show in a summary

Poor fits:

- password confirmation errors that really belong to `confirmPassword`
- end-date errors that belong on `endDate`
- field dependencies that should be handled with `validationConfig`

## Canonical setup

1. Add `test(ROOT_FORM, 'message', () => { ... })` to the Vest suite.
2. Add `ngxValidateRootForm` to the form.
3. Pick `[ngxValidateRootFormMode]` or equivalent mode intentionally:
   - `'submit'` by default for blocking summary errors
   - `'live'` only when continuous form-level feedback is useful and not noisy
4. Render the emitted errors in a stable summary region.

Prefer public API imports from `'ngx-vest-forms'`, especially:

- `ROOT_FORM`
- `ValidateRootFormDirective`

For template examples, keep the directive usage aligned with the public selector/API rather than pointing consumers at internal directive files.

## Accessibility expectations

For blocking form-level errors, prefer an assertive summary region such as:

- `role="alert"`
- `aria-live="assertive"`
- `aria-atomic="true"`

Keep the summary region predictable and easy to locate in the form.

## Recommended workflow

1. Decide whether the rule is field-owned or form-owned.
2. If form-owned, write it against `ROOT_FORM`.
3. Keep the rule in the Vest suite; do not move it into component glue code.
4. Wire the form directive and display summary errors in the template.
5. If some fields also need field-level revalidation, combine this skill with validation-config guidance rather than overloading `ROOT_FORM`.

## Common combinations

It is normal to combine:

- field-level tests + `validationConfig`
- form-level tests + `ROOT_FORM`
- structure-change handling + `triggerFormValidation()`

These solve different problems.

## Red flags

Correct these if they appear:

- using `ROOT_FORM` for what should be a field-level inline error
- trying to replace `validationConfig` with `ROOT_FORM`
- showing form-summary errors inline next to one control without a good ownership reason
- using aggressive live whole-form validation when it will create noisy, distracting announcements
- importing form-level validation helpers from internal library paths

Do not let `ROOT_FORM` become a dumping ground for hard-to-place errors. That hides ownership problems instead of solving them.

## Output style

When answering:

- explain why the rule is form-level
- show both the suite snippet and the template summary snippet
- mention when `'submit'` is safer than `'live'`
- explicitly say when the user should *not* use `ROOT_FORM`

## Repo references to consult when needed

- `../../../../docs/VALIDATION-CONFIG-VS-ROOT-FORM.md`
- `../../../../README.md`
- `../../../../docs/ACCESSIBILITY.md`
- `../../../../projects/ngx-vest-forms/src/public-api.ts`

Treat the repo instruction file as the baseline. Use this skill for the field-vs-form ownership decision and form-summary behavior.

## Fast heuristic

If the user asks for a message at the top or bottom of the form that reflects several fields together, this skill should probably trigger.
