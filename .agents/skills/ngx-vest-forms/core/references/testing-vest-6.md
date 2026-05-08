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

const mySuite = create((model) => {
  /* ... */
});

describe('MyForm', () => {
  // Vest 6 suites are stateful — reset before each test or stale results
  // from a prior run leak into the next.
  beforeEach(() => {
    mySuite.reset();
  });

  it('...', () => {
    /* test uses mySuite */
  });
});
```

If tests pass locally but fail in CI with assertions against validation
messages or `ng-invalid` classes seeing the _previous_ test's value, suite
state leakage is one common cause. Reset hooks are the right hygiene per
Vest 6 docs and should always be in place for shared suites.

Stateless alternative: when a test only asserts on suite output for a given
input, use `suite.runStatic(model)` and skip the reset entirely — every
`runStatic` call is independent.

## CI timing for Vitest browser mode

Browser-mode Vitest under the Playwright provider on GitHub Actions Ubuntu
runs roughly 3-7× slower than a developer laptop. Hard-coded `waitFor` /
`findByText` windows under 3000ms for assertions that follow async validator
resolution will flake.

Recommendations:

- `waitFor` / `findByText` for assertions after async validation: 3000-5000ms.
- Per-test timeouts for tests that wait on multiple validation cycles:
  bump to 20000ms via the third `it()` argument:
  `it('...', async () => { ... }, 20000);`.
- Debounce-based test waits: budget at least 2× the production debounce
  for CI tolerance.

### Why `npm run test:lib` runs in three shards

The library test command chains three `vitest run --shard=N/3` invocations
rather than one. The chromium browser process degrades as iframes
accumulate across spec files (with `fileParallelism: false` + `isolate: true`
under `@vitest/browser-playwright`), and on cold caches the last ~4 spec
files in a single invocation hit `waitFor` timeouts they would otherwise
clear. Splitting into three sequential invocations gives each batch a fresh
chromium process, which fixes 24 deterministic failures observed on
`release/v3` after PR #132/#133. See issue #134 for the full RCA.

Implications for test authors:

- Add new specs anywhere — vitest's default file ordering across shards is
  fine. No need to think about which shard a spec lands in.
- If a single shard grows uncomfortably large again, reduce shard size
  (`--shard=N/4` etc.) before reaching for per-test timeout bumps.

## Quick decision table

| Situation                              | Pattern                                                       |
| -------------------------------------- | ------------------------------------------------------------- |
| Pure suite unit test (input → result)  | `suite.runStatic(model)` — no reset needed                    |
| Browser-mode test of a form component  | `create()` suite + `beforeEach(() => suite.reset())`          |
| Async tests inside the suite           | `await suite.run(model)` — never re-introduce `promisify`     |
| Tests that pass locally but fail in CI | Audit shared suite reset coverage first; bump timeouts second |
