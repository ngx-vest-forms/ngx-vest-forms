---
name: vestjs
description: Routes Vest.js 6 questions to the right workflow. Use this whenever the user broadly asks about Vest.js validation, wants help writing or refactoring a suite, asks for modern best practices, or mentions `only`, `focus`, `skip`, `include`, `skipWhen`, `omitWhen`, `optional`, `warn`, `useWarn`, `group`, `each`, `mode`, async validations, result access, typed suites, or native schema-aware suites without yet narrowing the exact problem.
license: MIT
metadata:
  author: ngx-vest-forms
  version: "1.0"
---

# Vest.js router skill

Use this as the broad entry point for **Vest.js guidance in this repository**.

## Version contract

This skill is a **stable public router**.

In this repository, it currently defaults to the **Vest 6.x** lane.

- Prefer the current Vest 6 documentation set.
- Do not reintroduce the Vest 5 callback-field pattern as if it were current guidance.
- If the user is explicitly migrating older 5.x code, call that out and explain the API differences instead of papering over them.

Read `references/version-selection.md` before changing that default or adding another major-version lane.

## Internal versioned layout

This package keeps `vestjs` as the installable public skill name, while version-specific material lives internally.

- `references/5.x/` contains historical 5.x source notes.
- `evals/5.x.json` contains historical 5.x eval coverage.
- `evals/evals.json` should reflect the active supported lane.

If new major-version support is added later, mirror the same structure under a new versioned lane rather than renaming the public skill immediately.

## Start from the invariant layer

Assume the repo instruction file already enforces the baseline Vest rules:

- keep suite callbacks model-only unless a newer documented API explicitly requires otherwise
- handle field focus at the call site via `suite.only(field).run(model)` or `suite.focus(...)`
- never call `only()` inside the suite callback as if it were the current default pattern
- use `result.isTested(field)` instead of parallel dirty tracking
- prefer `skipWhen` / `omitWhen` / `include.when` over ad-hoc branching
- keep async validations cancellable

Do not restate those basics unless they are directly relevant to the user’s issue.

## Available workflow sub-skills

Use these nested workflow sub-skills when the feature area is clear:

| Sub-skill | Use when | Path |
|---|---|---|
| `core` | first suites, `create`, `create(..., schema)`, `runStatic`, `test`, `enforce`, `suite.only`, stateful vs stateless usage | `core/SKILL.md` |
| `conditional-control-flow` | `skip`, `focus`, `only`, `include`, `skipWhen`, `omitWhen`, `optional`, dependent fields, conditional validation | `conditional-control-flow/SKILL.md` |
| `async-and-warnings` | async tests, `AbortSignal`, username availability checks, `warn()`, `useWarn()`, `.done()`, async hygiene | `async-and-warnings/SKILL.md` |
| `results-groups-and-types` | result APIs, `isValid`, `hasErrors`, `group`, `each`, execution modes, TypeScript generics, typed runtime helpers | `results-groups-and-types/SKILL.md` |
| `enforce-and-custom-rules` | reusable `enforce` logic, `condition`, `extend`, `compose`, native schema-aware suites, `enforce.shape`, `enforce.record`, `enforce.lazy`, `enforce.tuple`, custom matcher typing | `enforce-and-custom-rules/SKILL.md` |
| `server-side-validation` | API validation, `runStatic`, optional `staticSuite`, request isolation, stateless server flows | `server-side-validation/SKILL.md` |

## Route to the right workflow

### Core suite setup

Read `core/SKILL.md` when the user is:

- starting a Vest suite from scratch
- asking for a “proper” or idiomatic Vest example
- unsure when to use `create`, `create(..., schema)`, `runStatic`, or `staticSuite`
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
- asking how to use native schema-aware suites with `create(..., schema)`
- asking about `enforce.condition`, `enforce.extend`, or `compose`
- asking about `enforce.shape`, `enforce.record`, `enforce.lazy`, or `enforce.tuple`
- designing custom rule APIs or TypeScript matcher declarations
- validating object shapes with reusable composed rules

### Server-side validation

Read `server-side-validation/SKILL.md` when the user is:

- validating request payloads or backend DTOs
- asking how to use Vest safely on Node/server runtimes
- deciding between `suite.runStatic(...)` and `staticSuite(...)` on the server
- asking about fast-fail vs full error collection for API responses

## Routing heuristics

- If the user mentions several of these at once, combine the relevant sub-skills instead of forcing a single lens.
- If the user is working specifically with Angular template-driven forms and ngx-vest-forms, combine this skill with the `ngx-vest-forms` skill rather than answering as if Vest were the only moving part.
- If the user only wants raw API signatures from the library docs, prioritize documentation-backed answers over inventing abstractions.
- If the question is mostly about `enforce` rule design or backend payload validation, do not over-route it through the basic `core` skill just because a suite also exists.

## Core references

- `references/version-selection.md`
- `references/5.x/source-map.md`
- `.github/instructions/vest.instructions.md`
- `https://vestjs.dev/docs/get_started`
- `https://vestjs.dev/docs/api_reference`
- `https://vestjs.dev/docs/typescript_support`

## Goal

Use this skill to keep **`vestjs` as the stable entry point**, identify the correct version lane for the current context, and then route into the matching focused sub-skill instead of giving a shapeless overview of the whole library.
