---
name: async-and-warnings
description: Helps developers write safe async and warning-based validations in Vest.js 6. Use this whenever the user mentions async tests, server checks, username/email availability, `AbortSignal`, stale requests, `warn()`, `useWarn()`, non-blocking guidance, `afterEach()`, `afterField()`, pending state, or asks how to keep async validation responsive and correct.
---

# Vest.js 6 async and warning guidance

Use this skill when the suite needs **remote work, cancellation, pending state, or non-blocking warnings**.

## Core rules

1. An async Vest test returns a promise or is declared `async`.
2. In Vest 6, each async test receives an `AbortSignal` via the test context.
3. Pass that `signal` into async work when supported.
4. Debounce validation at the UI layer when remote checks would otherwise fire on every keystroke.
5. Guard expensive async checks behind prerequisite sync validation.
6. Call `warn()` synchronously at the top of the test body, or use `useWarn()` when warning severity must be set after an `await`.
7. `suite.run()` returns a hybrid result object: sync selectors are available immediately, and you can `await` it for final completion.
8. Register `suite.afterEach()` and `suite.afterField()` unconditionally; put branching logic inside the callback instead.

## Recommended async pattern

1. Add a cheap synchronous test first.
2. Use `skipWhen(res => res.hasErrors(field), ...)` to avoid firing remote validation when prerequisites already failed.
3. Inside the async `test(...)`, accept `{ signal }`.
4. Pass `signal` into `fetch` or any cancellable adapter.
5. Use `isPending()` or `isPending(field)` to drive loading UI.
6. Prefer `suite.only(field).run(model)` when async validation should follow the active field instead of the whole form.
7. Use `await suite.run(data)`, `suite.afterEach()`, or `suite.afterField(field, ...)` depending on whether the caller needs one final result or reactive updates while async tests complete.

## `AbortSignal` guidance

Vest cancels stale async tests when the same test reruns before completion.

Use that signal to:

- abort `fetch` requests
- short-circuit work if `signal.aborted` is already true
- prevent stale async completions from wasting time or clobbering intent

Do not ignore the signal when the underlying API can accept it.

## `warn()` guidance

Use `warn()` when the message is useful but should **not** block validity or submission.

Common examples:

- password strength guidance
- soft formatting recommendations
- advisory checks that are informative rather than mandatory

Important limitation: if the test is async, call `warn()` in the synchronous portion of the test body, ideally first. Calling it after `await` means it may not take effect.

If the warning can only be determined after async work finishes, use `useWarn()` to capture a setter before `await` and call that setter later.

## Completion guidance

In Vest 6, result `.done(...)` was removed.

Use these patterns instead:

- `await suite.run(data)` when the caller can wait for one final result
- `suite.afterEach(() => { ... }).run(data)` when the UI should update after the sync pass and again as async tests finish
- `suite.afterField('fieldName', () => { ... }).run(data)` when only one field’s completion matters

If the user is migrating older code, translate it explicitly:

- `res.done(cb)` → `suite.afterEach(cb).run(data)` or `await suite.run(data)`
- `res.done('field', cb)` → `suite.afterField('field', cb).run(data)`

Register completion callbacks unconditionally. Put conditional logic inside the callback body instead.

## Pitfalls to fix immediately

- async tests without `AbortSignal` handling
- remote validation on every keystroke without debounce
- remote validation that runs before basic local validation passes
- calling `warn()` after `await`
- forgetting `useWarn()` when a warning should be set after async work resolves
- treating warnings as blocking errors
- teaching result `.done(...)` as a current Vest 6 API
- conditional `afterEach()` / `afterField()` registration around async runs
- custom pending flags when `isPending()` already exists

## Output style

When answering:

- show the sync prerequisite test and async test together
- include the `{ signal }` parameter when relevant
- explain whether the message is blocking (`error`) or advisory (`warn`)

## References to consult when needed

- `../../../instructions/vest.instructions.md`
- `https://vestjs.dev/docs/writing_tests/async_tests`
- `https://vestjs.dev/docs/writing_tests/warn_only_tests`
- `https://vestjs.dev/docs/writing_your_suite/accessing_the_result`
- `https://vestjs.dev/docs/writing_your_suite/handling_completion`
