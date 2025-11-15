# Migration Guide: v1.x → v2.0.0

This guide covers migration from v1.x (mostly v1.4) to v2.0.0, which includes critical bug fixes, type-safe APIs, and accessibility enhancements.

## Overview of Changes

- ⚠️ **CRITICAL**: Unconditional `only()` pattern now required
- ⚠️ **Breaking**: Deprecated `VALIDATION_CONFIG_DEBOUNCE_TIME` constant removed
- ⚠️ **Breaking**: Default root form validation mode changed to `'submit'`
- ✨ **New**: Ngx-prefixed utility types (`NgxDeepPartial`, `NgxDeepRequired`, etc.)
- ✨ **New**: Array/Object conversion utilities
- ✨ **New**: Field path utilities
- ✨ **New**: Validation config builder API
- ✨ **New**: WCAG 2.2 AA accessibility compliance
- ♿ **Enhanced**: ARIA management for polite/assertive announcements
- 🚀 **Performance**: 60-80% improvement in large forms with signal memoization

---

## Breaking Changes


## Breaking Changes

### 1. Unconditional `only()` Pattern Required (CRITICAL)

**Status:** ⚠️ **BREAKING CHANGE** - Code changes required

**What Changed:**

You MUST now call `only()` unconditionally at the top of validation suites. The old conditional pattern breaks Vest's execution tracking.

**v1.x Behavior (old):**

```typescript
// ❌ BROKEN: Conditional only() corrupts execution tracking
export const suite = staticSuite((model, field?) => {
  if (field) { only(field); } // BUG: Breaks omitWhen + validationConfig!
  
  test('email', 'Required', () => {
    enforce(model.email).isNotBlank();
  });
});
```

**v2.0.0 Behavior (new - REQUIRED):**

```typescript
// ✅ CORRECT: Unconditional only() call required
export const suite = staticSuite((model, field?) => {
  only(field); // ALWAYS call unconditionally (safe: only(undefined) runs all tests)
  
  test('email', 'Required', () => {
    enforce(model.email).isNotBlank();
  });
});
```

**Why This Change?**

Conditional `only()` calls corrupt Vest's internal execution tracking, breaking the combination of `omitWhen` + `validationConfig` timing. This causes:

- ❌ Dependent field validations don't trigger properly
- ❌ `omitWhen` conditions evaluated incorrectly
- ❌ `validationConfig` dependencies fail to update
- ❌ Race conditions in complex forms

The unconditional pattern is safe because:

- ✅ `only(undefined)` runs all tests (full validation)
- ✅ `only('fieldName')` optimizes by running only that field's tests
- ✅ Vest's execution tracking remains consistent
- ✅ `omitWhen` + `validationConfig` work reliably

**Migration Steps:**

1. Find all validation suites with conditional `only()`:

```bash
grep -r "if (field)" --include="*.ts" | grep "only"
```

2. Remove the `if (field)` wrapper:

```typescript
// Before
export const mySuite = staticSuite((model, field?) => {
  if (field) { only(field); } // ❌ Remove this wrapper
  // ... rest of suite
});

// After  
export const mySuite = staticSuite((model, field?) => {
  only(field); // ✅ Call unconditionally
  // ... rest of suite
});
```

**Testing:**

After migration, test forms with:

- Cross-field validations
- `validationConfig` dependencies
- `omitWhen` conditional logic
- Async validations

**Related Issues:**

- Fixes #59 - Complex ValidationConfig test scenario
- Fixes #56 - ValidationConfig lifecycle timing issues

---

### 2. Removed Deprecated `VALIDATION_CONFIG_DEBOUNCE_TIME` Constant

**Status:** ⚠️ **BREAKING CHANGE** - Import changes required

**What Changed:**

The deprecated `VALIDATION_CONFIG_DEBOUNCE_TIME` constant has been completely removed. Use the injection token instead.

**v1.x Usage (old):**

```typescript
// ❌ Removed in v2.0.0
import { VALIDATION_CONFIG_DEBOUNCE_TIME } from 'ngx-vest-forms';

const debounce = VALIDATION_CONFIG_DEBOUNCE_TIME; // 100ms
```

**v2.0.0 Usage (new - REQUIRED):**

```typescript
// ✅ Use injection token
import { NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN } from 'ngx-vest-forms';

// Global configuration (app-level)
export const appConfig: ApplicationConfig = {
  providers: [
    { provide: NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN, useValue: 100 }
  ]
};

// Component-level override
@Component({
  providers: [
    { provide: NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN, useValue: 0 } // Instant validation
  ]
})
export class MyFormComponent {}
```

**Why This Change?**

The injection token provides:

- ✅ Configurable debounce timing per app/route/component
- ✅ Better testing support (set to 0ms for synchronous tests)
- ✅ Performance tuning flexibility
- ✅ Clean codebase without deprecated code

**Migration Steps:**

1. Find all usages:

```bash
grep -r "VALIDATION_CONFIG_DEBOUNCE_TIME" --include="*.ts"
```

2. Replace with injection token:

```typescript
// Before
import { VALIDATION_CONFIG_DEBOUNCE_TIME } from 'ngx-vest-forms';
const time = VALIDATION_CONFIG_DEBOUNCE_TIME;

// After
import { NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN } from 'ngx-vest-forms';
// Provide via DI at desired level (see examples above)
```

**Default Value:**

- Default remains **100ms** (backward compatible behavior)
- Override globally in `ApplicationConfig` or per component

**Testing Configuration:**

```typescript
// Test environment - disable debouncing for synchronous tests
TestBed.configureTestingModule({
  providers: [
    { provide: NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN, useValue: 0 }
  ]
});
```

---

### 3. Root Form Validation Mode Default Changed

**Change:** The default validation behavior for `validateRootForm` has changed from **live** to **submit mode**.

#### What Changed

**v1.4.x Behavior (old):**

```typescript
<form ngxVestForm validateRootForm>
  <!-- ✅ Validated on EVERY value change (live mode) -->
</form>
```

**v1.5.0 Behavior (new - BREAKING):**

```typescript
<form ngxVestForm validateRootForm>
  <!-- ⚠️ NOW: Only validates AFTER form submission (submit mode) -->
</form>
```

#### Why This Change?

**Root form validations are different from field validations** - they validate relationships between multiple fields that users cannot fix until ALL fields are filled in.

**Real-world example from the codebase:**

```typescript
// purchase.validations.ts
test(ROOT_FORM, 'Brecht is not 30 anymore', () => {
  enforce(
    model.firstName === 'Brecht' &&
      model.lastName === 'Billiet' &&
      model.age === 30
  ).isFalsy();
});
```

**Problem with 'live' mode (old default):**

1. **User types "B"** → ❌ "Brecht is not 30 anymore"
   - _Error appears before user finished typing!_
2. **User types "Brecht"** → ❌ Still showing error
   - _User hasn't even reached lastName field yet_
3. **User types lastName: "Billiet"** → ❌ Still showing error
   - _User hasn't reached age field yet_
4. **User types age: "30"** → ❌ Finally, error makes sense

**This creates a terrible UX**: The user sees an error for a validation they cannot possibly satisfy yet.

**Benefits of 'submit' mode (new default):**

1. ✅ **No premature errors**: User completes the form without distraction
2. ✅ **Validates when actionable**: Error only appears when user attempts to submit (when all fields are filled)
3. ✅ **Clear feedback**: User understands _why_ the form won't submit
4. ✅ **Matches expectations**: Users expect validation on submit for cross-field rules
5. ✅ **Consistency**: Aligns with HTML5 native form validation behavior

**When 'live' mode is still useful:**

- Simple two-field comparisons (password confirmation) where both fields are visible
- Real-time feedback is critical for your use case
- You're migrating from v2 and need identical behavior

**Recommendation:** Use `'submit'` mode (new default) unless you have a specific UX requirement for live validation.

#### Migration Options

##### Option 1: Keep Old Behavior (Recommended for Existing Apps)

Explicitly set `validateRootFormMode` to `'live'`:

```typescript
<form
  ngxVestForm
  validateRootForm
  [validateRootFormMode]="'live'">  <!-- ← Add this to restore v2 behavior -->
  <!-- Validates on every change (old behavior) -->
</form>
```

##### Option 2: Adopt New Default (Recommended for New Forms)

Use the new submit-based validation (no change needed):

```typescript
<form
  ngxVestForm
  validateRootForm>  <!-- Validates after submit (v3 default) -->
  <!-- Or explicitly: [validateRootFormMode]="'submit'" -->
</form>
```

#### Complete Example

**Before (v2):**

```typescript
import { Component, signal } from '@angular/core';
import { ROOT_FORM } from 'ngx-vest-forms';

@Component({
  template: `
    <form
      ngxVestForm
      [suite]="suite"
      [formValue]="formValue()"
      validateRootForm
      (formValueChange)="formValue.set($event)"
      (errorsChange)="errors.set($event)"
    >
      <input name="password" [ngModel]="formValue().password" />
      <input name="confirmPassword" [ngModel]="formValue().confirmPassword" />

      @if (errors()[ROOT_FORM]) {
        <div role="alert">{{ errors()[ROOT_FORM][0] }}</div>
      }

      <button type="submit">Submit</button>
    </form>
  `,
})
export class MyFormComponent {
  // Root form errors showed immediately as user typed
}
```

**After (v1.5.0 - preserving old behavior):**

```typescript
import { Component, signal } from '@angular/core';
import { ROOT_FORM } from 'ngx-vest-forms';

@Component({
  template: `
    <form
      ngxVestForm
      [suite]="suite"
      [formValue]="formValue()"
      validateRootForm
      [validateRootFormMode]="'live'"  <!-- ← ADD THIS LINE -->
      (formValueChange)="formValue.set($event)"
      (errorsChange)="errors.set($event)">

      <input name="password" [ngModel]="formValue().password" />
      <input name="confirmPassword" [ngModel]="formValue().confirmPassword" />

      @if (errors()[ROOT_FORM]) {
        <div role="alert">{{ errors()[ROOT_FORM][0] }}</div>
      }

      <button type="submit">Submit</button>
    </form>
  `,
})
export class MyFormComponent {
  // Root form errors still show immediately (same as v2)
}
```

**After (v1.5.0 - adopting new default):**

```typescript
import { Component, signal } from '@angular/core';
import { ROOT_FORM } from 'ngx-vest-forms';

@Component({
  template: `
    <form
      ngxVestForm
      [suite]="suite"
      [formValue]="formValue()"
      validateRootForm
      [validateRootFormMode]="'submit'"  <!-- ← Optional: explicit submit mode -->
      (formValueChange)="formValue.set($event)"
      (errorsChange)="errors.set($event)">

      <input name="password" [ngModel]="formValue().password" />
      <input name="confirmPassword" [ngModel]="formValue().confirmPassword" />

      @if (errors()[ROOT_FORM]) {
        <div role="alert">{{ errors()[ROOT_FORM][0] }}</div>
      }

      <button type="submit">Submit</button>
    </form>
  `,
})
export class MyFormComponent {
  // Root form errors only show after submit button clicked (better UX!)
}
```

#### Find All Affected Forms

Search your codebase for:

```bash
grep -r "validateRootForm" --include="*.ts" --include="*.html"
```

Look for forms using `validateRootForm` without `validateRootFormMode` and decide whether to:

- Add `[validateRootFormMode]="'live'"` (preserve old behavior)
- Accept new default `'submit'` mode (better UX)

#### When to Use Each Mode

| Mode                 | Use Case                                             | Example                                                                       | UX Impact                                                  |
| -------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `'submit'` (default) | **Most forms**, especially complex cross-field rules | "Brecht Billiet cannot be 30", date range validation, multi-step conditionals | ✅ No premature errors, validates when all fields complete |
| `'live'`             | Simple two-field comparisons, migration from v2      | Password confirmation (both fields visible)                                   | ⚠️ Shows errors while user is still filling form           |

**Real-world guidance:**

```typescript
// ✅ GOOD: Use 'submit' for complex cross-field validation
test(ROOT_FORM, 'Age must be 21+ if purchasing alcohol', () => {
  enforce(!(model.product === 'alcohol' && model.age < 21)).isTruthy();
});
// User needs to fill multiple fields - wait for submit

// ⚠️ ACCEPTABLE: Use 'live' for simple immediate feedback
test(ROOT_FORM, 'Passwords must match', () => {
  enforce(model.confirmPassword).equals(model.password);
});
// Both fields visible, immediate feedback might be helpful (but submit is still better!)

// ❌ BAD: Don't use 'live' for validations depending on many fields
test(ROOT_FORM, 'Full name must match ID', () => {
  enforce(`${model.firstName} ${model.middleName} ${model.lastName}`).equals(
    model.idName
  );
});
// User sees error before filling all name fields - terrible UX!
```

**Recommendation**: Default to `'submit'` mode. Only use `'live'` if you're migrating and need time to test UX changes.


---

## New Features in v2.0.0

### Ngx-Prefixed Utility Types

**Namespace-safe types to prevent conflicts with other libraries:**

```typescript
// ✅ New Ngx-prefixed types (recommended)
import { NgxDeepPartial, NgxDeepRequired, NgxVestSuite } from 'ngx-vest-forms';

type FormModel = NgxDeepPartial<{ name: string; age: number }>;
const shape: NgxDeepRequired<FormModel> = { name: '', age: 0 };

// ✅ Backward compatible aliases (legacy)
import { DeepPartial, DeepRequired } from 'ngx-vest-forms';
```

**Benefits:**

- ✅ Prevents naming conflicts
- ✅ Clear identification of ngx-vest-forms utilities
- ✅ Full backward compatibility
- ✅ Better developer experience

### Array/Object Conversion Utilities

**Handle form arrays in template-driven forms:**

```typescript
import { arrayToObject, deepArrayToObject, objectToArray } from 'ngx-vest-forms';

// Convert arrays to objects for template-driven forms
const objectForm = arrayToObject(['value1', 'value2']);
// → { 0: 'value1', 1: 'value2' }

// Deep conversion for nested structures
const deepObject = deepArrayToObject(nestedArrayData);

// Convert back to arrays for submission
const arrayData = objectToArray(objectForm);
// → ['value1', 'value2']
```

### Field Path Utilities

**Type-safe field path manipulation:**

```typescript
import { stringifyFieldPath, parseFieldPath } from 'ngx-vest-forms';

// Create dot-notation paths from arrays
stringifyFieldPath(['form', 'sections', 0, 'fields', 'name']);
// → 'form.sections.0.fields.name'

// Parse paths back to arrays (internal utility)
parseFieldPath('form.sections.0.fields.name');
// → ['form', 'sections', 0, 'fields', 'name']
```

### Enhanced Form State Type

**Safe state management with utilities:**

```typescript
import { NgxFormState, createEmptyFormState } from 'ngx-vest-forms';

// Safe fallback for parent components
protected readonly formState = computed(
  () => this.childForm()?.vestForm?.formState() ?? createEmptyFormState()
);

// NgxFormState<T> structure:
// {
//   valid: boolean;
//   errors: Record<string, string[]>;
//   value: T | null;
// }
```

### Field Clearing Utilities

**Manage dynamic form state:**

```typescript
import { clearFieldsWhen, clearFields, keepFieldsWhen } from 'ngx-vest-forms';

// Conditionally clear fields
const updated = clearFieldsWhen(formValue(), {
  'addresses.shippingAddress': !useShippingAddress,
  emergencyContact: age >= 18
});

// Unconditional clearing
const cleaned = clearFields(formValue(), ['tempData', 'cached']);

// Whitelist approach
const filtered = keepFieldsWhen(formValue(), {
  basicInfo: true,
  addressInfo: needsAddress
});
```

### Validation Config Builder

**Fluent API for type-safe validation configuration:**

```typescript
import { createValidationConfig } from 'ngx-vest-forms';

const config = createValidationConfig<FormModel>()
  .bidirectional('password', 'confirmPassword')     // Password confirmation
  .whenChanged('age', 'emergencyContact')           // Age affects emergency contact
  .group(['firstName', 'lastName', 'email'])        // Contact group
  .build();
```

**Benefits:**

- ✅ Full IDE autocomplete
- ✅ Compile-time type checking
- ✅ Self-documenting code
- ✅ Less boilerplate

### WCAG 2.2 AA Accessibility Compliance

**Enhanced ARIA management:**

- ✅ **Polite announcements**: Field errors use `role="status"` with `aria-live="polite"`
- ✅ **Assertive alerts**: Blocking errors use `role="alert"` with `aria-live="assertive"`
- ✅ **Non-disruptive**: Errors don't interrupt typing or screen reader flow
- ✅ **Pending states**: Validation pending indicators properly announced
- ✅ **Warning support**: Non-blocking feedback with appropriate ARIA

**Automatic in `ngx-control-wrapper`:**

- Unique IDs for error/warning/pending regions
- `aria-describedby` associations
- `aria-invalid` state management
- Proper ARIA roles for all message types

See [ACCESSIBILITY.md](../ACCESSIBILITY.md) for complete guide.

---

## Performance Improvements

### Signal Memoization with Custom Equality

**60-80% performance improvement in large forms:**

```typescript
// Automatic in v2.0.0 - no changes required
// formState signal uses deep equality checking
// Only updates when actual values change
```

**Benefits:**

- ✅ Prevents unnecessary recalculations
- ✅ Efficient for frequent template access
- ✅ Works seamlessly with computed signals
- ✅ No configuration needed

### Optimized Validation Execution

- ✅ Unconditional `only()` enables Vest's field-level optimization
- ✅ Proper debouncing of dependent field validations
- ✅ Efficient bidirectional sync with minimal checks

---

## Documentation Improvements

### New Comprehensive Guides

- **[Field Path Types](../FIELD-PATHS.md)** - Type-safe field references with autocomplete
- **[Accessibility Guide](../ACCESSIBILITY.md)** - WCAG 2.2 AA implementation details
- **[Field Clearing Utilities](../FIELD-CLEARING-UTILITIES.md)** - Dynamic form state management
- **[Validation Config Builder](../VALIDATION-CONFIG-BUILDER.md)** - Fluent API patterns
- **[Child Components](../CHILD-COMPONENTS.md)** - Splitting forms into reusable components
- **[Complete Example](../COMPLETE-EXAMPLE.md)** - Full working implementation

### Browser Compatibility

- ✅ Native `structuredClone()` requirement documented
- ✅ No polyfill needed for Angular 18+ target environments
- ✅ Explicit browser support documentation

---

## Testing Changes

### Unit Tests

If you have unit tests that rely on root form validation, update them:

**Before:**

```typescript
it('should validate root form immediately', () => {
  component.formValue.set({ password: '123', confirmPassword: '456' });
  fixture.detectChanges();
  // Expect errors immediately
  expect(component.errors()[ROOT_FORM]).toBeDefined();
});
```

**After (with submit mode):**

```typescript
it('should validate root form after submit', () => {
  component.formValue.set({ password: '123', confirmPassword: '456' });
  fixture.detectChanges();
  // No errors yet
  expect(component.errors()[ROOT_FORM]).toBeUndefined();

  // Trigger submit
  const form = fixture.nativeElement.querySelector('form');
  form.dispatchEvent(new Event('submit'));
  fixture.detectChanges();

  // Now errors appear
  expect(component.errors()[ROOT_FORM]).toBeDefined();
});
```

### Storybook/Integration Tests

Update test assertions to trigger form submission:

```typescript
// Before
await userEvent.type(input, 'value');
expect(errors).toContain('error message');

// After
await userEvent.type(input, 'value');
await userEvent.click(submitButton); // ← Add this
expect(errors).toContain('error message');
```

---

## Rollback Strategy

If you need to temporarily rollback to v2 behavior globally:

1. **Find all forms**: `grep -r "validateRootForm" --include="*.html"`
2. **Add mode to each**: Add `[validateRootFormMode]="'live'"` to all matches
3. **Or create a wrapper component** with `'live'` as default:

```typescript
@Component({
  selector: 'app-legacy-form',
  template: `
    
---

## Testing Changes

### Unit Tests

Update tests for unconditional `only()` and submit-mode root validation:

**Before (v1.x):**

```typescript
// Test with conditional only()
const suite = staticSuite((model, field?) => {
  if (field) { only(field); }
  test('email', 'Required', () => enforce(model.email).isNotBlank());
});

// Expect root form errors immediately
it('validates root form live', () => {
  component.formValue.set({ password: '123', confirmPassword: '456' });
  fixture.detectChanges();
  expect(component.errors()[ROOT_FORM]).toBeDefined(); // ✅ Passes in v1.x
});
```

**After (v2.0.0):**

```typescript
// Test with unconditional only()
const suite = staticSuite((model, field?) => {
  only(field); // ✅ No conditional wrapper
  test('email', 'Required', () => enforce(model.email).isNotBlank());
});

// Trigger submit for root form errors
it('validates root form after submit', () => {
  component.formValue.set({ password: '123', confirmPassword: '456' });
  fixture.detectChanges();
  expect(component.errors()[ROOT_FORM]).toBeUndefined(); // No errors yet

  // Trigger submit
  const form = fixture.nativeElement.querySelector('form');
  form.dispatchEvent(new Event('submit'));
  fixture.detectChanges();

  expect(component.errors()[ROOT_FORM]).toBeDefined(); // ✅ Now errors appear
});
```

### Storybook/Integration Tests

**Update test assertions:**

```typescript
// Before
await userEvent.type(input, 'value');
expect(errors).toContain('error message');

// After
await userEvent.type(input, 'value');
await userEvent.click(submitButton); // ← Add submit interaction
expect(errors).toContain('error message');
```

### Test Configuration

**Disable debouncing for synchronous tests:**

```typescript
TestBed.configureTestingModule({
  providers: [
    { provide: NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN, useValue: 0 }
  ]
});
```

---

## Complete Migration Checklist

### Critical Changes (Must Do)

- [ ] **Update `only()` calls**: Remove all `if (field)` wrappers around `only(field)` calls
- [ ] **Replace constant**: Change `VALIDATION_CONFIG_DEBOUNCE_TIME` to `NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN`
- [ ] **Update root form validation**: Add `[validateRootFormMode]="'live'"` if you need old behavior

### Recommended Changes (Should Do)

- [ ] **Adopt Ngx-prefixed types**: Use `NgxDeepPartial`, `NgxDeepRequired` in new code
- [ ] **Use validation config builder**: Replace manual configs with `createValidationConfig()`
- [ ] **Test accessibility**: Verify ARIA compliance with screen readers
- [ ] **Review error display modes**: Consider switching to `'on-submit'` for better UX

### Optional Enhancements (Nice to Have)

- [ ] **Explore new utilities**: Try field clearing, array conversion, and path utilities
- [ ] **Update documentation**: Add JSDoc comments to validation suites
- [ ] **Performance testing**: Measure improvements in large forms
- [ ] **Add type safety**: Use `ValidationConfigMap<T>` for validation configs

---

## Automated Migration Script

**Find and report issues:**

```bash
#!/bin/bash

echo "=== Checking for migration issues ==="

echo "\n1. Conditional only() calls (CRITICAL):"
grep -rn "if (field)" --include="*.ts" | grep "only"

echo "\n2. Deprecated constant usage:"
grep -rn "VALIDATION_CONFIG_DEBOUNCE_TIME" --include="*.ts"

echo "\n3. Root form validation without mode:"
grep -rn "validateRootForm" --include="*.html" --include="*.ts" | grep -v "validateRootFormMode"

echo "\n=== Migration check complete ==="
```

---

## Rollback Strategy

If you need to temporarily rollback:

### Option 1: Revert to v1.x

```bash
npm install ngx-vest-forms@^1.4.0
```

### Option 2: Preserve v1.x Behavior in v2.0.0

```typescript
// 1. Keep conditional only() (NOT RECOMMENDED - breaks validationConfig)
export const suite = staticSuite((model, field?) => {
  if (field) { only(field); } // ⚠️ Will cause timing issues!
  // ...
});

// 2. Force live mode for root validation
<form validateRootForm [validateRootFormMode]="'live'">

// 3. Continue using legacy type aliases
import { DeepPartial, DeepRequired } from 'ngx-vest-forms';
```

**Warning:** Keeping conditional `only()` will cause validation timing issues. This is a critical bug fix, not a preference.

---

## Common Migration Issues

### Issue: "only() breaks my validation"

**Symptom:** Validation stops working after removing `if (field)` wrapper

**Cause:** Misunderstanding of `only()` behavior

**Solution:** The unconditional pattern is correct. `only(undefined)` runs all tests:

```typescript
// This is CORRECT and SAFE
only(field); // When field is undefined, all tests run
             // When field is 'email', only email tests run
```

### Issue: "Tests fail after migration"

**Symptom:** Unit tests expecting immediate root form errors fail

**Cause:** Default root validation mode changed to `'submit'`

**Solution:** Trigger form submission in tests:

```typescript
const form = fixture.nativeElement.querySelector('form');
form.dispatchEvent(new Event('submit'));
fixture.detectChanges();
```

### Issue: "Can't import NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN"

**Symptom:** Import error after replacing constant

**Cause:** Wrong import path or token name

**Solution:** Verify correct import:

```typescript
import { NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN } from 'ngx-vest-forms';
```

---

## Questions?

### About Unconditional `only()` Pattern

**Q: Why is conditional `only()` broken?**

A: Conditional `only()` corrupts Vest's execution tracking, causing timing issues with `omitWhen` + `validationConfig`. The unconditional pattern is safe because `only(undefined)` runs all tests.

**Q: Will this affect performance?**

A: No! The unconditional pattern actually **improves** performance by enabling Vest's field-level optimization. When `field` is defined, only that field's tests run.

### About Root Form Validation Mode

**Q: Why did the default change?**

A: Root form validations check relationships between multiple fields. In 'live' mode, users see errors before they can possibly fix them. Submit mode waits until all fields are complete, providing much better UX.

**Q: Which mode should I use?**

A: Use `'submit'` (new default) for almost all cases. Only use `'live'` if you have a specific UX requirement or need time to migrate.

### About Deprecated Constant

**Q: Why remove the constant?**

A: The injection token pattern provides configurability (per app/route/component), better testing support, and aligns with Angular best practices.

**Q: What's the default debounce time?**

A: Still **100ms** (backward compatible). Override via DI if needed.

### About New Features

**Q: Do I have to use Ngx-prefixed types?**

A: No, legacy aliases (`DeepPartial`, `DeepRequired`) still work. Ngx-prefixed versions are recommended to avoid naming conflicts.

**Q: Are the new utilities optional?**

A: Yes! All new utilities (field clearing, array conversion, config builder) are optional enhancements.

---

## Additional Resources

- **[Complete Changelog](../../CHANGELOG.md)** - Full list of changes
- **[PR #60](https://github.com/ngx-vest-forms/ngx-vest-forms/pull/60)** - Detailed PR description
- **[Field Path Types](../FIELD-PATHS.md)** - Type-safe field references
- **[Accessibility Guide](../ACCESSIBILITY.md)** - WCAG 2.2 AA compliance
- **[Complete Example](../COMPLETE-EXAMPLE.md)** - Full working implementation
- **[Main README](../../README.md)** - Updated documentation

---

**Version:** 2.0.0
**Migration Guide Created:** January 2025
**Status:** Stable
  `,
})
export class LegacyFormComponent {
  // Use this wrapper for all legacy forms
}
```

---

## Questions?

- **Q: Why did the default change?**
  - A: Root form validations check relationships between multiple fields. In 'live' mode, users see errors for validations they cannot satisfy yet (e.g., "firstName + lastName + age must match" error appears when they've only typed firstName). Submit mode only validates when all fields are complete, providing much better UX.

- **Q: Which mode should I use?**
  - A: Use `'submit'` (new default) for almost all cases. Root form validations are cross-field rules that users can only fix after filling multiple inputs. Only use `'live'` if you have a specific UX requirement or need time to test the new behavior during migration.

- **Q: What about password confirmation - shouldn't that validate live?**
  - A: Even for password confirmation, `'submit'` mode provides better UX - users can focus on entering their password without being interrupted by "passwords don't match" errors. However, if you prefer immediate feedback, use `'live'` mode for this specific case.

- **Q: Do I have to update all my forms?**
  - A: Only forms using `validateRootForm`. Regular field validation is unchanged.

- **Q: Can I mix modes in different forms?**
  - A: Yes! Each form can have its own `validateRootFormMode` setting.
