# Plan 006: Make every e2e assertion able to fail, and remove hard waits, retries and dead helpers

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report; do not improvise. When done, update this plan's status row in
> `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 40e38f77..HEAD -- apps/examples-e2e`
> If an in-scope file changed since this plan was written, compare the
> excerpts below against the live code first. A mismatch is a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED (removing retries can expose real flakes)
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `40e38f77`, 2026-10-15

## Why this matters

Several e2e checks pass whether or not the feature works, and retries hide
flaky tests. A green run therefore says less than it appears to. This plan
makes each assertion able to fail, removes sleeps and the extra retry layers,
deletes dead helpers, and makes test discovery explicit so a new suite file
cannot be silently skipped.

## Current state

- `apps/examples-e2e/playwright.config.ts:18`: `testMatch: ['**/pages/**/*.spec.ts', 'app/**/*.spec.ts']`.
  Thirteen suites live in `*.form.tests.ts` and run only because one of
  eight one-line shims imports them (`import './x.form.tests';`), e.g.
  `pages/native-schema-demo/native-schema-demo.form.spec.ts`. The shims
  date from commit `1458b037`. A `.tests.ts` file without a shim never runs.
- `playwright.config.ts:24`: `retries: process.env['CI'] ? 2 : 1`.
  `pages/wizard-form/wizard.form.tests.ts:113,240,352,539` each add
  `test.describe.configure({ retries: 2 })`.
- Tests that cannot fail:
  - `pages/purchase-form/purchase.form.tests.ts:1163-1203`, "should debounce
    async validation on userId field". It polls for `ng-valid || ng-invalid`,
    which Angular sets on every bound control from the start.
  - `if (warningId)` guards skip their assertions when no warning exists:
    `pages/purchase-form/password-warnings.form.tests.ts:196-200,264-270,284-290`
    and `pages/validation-config-demo/validation-config-demo.form.tests.ts:1029-1036,1058-1062,1077-1082`.
  - `pages/date-range-adapter/split-wrappers.form.tests.ts:165-175`: a count()
    loop over warning ids that does nothing when the count is 0.
  - `pages/validation-config-demo/enhanced-validation-config.form.tests.ts:85-89`:
    a `describe` with a beforeEach and no tests. The header comment claims it
    covers "bidirectional date range".
- Hard waits: `purchase.form.tests.ts:1160` `waitForTimeout(200)`,
  `enhanced-validation-config.form.tests.ts:75` `waitForTimeout(100)` in a loop,
  `helpers/form-helpers.ts:483` (inside `monitorAriaStability`),
  `helpers/form-helpers.ts:508-510` `waitForDebounce` (a `setTimeout`).
- Dead helpers in `helpers/form-helpers.ts` (0 call sites): `getFormLevelErrors`,
  `waitForDebounce`, `waitForConsoleCheck`, `selectOption`.
- `locator.type()` (deprecated in favour of `pressSequentially`):
  `helpers/form-helpers.ts:374`, `business-hours.form.tests.ts:51`,
  `purchase.form.tests.ts:1179`.
- Manual retry loops: `helpers/wizard-helpers.ts:56-73` (retries on
  'detached') and `:159-177` (`goToProfileStep`, isVisible().catch branching).
- `apps/examples-e2e/TEST_PLAN.md` describes PR #60 and names files that no
  longer exist. `apps/examples-e2e/README.md` has stale paths, the wrong port
  and the wrong retry count.

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| E2E (chromium) | `browser-tests examples-e2e e2e -- --project=chromium` (needs `dangerouslyDisableSandbox: true`) | all pass |
| One spec | `browser-tests examples-e2e e2e -- --project=chromium <path>` | pass |
| Flake check | `... -- --project=chromium --repeat-each=5 <path>` | pass all repeats |
| Lint | `pnpm nx run-many -t lint,lint-templates -p examples-e2e` | exit 0 |
| Discovery | `pnpm nx show project examples-e2e --json` | count `e2e-ci--*` targets |

## Scope

**In scope**: `apps/examples-e2e/**`.

**Out of scope**: the examples app, the library, `.github/workflows` (any new
action must be SHA-pinned; CI changes need their own plan).

## Steps

1. **Explicit discovery.** `git mv` each `*.form.tests.ts` to `*.form.spec.ts`.
   Where a page has several (validation-config has 4, date-range 2, purchase 2),
   give each its own descriptive `*.spec.ts` name. Delete the 8 shims.
   **Verify**: `find apps/examples-e2e -name '*.tests.ts'` returns nothing;
   the `e2e-ci--*` target count rises from 35 to 40.
2. **Remove the empty describe** and fix the summary comment in the
   enhanced-validation-config spec.
3. **Rewrite the no-op debounce test.** Count requests to `/api/people`
   with `page.on('request')` while typing several characters, then assert
   that exactly one validation request fires after the debounce, plus the
   settled error or valid state. If the mock interceptor bypasses the network
   (in-app `HttpInterceptor`), assert instead that `aria-busy` is not
   `"true"` mid-typing and becomes `"true"` once after typing stops. If neither
   can be observed, delete the test, since the unit owner
   (`form-model.directive` debounce tests) proves the contract.
4. **Replace guards with required assertions.** For each `if (warningId)`
   site, `expect(warningId).toBeTruthy()` first, or use
   `toHaveAttribute('aria-describedby', /…/)`. Replace the count() loop with a
   positive `toHaveCount(n)` followed by per-item checks.
5. **Remove hard waits.** Delete the 3 `waitForTimeout` calls and use web-first
   assertions. Delete `monitorAriaStability` and replace its use in
   "should NOT create infinite validation loops" with: both fields settle to
   the expected error state, and `aria-busy` is not `"true"` on either field
   (`expect(...).not.toHaveAttribute('aria-busy','true')`), which a stuck loop
   fails.
6. **Delete dead helpers** (`getFormLevelErrors`, `waitForDebounce`,
   `waitForConsoleCheck`, `selectOption`). Replace `expectChecked`,
   `expectUnchecked`, `expectDisabled`, `expectEnabled` and `selectRadio` with
   built-in matchers at their call sites.
7. **`type()` → `pressSequentially()`** at the 3 sites.
8. **Wizard retries.** Remove the 4 `describe.configure({ retries: 2 })` calls
   and the manual retry loops in `wizard-helpers.ts`; rely on auto-wait. Run
   the wizard spec with `--repeat-each=5`. Any flake is a real finding: fix the
   wait condition and do not restore retries.
9. **Config.** Set local retries to 0 (`process.env['CI'] ? 2 : 0`).
10. **Docs.** Delete `TEST_PLAN.md` (historical; the git history keeps it) and
    update `README.md`: real paths, the `pnpm nx run examples-e2e:e2e` command,
    port 4400, retries, and the file naming rule (`*.spec.ts` only).

## Test plan

There are no new behaviours. Every changed test must still pass, and each
test whose assertion this plan strengthens must fail when its feature breaks.
Check by temporarily breaking the feature (e.g. remove `warn()` from the
password suite) and confirming the test goes red, then revert.

## Done criteria

- [ ] `grep -rn "waitForTimeout\|setTimeout\|\.type(" apps/examples-e2e --include='*.ts'` returns nothing
- [ ] `grep -rn "describe.configure" apps/examples-e2e` returns nothing
- [ ] No `*.tests.ts` files; `e2e-ci--*` count is 40
- [ ] `TEST_PLAN.md` removed; README describes the current layout
- [ ] chromium e2e passes; the wizard spec passes `--repeat-each=5`
- [ ] lint passes

## STOP conditions

- A test fails after retries are removed and the cause is in the library or
  the app rather than the test: record it in `plans/README.md` and continue
  with the other steps.
- The `e2e-ci--*` target count after step 1 is not 40.

## Maintenance notes

- New e2e suites must be named `*.spec.ts`. The README states this.
- A reviewer should check that each rewritten assertion can still fail.
