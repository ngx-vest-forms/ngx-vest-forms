---
description: 'Best practices and guidelines for using vestjs'
applyTo: '**/*.{ts,html,component.ts}'
---


# Vest.js Validation Best Practices for Angular & ngx-vest-forms
### Execution modes (Vest 5)
- `mode(Modes.EAGER)` (default): stop after first failing test **per field**; best for live validation UX.
- `mode(Modes.ALL)`: collect all failures per field; use on submit to show comprehensive errors.
- `mode(Modes.ONE)`: stop entire suite after first failure anywhere; use for server-side fast-fail.

```typescript
import { create, mode, Modes, only, test } from 'vest';

export const profileSuite = create((data, field) => {
  // Show all errors on submit, but only first error during typing
  if (!field) mode(Modes.ALL);

  only(field);

  test('displayName', 'Display name is required', () => enforce(data.displayName).isNotBlank());
  test('displayName', 'Must be 3+ chars', () => enforce(data.displayName).longerThan(2));
});
```
- **EAGER** (field typing): Show first error immediately, stop testing that field after first failure.
- **ALL** (form submit): Show every error to help users fix all issues at once.
- **ONE** (server validation): Fail fast, no need to process all fields if one is invalid.: Best Practices for Angular & ngx-vest-forms

## Purpose of this guide
- Equip the assistant with crisp guardrails when generating Vest.js + Angular code.
- Focus on behaviours that matter most for ngx-vest-forms: selective validation, touch detection, async hygiene, and accessible feedback.
- Keep examples lightweight; expand in feature docs only when needed.

## Golden rules (follow these first)
- **ALWAYS use `staticSafeSuite` or `createSafeSuite`** from `ngx-vest-forms/core` – they centralize the `only()` call, enforce type-safe field names, and keep suite wiring consistent.
- Only use raw `staticSuite` when the safe wrappers truly can’t be imported; call `only(field ?? false)` (or a similar unconditional call) at the top of the suite instead of wrapping it in an `if`.
- Drive touch state from `result.isTested(field)`—never maintain parallel dirty flags.
- Prefer `skipWhen`/`omitWhen`/`include.when` over ad-hoc conditionals; they compose with Vest's execution engine.
- Keep async validations cancellable via the provided `AbortSignal` and guard expensive work with `skipWhen`.
- Emit warnings with `warn()` only for non-blocking guidance; errors must still block submission.
- Mirror Vest state into Angular signals once, then derive everything else from computed signals.
- Use typed suites so invalid field names fail at compile time.
- When unsure, copy patterns from this file rather than improvising.

## Recommended suite recipe (Safe Wrappers)

> **✅ RECOMMENDED: Use `staticSafeSuite` to keep `only()` wiring consistent**
>
> The safe wrappers from `ngx-vest-forms/core` always invoke `only(field)` for you,
> so there’s no chance of accidentally skipping the call or wrapping it in a conditional.

```typescript
import { staticSafeSuite } from 'ngx-vest-forms/core';
import { enforce, test } from 'vest';

export const contactSuite = staticSafeSuite<ContactModel>((data = {}) => {
  // ✅ No need for: if (field) { only(field); }
  // The wrapper handles it automatically!

  test('email', 'Email is required', () => enforce(data.email).isNotBlank());
  test('email', 'Email format is invalid', () => enforce(data.email).isEmail());
});
```

**Benefits of Safe Wrappers:**
- ✅ Guarantees `only()` is applied unconditionally with the field argument you pass
- ✅ Less boilerplate code
- ✅ Type-safe with generic parameters
- ✅ Drop-in replacement for Vest's functions
- ✅ Zero performance overhead

See [`safe-suite.ts`](../../projects/ngx-vest-forms/core/src/lib/utils/safe-suite.ts) for implementation details.

## Legacy/Manual suite recipe (Fallback Only)

> **⚠️ LEGACY: Only use this pattern if safe wrappers are unavailable**
>
> When using raw `staticSuite`, you must ALWAYS call `only()` unconditionally at the suite's top level.
> Vest relies on consistent execution order tracking - conditional calls corrupt this internal state.

```typescript
import { staticSuite, enforce, only, test } from 'vest';

export const contactSuite = staticSuite((data = {}, field?: string) => {
  // ✅ CORRECT: Call only() unconditionally (passing undefined is safe)
  only(field);

  test('email', 'Email is required', () => enforce(data.email).isNotBlank());
  test('email', 'Email format is invalid', () => enforce(data.email).isEmail());
});
```

**Why this matters:**
- **When `field` is `undefined`**: `only(undefined)` is ignored by Vest → all tests run
- **When `field` is `"email"`**: Only email tests run (performance optimization)
- **Vest tracks execution order internally** - it needs to see the same function calls on every run to maintain state synchronization

**DO NOT DO THIS:**
```typescript
// ❌ WRONG: Calling only() conditionally breaks execution order tracking!
export const contactSuite = staticSuite((data = {}, field?: string) => {
  if (field) {
    only(field); // BUG: Conditional call corrupts Vest's execution order!
  }

  test('email', 'Email is required', () => enforce(data.email).isNotBlank());
});

// ❌ ALSO WRONG: Same problem, different syntax
export const contactSuite = staticSuite((data = {}, field?: string) => {
  field && only(field); // BUG: Still a conditional call!

  test('email', 'Email is required', () => enforce(data.email).isNotBlank());
});
```

**Alternative correct patterns:**
```typescript
// ✅ CORRECT: Unconditional call (recommended)
only(field);

// ✅ CORRECT: Unconditional call with explicit fallback
only(field ?? false);

// ✅ CORRECT: Unconditional call with conditional argument
only(shouldValidateField ? 'email' : false);
```

> **Critical Rule from Vest Docs:** `only()`, `skip()`, and `.done()` must NEVER be called conditionally.
> The function call itself must always execute - only the *arguments* can be conditional.
>
> **Why?** Vest maintains an internal execution order counter that increments on each function call.
> Skipping a call (via `if`) breaks this counter, causing unpredictable validation behavior,
> especially with async tests, state subscriptions, and result memoization.

- Always accept `(data, field?)`; call `only(field)` unconditionally at the top of the suite.
- Return the suite directly from the module; consumers import the constant.

### Type-safe suite generics
```typescript
import { create, only } from 'vest';

type Field = 'email' | 'password';
type Group = 'onboarding' | 'profile';
type Model = { email: string; password: string };

export const authSuite = create<Field, Group, (data: Model, field?: Field) => void>(
  (data, field) => {
    only(field); // TypeScript enforces field must be Field | undefined
    test('password', 'Password is required', () => enforce(data.password).isNotBlank());
  }
);

const { test, group, only: onlyTyped } = authSuite; // Destructured helpers are type-aware
```
- Use suite generics `<FieldName, GroupName, Callback>` for compile-time safety.
- Destructure `test`, `group`, `only` from the suite when you need them outside the suite body.

## Execution & field selection

### `only`, `include`, and groups
- `only(field)` limits evaluation to the active field; call it before any `test` statements.
- `only.group(step)` scopes validation to a wizard step without rewriting tests.
- `include('confirmPassword').when('password')` revalidates dependents whenever the trigger field runs.
- Prefer the functional `when(result => …)` overload when the dependency is conditional (e.g., only re-run confirm password once the password is valid).

### Execution modes (Vest 5)
- `mode(Modes.EAGER)` (default): stop after the first failing test **per field**; ideal for most UX.
- `mode(Modes.ALL)`: capture every failure per field; enable on submit to show all guidance at once.
- `mode(Modes.ONE)`: stop the entire suite after the first failure; use for server-side “any error blocks” checks.
```typescript
import { create, mode, Modes, only, test } from 'vest';

export const profileSuite = create((data, field) => {
  if (!field) {
    mode(Modes.ALL);
  }
  only(field ?? false);

  test('displayName', 'Display name is required', () => enforce(data.displayName).isNotBlank());
});
```

## Conditional helpers

### `skipWhen` vs `omitWhen`
- `skipWhen(condition, body)` prevents tests from running **but fields still count toward `isValid()`**. Use it to postpone expensive work until prerequisites pass.
- `omitWhen(condition, body)` removes tests from the result entirely while the condition holds. Use it for feature toggles or optional sections that should not block validity.
```typescript
skipWhen((result) => result.hasErrors('email'), () => {
  test('email', 'Domain is blacklisted', async () => checkDomain(data.email));
});

omitWhen(!data.useNewAddress, () => {
  test('address.line1', 'Street is required', () => enforce(data.address?.line1).isNotBlank());
});
```

### Optional fields
- Invoke `optional('field')`, `optional(['fieldA', 'fieldB'])`, or `optional({ field: valueOrGetter })` inside the suite.
- Vest omits optional tests when the supplied value is `'' | null | undefined` or when the callback returns `true`.
- Combine with `warn()` for “nice to have” guidance that should not block submission.
```typescript
optional({
  vatNumber: () => data.businessType !== 'corporation',
  alternateEmail: data.altEmail,
});

test('alternateEmail', 'Format is invalid', () => enforce(data.altEmail).isEmail());
```

### Dynamic collections with `each`
- Use `each(array, (item, index) => { test(...) })` to validate array items without losing async memoisation.
- Pass a stable key (e.g., `item.id`) as the fourth argument to keep Vest state aligned with reordered lists.

## Async validation patterns

### Async validation with cancellation
```typescript
import { fromEvent, lastValueFrom, takeUntil } from 'rxjs';

skipWhen((res) => res.hasErrors('username'), () => {
  test('username', 'Username already exists', async ({ signal }) => {
    // Vest provides { signal } automatically to async tests
    await lastValueFrom(
      userService.checkUsername(data.username!).pipe(takeUntil(fromEvent(signal, 'abort')))
    ).then(
      () => Promise.reject(), // Username exists = fail
      () => Promise.resolve()  // Username free = pass
    );
  });
});
```
- **Vest automatically passes `{ signal }` to async test callbacks** for cancellation support.
- Always respect the `signal` - cancel observables with `takeUntil(fromEvent(signal, 'abort'))` or fetch with `{ signal }`.
- Wrap expensive checks with `skipWhen` to avoid running when prerequisite validations fail.
- Cache deterministic async results: `test.memo(name, message, fn, [deps])` - re-runs only when deps change.
- Debounce live-typing fields: `test.debounce(name, message, fn, waitMs)` - waits for user to stop typing.

### Warning-only feedback
```typescript
test('password', 'Password strength: add a symbol for extra security', () => {
  warn();
  enforce(data.password).matches(/[^A-Za-z0-9]/);
});
```
- Call `warn()` synchronously at the start of the test; async placements will be ignored.

## Error reporting & touch detection

```typescript
const suiteState = signal(contactSuite.get());

contactSuite.subscribe((result) => suiteState.set(result));

const emailErrors = computed(() => suiteState().getErrors('email'));
const showEmailErrors = computed(() => suiteState().isTested('email') && suiteState().hasErrors('email'));
```

### Three ways to access suite results
```typescript
// 1. Direct result (from suite call)
const result = suite(data);
result.hasErrors();

// 2. Suite method (latest state)
suite.hasErrors();

// 3. suite.get() (latest state, same as #2)
suite.get().hasErrors();
```
- All three access the same result data; choose based on context.
- **Subscribe** to track state changes: `suite.subscribe(res => updateState(res))`.
- Use `isTested(field)` for touch detection - never maintain separate dirty flags.
- React to async completion: `result.done(callback)` or `result.done(fieldName, callback)`.
- **Never call `.done()` conditionally** - it breaks async tracking.

## Angular integration patterns

### Basic standalone component
```typescript
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { ngxVestForm } from 'ngx-vest-forms/core';
import { NgxVestFormField } from 'ngx-vest-forms/form-field';
import { contactSuite } from './contact.suite';

@Component({
  selector: 'app-contact-form',

  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ngxVestForm, NgxVestFormField],
  template: `
    <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
      <ngx-vest-form-field>
        <label for="email">Email</label>
        <input id="email" name="email" type="email" [ngModel]="model().email" />
        @if (emailErrors().length && showEmailErrors()) {
          <p class="text-destructive" role="alert">{{ emailErrors()[0] }}</p>
        }
      </ngx-vest-form-field>
    </form>
  `,
})
export class ContactFormComponent {
  protected readonly model = signal({ email: '' });
  protected readonly suite = contactSuite;

  private readonly result = signal(contactSuite.get());
  private readonly stop = contactSuite.subscribe((res) => this.result.set(res));

  protected readonly emailErrors = computed(() => this.result().getErrors('email'));
  protected readonly showEmailErrors = computed(() => this.result().isTested('email'));
}
```
- Always connect template state through computed signals derived from a single `suite.subscribe`.
- Use `[validationConfig]` to declare dependencies (e.g., `{ password: ['confirmPassword'] }`).
- Enable `[validateRootForm]="true"` plus `test(ROOT_FORM, ...)` for global checks.

### Arrays and dynamic controls
- Wrap Vest accessors in helper methods (`vestForm.field('phones.0.number')`) to manage add/remove flows.
- Re-run validation after array mutations so Vest updates memoised entries (`suite.validate('phones')`).

## Performance checklist
- `only(field)` in every suite to avoid whole-form re-validation on keystrokes.
- Guard async calls with `skipWhen` (prerequisite errors) or `omitWhen` (feature toggles).
- Memoise deterministic async work with `test.memo` and provide dependency arrays.
- Debounce live feedback fields with `test.debounce` to reduce chatter.
- Avoid cloning large data objects; read values immutably inside `test` bodies.
- Use `suite.resetField(path)` when replacing nested objects to clear stale errors.

## Server-side usage
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
- `staticSuite` is naturally stateless—no manual `reset()` required between requests.
- Switch to `mode(Modes.ONE)` when the API should bail after the first error.

## Testing guidance
- Prefer vest-driven integration tests: render the component, interact with inputs, and assert on visible errors.
- Use `suite.get()` or the subscribed result to assert `isValid`, `isPending`, and specific error strings.
- Mock async helpers with resolved/rejected promises and advance fake timers when debouncing.
- For libraries, provide fixture suites that showcase `optional`, `include`, `skipWhen`, and `warn` so consumers can copy known-good patterns.

## Common Mistakes to Avoid

### ❌ Mistake #1: Calling `only()`, `skip()`, or `.done()` conditionally

```typescript
// ❌ WRONG - Conditional calls break Vest's execution tracking!
export const suite = staticSuite((data, field) => {
  if (field) {
    only(field); // BUG: Conditional call breaks state tracking!
  }
  test('email', 'Required', () => enforce(data.email).isNotEmpty());
});

// ✅ CORRECT - Always call unconditionally, pass conditional values as args
export const suite = staticSuite((data, field) => {
  only(field); // Safe: only(undefined) is ignored, runs all tests
  test('email', 'Required', () => enforce(data.email).isNotEmpty());
});

// ✅ ALSO CORRECT - Conditional arguments, not conditional calls
export const suite = staticSuite((data, field) => {
  only(field ?? false); // Explicit: false tells Vest to run all tests
  skip(shouldSkipPromo ? 'promo' : false); // Conditional value, not call
  test('email', 'Required', () => enforce(data.email).isNotEmpty());
});
```

**Impact:** Conditional calls corrupt Vest's internal execution order tracking, causing unpredictable validation behavior.

### ❌ Mistake #2: Maintaining separate "dirty" or "touched" state

```typescript
// ❌ WRONG - Duplicate state management
const [dirty, setDirty] = useState({});
const showError = dirty.email && result.hasErrors('email');

// ✅ CORRECT - Use Vest's built-in isTested()
const showError = result.isTested('email') && result.hasErrors('email');
```

### ❌ Mistake #3: Calling `.done()` conditionally

```typescript
// ❌ WRONG - Conditional .done() breaks async tracking
if (field === 'username') {
  result.done(() => {/* ... */});
}

// ✅ CORRECT - Always call .done(), perform checks inside callback
result.done(() => {
  if (field === 'username') {
    /* ... */
  }
});
```

**Impact:** Missed callbacks when async tests complete, especially with field-level validation.

### ❌ Mistake #4: Not respecting AbortSignal in async tests

```typescript
// ❌ WRONG - Request not cancelled when field changes
test('username', 'Taken', async () => {
  await fetch('/check-username');
});

// ✅ CORRECT - Cancel on field change
test('username', 'Taken', async ({ signal }) => {
  await fetch('/check-username', { signal });
});
```

### ❌ Mistake #5: Not using skipWhen for expensive async validations

```typescript
// ❌ WRONG - Expensive check runs even when email is invalid
test('email', 'Taken', async () => {
  await checkEmailAvailability(data.email);
});

// ✅ CORRECT - Skip expensive check until email format is valid
skipWhen((result) => result.hasErrors('email'), () => {
  test('email', 'Taken', async ({ signal }) => {
    await checkEmailAvailability(data.email, { signal });
  });
});
```

## Reference links
- Vest docs: https://vestjs.dev/docs/
- Accessing the result: https://vestjs.dev/docs/writing_your_suite/accessing_the_result
- Dirty checking guidance: https://vestjs.dev/docs/writing_your_suite/dirty_checking#why-istested-is-a-better-alternative
- Execution modes: https://vestjs.dev/docs/writing_your_suite/execution_modes
- Optional fields: https://vestjs.dev/docs/writing_your_suite/optional_fields
- Include helpers: https://vestjs.dev/docs/writing_your_suite/including_and_excluding/include
- skipWhen vs omitWhen: https://vestjs.dev/docs/writing_your_suite/including_and_excluding/skipWhen

> Generate code with accessibility in mind: tie error text to inputs via `aria-describedby`, keep focus management predictable, and expose warnings without blocking keyboard flows.
