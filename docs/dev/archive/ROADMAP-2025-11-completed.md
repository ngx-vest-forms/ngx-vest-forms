# ngx-vest-forms Roadmap Archive — November 2025

**Archived:** November 14, 2025
**Scope:** Completed and resolved items removed from the active roadmap to keep it focused on upcoming work.

---

## ✅ Recently Completed (November 2025)

- **PR #60**: Validation timing fixes, array/field path utilities, `only()` pattern enforcement
- **Enhancement #5**: Signal memoization with custom equality (60-80% performance improvement)
- **Enhancement #6**: WCAG 2.2 AA ARIA management (10 new tests, full accessibility compliance)
- **Dual Selector Support**: Full `ngx-` prefix implementation alongside legacy `sc-` prefix (v2.0.0)
  - All components and directives support both selectors
  - New `NGX_ERROR_DISPLAY_MODE_TOKEN` with backward compatibility
  - Updated 33 files (7 examples, 22+ tests) to use ngx- prefix
  - Complete migration guide in `docs/dev/DUAL-SELECTOR-SUPPORT.md`
  - Deprecation timeline: v2.x warnings, v3.0.0 removal
- **Breaking Changes for v2.0.0**:
  - Removed deprecated `VALIDATION_CONFIG_DEBOUNCE_TIME` constant (use `NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN` instead)
  - Unconditional `only()` pattern now required in validation suites
- **Test Coverage**: 91.27% utility coverage (30+ new tests), all 343 tests passing
- **Code Modernization**: Signals, OnPush, unconditional `only()` pattern throughout
- **Documentation**: Browser compatibility, comprehensive accessibility guide, dual selector migration

**PR #60 Copilot Review Items (Addressed):**

- ✅ JSDoc for `only()` pattern explaining unconditional call requirement
- ✅ `structuredClone()` double-cloning documented (reference isolation necessity)
- ✅ Deprecation notice enhanced with browser/Node.js requirements
- ✅ Unused imports cleaned up
- ✅ Example components (`phonenumbers.component.ts`) already emit new values correctly
- ✅ `inject(NgForm, { self: true })` already uses correct parameters (no redundant `optional: false`)
- ⏭️ `structuredClone` fallback simplification moved to v1.5.0 code quality improvements

**Issues Resolved:**

- ✅ #59 - Complex ValidationConfig test scenario
- ✅ #56 - ValidationConfig lifecycle timing issues

---

## Issue #13: Can't Bind to `validateRootForm` Property (Resolved)

**Status:** ✅ Fixed in v2.0.0 (November 2025)

**Original impact:** Angular 19 consumers running `ngx-vest-forms@1.1.0` saw a template compiler error (`Can't bind to 'validateRootForm' since it isn't a known property of 'form'`), preventing Vest suites from registering root-form validators.

**Resolution summary:**

- Ensured `ValidateRootFormDirective` stays exported via `public-api.ts` and bundled inside the `vestForms` convenience array (`projects/ngx-vest-forms/src/lib/exports.ts`).
- Added a packaging regression test (`tests/integration/validate-root-form.integration.spec.ts`) that compiles a consumer component against the built npm artifact to guarantee the directive remains discoverable.
- Expanded e2e coverage (`e2e/root-form-live-mode.spec.ts`) validating `[validateRootFormMode]` scenarios under both submit and live modes.
- Documentation updates remind integrators that `validateRootForm` ships with the `vestForms` preset and requires pairing with `scVestForm` + `FormsModule`.

Developers on older releases should upgrade to v2.x (or backport the export fix) to regain access to the directive.

---

## Enhancement #1: Enhanced Field Path Types (Completed)

**Status:** ✅ Shipped in v2.0.0
**Implementation:** `projects/ngx-vest-forms/src/lib/utils/field-path-types.ts`

**What was delivered:**

- Type-safe `FieldPath<T>` generates all valid field paths with IDE autocomplete
- `ValidationConfigMap<T>` for type-safe validation configuration
- `FormFieldName<T>` combining field paths with ROOT_FORM constant
- `FieldPathValue<T, Path>` to infer value types at field paths
- `LeafFieldPath<T>` for paths to primitive values only
- Comprehensive JSDoc with real-world examples
- Full test coverage in `field-path-types.spec.ts`

**Benefits achieved:**

- Compile-time validation of field names (typos caught at compile time)
- Full IDE autocomplete for nested paths (e.g., `'user.profile.address.city'`)
- Refactoring safety (rename property → all usages update)
- Self-documenting code through type inference
- Maximum 10-level depth to prevent infinite recursion

---

## Enhancement #3: Configurable Debouncing (Completed)

**Status:** ✅ Shipped in v2.0.0
**Implementation:** `projects/ngx-vest-forms/src/lib/tokens/debounce.token.ts`

**What was delivered:**

- `NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN` injection token
- Default value: 100ms (maintains backward compatibility)
- Global, route-level, and component-level configuration support
- Tree-shakeable with providedIn: 'root'
- Full JSDoc with usage examples
- Test coverage in `debounce.token.spec.ts`

**Breaking change:** Removed deprecated `VALIDATION_CONFIG_DEBOUNCE_TIME` constant

**Migration path:**

```typescript
// ❌ Old (removed in v2.0.0)
import { VALIDATION_CONFIG_DEBOUNCE_TIME } from 'ngx-vest-forms';

// ✅ New (v2.0.0+)
import { NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN } from 'ngx-vest-forms';

export const appConfig: ApplicationConfig = {
  providers: [{ provide: NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN, useValue: 100 }],
};
```

---

## Enhancement #4: ValidationConfig Fluent Builder (Completed)

**Status:** ✅ Shipped in v2.0.0
**Implementation:** `projects/ngx-vest-forms/src/lib/utils/validation-config-builder.ts`

**What was delivered:**

- `createValidationConfig<T>()` factory function
- `ValidationConfigBuilder<T>` class with fluent API
- **Methods:**
  - `whenChanged(trigger, dependents)` - One-way dependencies
  - `bidirectional(field1, field2)` - Two-way dependencies
  - `group(fields)` - All fields revalidate each other
  - `merge(config)` - Combine configurations
  - `build()` - Return immutable config
- Type-safe with full IDE autocomplete (uses `FieldPath<T>` from Enhancement #1)
- Comprehensive JSDoc with real-world use cases and Vest.js patterns
- Development-mode warnings for duplicate dependencies
- Automatic deduplication of dependents
- Full test coverage in `validation-config-builder.spec.ts`

**Benefits achieved:**

- Clear, declarative intent (replaces verbose object literals)
- Less boilerplate (especially for bidirectional and group patterns)
- Type safety prevents typos in field names
- Composable via `merge()` for conditional configurations
- Self-documenting with method names that express intent

**Example usage:**

```typescript
const config = createValidationConfig<FormModel>()
  .bidirectional('password', 'confirmPassword')
  .whenChanged('country', ['state', 'zipCode'])
  .group(['firstName', 'lastName', 'email'])
  .build();
```
