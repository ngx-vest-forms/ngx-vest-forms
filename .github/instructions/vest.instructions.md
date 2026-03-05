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
- **Performance Optimized**: Selective validation with `suite.only(field).run()` at the call site
- **Asynchronous First**: Built-in support for async validations with cancellation
- **Composable**: Modular and reusable validation logic

## Purpose of this Guide

Equip you with crisp guardrails when generating Vest.js code, focusing on: selective validation, touch detection, async hygiene, and accessible feedback.

## Golden Rules (Follow These First)

1. **Suite callbacks receive only the model** — no `field` parameter or `only()` call inside the callback
2. **Field focus is handled at the call site** via `suite.only(field).run(model)` — not inside the suite
3. **`suite.run()` is stateful** — it accumulates results across runs. Call `suite.reset()` on form reset
4. Drive touch state from `result.isTested(field)` — never maintain parallel dirty flags
5. Prefer `skipWhen`/`omitWhen`/`include.when` over ad-hoc conditionals
6. Keep async validations cancellable via `AbortSignal` and guard expensive work with `skipWhen`
7. Use `warn()` only for non-blocking guidance; call it synchronously at test start
8. Use typed suites so invalid field names fail at compile time
9. When unsure, copy patterns from this file

## Recommended Suite Pattern

**Vest 6 handles field focus at the call site via `suite.only(field).run(model)`. Suite callbacks only receive the model — no `field` parameter or `only()` call needed.**

**✅ CORRECT: Vest 6 pattern — model-only callback**

```typescript
import { create, test, enforce } from 'vest';

export const contactSuite = create((data = {}) => {
  test('email', 'Email is required', () => enforce(data.email).isNotBlank());
  test('email', 'Email format is invalid', () => enforce(data.email).isEmail());
  test('username', 'Username is required', () => enforce(data.username).isNotBlank());
});

// Call sites:
contactSuite.only('email').run(data);   // Run only email tests (field-level)
contactSuite.run(data);                  // Run all tests (e.g. on submit)
contactSuite.reset();                    // Reset accumulated state (e.g. on form reset)
```

**Why this matters:**
- `suite.only('email').run(data)` runs only email tests (performance optimization)
- `suite.run(data)` runs all tests (full validation, e.g. on submit)
- `.run()` is **stateful** — results accumulate across runs. Call `suite.reset()` on form reset
- `suite.runStatic(data)` is available for **stateless** one-off use (server-side validation)

**❌ WRONG: Old v5 pattern with field parameter and `only()` inside callback**

```typescript
// ❌ WRONG: Vest 5 pattern — do not use with Vest 6
import { create, only, test, enforce } from 'vest';

export const contactSuite = create((data = {}, field?: string) => {
  only(field); // ❌ Not needed in Vest 6 — handle at the call site
  test('email', 'Email is required', () => enforce(data.email).isNotBlank());
});
```

## TypeScript Support

```typescript
import { create } from 'vest';

type FieldName = 'email' | 'password';
type GroupName = 'signIn' | 'signUp';
type Model = { email: string; password: string };

export const authSuite = create<FieldName, GroupName, (data: Model) => void>(
  (data) => {
    test('password', 'Password is required', () => enforce(data.password).isNotBlank());
  }
);

// Field focus at call site:
authSuite.only('password').run(data); // TypeScript enforces field must be FieldName

// Destructured helpers are type-aware
const { test, group } = authSuite;
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

#### Memoize Expensive Tests with `memo`

Use `memo` from `vest/memo` to cache blocks of tests. If the dependency array hasn't changed since the last run, the entire block is skipped and previous results are restored:

```typescript
import { create, test, enforce, skipWhen } from 'vest';
import { memo } from 'vest/memo';

const suite = create((data) => {
  test('username', 'Username is required', () => {
    enforce(data.username).isNotBlank();
  });

  // Memoize expensive async check — only re-runs when username changes
  memo(() => {
    skipWhen(res => res.hasErrors('username'), () => {
      test('username', 'Username is taken', async ({ signal }) => {
        await checkAvailability(data.username, { signal });
      });
    });
  }, [data.username]);

  // Memoize an entire group of related validations
  memo(() => {
    test('address.street', 'Required', () => enforce(data.address?.street).isNotBlank());
    test('address.city', 'Required', () => enforce(data.address?.city).isNotBlank());
  }, [data.address]);
});
```

**When to use `memo`:**
- Async validations with API calls (username/email availability checks)
- Expensive validations that depend on specific field values
- Groups of related validations that share the same dependencies

### Advanced Focus Control with `suite.focus()`

`suite.only(field)` is shorthand for `suite.focus({ only: field })`. For more complex scenarios, use `focus()` directly:

```typescript
// Skip a specific field
suite.focus({ skip: 'password' }).run(data);

// Only validate a specific group
suite.focus({ onlyGroup: 'step1' }).run(data);

// Skip entire groups
suite.focus({ skipGroup: ['step2', 'step3'] }).run(data);

// Combine field and group focus
suite.focus({ only: 'username', skipGroup: 'billing' }).run(data);
```

**In ngx-vest-forms**, `suite.only(field).run(model)` is used automatically for field-level validation. Use `focus()` for custom scenarios like multi-step wizard forms.

## Execution Modes

```typescript
import { create, mode, Modes } from 'vest';

const suite = create((data) => {
  test('displayName', 'Required', () => enforce(data.displayName).isNotBlank());
  test('displayName', 'Min 3 chars', () => enforce(data.displayName).longerThan(2));
});

// Switch mode at call site:
mode(Modes.ALL); // Show all errors on submit
suite.run(data);
```

- **EAGER** (default): Stop after first failure per field - best for live validation
- **ALL**: Collect all failures per field - use on submit
- **ONE**: Stop entire suite after first failure - server-side fast-fail

## Grouped Validations

```typescript
import { group } from 'vest';

const suite = create((data) => {
  group('personal_info', () => {
    test('firstName', 'First name is required', () => enforce(data.firstName).isNotBlank());
  });

  group('contact_info', () => {
    test('email', 'Email is required', () => enforce(data.email).isNotBlank());
  });
});

suite.only.group('personal_info').run(formData); // Only validate personal info step
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
// 1. Direct result (from suite.run() call)
const result = suite.run(data);
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

In Vest 6, `SuiteResult` is a **thenable** (has a `.then()` method). Use `await` or `.then()` to handle async completion:

```typescript
// Using await
const result = suite.run(data);
await result; // Resolves when all async tests complete
if (result.isValid()) submitForm();

// Using .then()
suite.run(data).then((res) => {
  if (res.isValid()) submitForm();
});
```

**Note:** `.then()` always defers to a microtask, even for fully synchronous suites. Check `result.isPending()` to determine if async tests are still running.

## State Management

```typescript
import { create } from 'vest';
const suite = create((data) => { /* tests */ });

// Stateful execution (client-side, accumulates state between runs)
suite.run(data);

// Field-focused stateful execution (run only specific field tests)
suite.only('username').run(data);

// Stateless execution (server-side, fresh result each call)
suite.runStatic(data);

// Manual reset (for stateful suites — call on form reset)
suite.reset(); // Clears all validation state
suite.resetField('username'); // Clear specific field
```

> **Important**: `suite.run()` is stateful — results accumulate across runs. Always call `suite.reset()` when resetting a form to clear stale validation state.

## Composable Validations

```typescript
// Reusable validation functions
export function emailValidations(value: string | undefined, fieldName: string) {
  test(fieldName, 'Email is required', () => enforce(value).isNotBlank());
  test(fieldName, 'Email format is invalid', () => enforce(value).isEmail());
}

// Use in suite
export const contactSuite = create((model) => {
  emailValidations(model.email, 'email');
});
```

## Common Mistakes

### ❌ Mistake #1: Using Old v5 Pattern with `only()` Inside Callback

```typescript
// ❌ WRONG - Vest 5 pattern, not recommended in Vest 6
import { create, only, test, enforce } from 'vest';

export const suite = create((data, field?) => {
  only(field); // ❌ Not needed — Vest 6 handles focus at the call site
  test('email', 'Required', () => enforce(data.email).isNotBlank());
});

// ✅ CORRECT - Vest 6 pattern
import { create, test, enforce } from 'vest';

export const suite = create((data) => {
  test('email', 'Required', () => enforce(data.email).isNotBlank());
});

// Focus at call site:
suite.only('email').run(data);
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

- Use `suite.only(field).run(model)` to avoid whole-form re-validation on keystrokes
- Guard async calls with `skipWhen` (prerequisite errors) or `omitWhen` (feature toggles)
- Memoize expensive async work with `memo` from `vest/memo` and provide dependency arrays
- Use `skipWhen` to avoid running async tests until prerequisite validations pass
- Avoid cloning large data objects; read values immutably inside `test` bodies
- Use `suite.resetField(path)` when replacing nested objects to clear stale errors
- Call `suite.reset()` on form reset to clear accumulated stateful results

## Server-Side Usage

```typescript
import { create, enforce, test } from 'vest';

const serverSuite = create((data) => {
  test('email', 'Email is required', () => enforce(data.email).isNotBlank());
});

export async function validatePayload(payload: unknown) {
  const result = serverSuite.runStatic(payload);
  return { valid: result.isValid(), errors: result.getErrors() };
}
```

Use `suite.runStatic(payload)` for stateless execution—each call produces a fresh result without accumulating state. Note that `.only()` chaining is not available with `.runStatic()`. Switch to `mode(Modes.ONE)` when the API should bail after the first error.

## Reference Links

- Vest docs: https://vestjs.dev/docs/
- Accessing results: https://vestjs.dev/docs/writing_your_suite/accessing_the_result
- Dirty checking: https://vestjs.dev/docs/writing_your_suite/dirty_checking#why-istested-is-a-better-alternative
- Execution modes: https://vestjs.dev/docs/writing_your_suite/execution_modes
- skipWhen vs omitWhen: https://vestjs.dev/docs/writing_your_suite/including_and_excluding/skipWhen

> Generate code with accessibility in mind: tie error text to inputs via `aria-describedby`, keep focus management predictable, and expose warnings without blocking keyboard flows.
