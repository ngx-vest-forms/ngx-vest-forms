# Test coverage analysis

This document captures a static test-coverage analysis run against two branches:

1. **master** (Angular CLI workspace, Vest 5.x) — the v2.x line.
2. **release/v3** (Nx + pnpm monorepo, Vest 6.x, Standard Schema contracts) — the v3 line.

The analysis was performed by mapping every non-test source file in
`projects/ngx-vest-forms` (v2) / `packages/ngx-vest-forms` (v3) to its
matching `*.spec.ts`, reading the trickier source files (`form.directive.ts`,
`form-control-state.directive.ts`, `form-contract.ts`, etc.) for untested
branches, and reviewing the e2e plan. Coverage was not executed end-to-end
because Playwright Chromium downloads are blocked in the analysis sandbox; the
findings below are therefore static.

---

## Part 1 — master (v2.x) snapshot

- **Library:** 34 production TS files / 35 spec files / ~735 unit & integration
  tests.
- **E2E:** 22 Playwright specs.
- **Examples app:** 60 production TS files / only 3 spec files (validations +
  one component).
- **Coverage config:** `vitest.config.ts` outputs html/lcov but defines **no
  `thresholds`** — nothing prevents regressions in coverage.

### Test gaps on master, ranked by impact

#### 1. Source files with no dedicated unit spec

| File | Why it matters |
|---|---|
| `utils/first-invalid.utils.ts` | Pure helpers (`resolveFirstInvalidScrollBehavior`, `resolveFirstInvalidElement`, `resolveFirstInvalidFocusTarget`, `openCollapsedDetailsAncestors`) and `DEFAULT_FOCUS_SELECTOR` / `DEFAULT_INVALID_SELECTOR` are part of the **public API**, only exercised indirectly through `form.directive.spec.ts`. No tests for invalid CSS selectors (`try/catch` swallow), reduced-motion media query, the `<details>` ancestor walk stopping at the form root, or the "invalid focus preferred" selector. |
| `directives/async-validator-bridge.ts` | All four fail-open branches (no control / no context / no field / dev-mode warning) and the `Observable` / `Promise` / plain `ValidationErrors` conversion paths are only covered end-to-end through model directives. |
| `directives/form-submitted-state.ts` | The `WeakMap` cache, the `submittedReactive` vs `_submittedReactive` fallback, and the prototype-walk for a writable `submitted` setter (and the "no setter found" terminal case) are reflective code paths against Angular internals — a direct spec would catch a future Angular bump silently breaking submit-state reset. |
| `errors/error-catalog.ts` | `logWarning()` formatting (`[NGX-XXX] …`) and the message templates have no tests. Consumers grep these prefixes; a typo regresses silently. |
| `directives/error-display-mode.token.ts` | `InjectionToken` default factories (`on-blur-or-submit`, `on-validated-or-touch`) aren't asserted — quick to add. |

#### 2. `FormControlStateDirective` is materially under-tested

525 lines of source, 246 lines / 7 `it` blocks in spec. Missing scenarios:

- Late-attached `FormControl` retry latch (`#controlAttachRetryScheduled`,
  `afterNextRender` tick) and the **latch reset when the active control
  identity changes** (e.g. NgModel swap via `@if`).
- The pending → false recovery branch in `afterEveryRender` (handles missed
  `statusChanges` emissions).
- `statusChanges` subscription cleanup via `onCleanup`.
- "Blur on already-INVALID control" state update that does not produce a
  `statusChanges` emission.
- `#flattenAngularErrors` recursion, `isErrorWithMessage` branch, and
  `normalizeErrorMessage` JSON-stringify fallback.
- `updateOn` derivation from `NgModel.options`, composite computeds
  (`isValidTouched`, `isInvalidTouched`, `shouldShowErrors`).
- Usage on `NgModelGroup` (only NgModel paths are tested).

#### 3. Private path-resolution code in `form.directive.ts`

`resolveControlPathByNgModelDirective`, `resolveControlPathByDomAncestors`,
`subtreeContainsElement`, `collectNgModelGroupAttributes`, and
`readValueAccessorElement` rely on Angular internals (`_directives`,
`_elementRef`). They power `fieldBlur` accuracy under: dynamic
`[ngModelGroup]="expr"`, repeated leaf `name`s across siblings, `FormArray`
nesting, and custom `ControlValueAccessor` implementations that don't expose
`_elementRef`. None of these topologies have a focused spec that asserts the
resolved path; a regression would only surface in a downstream app.

#### 4. `FormArray` support has minimal direct testing

The library handles `FormArray` in `form-utils`, `form.directive`'s
`#collectTouchedPaths`, and DOM-walking helpers, but only `form-utils.spec.ts`
mentions `FormArray` (5 occurrences). No directive-level or e2e test inserts
or removes from a real `FormArray` with per-index validation, no test for
`touchedFieldPaths` traversing `FormArray` children.

#### 5. Memory / cleanup invariants are claimed but not asserted

- `fieldWarnings` cleared on destroy.
- `scheduleMicrotask` / `scheduleTimeout` auto-cancel on destroy in a real
  Angular lifecycle (`destroy-scheduler.spec.ts` tests the primitive, not the
  directive integration).
- `ControlWrapperComponent.mutationObserver.disconnect()` runs on both
  `ngOnDestroy` and `destroyRef.onDestroy`.
- `WeakMap` in `form-submitted-state.ts` releases entries when the `NgForm`
  is GC'd.

#### 6. Examples project lacks unit tests

60 TS files in `projects/examples/src`, only 3 specs. The shared validation
suites (`phonenumber.validations.ts`, `address.validations.ts`,
`validation-demo.validations.ts`) have no unit tests, and example pages rely
entirely on e2e. Validations are pure functions — cheap to unit-test and
catch regressions far faster than Playwright.

#### 7. e2e known-flaky tests

`e2e/TEST_PLAN.md` itself flags "Bidirectional Dependencies" with 3 FIXME
tests for timing issues. These should either be stabilized (event-driven
waits, not sleeps) or replaced with deterministic unit-level tests asserting
the same invariants.

#### 8. Browser / a11y behaviors not unit-asserted

- `prefersReducedMotion()` via `matchMedia` — no mock-based test.
- `aria-busy` toggling under debounced pending state on wrappers.
- `MutationObserver`-driven re-query of form controls when `@if` / `@for`
  adds / removes inputs inside a `ControlWrapper`.

#### 9. Public-API stability tests are thin

- `vestForms` / `vestFormsViewProviders` (deprecated aliases) aren't asserted
  to re-export the same set as `NgxVestForms`.
- `SC_ERROR_DISPLAY_MODE_TOKEN` (deprecated) isn't asserted to share the same
  default as the non-deprecated token.
- No AOT compile smoke test for the whole `public-api.ts` surface (only one
  `validate-root-form.aot.spec.ts`).

### Recommended actions (master)

1. **Add coverage thresholds** in `vitest.config.ts` (e.g. `lines: 85,
   branches: 80, functions: 85`) for `projects/ngx-vest-forms/src/lib/**` so
   future PRs can't silently regress.
2. **Write specs for the 5 untested source files** in §1 — small, mostly
   pure, high ROI.
3. **Backfill `FormControlStateDirective` tests** for the 8 branches listed
   in §2 — this directive is core to error display.
4. **Add a focused spec for path resolution** (§3) covering: static
   `ngModelGroup`, dynamic `[ngModelGroup]`, repeated leaf names, `FormArray`
   indices, and a custom CVA without `_elementRef`.
5. **Add `FormArray` integration tests** (§4) — at least one e2e + one
   directive-level spec.
6. **Add cleanup-invariant tests** (§5) — straightforward TestBed teardown
   assertions.
7. **Stabilize or replace the 3 FIXME e2e tests** (§7).
8. **Unit-test the shared example validations** (§6).

The library code itself is well-tested where it matters most
(`form.directive`: 1823-line spec, `control-wrapper`: 1389-line spec); the
work above is mostly closing concrete edge-case and reflective-API gaps, not
broad-strokes coverage.

---

## Part 2 — release/v3 snapshot

### v3 structural changes

- Nx monorepo with **pnpm**: `packages/ngx-vest-forms` + `apps/examples` +
  `apps/examples-e2e`.
- **Vest 6.3** (was 5.4), with `zod` + `@standard-schema/spec` added — new
  Standard Schema-based form contract API (`provideFormContract`,
  `provideFormContractFactory`, `NGX_FORM_CONTRACT`).
- Vitest is now **two projects** (`node` for `.validations.spec.ts`, `browser`
  for component specs) — faster, cleaner separation.
- **874 unit / integration test cases** (was ~735), **35 e2e specs** (was
  22), **17 example pages** (was 7-ish).
- `internal-public-api.ts` secondary entry point.

### Gaps from the master analysis that v3 has CLOSED

| master gap | v3 status |
|---|---|
| `first-invalid.utils.ts` no spec | `first-invalid.utils.spec.ts` exists |
| `error-display-mode.token.ts` no spec | `error-display-mode.token.spec.ts` exists |
| Private path-resolution logic in `form.directive.ts` | Extracted into `field-path-resolver.ts` (268 lines) with dedicated spec (239 lines) |
| `#collectTouchedPaths` untested in isolation | Extracted into `collect-touched-paths.ts` with spec |
| Vest pipeline untested in isolation | New `vest-runner.ts` (178 / 494 spec) + `validation-config-pipeline.ts` (319 / 513 spec) |
| `validate-root-form` integration only in `tests/` | Lives in the package as `validate-root-form.integration.spec.ts` + 5 stories specs |

### Gaps from the master analysis that STILL apply on v3

1. `directives/async-validator-bridge.ts` — still no direct spec; fail-open
   branches and result-shape conversion only run via model directive specs.
2. `directives/form-submitted-state.ts` — still no spec; the prototype-walk
   fallback for `submitted` setter is reflective Angular-internal code.
3. `errors/error-catalog.ts` — `logWarning()` and `NGX_VEST_FORMS_ERRORS`
   message templates still untested.
4. `FormControlStateDirective` is essentially unchanged: source 525→527
   lines, spec 246→244 lines / 7 `it` blocks. Same edge-case gaps:
   late-attach retry latch, latch reset on active-control swap, pending→false
   recovery branch, blur-on-already-INVALID state update,
   `#flattenAngularErrors` recursion, `NgModelGroup` usage.
5. **No coverage thresholds** in `vitest.config.ts` — still nothing
   preventing regressions.
6. Examples app still has **only 3 spec files** out of 17 example pages; 15
   of the example validation suites have no unit test.

### NEW gaps introduced in v3

7. **`utils/form-contract.ts` — no spec** (significant). This file exports
   the v3 Standard Schema bridge:
   - `normalizeFormContract` (Standard Schema vs `NgxDeepRequired`
     discrimination)
   - `stringifyFormContractIssuePath` (`PropertyKey` /
     `StandardSchemaV1.PathSegment` object / `Symbol` normalization, `<root>`
     fallback)
   - `logFormContractIssues`
   - `validateFormContract` — called from `form.directive.ts:547`, powers all
     shape-mismatch warnings in dev mode

   None of these have direct tests; they're only exercised end-to-end through
   `form.directive.spec.ts`.

8. **`tokens/form-contract.token.ts` — no spec.** `readFormContract` (signal
   vs static unwrap, null/undefined cases) and `provideFormContractFactory`
   (lazy construction with `inject()`) are only exercised through
   `form.directive` integration tests, not asserted in isolation.

9. **`directives/aria-association-controller.ts` — no spec** (177 lines).
   New internal helper that consolidates the previously-duplicated
   `MutationObserver` + ARIA logic shared by `ControlWrapperComponent` and
   `FormErrorControlDirective`. Only tested transitively through those two
   components. Worth a focused spec asserting: mode transitions
   (`none` ↔ `all-controls` ↔ `single-control`), dynamic add/remove via
   `MutationObserver`, optional `aria-required` handling, and DestroyRef-driven
   cleanup.

10. **Zod / Standard Schema example pages have no unit tests.**
    `native-schema-demo.validations.ts` and `zod-schema-demo.validations.ts`
    are unit-testable pure functions; currently only Playwright covers them.

### Recommended actions for v3 (priority order)

1. Spec `utils/form-contract.ts` — high impact: it's new dev-mode public
   behavior, currently relying on transitive coverage.
2. Spec `tokens/form-contract.token.ts` — small, high ROI (provider helpers +
   `readFormContract`).
3. Spec `directives/aria-association-controller.ts` — focused unit tests now
   that the controller is a separate module.
4. Backfill `FormControlStateDirective` tests for the 8 branches called out
   in the master report §2 (unchanged in v3).
5. Add coverage thresholds in `vitest.config.ts` (e.g. `lines: 85, branches:
   80, functions: 85`) for `packages/ngx-vest-forms/src/lib/**`.
6. Unit-test the new example validation suites (zod-schema-demo,
   native-schema-demo, async-username, complex-nested, conditional-structure,
   custom-controls, business-policy, submission-patterns) — they're pure
   suites and run in the fast `node` vitest project.
7. Spec the three lingering files from master (`async-validator-bridge`,
   `form-submitted-state`, `error-catalog`).

### Net read

v3 is meaningfully better-tested than master in the form-pipeline area (path
resolution, Vest runner, config pipeline are now isolated and tested), but it
adds significant new public surface around Standard Schema / form contracts
that isn't yet directly covered.
