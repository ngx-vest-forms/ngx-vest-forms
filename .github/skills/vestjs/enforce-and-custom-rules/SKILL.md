---
name: enforce-and-custom-rules
description: Helps developers design reusable Vest.js 5.4 `enforce` rules and custom validators. Use this whenever the user mentions `enforce.condition`, `enforce.extend`, `compose`, custom matchers, reusable domain rules, schema-like validation, `enforce.context()`, or asks how to type custom `enforce` rules in TypeScript.
---

# Vest.js 5.4 enforce and custom-rule guidance

Use this skill when the question is about **reusable rule design**, not just individual `test(...)` blocks.

## First choose the right level of reuse

Ask yourself:

- Is the logic only needed once inside a single test? Use `enforce.condition(...)` inline.
- Is the logic reusable across many fields or suites? Use `enforce.extend(...)`.
- Are several existing rules usually applied together? Use `compose(...)` from `vest/enforce/compose`.

Do not jump straight to a globally extended custom rule when a one-off `condition(...)` would be clearer.

## Core patterns

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

## Output style

When answering:

- start with the reuse decision: `condition`, `extend`, or `compose`
- show the runtime rule and the TypeScript typing together when relevant
- keep custom rule names business-readable

## Reference file

Start with `references/design-guide.md` when the user is unsure whether to build a one-off check, a custom matcher, or a composed validator.

## References to consult when needed

- `references/design-guide.md`
- `../../../instructions/vest.instructions.md`
- `https://vestjs.dev/docs/5.x/enforce/composing_enforce_rules`
- `https://vestjs.dev/docs/5.x/enforce/creating_custom_rules`
- `https://vestjs.dev/docs/5.x/typescript_support`
