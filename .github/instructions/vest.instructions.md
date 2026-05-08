---
description: 'Best practices and guidelines for using vestjs'
applyTo: '**/*.{ts,html,component.ts}'
---

# Vest.js validation instructions (minimal)

Use the `vestjs` skill for detailed workflow guidance. This file keeps only the repo-wide Vest 6.3.x invariants that should apply everywhere in this codebase.

Non-negotiables for this repository:

1. Use Vest 6 suite-object execution. Keep suite callbacks model-only, for example `create((model) => { ... })`. Do not use callback `field` parameters, direct callable suites, or `only(field)` inside the callback as if they were current patterns.
2. Handle focused validation at the call site with `suite.only(field).run(model)` or `suite.focus(...)`.
3. Treat `suite.run()` as stateful. Call `suite.reset()` on form reset, and use `suite.runStatic()` for stateless or server-style execution. Reach for `staticSuite(...)` only when a dedicated stateless suite shape is clearly better.
4. Prefer result APIs such as `result.isTested(field)`, `hasErrors`, `getErrors`, and `isPending` instead of parallel dirty, touched, or pending state.
5. Prefer `skipWhen`, `omitWhen`, `include.when`, and `optional` over ad-hoc branching. Use `omitWhen` when a hidden or inactive branch should stop affecting validity entirely.
6. Keep async tests cancellable with `{ signal }`, guard expensive async work with `skipWhen`, and `await suite.run(data)` when completion matters.
7. Use `warn()` only for guidance that must not block submission. Call `warn()` before any `await`; if warning severity must be set after async work, use `useWarn()`.
8. When native schema validation is useful, prefer `create((data) => { ... }, enforce.shape(...))`. Focused runs subset the schema automatically. Advanced schema helpers such as `enforce.record`, `enforce.lazy`, and `enforce.tuple` belong in deeper skill guidance, not in baseline examples.
9. Prefer patterns already used in this repository’s examples, docs, and skills over generic Vest snippets.

For deeper topic guidance, route to `.agents/skills/vestjs/`:

- `core`
- `conditional-control-flow`
- `async-and-warnings`
- `results-groups-and-types`
- `enforce-and-custom-rules`
- `server-side-validation`

Generate code with accessibility in mind: tie error text to inputs via `aria-describedby`, keep focus management predictable, and expose warnings without blocking keyboard flows.
