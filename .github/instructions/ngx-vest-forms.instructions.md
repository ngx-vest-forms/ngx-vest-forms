---
description: 'Best practices and guidelines for using ngx-vest-forms V2 with Angular 20+ signals and Vest.js validation'
applyTo: '**/*.{ts,html,component.ts}'
---

# ngx-vest-forms V2 Instructions

## Priority Guidelines

When generating code for ngx-vest-forms V2:

1. **Vest-First Architecture**: Vest.js is the single source of truth for validation state
2. **Framework Agnostic Core**: Use `createVestForm` from `ngx-vest-forms/core` without Angular dependencies
3. **Native Form Controls**: Use `[value]`/`(input)` bindings instead of `ngModel` or `[(ngModel)]`
4. **Enhanced Field Signals**: Leverage automatic proxy-based field access (`form.email()`, `form.setEmail()`)
5. **Angular 20+ Patterns**: Use standalone components, signals, and modern control flow (`@if`, `@for`)

## Core API Pattern

### 1. Define Validation Suite (Recommended: Use staticSafeSuite)

> **✅ RECOMMENDED: Use `staticSafeSuite` to prevent the `only(undefined)` bug automatically**
>
> The safe wrapper from `ngx-vest-forms/core` handles the `if (field) { only(field); }` guard pattern for you,
> eliminating the most common validation bug where calling `only(undefined)` causes ZERO tests to run.
>
> **If you see**: Only 1 validation error displays at a time → You forgot the guard or used unsafe pattern!

```typescript
// user.validations.ts
import { staticSafeSuite } from 'ngx-vest-forms/core';
import { enforce, test, include, skipWhen } from 'vest';

export interface UserModel {
  email: string;
  password: string;
  confirmPassword?: string;
}

export const userValidationSuite = staticSafeSuite<UserModel>((data = {}) => {
  // ✅ No need for: if (field) { only(field); }
  // The wrapper handles it automatically!

  test('email', 'Email is required', () => {
    enforce(data.email).isNotEmpty();
  });

  test('email', 'Email format is invalid', () => {
    enforce(data.email).isEmail();
  });

  test('password', 'Password must be at least 8 characters', () => {
    enforce(data.password).longerThan(7);
  });

  // Cross-field validation
  include('confirmPassword').when('password');
  test('confirmPassword', 'Passwords must match', () => {
    enforce(data.confirmPassword).equals(data.password);
  });

  // Async validation with skipWhen
  skipWhen((result) => result.hasErrors('email'), () => {
    test('email', 'Email is already taken', async ({ signal }) => {
      const response = await fetch(`/api/check-email/${data.email}`, { signal });
      if (!response.ok) throw new Error('Email taken');
    });
  });
});
```

### 2. Create Form Component (Standalone, Signals-First)

```typescript
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { createVestForm } from 'ngx-vest-forms/core';
import { userValidationSuite, type UserModel } from './user.validations';

@Component({
  selector: 'app-user-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form novalidate (ngSubmit)="onSubmit()" [attr.aria-busy]="form.pending() || null">
      <!-- Email Field -->
      <div class="field">
        <label for="email">Email *</label>
        <input
          id="email"
          type="email"
          [value]="form.email() ?? ''"
          (input)="form.setEmail($event)"
          [attr.aria-invalid]="form.emailShowErrors() && !form.emailValid()"
          [attr.aria-describedby]="form.emailShowErrors() ? 'email-error' : null"
        />
        @if (form.emailShowErrors() && form.emailErrors().length) {
          <p id="email-error" role="alert">{{ form.emailErrors()[0] }}</p>
        }
      </div>

      <!-- Password Field -->
      <div class="field">
        <label for="password">Password *</label>
        <input
          id="password"
          type="password"
          [value]="form.password() ?? ''"
          (input)="form.setPassword($event)"
          [attr.aria-invalid]="form.passwordShowErrors() && !form.passwordValid()"
          [attr.aria-describedby]="form.passwordShowErrors() ? 'password-error' : null"
        />
        @if (form.passwordShowErrors() && form.passwordErrors().length) {
          <p id="password-error" role="alert">{{ form.passwordErrors()[0] }}</p>
        }
      </div>

      <!-- Submit Button -->
      <button type="submit" [disabled]="form.pending()">
        @if (form.pending()) {
          Validating...
        } @else {
          Submit
        }
      </button>
    </form>
  `,
})
export class UserFormComponent {
  // Create form with signal model (RECOMMENDED)
  form = createVestForm(
    userValidationSuite,
    signal<UserModel>({ email: '', password: '', confirmPassword: '' }),
    {
      errorStrategy: 'on-touch', // immediate | on-touch | on-submit | manual
    }
  );

  onSubmit = async () => {
    try {
      await this.form.submit();
      console.log('Form valid:', this.form.model());
    } catch (error) {
      console.log('Form invalid:', this.form.errors());
    }
  };

  ngOnDestroy() {
    this.form.dispose(); // Clean up subscriptions (only needed for 'create' suites)
  }
}
```

## Enhanced Field Signals API

The `createVestForm` automatically generates proxy-based field access:

```typescript
// Automatic field signals (camelCase conversion)
form.email();           // Signal<string> - field value
form.emailValid();      // Signal<boolean> - field validity
form.emailErrors();     // Signal<string[]> - field errors
form.emailTouched();    // Signal<boolean> - field tested state
form.emailPending();    // Signal<boolean> - async validation pending
form.emailShowErrors(); // Signal<boolean> - should show errors based on strategy

// Field setters (handle DOM events or direct values)
form.setEmail($event);  // Accepts Event or string
form.setEmail('user@example.com');
form.touchEmail();      // Mark field as touched
form.resetEmail();      // Reset to initial value

// Explicit field API (for complex paths)
const emailField = form.field('email');
emailField.value();     // Same as form.email()
emailField.set('user@example.com');
```

## Input Type Binding Patterns

```typescript
// Text/Email/URL inputs
[value]="form.fieldName() ?? ''"
(input)="form.setFieldName($event)"

// Number inputs
[value]="form.age() ?? ''"
(input)="form.setAge($event)" // Auto-converts to number

// Checkbox inputs
[checked]="form.agreed() === true"
(change)="form.setAgreed($event)" // Maps to checked boolean

// Radio buttons
[checked]="form.gender() === 'male'"
(change)="form.setGender($event)" // Uses value attribute

// Select dropdowns
[value]="form.country() ?? ''"
(change)="form.setCountry($event)"

// Multi-select
[value]="form.languages()"
(change)="form.setLanguages($event)" // Returns array
```

## Form State Management

```typescript
// Form-level state signals
form.valid();        // Signal<boolean> - overall validity
form.pending();      // Signal<boolean> - any async validation pending
form.errors();       // Signal<Record<string, string[]>> - all field errors
form.touched();      // Signal<boolean> - any field touched
form.hasSubmitted(); // Signal<boolean> - submit() was called

// Form operations
await form.submit(); // Validates all, throws if invalid
form.reset();        // Reset all fields to initial values
form.validate();     // Re-run all validations
form.validate('email'); // Re-run specific field validation
form.dispose();      // Clean up subscriptions (always call in ngOnDestroy)
```

## Error Display Strategies

```typescript
// Configure error display timing
createVestForm(suite, model, {
  errorStrategy: 'on-touch' // immediate | on-touch | on-submit | manual
});

// Manual strategy example
const showEmailErrors = computed(() =>
  form.emailTouched() && form.emailErrors().length > 0
);
```

## Vest.js Best Practices

### Required Patterns
- Use `staticSuite` for all validation suites (server-side safe)
- Call `only(field)` at the start of every suite for performance
- Use `skipWhen` to gate expensive async validations
- Use `include().when()` for cross-field dependencies
- Respect `AbortSignal` in async tests

### Conditional Validation
```typescript
// Skip validation until prerequisites pass
skipWhen((result) => result.hasErrors('email'), () => {
  test('email', 'Email taken', async ({ signal }) => {
    // Expensive async check
  });
});

// Omit validation entirely when condition is true
omitWhen(!data.needsShipping, () => {
  test('address', 'Address required', () => {
    enforce(data.address).isNotEmpty();
  });
});

// Warning-only tests (don't block submission)
test('password', 'Consider using special characters', () => {
  warn(); // This won't prevent form submission
  enforce(data.password).matches(/[!@#$%^&*]/);
});
```

## Package Structure (Optional Integrations)

```typescript
// Core package (always required) - ~3KB
import { createVestForm } from 'ngx-vest-forms/core';

// Control wrapper (optional) - ~2KB
import { NgxControlWrapper } from 'ngx-vest-forms/control-wrapper';

// NgForm sync (optional) - ~2KB - AVOID when possible
import { NgxVestSyncDirective } from 'ngx-vest-forms/ngform-sync';

// Schema adapters (optional) - ~1KB each
import { zodAdapter } from 'ngx-vest-forms/schemas/zod';
```

## Migration from V1/NgModel

❌ **AVOID: V1 Pattern**
```typescript
// DON'T: Use ngxVestForm directive or ngModel
<form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
  <input name="email" [(ngModel)]="model.email" />
</form>
```

✅ **PREFER: V2 Pattern**
```typescript
// DO: Use createVestForm with native inputs
form = createVestForm(suite, signal(model));

<form>
  <input [value]="form.email()" (input)="form.setEmail($event)" />
</form>
```

## Required Checklist

- [ ] Use `staticSuite` for all validation suites (recommended)
- [ ] Call `only(field)` at the start of suites
- [ ] Create forms with `signal()` models for reactivity
- [ ] Use native `[value]`/`(input)` instead of `ngModel`
- [ ] Include `?? ''` for potentially undefined string values
- [ ] Add proper ARIA attributes (`aria-invalid`, `aria-describedby`)
- [ ] Use `@if` control flow for error display
- [ ] Call `form.dispose()` in `ngOnDestroy` (only needed for `create` suites, harmless for `staticSuite`)
- [ ] Use `skipWhen` for expensive async validations
- [ ] Handle `AbortSignal` in async tests"onSubmit()"
  class="form-grid"
  [attr.aria-busy]="form.pending() || null"
>
  <div class="form-control">
    <label for="email">Email <span aria-hidden="true">*</span></label>
    <input
      id="email"
      type="email"
      autocomplete="email"
      [value]="form.email() ?? ''"
      (input)="form.setEmail($event)"
      [attr.aria-invalid]="form.emailShowErrors() && !form.emailValid()"
      [attr.aria-describedby]="form.emailShowErrors() ? 'email-error' : null"
    />
    @if (form.emailShowErrors() && form.emailErrors().length) {
      <p id="email-error" role="alert">{{ form.emailErrors()[0] }}</p>
    }
  </div>

  <div class="form-control">
    <label for="password">Password *</label>
    <input
      id="password"
      type="password"
      [value]="form.password() ?? ''"
      (input)="form.setPassword($event)"
      autocomplete="new-password"
      [attr.aria-invalid]="form.passwordShowErrors() && !form.passwordValid()"
      [attr.aria-describedby]="
        form.passwordShowErrors() ? 'password-error' : null
      "
    />
    @if (form.passwordShowErrors() && form.passwordErrors().length) {
      <p id="password-error" role="alert">{{ form.passwordErrors()[0] }}</p>
    }
  </div>

  <div class="form-actions">
    <button
      type="submit"
      [disabled]="!form.valid() || form.pending() || form.submitting()"
    >
      @if (form.submitting()) { Saving... } @else { Save }
    </button>

    <button type="button" (click)="form.reset()">Reset</button>
  </div>
</form>
```

**Binding cheat sheet**

| Control type          | Value binding                              | Notes |
|-----------------------|--------------------------------------------|-------|
| Text / Email / URL    | `[value]="form.field()"` + `(input)="form.setField($event)"` | Use `?? ''` for undefined values |
| Number / Range        | `[value]="form.field() ?? ''"` + `(input)="form.setField($event)"` | The setter converts events to numbers when possible |
| Textarea              | Same as text                               |       |
| Select (single)       | `[value]="form.field() ?? ''"` + `(change)="form.setField($event)"` | `(input)` also works for native selects |
| Select (multiple)     | `[value]="form.field()"` + `(change)="form.setField($event)"` | Emits an array of selected values |
| Checkbox              | `[checked]="form.field() === true"` + `(change)="form.setField($event)"` | Setter maps to `checked` boolean |
| Radio button          | `[checked]="form.field() === 'value'"` + `(change)="form.setField($event)"` | Provide distinct `value` attributes |
| File input            | `(change)="form.setField($event)"` | The setter returns `FileList` |
| Date/time             | `[value]="form.field() ?? ''"` + `(input)="form.setField($event)"` | Convert to ISO strings in your model |

- Do **not** use `ngModel` or `[(ngModel)]`; `createVestForm` already keeps the model signal in sync.
- Trigger `form.touchFieldName()` manually if you need to show errors before any input.

---

## Enhanced Field Signals API

The proxy turns dot-paths into camelCase accessors:

```typescript
form.email();             // value signal
form.emailValid();        // validity
form.emailErrors();       // string[]
form.emailTouched();      // boolean
form.emailPending();      // async pending
form.emailShowErrors();   // boolean
form.setEmail($event);    // setter accepting raw values or DOM events
form.touchEmail();        // mark as touched
form.resetEmail();        // restore initial value
```

Nested paths flatten accordingly:

- `user.profile.email` → `form.userProfileEmail()`, `form.setUserProfileEmail(...)`.
- Array items (`phones.0.number`) → `form.phones0Number()`.

If automatic names get unwieldy:

```typescript
const phoneField = form.field('phones.0.number');
phoneField.value();  // Signal<string>
phoneField.set('123');
```

Tune the proxy surface when building huge forms:

```typescript
createVestForm(suite, model, {
  includeFields: ['email', 'password', 'profile.*'], // wildcard suffix
  excludeFields: ['profile.ssn'],
});
```

---

## Form Lifecycle & State

- `form.validate(field?)` — re-run validation for a field or whole form.
- `await form.submit()` — sets `submitting()` while pending, honours async tests, rejects when invalid.
- `form.reset()` — restores the initial model, clears touched state.
- `form.resetField('path')` — resets a single field.
- `form.pending()` — true while any async test runs.
- `form.valid()` — true if the suite is currently error-free.
- `form.errors()` — record of field → error string[].
- `form.hasSubmitted()` — signal toggled once `submit()` runs.
- `form.result()` — the latest Vest `SuiteResult`, useful for advanced selectors.
- Always call `form.dispose()` inside `ngOnDestroy`.

Expose the form to parents when needed:

```typescript
readonly formState = () => this.form; // consumer can call formState().valid()
```

---

## Error Display Strategy

`createVestForm` accepts `errorStrategy`:

- `immediate` — show errors as soon as they exist.
- `on-touch` (default) — show once the field is touched/tested.
- `on-submit` — defer until a submission attempt.
- `manual` — you decide when to render errors.

Custom logic? Compose your own via `computeShowErrors` or wrap `form.field('name').showErrors`.

---

## Dynamic Collections

Use `form.array('items')` to manage repeating groups.

```typescript
const items = form.array('items');

items.items();  // Signal<Item[]>
items.push({ name: '', quantity: 1 });
items.remove(index);
items.insert(index, value);
items.move(from, to);
items.replace(index, value);
items.swap(a, b);
items.clear();
items.duplicate(index);

items.at(index).value();     // field accessor for nested item
items.valid();               // aggregate validity
items.errors();              // errors tied to the array node
items.map((item, i, field) => /* render template */);
```

The setter utilities ensure Vest memoisation keeps up with array mutations.

---

## Composition & Wizards

Combine multiple forms:

```typescript
import { composeVestForms, createWizardForm } from 'ngx-vest-forms/core';

const authForms = composeVestForms({ account, profile }, { strategy: 'all-valid' });
authForms.submit(); // validates all, submits when every form is valid

const wizard = createWizardForm({ details, address, review });
wizard.nextStep();
wizard.currentStepName();
```

- `strategy: 'all-valid' | 'any-valid' | 'sequential'` controls aggregate validity.
- Wizard helpers (`currentStep`, `canProceed`, `nextStep`, etc.) simplify multi-page flows.

---



---

## Async Validation & Performance Guidelines

- Gate async work with `skipWhen((result) => result.hasErrors(field), () => {...})`.
- Wrap idempotent async checks in `test.memo` with a dependency array.
- Debounce high-volume validations using `options.debounceMs` or custom logic outside the suite.
- Prefer `result.isTested(field)` over manual “dirty” flags—`createVestForm` already tracks `touched`.

---

## Debugging & Testing Tips

- Use `form.result()` inside dev tooling to inspect Vest’s full state.
- When writing tests, interact with DOM controls and assert on visible errors (`toHaveAccessibleDescription`, `toHaveTextContent`).
- For unit-style validation checks, call the suite directly: `userValidationSuite(model, 'email')`.

---

## Implementation Checklist

- [ ] Define a strict `interface`/`type` for the form model and use it everywhere.
- [ ] Build validation suites with `staticSuite`, `only(field)`, and clear error messages.
- [ ] Instantiate forms via `createVestForm` with a `signal(initialState)`; never use `ngxVestForm` directives in V2.
- [ ] Bind controls using `[value]/(input)` (or `[checked]/(change)` for booleans); avoid `ngModel` and two-way bindings.
- [ ] Wire accessible labels, `aria-invalid`, and `aria-describedby` for every error message.
- [ ] Render errors through `form.fieldNameShowErrors()` / `form.fieldNameErrors()` and keep them inside elements with `role="alert"`.
- [ ] Respect async state: disable actions while `form.pending()` or `form.submitting()` is true when it improves UX.
- [ ] Reset or dispose of the form appropriately (`form.reset()`, `form.resetField()`, `form.dispose()`).
- [ ] Use `form.array('path')` helpers for dynamic lists; never mutate the model array directly.
- [ ] Compose multi-step flows with `composeVestForms`/`createWizardForm` instead of rolling your own coordination.
- [ ] Keep Tailwind utility classes and component structure consistent with the rest of the repo.
- [ ] Update or add examples/tests when introducing new patterns so other developers can copy them confidently.

Following these rules keeps Angular templates declarative, keeps Vest as the single source of truth, and preserves the accessible, high-performance posture we expect from ngx-vest-forms V2.
