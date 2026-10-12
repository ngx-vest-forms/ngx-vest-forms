---
name: enforce-and-custom-rules
description: Helps developers design reusable Vest.js 6 `enforce` rules and custom validators. Use this whenever the user mentions `enforce.condition`, `enforce.extend`, `compose`, custom matchers, reusable domain rules, schema-like validation, `create(..., schema)`, `enforce.shape`, `enforce.record`, `enforce.lazy`, `enforce.tuple`, `enforce.context()`, or asks how to type custom `enforce` rules in TypeScript.
---

# Vest.js 6 enforce and custom-rule guidance

Use this skill when the question is about **reusable rule design**, not just individual `test(...)` blocks.

## First choose the right level of reuse

Ask yourself:

- Should the suite use native Vest schema validation and type inference? Use `create((data) => { ... }, enforce.shape(...))` before inventing a separate external schema layer.
- Is the logic only needed once inside a single test? Use `enforce.condition(...)` inline.
- Is the logic reusable across many fields or suites? Use `enforce.extend(...)`.
- Are several existing rules usually applied together? Use `compose(...)` from `n4s` (`import { compose } from 'n4s';` — the `vest/enforce/compose` subpath does not exist in Vest 6.3).

Do not jump straight to a globally extended custom rule when a one-off `condition(...)` would be clearer.

## Core patterns

### Schema-aware `create(..., schema)`

Use a schema-aware suite when the structure of the input should be validated before tests run and the suite should infer its types from native n4s rules.

- Start with `enforce.shape(...)` for the common object case.
- Use `enforce.record(...)`, `enforce.lazy(...)`, or `enforce.tuple(...)` only when the schema truly needs dynamic keys, recursive or lazy resolution, or tuple semantics.
- Focused runs automatically subset the schema for the focused fields, so `suite.only(field).run(model)` still works with partial payloads.

### `enforce.condition(...)`

Use for small, local custom logic.

- Good for one-off checks inside a single suite.
- Can return either a boolean or a `{ pass, message }` object.
- Prefer it when the rule does not deserve a reusable name yet.

### `enforce.extend(...)`

Use for reusable domain rules.

- Rules receive the enforced value first, followed by any matcher arguments.
- A custom rule can return either a boolean or an object with `pass` and `message`.
- Keep rule names domain-meaningful, like `isBusinessEmail` or `matchesField`, not implementation trivia.

### `compose(...)`

Use when a set of existing `enforce` rules travels together.

- Best for reusable schemas or shared object fragments.
- Especially useful with `enforce.shape(...)`, `enforce.loose(...)`, and nested entity rules.
- If composed rules contain `shape` fragments that extend one another, prefer `loose(...)` where extension is expected.

## `enforce.context()` guidance

Use `enforce.context()` only when a custom rule genuinely needs surrounding object context.

- It can read parent values and metadata.
- It is powerful, but makes rules more coupled to object shape.
- Prefer explicit arguments first; use context when that would be awkward or impossible.

## TypeScript guidance

If the user wants typed custom matchers, add declaration merging in a `.d.ts` file.

- Extend the `n4s` matcher interface with the new rule names.
- Keep signatures value-first so they align with `enforce.extend(...)`.
- Show both runtime registration and type declaration together when possible.

## Pitfalls to fix immediately

- overusing `enforce.extend(...)` for logic that belongs in one local test
- returning inconsistent message shapes from custom rules
- hiding heavy object traversal inside context-aware custom matchers without documenting it
- composing rigid `shape(...)` rules where `loose(...)` is required for extension
- adding custom rules without TypeScript declarations when the project relies on matcher autocomplete
- treating advanced schema helpers as default examples when a small `enforce.shape(...)` schema is enough

## Output style

When answering:

- start with the reuse decision: `condition`, `extend`, or `compose`
- show the runtime rule and the TypeScript typing together when relevant
- keep custom rule names business-readable

## Reference file

Start with `references/design-guide.md` when the user is unsure whether to build a one-off check, a custom matcher, or a composed validator.

## References to consult when needed

- `references/design-guide.md`
- `../../../../.github/instructions/vest.instructions.md`
- `https://vestjs.dev/docs/writing_your_suite/schema_validation`
- `https://vestjs.dev/docs/enforce/composing_enforce_rules`
- `https://vestjs.dev/docs/enforce/creating_custom_rules`
- `https://vestjs.dev/docs/typescript_support`
