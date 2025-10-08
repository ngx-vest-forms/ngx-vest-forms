# Skipped Test Remediation PRD

## 1. Executive Summary

The ngx-vest-forms V2 branch still contains several `it.todo` tests covering high-risk flows in the async validation engine and the manual error display strategy. This PRD proposes converting those placeholders into executable tests (or tracking them behind a new API) so the WCAG-focused refactor is fully defended by automated coverage.

## 2. Goals & Non-Goals

### Goals

- Reactivate or intentionally scope all skipped Vitest cases under `projects/ngx-vest-forms/core/src/lib/*`.
- Close regression risk around async validation sequencing (`runSuite` + `createSafeSuite`).
- Document the dependency between manual error strategy tests and the future `setShowErrors()` API.

### Non-Goals

- No changes to app-level example projects.
- No rewrite of the validation engine; only test coverage and small API additions where strictly needed.

## 3. Current State

| Area                         | File                                                       | Skipped Tests | Root Cause                                                                                             |
| ---------------------------- | ---------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------ |
| Async validation race safety | `core/src/lib/async-validation-race-condition.spec.ts`     | 2 × `it.todo` | Temporary disablement while stabilising async memoisation fixes.                                       |
| `runSuite` async handling    | `core/src/lib/create-vest-form.spec.ts`                    | 3 × `it.todo` | Assertions drifted after the WCAG refactor; behaviour is still required but expectations are outdated. |
| Manual error strategy        | `core/src/lib/components/ngx-form-error.component.spec.ts` | 3 × `it.todo` | Blocked on the missing `VestField#setShowErrors()` API.                                                |

No skipped tests were found elsewhere in the package.

## 4. User Impact

- **Developers** risk reintroducing the email/username async validation deadlock that inspired the V2 redesign.
- **Accessibility & QA** lose automated guarantees that manual error display (needed for custom UX) works once the API ships.
- **Release stability** suffers because existing coverage doesn’t exercise the “async pending + new validation” code paths.

## 5. Proposed Plan

### 5.1 Async Validation Race Suite (`async-validation-race-condition.spec.ts`)

1. Restore both TODOs as runnable tests using the existing helpers (`createSafeSuite`, deterministic async promises).
2. Replace polling magic numbers with explicit `pending()` and counter assertions to avoid flakes.
3. Add a regression assertion ensuring `form.pending()` eventually resolves to `false` without manual timeouts.

### 5.2 `create-vest-form` Async Sequencing Tests (`create-vest-form.spec.ts`)

1. Align expectations with the current `runSuite` semantics:
   - When a field revalidates after async completion, expect the suite to run exactly twice (initial + follow-up).
   - When another field validates while async is pending, verify `suite` is not called and field-level pending flags remain accurate.
2. Remove console logging inside tests, replacing them with explicit assertions.
3. Add helper utilities (e.g., `waitForAsyncSettle(form)`) to share logic across tests and keep them deterministic.

### 5.3 Manual Error Strategy Coverage (`ngx-form-error.component.spec.ts`)

1. Track the `VestField#setShowErrors()` API work in an issue (link to PRD once opened).
2. Leave the three `it.todo` tests in place but add a guard comment referencing the tracking issue.
3. When the API lands, convert the tests to:
   - Enable show errors manually and assert aria-live announcements.
   - Disable show errors and ensure the UI clears alerts.
   - Exercise a computed display rule using signals to control visibility.

## 6. Deliverables

- ✅ Test updates for async race and `runSuite` specs merged to `feat/v2-inverted-vest-forms`.
- ✅ Tracking issue documenting manual strategy coverage dependencies.
- ✅ Lint & Vitest suites passing without any pending TODOs (aside from the tracked API dependency).

## 7. Milestones & Timeline

| Milestone                                             | Owner              | Target         |
| ----------------------------------------------------- | ------------------ | -------------- |
| M1 – Restore async race specs                         | Core testing squad | Week 1         |
| M2 – Update `create-vest-form` async tests            | Core testing squad | Week 2         |
| M3 – Author `setShowErrors()` design + issue          | Forms API squad    | Week 2         |
| M4 – Implement manual strategy tests (blocked on API) | Forms API squad    | Post-API merge |

## 8. Risks & Mitigations

| Risk                                                              | Impact | Mitigation                                                                                                      |
| ----------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------- |
| Re-enabled tests are flaky under CI load                          | Medium | Use deterministic async helpers and `vi.useFakeTimers()` if needed; run tests with `--repeat` during PR review. |
| `setShowErrors()` API scope creep delays manual-strategy coverage | Medium | Document dependency clearly; consider feature-flagging manual strategy support.                                 |
| Regression tests expose additional bugs in `runSuite`             | High   | Treat failures as signal to fix logic; maintain narrow PRs to isolate changes.                                  |

## 9. Success Metrics

- Zero `it.todo` entries in `projects/ngx-vest-forms/core/src/lib/**/*.spec.ts` (except those tagged with the tracking issue ID).
- CI Vitest run completes without new flakes for five consecutive runs.
- Manual error strategy feature branch includes complete tests once API merges.

## 10. Open Questions

1. Should `setShowErrors()` live on the field or on the form-level error strategy service?
2. Do we need additional harness utilities (e.g., async validation spies) made reusable across specs?

---

This document was authored with accessibility in mind (clear headings, semantic tables). Please review with assistive technology tooling such as Accessibility Insights to confirm it meets your team’s standards.
