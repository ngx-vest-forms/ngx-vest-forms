---
name: core
description: Helps developers build, explain, or refactor forms with ngx-vest-forms. Use this whenever the user mentions ngx-vest-forms, template-driven forms with Vest.js, a first example, `[ngModel]` vs `[(ngModel)]`, `NgxDeepPartial`, form shapes, `name` path matching, or asks how to structure a form around this library—even if they do not explicitly ask for a “core” setup guide.
---

# ngx-vest-forms core workflow

Use this skill to produce the default, idiomatic ngx-vest-forms setup.

## Start from these rules

1. Model the form with `NgxDeepPartial<T>` because template-driven forms are built incrementally.
2. Prefer `NgxVestSuite<T>` for typed Vest suites; reach for `FormFieldName<T>` or `NgxFieldKey<T>` when you need typed field-path hints.
3. Keep the suite callback model-only. Handle field-focused validation later via `suite.only(field).run(model)`.
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
- `NgxVestSuite`
- `FormFieldName`
- `NgxFieldKey`
- `NgxFieldBlurEvent`
- `ROOT_FORM`

Optional advanced exports worth knowing about:

- `NGX_EQUALITY_FN`, `NgxEqualityFn` — swap the comparator the form uses for `formValueChange` `distinctUntilChanged`, two-way sync, and `formState` equality. Default is `fastDeepEqual` with cycle detection. Reach for it for bundle size (`dequal/lite`), tests (reference equality), or domain rules. See `docs/API-TOKENS.md`.
- `setValueAtPath` — array-safe path writes (v2.7+ no longer overwrites populated arrays via bracket notation).
  Do not teach consumers to import from internal `src/lib/**` paths. If a symbol is missing from the public API, that is a library-maintenance task, not a consumer workaround.

## Default implementation pattern

Build answers and code in this order:

1. Define a `NgxDeepPartial<T>` form model.
2. Define an optional structural contract — either an `NgxDeepRequired<T>` shape (legacy, accepted for back-compat), a hand-written `StandardSchemaV1<T>`, or a Zod v4 schema (recommended).
3. Create a Vest suite with `create((model) => { ... })`.
4. Expose a signal-based `formValue` in the component.
5. Bind the form with `ngxVestForm`, `[suite]`, and `(formValueChange)`. Prefer `provideFormContract(...)` in the component when the contract is fixed; use `[formContract]` only for true per-usage overrides.
6. Bind each control with `[ngModel]` and the exact matching `name`.
7. Use `ChangeDetectionStrategy.OnPush` unless there is a compelling reason not to.

## Output expectations

When generating code or guidance, prefer:

- a complete runnable example over isolated fragments
- typed imports from `ngx-vest-forms`
- signals for local component state
- wrappers that keep error display and ARIA straightforward
- call-site focused validation examples such as `suite.only('email').run(model)` only when the user explicitly needs field-scoped execution

If the user asks for “the right way” or “a proper example”, give a minimal but production-ready component.

## Red flags to catch

Correct these immediately if they appear:

- `[(ngModel)]` on ngx-vest-forms controls
- two-parameter suite callbacks or `only(field)` inside the suite callback
- `name` values that do not match the bound path
- direct property access like `formValue().address.street` instead of `formValue().address?.street`
- missing a fixed `provideFormContract(...)` or explicit `[formContract]` on complex nested forms where path mistakes are easy
- `(blur)` handlers that re-trigger validation to fake dependent-field timing or draft auto-save
- imports from `packages/ngx-vest-forms/src/lib/**` in consumer examples

Do not paper over these mistakes. They break the mental model of the library and usually create subtle bugs instead of quick wins.

## Good defaults

- Prefer `ROOT_FORM` only for true form-level business rules, not as a shortcut for field errors.
- If fields depend on each other, move to the validation-config skill logic rather than cramming everything into the base example.
- If the user wants blur-driven persistence, analytics, or field-level side effects, move to the field-blur-events skill instead of inventing custom `(blur)` validation flows.
- If the user is splitting the form into child components, apply the child-components skill guidance.
- If the user wants custom message UI, apply the custom-wrapper-patterns skill guidance.

## Testing your forms (Vest 6)

When the user writes tests that exercise their Vest suite, route to
[references/testing-vest-6.md](references/testing-vest-6.md). Quick rules:

- `suite.runStatic(model)` for stateless one-shot tests; no reset needed.
- For shared `create()` suites, add `beforeEach(() => mySuite.reset())` —
  Vest 6 suites accumulate state across runs.
- `staticSuite()` and `promisify()` were removed in Vest 6; use `create()`
  - `runStatic()` or `await suite.run()`.
- Browser-mode Vitest CI is ~7× slower than local: `waitFor` / `findByText`
  windows under 3000ms flake on async-validator assertions.

If tests pass locally but fail in CI, audit shared-suite reset coverage
first.

## Repo references to consult when needed

Read these files before making nuanced recommendations:

- `../../../../docs/COMPLETE-EXAMPLE.md`
- `../../../../docs/FIELD-PATHS.md`
- `../../../../docs/ACCESSIBILITY.md`
- `../../../../.github/instructions/vest.instructions.md`
- `../../../../README.md`
- `../../../../packages/ngx-vest-forms/src/public-api.ts`

Assume the repo-level `ngx-vest-forms.instructions.md` file already enforces the baseline invariants; use this skill for the fuller implementation workflow and examples.

## Canonical reminders

- ngx-vest-forms is a template-driven forms adapter, not a reactive forms abstraction.
- `validationConfig` controls when dependent fields revalidate; it does not define validation logic.
- The library's sweet spot is typed template-driven forms with Vest suites, signals, and explicit structure.
- The current branch targets Angular 22+, RxJS ~7.8, and Vest 6.x. `parseFieldPath` warns in dev mode for malformed segments (`'a..b'`, `'.a'`, `'a.'`); production behavior unchanged.
