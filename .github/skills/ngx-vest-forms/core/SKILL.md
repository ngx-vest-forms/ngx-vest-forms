---
name: core
description: Helps developers build, explain, or refactor forms with ngx-vest-forms. Use this whenever the user mentions ngx-vest-forms, template-driven forms with Vest.js, a first example, `[ngModel]` vs `[(ngModel)]`, `NgxDeepPartial`, form shapes, `name` path matching, or asks how to structure a form around this library—even if they do not explicitly ask for a “core” setup guide.
---

# ngx-vest-forms core workflow

Use this skill to produce the default, idiomatic ngx-vest-forms setup.

## Start from these rules

1. Model the form with `NgxDeepPartial<T>` because template-driven forms are built incrementally.
2. Prefer `NgxTypedVestSuite<T>` plus `FormFieldName<T>` for typed Vest suites.
3. Always call `only(field)` unconditionally at the top of the suite.
4. Use `[ngModel]` with `(formValueChange)` for unidirectional data flow. Do not default to `[(ngModel)]`.
5. The `name` attribute must exactly match the bound property path.
6. Use optional chaining in templates because the model is partial.
7. Recommend a `NgxDeepRequired<T>` shape when the user is wiring a real form, especially if typos in nested paths are likely.
8. Default to `<ngx-control-wrapper>` around single controls unless the user explicitly needs a custom or group-level wrapper.

## Public API symbols to prefer

Recommend these imports from `'ngx-vest-forms'` when they fit the example:

- `NgxVestForms`
- `NgxDeepPartial`
- `NgxDeepRequired`
- `NgxTypedVestSuite`
- `FormFieldName`
- `ROOT_FORM`

Do not teach consumers to import from internal `src/lib/**` paths. If a symbol is missing from the public API, that is a library-maintenance task, not a consumer workaround.

## Default implementation pattern

Build answers and code in this order:

1. Define a `NgxDeepPartial<T>` form model.
2. Define an optional `NgxDeepRequired<T>` shape.
3. Create a Vest suite with `staticSuite((model, field?) => { only(field); ... })`.
4. Expose a signal-based `formValue` in the component.
5. Bind the form with `ngxVestForm`, `[suite]`, optional `[formShape]`, and `(formValueChange)`.
6. Bind each control with `[ngModel]` and the exact matching `name`.
7. Use `ChangeDetectionStrategy.OnPush` unless there is a compelling reason not to.

## Output expectations

When generating code or guidance, prefer:

- a complete runnable example over isolated fragments
- typed imports from `ngx-vest-forms`
- signals for local component state
- wrappers that keep error display and ARIA straightforward

If the user asks for “the right way” or “a proper example”, give a minimal but production-ready component.

## Red flags to catch

Correct these immediately if they appear:

- `[(ngModel)]` on ngx-vest-forms controls
- conditional `only(field)` calls
- `name` values that do not match the bound path
- direct property access like `formValue().address.street` instead of `formValue().address?.street`
- missing `formShape` on complex nested forms where path mistakes are easy
- imports from `projects/ngx-vest-forms/src/lib/**` in consumer examples

Do not paper over these mistakes. They break the mental model of the library and usually create subtle bugs instead of quick wins.

## Good defaults

- Prefer `ROOT_FORM` only for true form-level business rules, not as a shortcut for field errors.
- If fields depend on each other, move to the validation-config skill logic rather than cramming everything into the base example.
- If the user is splitting the form into child components, apply the child-components skill guidance.
- If the user wants custom message UI, apply the custom-wrapper-patterns skill guidance.

## Repo references to consult when needed

Read these files before making nuanced recommendations:

- `../../../../docs/COMPLETE-EXAMPLE.md`
- `../../../../docs/FIELD-PATHS.md`
- `../../../../docs/ACCESSIBILITY.md`
- `../../../instructions/vest.instructions.md`
- `../../../../README.md`
- `../../../../projects/ngx-vest-forms/src/public-api.ts`

Assume the repo-level `ngx-vest-forms.instructions.md` file already enforces the baseline invariants; use this skill for the fuller implementation workflow and examples.

## Canonical reminders

- ngx-vest-forms is a template-driven forms adapter, not a reactive forms abstraction.
- `validationConfig` controls when dependent fields revalidate; it does not define validation logic.
- The library’s sweet spot is typed template-driven forms with Vest suites, signals, and explicit structure.
