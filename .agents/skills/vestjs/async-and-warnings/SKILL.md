---
name: async-and-warnings
description: Helps developers write safe async and warning-based validations in Vest.js 5.4. Use this whenever the user mentions async tests, server checks, username/email availability, `AbortSignal`, stale requests, `warn()`, non-blocking guidance, `.done()`, pending state, or asks how to keep async validation responsive and correct.
---

# Vest.js 5.4 async and warning guidance

Use this skill when the suite needs **remote work, cancellation, pending state, or non-blocking warnings**.

## Core rules

1. An async Vest test returns a promise or is declared `async`.
2. In Vest 5.4, each async test receives an `AbortSignal` via the test context.
3. Pass that `signal` into async work when supported.
4. Guard expensive async checks behind prerequisite sync validation.
5. Call `warn()` synchronously at the top of the test body.
6. Never call `.done()` conditionally.

## Recommended async pattern

1. Add a cheap synchronous test first.
2. Use `skipWhen(res => res.hasErrors(field), ...)` to avoid firing remote validation when prerequisites already failed.
3. Inside the async `test(...)`, accept `{ signal }`.
4. Pass `signal` into `fetch` or any cancellable adapter.
5. Use `isPending()` or `isPending(field)` to drive loading UI.

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

## `.done()` guidance

Use `.done(...)` when the user needs a callback after:

- the whole suite finishes, or
- a specific field finishes

Keep the `.done(...)` registration unconditional. Put branching logic inside the callback instead.

## Pitfalls to fix immediately

- async tests without `AbortSignal` handling
- remote validation that runs before basic local validation passes
- calling `warn()` after `await`
- treating warnings as blocking errors
- conditional `.done(...)` registration around async runs
- custom pending flags when `isPending()` already exists

## Output style

When answering:

- show the sync prerequisite test and async test together
- include the `{ signal }` parameter when relevant
- explain whether the message is blocking (`error`) or advisory (`warn`)

## References to consult when needed

- `../../../instructions/vest.instructions.md`
- `https://vestjs.dev/docs/5.x/writing_tests/async_tests`
- `https://vestjs.dev/docs/5.x/writing_tests/warn_only_tests`
- `https://vestjs.dev/docs/5.x/writing_your_suite/accessing_the_result`
