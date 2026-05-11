---
name: conditional-control-flow
description: Helps developers choose the right Vest.js 6 control-flow primitive for conditional validation. Use this whenever the user mentions `skip`, `focus`, `only`, `skipGroup`, `onlyGroup`, `include`, `skipWhen`, `omitWhen`, `optional`, linked fields, dependent validations, conditional sections, feature flags, or asks why skipped tests still affect validity.
---

# Vest.js 6 conditional control-flow guidance

Use this skill when the problem is about **what should run, when it should run, and whether skipped tests still count**.

## First decide what kind of control you need

Ask yourself:

- Should only the active field run? Use `suite.only(...).run(model)` or `suite.focus(...)` at the call site.
- Should a whole named section be skipped for this run? Use `suite.focus({ skipGroup: ... }).run(model)`.
- Should only one named section run? Use `suite.focus({ onlyGroup: ... }).run(model)`.
- Should another field run with it? Use `include(...).when(...)`.
- Should some fields be excluded from this run but still count toward validity? Use `skip(...)` or `skipWhen(...)`.
- Should some tests disappear from validity and messages entirely while a condition holds? Use `omitWhen(...)`.
- Should a field be allowed to stay empty without making the suite invalid? Use `optional(...)`.

Do not treat these as interchangeable. In Vest 6, they still have meaningfully different result semantics.

## Core distinctions

### `suite.only(field)` / `suite.focus(...)`

Use for interactive, field-scoped validation.

- Apply it at the call site, not inside the suite callback.
- `suite.only(field).run(model)` is shorthand for `suite.focus({ only: field }).run(model)`.
- Use `suite.focus(...)` instead of `suite.only(...)` when you need to combine modifiers such as `only` + `skipGroup`, `skip`, or `onlyGroup`.
- `skip` filters by field name wherever that field appears; `skipGroup` filters by named group.
- `onlyGroup` restricts the run to named groups and excludes top-level tests.
- Focus modifier precedence is `skipGroup` → `onlyGroup` → `skip` → `only`.
- Focus modifiers apply to the immediately following run.
- Focused runs are non-persistent and preserve prior results for unfocused fields.

### `include(field).when(...)`

Use when fields are linked and should validate together.

- Good for password/confirm-password, ranges, and dependent comparisons.
- Prefer the functional `.when(...)` form when inclusion should wait for more context than “field A changed”.

### `skip(...)` and `skipWhen(...)`

Use when tests should not participate in the current run, **but should still count against `isValid()`** unless handled otherwise.

- `skip(...)` is a direct inclusion/exclusion switch.
- `skipWhen(...)` is useful when the condition depends on current suite state.
- `skipWhen(...)` does not magically make skipped tests optional.

Important caveat: `skipWhen(...)` affects the validation result, but the block structure still executes. Do not hide expensive non-test work in the wrapper body and assume it will disappear.

### `omitWhen(...)`

Use when omitted tests should:

- not run
- not contribute errors or warnings
- not count against overall validity while omitted

This is usually the right tool for truly conditional form branches.

### `optional(...)`

Use when a field may be empty without making the suite invalid.

- Works well for optional inputs and “validate only if present” behavior.
- Can use default empty-value detection or custom omission logic.
- Is not the same thing as `warn()`.

## Recommended workflow

1. Decide whether the rule is about **selection**, **linking**, **skipping**, **omission**, or **optionality**.
2. Keep the suite structure stable.
3. Keep the suite callback model-only; apply focus/selection at the run site.
4. Prefer `.when(...)`, `skipWhen(...)`, or `omitWhen(...)` over raw `if` trees around test registration.
5. Use `include(...)` for linked fields instead of manually overvalidating everything.
6. Reach for `omitWhen(...)` instead of `skipWhen(...)` when hidden sections should stop affecting validity.
7. When the question is really about tabs, steps, or named sections, consider `skipGroup` / `onlyGroup` before inventing extra branching inside the suite.

## Pitfalls to fix immediately

- adding `field` parameters or `only(field)` calls inside the suite callback
- using `skip(...)` when the intent is to disable a named group rather than a field everywhere it appears
- using `skipWhen(...)` when the user really wants omitted tests not to affect validity
- using `optional(...)` when the field is not actually optional, just temporarily hidden
- using `include(...).when('otherField')` when the linked field should only run under extra conditions
- sprinkling ad-hoc branching around test declarations and then blaming Vest when state gets weird

## Output style

When answering:

- explain the behavior difference first, especially `skipWhen` vs `omitWhen`
- show the test-registration primitive right next to the affected tests
- call out validity consequences explicitly

## Reference file

Start with `references/decision-guide.md` when the user is mixing several of these APIs in one question.

## References to consult when needed

- `references/decision-guide.md`
- `../../../instructions/vest.instructions.md`
- `https://vestjs.dev/docs/writing_your_suite/focused_updates`
- `https://vestjs.dev/docs/writing_your_suite/including_and_excluding/skip_and_only`
- `https://vestjs.dev/docs/writing_your_suite/including_and_excluding/skipWhen`
- `https://vestjs.dev/docs/writing_your_suite/including_and_excluding/omitWhen`
- `https://vestjs.dev/docs/writing_your_suite/including_and_excluding/include`
- `https://vestjs.dev/docs/writing_your_suite/optional_fields`
- `https://vestjs.dev/docs/recipes/focus_skipgroup_recipes`
