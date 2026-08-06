---
name: vestjs
description: Routes Vest.js 5.4 questions to the right workflow. Use this for suite setup, conditional validation, async work and warnings, results or types, reusable rules, and server-side validation.
license: MIT
metadata:
  author: ngx-vest-forms
  version: "1.0"
---

# Vest.js router skill

Use this as the broad entry point for developers using **Vest.js 5.4**.

## Shared invariants

Apply these rules in every Vest 5.4 answer and implementation:

- Keep the suite structure stable; call `only()`, `skip()`, and `.done()` consistently across runs.
- Use `result.isTested(field)` for validation touch state rather than parallel flags.
- Choose `skipWhen`, `omitWhen`, `optional`, and `include.when` for their result semantics instead of ad-hoc test-registration branches.
- Pass each async test's `AbortSignal` to cancellable work and use `warn()` before asynchronous work or `useWarn()` when severity is decided after it.

Read `references/version-selection.md` only when the requested Vest major differs
from 5.4 or the target version is unclear.

## Available workflow sub-skills

Use these nested workflow sub-skills when the feature area is clear:

| Sub-skill | Use when | Path |
|---|---|---|
| `core` | first suites, `create`, `staticSuite`, `test`, `enforce`, `only`, stateful vs stateless usage | `core/SKILL.md` |
| `conditional-control-flow` | `skip`, `only`, `include`, `skipWhen`, `omitWhen`, `optional`, dependent fields, conditional validation | `conditional-control-flow/SKILL.md` |
| `async-and-warnings` | async tests, `AbortSignal`, `warn()` / `useWarn()`, `.done()`, pending state | `async-and-warnings/SKILL.md` |
| `results-groups-and-types` | result APIs, `isValid`, `hasErrors`, `group`, `each`, execution modes, TypeScript generics, typed runtime helpers | `results-groups-and-types/SKILL.md` |
| `enforce-and-custom-rules` | reusable or composable validations, `enforce` logic, `condition`, `extend`, `compose`, custom matcher typing | `enforce-and-custom-rules/SKILL.md` |
| `server-side-validation` | API validation, `staticSuite`, request isolation, stateless server flows | `server-side-validation/SKILL.md` |

## Route to the right workflow

### Core suite setup

Read `core/SKILL.md` when the user is:

- starting a Vest suite from scratch
- asking for a “proper” or idiomatic Vest example
- unsure when to use `create` vs `staticSuite`
- asking about how Vest fits into app code at all

### Conditional validation flow

Read `conditional-control-flow/SKILL.md` when the user is:

- deciding between `skipWhen`, `omitWhen`, and `optional`
- wiring linked fields like password/confirm password
- asking why skipped tests still affect validity
- dealing with conditional sections, feature flags, or dependent fields

### Async validation and warnings

Read `async-and-warnings/SKILL.md` when the user is:

- validating against a server or remote service
- asking how to cancel stale async work
- using `warn()` or `useWarn()` for non-blocking guidance
- asking where `.done()` belongs or why async callbacks are flaky

### Results, groups, collections, and types

Read `results-groups-and-types/SKILL.md` when the user is:

- inspecting suite output or field state
- asking about `isTested`, `isPending`, `getErrors`, or group-specific queries
- working with multi-step forms or grouped validations
- validating dynamic arrays with `each`
- asking for typed suites in TypeScript

### Enforce composition and custom rules

Read `enforce-and-custom-rules/SKILL.md` when the user is:

- trying to make a reusable matcher or domain validator
- splitting a large suite into reusable validation helpers
- asking about `enforce.condition`, `enforce.extend`, or `compose`
- designing custom rule APIs or TypeScript matcher declarations
- validating object shapes with reusable composed rules

### Server-side validation

Read `server-side-validation/SKILL.md` when the user is:

- validating request payloads or backend DTOs
- asking how to use Vest safely on Node/server runtimes
- deciding between `create(...)` and `staticSuite(...)` on the server
- asking about fast-fail vs full error collection for API responses

## Routing heuristics

- If the user mentions several of these at once, combine the relevant sub-skills instead of forcing a single lens.
- If the user is working specifically with Angular template-driven forms and ngx-vest-forms, combine this skill with the `ngx-vest-forms` skill rather than answering as if Vest were the only moving part.
- If the user only wants raw API signatures from the library docs, prioritize documentation-backed answers over inventing abstractions.
- If the question is mostly about `enforce` rule design or backend payload validation, do not over-route it through the basic `core` skill just because a suite also exists.

## References

- `references/version-selection.md` (different or unclear Vest major)
- `references/5.x/source-map.md`

## Goal

Route each question into the smallest matching workflow, combining workflows only
when the user’s problem crosses their boundaries.
