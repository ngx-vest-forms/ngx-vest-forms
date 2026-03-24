---
name: ngx-vest-forms
description: Routes general ngx-vest-forms requests to the right workflow. Use this whenever the user broadly asks about ngx-vest-forms, wants help with the library but the feature area is not obvious yet, asks for best practices, migration help, or says things like “how should I build this with ngx-vest-forms?” even when they do not mention `validationConfig`, wrappers, child components, or root-form validation explicitly.
---

# ngx-vest-forms router skill

Use this as the broad entry point for ngx-vest-forms questions.

## Start with the invariant layer

Assume the repo instruction file already enforces the baseline guardrails:

- use `[ngModel]`, not `[(ngModel)]`
- keep `name` aligned with the bound path
- use optional chaining for partial models
- call `only(field)` unconditionally
- use `vestFormsViewProviders` in nested child form components

Do not repeat those basics unless they are directly relevant to the user’s issue.

## Stay on the public API surface

Unless the task is explicitly about maintaining the library internals, recommend imports from `'ngx-vest-forms'` and verify the symbol exists in `projects/ngx-vest-forms/src/public-api.ts`.

Do not send library consumers to `projects/ngx-vest-forms/src/lib/**` imports. That is an internal maintenance path, not consumer guidance.

## Available workflow sub-skills

Use these nested workflow sub-skills when the feature area is clear:

| Sub-skill | Use when | Path |
|---|---|---|
| `core` | first examples, form structure, `[ngModel]`, `NgxDeepPartial`, typed suites | `core/SKILL.md` |
| `validation-config-builder` | dependent field revalidation, `createValidationConfig()`, `whenChanged`, `bidirectional` | `validation-config-builder/SKILL.md` |
| `root-form-validation` | `ROOT_FORM`, `ngxValidateRootForm`, summary-level business rules | `root-form-validation/SKILL.md` |
| `built-in-wrappers` | built-in wrapper selection, display modes, `ariaAssociationMode` | `built-in-wrappers/SKILL.md` |
| `custom-wrapper-patterns` | design-system wrappers, `FormErrorDisplayDirective`, `FormErrorControlDirective` | `custom-wrapper-patterns/SKILL.md` |
| `child-components` | nested `ngModelGroup`, reusable form sections, `vestFormsViewProviders` | `child-components/SKILL.md` |
| `dynamic-form-behavior` | clearing hidden values, structure changes, `triggerFormValidation()` | `dynamic-form-behavior/SKILL.md` |

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

### Dynamic structure changes

Read `dynamic-form-behavior/SKILL.md` when the user is:

- showing/hiding controls dynamically
- replacing inputs with static content
- clearing hidden values
- asking when `triggerFormValidation()` is necessary

## Routing heuristics

- If the user mentions several of these at once, combine the relevant sub-skills instead of forcing a single lens.
- If the issue is specifically about Vest semantics, also consult `vest.instructions.md`.
- If the issue is generic Angular rather than library-specific, prefer the Angular skill instead of overfitting ngx-vest-forms guidance.

## Core repo references

- `README.md`
- `.github/instructions/ngx-vest-forms.instructions.md`
- `.github/instructions/vest.instructions.md`
- `docs/`
- `projects/ngx-vest-forms/src/public-api.ts`

## Goal

Use this skill to quickly identify the correct ngx-vest-forms workflow, then route into the matching nested sub-skill instead of giving a generic library overview.
