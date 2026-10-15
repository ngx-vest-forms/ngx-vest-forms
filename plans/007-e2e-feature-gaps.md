# Plan 007: Cover the browser-only library behaviour the e2e suite misses

> **Executor instructions**: Follow this plan step by step. Run every
> verification command. Honor the STOP conditions. Update the status row in
> `plans/README.md` when done.
>
> **Drift check (run first)**: `git diff --stat 40e38f77..HEAD -- apps/examples-e2e apps/examples/src/app/pages/{async-username-form,custom-controls-form,accessible-wrapper-demo,complex-nested-form}`

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: 006 (file names and helpers change there)
- **Category**: tests
- **Planned at**: commit `40e38f77`, 2026-10-15

## Why this matters

Some library contracts only fail in a real browser: async timing, focus,
ARIA on real controls, ControlValueAccessor (CVA) touch wiring. Today these
are proven only in jsdom unit specs or not at all, so a regression in any of
them passes CI. Each test below guards one contract that has no browser owner
today.

## Current state

- `aria-busy` is never asserted as `"true"`. The only e2e reference is
  `purchase.form.tests.ts:300` (`not.toHaveAttribute('aria-busy','true')`).
  The library sets it in
  `packages/ngx-vest-forms/src/lib/components/control-wrapper/control-wrapper.component.ts`
  (host binding) and `form-group-wrapper.component.ts`.
- `pages/async-username-form/async-username.form.spec.ts` has 1 test. It
  settles before every submit, so `(submitSettled)` with a pending check and
  overlapping async runs are unproven in a browser. The unit owners are
  `form.directive.spec.ts` (submitSettled ~3223-3532; stale results ~535-700),
  all jsdom.
- `pages/custom-controls-form/custom-controls.form.spec.ts` has 1 happy-path
  test. It never checks touched-on-blur, ARIA or reset for the three CVAs
  (`star-rating`, `segmented-control`, `tag-input`).
- `pages/accessible-wrapper-demo/accessible-wrapper.form.spec.ts` asserts only
  positive ARIA wiring. ADR `docs/adr/0006-aria-primary-pathway-degradation.md`
  says multi-control wrappers in `none`/`single-control` mode must NOT stamp
  `aria-invalid`/`aria-describedby` on the extra controls. The test at :43-64
  is named "keep validation on the input while the helper button stays neutral",
  but it asserts neither half of that.
- `pages/complex-nested-form/complex-nested.form.spec.ts` has 1 happy-path
  test. It never checks errors on fields inside a repeated `ngModelGroup` (a
  team member), or that removing a member removes its errors.
- Skips: `purchase.form.tests.ts:227` (WebKit) and
  `validation-config-demo.form.tests.ts:556` (Firefox). CI runs chromium only.

## Scope

**In scope**: `apps/examples-e2e/**`. Example templates only where a test
needs an accessible name the page lacks (record each such change).

**Out of scope**: library source. If a test exposes a library bug, record it
(STOP condition) instead of fixing the library here.

## Steps

1. **Pending state.** On /async-username, type a value that passes the sync
   rules and blur. Assert that the input (or its `ngx-control-wrapper` host,
   whichever the library stamps) has `aria-busy="true"` and that
   "Checking availability" is visible, then that both clear after the check.
2. **Submit while pending.** Type a taken username and click Reserve at once.
   Assert the "already taken" error appears and no success alert. Then type
   an available name, click at once, and assert success appears only after
   the check settles.
3. **Overlapping async runs.** Type a taken name, then immediately replace it
   with an available one. Assert that the final state reflects only the second
   value (no "already taken" message).
4. **Custom controls.** Add: submitting an empty form marks all three CVAs
   invalid and shows their errors; blurring the tag input without a tag shows
   the error (proves `onTouched` wiring); reset clears rating, level and tags.
   If plan 009 adds `aria-invalid` to the radiogroups, assert it there.
5. **ADR-0006 negatives.** In the accessible-wrapper demo, after submitting
   invalid input, assert the input has `aria-invalid="true"` and that the
   helper button has neither `aria-invalid` nor `aria-describedby`. Rename
   the test at :43 to match what it asserts.
6. **Nested groups.** In complex-nested, add a member, leave its required
   fields empty and submit. Assert the member's field errors and
   `aria-invalid`, then remove the member and assert its errors are gone and
   submit succeeds.
7. **Skips.** Run the purchase WebKit-skipped test and the VC Firefox-skipped
   test in their engines (`--project=webkit` / `--project=firefox`). If they
   pass, remove the skip. If they fail, read the trace: a harness problem
   means fixing the wait; a library bug means a STOP condition (record it,
   keep the skip with a link to the recorded finding).

## Test plan

Each new test must fail against a broken implementation. Check at least
steps 1 and 4 by temporarily removing the `aria-busy` host binding or the
CVA's `onTouched` call, confirming red, then reverting.

## Done criteria

- [ ] chromium e2e passes, including the new tests
- [ ] async-username has ≥ 4 tests; custom-controls ≥ 3; complex-nested ≥ 2
- [ ] `grep -rn "toHaveAttribute('aria-busy', 'true')" apps/examples-e2e` finds ≥ 1 site
- [ ] each removed skip passes in its engine, or is kept with a recorded reason

## STOP conditions

- A new test shows a library defect: record it in `plans/README.md` with
  the reproduction and mark that test `test.fail()` with a link to the
  recorded finding.

## Maintenance notes

- These tests depend on the mock delay in
  `apps/examples/src/app/pages/async-username-form/username-availability.service.ts`.
  If the delay drops to 0, the mid-pending assertions stop meaning anything.
