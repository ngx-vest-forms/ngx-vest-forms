---
name: validation-config-builder
description: Helps developers use `validationConfig`, `ValidationConfigMap`, and `createValidationConfig()` correctly in ngx-vest-forms. Use this whenever the user mentions dependent fields, confirm-password validation, `omitWhen`, `skipWhen`, stale cross-field validation, the fluent builder API, `whenChanged`, `bidirectional`, `group`, or asks why one field is not revalidating when another changes.
---

# ngx-vest-forms validationConfig builder guidance

Use this skill when the problem is about **field-level dependency timing**.

## First decide what kind of problem it is

Ask yourself:

- Is the validation rule owned by a specific field? Use `validationConfig`.
- Is the error truly about the whole form? Use `ROOT_FORM` instead.
- Is the issue caused by structure changes with controls appearing/disappearing? Use `triggerFormValidation()` and field-clearing guidance instead.

Do not treat these as interchangeable.

## Core rule

`validationConfig` only tells Angular **when to revalidate dependent fields**.
It does **not** define the validation rules themselves.

The validation logic still lives in the Vest suite.

## Preferred API

Prefer the fluent builder over raw objects:

- `createValidationConfig<T>()`
- `.whenChanged(trigger, dependent)`
- `.bidirectional(a, b)`
- `.group([...fields])`
- `.merge(otherConfig)`
- `.build()`

Use raw `ValidationConfigMap<T>` objects only when that is genuinely clearer.

Prefer public API imports from `'ngx-vest-forms'`:

- `createValidationConfig`
- `ValidationConfigBuilder`
- `ValidationConfigMap`
- `FormFieldName`

Do not send consumers to internal builder utilities under `src/lib/**`.

## Recommended workflow

1. Keep the rule in the Vest suite with `test(...)`, `omitWhen(...)`, `skipWhen(...)`, or `optional(...)`.
2. Identify which field changes should force another field to revalidate.
3. Encode those dependencies with the builder.
4. Use typed paths so broken field names fail at compile time.
5. If the config depends on runtime state, wrap the builder in `computed(() => ...)`.

## Canonical patterns

### Mutual dependency

Use `.bidirectional('password', 'confirmPassword')` for matching fields, ranges, and start/end pairs.

### One-way dependency

Use `.whenChanged('country', 'state')` when one field controls another field’s requirement.

### Multi-field clusters

Use `.group([...])` only when the whole set truly needs N×(N-1) revalidation. For large sets, prefer targeted `whenChanged()` calls.

### Conditional config

Use `.merge()` or `computed()` when the dependency graph changes with the UI.

## Situations where validationConfig is especially important

Use it proactively when the suite contains:

- `omitWhen(...)`
- `skipWhen(...)`
- `optional(...)`
- field comparisons like password confirmation
- conditional requirements such as country/state or age/emergencyContact

Without it, ngx-vest-forms may leave stale validation results because Angular will not know which dependent fields to rerun.

## Pitfalls to fix immediately

- using `validationConfig` as if it defined validation rules
- solving a form-level rule with `validationConfig` instead of `ROOT_FORM`
- forgetting dependencies when `omitWhen` or `skipWhen` hides/shows a rule
- creating very large `group()` graphs when one-way dependencies would be cheaper and clearer
- using untyped string paths when the model type is available
- importing builder helpers from internal library paths

Do not describe `validationConfig` as optional polish when stale cross-field errors are part of the bug. In those cases it is the missing wiring, not a nice-to-have.

## Output style

When answering the user:

- explain the dependency graph in plain language first
- show the Vest test and the builder config together
- call out which field owns the error message
- prefer one compact example over several disconnected fragments

## Repo references to consult when needed

- `references/decision-guide.md`
- `../../../../docs/VALIDATION-CONFIG-BUILDER.md`
- `../../../../docs/VALIDATION-CONFIG-VS-ROOT-FORM.md`
- `../../../../docs/FIELD-PATHS.md`
- `../../../../README.md`
- `../../../../projects/ngx-vest-forms/src/public-api.ts`

Treat the repo instruction file as the invariant layer. This skill adds the dependency-graph reasoning and builder-specific patterns.

Start with `references/decision-guide.md` when the user is mixing `validationConfig`, `ROOT_FORM`, and dynamic form behavior in the same question.

## Useful reminder

If the user says “when field A changes, field B should revalidate”, this skill should usually trigger.
