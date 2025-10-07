---
description: 'Best practices and guidelines for using vestjs'
applyTo: '**/*.{ts,html,component.ts}'
---


# Vest.js Validation Framework: Best Practices for Angular & ngx-vest-forms

## Purpose of this guide
- Equip the assistant with crisp guardrails when generating Vest.js + Angular code.
- Focus on behaviours that matter most for ngx-vest-forms: selective validation, touch detection, async hygiene, and accessible feedback.
- Keep examples lightweight; expand in feature docs only when needed.

## Golden rules (follow these first)
- **ALWAYS use `staticSafeSuite` or `createSafeSuite`** from `ngx-vest-forms/core` - they prevent the `only(undefined)` bug automatically.
- Only use raw `staticSuite` + manual `only(field)` guard if safe wrappers are unavailable; always guard with `if (field) { only(field); }`.
- Drive touch state from `result.isTested(field)`—never maintain parallel dirty flags.
- Prefer `skipWhen`/`omitWhen`/`include.when` over ad-hoc conditionals; they compose with Vest's execution engine.
- Keep async validations cancellable via the provided `AbortSignal` and guard expensive work with `skipWhen`.
- Emit warnings with `warn()` only for non-blocking guidance; errors must still block submission.
- Mirror Vest state into Angular signals once, then derive everything else from computed signals.
- Use typed suites so invalid field names fail at compile time.
- When unsure, copy patterns from this file rather than improvising.

## Recommended suite recipe (Safe Wrappers)

> **✅ RECOMMENDED: Use `staticSafeSuite` to prevent the `only(undefined)` bug automatically**
>
> The safe wrappers from `ngx-vest-forms/core` handle the `if (field) { only(field); }` guard pattern for you,
> eliminating the most common validation bug where calling `only(undefined)` causes ZERO tests to run.

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
- ✅ Prevents the `only(undefined)` bug (runs ZERO tests)
- ✅ Less boilerplate code
- ✅ Type-safe with generic parameters
- ✅ Drop-in replacement for Vest's functions
- ✅ Zero performance overhead

See [`safe-suite.ts`](../../projects/ngx-vest-forms/core/src/lib/utils/safe-suite.ts) for implementation details.

## Legacy/Manual suite recipe (Fallback Only)

> **⚠️ LEGACY: Only use this pattern if safe wrappers are unavailable**
>
> Manual `only(field)` requires careful guarding to prevent the bug where calling `only(undefined)`
> tells Vest to run **ZERO tests**, breaking form validation.

```typescript
import { staticSuite, enforce, only, test } from 'vest';

export const contactSuite = staticSuite((data = {}, field?: string) => {
  // ✅ CORRECT: Guard with if statement
  if (field) {
    only(field);
  }

  test('email', 'Email is required', () => enforce(data.email).isNotBlank());
  test('email', 'Email format is invalid', () => enforce(data.email).isEmail());
});
```

**Why this matters:**
- **When `field` is `undefined`** (initial validation, form-level validation): All tests run, showing all errors
- **When `field` is `"email"`** (field-level validation): Only email tests run (performance optimization)
- **When you call `only(undefined)`** (bug): Vest runs NO tests at all, breaking validation

**DO NOT DO THIS:**
```typescript
// ❌ WRONG: Missing if guard - breaks when field is undefined!
export const contactSuite = staticSuite((data = {}, field?: string) => {
  only(field); // BUG: When field is undefined, NO tests will run!

  test('email', 'Email is required', () => enforce(data.email).isNotBlank());
});
```

- Always accept `(data, field?)`; treat `field` as optional and guard with `if (field) { only(field); }`.
- Return the suite directly from the module; consumers import the constant.

### Type-safe helpers
```typescript
import { create } from 'vest';

type Field = 'email' | 'password';
type Group = 'onboarding' | 'profile';
type Model = { email: string; password: string };

export const authSuite = create<Field, Group, (data: Model) => void>((data, field) => {
  if (field) {
    only(field);
  }
  test('password', 'Password is required', () => enforce(data.password).isNotBlank());
});

const { test, group, only } = authSuite; // all helpers now honour the Field/Group union
```
- Destructure helpers when you need type-aware `test`, `group`, or `only` outside the suite body.

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
  if (field) {
    only(field);
  }

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

### Guarded async validation
```typescript
import { fromEvent, lastValueFrom, takeUntil } from 'rxjs';

skipWhen((res) => res.hasErrors('username'), () => {
  test('username', 'Username already exists', async ({ signal }) => {
    await lastValueFrom(
      userService.checkUsername(data.username!).pipe(takeUntil(fromEvent(signal, 'abort')))
    ).then(
      () => Promise.reject(),
      () => Promise.resolve()
    );
  });
});
```
- Always respect the provided `AbortSignal`; abortable observables or fetch requests must call `takeUntil`/`signal`.
- Wrap slow validations with `skipWhen` or `omitWhen` to avoid unnecessary network calls.
- Use `test.memo(name, message, fn, [deps])` to cache deterministic async results.
- Apply `test.debounce(name, message, fn, wait)` for live-search fields that should wait for idle typing.

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
- Expose read-only signals for value, errors, warnings, `isPending`, and `isValid` on demand.
- Prefer computed selectors instead of storing plain objects in component state.
- When submitting, call `suiteState().done(callback)` to react to async completion.

## Angular integration patterns

### Basic standalone component
```typescript
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { ngxVestForm } from 'ngx-vest-forms/core';
import { NgxControlWrapper } from 'ngx-vest-forms/control-wrapper';
import { contactSuite } from './contact.suite';

@Component({
  selector: 'app-contact-form',

  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ngxVestForm, NgxControlWrapper],
  template: `
    <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
      <ngx-control-wrapper>
        <label for="email">Email</label>
        <input id="email" name="email" type="email" [ngModel]="model().email" />
        @if (emailErrors().length && showEmailErrors()) {
          <p class="text-destructive" role="alert">{{ emailErrors()[0] }}</p>
        }
      </ngx-control-wrapper>
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

### ❌ Mistake #1: Calling `only(field)` without checking if field is undefined

```typescript
// ❌ WRONG - This breaks form validation!
export const suite = staticSuite((data, field) => {
  only(field); // When field is undefined, NO tests run!
  test('email', 'Required', () => enforce(data.email).isNotEmpty());
});

// ✅ CORRECT - Always guard with if statement
export const suite = staticSuite((data, field) => {
  if (field) {
    only(field);
  }
  test('email', 'Required', () => enforce(data.email).isNotEmpty());
});
```

**Impact:** Only 1 error shows at a time; initial form load shows no errors even when multiple fields are invalid.

### ❌ Mistake #2: Maintaining separate "dirty" or "touched" state

```typescript
// ❌ WRONG - Duplicate state management
const [dirty, setDirty] = useState({});
const showError = dirty.email && result.hasErrors('email');

// ✅ CORRECT - Use Vest's built-in isTested()
const showError = result.isTested('email') && result.hasErrors('email');
```

### ❌ Mistake #3: Not respecting AbortSignal in async tests

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

### ❌ Mistake #4: Not using skipWhen for expensive async validations

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
