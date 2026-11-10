---
name: async-and-warnings
description: Async tests and warnings in Vest 6. Read it for remote checks such as username availability, stale or repeated requests, the per-test `signal`, `debounce`, `memo`, pending state, `warn()`, `useWarn()`, or completion with `afterEach` and `afterField`.
---

# Vest 6 async tests and warnings

The invariants live in the router, [`../SKILL.md`](../SKILL.md).

## Write an async test

Build in this order; the test is done when every step is present:

1. A synchronous test for the same field first, so the cheap rule fails before any request.
2. The async test inside `skipWhen((result) => result.hasErrors(field), ...)`, so it waits until the synchronous rules pass.
3. `async ({ signal }) => { ... }` as the test body, with `signal` passed to the request. Vest aborts the signal when the same test runs again, which cancels the stale request.
4. A request limiter when the field fires often: `debounce` for bursts of input, `memo` for values that repeat. Neither one cancels a request, so step 3 stays.
5. Pending UI from `result.isPending(field)`.

```ts
import { create, enforce, skipWhen, test, warn } from 'vest';
import debounce from 'vest/debounce';
import { memo } from 'vest/memo';

type Signup = { username?: string; password?: string };

export const signupSuite = create((data: Signup) => {
  test('username', 'Username is required', () => {
    enforce(data.username).isNotBlank();
  });

  skipWhen(
    (result) => result.hasErrors('username'),
    () => {
      memo(() => {
        test(
          'username',
          'Username is already taken',
          debounce(async ({ signal }) => {
            const response = await fetch(
              `/api/users/${encodeURIComponent(data.username ?? '')}`,
              { signal }
            );
            enforce(response.status).equals(404);
          }, 300)
        );
      }, [data.username]);
    }
  );

  test('password', 'A password of 12 characters or more is stronger', () => {
    warn();
    enforce(data.password).longerThanOrEquals(12);
  });
});
```

## Limit requests

| Tool                                       | Import                                 | Effect                                                                                                                              |
| ------------------------------------------ | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `debounce(testBody, delayMs)`              | `import debounce from 'vest/debounce'` | waits for a pause in the runs and executes only the latest. A debounced test is pending even when its body is synchronous.          |
| `memo(callback, deps, { cacheSize, ttl })` | `import { memo } from 'vest/memo'`     | reuses the tests and results of a dependency list it has seen. List every input that changes the outcome. `ttl` is in milliseconds. |

Skip `memo` when the answer must be fresh on every run.

## Wait for completion

The run returns its result at once: synchronous selectors work immediately, and `isPending()` is `true` while async tests run.

| Caller needs                              | Use                                                    |
| ----------------------------------------- | ------------------------------------------------------ |
| one settled result, for example on submit | `const result = await suite.run(data)`                 |
| a UI update after each test settles       | `suite.afterEach(() => render(suite.get())).run(data)` |
| the completion of one field               | `suite.afterField('username', cb).run(data)`           |

Register `afterEach` and `afterField` on every run and put any condition inside the callback. When a newer run replaces an older one, awaiting the older run resolves with the newest result.

In ngx-vest-forms v3 the form directive starts a new focused run for every edit, so the stale request is aborted as long as the test passes `signal` on.

## Warnings

A warning is a message that leaves the field valid: password strength, a format recommendation.

- Synchronous test, or a severity known before the first `await`: call `warn()` as the first statement of the test body.
- Severity decided after an `await`: take the setter before the `await` and call it afterwards.

```ts
test(
  'password',
  'This password appears in a known breach',
  async ({ signal }) => {
    const markAsWarning = useWarn();
    const breached = await isBreached(data.password, signal);
    markAsWarning();
    enforce(breached).isFalsy();
  }
);
```

Read warnings with `hasWarnings(field)` and `getWarnings(field)`.

## Answer shape

Show the synchronous test and the async test of a field together, and say whether each message is an error or a warning.

The guides `async-validation-race-conditions` and `memo-and-debounce` under `https://vestjs.dev/docs/guides/` show full flows.
