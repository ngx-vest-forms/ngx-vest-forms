# Async Validation Race Condition Prevention (TODO)

## Status: Not Implemented

This document describes an **aspirational feature** that was previously documented in `.todo()` tests but has not been implemented.

## Problem Statement

When a user rapidly types in a field with async validation, multiple validation runs can be triggered in quick succession. This can cause:

1. **Vest "Tests called in different order" errors** - Vest stateful suites maintain internal state and expect tests to run in the same order
2. **Wasted API calls** - Each keystroke triggers a new async validation request even though previous ones are still pending
3. **Race conditions** - Later API responses might arrive before earlier ones, causing inconsistent state

## Current Implementation (v2.0)

**What we DO have:**

- ✅ `validate()` method returns suite result with `.done()` callback (lines 447-469 of create-vest-form.ts)
- ✅ Async completion is handled via `.done()` callback which updates `suiteResult` signal
- ✅ AbortSignal support for cancelling in-flight requests when new validation starts
- ✅ Subscriptions are disabled (lines 118-128) due to Vest `only()` bug - this is intentional

**What we DON'T have:**

- ❌ **Pending check before calling suite** - We do NOT check if async validation is pending before calling the suite again
- ❌ **Queue-based validation** - We do NOT queue validation requests and process them sequentially
- ❌ **Debouncing built-in** - We do NOT debounce field validations automatically (users can use Vest's `test.debounce()` manually)

## Proposed Solutions (Not Implemented)

### Option 1: Pending Check Before Validate (Simple)

```typescript
validate: <P extends Path<TModel>>(fieldPath?: P) => {
  // ❌ NOT IMPLEMENTED
  if (pending()) {
    console.warn('Validation already pending, skipping...');
    return suiteResult(); // Return current result
  }

  return runSuite(fieldPath);
},
```

**Pros:**

- Simple to implement
- Prevents Vest errors from rapid calls
- Reduces wasted API calls

**Cons:**

- User might not see validation for latest value if typing fast
- Might feel laggy in UI
- Still doesn't handle "different field while async pending" case

### Option 2: Queue-Based Validation (Complex)

```typescript
const validationQueue: Array<{ field?: string; resolve: (result: SuiteResult) => void }> = [];
let processingQueue = false;

async function processQueue() {
  if (processingQueue || validationQueue.length === 0) return;

  processingQueue = true;

  while (validationQueue.length > 0) {
    const { field, resolve } = validationQueue.shift()!;
    const result = runSuite(field);

    if (result.isPending()) {
      await new Promise<void>((r) => result.done(() => r()));
    }

    resolve(result);
  }

  processingQueue = false;
}

validate: <P extends Path<TModel>>(fieldPath?: P) => {
  return new Promise((resolve) => {
    validationQueue.push({ field: fieldPath, resolve });
    processQueue();
  });
},
```

**Pros:**

- Handles all validation requests in order
- No race conditions
- Works for multiple fields

**Cons:**

- Much more complex
- Async method signature (breaking change)
- Might feel slow if queue backs up

### Option 3: Cancel-and-Replace (Aggressive)

```typescript
let currentValidation: { field?: string; token: symbol } | null = null;

validate: <P extends Path<TModel>>(fieldPath?: P) => {
  // Cancel previous validation if pending
  if (currentValidation && pending()) {
    currentValidation.token = Symbol('cancelled'); // Invalidate old token
  }

  const token = Symbol('current');
  currentValidation = { field: fieldPath, token };

  const result = runSuite(fieldPath);

  if (result.isPending()) {
    result.done((finalResult) => {
      // Only update if this is still the current validation
      if (currentValidation?.token === token) {
        suiteResult.set(finalResult);
      }
    });
  }

  return result;
},
```

**Pros:**

- Always validates latest value
- Cancels stale requests
- Feels responsive

**Cons:**

- Might waste API calls (old ones still run)
- Complex state management
- Need to coordinate with AbortSignal properly

## Why Not Implemented?

1. **Complexity vs. Benefit** - All solutions add significant complexity for edge cases
2. **Vest Already Has Solutions** - Users can use `test.debounce()` or `skipWhen()` in their suites
3. **Framework-Level Solutions** - Angular's `debounceTime` on form value changes works too
4. **Current Implementation Works** - The `.done()` callback approach handles async completion correctly, even if multiple validations run

## Recommended Workarounds (For Users)

### 1. Use Vest's `test.debounce()` (Recommended)

```typescript
import { test, enforce } from 'vest';
import debounce from 'vest/debounce';

const userSuite = staticSafeSuite<User>((data) => {
  test('email', 'Email is required', () => {
    enforce(data.email).isNotEmpty();
  });

  // Debounce expensive async check
  test(
    'email',
    'Checking availability...',
    debounce(async ({ signal }) => {
      const response = await fetch(`/api/check-email/${data.email}`, {
        signal,
      });
      if (!response.ok) throw new Error('Email taken');
    }, 500), // Wait 500ms after user stops typing
  );
});
```

### 2. Use `skipWhen()` to Guard Expensive Checks

```typescript
import { test, enforce, skipWhen } from 'vest';

const userSuite = staticSafeSuite<User>((data) => {
  test('email', 'Email is required', () => {
    enforce(data.email).isNotEmpty();
  });

  test('email', 'Invalid format', () => {
    enforce(data.email).isEmail();
  });

  // Skip expensive check until basic validation passes
  skipWhen(
    (result) => result.hasErrors('email'),
    () => {
      test('email', 'Email taken', async ({ signal }) => {
        const response = await fetch(`/api/check-email/${data.email}`, {
          signal,
        });
        if (!response.ok) throw new Error('Email taken');
      });
    },
  );
});
```

### 3. Debounce at Component Level (Angular)

```typescript
import { Component, effect } from '@angular/core';
import { debounceTime } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

@Component({
  /* ... */
})
export class UserFormComponent {
  form = createVestForm(signal({ email: '' }), userSuite);

  constructor() {
    // Debounce validation at component level
    toObservable(this.form.email)
      .pipe(debounceTime(300))
      .subscribe(() => this.form.validate('email'));
  }
}
```

## Test Coverage

The original `.todo()` tests that were removed tested this aspirational feature:

1. **"should NOT call suite again when async validation is pending"** - tested pending check
2. **"should NOT call suite when validating different field while async pending"** - tested cross-field pending
3. **"should allow new field validation after previous async completes"** - tested queue/sequential behavior
4. **"should validate different field via all-fields strategy when async pending"** - tested multi-field edge case

These tests were removed because they tested functionality that doesn't exist (and may never exist given the complexity).

## Decision: Keep Current Implementation

After analysis, we've decided to:

- ✅ Keep the simple `.done()` callback approach
- ✅ Document workarounds for users (debounce, skipWhen, etc.)
- ✅ Remove misleading `.todo()` tests
- ❌ NOT implement pending check or queue-based validation (too complex)

**Reasoning:**

- Current implementation works correctly with AbortSignal for cancellation
- Vest provides `test.debounce()` for built-in debouncing
- Users can debounce at component level with RxJS
- Complexity of queue/pending-check doesn't justify the edge case benefit

## Related Files

- `create-vest-form.ts` lines 447-469: `.done()` callback implementation
- `create-vest-form.ts` lines 118-128: Subscriptions disabled (Vest `only()` bug)
- `create-vest-form.spec.ts`: 2 skipped async tests (flaky due to timing)

## See Also

- [Vest Debouncing Guide](https://vestjs.dev/docs/utilities/debounce)
- [Vest skipWhen Documentation](https://vestjs.dev/docs/writing_your_suite/including_and_excluding/skipWhen)
- [FIELD_STATES.md](../../projects/examples/docs/FIELD_STATES.md) - Field state management (pending, dirty, touched)
