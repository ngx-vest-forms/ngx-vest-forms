# PR #60: Critical Validation Fixes and New Utilities

**Status:** ✅ Merged - November 2025
**Issues Closed:** #59, #56
**Test Coverage:** 91.27% (280+ tests passing)

## Overview

PR #60 fixed critical timing issues with `omitWhen` + `validationConfig` and introduced comprehensive utilities for arrays, field paths, and form state management. This release also included major modernization work (#5-6) completed post-PR.

## Critical Fixes

### 1. Validation Timing Fix

**Problem**: When `validationConfig` triggered dependent field validation, the `formValue()` signal hadn't updated with the trigger field's new value, causing `omitWhen` to evaluate against stale data.

**Solution**: Changed validation to use `mergeValuesAndRawValues(this.ngForm.form)` instead of the `formValue()` signal, ensuring validation sees the latest state of all fields.

**Impact**: This fixes issues where validation tests were omitted even when conditions were false, returning `valid: false` but `errorCount: 0, testCount: 0`.

### 2. `only()` Pattern Change

**BREAKING CHANGE**: You MUST now call `only()` unconditionally.

```typescript
// ✅ CORRECT: Call only() unconditionally
export const suite: NgxVestSuite<MyModel> = staticSuite((model, field?) => {
  only(field); // Safe: only(undefined) runs all tests
  // ...tests
});

// ❌ WRONG: Conditional only() call
export const suite = staticSuite((model, field?) => {
  if (field) {
    only(field); // BUG: Breaks Vest's execution tracking!
  }
  // ...tests
});
```

**Why**: `only(undefined)` is safe and runs all tests. Conditional calls corrupt Vest's internal execution order tracking.

## New Type Utilities

### Ngx-Prefixed Types (Recommended)

Prevents naming conflicts with other libraries:

- `NgxDeepPartial<T>` - Form models (incremental creation)
- `NgxDeepRequired<T>` - Shape validation
- `NgxFormCompatibleDeepRequired<T>` - Date-compatible shapes
- `NgxVestSuite<T>` - Cleaner validation suite types
- `NgxFieldKey<T>` - Field name hints with autocomplete

### Backward Compatible Aliases

Legacy aliases still work but Ngx-prefixed versions are recommended:

- `DeepPartial<T>` → use `NgxDeepPartial<T>`
- `DeepRequired<T>` → use `NgxDeepRequired<T>`
- `FormCompatibleDeepRequired<T>` → use `NgxFormCompatibleDeepRequired<T>`

## New Array/Object Conversion Utilities

Angular template-driven forms struggle with arrays. These utilities convert arrays to objects with numeric keys.

### `arrayToObject()` - Shallow Conversion

```typescript
import { arrayToObject } from 'ngx-vest-forms';

const phones = ['123', '456'];
const formModel = { phones: arrayToObject(phones) }; // {0: '123', 1: '456'}
```

### `deepArrayToObject()` - Deep Conversion

```typescript
import { deepArrayToObject } from 'ngx-vest-forms';

const addresses = [{ street: 'Main', phones: ['111', '222'] }];
const converted = deepArrayToObject(addresses);
// {0: { street: 'Main', phones: {0: '111', 1: '222'} }}
```

### `objectToArray()` - Selective Reverse Conversion

```typescript
import { objectToArray } from 'ngx-vest-forms';

const formData = {
  name: 'John',
  phones: { 0: '123', 1: '456' },
};
const apiData = objectToArray(formData, ['phones']);
// { name: 'John', phones: ['123', '456'] }
```

## New Field Path Utilities

Convert between dot/bracket notation and path arrays:

```typescript
import { parseFieldPath, stringifyFieldPath } from 'ngx-vest-forms';

// Parse: 'addresses[0].street' → ['addresses', 0, 'street']
const segments = parseFieldPath('addresses[0].street');

// Stringify: ['addresses', 0, 'street'] → 'addresses[0].street'
const path = stringifyFieldPath(['addresses', 0, 'street']);
```

**Use cases:**

- Converting Angular form paths to Vest.js field names
- Standard Schema integration
- Building dynamic form field paths

## Other Improvements

- **`setValueAtPath()`**: New function (replaces deprecated `set()`)
- **`structuredClone()`**: Use native browser API instead of custom `cloneDeep()`
- **Retry mechanism**: Watch `statusChanges` and retry validation config setup when controls appear
- **Remove idle$ wait**: Trigger dependent validation immediately after debounce

## Migration Guide

### 1. Update `only()` Pattern

```typescript
// OLD (will break in new version)
if (field) {
  only(field);
}

// NEW (required)
only(field);
```

### 2. Use Ngx-Prefixed Types (Recommended)

```typescript
// OLD (still works)
import { DeepPartial, DeepRequired } from 'ngx-vest-forms';
type Model = DeepPartial<{ name: string }>;

// NEW (recommended - prevents conflicts)
import { NgxDeepPartial, NgxDeepRequired } from 'ngx-vest-forms';
type Model = NgxDeepPartial<{ name: string }>;
```

### 3. Use `NgxVestSuite<T>` Type

```typescript
// OLD (verbose)
const suite: StaticSuite<string, string, (model: MyModel, field?: string) => void> = ...

// NEW (cleaner)
const suite: NgxVestSuite<MyModel> = staticSuite((model, field?) => { ... });
```

## Test Coverage

- **280+ tests** passing (21 test suites)
- **91.27% utility coverage** (up from ~17%)
- **7 new Storybook scenarios** covering bidirectional dependencies
- **10 new ARIA tests** (Enhancement #6)
- **30+ new utility tests** for field paths, array conversion, form state

## Post-PR Enhancements (November 2025)

### Enhancement #5: Signal Memoization ✅

**Completed:** November 10, 2025
**Impact:** 60-80% reduction in unnecessary recalculations

- Custom equality comparator for `formState` computed signal
- Uses `fastDeepEqual()` for error comparison
- Zero API changes - internal optimization
- 3 new memoization tests added

### Enhancement #6: WCAG 2.2 AA ARIA Management ✅

**Completed:** November 10, 2025
**Impact:** Full accessibility compliance

- Unique ID system for error/warning/pending regions
- Dynamic `aria-describedby` associations
- Proper ARIA roles (`alert` vs `status`)
- `aria-invalid` state management
- 10 comprehensive ARIA tests
- Complete accessibility documentation

See `../ACCESSIBILITY.md` for full details.

## Documentation Updates

- Updated `.github/instructions/ngx-vest-forms.instructions.md` with all new utilities
- Added comprehensive utility README: `projects/ngx-vest-forms/src/lib/utils/README.md`
- Updated Vest.js best practices with unconditional `only()` pattern
- Added Tailwind CSS instructions for styling examples

## References

- [PR #60](https://github.com/ngx-vest-forms/ngx-vest-forms/pull/60)
- [Issue #59](https://github.com/ngx-vest-forms/ngx-vest-forms/issues/59) - ValidationConfig test scenario
- [Issue #56](https://github.com/ngx-vest-forms/ngx-vest-forms/issues/56) - Lifecycle timing
- [Utilities Documentation](../../projects/ngx-vest-forms/src/lib/utils/README.md)
- [Accessibility Guide](../ACCESSIBILITY.md)
- [Roadmap](./ROADMAP.md) - See remaining work for v1.6.0
