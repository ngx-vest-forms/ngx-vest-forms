---
name: results-groups-and-types
description: Helps developers inspect Vest.js 6 results and structure larger typed suites. Use this whenever the user mentions `isValid`, `hasErrors`, `getErrors`, `getWarnings`, `getMessage`, `afterEach`, `afterField`, `isPending`, `isTested`, `group`, `each`, execution `mode`, multi-step forms, dynamic collections, `result.value`, or asks how to type suites and result APIs in TypeScript.
---

# Vest.js 6 results, groups, and type guidance

Use this skill when the question is about **reading suite state, organizing larger suites, or adding type safety**.

## Result access model

Vest exposes the same suite state in three equivalent ways:

1. the immediate result object returned by `suite.run(model)` (or `suite.only(field).run(model)` for focused runs)
2. methods called directly on the suite
3. `suite.get()`

Use whichever is clearest for the situation, but keep the choice consistent within one example.

When the suite contains async tests, the returned result is also promise-like: sync selectors still work immediately, and `await result` gives the fully settled result.

## Result and completion helpers to reach for first

- `isValid()` when the user asks about overall or field validity
- `hasErrors()` / `hasWarnings()` for quick checks
- `getErrors()` / `getWarnings()` when the messages matter
- `getError()` / `getWarning()` / `getMessage()` when the user needs the first message rather than arrays
- `isPending()` for async state
- `isTested()` for “has this field been validated yet?”
- `await suite.run()`, `suite.afterEach()`, or `suite.afterField()` when the user needs completion callbacks

If the user only wants to know whether a field currently has problems, prefer `hasErrors(field)` over manual inspection of arrays.

## Run metadata and completion

Reach for run metadata when the question is about “what happened in this run?” rather than just “is it valid?”

- `result.run.data` for the raw/parsed input of the current run
- `result.run.time` for execution timing metadata
- `result.run.focus` for the exact `only` / `skip` / `onlyGroup` / `skipGroup` modifiers used in that run

For completion handling in Vest 6:

- prefer `await suite.run(data)` for one final settled result
- use `suite.afterEach(() => { ... }).run(data)` for suite-wide reactive updates
- use `suite.afterField('fieldName', () => { ... }).run(data)` for field-specific completion

## Execution modes

Vest 6 supports three execution modes:

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
- querying `hasErrorsByGroup(...)`, `hasWarningsByGroup(...)`, `getErrorsByGroup(...)`, `getWarningsByGroup(...)`, or `isValidByGroup(...)`

Use unnamed `group(callback)` when the goal is structural grouping without exposing a named group in results.

## Dynamic collections with `each`

Use `each(list, callback)` for repeated or user-generated fields.

Important rule: provide a **stable key** as the last argument to each dynamic `test(...)` call when ordering or membership can change. Do not use shifting indexes as durable identity when a better item key exists.

## TypeScript guidance

Vest 6 supports typed suites through `create(...)` and typed result access on the returned suite object.

Use typed suites when:

- field names should autocomplete
- result access should reject impossible field names
- group names should stay constrained

If the user wants typed runtime helpers like `group` or `test`, keep the suite typed and let the suite-object methods (`run`, `only`, `focus`, `get`) carry the field/group information.

When the suite is schema-aware (`create(callback, schema)`), remember the parser typing model:

- `suite.run(...)` accepts the schema input type
- the callback data uses the parsed output type
- `result.value` holds the parsed output when the suite is valid
- `result.types.input` / `result.types.output` can carry the schema input/output typing information

## Pitfalls to fix immediately

- using custom dirty state instead of `isTested()`
- using `getErrors()` when `hasErrors()` would be simpler and less fragile
- naming groups even though the user never needs group-level results
- forgetting stable keys in `each(...)`
- claiming only `EAGER` and `ALL` exist when `ONE` also exists
- teaching result `.done()` as if it still exists in Vest 6
- teaching direct callable suite execution like `suite(model, field)` instead of `run()`/`only(...).run()`

## Output style

When answering:

- match the result method to the user’s question instead of dumping the whole API
- show named groups only when group queries matter
- keep TypeScript unions small and realistic in examples

## References to consult when needed

- `../../../../.github/instructions/vest.instructions.md`
- `https://vestjs.dev/docs/writing_your_suite/accessing_the_result`
- `https://vestjs.dev/docs/writing_your_suite/handling_completion`
- `https://vestjs.dev/docs/writing_your_suite/execution_modes`
- `https://vestjs.dev/docs/writing_your_suite/schema_validation`
- `https://vestjs.dev/docs/writing_tests/advanced_test_features/grouping_tests`
- `https://vestjs.dev/docs/writing_tests/advanced_test_features/dynamic_tests`
- `https://vestjs.dev/docs/typescript_support`
- `https://vestjs.dev/docs/api_reference`
