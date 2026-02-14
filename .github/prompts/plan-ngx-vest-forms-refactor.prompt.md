## Plan: Prioritized Refactor & Hardening Audit

Deliver a phased, low-risk refactor roadmap for `projects/ngx-vest-forms` that reduces duplication, improves reliability, and hardens security without breaking public API guarantees. Execute in domains (Public API, Validation Directives, Wrappers/A11y, Utilities, Tests/Tooling), with compatibility-sensitive changes gated behind explicit validation.

**Steps**
1. Baseline and guardrails
   1.1 Freeze current behavior with targeted snapshots/spec baselines for directives, wrappers, and validation-config flows (*blocks all implementation steps*).
   1.2 Enumerate public API compatibility constraints from `src/public-api.ts`, docs, and migration guides (*blocks steps 2, 5*).

2. Public API and dead-code governance (Domain: package surface)
   2.1 Classify exports into: active, deprecated-but-supported, removable-in-major.
   2.2 Triage likely-unused exports (`ROOT_FORM_CONSTANT`, `vestForms`, deprecated `cloneDeep`/`set`) as “retain with deprecation notice” unless semver-major.
   2.3 Remove safe dead artifacts only (empty screenshot dirs), and add policy for artifact cleanup in CI.
   2.4 Convert file-local exported constants/functions to non-export where safe (`SC_*_DEFAULT`, `isPrimitive`) after deep-import risk check.

3. Duplicate logic consolidation (Domain: validation directives and wrappers)
   3.1 Extract shared async-validator bridge used by `FormModelDirective` and `FormModelGroupDirective` into an internal helper with pluggable field resolver (*depends on 1.1*).
   3.2 Extract shared ARIA control-association engine used by `ControlWrapperComponent` and `FormErrorControlDirective` into reusable internal primitive (*depends on 1.1; parallel with 3.1 after API review*).
   3.3 Normalize warning display behavior between wrappers (`shouldShowWarnings` vs direct warnings length checks) with explicit product rule documentation.
   3.4 Optionally introduce shared control-tree traversal utility for touched/error/path collection in utils/directive internals.

4. Error handling unification (Domain: validation lifecycle)
   4.1 Define one policy for internal validation failures across field-level and root-level validators (consistent internal error envelope vs fail-open policy).
   4.2 Add dev-mode diagnostics for fail-open branches (missing `name`, missing form context, unresolved paths, unresolved dependent controls).
   4.3 Add bounded wait/timeout diagnostics for dependency waits in validation-config to avoid silent stalls.
   4.4 Standardize error payload normalization across `errorsChange`, wrappers, and flatteners.

5. Security hardening (Domain: path/merge utilities)
   5.1 Add path segment denylist/sanitization in object-writing utilities (`__proto__`, `prototype`, `constructor`) in `setValueAtPath` and recursive merge paths.
   5.2 Add regression tests for prototype-pollution vectors via dot and bracket notation.
   5.3 Document secure usage expectations for dynamic field paths; keep defaults safe by design.

6. Test/verification expansion (Domain: quality gates)
   6.1 Add/extend unit specs covering consolidated helpers and parity with existing behavior.
   6.2 Add e2e/Storybook interaction coverage for “dependent fields should not display premature errors”, warning-display modes, and root/field failure consistency.
   6.3 Validate accessibility behavior for ARIA links and live regions after consolidation.
   6.4 Run lint/typecheck/tests and compare against baseline snapshots before merge.

7. Rollout strategy and scope boundaries
   7.1 Ship internal refactors behind no-API-change commitment in patch/minor.
   7.2 Defer public export removals to next major release with migration note updates.
   7.3 Keep examples/docs synchronized with behavior changes (especially display-mode and error policy).

**Relevant files**
- `/Users/arjenalthoff/dev/ngx-vest-forms/projects/ngx-vest-forms/src/public-api.ts` — public exports classification and deprecation policy.
- `/Users/arjenalthoff/dev/ngx-vest-forms/projects/ngx-vest-forms/src/lib/exports.ts` — legacy aliases (`vestForms`, `scVestForms`, etc.).
- `/Users/arjenalthoff/dev/ngx-vest-forms/projects/ngx-vest-forms/src/lib/directives/form-model.directive.ts` — async validator bridge duplication.
- `/Users/arjenalthoff/dev/ngx-vest-forms/projects/ngx-vest-forms/src/lib/directives/form-model-group.directive.ts` — async validator bridge duplication.
- `/Users/arjenalthoff/dev/ngx-vest-forms/projects/ngx-vest-forms/src/lib/directives/form.directive.ts` — field validator creation, dependency waiting, touched-path traversal.
- `/Users/arjenalthoff/dev/ngx-vest-forms/projects/ngx-vest-forms/src/lib/directives/validate-root-form.directive.ts` — root validator failure policy.
- `/Users/arjenalthoff/dev/ngx-vest-forms/projects/ngx-vest-forms/src/lib/components/control-wrapper/control-wrapper.component.ts` — ARIA association logic, warning display behavior.
- `/Users/arjenalthoff/dev/ngx-vest-forms/projects/ngx-vest-forms/src/lib/directives/form-error-control.directive.ts` — duplicated ARIA association logic.
- `/Users/arjenalthoff/dev/ngx-vest-forms/projects/ngx-vest-forms/src/lib/components/form-group-wrapper/form-group-wrapper.component.ts` — warning display consistency.
- `/Users/arjenalthoff/dev/ngx-vest-forms/projects/ngx-vest-forms/src/lib/utils/form-utils.ts` — `setValueAtPath`, merge recursion, error collection utilities.
- `/Users/arjenalthoff/dev/ngx-vest-forms/projects/ngx-vest-forms/src/lib/utils/field-path.utils.ts` — path parsing and sanitization insertion point.
- `/Users/arjenalthoff/dev/ngx-vest-forms/projects/ngx-vest-forms/src/lib/utils/equality.ts` — export visibility cleanup candidate.
- `/Users/arjenalthoff/dev/ngx-vest-forms/projects/ngx-vest-forms/src/lib/testing/` — interaction/spec updates and artifact cleanup.
- `/Users/arjenalthoff/dev/ngx-vest-forms/docs/migration/MIGRATION-v1.x-to-v2.0.0.md` — deprecation/removal communication.

**Verification**
- Unit: run library specs with focus on directives/utils touched by consolidation and error-policy updates.
- Storybook interaction tests: verify wrapper display modes and ARIA linkage parity.
- E2E: validate dependent-field behavior and root-vs-field error semantics in examples app.
- Static checks: lint + TS strict checks for all modified files.
- Security regression: dedicated tests for dangerous path segments and merge keys.
- Accessibility spot-check: verify `aria-describedby`/`aria-invalid` and live-region announcements remain intact.

**Decisions**
- Included: internal refactor opportunities, dead code/artifact cleanup, error-policy standardization, utility hardening, and test expansion.
- Excluded: immediate removal of publicly deprecated exports in non-major release.
- Assumption: backward compatibility for existing consumers is prioritized over aggressive API pruning.
- Assumption: current branch focus (premature dependent error display) remains a behavior gate for related refactors.
