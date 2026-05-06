---
name: results-groups-and-types
description: Helps developers inspect Vest.js 5.4 results and structure larger typed suites. Use this whenever the user mentions `isValid`, `hasErrors`, `getErrors`, `getWarnings`, `isPending`, `isTested`, `group`, `each`, execution `mode`, multi-step forms, dynamic collections, or asks how to type suites and result APIs in TypeScript.
---

# Vest.js 5.4 results, groups, and type guidance

Use this skill when the question is about **reading suite state, organizing larger suites, or adding type safety**.

## Result access model

Vest exposes the same suite state in three equivalent ways:

1. the immediate result object returned by `suite(...)`
2. methods called directly on the suite
3. `suite.get()`

Use whichever is clearest for the situation, but keep the choice consistent within one example.

## Result methods to reach for first

- `isValid()` when the user asks about overall or field validity
- `hasErrors()` / `hasWarnings()` for quick checks
- `getErrors()` / `getWarnings()` when the messages matter
- `isPending()` for async state
- `isTested()` for “has this field been validated yet?”
- `done(...)` when the user needs a completion callback

If the user only wants to know whether a field currently has problems, prefer `hasErrors(field)` over manual inspection of arrays.

## Execution modes

Vest 5.4 supports three execution modes:

- `Modes.EAGER` — default; stop after the first failure for a field
- `Modes.ALL` — collect all failures for a field
- `Modes.ONE` — stop after the first failing test across the suite

Practical guidance:

- use `EAGER` for interactive validation
- use `ALL` when the user wants a fuller error list
- use `ONE` for fast-fail flows, often server-side

## Grouping tests

Use named `group(name, callback)` when the group needs to appear in the result object.

That is especially useful for:

- multi-step or multi-tab forms
- flows where each section needs separate status
- querying `hasErrorsByGroup(...)` or `isValidByGroup(...)`

Use unnamed `group(callback)` when the goal is structural grouping without exposing a named group in results.

## Dynamic collections with `each`

Use `each(list, callback)` for repeated or user-generated fields.

Important rule: provide a **stable key** to each dynamic test when ordering or membership can change. Do not use shifting indexes as durable identity when a better item key exists.

## TypeScript guidance

Vest 5.4 supports typed suites through `create<FieldName, GroupName, Callback>(...)`.

Use typed suites when:

- field names should autocomplete
- result access should reject impossible field names
- group names should stay constrained

If the user wants typed runtime helpers like `only`, `group`, or `test`, destructure them from the typed suite so they inherit the suite’s type information.

## Pitfalls to fix immediately

- using custom dirty state instead of `isTested()`
- using `getErrors()` when `hasErrors()` would be simpler and less fragile
- naming groups even though the user never needs group-level results
- forgetting stable keys in `each(...)`
- claiming only `EAGER` and `ALL` exist in Vest 5.4 when `ONE` also exists
- typing result access but leaving runtime helper calls untyped when the suite can provide them

## Output style

When answering:

- match the result method to the user’s question instead of dumping the whole API
- show named groups only when group queries matter
- keep TypeScript unions small and realistic in examples

## References to consult when needed

- `../../../instructions/vest.instructions.md`
- `https://vestjs.dev/docs/5.x/writing_your_suite/accessing_the_result`
- `https://vestjs.dev/docs/5.x/writing_your_suite/execution_modes`
- `https://vestjs.dev/docs/5.x/writing_tests/advanced_test_features/grouping_tests`
- `https://vestjs.dev/docs/5.x/writing_tests/advanced_test_features/dynamic_tests`
- `https://vestjs.dev/docs/5.x/typescript_support`
- `https://vestjs.dev/docs/5.x/api_reference`
