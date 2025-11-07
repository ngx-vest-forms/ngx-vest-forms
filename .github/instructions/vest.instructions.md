---
description: 'Best practices and guidelines for using vestjs'
applyTo: '**/*.{ts,html,component.ts}'
---

# Vest.js Validation Best Practices

## What is Vest.js?

Vest.js is a declarative validation framework inspired by unit testing libraries. It simplifies form validation with a suite-like syntax, making validation logic maintainable and readable across any UI framework.

**Core Philosophy:**
- **Declarative Syntax**: Write validations like unit tests for clarity
- **Framework Agnostic**: Works with any frontend or backend framework
- **Performance Optimized**: Selective validation with `only()` for optimal performance
- **Asynchronous First**: Built-in support for async validations with cancellation
- **Composable**: Modular and reusable validation logic

## Purpose of this Guide

Equip you with crisp guardrails when generating Vest.js code, focusing on: selective validation, touch detection, async hygiene, and accessible feedback.

## Golden Rules (Follow These First)

1. **CRITICAL**: Call `only()` **unconditionally** at the top of your suite - `only(undefined)` is safe and runs all tests
2. **Never call `only()`, `skip()`, or `.done()` conditionally** - this corrupts Vest's execution order tracking
3. Drive touch state from `result.isTested(field)` - never maintain parallel dirty flags
4. Prefer `skipWhen`/`omitWhen`/`include.when` over ad-hoc conditionals
5. Keep async validations cancellable via `AbortSignal` and guard expensive work with `skipWhen`
6. Use `warn()` only for non-blocking guidance; call it synchronously at test start
7. Use typed suites so invalid field names fail at compile time
8. When unsure, copy patterns from this file

## Recommended Suite Pattern

**✅ CORRECT: Call `only()` unconditionally**

```typescript
import { staticSuite, only, test, enforce } from 'vest';

export const contactSuite = staticSuite((data = {}, field?: string) => {
  // ✅ CORRECT: Call only() unconditionally (passing undefined is safe)
  only(field); // When field is undefined, all tests run

  test('email', 'Email is required', () => enforce(data.email).isNotBlank());
  test('email', 'Email format is invalid', () => enforce(data.email).isEmail());
  test('username', 'Username is required', () => enforce(data.username).isNotBlank());
});
```

**Why this matters:**
- `only(undefined)` is **safe** - Vest ignores it and runs all tests
- `only('email')` runs only email tests (performance optimization)
- Vest tracks execution order internally - **conditional calls corrupt this state**

**❌ WRONG: Conditional `only()` call**

```typescript
// ❌ WRONG: Calling only() conditionally breaks execution order tracking!
export const contactSuite = staticSuite((data = {}, field?: string) => {
  if (field) {
    only(field); // BUG: Conditional call breaks Vest's internal state!
  }
  test('email', 'Email is required', () => enforce(data.email).isNotBlank());
});
```

**Alternative correct patterns:**
```typescript
only(field);               // ✅ Recommended
only(field ?? false);      // ✅ Explicit fallback
only(condition ? 'email' : false); // ✅ Conditional argument, not call
```

> **Critical Rule**: `only()`, `skip()`, and `.done()` must **NEVER** be called conditionally. The function call itself must always execute - only the *arguments* can be conditional. Vest maintains an internal execution order counter that breaks with conditional calls, causing unpredictable behavior with async tests, subscriptions, and memoization.

## TypeScript Support

```typescript
import { create } from 'vest';

type FieldName = 'email' | 'password';
type GroupName = 'signIn' | 'signUp';
type Model = { email: string; password: string };

export const authSuite = create<FieldName, GroupName, (data: Model, field?: FieldName) => void>(
  (data, field) => {
    only(field); // TypeScript enforces field must be FieldName | undefined
    test('password', 'Password is required', () => enforce(data.password).isNotBlank());
  }
);

// Destructured helpers are type-aware
const { test, group, only: onlyTyped } = authSuite;
```

## Conditional Validation

### `skipWhen` vs `omitWhen`

**`skipWhen`**: Prevents tests from running but fields still count toward `isValid()`. Use for expensive work until prerequisites pass.

```typescript
skipWhen(res => res.hasErrors('email'), () => {
  test('email', 'Domain is blacklisted', async () => checkDomain(data.email));
});
```

**`omitWhen`**: Removes tests from result entirely while condition holds. Use for feature toggles or optional sections.

```typescript
omitWhen(!data.useNewAddress, () => {
  test('address.line1', 'Street is required', () => enforce(data.address?.line1).isNotBlank());
});
```

### Optional Fields

```typescript
optional({
  vatNumber: () => data.businessType !== 'corporation',
  alternateEmail: data.altEmail,
});

test('alternateEmail', 'Format is invalid', () => enforce(data.altEmail).isEmail());
```

Vest omits optional tests when value is `'' | null | undefined` or callback returns `true`.

## Async Validation

### Basic Pattern with AbortSignal

```typescript
skipWhen(res => res.hasErrors('username'), () => {
  test('username', 'Username already exists', async ({ signal }) => {
    // Vest automatically provides { signal } to async tests
    await fetch('/api/check-username', { signal })
      .then(res => res.json())
      .then(exists => exists ? Promise.reject() : Promise.resolve());
  });
});
```

**Always respect `AbortSignal`:**
- Native fetch: `fetch(url, { signal })`
- RxJS: `.pipe(takeUntil(fromEvent(signal, 'abort')))`
- Axios: pass signal in config

### Performance Optimization

```typescript
// Cache deterministic async results
test.memo(
  'username',
  'Username already exists',
  () => checkUsername(data.username),
  [data.username] // Re-run only when username changes
);

// Debounce live-typing fields
test.debounce('search', 'No results found', () => searchAPI(data.query), 300);
```

## Execution Modes

```typescript
import { create, mode, Modes, only } from 'vest';

const suite = create((data, field) => {
  if (!field) mode(Modes.ALL); // Show all errors on submit
  only(field);

  test('displayName', 'Required', () => enforce(data.displayName).isNotBlank());
  test('displayName', 'Min 3 chars', () => enforce(data.displayName).longerThan(2));
});
```

- **EAGER** (default): Stop after first failure per field - best for live validation
- **ALL**: Collect all failures per field - use on submit
- **ONE**: Stop entire suite after first failure - server-side fast-fail

## Grouped Validations

```typescript
import { group, only } from 'vest';

const suite = create((data, currentStep) => {
  only.group(currentStep);

  group('personal_info', () => {
    test('firstName', 'First name is required', () => enforce(data.firstName).isNotBlank());
  });

  group('contact_info', () => {
    test('email', 'Email is required', () => enforce(data.email).isNotBlank());
  });
});

suite(formData, 'personal_info'); // Only validate personal info step
```

## Dynamic Collections

```typescript
import { each } from 'vest';

each(model.phoneNumbers, (phone, index) => {
  test(
    `phoneNumbers.${index}.number`,
    'Phone number is required',
    () => enforce(phone.number).isNotBlank(),
    phone.id // Stable key for state persistence
  );
});
```

## Warnings (Non-blocking)

```typescript
test('password', 'Password strength: WEAK', () => {
  warn(); // Call synchronously at start - must not block submission
  enforce(data.password).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/);
});
```

## Accessing Results

### Three Ways to Access Suite State

```typescript
// 1. Direct result (from suite call)
const result = suite(data);
result.hasErrors();

// 2. Suite method (latest state)
suite.hasErrors();

// 3. suite.get() (latest state, same as #2)
suite.get().hasErrors();
```

### Result Methods

```typescript
result.isValid();                    // Overall validity
result.hasErrors('username');        // Field-specific errors
result.getErrors('username');        // string[]
result.getErrors();                  // Record<string, string[]>
result.hasWarnings('password');      // Non-blocking warnings
result.getWarnings('password');      // string[]
result.isPending();                  // Any async tests running
result.isPending('username');        // Specific field pending
result.isTested('email');            // Touch detection - use this!
```

### Async Completion

```typescript
suite(data)
  .done('username', (res) => {
    if (res.hasErrors('username')) {
      // Handle username validation completion
    }
  })
  .done((res) => {
    // Handle overall suite completion
    if (res.isValid()) submitForm();
  });
```

**Never call `.done()` conditionally** - it breaks async tracking.

## State Management

```typescript
// Stateless (server-side, creates new result each time)
import { staticSuite } from 'vest';
const suite = staticSuite((data) => { /* tests */ });

// Stateful (client-side, maintains state between runs)
import { create } from 'vest';
const suite = create((data) => { /* tests */ });

// Manual reset
suite.reset(); // Clears all validation state
suite.resetField('username'); // Clear specific field
```

## Composable Validations

```typescript
// Reusable validation functions
export function emailValidations(value: string | undefined, fieldName: string) {
  test(fieldName, 'Email is required', () => enforce(value).isNotBlank());
  test(fieldName, 'Email format is invalid', () => enforce(value).isEmail());
}

// Use in suite
export const contactSuite = staticSuite((model, field?: string) => {
  only(field);
  emailValidations(model.email, 'email');
});
```

## Common Mistakes

### ❌ Mistake #1: Calling `only()`, `skip()`, or `.done()` Conditionally

```typescript
// ❌ WRONG - Breaks execution tracking!
if (field) {
  only(field); // Conditional call corrupts internal state
}

// ✅ CORRECT - Always call unconditionally
only(field); // Safe: only(undefined) runs all tests
```

### ❌ Mistake #2: Maintaining Separate Touch State

```typescript
// ❌ WRONG - Duplicate state management
const [dirty, setDirty] = useState({});
const showError = dirty.email && result.hasErrors('email');

// ✅ CORRECT - Use Vest's isTested()
const showError = result.isTested('email') && result.hasErrors('email');
```

### ❌ Mistake #3: Not Respecting AbortSignal

```typescript
// ❌ WRONG - Request not cancelled
test('username', 'Taken', async () => {
  await fetch('/check-username');
});

// ✅ CORRECT - Cancellable
test('username', 'Taken', async ({ signal }) => {
  await fetch('/check-username', { signal });
});
```

### ❌ Mistake #4: Missing skipWhen for Expensive Checks

```typescript
// ❌ WRONG - Runs even when email is invalid
test('email', 'Taken', async () => {
  await checkEmailAvailability(data.email);
});

// ✅ CORRECT - Skip until email format is valid
skipWhen(res => res.hasErrors('email'), () => {
  test('email', 'Taken', async ({ signal }) => {
    await checkEmailAvailability(data.email, { signal });
  });
});
```

## Performance Checklist

- Use `only(field)` in every suite to avoid whole-form re-validation on keystrokes
- Guard async calls with `skipWhen` (prerequisite errors) or `omitWhen` (feature toggles)
- Memoize deterministic async work with `test.memo` and provide dependency arrays
- Debounce live feedback fields with `test.debounce` to reduce chatter
- Avoid cloning large data objects; read values immutably inside `test` bodies
- Use `suite.resetField(path)` when replacing nested objects to clear stale errors

## Server-Side Usage

```typescript
import { staticSuite, enforce, test } from 'vest';

const serverSuite = staticSuite((data) => {
  test('email', 'Email is required', () => enforce(data.email).isNotBlank());
});

export async function validatePayload(payload: unknown) {
  const result = serverSuite(payload);
  return { valid: result.isValid(), errors: result.getErrors() };
}
```

`staticSuite` is naturally stateless—no manual `reset()` required between requests. Switch to `mode(Modes.ONE)` when the API should bail after the first error.

## Reference Links

- Vest docs: https://vestjs.dev/docs/
- Accessing results: https://vestjs.dev/docs/writing_your_suite/accessing_the_result
- Dirty checking: https://vestjs.dev/docs/writing_your_suite/dirty_checking#why-istested-is-a-better-alternative
- Execution modes: https://vestjs.dev/docs/writing_your_suite/execution_modes
- skipWhen vs omitWhen: https://vestjs.dev/docs/writing_your_suite/including_and_excluding/skipWhen

> Generate code with accessibility in mind: tie error text to inputs via `aria-describedby`, keep focus management predictable, and expose warnings without blocking keyboard flows.
