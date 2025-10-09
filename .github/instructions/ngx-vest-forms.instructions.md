---
description: 'ngx-vest-forms code generation patterns for LLMs'
applyTo: '**/*.{ts,html,component.ts}'
---

# ngx-vest-forms LLM Instructions
**Version**: 2.x

> Guidelines for generating code using ngx-vest-forms library patterns

## Core Principles

1. **Vest-First**: Vest.js is the single source of truth for validation state
2. **Framework Agnostic**: `createVestForm` has zero Angular dependencies
3. **Native Controls**: Use `[value]`/`(input)` bindings, NOT `ngModel`
4. **Native Events**: Use `(submit)` NOT `(ngSubmit)` - ngx-vest-forms does not use Angular Forms
   - ✅ **`[ngxVestForm]` directive automatically calls `preventDefault()`** - no manual handling needed!
   - ⚠️ **Without `[ngxVestForm]`**: Must manually call `event.preventDefault()` to prevent page reload
5. **Signal Proxy**: Auto-generated field accessors (`form.email()`, `form.setEmail()`)
6. **Modern Angular**: Standalone components, signals, `OnPush`, `inject()`

## Quick Start

```typescript
// 1. Validation Suite (ALWAYS use safe wrappers)
import { staticSafeSuite } from 'ngx-vest-forms/core';
import { enforce, test } from 'vest';

export const userSuite = staticSafeSuite<UserModel>((data = {}) => {
  // Wrapper handles: if (field) { only(field); }
  test('email', 'Required', () => enforce(data.email).isNotEmpty());
  test('email', 'Invalid format', () => enforce(data.email).isEmail());
});

// 2. Component (Recommended Pattern)
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { createVestForm, NgxVestForms } from 'ngx-vest-forms/core';
import { NgxVestFormField } from 'ngx-vest-forms/form-field';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxVestForms, NgxVestFormField],
  template: `
    <form [ngxVestForm]="form" (submit)="save($event)">
      <ngx-vest-form-field [field]="form.emailField()">
        <label for="email">Email</label>
        <input id="email" [value]="form.email() ?? ''" (input)="form.setEmail($event)" />
      </ngx-vest-form-field>
      <button type="submit" [disabled]="form.pending()">Submit</button>
    </form>
  `,
})
export class UserFormComponent {
  form = createVestForm(signal({ email: '' }), { suite: userSuite });

  async save(event: Event) {
    event.preventDefault();
    const result = await this.form.submit();
    if (result.valid) await this.api.save(result.data);
  }

  ngOnDestroy() { this.form.dispose(); }
}
```

## Core API Patterns

### 1. Form Creation (Required Pattern)

✅ **Always use this signature:**

```typescript
import { createVestForm } from 'ngx-vest-forms/core';
import { signal } from '@angular/core';

const form = createVestForm(
  signal({ email: '', age: 0 }), // Model FIRST (signal or plain object)
  { suite: validationSuite }      // Options SECOND (suite is required)
);
```

### 2. Validation Suites (Use Safe Wrappers)

⚠️ **ALWAYS use safe wrappers to prevent `only(undefined)` bug**

#### staticSafeSuite (Default - 95% of cases)

✅ **Use `staticSafeSuite` for stateless validation:**

```typescript
import { staticSafeSuite } from 'ngx-vest-forms/core';
import { test, enforce } from 'vest';

// ✅ Use for: No async OR async with test() (not test.memo())
export const userSuite = staticSafeSuite<UserModel>((data) => {
  test('email', 'Email is required', () => {
    enforce(data.email).isNotEmpty();
  });
  test('email', 'Invalid email format', () => {
    enforce(data.email).isEmail();
  });
});
```

#### createSafeSuite (ONLY for test.memo())

✅ **Use `createSafeSuite` for stateful validation (with async):**

```typescript
import { createSafeSuite } from 'ngx-vest-forms/core';
import { test, skipWhen } from 'vest';

// ⚠️ REQUIRED for: test.memo() async caching
export const asyncSuite = createSafeSuite<UserModel>((data) => {
  test('email', 'Required', () => enforce(data.email).isNotEmpty());

  skipWhen((res) => res.hasErrors('email'), () => {
    test.memo('email', 'Already taken', async ({ signal }) => {
      await checkAvailability(data.email, { signal });
    }, [data.email]);
  });
});
```

**Why?** `test.memo()` keys include suite instance ID. `staticSafeSuite` creates new instance per call (breaks cache). `createSafeSuite` maintains same instance.

### 3. Enhanced Field Signals API

The form auto-generates typed field accessors:

```typescript
// Value signals (read-only)
form.email()           // Signal<string> - current value
form.profileName()     // Nested: profile.name → profileName()

// Validation signals (read-only)
form.emailValid()      // Signal<boolean> - no errors AND no pending
form.emailInvalid()    // Signal<boolean> - has errors (ignores pending)
form.emailDirty()      // Signal<boolean> - value changed from initial
form.emailTouched()    // Signal<boolean> - user interacted (blurred)
form.emailPending()    // Signal<boolean> - async validation running
form.emailShowErrors() // Signal<boolean> - should display errors
form.emailValidation() // Signal<ValidationMessages> - errors + warnings

// Operations (accept Events or raw values)
form.setEmail($event)        // Set value from DOM Event or raw value
form.markAsTouchedEmail()    // Mark as touched (triggers error display)
form.markAsDirtyEmail()      // Mark as dirty (value modified)
form.resetEmail()            // Reset to initial value

// Form-level signals
form.valid()           // Signal<boolean> - all fields valid + no pending
form.invalid()         // Signal<boolean> - has any errors
form.dirty()           // Signal<boolean> - any field changed
form.pending()         // Signal<boolean> - any async validation running
form.submittedStatus() // Signal<'unsubmitted' | 'submitting' | 'submitted'>
```

## Template Patterns

### 1. Basic Form with Auto-Accessibility

```typescript
import { NgxVestForms } from 'ngx-vest-forms/core';

@Component({
  imports: [NgxVestForms],
  template: `
    <form [ngxVestForm]="form" (submit)="save()">
      <label for="email">Email</label>
      <input
        id="email"
        type="email"
        [value]="form.email()"
        (input)="form.setEmail($event)"
      />
      <ngx-form-error [field]="form.emailField()" />
      <button type="submit">Submit</button>
    </form>
  `
})
```

**What `[ngxVestForm]` provides automatically:**
- ✅ `aria-invalid` on inputs with errors
- ✅ `aria-describedby` linking to error messages
- ✅ `aria-busy` during async validation
- ✅ Touch state on blur events
- ✅ `preventDefault()` on submit

### 2. Form Field Wrapper (Simpler Markup)

```typescript
import { NgxVestFormField } from 'ngx-vest-forms/form-field';

@Component({
  imports: [NgxVestForms, NgxVestFormField],
  template: `
    <form [ngxVestForm]="form" (submit)="save()">
      <ngx-vest-form-field [field]="form.emailField()">
        <label for="email">Email</label>
        <input id="email" [value]="form.email()" (input)="form.setEmail($event)" />
      </ngx-vest-form-field>
      <button type="submit">Submit</button>
    </form>
  `
})
```

### 3. Structured Errors for i18n

```html
@for (error of form.emailValidation().structuredErrors; track error.kind) {
  @switch (error.kind) {
    @case ('required') {
      <p role="alert">{{ 'validation.required' | translate }}</p>
    }
    @case ('email') {
      <p role="alert">{{ 'validation.invalid_email' | translate }}</p>
    }
    @case ('minlength') {
      <p role="alert">{{ 'validation.minlength' | translate: error.params }}</p>
    }
  }
}
```

## Input Bindings

```typescript
// Text/Email/URL
<input [value]="form.email() ?? ''" (input)="form.setEmail($event)" />

// Number
<input type="number" [value]="form.age() ?? ''" (input)="form.setAge($event)" />

// Checkbox
<input type="checkbox" [checked]="form.agreed() === true" (change)="form.setAgreed($event)" />

// Radio
<input type="radio" value="male" [checked]="form.gender() === 'male'" (change)="form.setGender($event)" />

// Select
<select [value]="form.country() ?? ''" (change)="form.setCountry($event)">...</select>
```

**Note:** When using `[ngxVestForm]` directive, auto-ARIA and auto-touch apply automatically - NO manual handlers needed.

## Validation Suite Patterns

### 1. Cross-Field Validation

```typescript
import { include } from 'vest';

const suite = staticSafeSuite<PasswordForm>((data) => {
  test('password', 'Required', () => enforce(data.password).isNotEmpty());

  // Only validate confirmPassword when password exists
  include('confirmPassword').when('password');
  test('confirmPassword', 'Must match', () => {
    enforce(data.confirmPassword).equals(data.password);
  });
});
```

### 2. Async Validation with Race Condition Protection

```typescript
import { skipWhen } from 'vest';

const suite = staticSafeSuite<UserForm>((data) => {
  test('username', 'Required', () => enforce(data.username).isNotEmpty());

  // Skip expensive async until basic validation passes
  skipWhen((res) => res.hasErrors('username'), () => {
    test('username', 'Already taken', async ({ signal }) => {
      const response = await fetch(`/api/check/${data.username}`, { signal });
      if (!response.ok) throw new Error();
    });
  });
});
```

### 3. Warnings (Non-Blocking Feedback)

```typescript
import { warn } from 'vest';

const suite = staticSafeSuite((data) => {
  test('password', 'Required', () => enforce(data.password).isNotEmpty());

  test('password', 'Consider adding symbols', () => {
    warn(); // Makes this a warning, not an error
    enforce(data.password).matches(/[!@#$%^&*]/);
  });
});
```

### 4. Dual-Layer Validation (Schema + Vest)

```typescript
import { z } from 'zod';
import { type InferOutput } from 'ngx-vest-forms/schemas';

// 1. Define schema with .default() values (single source of truth)
const UserSchema = z.object({
  email: z.string().email().default(''),
  age: z.number().int().min(18).default(18),
});

// 2. Infer TypeScript type from schema
type UserModel = InferOutput<typeof UserSchema>;

// 3. Create initial values helper
function createInitialUser(): UserModel {
  return UserSchema.parse({}); // Uses .default() values
}

// 4. Define Vest suite for business logic
const userSuite = staticSafeSuite<UserModel>((data) => {
  test('email', 'Email already registered', async ({ signal }) => {
    const res = await fetch(`/api/check-email/${data.email}`, { signal });
    if (!res.ok) throw new Error();
  });
});

// 5. Create form with dual-layer validation
@Component({ /* ... */ })
export class UserFormComponent {
  form = createVestForm(
    createInitialUser(), // ← Uses schema defaults
    { suite: userSuite, schema: UserSchema } // ← Type validation layer
  );
}
```

**Features:**
- ✅ **No Adapters Needed** - Zod 3.24+, Valibot 1.0+, ArkType 2.0+ have native StandardSchemaV1 support
- ✅ **Dual-Layer Validation** - Schema for types, Vest for business logic
- ✅ **Unified Errors** - Schema and Vest errors combined automatically
- ✅ **Type Safety** - Full TypeScript inference from schema

**Model-Schema Alignment (Golden Rule):**
```typescript
// ✅ CORRECT: Schema defines complete data shape, types inferred
export const userSchema = z.object({
  email: z.string().min(1).email().default(''),
  password: z.string().min(8).default(''),
  confirmPassword: z.string().min(1).default(''), // ✅ In schema
});
export type UserModel = InferOutput<typeof userSchema>;
export const createInitialUser = () => userSchema.parse({});

// ❌ WRONG: Manual type definition can drift from schema
type UserModel = { email: string; password: string }; // Missing confirmPassword!
```

## SubmitResult Type

```typescript
type SubmitResult<TModel> = {
  valid: boolean;
  data: TModel;  // Always present
  errors: Record<string, string[]>;  // Always present
};

// Usage - NO try-catch needed
async save() {
  const result = await this.form.submit();
  if (result.valid) {
    await this.api.save(result.data);
  } else {
    console.log('Errors:', result.errors);
  }
}
```

## Vest.js Common Patterns

```typescript
import { skipWhen, include, warn, omitWhen } from 'vest';

// Cross-field validation
include('confirmPassword').when('password');
test('confirmPassword', 'Must match', () =>
  enforce(data.confirmPassword).equals(data.password)
);

// Skip expensive async until prerequisites pass
skipWhen((res) => res.hasErrors('email'), () => {
  test('email', 'Taken', async ({ signal }) => {
    await fetch(`/api/check/${data.email}`, { signal });
  });
});

// Omit when condition true (doesn't block validity)
omitWhen(!data.needsShipping, () => {
  test('address', 'Required', () => enforce(data.address).isNotEmpty());
});

// Warning-only (doesn't block submission)
test('password', 'Add special chars', () => {
  warn();
  enforce(data.password).matches(/[!@#$%^&*]/);
});
```

## Error Display Strategies

```typescript
// Default: show errors after field is touched
const form = createVestForm(signal(model), { suite });

// Or explicitly set the strategy
const form = createVestForm(signal(model), {
  suite,
  errorStrategy: 'on-touch' // immediate | on-touch | on-submit | manual
});

// Advanced: Dynamic strategy (rare - for demo apps)
const errorMode = signal<ErrorDisplayStrategy>('on-touch');
const form = createVestForm(signal(model), {
  suite,
  errorStrategy: errorMode  // ← Pass signal reference (not errorMode())
});
```

## Import Paths

```typescript
// ✅ Recommended: Main entry point (95% of use cases)
import { createVestForm, NgxVestForms, staticSafeSuite } from 'ngx-vest-forms';

// ⚠️ Advanced: Core-only (custom UI layer, max tree-shaking)
import { createVestForm, staticSafeSuite } from 'ngx-vest-forms/core';

// 🎨 Optional: Form field wrapper
import { NgxVestFormField } from 'ngx-vest-forms/form-field';

// 📦 Optional: Schema types
import { type InferOutput } from 'ngx-vest-forms/schemas';
```

## App-Wide Config

```typescript
// app.config.ts
import { provideNgxVestFormsConfig } from 'ngx-vest-forms';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNgxVestFormsConfig({
      autoTouch: true,
      autoAria: true,
      strictFieldResolution: false, // Enable in dev: !environment.production
      defaultErrorStrategy: 'on-touch',
    }),
  ],
};
```

## Dynamic Collections

```typescript
const items = form.array('items');

items.items();       // Signal<Item[]>
items.push({ name: '' });
items.remove(index);
items.at(index).value();
items.valid();       // Aggregate validity
```

## Component Patterns

### 1. Basic Component

```typescript
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { createVestForm, NgxVestForms } from 'ngx-vest-forms/core';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxVestForms],
  template: `
    <form [ngxVestForm]="form" (submit)="login()">
      <input id="email" [value]="form.email()" (input)="form.setEmail($event)" />
      <ngx-form-error [field]="form.emailField()" />
      <button type="submit" [disabled]="form.pending()">Login</button>
    </form>
  `
})
export class LoginComponent {
  form = createVestForm(signal({ email: '', password: '' }), { suite: loginSuite });

  async login() {
    const result = await this.form.submit();
    if (result.valid) {
      await this.authService.login(result.data);
    }
  }
}
```

### 2. With Async Cleanup (createSafeSuite only)

```typescript
import { Component, OnDestroy } from '@angular/core';
import { createVestForm } from 'ngx-vest-forms/core';

@Component({...})
export class UserFormComponent implements OnDestroy {
  // Using createSafeSuite (stateful) requires cleanup
  form = createVestForm(signal(initialData), { suite: asyncSuite });

  ngOnDestroy() {
    this.form.dispose(); // Cancel pending async + reset state
  }
}
```

## Critical Rules

### ❌ Never Do This

```typescript
// ❌ Don't use (ngSubmit) - that's Angular Forms
<form (ngSubmit)="save()">

// ❌ Don't disable submit buttons (WCAG violation)
<button [disabled]="!form.valid()">Submit</button>

// ❌ Don't wrap only() conditionally in raw suites
staticSuite((data, field) => {
  if (field) only(field); // BUG: Breaks Vest execution tracking
});

// ❌ Don't call markAsTouched() in setters
form.setEmail(value);
form.markAsTouchedEmail(); // Wrong place!
```

### ✅ Always Do This

```typescript
// ✅ Use (submit) with [ngxVestForm]
<form [ngxVestForm]="form" (submit)="save()">

// ✅ Only disable during async operations
<button [disabled]="form.pending() || form.submitting()">Submit</button>

// ✅ Use safe suite wrappers
const suite = staticSafeSuite((data) => { /* no manual only() */ });

// ✅ Let directives handle touch state
// Manual touch only for special cases (e.g., wizard step validation)
```

## Testing Patterns

### 1. Component Test (Vitest + Testing Library)

```typescript
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@vitest/browser/context';

it('validates email on blur', async () => {
  await render(LoginComponent);

  const input = screen.getByRole('textbox', { name: /email/i });
  await userEvent.type(input, 'invalid');
  await userEvent.tab();

  expect(screen.getByRole('alert')).toHaveTextContent('Invalid email');
});
```

### 2. E2E Test (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test('submits valid form', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel(/email/i).fill('user@example.com');
  await page.getByLabel(/password/i).fill('password123');
  await page.getByRole('button', { name: /login/i }).click();

  await expect(page).toHaveURL('/dashboard');
});
```

## Quick Reference

### Import Paths

```typescript
// Core (validation + directives)
import { createVestForm, NgxVestForms, staticSafeSuite } from 'ngx-vest-forms/core';

// Form field wrapper
import { NgxVestFormField } from 'ngx-vest-forms/form-field';

// Schema adapters
import { type InferOutput } from 'ngx-vest-forms/schemas';
```

### Key Signals

| Signal | Returns | Description |
|--------|---------|-------------|
| `valid()` | `boolean` | No errors AND no pending |
| `invalid()` | `boolean` | Has errors (ignores pending) |
| `dirty()` | `boolean` | Value changed from initial |
| `touched()` | `boolean` | Field was blurred |
| `pending()` | `boolean` | Async validation running |
| `showErrors()` | `boolean` | Should display errors |
| `submittedStatus()` | `SubmittedStatus` | Submit state |
| `validation()` | `ValidationMessages` | Errors + warnings |

### Submit Pattern

```typescript
async onSubmit() {
  const result = await this.form.submit();

  if (result.valid) {
    // result.data is typed as TModel
    await this.api.save(result.data);
  } else {
    // result.errors contains all validation errors
    console.error(result.errors);
  }
}
```

## WCAG 2.2 Compliance

- **Blocking errors**: `role="alert"` + `aria-live="assertive"` (NgxFormErrorComponent)
- **Warnings**: `role="status"` + `aria-live="polite"`
- **Hints**: `aria-describedby` (static, no live region)
- Auto-aria directive handles `aria-invalid` and `aria-describedby` linking

## Critical Checklist

- [ ] Use `staticSafeSuite` (prevents `only(undefined)` bug)
- [ ] Create forms with `signal()` models
- [ ] Use native `[value]`/`(input)`, NOT `ngModel`
- [ ] Import `NgxVestForms` constant for clean imports
- [ ] Use `[ngxVestForm]="form"` directive (recommended for WCAG 2.2)
- [ ] Use `NgxFormErrorComponent` or `NgxVestFormField` for error display
- [ ] Use `@if` control flow (not `*ngIf`)
- [ ] Call `form.dispose()` in `ngOnDestroy`
- [ ] Use `skipWhen` for expensive async validations
- [ ] Handle `AbortSignal` in async tests
- [ ] Only disable submit during `pending()`, not based on validity
- [ ] Use camelCase IDs for nested form fields (e.g., `personalInfoFirstName` → `personalInfo.firstName`)
- [ ] For schema validation, use Zod 3.24+, Valibot 1.0+, or ArkType 2.0+ (no adapters needed)
- [ ] **Model-Schema Alignment**: Define schema with `.default()` values, infer types with `InferOutput<typeof Schema>`
- [ ] Use `invalid()` for error checks, `!valid()` only when waiting for async (v2.0)
- [ ] Use `dirty()` for unsaved changes, `touched()` for progressive error disclosure (v2.0)
- [ ] Use `submittedStatus()` for submission state tracking (v2.0)
- [ ] Use `field.validation()` instead of `field.errors()`/`field.warnings()` (v2.0)
- [ ] Use `markAsTouched()` method (v2.0)

## Common Mistakes

❌ `only(field)` without guard → Use `staticSafeSuite`
❌ Using `ngModel`/`[(ngModel)]` → Use `[value]`/`(input)`
❌ Using `(ngSubmit)` → Use `(submit)` - ngx-vest-forms does NOT use Angular Forms
❌ **Missing `[ngxVestForm]` directive** → Page reloads on submit (no auto-preventDefault without it)
❌ Importing individual directives → Use `NgxVestForms` constant
❌ `try-catch` on submit → Use `SubmitResult.valid` check
❌ Disabling submit on invalid → Only disable during `pending()`
❌ Forgetting `dispose()` → Always call in `ngOnDestroy`
❌ `staticSafeSuite` + `test.memo()` → Use `createSafeSuite`
❌ Using schema adapter wrappers (`fromZod`, etc.) → Pass schema directly (StandardSchemaV1 support built-in)
❌ Manual error components with `NgxVestFormField` → Errors display automatically
❌ Manual type definitions with schemas → Use `InferOutput<typeof Schema>` to prevent type drift
❌ Not using `.default()` in schemas → Schema should define structure AND initial values
❌ Missing UI-only fields in schema (like `confirmPassword`) → Include ALL fields, even if not persisted
❌ Using `!valid()` when `invalid()` is correct → `invalid()` ignores pending, `!valid()` waits for async
❌ Using `touched()` for unsaved changes → Use `dirty()` for value changes, `touched()` for user interaction

## See Also

- [Vest.js Documentation](https://vestjs.dev/)
- [Vest.js Instructions](./vest.instructions.md) - Comprehensive Vest.js patterns and best practices
- [Angular Signals Guide](https://angular.dev/guide/signals)
- [Angular LLM Guidelines](https://angular.dev/llms.txt)
- Project issues: [GitHub Issues](https://github.com/ngx-vest-forms/ngx-vest-forms/issues)
