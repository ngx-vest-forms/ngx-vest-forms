# Testing ngx-vest-forms forms and Vest 6 suites

## Pick the run

| Situation                                      | Pattern                                                                  |
| ---------------------------------------------- | ------------------------------------------------------------------------ |
| pure suite test (input → result)               | `suite.runStatic(model)`; every call is independent, no reset needed     |
| async tests inside the suite                   | `await suite.run(model)`                                                 |
| component test rendering a form with the suite | the shared `create()` suite plus `beforeEach(() => suite.reset())`       |
| tests pass locally, fail in CI                 | audit reset coverage of shared suites first, then the wait windows below |

Vest 6 removed `staticSuite()` and `promisify()`; their replacements are `create()` + `runStatic()` and `await suite.run()`.

## Reset shared suites

`create()` returns a stateful suite: results accumulate across runs until `.reset()`. Reset every suite a test file shares between tests, which covers a module-level `const suite = create(...)`, a suite declared at the top of a `describe()`, and test host components whose `suite` field points at either.

```ts
import { beforeEach, describe, it } from 'vitest';
import { profileSuite } from './profile.suite';

describe('ProfileFormComponent', () => {
  beforeEach(() => {
    profileSuite.reset();
  });

  it('shows the email error after blur', async () => {
    // ...
  });
});
```

The symptom of a missing reset is an assertion seeing the previous test's message or `ng-invalid` class. `ROOT_FORM` results live in the same suite state, so they leak the same way.

## Timing

- Provide `{ provide: NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN, useValue: NGX_VALIDATION_DEBOUNCE_PRESETS.immediate }` so `validationConfig` dependents revalidate without a debounce wait.
- Wait for async validators with the testing library's `waitFor` / `findBy*` and a window of 3000–5000 ms; CI runners, browser-mode Vitest in particular, run several times slower than a laptop.
- Give tests that wait on several validation cycles a per-test timeout, for example `it('…', async () => { … }, 20_000)`.
- Budget at least twice the production debounce for debounce-based waits.

## Expected dev-mode warnings

When a test deliberately triggers an `NGX-xxx` warning, spy on `console.warn` so stderr stays clean and assert the code:

```ts
const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
// exercise the warning path
expect(warn).toHaveBeenCalledWith(expect.stringContaining('[NGX-100]'));
warn.mockRestore();
```

Assert wrapper messages by role or text rather than by generated ids: the ids include a non-default `APP_ID` and are numbered per application.
