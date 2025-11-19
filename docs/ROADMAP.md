# ngx-vest-forms Roadmap

**Last Updated:** November 14, 2025
**Current Version:** 2.0.0
**Next Release:** 2.1.0

## 🎯 Overview

This document outlines remaining work for ngx-vest-forms following successful completion of PR #60 and enhancements #5-6. Completed milestones from November 2025 are recorded in PR #60 and the Git history to keep this roadmap focused on upcoming work.

## 🔴 Critical Issues (Immediate Action Required)

No outstanding critical issues. The previously blocking `validateRootForm` packaging bug (#13) was resolved in v2.0.0 and is documented in PR #60.

## 🟡 Medium Priority Issues

### Issue #15: Tailwind Grid Layout Compatibility

**Priority:** 🟡 MEDIUM
**Effort:** 3-4 hours (LLM implementation + dev testing)
**Impact:** Breaks Tailwind grid layouts**Problem:** `sc-control-wrapper` flexbox conflicts with parent grid.

**Solution:**

```typescript
@Component({
  selector: 'sc-control-wrapper',
  template: `<div [style.display]="displayMode()">...</div>`,
})
export class ControlWrapperComponent {
  displayMode = input<'flex' | 'contents' | 'block'>('flex');
  gridColumn = input<string | null>(null);
}
```

**Action Items:**

- [ ] Add layout customization
- [ ] Update Tailwind examples
- [ ] Integration tests
- [ ] Documentation

---

### Issue #12: Date/Empty String Shape Validation

**Priority:** 🟡 MEDIUM
**Effort:** 4-6 hours (LLM logic + dev edge case testing)
**Impact:** Console warnings for legitimate patterns**Problem:** Shape validation warns when Date fields use empty string (common for UI libraries).

**Solution:**

```typescript
// Allow empty string for Date fields
if (expected instanceof Date && actual === '') return false;
// Allow null/undefined for optional fields
if (actual == null) return false;
```

**Action Items:**

- [ ] Implement relaxed checking
- [ ] Add configuration option
- [ ] Update tests
- [ ] Document patterns

---

## 🎯 Planned Enhancements (v2.2.0)

### Enhancement #2: Development-Mode Error Messages

**Priority:** High
**Effort:** 2-3 days (LLM catalog + helpers + dev documentation review)
**Dependencies:** None

**Goal:** Context-aware error messages with solutions

```typescript
// Current: Generic Angular error
// "Cannot find control with name: 'user_email'"

// Proposed: Helpful ngx-vest-forms error
[ngx-vest-forms:NGX-001] Name attribute mismatch
The 'name' attribute "user_email" doesn't match model path "email".

💡 Solution:

<!-- ✅ Correct -->

<input name="email" [ngModel]="formValue().email" />

📖 Docs: https://...

```

**Error Catalog:**

- NGX-001: Name attribute mismatch
- NGX-002: Missing vestFormsViewProviders
- NGX-003: Invalid Vest suite structure
- NGX-004: ValidationConfig field not found
- NGX-005: Shape type mismatch

**Benefits:**

- Faster debugging (50% time reduction)
- Better onboarding
- Zero production overhead (tree-shaken)

**Files:**

- NEW: `lib/errors/error-catalog.ts`
- NEW: `lib/errors/error-helpers.ts`
- NEW: `docs/ERRORS.md`
- UPDATE: `lib/directives/form.directive.ts`

### Enhancement #3: Headless Core Entry Point (`ngxVestFormCore`)

**Priority:** Medium
**Effort:** 3-4 days (split directive + docs + dedicated tests)
**Origin:** PR #31 introduces `projects/ngx-vest-forms/core`

#### Problem Statement (Core Entry Point)

Teams building custom design systems only want the reactive form bridge (signals + Vest execution) and prefer to render their own wrappers/error UI. Today the single `ngxVestForm` directive bundles everything, so lightweight consumers cannot tree-shake display logic or compose experimental host directives.

#### Proposed Solution (Core Entry Point)

- Extract the base directive into a `ngxVestFormCore` entry point that exposes:
  - `[(formValue)]` signal binding
  - Vest suite execution + validation options
  - `formState()` access for low-level consumers
- Keep `ngxVestForm` as the batteries-included preset that re-exports `core` + wrappers
- Mirror PR #31’s `ngxVestFormsCore` preset and the accompanying Jest specs to ensure parity

#### Benefits (Core Entry Point)

- Smaller bundle when consumers only need headless behavior
- Cleaner layering for future host directives (schema validation, smart state)
- Explicit “core vs. enhanced” documentation for integrators

#### Action Items (Core Entry Point)

- [ ] Split current directive implementation into `core` (new ng-package) and existing wrappers
- [ ] Publish `NgxVestFormsCore` array for easy importing (`imports: [...NgxVestFormsCore]`)
- [ ] Update README + docs/COMPLETE-EXAMPLE.md with headless recipes
- [ ] Port PR #31’s `form-core.directive.spec.ts` to protect the new entry point

---

### Enhancement #4: Schema Validation Adapter & `[formSchema]`

**Priority:** High
**Effort:** 4-5 days (adapter registry + directive + docs)
**Origin:** PR #31 adds `projects/ngx-vest-forms/schemas`

#### Problem Statement (Schema Adapter)

Apps regularly pair Vest with schema validators (Zod/Valibot/ArkType) for submit-time safety, yet ngx-vest-forms has no first-party hook to run those schemas or surface their errors. Teams currently duplicate logic and cannot enforce template conformance.

#### Proposed Solution (Schema Adapter)

- Ship an optional schemas entry point exposing:
  - `ngxModelToStandardSchema()` helper (wraps plain JS objects into StandardSchemaV1)
  - Adapter registry that detects Zod/Valibot/ArkType or generic `safeParse` functions
  - `NgxSchemaValidationDirective` host directive that runs once per `ngSubmit` and exposes `schema()` state (success flag, issue list, `errorMap`)
  - Dev-mode template conformance warnings that compare `formValue` names vs. schema shape to catch `name` typos
- Allow `[formSchema]` on both `ngxVestForm` and `ngxVestFormCore`

#### Benefits (Schema Adapter)

- Unified error surface combining Vest field errors + schema-level issues
- Optional dependency so teams opt-in only when needed
- Safer large forms with minimal extra code (just bind `[formSchema]`)

#### Action Items (Schema Adapter)

- [ ] Port schema adapter utilities + directive tests from PR #31
- [ ] Document schema workflows (submit-time guardrails, template mismatch warnings) in a new `docs/SCHEMA-VALIDATION.md`
- [ ] Add Playwright coverage that shows schema errors in the existing examples app
- [ ] Provide migration guidance for teams currently hand-wiring schema validation in `ngSubmit`

---

### Enhancement #5: Smart State Extension for External Data Sync

**Priority:** Medium
**Effort:** 1 week (directive + resolver UX + docs)
**Origin:** PR #31 adds `projects/ngx-vest-forms/smart-state`

#### Problem Statement (Smart State)

When backend data refreshes mid-edit (autosave, admin override, collaborative sessions) the current implementation overwrites `formValue`, leading to lost user input. Consumers need battle-tested merge/conflict strategies rather than re-implementing reducers per project.

#### Proposed Solution (Smart State)

- Introduce `ngxSmartStateExtension` host directive with inputs:
  - `[externalData]` – latest server payload
  - `[smartStateOptions]` – merge strategy (`replace | preserve | smart`), `preserveFields`, and conflict callbacks
  - `[isDirty]` / `[isValid]` – hints from the parent form state
- Ship `SmartStateExtension` utility (already tested in PR #31) that handles deep path comparisons, `preserveFields`, and conflict snapshots
- Expose `form.smartState()` so UIs can present “keep mine vs. accept server” dialogs

#### Benefits (Smart State)

- Prevents accidental data loss during background refreshes
- Provides reusable conflict resolution hooks for advanced apps (collaboration, offline sync)
- Aligns with Angular 18 signal patterns (directive implemented with signals/effects)

#### Action Items (Smart State)

- [ ] Finalize directive API + wire it into `ngxVestForm(Core)` instances
- [ ] Add documentation (similar to PR #31’s Smart State README) with real scenarios: user profile, collaborative editor, offline order sync
- [ ] Create unit + Playwright specs covering merge strategies and `'prompt-user'` conflicts
- [ ] Offer helper UI component (optional) for conflict prompts to accelerate adoption

---

## Implementation Timeline

**Total Effort:** ~1.5-2 weeks with LLM-assisted development

### Phase 1: v2.1.0 Release (Days 1-3)

#### Days 1-2: Medium Priority + Code Quality

- [ ] Issue #15: Tailwind compatibility (3-4 hours)
- [ ] Issue #12: Date shape validation (4-6 hours)
- [ ] Code Quality: Simplify structuredClone fallback (1-2 hours)
- [ ] Integration testing (2 hours)

#### Day 3: Release Readiness

- [ ] v2.1.0 release candidate build
- [ ] Docs + changelog updates
- [ ] Publish v2.1.0 once acceptance passes

### Phase 2: v2.2.0 Release (Days 4-10)

#### Days 4-6: Foundation Enhancement

- [ ] Enhancement #1: Error Messages (2-3 days)
- [ ] Unit tests (included above)

#### Days 7-8: Advanced Features

- [ ] Enhancement #3: Headless Core Entry Point (3-4 days)
- [ ] Enhancement #4: Schema Validation Adapter (4-5 days)
- [ ] Performance benchmarks (4 hours)
- [ ] Documentation updates (4 hours)

#### Days 9-10: Release Preparation

- [ ] Beta testing
- [ ] Community feedback
- [ ] Final v1.6.0 release

---

## Testing Requirements

### Unit Tests

- [ ] Field path type inference
- [ ] Error helper dev/prod modes
- [ ] Debounce token injection
- [ ] Builder API outputs
- [ ] All enhancements >90% coverage

### Integration Tests

- [ ] Field paths in real forms
- [ ] Error messages display
- [ ] Debounce timing effects
- [ ] Builder config with forms

### Performance Tests

- [ ] Benchmark 100+ field forms
- [ ] Memory leak detection
- [ ] Bundle size impact (should be 0 for prod)

---

## Success Metrics

### Developer Experience

- [ ] Type safety prevents errors at compile time
- [ ] Error messages reduce debug time by 50%+
- [ ] API more intuitive and discoverable

### Performance

- [ ] Large forms show measurable improvement
- [ ] Zero production bundle increase
- [ ] Memory usage stable

### Adoption

- [ ] Complete documentation
- [ ] Positive community feedback
- [ ] Clear migration paths

---

## Future Considerations (v2.0+)

### Deferred Items

- Signal consistency (`lastControl` → signal)
- `unknown` vs `any` in bivariance hack
- Review `untracked()` usage
- Native HTML5 validation integration (#9)
- StandardSchema support (#18)

### Performance Optimizations (from PR #60 review)

- Deep equality check optimization in bidirectional sync (3 checks per effect run)
- `arrayToObject()` single-pass implementation (replace map+fromEntries with reduce or for-loop)
- Bidirectional sync edge case: explicit handling for simultaneous form+model changes

### Breaking Changes (v3.0)

- Remove `sc-` prefix support (deprecated in v2.0)
- Migration schematic for automated prefix updates
- Remove `SC_ERROR_DISPLAY_MODE_TOKEN` (use `NGX_ERROR_DISPLAY_MODE_TOKEN`)
- 6-12 month deprecation period for v2.x

---

## Open Questions

1. Should field path types have escape hatch for dynamic names?
2. Should error codes be configurable/translatable?
3. Per-field debounce configuration?
4. Builder support for conditional logic?
5. Custom ARIA strategies for complex controls?

---

## References

- PR #60: <https://github.com/ngx-vest-forms/ngx-vest-forms/pull/60>
- Issue #59: <https://github.com/ngx-vest-forms/ngx-vest-forms/issues/59>
- Issue #56: <https://github.com/ngx-vest-forms/ngx-vest-forms/issues/56>
- Documentation: `/docs/`
- Examples: `/projects/examples/`
