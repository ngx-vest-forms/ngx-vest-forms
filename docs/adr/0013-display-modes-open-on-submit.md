# Keep `on-blur` and `on-touch` Display Modes opening on submit and deprecate `on-blur`

## Status

Accepted

## Date

2026-11-20

## Context

`FormErrorDisplayDirective` exposes five error Display Modes (`'on-blur-or-submit'`,
`'on-blur'`, `'on-submit'`, `'on-dirty'`, `'always'`) and four warning Display Modes
(`'on-validated-or-touch'`, `'on-touch'`, `'on-dirty'`, `'always'`).

In `errorGateOpen` and `warningGateOpen`, `'on-blur'` evaluates
`(isTouched || formSubmitted) && hasErrorState` (identical to `'on-blur-or-submit'`)
and `'on-touch'` evaluates `isTouched || formSubmitted`. On top of that,
`FormDirective` marks all controls as touched on submit (`markAllAsTouched()`), so
every control becomes touched on a submit attempt anyway.

Issue #366 asked whether `'on-blur'` and `'on-touch'` should keep opening on
`formSubmitted` or become strict touch-only modes that ignore form submission.

Making an error mode hide errors on submit fails accessibility and modern web
form guidance (matching native `:user-invalid`):

- A failed submit must reveal every blocking field, including required fields the
  user never touched, so sighted and assistive-technology users can see why
  submission was blocked.
- `focusFirstInvalidControl()` moves focus to the first invalid control on a
  failed submit; suppressing that control's error message and `aria-invalid` /
  `aria-describedby` state leaves the focused field with no explanation.

## Decision

- Keep `'on-blur'` opening on blur or form submission (`isTouched || formSubmitted`).
- Deprecate `'on-blur'` in v3 as an alias for `'on-blur-or-submit'`, scheduled for
  removal in v4. New code, docs, and skills use `'on-blur-or-submit'`.
- Keep the `NGX-105` dev-mode diagnostic for `'on-blur'` paired with
  `updateOn: 'submit'` until `'on-blur'` is removed in v4.
- Keep `'on-touch'` opening on touch or form submission (`isTouched || formSubmitted`)
  and document that behavior explicitly. Unlike `'on-blur'`, `'on-touch'` has no
  redundant sibling warning mode.

## Consequences

- No breaking change in v3: existing apps using `'on-blur'` or `'on-touch'` keep
  their runtime behavior.
- Error feedback on failed submit stays aligned with native `:user-invalid` and
  `focusFirstInvalidControl()`.
- v4 can remove `'on-blur'` from `NgxErrorDisplayMode` without leaving a gap,
  since `'on-blur-or-submit'` already names the exact behavior.
