---
name: core
description: Helps developers build, explain, or refactor a Vest.js 6 validation suite. Use this whenever the user asks for a first Vest example, wants to write a suite from scratch, asks when to use `create`, `create(..., schema)`, or `runStatic`, mentions `test` or `enforce`, or wants idiomatic modern suite structure without yet getting into advanced conditional or async behavior.
---

# Vest.js 6 core workflow

Use this skill to produce the default, idiomatic Vest 6 setup.

## Start from these rules

1. Keep the validation suite separate from feature or UI code.
2. Use `create(...)` for most suites, and use `create(..., schema)` when native Vest schema validation and typed parsed input belong with the suite.
3. Use `suite.runStatic(data)` for stateless executions. If you encounter `staticSuite(...)` in older code or docs, treat it as a legacy pattern to migrate toward `create(...)` plus `runStatic(...)` so the suite stays aligned with the current run APIs.
4. Keep selective validation outside the callback: use `suite.only(field).run(model)` or `suite.focus(...)` at the call site.
5. Use `test(fieldName, message, body)` for human-readable validations.
6. Use `enforce(...)` for clear assertions instead of hand-rolled boolean pyramids.
7. Prefer `result.isTested(field)` over custom touched or dirty flags when the question is “has this field been validated yet?”

## Recommended workflow

1. Define the data shape first.
2. Choose a suite shape (`create` for most cases; `create(..., schema)` when native `enforce.shape(...)` validation is useful).
3. Choose an execution style (`suite.run(model)`, `suite.only(field).run(model)`, or `suite.runStatic(model)`).
4. Add `test(...)` blocks with stable field names and clear messages.
5. Return the suite and use the result object or `suite.get()` to inspect state.

## Canonical patterns

### Stateful UI suite

Use `create(...)` when the same suite instance will rerun as the user edits data.

### Schema-aware suites

Use `create((data) => { ... }, schema)` when native Vest/n4s schema validation should run before tests and the suite should infer its input types from `enforce.shape(...)`.

- Prefer simple `enforce.shape(...)` schemas in baseline examples.
- When the schema uses parser chains, `suite.run(...)` accepts the schema input type while the callback data and `result.value` use the parsed output type.
- Focused runs such as `suite.only(field).run(model)` automatically subset the schema for the focused fields.
- Reserve more advanced schema helpers like `enforce.record(...)`, `enforce.lazy(...)`, or `enforce.tuple(...)` for cases that genuinely need them.

### Stateless validation

Use `suite.runStatic(data)` for request validation, scripts, SSR, or isolated invocations where prior state should not affect the next run. In Vest 6, this is the stateless replacement for older `staticSuite(...)` examples.

### Selective validation

If interactive validation should focus on a subset of fields, keep the suite callback model-only and focus at the call site:

- `suite.only(field).run(model)` for the common single-field case
- `suite.focus({ only: ['fieldA', 'fieldB'] }).run(model)` for more complex subsets

Focused runs are non-persistent modifiers applied to the immediately following `run()`.

## Concrete example: memoized async validation inside a focused group

```typescript
import { create, enforce, group, skipWhen, test } from 'vest';
import { memo } from 'vest/memo';

export const accountSuite = create((model: AccountModel) => {
  group('account', () => {
    test('username', 'Username is required', () => {
      enforce(model.username).isNotBlank();
    });

    skipWhen(
      (res) => res.hasErrors('username') || !model.username?.trim(),
      () => {
        memo(() => {
          test('username', 'Username is already taken', async ({ signal }) => {
            const response = await fetch(
              `/api/users/check-username?value=${encodeURIComponent(model.username!)}`,
              { signal }
            );
            const { taken } = await response.json();
            enforce(taken).isFalsy();
          });
        }, [model.username]);
      }
    );
  });
});

accountSuite.focus({ only: 'username', onlyGroup: 'account' }).run(model);
```

Apply focus at the call site (or wherever the app decides what to run). Keep the suite callback model-only.

## Pitfalls to correct immediately

- putting validation logic inline in the UI instead of in a suite
- using a callback `field` parameter or `only(field)` inside the suite callback as if it were the current default pattern
- calling the suite like `suite(model, field)` instead of using `.run()`, `.only(...).run()`, or `.runStatic()`
- inventing duplicate form-state tracking when `isTested()` or `hasErrors()` already answers the question
- using vague messages that make result handling harder

## Output style

When answering the user:

- give a complete, minimal suite rather than disconnected one-liners
- explain why the suite is stateful or stateless
- keep field names, messages, and result access aligned with the example

## Quick decision hints

- “Validate as the user types” usually means `create(...)` plus `suite.only(field).run(model)`.
- “I want native schema validation and type inference” usually means `create(..., enforce.shape(...))`.
- “Validate this payload on submit/server-side” usually means `suite.runStatic(data)`.
- “How do I start with Vest?” should trigger this skill first.

## References to consult when needed

- `../../../instructions/vest.instructions.md`
- `https://vestjs.dev/docs/get_started`
- `https://vestjs.dev/docs/concepts`
- `https://vestjs.dev/docs/writing_your_suite/schema_validation`
- `https://vestjs.dev/docs/api_reference`
