# ngx-vest-forms Roadmap

**Last Updated:** November 13, 2025
**Current Version:** 1.4.x
**Next Release:** 1.6.0

## 🎯 Overview

This document outlines remaining work for ngx-vest-forms following successful completion of PR #60 and enhancements #5-6.

---

## ✅ Recently Completed (November 2025)

- **PR #60**: Validation timing fixes, array/field path utilities, `only()` pattern enforcement
- **Enhancement #5**: Signal memoization with custom equality (60-80% performance improvement)
- **Enhancement #6**: WCAG 2.2 AA ARIA management (10 new tests, full accessibility compliance)
- **Test Coverage**: 91.27% utility coverage (30+ new tests)
- **Code Modernization**: Signals, OnPush, unconditional `only()` pattern throughout
- **Documentation**: Browser compatibility, comprehensive accessibility guide

**Issues Resolved:**

- ✅ #59 - Complex ValidationConfig test scenario
- ✅ #56 - ValidationConfig lifecycle timing issues

---

## 🔴 Critical Issues (Immediate Action Required)

### Issue #13: Can't Bind to 'validateRootForm' Property

**Priority:** 🔴 CRITICAL - BLOCKING BUG
**Effort:** 2-4 hours (LLM investigation + dev review)
**Impact:** Users cannot use root form validation

```
Error: Can't bind to 'validateRootForm' since it isn't a known property of 'form'
```

**Context (reported):**

- Angular 19 consuming `ngx-vest-forms@1.1.0`
- Template compiler fails before runtime, so no Vest suites ever run
- Forms always report as valid because the async validator never registers

**Current findings (Nov 2025):**

- `ValidateRootFormDirective` is exported from `public-api.ts` and included in the `vestForms` convenience array (`projects/ngx-vest-forms/src/lib/exports.ts:71-78`), and the compiled artifact marks it `standalone: true`.
- Directive logic works when Angular can see it (unit specs in `projects/ngx-vest-forms/src/lib/directives/validate-root-form.directive.spec.ts` and e2e coverage in `e2e/root-form-live-mode.spec.ts`), so the breakage must come from how the directive is packaged/consumed in earlier releases.
- We have no automated test that consumes the published npm bundle inside a fresh Angular app, so a missing export or tree-shaken directive can ship unnoticed.
- Docs never explicitly remind users that `validateRootForm` lives in `vestForms`, so some reports might stem from missing imports.

**Remediation plan:**

1. **Reproduce + audit artifacts**
   - Install `ngx-vest-forms@1.1.0` in a clean Angular 19 playground, add a `<form scVestForm validateRootForm>` template, and capture the compiler stack trace.
   - Download the 1.1.0 tarball and inspect `fesm2022/ngx-vest-forms.mjs` + `index.d.ts` to see whether the directive is absent from `vestForms`, missing `standalone: true`, or renamed during bundling.
2. **Patch packaging**
   - If the directive is missing, add it back to `vestForms`, `vestFormsViewProviders`, and the barrel exports; consider a `provideValidateRootForm()` helper so apps can tree-shake everything else.
   - Double-check the selector (`form[validateRootForm]`) and update documentation to mention that `scVestForm` + `FormsModule` are required.
3. **Add regression coverage**
   - Create a Jest component test that compiles `<form scVestForm validateRootForm ...>` under AOT so template compilation fails in CI if the directive ever drops out of scope.
   - Add an integration test that consumes the **built package** from `dist/ngx-vest-forms` to detect packaging issues before publish.
4. **Docs + release**
   - Update README + `VALIDATION-CONFIG-VS-ROOT-FORM.md` with an “Import checklist” callout for `validateRootForm`.
   - Announce the fix in the next patch release notes and provide migration guidance for projects stuck on 1.1.0.

**Action Items:**

- [ ] Create minimal reproduction + capture failing build log
- [ ] Inspect the 1.1.0 tarball and document the missing export/metadata
- [ ] Apply packaging fix + add regression tests (AOT + integration)
- [ ] Update docs and ship emergency patch if the fix is non-breaking

---

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

## 🎯 Planned Enhancements (v1.6.0)

### Enhancement #1: Enhanced Field Path Types

**Priority:** High
**Effort:** 1-2 days (LLM type generation + dev refinement + extensive testing)
**Dependencies:** None**Goal:** Type-safe field paths with IDE autocomplete

```typescript
// Before: plain strings (error-prone)
const validationConfig = {
  firstName: ['addresses.billingAddress.street'], // no autocomplete
};

// After: type-safe with autocomplete
type FieldPath<T> = /* recursive template literal type */;
const validationConfig: ValidationConfigMap<FormModel> = {
  firstName: ['addresses.billingAddress.street'], // ✅ autocomplete!
};
```

**Benefits:**

- Compile-time field name validation
- IDE autocomplete for nested paths
- Refactoring safety
- Prevents typos

**Files:**

- NEW: `lib/utils/field-path-types.ts`
- UPDATE: `lib/directives/form.directive.ts`
- EXPORT: `public-api.ts`

---

### Enhancement #2: Development-Mode Error Messages

**Priority:** High
**Effort:** 2-3 days (LLM catalog + helpers + dev documentation review)
**Dependencies:** None

**Goal:** Context-aware error messages with solutions```typescript
// Current: Generic Angular error
// "Cannot find control with name: 'user_email'"

// Proposed: Helpful ngx-vest-forms error
[ngx-vest-forms:NGX-001] Name attribute mismatch
The 'name' attribute "user_email" doesn't match model path "email".

💡 Solution:

<!-- ✅ Correct -->

<input name="email" [ngModel]="formValue().email" />

📖 Docs: https://...

````

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

---

### Enhancement #3: Configurable Debouncing

**Priority:** Medium
**Effort:** 4-6 hours (LLM token + directive update + dev integration testing)
**Dependencies:** None

**Goal:** Configurable validation debounce timing```typescript
// Currently: hardcoded 100ms
// Proposed: DI token

// Global config
export const appConfig: ApplicationConfig = {
  providers: [
    { provide: NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN, useValue: 50 }
  ]
};

// Per-component
@Component({
  providers: [
    { provide: NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN, useValue: 300 }
  ]
})
````

**Use Cases:**

- Fast networks → 50ms (snappier UX)
- Expensive validations → 300ms (reduce load)
- Testing → 0ms (synchronous)

**Benefits:**

- Performance tuning flexibility
- Testing support
- Backward compatible (default 100ms)

**Files:**

- NEW: `lib/tokens/debounce.token.ts`
- UPDATE: `lib/directives/form.directive.ts`
- DEPRECATE: `lib/constants.ts` (add migration note)

---

### Enhancement #4: ValidationConfig Fluent Builder

**Priority:** Medium
**Effort:** 1-2 days (LLM builder API + comprehensive tests + dev UX validation)
**Dependencies:** Enhancement #1**Goal:** Fluent API for validation configuration

```typescript
// Before: verbose, error-prone
const validationConfig = {
  password: ['confirmPassword'],
  confirmPassword: ['password'],
  // ... manual bidirectional setup
};

// After: fluent, type-safe
const validationConfig = createValidationConfig<FormModel>()
  .bidirectional('password', 'confirmPassword')
  .whenChanged('country', 'state', 'zipCode')
  .group(['firstName', 'lastName', 'email'])
  .build();
```

**API Methods:**

- `whenChanged(trigger, ...dependents)` - One-way dependency
- `bidirectional(field1, field2)` - Both trigger each other
- `group([...fields])` - All trigger all
- `build()` - Return config object

**Benefits:**

- Type safety (uses FieldPath from #1)
- Clear intent
- Less boilerplate
- Validation logic

**Files:**

- NEW: `lib/utils/validation-config-builder.ts`
- NEW: `lib/utils/validation-config-builder.spec.ts`

---

## Implementation Timeline

**Total Effort:** ~1.5-2 weeks with LLM-assisted development

### Day 1: Critical Bugs

- [ ] Issue #13: validateRootForm binding (2-4 hours)
- [ ] Emergency patch release if needed

### Days 2-3: Medium Priority Issuesrity Issues

- [ ] Issue #15: Tailwind compatibility (3-4 hours)
- [ ] Issue #12: Date shape validation (4-6 hours)
- [ ] Integration testing (2 hours)

### Days 4-6: Foundation Enhancements Enhancements

- [ ] Enhancement #1: Field Path Types (1-2 days)
- [ ] Enhancement #2: Error Messages (2-3 days)
- [ ] Enhancement #3: Debouncing Token (4-6 hours)
- [ ] Unit tests for all (included above)

### Days 7-8: Advanced Features Features

- [ ] Enhancement #4: ValidationConfig Builder (1-2 days)
- [ ] Performance benchmarks (4 hours)
- [ ] Documentation updates (4 hours)

### Days 9-10: Release Preparation

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
- Rebrand with `ngx` prefix (#7)

### Breaking Changes (v2.0)

- Rename `sc` → `ngx` prefix
- Migration schematic
- 6-month deprecation period for v1.x

---

## Open Questions

1. Should field path types have escape hatch for dynamic names?
2. Should error codes be configurable/translatable?
3. Per-field debounce configuration?
4. Builder support for conditional logic?
5. Custom ARIA strategies for complex controls?

---

## References

- PR #60: https://github.com/ngx-vest-forms/ngx-vest-forms/pull/60
- Issue #59: https://github.com/ngx-vest-forms/ngx-vest-forms/issues/59
- Issue #56: https://github.com/ngx-vest-forms/ngx-vest-forms/issues/56
- Documentation: `/docs/`
- Examples: `/projects/examples/`
