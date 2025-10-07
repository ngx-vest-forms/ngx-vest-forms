---
description: 'ngx-vest-forms (v2): Angular + Vest.js form validation patterns'
applyTo: '**/*.{ts,html,component.ts}'
---

# ngx-vest-forms Instructions
**Version**: 2.x

> **Note**: This file covers ngx-vest-forms-specific patterns only. For general Angular best practices (component design, change detection, dependency injection, etc.), see [angular.instructions.md](./angular.instructions.md).

## Core Principles

1. **Vest-First**: Vest.js is the single source of truth for validation state
2. **Framework Agnostic**: `createVestForm` has zero Angular dependencies
3. **Native Controls**: Use `[value]`/`(input)` bindings, NOT `ngModel`
4. **Signal Proxy**: Auto-generated field accessors (`form.email()`, `form.setEmail()`)
5. **Modern Angular**: Follows Angular 20+ conventions (see [angular.instructions.md](./angular.instructions.md))

## Quick Start

```typescript
// 1. Validation Suite (ALWAYS use safe wrappers)
import { staticSafeSuite } from 'ngx-vest-forms';
import { enforce, test } from 'vest';

export const userSuite = staticSafeSuite<UserModel>((data = {}) => {
  // Wrapper handles: if (field) { only(field); }
  test('email', 'Required', () => enforce(data.email).isNotEmpty());
  test('email', 'Invalid format', () => enforce(data.email).isEmail());
});

// 2. Component (Recommended: Use NgxVestForms constant)
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { createVestForm, NgxVestForms } from 'ngx-vest-forms';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxVestForms], // ✅ Imports all directives + component
  template: `
    <form [ngxVestForm]="form" (submit)="save($event)">
      <input
        id="email"
        [value]="form.email() ?? ''"
        (input)="form.setEmail($event)"
      />
      <ngx-form-error [field]="form.emailField()" />
      <button type="submit" [disabled]="form.pending()">Submit</button>
    </form>
  `,
})
export class UserFormComponent {
  form = createVestForm(userSuite, signal({ email: '' }));

  async save(event: Event) {
    event.preventDefault();
    const result = await this.form.submit();
    if (result.valid) await this.api.save(result.data);
  }

  ngOnDestroy() { this.form.dispose(); }
}
```

## Safe Suite Wrappers (CRITICAL)

⚠️ **ALWAYS use safe wrappers to prevent `only(undefined)` bug**

### staticSafeSuite (Default - 95% of cases)
```typescript
import { staticSafeSuite } from 'ngx-vest-forms';

// ✅ Use for: No async OR async with test() (not test.memo())
const suite = staticSafeSuite<Model>((data = {}) => {
  test('email', 'Required', () => enforce(data.email).isNotEmpty());
});
```

### createSafeSuite (ONLY for test.memo())
```typescript
import { createSafeSuite } from 'ngx-vest-forms';

// ⚠️ REQUIRED for: test.memo() async caching
const suite = createSafeSuite<Model>((data = {}) => {
  test.memo('email', 'Taken', async ({ signal }) => {
    await fetch(`/api/check/${data.email}`, { signal });
  }, [data.email]);
});
```

**Why?** `test.memo()` keys include suite instance ID. `staticSafeSuite` creates new instance per call (breaks cache). `createSafeSuite` maintains same instance.

## Field Signals API

```typescript
// Auto-generated (camelCase)
form.email();              // Signal<string>
form.emailValid();         // Signal<boolean>
form.emailValidation();    // Signal<{ errors: string[], warnings: string[] }>
form.emailTouched();       // Signal<boolean>
form.emailPending();       // Signal<boolean>
form.emailShowErrors();    // Signal<boolean>
form.emailShowWarnings();  // Signal<boolean>

// Setters
form.setEmail($event);  // Validates (doesn't mark touched)
form.touchEmail();      // Mark touched + validate
form.resetEmail();      // Reset to initial

// Explicit API
const field = form.field('user.profile.email');
field.value();
field.validation();     // { errors: string[], warnings: string[] }
field.set('new@email.com');
```

## Form Enhancement Patterns

### Pattern 1: Recommended (All Features) 🌟

```typescript
import { NgxVestForms } from 'ngx-vest-forms';

@Component({
  imports: [NgxVestForms], // ✅ All directives + error component
  template: `
    <form [ngxVestForm]="form" (submit)="save($event)">
      <input id="email" [value]="form.email()" (input)="form.setEmail($event)" />
      <ngx-form-error [field]="form.emailField()" />
    </form>
  `
})
```

**The `[ngxVestForm]="form"` directive automatically applies:**
1. `NgxVestFormProviderDirective` - DI for child directives
2. `NgxVestAutoAriaDirective` - Accessible error states (`aria-invalid`, `aria-describedby`)
3. `NgxVestAutoTouchDirective` - Touch state management (errors after blur)
4. `NgxVestFormBusyDirective` - Form busy state (`aria-busy` during async operations)

**Includes:**
- ✅ Auto-ARIA attributes (`aria-invalid`, `aria-describedby`)
- ✅ Auto-touch on blur (progressive error disclosure)
- ✅ Auto `aria-busy` during async validation
- ✅ Error component with WCAG compliance

**When to use:** Default choice for all production forms (95% of use cases)

---

### Pattern 2: Alternative (viewProviders) 🔧

```typescript
import { NgxVestForms, provideVestForm } from 'ngx-vest-forms';

@Component({
  imports: [NgxVestForms],
  viewProviders: provideVestForm((self: MyComponent) => self.form),
  template: `
    <form (submit)="save($event)">
      <input id="email" [value]="form.email()" (input)="form.setEmail($event)" />
      <ngx-form-error [field]="form.emailField()" />
    </form>
  `
})
```

**When to use:** Want zero template directives (advanced users)

---

### Pattern 3: Manual (Zero Dependencies) 🛠️

```typescript
@Component({
  template: `
    <form (submit)="save($event)">
      <input
        id="email"
        [value]="form.email()"
        (input)="form.setEmail($event)"
        (blur)="form.touchEmail()"
        [attr.aria-invalid]="form.emailShowErrors() && !form.emailValid() ? 'true' : null"
      />
      @if (form.emailShowErrors() && form.emailValidation().errors.length) {
        <span role="alert">{{ form.emailValidation().errors[0] }}</span>
      }
    </form>
  `
})
```

**When to use:** Need complete manual control

---

### Opt-Out Mechanisms

```typescript
// Disable auto-touch for specific input
<input ngxVestAutoTouchDisabled [value]="..." (blur)="customLogic()" />

// Disable auto-ARIA for specific input
<input ngxVestAutoAriaDisabled [value]="..." aria-invalid="custom" />

// Global config
provideNgxVestFormsConfig({ autoTouch: false, autoAria: false })
```## Input Bindings

> ⚠️ **IMPORTANT:** The examples below show manual bindings for reference. When using the **`[ngxVestForm]="form"`** directive (recommended), you get:
> - ✅ Auto-ARIA attributes (`aria-invalid`, `aria-describedby`)
> - ✅ Auto-touch detection (errors show after blur)
> - ✅ Auto-busy state (`aria-busy` during async operations)
>
> **You don't need to add `(blur)` handlers or manual ARIA attributes!**

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

// ALWAYS use NgxFormErrorComponent for WCAG compliance
<ngx-form-error [field]="form.emailField()" />
```

**Note:** When using `[ngxVestForm]` directive, auto-ARIA and auto-touch apply automatically - NO manual handlers needed.

## Form State

```typescript
// Signals
form.valid();        // Signal<boolean>
form.pending();      // Signal<boolean>
form.errors();       // Signal<Record<string, string[]>>
form.hasSubmitted(); // Signal<boolean>

// Operations
const result = await form.submit(); // Returns SubmitResult (never throws)
form.reset();                       // Reset to initial
form.validate('email');             // Re-run validation
form.dispose();                     // Clean up (ALWAYS in ngOnDestroy)
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

## Vest.js Patterns

```typescript
import { skipWhen, include, warn, omitWhen } from 'vest';

// Cross-field
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
createVestForm(suite, model, {
  errorStrategy: 'on-touch' // immediate | on-touch | on-submit | manual
});
```

- `immediate` - Show errors as soon as they exist
- `on-touch` (default) - Show after field touched/tested
- `on-submit` - Show after submit attempt
- `manual` - Custom logic via `form.field('name').showErrors()`

## Package Structure

```typescript
// Core (minimal) - ~3KB
import { createVestForm, staticSafeSuite } from 'ngx-vest-forms';

// NgxVestForms constant (recommended) - ~5KB
import { NgxVestForms } from 'ngx-vest-forms';
// Includes: All directives + NgxFormErrorComponent

// Bundle (convenience) - ~8-10KB
import { createVestForm, NgxVestForms } from 'ngx-vest-forms/bundle';

// Use NgxVestForms constant for clean imports
@Component({ imports: [NgxVestForms] })
```

## Import Paths Guide

### Main Entry Point (Recommended)

```typescript
// ✅ Use for most applications
import { createVestForm, NgxVestForms, staticSafeSuite } from 'ngx-vest-forms';
```

**Includes:** All core functions + directives + components
**When to use:** Default choice for 95% of applications
**Bundle size:** ~5KB (includes UI components)

### Core-Only Entry Point (Advanced)

```typescript
// ⚠️ Use only when building custom UI layer
import { createVestForm, staticSafeSuite } from 'ngx-vest-forms/core';
```

**Includes:** Only core validation logic (no Angular directives/components)
**When to use:** Building custom design system or need maximum tree-shaking
**Bundle size:** ~3KB (validation logic only)
**Trade-off:** Must implement your own ARIA attributes and error display

### Bundle Entry Point (All Features)

```typescript
// 📦 Convenience import for everything
import { createVestForm, NgxVestForms } from 'ngx-vest-forms/bundle';
```

**Includes:** Core + all optional packages (schemas, smart-state, etc.)
**When to use:** Using schema adapters (Zod, Valibot) or smart state features
**Bundle size:** ~8-10KB (all features)

## App-Wide Config

```typescript
// app.config.ts
import { provideNgxVestFormsConfig } from 'ngx-vest-forms';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNgxVestFormsConfig({
      autoTouch: true,
      autoAria: true,
      debug: false,
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
- [ ] Use `NgxFormErrorComponent` for error display
- [ ] Use `@if` control flow (not `*ngIf`)
- [ ] Call `form.dispose()` in `ngOnDestroy`
- [ ] Use `skipWhen` for expensive async validations
- [ ] Handle `AbortSignal` in async tests
- [ ] Only disable submit during `pending()`, not based on validity

## Common Mistakes

❌ `only(field)` without guard → Use `staticSafeSuite`
❌ Using `ngModel`/`[(ngModel)]` → Use `[value]`/`(input)`
❌ Not using `[ngxVestForm]` directive → Manual ARIA + touch handling required
❌ Importing individual directives → Use `NgxVestForms` constant
❌ Manual error display → Use `NgxFormErrorComponent`
❌ `try-catch` on submit → Use `SubmitResult.valid` check
❌ Disabling submit on invalid → Only disable during `pending()`
❌ Forgetting `dispose()` → Always call in `ngOnDestroy`
❌ `staticSafeSuite` + `test.memo()` → Use `createSafeSuite`
❌ Using deprecated `field.errors()` → Use `field.validation().errors`
❌ Using deprecated `field.warnings()` → Use `field.validation().warnings`

> **For Angular-specific mistakes** (method naming, change detection, etc.), see [angular.instructions.md](./angular.instructions.md)
