# PR #60: Critical Validation Fixes and New Utilities

## Overview

PR #60 fixes critical timing issues with `omitWhen` + `validationConfig` for nested fields and introduces new utilities for working with arrays and field paths in template-driven forms.

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

Added 7 new test scenarios covering:

- Bidirectional dependencies (both fields optional when empty, both required when one has value)
- Single-direction dependencies with `omitWhen`
- Clearing trigger fields to verify `omitWhen` properly omits tests
- Nested field paths with `ngModelGroup`

## Documentation Updates

- Updated `.github/instructions/ngx-vest-forms.instructions.md` with all new utilities
- Added comprehensive utility README: `projects/ngx-vest-forms/src/lib/utils/README.md`
- Updated Vest.js best practices with unconditional `only()` pattern
- Added Tailwind CSS instructions for styling examples

## References

- PR: https://github.com/ngx-vest-forms/ngx-vest-forms/pull/60
- Issue: https://github.com/ngx-vest-forms/ngx-vest-forms/issues/59
- Utilities Documentation: `./projects/ngx-vest-forms/src/lib/utils/README.md`
