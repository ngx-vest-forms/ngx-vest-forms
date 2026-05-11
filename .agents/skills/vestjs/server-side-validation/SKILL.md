---
name: server-side-validation
description: Helps developers use Vest.js 6 safely in server and request-validation workflows. Use this whenever the user mentions API validation, Node/server-side Vest usage, `runStatic`, request isolation, fast-fail behavior, SSR hydration, or asks how to structure Vest for backend or submit-only validation.
---

# Vest.js 6 server-side validation guidance

Use this skill when the problem is about **request isolation, stateless validation, or backend-oriented execution**.

## Core rule

On the server, treat validation as **stateless by default**.

Vest’s normal stateful behavior is useful in interactive clients, but shared suite state across requests can produce incorrect results.

## Preferred approach

Use `suite.runStatic(data)` for server-side or request-style validation.

- each run creates a fresh result
- there is no cross-request state leakage
- there is no need to `reset()` between calls
- if async tests exist, the returned result may still be promise-like, so `await` it or handle the thenable result explicitly

In Vest 6, `staticSuite(...)` was removed. If the user shows older examples or code that still uses it, migrate them to `create(...)` plus `runStatic(...)`.

## Stateful fallback

If a regular `create(...)` suite must be reused on the server in a stateful way, that should be an intentional and well-contained choice. Most request validation should still call `suite.runStatic(data)`.

Stateful server usage is the exception, not the default.

## Execution mode guidance

Choose mode based on what the server needs to return:

- `Modes.ONE` for fast-fail request validation when one failure is enough
- `Modes.ALL` when the API should return a fuller error list
- `Modes.EAGER` when field-level short-circuiting is still the best tradeoff

## Output shaping guidance

For server-side flows, prefer examples that show:

- input payload
- suite run
- `isValid()` or `hasErrors()`
- structured `getErrors()` output for responses

If the suite includes async tests, show either `await suite.runStatic(data)` or an explicit thenable branch so the response only uses the settled result.

Keep the example stateless unless the user explicitly asks about shared suite instances.

## Full-stack note

If the user is asking about client/server continuity rather than backend-only validation, mention that Vest also supports suite serialization and resumption via `SuiteSerializer.serialize(...)` and `SuiteSerializer.resume(...)`. Do not drag that into a basic API validation answer unless it is relevant.

## Pitfalls to fix immediately

- using one long-lived stateful suite instance across requests without resets
- recommending stateful `.run(...)` when `suite.runStatic(...)` would avoid cross-request state entirely
- recommending removed `staticSuite(...)` in Vest 6 code
- pretending server-side validation needs interactive field-scoped patterns by default
- using the reset workaround as the primary example instead of the stateless option

## Output style

When answering:

- start by explaining why request isolation matters
- prefer `suite.runStatic(...)` first
- call out the execution mode choice when the user mentions API response behavior

## References to consult when needed

- `../../../instructions/vest.instructions.md`
- `https://vestjs.dev/docs/server_side_validations`
- `https://vestjs.dev/docs/suite_serialization`
- `https://vestjs.dev/docs/writing_your_suite/execution_modes`
- `https://vestjs.dev/docs/api_reference`
