---
name: core
description: Helps developers build, explain, or refactor a Vest.js 5.4 validation suite. Use this whenever the user asks for a first Vest example, wants to write a suite from scratch, asks when to use `create` versus `staticSuite`, mentions `test` or `enforce`, or wants idiomatic 5.x suite structure without yet getting into advanced conditional or async behavior.
---

# Vest.js 5.4 core workflow

Use this skill to produce the default, idiomatic Vest 5.4 setup.

## Start from these rules

1. Keep the validation suite separate from feature or UI code.
2. Use `create(...)` for **stateful** client-side suites that rerun over time.
3. Use `staticSuite(...)` for **stateless** or server-style validation where each run should stand alone.
4. If selective validation is part of the design, accept a field parameter and call `only(field)` **unconditionally** near the top of the suite.
5. Use `test(fieldName, message, body)` for human-readable validations.
6. Use `enforce(...)` for clear assertions instead of hand-rolled boolean pyramids.
7. Prefer `result.isTested(field)` over custom touched or dirty flags when the question is “has this field been validated yet?”

## Recommended workflow

1. Define the data shape first.
2. Choose `create` or `staticSuite` based on whether state should persist between runs.
3. Add `only(field)` if the suite will validate interactively one field at a time.
4. Add `test(...)` blocks with stable field names and clear messages.
5. Return the suite and use the result object or `suite.get()` to inspect state.

## Canonical patterns

### Stateful UI suite

Use `create(...)` when the same suite instance will rerun as the user edits data.

### Stateless validation

Use `staticSuite(...)` for request validation, scripts, or isolated invocations where prior state should not affect the next run.

### Selective validation

If the suite accepts a current field, use:

- `only(field)` for focused validation during interaction
- no extra branching around the `only()` call itself

That keeps execution order stable across runs.

## Pitfalls to correct immediately

- putting validation logic inline in the UI instead of in a suite
- using `create(...)` when a stateless `staticSuite(...)` is the better fit
- wrapping `only(field)` in `if (field)`
- inventing duplicate form-state tracking when `isTested()` or `hasErrors()` already answers the question
- using vague messages that make result handling harder

## Output style

When answering the user:

- give a complete, minimal suite rather than disconnected one-liners
- explain why the suite is stateful or stateless
- keep field names, messages, and result access aligned with the example

## Quick decision hints

- “Validate as the user types” usually means `create(...)` plus `only(field)`.
- “Validate this payload on submit/server-side” usually means `staticSuite(...)`.
- “How do I start with Vest?” should trigger this skill first.

## References to consult when needed

- `../../../instructions/vest.instructions.md`
- `https://vestjs.dev/docs/5.x/get_started`
- `https://vestjs.dev/docs/5.x/concepts`
- `https://vestjs.dev/docs/5.x/api_reference`
