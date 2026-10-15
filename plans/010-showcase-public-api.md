# Plan 010: Demonstrate and e2e-test the public features no example uses

> **Executor instructions**: Follow this plan step by step. Run every
> verification command. Honor the STOP conditions. Update the status row in
> `plans/README.md` when done.
>
> **Drift check (run first)**: `git diff --stat 40e38f77..HEAD -- packages/ngx-vest-forms/src/public-api.ts apps/examples`

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: 008 (E2 adds `createDebouncedPendingState` to async-username)
- **Category**: direction, tests
- **Planned at**: commit `40e38f77`, 2026-10-15

## Why this matters

The examples app is the library's documentation in running form. About 30
public exports appear in no example, so consumers have no working reference
and no e2e test proves them in a browser. Pure helpers and types are fine as
unit-only. The runtime features below are browser-facing and need one demo
and one e2e test each.

## Current state

Exports used by no example (from `packages/ngx-vest-forms/src/public-api.ts`):

| Export | Kind | Decision |
|---|---|---|
| `FormControlStateDirective` (`ngxControlState`) | directive, browser-facing | demo + e2e |
| `createDebouncedPendingState`, `pendingDebounce` input on wrappers | pending UX | demo (008 E2 + group wrapper) + e2e |
| `getAllFormErrors` | util for error summaries | demo (error summary list) + e2e |
| `provideFormContractFactory`, `NGX_FORM_CONTRACT` | DI | demo where the contract depends on injected state, if a natural page exists; else docs only |
| `toFormContract` | migration helper | unit-only (docs cover it) |
| `NGX_EQUALITY_FN` | token, not user-visible | unit-only |
| `[ngxControlWrapper]` attribute form | wrapper variant | demo on a page where an element wrapper would break layout (e.g. table cell or `<fieldset>`), + e2e |
| `FormFieldName`, `NgxFieldKey`, `FieldPath` | types | use in one example for typed field names (e.g. fieldBlur handler in auto-save) |
| `NgxValidationFocus`, `DEFAULT_FOCUS_SELECTOR`, `DEFAULT_INVALID_SELECTOR` | focus options | use in submission-patterns where focus-first-invalid is taught |
| `mergeAriaDescribedBy`, `parseAriaIdTokens`, `resolveAssociationTargets` | custom-wrapper helpers | unit-only; mention in custom-wrapper docs |
| `deepArrayToObject`, `stringifyFieldPath` | utils | unit-only |

## Steps

1. Read each runtime export's source and spec to learn its real API before
   writing the demo (do not guess input names).
2. Add each demo to the existing page whose teaching point it fits, not as a
   new page: keep the sidebar short. Candidate homes:
   - `ngxControlState`: accessible-wrapper or custom-controls (a custom wrapper
     that reads control state without `ngx-control-wrapper`).
   - `pendingDebounce`: the purchase form's group wrapper or async-username.
   - `getAllFormErrors`: submission-patterns (an error summary after submit
     with links to fields).
   - `[ngxControlWrapper]`: business-hours (rows) or another place an extra
     element would break layout.
   - Focus options/selectors: submission-patterns.
   - Typed field names: auto-save (`NgxFieldBlurEvent` handler).
3. Update each page's `*.content.ts` and README to name the feature.
4. Add one e2e test per runtime demo that fails if the feature breaks.
5. Update `apps/examples/README` or the library README feature table if one
   maps features to examples. Update skills/docs that reference the examples.

## Done criteria

- [ ] Every "demo" row above is imported or used in `apps/examples/src` (grep)
- [ ] One e2e test per demo, each passing in chromium
- [ ] build, unit, lint pass

## STOP conditions

- An export's real behaviour differs from its docs: record it; do not change
  the library in this plan.
