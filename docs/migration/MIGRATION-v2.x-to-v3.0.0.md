# Migration Guide: v2.x → v3.0.0

## Overview

ngx-vest-forms v3.0.0 upgrades the underlying validation engine from **Vest.js 5.x** to **Vest.js 6.x**. This is a **breaking change** that affects how validation suites are defined and executed.

**At a glance:**

| Area                   | v2.x (Vest 5)                             | v3.0.0 (Vest 6)                                      |
| ---------------------- | ----------------------------------------- | ---------------------------------------------------- |
| Vest dependency        | `~5.4.6`                                  | `~6.0.3`                                             |
| Suite factory          | `staticSuite` or `create`                 | `create` only                                        |
| Suite callback         | `(model, field?) => { only(field); ... }` | `(model) => { ... }`                                 |
| Field-level validation | `only(field)` inside callback             | `suite.only(field).run(model)` at call site          |
| Suite execution        | `suite(model, field)` (callable)          | `suite.run(model)` or `suite.only(field).run(model)` |
| Async handling         | `.done(callback)`                         | `await result` or `result.then(...)`                 |
| Suite reset            | Not required                              | `suite.reset()` on form reset                        |
| Suite type             | `StaticSuite`                             | `Suite`                                              |
| Performance            | `test.memo(...)`                          | `memo(() => { ... }, [deps])` from `vest/memo`       |

**Effort estimate:** Low-to-medium. Most changes are mechanical find-and-replace operations in validation suite files. The ngx-vest-forms library handles the runtime changes internally.

---

## Prerequisites

- **Angular**: 21+ (no change from v2.x)
- **Vest.js**: `~6.0.3` (upgraded from `~5.4.6`)
- **Node.js**: >= 22.0.0

---

## Step-by-Step Migration

### Step 1: Update Dependencies

```bash
npm install ngx-vest-forms@^3.0.0 vest@~6.0.3
```

### Step 2: Update Validation Suite Callbacks (CRITICAL)

This is the primary breaking change. Suite callbacks no longer receive a `field` parameter, and `only()` is no longer called inside the callback.

**Before (v2.x):**

```typescript
import { create, test, enforce, only } from 'vest';

export const suite = create((model, field?) => {
  only(field); // ← REMOVE: field focus moves to the call site

  test('email', 'Required', () => enforce(model.email).isNotBlank());
  test('email', 'Invalid', () => enforce(model.email).isEmail());
});
```

**After (v3.0.0):**

```typescript
import { create, test, enforce } from 'vest';

export const suite = create((model) => {
  test('email', 'Required', () => enforce(model.email).isNotBlank());
  test('email', 'Invalid', () => enforce(model.email).isEmail());
});

// Field-level validation at the call site:
suite.only('email').run(model); // Validate only 'email'
suite.run(model); // Validate all fields (e.g. on submit)
suite.reset(); // Reset accumulated state (e.g. on form reset)
```

**What to do:**

1. Remove `only` from Vest imports
2. Remove the `field?` parameter from the callback signature
3. Remove the `only(field)` call inside the callback
4. If using typed suites, remove `FormFieldName<T>` from the callback parameter

**Find affected files:**

```bash
grep -rn "only(field)" --include="*.ts" | grep -v node_modules
grep -rn "model, field?" --include="*.ts" | grep -v node_modules
```

### Step 3: Update Typed Suite Definitions

If you use `NgxTypedVestSuite<T>` with typed field parameters, simplify the callback:

**Before (v2.x):**

```typescript
import { NgxTypedVestSuite, FormFieldName } from 'ngx-vest-forms';
import { create, test, enforce, only } from 'vest';

export const suite: NgxTypedVestSuite<FormModel> = create(
  (model: FormModel, field?: FormFieldName<FormModel>) => {
    only(field);
    test('email', 'Required', () => enforce(model.email).isNotBlank());
  }
);
```

**After (v3.0.0):**

```typescript
import { NgxTypedVestSuite } from 'ngx-vest-forms';
import { create, test, enforce } from 'vest';

export const suite: NgxTypedVestSuite<FormModel> = create(
  (model: FormModel) => {
    test('email', 'Required', () => enforce(model.email).isNotBlank());
  }
);
```

> **Note:** `FormFieldName<T>` is still exported and useful for typing field name variables, but it's no longer needed as a callback parameter type.

### Step 4: No Template Changes Required

The library handles the runtime migration internally. Your templates remain unchanged:

```html
<!-- ✅ Unchanged — these continue to work as before -->
<form
  ngxVestForm
  [suite]="suite"
  [formValue]="formValue()"
  (formValueChange)="formValue.set($event)"
>
  <ngx-control-wrapper>
    <input name="email" [ngModel]="formValue().email" />
  </ngx-control-wrapper>
</form>
```

### Step 5: Update Direct Suite Calls in Tests

If your tests call the suite directly (e.g., for unit testing validation logic), update the call pattern:

**Before (v2.x):**

```typescript
// Direct call with field parameter
const result = suite(model, 'email');

// Or with runStatic
const result = suite.runStatic(model, 'email');
```

**After (v3.0.0):**

```typescript
// Field-focused stateful run
suite.only('email').run(model);

// Full validation (all fields)
suite.run(model);

// Stateless run (for isolated tests, server-side)
suite.runStatic(model);
// Note: .only() is NOT available with .runStatic()
```

---

## What Changed Internally

### Suite Types

The library's suite type wrappers have been updated:

| Type                   | v2.x                                                                        | v3.0.0                                      |
| ---------------------- | --------------------------------------------------------------------------- | ------------------------------------------- |
| `NgxVestSuite<T>`      | `StaticSuite<string, string, (model: T, field?: any) => void>`              | `Suite<string, string, (model: T) => void>` |
| `NgxTypedVestSuite<T>` | `StaticSuite<string, string, (model: T, field?: FormFieldName<T>) => void>` | `Suite<string, string, (model: T) => void>` |

Both types now use model-only callbacks. The `field` parameter is gone from the callback signature.

### Runtime Execution

The `FormDirective` internally changed from:

```typescript
// v2.x — callable suite with .done() callback
(suite as NgxVestSuite<T>)(snap, field).done((result) => { ... });
```

to:

```typescript
// v3.0.0 — suite.only(field).run() with Promise-like result
const result = (suite as NgxVestSuite<T>).only(field).run(snap);

if (!result.isPending()) {
  processResult(result); // Synchronous suites: process immediately
} else {
  result.then(processResult); // Async: wait for completion
}

// Angular/RxJS integration can also use `from(result)` for cancellation-aware flows.
```

### Form Reset

`resetForm()` now calls `suite.reset()` to clear Vest's accumulated stateful results. In Vest 6, `suite.run()` is stateful — results accumulate across runs. Without reset, stale errors from previous form interactions could persist.

---

## New Vest 6 Features (Optional)

These features are available in v3.0.0 but not required for migration.

### `memo` — Memoize Expensive Validations

Use `memo` from `vest/memo` to cache blocks of tests. If the dependency array hasn't changed, the block is skipped and previous results are restored:

```typescript
import { create, test, enforce, skipWhen } from 'vest';
import { memo } from 'vest/memo';

const suite = create((data) => {
  test('username', 'Username is required', () => {
    enforce(data.username).isNotBlank();
  });

  // Only re-runs when username changes
  memo(() => {
    skipWhen(
      (res) => res.hasErrors('username'),
      () => {
        test('username', 'Username is taken', async ({ signal }) => {
          await checkAvailability(data.username, { signal });
        });
      }
    );
  }, [data.username]);
});
```

> **Replaces:** `test.memo()` from Vest 5. The new `memo` wraps entire blocks instead of individual tests.

### `suite.focus()` — Advanced Focus Control

`suite.only(field)` is shorthand for `suite.focus({ only: field })`. For more complex scenarios:

```typescript
// Skip a specific field
suite.focus({ skip: 'password' }).run(data);

// Only validate a specific group
suite.focus({ onlyGroup: 'step1' }).run(data);

// Skip entire groups (useful for wizard forms)
suite.focus({ skipGroup: ['step2', 'step3'] }).run(data);

// Combine field and group focus
suite.focus({ only: 'username', skipGroup: 'billing' }).run(data);
```

> **Note:** In ngx-vest-forms, `suite.only(field).run(model)` is used automatically for field-level validation. Use `focus()` for custom scenarios like multi-step wizard forms.

### Thenable Results

Vest 6 `SuiteResult` is a thenable (Promise-like). Use `await` or `.then()` for async completion:

```typescript
const result = suite.run(data);
await result; // Resolves when all async tests complete
if (result.isValid()) submitForm();
```

---

## Composable Validations

No changes needed. Composable validation functions work the same way:

```typescript
// Still works exactly the same in v3.0.0
export function addressValidations(
  address: AddressModel | undefined,
  prefix: string
) {
  test(`${prefix}.street`, 'Required', () =>
    enforce(address?.street).isNotBlank()
  );
  test(`${prefix}.city`, 'Required', () => enforce(address?.city).isNotBlank());
}

// In your suite
export const suite = create((model) => {
  addressValidations(model.addresses?.billing, 'addresses.billing');
});
```

---

## Complete Migration Checklist

### Critical Changes (Must Do)

- [ ] **Update vest dependency**: `npm install vest@~6.0.3`
- [ ] **Update ngx-vest-forms**: `npm install ngx-vest-forms@^3.0.0`
- [ ] **Remove `field?` parameter** from all suite callbacks
- [ ] **Remove `only(field)` calls** from all suite callbacks
- [ ] **Remove `only` from imports** (`import { create, test, enforce, only }` → `import { create, test, enforce }`)
- [ ] **Update direct suite calls** in tests: `suite(model, field)` → `suite.only(field).run(model)`
- [ ] **Remove `FormFieldName<T>`** from callback parameter types (keep if used elsewhere)
- [ ] **Run and fix tests**: Some test mocks may need updating for the new API

### Recommended Changes (Should Do)

- [ ] **Replace `test.memo()`** with `memo()` from `vest/memo` for expensive async validations
- [ ] **Review async tests**: Ensure all use `{ signal }` for cancellation
- [ ] **Guard async tests** with `skipWhen` to avoid unnecessary API calls

### Optional Enhancements (Nice to Have)

- [ ] **Explore `suite.focus()`** for advanced multi-step form scenarios
- [ ] **Use `memo()` blocks** for groups of related validations that share dependencies

---

## Automated Migration Script

**Find and report affected files:**

```bash
#!/bin/bash

echo "=== Checking for v3.0.0 migration issues ==="

echo "\n1. Suite callbacks with field parameter:"
grep -rn "model, field?" --include="*.ts" | grep -v node_modules

echo "\n2. only() calls inside suite callbacks:"
grep -rn "only(field)" --include="*.ts" | grep -v node_modules

echo "\n3. only import from vest:"
grep -rn "import.*only.*from.*'vest'" --include="*.ts" | grep -v node_modules

echo "\n4. Direct callable suite invocations:"
grep -rn "suite(model" --include="*.ts" | grep -v node_modules

echo "\n5. .done() callbacks (Vest 5 pattern):"
grep -rn "\.done(" --include="*.ts" | grep -v node_modules

echo "\n6. StaticSuite type references:"
grep -rn "StaticSuite" --include="*.ts" | grep -v node_modules

echo "\n7. staticSuite function calls:"
grep -rn "staticSuite" --include="*.ts" | grep -v node_modules

echo "\n=== Migration check complete ==="
```

---

## Troubleshooting

### Issue: "suite is not a function"

**Cause:** Vest 6 suites are no longer callable. Use `.run()` instead.

```typescript
// ❌ v2.x — suite is callable
const result = suite(model, field);

// ✅ v3.0.0 — use .run() or .only().run()
const result = suite.run(model);
const result = suite.only(field).run(model);
```

### Issue: "only is not exported from 'vest'"

**Cause:** In Vest 6, `only()` is no longer a standalone export. Field focus is handled at the call site via `suite.only(field)`.

**Solution:** Remove `only` from your vest imports and the `only(field)` call from the suite callback.

### Issue: "Stale validation errors after form reset"

**Cause:** Vest 6 `suite.run()` is stateful — results accumulate across runs. Without `suite.reset()`, old errors persist.

**Solution:** ngx-vest-forms v3.0.0 now calls `suite.reset()` internally in `resetForm()`. If you call the suite directly, add `suite.reset()` before re-running after a reset.

### Issue: ".done() is not a function"

**Cause:** Vest 6 replaces `.done()` with thenable results.

```typescript
// ❌ v2.x — .done() callback
suite.run(model).done((result) => { ... });

// ✅ v3.0.0 — await or .then()
const result = suite.run(model);
await result;
// or
result.then((res) => { ... });
```

### Issue: "runStatic is not a function on suite.only()"

**Cause:** `suite.only(field)` returns `FocusedMethods`, which only has `.run()` — not `.runStatic()`. This is by design: `runStatic` is stateless and doesn't carry focus modifiers.

**Solution:** Use `suite.only(field).run(model)` for focused validation. Use `suite.runStatic(model)` only for stateless full-suite validation (e.g., server-side).

---

## Related Documentation

- [Vest.js 6 Documentation](https://vestjs.dev/docs/)
- [v1.x → v2.0.0 Migration Guide](./MIGRATION-v1.x-to-v2.0.0.md)
- [Complete Example](../COMPLETE-EXAMPLE.md)
- [Composable Validations](../COMPOSABLE-VALIDATIONS.md)
- [Vest.js Best Practices](../../.github/instructions/vest.instructions.md)

---

**Version:** 3.0.0
**Last Updated:** March 4, 2026
**Status:** Stable
