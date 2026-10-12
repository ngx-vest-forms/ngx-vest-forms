---
name: vest-suite-scaffold
description: Scaffold a Vest validation suite, its typed model + form contract, and a matching Vitest spec following ngx-vest-forms conventions. Use when adding a new validated form or a new validation suite.
---

# Vest Suite Scaffold

Generates three colocated files for a new validated form, matching the
conventions already used across `apps/examples/src/app` (see
`pages/business-policy-form` and `pages/date-range-adapter` for canonical
examples). Ask for the **feature name** (kebab-case, e.g. `shipping-address`)
and the **field list** if not given.

## Conventions (do not deviate)

- The suite is a **plain Vest spec — no Angular import** — so it is unit
  tested by calling it directly.
- Typed as `NgxVestSuite<TModel>` from `ngx-vest-forms`, built with `create()`
  from `vest`.
- Model is `NgxDeepPartial<{...}>`; the form contract is the
  `NgxDeepRequired<TModel>` mirror, exported for `provideFormContract`.
- Blocking rules use `test(...)`; advisory rules add `warn()` and never block
  submit. Conditional rules use `omitWhen(...)`. Cross-field rules use the
  `ROOT_FORM` constant as the field key.
- Advisory rules must call `warn()` **before any `await`** — after the test
  suspends on `await`, `warn()` no longer registers the warning severity. If
  severity must be decided after async work, use `useWarn()` instead.
- Async-test cancellation is **automatic** in Vest 6 via the per-test `signal`
  payload — no manual abort wiring. Destructure `signal` from the test context
  and forward it into the request. Callers do **not** pass an `AbortSignal` or
  hooks into `suite.run()`; in Vest 6.3 `run()`/`runStatic()` take only the
  model. Canonical pattern:

  ```ts
  test('email', 'Email is already taken', async ({ signal }) => {
    await check(model.email, { signal });
  });
  ```
- Spec uses Vitest (`describe/it/expect`) and drives the suite with
  `suite.only('<field>').run(model)` asserting `hasErrors` / `getErrors` /
  `hasWarnings` / `getWarnings`.

## Files to create

### 1. `<feature>.model.ts`

```ts
import { NgxDeepPartial, NgxDeepRequired } from 'ngx-vest-forms';

export type <Pascal>Model = NgxDeepPartial<{
  // field: type;
}>;

export const <camel>Contract: NgxDeepRequired<<Pascal>Model> = {
  // field: <empty default>,
};
```

### 2. `<feature>.validations.ts`

```ts
import { NgxVestSuite, ROOT_FORM } from 'ngx-vest-forms';
import { create, enforce, omitWhen, test, warn } from 'vest';
import { <Pascal>Model } from './<feature>.model';

export const <camel>Suite: NgxVestSuite<<Pascal>Model> = create(
  (model: <Pascal>Model) => {
    test('<field>', '<Field> is required', () => {
      enforce(model.<field>).isNotBlank();
    });

    // Conditional example:
    // omitWhen(!model.<field>, () => { test(...) });

    // Cross-field example:
    // test(ROOT_FORM, '<message>', () => { enforce(...).isFalsy(); });

    // Advisory (never blocks submit):
    // test('<field>', '<advice>', () => { warn(); enforce(...).isFalsy(); });
  }
);
```

### 3. `<feature>.validations.spec.ts`

```ts
import { describe, expect, it } from 'vitest';
import { <camel>Suite } from './<feature>.validations';

describe('<Pascal> Validations', () => {
  it('requires <field>', () => {
    const result = <camel>Suite.only('<field>').run({});
    expect(result.hasErrors('<field>')).toBe(true);
    expect(result.getErrors('<field>')).toContain('<Field> is required');
  });

  it('passes with a valid model', () => {
    const result = <camel>Suite.only('<field>').run({ /* valid */ });
    expect(result.hasErrors('<field>')).toBe(false);
  });
});
```

## After scaffolding

Run the new spec through Nx, never raw vitest:

```bash
pnpm nx run ngx-vest-forms:test
```

(or the owning app's `test` target). Write at least one test per `test()`
rule — including the negative/omitted-condition path and any `warn()` rule —
mirroring the depth of `travel.validations.spec.ts`.
