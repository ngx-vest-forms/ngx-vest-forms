---
name: vestjs
description: Routes Vest.js 5.4 questions to the right workflow. Use this whenever the user broadly asks about Vest.js validation, wants help writing or refactoring a Vest suite, asks for 5.x best practices, or mentions `only`, `skip`, `include`, `skipWhen`, `omitWhen`, `optional`, `warn`, `group`, `each`, `mode`, async validations, result access, or typed suites without yet narrowing the exact problem.
license: MIT
metadata:
  author: ngx-vest-forms
  version: "1.0"
---

# Vest.js router skill

Use this as the broad entry point for **Vest.js guidance in this repository**.

## Version contract

This skill is a **stable public router**.

In this repository, it currently defaults to the **Vest 5.4.x / 5.x** lane.

- Prefer the `5.x` documentation set.
- Do not casually mix in Vest 6 guidance.
- If the user is clearly asking about a later major version, say so and avoid pretending the APIs are the same.

Read `references/version-selection.md` before changing that default or adding another major-version lane.

## Internal versioned layout

This package keeps `vestjs` as the installable public skill name, while version-specific material lives internally.

- `references/5.x/` contains the current 5.x source map and notes.
- `evals/5.x.json` contains the current 5.x eval set.
- `evals/evals.json` remains the active default alias for the current supported lane.

When 6.x support is added, mirror the same structure under `references/6.x/` and `evals/6.x.json` rather than renaming the public skill immediately.

## Start from the invariant layer

Assume the repo instruction file already enforces the baseline Vest rules:

- call `only()` unconditionally when using selective validation
- never call `only()`, `skip()`, or `.done()` conditionally
- use `result.isTested(field)` instead of parallel dirty tracking
- prefer `skipWhen` / `omitWhen` / `include.when` over ad-hoc branching
- keep async validations cancellable

Do not restate those basics unless they are directly relevant to the user’s issue.

## Available workflow sub-skills

Use these nested workflow sub-skills when the feature area is clear:

| Sub-skill | Use when | Path |
|---|---|---|
| `core` | first suites, `create`, `staticSuite`, `test`, `enforce`, `only`, stateful vs stateless usage | `core/SKILL.md` |
| `conditional-control-flow` | `skip`, `only`, `include`, `skipWhen`, `omitWhen`, `optional`, dependent fields, conditional validation | `conditional-control-flow/SKILL.md` |
| `async-and-warnings` | async tests, `AbortSignal`, username availability checks, `warn()`, `.done()`, async hygiene | `async-and-warnings/SKILL.md` |
| `results-groups-and-types` | result APIs, `isValid`, `hasErrors`, `group`, `each`, execution modes, TypeScript generics, typed runtime helpers | `results-groups-and-types/SKILL.md` |
| `enforce-and-custom-rules` | reusable `enforce` logic, `condition`, `extend`, `compose`, custom matcher typing | `enforce-and-custom-rules/SKILL.md` |
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
- using `warn()` for non-blocking guidance
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

## Core references

- `references/version-selection.md`
- `references/5.x/source-map.md`
- `.github/instructions/vest.instructions.md`
- `https://vestjs.dev/docs/5.x/get_started`
- `https://vestjs.dev/docs/5.x/api_reference`
- `https://vestjs.dev/docs/5.x/typescript_support`

## Goal

Use this skill to keep **`vestjs` as the stable entry point**, identify the correct version lane for the current context, and then route into the matching focused sub-skill instead of giving a shapeless overview of the whole library.
