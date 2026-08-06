---
name: ngx-vest-forms
description: ngx-vest-forms template-driven Vest form guidance. Use for library setup, model binding, validation timing, wrappers, nested form sections, blur side effects, form lifecycle, migration, or configuration tokens.
---

# ngx-vest-forms router skill

Use this as the broad entry point for ngx-vest-forms questions.

## Shared invariants

Apply these rules in every ngx-vest-forms answer and implementation:

| Concern | Default |
|---|---|
| Form model and binding | Model incremental values with `NgxDeepPartial<T>`; bind with `[ngModel]` and update state from `(formValueChange)`. |
| Field paths | Keep `name` equal to the bound property path and use optional chaining for nested partial values. |
| Vest suite | Use `NgxTypedVestSuite<T>` with `FormFieldName<T>` when practical and call `only(field)` unconditionally. |
| Child sections | Add `viewProviders: [vestFormsViewProviders]` to every participating child component. |
| Wrapper choice | Use `<ngx-control-wrapper>` for one control and `<ngx-form-group-wrapper>` for `ngModelGroup` or multi-control regions. |
| Cross-field rules | Keep rules in the Vest suite and use `validationConfig` to revalidate dependents; gate quiet dependent messages with their wrapper display mode. |
| Form-level rules | Use `ROOT_FORM` with `ngxValidateRootForm` only when no single field owns the error. |
| Dynamic and blur behavior | Clear irrelevant values when structure changes; use `triggerFormValidation()` only when Angular has no value-change path; use `fieldBlur` for persistence and analytics. |

Use `NgxDeepRequired<T>` form shapes for complex nested forms where path mistakes
are likely.

If the request does not involve this library’s APIs or behavior, use the
framework-specific guidance that matches the task instead.

## Public package surface

Import ngx-vest-forms symbols from `'ngx-vest-forms'`. Keep consumer examples on
the package root rather than deep source paths.

## Available workflow sub-skills

Use these nested workflow sub-skills when the feature area is clear:

| Sub-skill | Use when | Path |
|---|---|---|
| `core` | first examples, form structure, `[ngModel]`, `NgxDeepPartial`, typed suites | `core/SKILL.md` |
| `validation-config-builder` | dependent field revalidation, `createValidationConfig()`, `whenChanged`, `bidirectional` | `validation-config-builder/SKILL.md` |
| `field-blur-events` | draft auto-save, blur-driven persistence, analytics, `fieldBlur`, `NgxFieldBlurEvent` | `field-blur-events/SKILL.md` |
| `root-form-validation` | `ROOT_FORM`, `ngxValidateRootForm`, summary-level business rules | `root-form-validation/SKILL.md` |
| `built-in-wrappers` | built-in wrapper selection, display modes, `ariaAssociationMode` | `built-in-wrappers/SKILL.md` |
| `custom-wrapper-patterns` | design-system wrappers, `FormErrorDisplayDirective`, `FormErrorControlDirective` | `custom-wrapper-patterns/SKILL.md` |
| `child-components` | nested `ngModelGroup`, reusable form sections, `vestFormsViewProviders` | `child-components/SKILL.md` |
| `composite-adapter` | one UI widget mapping to multiple flat form fields, hidden proxy fields, fan-out, error aggregation | `composite-adapter/SKILL.md` |
| `dynamic-form-behavior` | clearing hidden values, structure changes, `triggerFormValidation()` | `dynamic-form-behavior/SKILL.md` |
| `form-lifecycle` | reset, custom submission, submit-gated errors, or first-invalid focus | `form-lifecycle/SKILL.md` |

## Route to the right workflow

### Core form setup

Read `core/SKILL.md` when the user is:

- starting a form from scratch
- asking for a proper example
- unsure how to structure a component around ngx-vest-forms
- asking about `NgxDeepPartial`, form shapes, or signal-based form state

### Dependent field revalidation

Read `validation-config-builder/SKILL.md` when the user is:

- asking why one field does not revalidate when another changes
- dealing with confirm-password, date ranges, country/state, or `omitWhen`
- mentioning `validationConfig`, `createValidationConfig()`, `whenChanged`, `bidirectional`, or `group`

### Field blur events and draft persistence

Read `field-blur-events/SKILL.md` when the user is:

- asking for draft auto-save, blur-save, or recovery-oriented persistence
- mentioning `fieldBlur` or `NgxFieldBlurEvent`
- wiring analytics or side effects to a field blur event
- trying to save on blur without turning validation into a persistence gate
- asking how to keep dependent fields logically invalid but visually quiet until their own blur

### Form-level rules

Read `root-form-validation/SKILL.md` when the user is:

- asking for a message that belongs to the entire form
- comparing `ROOT_FORM` versus field-level validation
- working with `ngxValidateRootForm` or `validateRootFormMode`

### Built-in wrappers

Read `built-in-wrappers/SKILL.md` when the user is:

- asking which wrapper to use
- working with `ngx-control-wrapper` or `ngx-form-group-wrapper`
- asking about error or warning display modes

### Custom wrappers

Read `custom-wrapper-patterns/SKILL.md` when the user is:

- building a design-system wrapper
- using `FormErrorDisplayDirective` or `FormErrorControlDirective`
- asking about `hostDirectives`, ARIA wiring, or custom pending/error UI

### Child components

Read `child-components/SKILL.md` when the user is:

- splitting a large form into reusable sections
- working with nested `ngModelGroup`
- debugging missing `vestFormsViewProviders`

### Composite adapters

Read `composite-adapter/SKILL.md` when the user is:

- mapping one UI widget to multiple flat form model fields
- asking about date range pickers, name splitters, or multi-field composites
- using hidden proxy fields with `setValueAtPath` fan-out
- aggregating errors from multiple fields into a single UI region
- asking why `<ngx-control-wrapper>` does not work for their composite control

### Dynamic structure changes

Read `dynamic-form-behavior/SKILL.md` when the user is:

- showing/hiding controls dynamically
- replacing inputs with static content
- clearing hidden values
- asking when `triggerFormValidation()` is necessary

### Form lifecycle

Read `form-lifecycle/SKILL.md` when the user is:

- resetting a form or ending a submit cycle without resetting it
- orchestrating several forms from one submit button
- calling `markAllAsTouched()`, `clearSubmittedState()`, or `resetForm()`
- restoring focus to the first invalid field after a failed custom submission

### Configuration and migration

Read `docs/API-TOKENS.md` for an injection-token question that is not already
owned by a wrapper or equality workflow. Read
`docs/SELECTOR-PREFIX-MIGRATION.md` for `sc-` to `ngx-` selector migration and
`docs/migration/MIGRATION-v1.x-to-v2.0.0.md` for v1-to-v2 behavior changes.

## Routing heuristics

- If the user mentions several of these at once, combine the relevant sub-skills instead of forcing a single lens.
- Draft auto-save with quiet dependent errors usually combines `field-blur-events`, `validation-config-builder`, and `built-in-wrappers`.
- Custom submit flows often combine `form-lifecycle` with `built-in-wrappers`.
- If the issue is specifically about Vest semantics, also consult `vest.instructions.md` (and the sibling `vestjs` agent skill if installed — see `docs/VESTJS-SKILL.md`).
- If the issue is generic Angular rather than library-specific, prefer the Angular skill instead of overfitting ngx-vest-forms guidance.

## Consumer references

- `README.md`
- `docs/`

## Goal

Use this skill to quickly identify the correct ngx-vest-forms workflow, then route into the matching nested sub-skill instead of giving a generic library overview.
