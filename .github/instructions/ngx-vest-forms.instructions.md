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
  form = createVestForm(signal({ email: '' }), userSuite);

  async save(event: Event) {
    event.preventDefault();
    const result = await this.form.submit();
    if (result.valid) await this.api.save(result.data);
  }

  ngOnDestroy() { this.form.dispose(); }
}
```

## Progressive Enhancement Levels

### Level 1: Core Validation (Minimal)

```typescript
import { createVestForm, staticSafeSuite } from 'ngx-vest-forms/core';

@Component({
  template: `
    <form (submit)="save($event)">
      <input [value]="form.email() ?? ''" (input)="form.setEmail($event)" />
      @if (form.emailShowErrors() && form.emailValidation().errors.length) {
        <p role="alert">{{ form.emailValidation().errors[0] }}</p>
      }
      <button type="submit" [disabled]="form.pending()">Submit</button>
    </form>
  `
})
export class MinimalFormComponent {
  form = createVestForm(signal({ email: '' }), suite);

  async save(event: Event) {
    event.preventDefault();
    const result = await this.form.submit();
    if (result.valid) console.log(result.data);
  }
}
```

**What you get:** Core validation, field signals, submit handling
**What's missing:** ARIA attributes, touch management, styled errors

### Level 2: Add Form Field Wrapper

```bash
npm install ngx-vest-forms-form-field
```

```typescript
import { NgxVestFormField } from 'ngx-vest-forms/form-field';

@Component({
  imports: [NgxVestFormField],
  template: `
    <form (submit)="save($event)">
      <ngx-vest-form-field [field]="form.emailField()">
        <label for="email">Email</label>
        <input
          id="email"
          [value]="form.email() ?? ''"
          (input)="form.setEmail($event)"
        />
        <!-- Error display automatic! -->
      </ngx-vest-form-field>
      <button type="submit" [disabled]="form.pending()">Submit</button>
    </form>
  `
})
```

**Added:** Automatic error display, consistent layout
**Still missing:** ARIA attributes, touch management

### Level 3: Add Schema Validation

```bash
npm install zod  # or valibot, or arktype
```

```typescript
import { z } from 'zod';
import { type InferOutput } from 'ngx-vest-forms/schemas';

// 1. Define schema with .default() values
const UserSchema = z.object({
  email: z.string().email().default(''),
  age: z.number().min(18).default(18),
});

// 2. Infer type from schema
type UserModel = InferOutput<typeof UserSchema>;

// 3. Create initial values helper
function createInitialUser(): UserModel {
  return UserSchema.parse({}); // Uses .default() values
}

// 4. Define Vest suite for business logic
const suite = staticSafeSuite<UserModel>((data) => {
  test('email', 'Already taken', async ({ signal }) => {
    const response = await fetch(`/api/check/${data.email}`, { signal });
    if (!response.ok) throw new Error();
  });
});

@Component({
  imports: [NgxVestFormField],
  template: `<!-- same as Level 2 -->`
})
export class UserFormComponent {
  form = createVestForm(
    createInitialUser(), // ← Uses schema defaults
    suite,
    { schema: UserSchema } // ← Type validation layer
  );
}
```

**Added:** Type-level validation (Zod/Valibot/ArkType), unified error handling
**Note:** No adapter wrappers needed - StandardSchemaV1 support is built-in

### Level 4: Full Production (Recommended) 🌟

```typescript
import { NgxVestForms } from 'ngx-vest-forms';
import { NgxVestFormField } from 'ngx-vest-forms/form-field';
import { type InferOutput } from 'ngx-vest-forms/schemas';

const UserSchema = z.object({
  email: z.string().email().default(''),
  age: z.number().min(18).default(18),
});

type UserModel = InferOutput<typeof UserSchema>;

function createInitialUser(): UserModel {
  return UserSchema.parse({});
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxVestForms, NgxVestFormField],
  template: `
    <form [ngxVestForm]="form" (submit)="save($event)">
      <ngx-vest-form-field [field]="form.emailField()">
        <label for="email">Email</label>
        <input
          id="email"
          [value]="form.email() ?? ''"
          (input)="form.setEmail($event)"
        />
      </ngx-vest-form-field>
      <button type="submit" [disabled]="form.pending()">Submit</button>
    </form>
  `
})
export class UserFormComponent {
  form = createVestForm(
    createInitialUser(),
    suite,
    { schema: UserSchema }
  );

  async save(event: Event) {
    event.preventDefault();
    const result = await this.form.submit();
    if (result.valid) await this.api.save(result.data);
  }

  ngOnDestroy() { this.form.dispose(); }
}
```

**The `[ngxVestForm]` directive adds:** Auto-ARIA, auto-touch, form busy state (aria-busy)
**Complete:** WCAG 2.2 compliant, progressive disclosure, 80% less code

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

## Optional: Form Field Component

For cleaner markup with automatic error display, use `NgxVestFormField`:

```typescript
import { NgxVestFormField } from 'ngx-vest-forms/form-field';

@Component({
  imports: [NgxVestForms, NgxVestFormField],
  template: `
    <form [ngxVestForm]="form">
      <ngx-vest-form-field [field]="form.emailField()">
        <label for="email">Email</label>
        <input id="email" [value]="form.email()" (input)="form.setEmail($event)" />
        <!-- Error display automatic! No need for <ngx-form-error> -->
      </ngx-vest-form-field>
    </form>
  `
})
```

**Benefits:**
- ✅ **Automatic Error Display** - No need to manually add `<ngx-form-error>`
- ✅ **Consistent Layout** - Standardized spacing via CSS custom properties
- ✅ **Optional Validation** - Works with or without `[field]` input
- ✅ **Themeable** - CSS custom properties for customization

**Comparison:**

```typescript
// Without form-field (manual)
<div class="form-field">
  <label for="email">Email</label>
  <input id="email" [value]="form.email()" (input)="form.setEmail($event)" />
  <ngx-form-error [field]="form.emailField()" />
</div>

// With form-field (automatic)
<ngx-vest-form-field [field]="form.emailField()">
  <label for="email">Email</label>
  <input id="email" [value]="form.email()" (input)="form.setEmail($event)" />
</ngx-vest-form-field>
```

**CSS Custom Properties:**

```css
/* Default values - override in your global styles */
--ngx-vest-form-field-gap: 0.5rem;           /* Space between content and errors */
--ngx-vest-form-field-margin: 1rem;          /* Bottom margin of field wrapper */
--ngx-vest-form-field-content-gap: 0.25rem;  /* Space between label and input */
```

## Schema Validation (Type Layer)

Add **schema validation** for type-level checks with Zod, Valibot, or ArkType:

### Basic Usage

```typescript
import { z } from 'zod';
import { type InferOutput } from 'ngx-vest-forms/schemas';

// 1. Define schema with .default() values (single source of truth)
const UserSchema = z.object({
  email: z.string().email().default(''),
  age: z.number().min(18).default(18),
});

// 2. Infer TypeScript type from schema
type UserModel = InferOutput<typeof UserSchema>;

// 3. Create initial values helper
function createInitialUser(): UserModel {
  return UserSchema.parse({}); // Uses .default() values
}

// 4. Define Vest suite for business logic
const userSuite = staticSafeSuite<UserModel>((data) => {
  test('email', 'Email already taken', async ({ signal }) => {
    const response = await fetch(`/api/check-email/${data.email}`, { signal });
    if (!response.ok) throw new Error();
  });
});

// 5. Create form with dual-layer validation
@Component({
  imports: [NgxVestForms, NgxVestFormField],
  template: `...`
})
export class UserFormComponent {
  form = createVestForm(
    createInitialUser(), // ← Uses schema defaults
    userSuite,
    { schema: UserSchema } // ← Type validation layer
  );
}
```

### Model-Schema Alignment (Golden Rule)

**Schema defines the complete data shape, TypeScript types are inferred from the schema.**

#### ✅ CORRECT Pattern

```typescript
import { z } from 'zod';
import { type InferOutput } from 'ngx-vest-forms/schemas';

// 1. Define schema with ALL fields (including UI-only like confirmPassword)
export const userSchema = z.object({
  email: z.string().min(1).email().default(''),
  password: z.string().min(8).default(''),
  confirmPassword: z.string().min(1).default(''), // ✅ In schema
  age: z.number().int().min(18).default(18),
});

// 2. Infer TypeScript type from schema (single source of truth)
export type UserModel = InferOutput<typeof userSchema>;

// 3. Create initial values using schema defaults
export function createInitialUser(): UserModel {
  return userSchema.parse({}); // Uses .default() values
}

// 4. Create form with aligned types
const form = createVestForm(
  createInitialUser(),
  userSuite,
  { schema: userSchema }, // TypeScript enforces schema matches UserModel
);
```

#### ❌ WRONG Pattern

```typescript
// ❌ Manual type definition can drift from schema
type UserModel = {
  email: string;
  password: string;
  age: number;
  // Missing confirmPassword! Type mismatch!
};

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string(), // Not in manual type
  age: z.number().min(18),
});
```

#### Why This Matters

1. **Type Safety**: Generic `TModel` in `createVestForm` ensures schema validates the same type as your model
2. **Single Source of Truth**: Schema defines structure AND initial values
3. **Prevents Drift**: Manual types can become outdated when schema changes
4. **Better DX**: `schema.parse({})` auto-fills defaults, no manual initial value objects

#### Cross-Field Validation Pattern

For fields like `confirmPassword`, you have two options:

**Option 1: Schema handles validation (simpler)**

```typescript
const schema = z.object({
  password: z.string().min(8).default(''),
  confirmPassword: z.string().min(1).default(''),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords must match',
  path: ['confirmPassword'],
});
```

**Option 2: Vest handles validation (recommended - more flexible)**

```typescript
const schema = z.object({
  password: z.string().min(8).default(''),
  confirmPassword: z.string().min(1).default(''),
});

const suite = staticSafeSuite<InferOutput<typeof schema>>((data) => {
  include('confirmPassword').when('password');
  test('confirmPassword', 'Passwords must match', () => {
    enforce(data.confirmPassword).equals(data.password);
  });
});
```

### Features

- ✅ **No Adapters Needed** - Zod 3.24+, Valibot 1.0+, ArkType 2.0+ have native StandardSchemaV1 support
- ✅ **Dual-Layer Validation** - Schema for types, Vest for business logic
- ✅ **Unified Errors** - Schema and Vest errors combined automatically
- ✅ **Type Safety** - Full TypeScript inference from schema

### Supported Libraries

- **Zod** (v3.24.0+): `z.object({ email: z.string().email() })`
- **Valibot** (v1.0+): `v.object({ email: v.pipe(v.string(), v.email()) })`
- **ArkType** (v2.0+): `type({ email: 'string.email' })`

### Optional Type Guards

From `ngx-vest-forms/schemas`:

```typescript
import { isZodSchema, isValibotSchema, isArkTypeSchema } from 'ngx-vest-forms/schemas';

if (isZodSchema(schema)) {
  // TypeScript knows this is Zod - access library-specific properties
  console.log(schema._def);
}
```

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

### Standard Usage (Static Strategy)

Most applications use a fixed error strategy - simply pass a string:

```typescript
// Default: show errors after field is touched
const form = createVestForm(suite, model);

// Or explicitly set the strategy
const form = createVestForm(suite, model, {
  errorStrategy: 'on-touch' // immediate | on-touch | on-submit | manual
});
```

**Available strategies:**
- `immediate` - Show errors as soon as they exist (while typing)
- `on-touch` (default) - Show after field touched/tested (WCAG recommended)
- `on-submit` - Show only after submit attempt
- `manual` - Custom logic via `form.field('name').showErrors()`

### Advanced: Dynamic Error Strategy (Rare)

For demo apps or admin panels where users switch error modes at runtime, pass a Signal:

```typescript
const errorMode = signal<ErrorDisplayStrategy>('on-touch');

const form = createVestForm(suite, model, {
  errorStrategy: errorMode  // ← Pass signal reference (not errorMode())
});

// Changes react automatically
errorMode.set('immediate');
```

**⚠️ Note:** If using a signal, pass the signal itself (`errorMode`), not the called value (`errorMode()`). The latter evaluates once at initialization and won't react to changes.

## Package Structure

```typescript
// Core (minimal) - ~3KB
import { createVestForm, staticSafeSuite } from 'ngx-vest-forms';

// NgxVestForms constant (recommended) - ~5KB
import { NgxVestForms } from 'ngx-vest-forms';
// Includes: All directives + NgxFormErrorComponent

// Form Field (optional) - ~2KB
import { NgxVestFormField } from 'ngx-vest-forms/form-field';
// Layout wrapper with automatic error display

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

### Form Field Component (Optional)

```typescript
// 🎨 Layout wrapper with automatic error display
import { NgxVestFormField } from 'ngx-vest-forms/form-field';
```

**Includes:** Control wrapper component
**When to use:** Want consistent layout + automatic error display without manual `<ngx-form-error>`
**Bundle size:** ~2KB

**Benefits:**

- ✅ No manual error component needed
- ✅ Consistent spacing via CSS custom properties
- ✅ Works with or without validation

**Example:**

```typescript
<ngx-vest-form-field [field]="form.emailField()">
  <label for="email">Email</label>
  <input id="email" [value]="form.email()" (input)="form.setEmail($event)" />
  <!-- Error display automatic! -->
</ngx-vest-form-field>
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
      debug: false,
      defaultErrorStrategy: 'on-touch',
    }),
  ],
};
```

### Strict Field Resolution

When using Enhanced Field Signals with nested forms, the auto-touch directive resolves camelCase IDs to nested paths (e.g., `personalInfoFirstName` → `personalInfo.firstName`). By default, resolution failures log console warnings. Enable strict mode to throw errors instead:

```typescript
// Development: Fail fast on misconfigured IDs
provideNgxVestFormsConfig({
  strictFieldResolution: !environment.production
});
```

**Behavior:**
- `false` (default): Logs `console.warn()` when field resolution fails
- `true`: Throws `Error` when field resolution fails

**Use cases:**
- **Development**: Catch ID naming mistakes early
- **Production**: Graceful degradation with warnings
- **CI/CD**: Enable in test environments to prevent regressions

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
- [ ] Use `NgxFormErrorComponent` for error display (or `NgxVestFormField` for automatic display)
- [ ] Use `@if` control flow (not `*ngIf`)
- [ ] Call `form.dispose()` in `ngOnDestroy`
- [ ] Use `skipWhen` for expensive async validations
- [ ] Handle `AbortSignal` in async tests
- [ ] Only disable submit during `pending()`, not based on validity
- [ ] Use camelCase IDs for nested form fields (e.g., `personalInfoFirstName` for `personalInfo.firstName`)
- [ ] Enable `strictFieldResolution` in development to catch ID naming mistakes
- [ ] For schema validation, use Zod 3.24+, Valibot 1.0+, or ArkType 2.0+ (no adapters needed)
- [ ] Use `NgxVestFormField` for automatic error display and consistent layout
- [ ] **Model-Schema Alignment**: Define schema with `.default()` values, infer types with `InferOutput<typeof Schema>`, create initial values with `schema.parse({})`

## Common Mistakes

❌ `only(field)` without guard → Use `staticSafeSuite`
❌ Using `ngModel`/`[(ngModel)]` → Use `[value]`/`(input)`
❌ Not using `[ngxVestForm]` directive → Manual ARIA + touch handling required
❌ Importing individual directives → Use `NgxVestForms` constant
❌ Manual error display → Use `NgxFormErrorComponent` (or `NgxVestFormField` for automatic display)
❌ `try-catch` on submit → Use `SubmitResult.valid` check
❌ Disabling submit on invalid → Only disable during `pending()`
❌ Forgetting `dispose()` → Always call in `ngOnDestroy`
❌ `staticSafeSuite` + `test.memo()` → Use `createSafeSuite`
❌ Using deprecated `field.errors()` → Use `field.validation().errors`
❌ Using deprecated `field.warnings()` → Use `field.validation().warnings`
❌ Using schema adapter wrappers (`fromZod`, etc.) → Pass schema directly (StandardSchemaV1 support built-in)
❌ Manual error components with `NgxVestFormField` → Errors display automatically
❌ Dynamic error strategy with `errorMode()` → Pass `errorMode` NOT `errorMode()` (edge case - most apps use static string)
❌ Manual type definitions with schemas → Use `InferOutput<typeof Schema>` to prevent type drift
❌ Not using `.default()` in schemas → Schema should define structure AND initial values
❌ Missing UI-only fields in schema (like `confirmPassword`) → Include ALL fields, even if not persisted

> **For Angular-specific mistakes** (method naming, change detection, etc.), see [angular.instructions.md](./angular.instructions.md)
