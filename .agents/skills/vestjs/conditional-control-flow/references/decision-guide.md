# Vest.js 5.4 control-flow decision guide

Use this quick guide when choosing between Vest’s conditional APIs.

| Need | Preferred API | Why |
|---|---|---|
| Validate only the active field | `only(field)` | Keeps interactive validation focused |
| Revalidate a linked field too | `include('fieldB').when('fieldA')` or functional `.when(...)` | Encodes field dependency directly |
| Temporarily exclude tests from this run, but keep them part of validity | `skip(...)` / `skipWhen(...)` | Useful when tests should still count unless truly omitted |
| Remove tests from execution **and** validity while a branch is inactive | `omitWhen(...)` | Best fit for conditional sections and feature flags |
| Allow an empty field without invalidating the suite | `optional(...)` | Expresses optionality rather than hidden-branch logic |

## Important semantic differences

### `skipWhen(...)`

- skipped tests still count against `isValid()`
- useful when the condition depends on intermediate suite state
- poor fit for hidden branches that should not block submission

### `omitWhen(...)`

- omitted tests do not run
- omitted tests do not contribute messages
- omitted tests do not count against `isValid()`

### `optional(...)`

- says the field itself may be blank or omitted
- does not mean “this branch of the form is hidden”
- can coexist with warnings, but it is not a warning mechanism

## Smell checks

- If the user says “this hidden section should stop blocking submit”, prefer `omitWhen(...)`.
- If the user says “validate confirm when password changes too”, prefer `include(...).when(...)`.
- If the user says “field can be left empty”, prefer `optional(...)`.
- If the user says “validate only what the user touched”, prefer `only(field)` plus result-based display logic.
