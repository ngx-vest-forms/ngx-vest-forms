# Plan 009: Remove duplicate e2e proof and fix non-idiomatic example code

> **Executor instructions**: Follow this plan step by step. Run every
> verification command. Honor the STOP conditions. Update the status row in
> `plans/README.md` when done.
>
> **Drift check (run first)**: `git diff --stat 40e38f77..HEAD -- apps/examples apps/examples-e2e`

## Status

- **Priority**: P2
- **Effort**: L
- **Risk**: MED
- **Depends on**: 006, 007, 008. The purchase refactor (part B) lands before
  the purchase e2e trim (part A), so the current tests guard the refactor.
- **Category**: tests, tech-debt
- **Planned at**: commit `40e38f77`, 2026-10-15

## Why this matters

The same contract is proven 2–4 times in e2e, which costs runtime and
maintenance without catching more bugs. Some e2e tests assert theme CSS, not
library behaviour. Separately, a few examples teach patterns that the Angular
or Vest guidance advises against.

## Part B (first): idiom fixes in the examples

B1. **Purchase effects** (`pages/purchase-form/purchase.form.ts:233-268`). One
`effect()` copies fetch errors into `fetchErrorNoticeSignal`, and `:188-190`
wraps that signal in a pass-through `computed`. Derive the error notice as a
`computed` from `lukeResource.status()/error()` and `requestedPersonId()`.
Move model writes (clear fields on error, merge on success) into one
explicit place. If removing the effects changes behaviour the purchase e2e
guards, keep the effect for the model write only and document why in a
comment.

B2. **CVA focus and ARIA** (`pages/custom-controls-form/star-rating.component.ts:119-120`,
`segmented-control.component.ts:126`). Replace `document.getElementById` with
`viewChildren`. Inject `NgControl` (with `{ self: true, optional: true }`;
mind the NG_VALUE_ACCESSOR cycle: use `inject(NgControl)` and set
`valueAccessor = this` instead of the provider if needed) and bind
`aria-invalid` on the radiogroup when the control is invalid and touched.
Replace the wrapper `role="group" aria-label` duplication in
`custom-controls.form.html:11,18` with `aria-labelledby` on the radiogroup.

B3. **One email rule.** Five suites use four regexes:
`complex-nested.validations.ts:6`, `wizard.validations.ts:9`,
`starter.validations.ts:23`, `auto-save-demo.validations.ts:73`,
`conditional-structure.validations.ts:28`. Check whether `vest` 6.3 ships an
email matcher (`node_modules/vest/dist/exports/email.mjs`, used as
`import 'vest/email'` + `enforce(x).isEmail()`). If so, use it everywhere;
otherwise add one shared `EMAIL_PATTERN` in `shared/validations/`.

B4. **Redundant guards in omitWhen bodies.** `travel.validations.ts:20,31` and
`validation-demo.validations.ts:97` contain `if (!x || !y) return;` inside
bodies that the `omitWhen` predicate already guards. Remove them only where
the predicate covers both values.
**Rejected during execution:** the guards narrow `string | undefined` for
`new Date(...)`. TypeScript does not carry the `omitWhen` predicate into the
callback, so removing them requires `!` assertions, which is worse.

B5. **Async tests reject with `Promise.reject()`** (`async-username.validations.ts:69`,
`purchase.validations.ts:36`; lint warnings `prefer-promise-reject-errors`).
Use `enforce(taken).isFalsy()` after the await, as the vestjs async skill shows.

## Part A: e2e redundancy trim

Before each deletion, open both sides and write the remaining owner
(file:line) into the commit message. Delete a test only when the remaining
owner proves the same contract at the same or a stronger boundary.

A1. Password warnings: keep `purchase-form/password-warnings` (#69 regression).
    Drop the VC duplicates at `validation-config-demo.form.tests.ts:917-1048`,
    except a reset-baseline test if it has no other owner.
A2. Bidirectional password: VC `:22-70` owns it; drop `purchase.form.tests.ts:223-255`
    once plan 007 has resolved the WebKit skip. Keep purchase `:256` (group wrapper).
A3. Conditional justification: VC owns it; drop `purchase.form.tests.ts:163-214`
    and merge `enhanced-validation-config:23` into VC `:305`.
A4. Date-range warning rule: keep one pair in split-wrappers; drop the
    composite-adapter pair (`:139,154`). The rule's owner is `travel.validations.spec.ts`.
A5. Theme CSS: delete the border-colour `getComputedStyle` assertions
    (`validation-config-demo.form.tests.ts:730-916`); keep the `aria-invalid`
    assertions. Delete the colour-coding heading test (`:1137-1175`).
A6. Display-mode duplicates in purchase (`:1076-1102`) duplicate the
    display-modes demo; drop them. Purchase focus-first-invalid (`:1131`)
    duplicates submission-patterns; drop it.
A7. `app/app.page.spec.ts` hard-codes the nav label list copied from
    `apps/examples/src/app/shared/routes.metadata.ts`. Replace the copy with a
    check that every nav link resolves to a page with a heading.
A8. Page specs that only assert a heading and textboxes that the form spec
    also touches: merge into the form spec or delete. Keep page specs that
    assert distinct structure (date-range approach toggle, form-state sidebar).
A9. Pure suite rules in e2e (`business-hours.form.tests.ts:348`, wizard
    format checks `wizard.form.tests.ts:30,39,169`): move the rule check into
    a `*.validations.spec.ts` (create `wizard.validations.spec.ts`, modelled on
    `business-hours.validations.spec.ts`), then drop the e2e copy.

## Commands

As in plan 008, plus `--repeat-each=3` on changed specs.

## Done criteria

- [ ] Each deletion's commit names the remaining owner
- [ ] No `getComputedStyle`/`border-color` assertions remain in e2e
- [ ] `grep -rn "document.getElementById" apps/examples/src/app/pages` returns nothing
- [ ] One email rule definition across suites
- [ ] unit, build, lint and chromium e2e pass; e2e run time is no worse than the baseline (1m41s)

## STOP conditions

- The remaining owner for a deletion turns out not to prove the contract:
  keep the e2e test.
- B1 changes observable purchase behaviour: revert B1 and keep the effect, with a comment.

## Plan 009 Part A deletions

Each line names the remaining owner, with its file, line and title at the time of writing.

DELETED apps/examples-e2e/pages/validation-config-demo/validation-config-demo.form.spec.ts 'should display password length warning for passwords under 12 characters' — owner: apps/examples-e2e/pages/purchase-form/password-warnings.form.spec.ts:53 'should display actual warning messages, not array indices (fixes #69)'
DELETED apps/examples-e2e/pages/validation-config-demo/validation-config-demo.form.spec.ts 'should allow form submission despite warnings (non-blocking)' — owner: apps/examples-e2e/pages/purchase-form/password-warnings.form.spec.ts:103 'should allow form submission despite warnings (non-blocking)'
DELETED apps/examples-e2e/pages/validation-config-demo/validation-config-demo.form.spec.ts 'should clear warning when password reaches 12 characters' — owner: apps/examples-e2e/pages/purchase-form/password-warnings.form.spec.ts:161 'should clear warnings when password becomes strong'
DELETED apps/examples-e2e/pages/validation-config-demo/validation-config-demo.form.spec.ts 'should not show warning on pristine field' — owner: apps/examples-e2e/pages/purchase-form/password-warnings.form.spec.ts:246 'should not show warnings on pristine field'
DELETED apps/examples-e2e/pages/validation-config-demo/validation-config-demo.form.spec.ts 'should display all validation sections with color coding' — owner: apps/examples-e2e/pages/validation-config-demo/validation-config-demo.page.spec.ts:12 'should render page layout and key sections' (partial: asserts 2 of the 5 section headings; the other sections are exercised by the form spec's cross-field, conditional and cascade tests)
DELETED apps/examples-e2e/pages/validation-config-demo/enhanced-validation-config.form.spec.ts 'should handle ValidationConfig with conditional rendering (@if) without timing issues' — owner: apps/examples-e2e/pages/validation-config-demo/validation-config-demo.form.spec.ts:302 'should work correctly with @if conditional rendering (no timing issues)' (rapid-toggle loop merged into it)
DELETED apps/examples-e2e/pages/purchase-form/purchase.form.spec.ts 'should require confirmPassword when password is filled' — owner: apps/examples-e2e/pages/validation-config-demo/validation-config-demo.form.spec.ts:20 'should require confirmPassword when password is filled'
DELETED apps/examples-e2e/pages/purchase-form/purchase.form.spec.ts 'should keep justification quiet until it is blurred after quantity reveals it' — owner: apps/examples-e2e/pages/validation-config-demo/validation-config-demo.form.spec.ts:137 'should keep justification quiet until its own blur in on-blur mode' (same quiet-until-blur contract, same whenChanged trigger; also :235)
DELETED apps/examples-e2e/pages/purchase-form/purchase.form.spec.ts 'should show errors on blur for individual fields' — owner: apps/examples-e2e/pages/purchase-form/purchase.form.spec.ts:19 'should show validation errors for required fields on blur'
DELETED apps/examples-e2e/pages/purchase-form/purchase.form.spec.ts 'should focus first invalid control after submit' — owner: packages/ngx-vest-forms/src/lib/directives/submit-flow.browser.spec.ts:57 'shows all field errors and moves focus to the first invalid control on submit' (real browser, default focusFirstInvalidOnSubmit; corrected in review: the wizard test uses non-default options)
DELETED apps/examples-e2e/pages/date-range-adapter/composite-adapter.form.spec.ts 'should not show warning when dates are 3+ days apart' — owner: apps/examples-e2e/pages/date-range-adapter/split-wrappers.form.spec.ts:157 'should not show warning when dates are 3+ days apart'; rule threshold: apps/examples/src/app/pages/date-range-adapter/travel.validations.spec.ts:72 'should not warn when dates are 3 or more days apart'
DELETED apps/examples-e2e/pages/date-range-adapter/date-range-adapter.page.spec.ts 'should render date range fields in both approaches' — owner: apps/examples-e2e/pages/date-range-adapter/split-wrappers.form.spec.ts:25 'should render two individually wrapped date fields' and apps/examples-e2e/pages/date-range-adapter/composite-adapter.form.spec.ts:82 'should update form model when departure date is entered'
DELETED apps/examples-e2e/pages/date-range-adapter/date-range-adapter.page.spec.ts 'should render submit and reset buttons in both approaches' — owner: apps/examples-e2e/pages/date-range-adapter/composite-adapter.form.spec.ts:122 (submit) and :178 'should clear errors and touched state after reset' (reset); split-wrappers.form.spec.ts:218 'should reset form state when reset button is clicked' (reset)
DELETED apps/examples-e2e/pages/wizard-form/wizard.form.spec.ts 'should validate email format' — owner: apps/examples/src/app/pages/wizard-form/wizard.validations.spec.ts:15 'rejects an address without a domain' and :20 'accepts a well-formed address'
DELETED apps/examples-e2e/pages/wizard-form/wizard.form.spec.ts 'should validate phone number format' — owner: apps/examples/src/app/pages/wizard-form/wizard.validations.spec.ts:27 'rejects a number that is too short' and :32 'accepts a dashed ten-digit number'
DELETED apps/examples-e2e/pages/business-hours-form/business-hours.form.spec.ts 'should validate time format (4 digits, HH < 24, MM < 60)' — owner: apps/examples/src/app/pages/business-hours-form/business-hours.validations.spec.ts:60, :67, :74, :81 ('accepts a four-digit HHMM time', 'rejects a time that is not four digits', 'rejects an hour of 24 or more in HHMM form', 'rejects a minute of 60 or more in HHMM form')
DELETED apps/examples-e2e/pages/business-hours-form/business-hours.form.spec.ts 'should accept non-overlapping time slots added out of order' — owner: apps/examples/src/app/pages/business-hours-form/business-hours.validations.spec.ts:27 'accepts non-overlapping ranges added out of start order'

Rewritten, not deleted: validation-config-demo.form.spec.ts 'Visual Error Styling' (4 tests) lost every `getComputedStyle`/border/background assertion and the `if (hasAriaInvalid)` guards. The remaining aria-invalid assertions are unconditional and renamed under 'Invalid Field ARIA State'.

Kept although the plan suggested deleting: purchase 'should revalidate justification when quantity changes bidirectionally' (later deleted by the reviewer: it is a strict subset of the ADR-0004 re-mount test 'should validate justification after quantity hides and shows it again'); purchase 'should show all errors on submit even for untouched fields' (display-modes:77 uses on-submit mode through a different path); composite 'should show warning when dates are less than 3 days apart' (composite's own warning region is a separate surface); the approach-toggle tests in date-range page spec (plan says keep; 'should switch to Composite Adapter approach' duplicates the composite helper's h2 check); starter, accessible-wrapper and conditional-structure page specs (only heading and controls; cheap; the new app-shell nav test covers the heading).

Partially out of scope, flagged: `helpers/form-helpers.ts` `expectFieldHasError` and `expectFieldValid` still contain soft `try/catch` aria-invalid checks with `console.warn` (about L150 to L170 and L280 to L290). They are shared by many tests and were left unchanged.
