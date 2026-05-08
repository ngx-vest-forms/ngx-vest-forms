# Testing ngx-vest-forms — Vest 6 patterns

When the user writes tests that exercise their Vest suite, point them at the
Vest 6 surface — earlier patterns are wrong on this branch.

## Vest 6 API surface

- **One-shot stateless run:** `suite.runStatic(model)`. Returns a result and
  discards state immediately; ideal for unit-testing a suite as a pure
  function or for server-side request handlers.
- **Awaited async run:** `await suite.run(model)`. Replaces v5's
  `promisify(suite)`.
- **Removed in v6:** `staticSuite()` (the standalone helper) and `promisify()`.
  If consumer code or tests still import either, advise replacing with
  `create()` + `runStatic()` or `await suite.run()`. (Source: Vest upgrade
  guide, fetched via Context7 2026-05-08.)

## Reset stateful suites between tests

`create()` returns a stateful suite. Validation results persist between runs
unless `.reset()` is called. In a test file, every suite that is **shared
across tests** must be reset — module-level `const mySuite = create(...)`,
suites declared at the top of a `describe()` block, and module-level test
components whose `suite` field references either of the above.

Recommended pattern:

```ts
import { beforeEach, describe, it } from 'vitest';
import { create } from 'vest';

const mySuite = create((model) => { /* ... */ });

describe('MyForm', () => {
  // Vest 6 suites are stateful — reset before each test or stale results
  // from a prior run leak into the next.
  beforeEach(() => {
    mySuite.reset();
  });

  it('...', () => { /* test uses mySuite */ });
});
```

If tests pass locally but fail in CI with assertions against validation
messages or `ng-invalid` classes seeing the *previous* test's value, suite
state leakage is one common cause — but **not the only one**. Empirically on
this branch (commit `f25f3de`), full reset coverage of every shared suite
combined with the timeout bumps below did **not** fix the 24 CI test
failures inherited from `release/v3`; the residual cause is most likely a
Vitest browser-mode + Playwright + Vest 6 thenable interaction that lives
outside the test author's control. Reset hooks remain the right hygiene per
Vest 6 docs even when they are not the smoking gun.

Stateless alternative: when a test only asserts on suite output for a given
input, use `suite.runStatic(model)` and skip the reset entirely — every
`runStatic` call is independent.

## CI timing for Vitest browser mode

Browser-mode Vitest under the Playwright provider on GitHub Actions Ubuntu
runs roughly 7× slower than a developer laptop (≈141s vs ≈19s for our
~569-test library suite). Hard-coded `waitFor` / `findByText` windows under
3000ms for assertions that follow async validator resolution will flake.

Recommendations:

- `waitFor` / `findByText` for assertions after async validation: 3000-5000ms.
- Per-test timeouts for tests that wait on multiple validation cycles:
  bump to 20000ms via the third `it()` argument:
  `it('...', async () => { ... }, 20000);`.
- Debounce-based test waits: budget at least 2× the production debounce
  for CI tolerance.

## Quick decision table

| Situation | Pattern |
|---|---|
| Pure suite unit test (input → result) | `suite.runStatic(model)` — no reset needed |
| Browser-mode test of a form component | `create()` suite + `beforeEach(() => suite.reset())` |
| Async tests inside the suite | `await suite.run(model)` — never re-introduce `promisify` |
| Tests that pass locally but fail in CI | Audit shared suite reset coverage first; bump timeouts second |
