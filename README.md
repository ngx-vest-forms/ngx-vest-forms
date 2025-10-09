# ngx-vest-forms (v2)

> **The most productive way to build accessible forms in Angular**
> Vest-first validation with automatic accessibility, zero boilerplate, and built-in best practices.

[![Github Stars](https://badgen.net/github/stars/ngx-vest-forms/ngx-vest-forms?color=yellow&label=Github%20🌟)](https://github.com/ngx-vest-forms/ngx-vest-forms)
[![Next Release](https://badgen.net/npm/v/ngx-vest-forms/beta?label=Next&color=orange)](https://www.npmjs.com/package/ngx-vest-forms?activeTab=versions)
[![Version](https://badgen.net/npm/v/ngx-vest-forms?&icon=npm)](https://www.npmjs.com/package/ngx-vest-forms)
[![Downloads](https://badgen.net/npm/dt/ngx-vest-forms?label=Downloads)](https://www.npmjs.com/package/ngx-vest-forms)
[![Bundle Size](https://badgen.net/bundlephobia/minzip/ngx-vest-forms)](https://bundlephobia.com/package/ngx-vest-forms)
[![License](https://badgen.net/npm/license/ngx-vest-forms)](https://opensource.org/licenses/MIT)
[![Build Status](https://badgen.net/github/checks/ngx-vest-forms/ngx-vest-forms)](https://github.com/ngx-vest-forms/ngx-vest-forms/actions)

## What You Get for Free

ngx-vest-forms eliminates the tedious parts of form development:

| Feature                 | Without ngx-vest-forms                                    | With ngx-vest-forms                      |
| ----------------------- | --------------------------------------------------------- | ---------------------------------------- |
| **ARIA Attributes**     | 15+ lines per field (aria-invalid, aria-describedby, IDs) | ✅ **Automatic**                         |
| **Form Busy State**     | Manual aria-busy bindings on every form                   | ✅ **Automatic**                         |
| **Error Display**       | Custom component + state management                       | ✅ **Built-in `<ngx-form-error>`**       |
| **Touch Detection**     | Manual blur handlers + state tracking                     | ✅ **Automatic**                         |
| **Async Validation**    | Race conditions + AbortController wiring                  | ✅ **Built-in with `test.memo()`**       |
| **Field Signals**       | Manual wiring (value, valid, errors, etc.)                | ✅ **Auto-generated proxies**            |
| **Auto-preventDefault** | Manual event.preventDefault() on submit                   | ✅ **Automatic via `[ngxVestForm]`**     |
| **Structured Errors**   | Manual error parsing for i18n                             | ✅ **Built-in structured errors (v2.0)** |
| **Code per Field**      | ~20-30 lines                                              | **~3-5 lines**                           |
| **WCAG 2.2 Compliance** | Manual implementation                                     | ✅ **By default**                        |

**Result:** Write **80% less code** with **better accessibility** than handwritten forms.

## 🤔 Why ngx-vest-forms vs Angular Forms?

ngx-vest-forms takes a **validation-first approach** that decouples validation logic from Angular's form primitives, offering superior flexibility and developer experience compared to NgForm/NgModel or Reactive Forms.

### Quick Comparison

| Feature                          | NgForm/NgModel                        | ngx-vest-forms                                       | Winner             |
| -------------------------------- | ------------------------------------- | ---------------------------------------------------- | ------------------ |
| **Validation Logic Portability** | ❌ Coupled to Angular validators      | ✅ Vest suites work anywhere (Node.js, React, tests) | **ngx-vest-forms** |
| **Async Validation**             | ⚠️ Custom AsyncValidator (100+ lines) | ✅ Built-in (debounce, cancel, memo)                 | **ngx-vest-forms** |
| **Cross-Field Validation**       | ❌ Custom FormGroup validator         | ✅ Declarative `include.when`                        | **ngx-vest-forms** |
| **Type Safety**                  | ❌ String-based field access          | ✅ Auto-generated type-safe proxies                  | **ngx-vest-forms** |
| **WCAG 2.2 Compliance**          | ⚠️ Manual ARIA implementation         | ✅ Automatic ARIA attributes                         | **ngx-vest-forms** |
| **Learning Curve**               | ✅ Low (Angular docs)                 | ⚠️ Medium (learn Vest.js)                            | **NgForm**         |
| **Simple Forms**                 | ✅ Minimal boilerplate                | ⚠️ More setup required                               | **NgForm**         |
| **Ecosystem**                    | ✅ Angular Material, PrimeNG          | ⚠️ Manual integration                                | **NgForm**         |

### Decision Matrix

**✅ Use ngx-vest-forms when:**

- You need **complex validation** (async, cross-field, conditional)
- **Validation portability** is important (share with backend/tests)
- **WCAG 2.2 compliance** is mandatory
- Building **production applications** with robust UX requirements
- **Type safety** is critical

**✅ Use NgForm/NgModel when:**

- Building **simple forms** (1-3 fields, basic validation)
- **Rapid prototyping** (speed over structure)
- Team is **unfamiliar with Vest.js**
- Need **third-party component integration** (Angular Material, PrimeNG)

### 📚 Documentation & Strategic Direction

**Architecture & Comparison:**

- **[Architecture Comparison](./docs/ARCHITECTURE_COMPARISON.md)** - Detailed comparison with NgForm/NgModel, examples, and migration guides
- **[Strategic Overview](./docs/NGX_VEST_FORMS_STRATEGIC_OVERVIEW.md)** - TL;DR strategic decisions, Angular Signal Forms compatibility, Standard Schema integration, roadmap

**Angular Signal Forms Compatibility:**

- **Philosophy Alignment:** 100% ✅ - Both use developer-owned signals, bidirectional sync, and Angular 20+ best practices
- **Implementation:** Intentionally different 🎯 - Enhanced Proxy API and Vest.js portability are unique advantages
- **Standard Schema Support:** Coming soon - Type validation layer (Zod, Valibot, ArkType) to complement Vest.js

**Additional Resources:**

- **[Integration Feasibility Analysis](./docs/INTEGRATION_FEASIBILITY_ANALYSIS.md)** - Detailed analysis of NgForm integration, core abstraction, and Signal Forms alignment paths
- **[Standard Schema Adapters Guide](./docs/STANDARD_SCHEMA_ADAPTERS_GUIDE.md)** - Comprehensive implementation guide for dual-layer validation (type + business logic)

## 📦 Installation

```bash
npm install ngx-vest-forms vest
```

> **Note:** ngx-vest-forms uses native `(submit)` events with automatic `preventDefault()` handling.
>
> - ✅ **Use `[ngxVestForm]` directive** - Automatically prevents page reload on submit
> - ❌ **Don't use `(ngSubmit)`** - Requires Angular Forms (not used in ngx-vest-forms)
> - ⚠️ **Without `[ngxVestForm]`** - Must manually call `event.preventDefault()`

## ⚡ Quick Start

Learn ngx-vest-forms progressively - start simple and add features as needed!

### Level 1: Basic Form (Core Validation)

Start with the **core validation logic** - no Angular directives, no accessibility helpers:

```typescript
import { Component, signal } from '@angular/core';
import { createVestForm, staticSafeSuite } from 'ngx-vest-forms/core';
import { test, enforce } from 'vest';

// 1. Define validation rules
const contactSuite = staticSafeSuite((data = {}) => {
  test('email', 'Email is required', () => {
    enforce(data.email).isNotEmpty();
  });
  test('email', 'Invalid email format', () => {
    enforce(data.email).isEmail();
  });
});

// 2. Create form component
@Component({
  selector: 'app-contact',
  template: `
    <form (submit)="save($event)">
      <label for="email">Email</label>
      <input
        id="email"
        type="email"
        [value]="form.email() ?? ''"
        (input)="form.setEmail($event)"
      />
      @if (form.emailShowErrors() && form.emailValidation().errors.length) {
        <p role="alert">{{ form.emailValidation().errors[0] }}</p>
      }

      <button type="submit" [disabled]="form.pending()">Submit</button>
    </form>
  `,
})
export class ContactFormComponent {
  protected readonly form = createVestForm(signal({ email: '' }), contactSuite);

  protected save = async (event: Event) => {
    event.preventDefault();
    const result = await this.form.submit();
    if (result.valid) {
      console.log('✅ Valid:', result.data);
    }
  };
}
```

**What you get:**

- ✅ Type-safe validation with Vest.js
- ✅ Auto-generated field signals (`form.email()`, `form.emailValidation()`)
- ✅ Submit handling with validation
- ✅ ~30 lines of code

**What's missing:**

- ❌ Accessibility attributes (aria-invalid, aria-describedby)
- ❌ Touch state management (errors show immediately)
- ❌ Styled error components

---

### Level 2: Add Form Field Wrapper (Better UX)

Add the **form-field component** for consistent layout and automatic error display:

```bash
npm install ngx-vest-forms-form-field
```

```typescript
import { Component, signal } from '@angular/core';
import { createVestForm, staticSafeSuite } from 'ngx-vest-forms/core';
import { NgxVestFormField } from 'ngx-vest-forms/form-field';
import { test, enforce } from 'vest';

const contactSuite = staticSafeSuite((data = {}) => {
  test('email', 'Email is required', () => {
    enforce(data.email).isNotEmpty();
  });
  test('email', 'Invalid email format', () => {
    enforce(data.email).isEmail();
  });
});

@Component({
  selector: 'app-contact',
  imports: [NgxVestFormField],
  template: `
    <form (submit)="save($event)">
      <ngx-vest-form-field [field]="form.emailField()">
        <label for="email">Email</label>
        <input
          id="email"
          type="email"
          [value]="form.email() ?? ''"
          (input)="form.setEmail($event)"
        />
        <!-- Error display is automatic! -->
      </ngx-vest-form-field>

      <button type="submit" [disabled]="form.pending()">Submit</button>
    </form>
  `,
})
export class ContactFormComponent {
  protected readonly form = createVestForm(signal({ email: '' }), contactSuite);

  protected save = async (event: Event) => {
    event.preventDefault();
    const result = await this.form.submit();
    if (result.valid) {
      console.log('✅ Valid:', result.data);
    }
  };
}
```

**What you get additionally:**

- ✅ **Automatic error display** (no manual `@if` blocks)
- ✅ **Consistent layout** via CSS custom properties
- ✅ **Cleaner template** markup
- ✅ ~25 lines of code (5 lines less!)

**Still missing:**

- ❌ Accessibility attributes
- ❌ Touch state management

---

### Level 3: Add Type Validation (Schema Layer)

Add **schema validation** for type-level checks with Zod, Valibot, or ArkType:

```typescript
import { Component, signal } from '@angular/core';
import { createVestForm, staticSafeSuite } from 'ngx-vest-forms/core';
import { NgxVestFormField } from 'ngx-vest-forms/form-field';
import { type InferOutput } from 'ngx-vest-forms/schemas';
import { z } from 'zod';
import { test, enforce } from 'vest';

// 1. Define schema for type validation with .default() values
const ContactSchema = z.object({
  email: z.string().email().default(''),
  message: z.string().min(10).default(''),
});

// 2. Infer TypeScript type from schema
type ContactModel = InferOutput<typeof ContactSchema>;

// 3. Create initial values helper
function createInitialContact(): ContactModel {
  return ContactSchema.parse({}); // Uses .default() values
}

// 4. Define Vest suite for business logic (async, cross-field, etc.)
const contactSuite = staticSafeSuite<ContactModel>((data) => {
  test('email', 'Email already taken', async ({ signal }) => {
    const response = await fetch(`/api/check-email/${data.email}`, { signal });
    if (!response.ok) throw new Error();
  });
});

// 5. Create form with dual-layer validation
@Component({
  selector: 'app-contact',
  imports: [NgxVestFormField],
  template: `
    <form (submit)="save($event)">
      <ngx-vest-form-field [field]="form.emailField()">
        <label for="email">Email</label>
        <input
          id="email"
          type="email"
          [value]="form.email() ?? ''"
          (input)="form.setEmail($event)"
        />
      </ngx-vest-form-field>

      <ngx-vest-form-field [field]="form.messageField()">
        <label for="message">Message</label>
        <textarea
          id="message"
          [value]="form.message() ?? ''"
          (input)="form.setMessage($event)"
        ></textarea>
      </ngx-vest-form-field>

      <button type="submit" [disabled]="form.pending()">Submit</button>
    </form>
  `,
})
export class ContactFormComponent {
  protected readonly form = createVestForm(
    createInitialContact(), // ← Uses schema defaults
    contactSuite,
    { schema: ContactSchema }, // ← Type validation layer
  );

  protected save = async (event: Event) => {
    event.preventDefault();
    const result = await this.form.submit();
    if (result.valid) {
      console.log('✅ Valid:', result.data);
    }
  };
}
```

**What you get additionally:**

- ✅ **Type-level validation** (format, structure checks)
- ✅ **Business logic validation** (async API checks, cross-field rules)
- ✅ **Unified error handling** (schema + Vest errors combined)
- ✅ **Standard Schema support** (Zod 3.24+, Valibot 1.0+, ArkType 2.0+)

> **Note:** No adapter wrappers needed! Modern schema libraries natively implement [StandardSchemaV1](https://standardschema.dev/).

---

### Level 4: Full Production Setup (Recommended) 🌟

Add **all accessibility features** with the `NgxVestForms` constant:

```typescript
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { createVestForm, staticSafeSuite, NgxVestForms } from 'ngx-vest-forms';
import { NgxVestFormField } from 'ngx-vest-forms/form-field';
import { type InferOutput } from 'ngx-vest-forms/schemas';
import { z } from 'zod';
import { test } from 'vest';

const ContactSchema = z.object({
  email: z.string().email().default(''),
  message: z.string().min(10).default(''),
});

type ContactModel = InferOutput<typeof ContactSchema>;

function createInitialContact(): ContactModel {
  return ContactSchema.parse({});
}

const contactSuite = staticSafeSuite<ContactModel>((data) => {
  test('email', 'Email already taken', async ({ signal }) => {
    const response = await fetch(`/api/check-email/${data.email}`, { signal });
    if (!response.ok) throw new Error();
  });
});

@Component({
  selector: 'app-contact',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxVestForms, NgxVestFormField], // ← ONE import for all directives
  template: `
    <form [ngxVestForm]="form" (submit)="save($event)">
      <ngx-vest-form-field [field]="form.emailField()">
        <label for="email">Email</label>
        <input
          id="email"
          type="email"
          [value]="form.email() ?? ''"
          (input)="form.setEmail($event)"
        />
      </ngx-vest-form-field>

      <ngx-vest-form-field [field]="form.messageField()">
        <label for="message">Message</label>
        <textarea
          id="message"
          [value]="form.message() ?? ''"
          (input)="form.setMessage($event)"
        ></textarea>
      </ngx-vest-form-field>

      <button type="submit" [disabled]="form.pending()">Submit</button>
    </form>
  `,
})
export class ContactFormComponent {
  protected readonly form = createVestForm(
    createInitialContact(),
    contactSuite,
    { schema: ContactSchema },
  );

  protected save = async (event: Event) => {
    event.preventDefault();
    const result = await this.form.submit();
    if (result.valid) {
      console.log('✅ Valid:', result.data);
    }
  };
}
```

**The `[ngxVestForm]` directive automatically adds:**

- ✅ **ARIA Attributes** - `aria-invalid`, `aria-describedby` on inputs
- ✅ **Touch Management** - Errors appear **after blur** (progressive disclosure)
- ✅ **Form Busy State** - `aria-busy="true"` during async validation
- ✅ **WCAG 2.2 Level AA** - Full accessibility compliance

**Complete feature checklist:**

- ✅ Type-safe validation (Vest.js + Schema)
- ✅ Auto-generated field signals
- ✅ Automatic error display
- ✅ Consistent layout
- ✅ Full accessibility (WCAG 2.2)
- ✅ Touch state management
- ✅ Dark mode support
- ✅ **80% less code** than manual implementation

---

## 📊 Quick Comparison

| Level       | Code Lines | Features              | Best For             |
| ----------- | ---------- | --------------------- | -------------------- |
| **Level 1** | ~30        | Core validation       | Learning, prototypes |
| **Level 2** | ~25        | + Auto errors, layout | Internal tools       |
| **Level 3** | ~40        | + Type validation     | Complex forms        |
| **Level 4** | ~45        | + Full accessibility  | **Production apps**  |

**Recommendation:** Start with **Level 1** to learn the API, then jump to **Level 4** for production applications.

## 🎯 Core Concepts

### The NgxVestForms Constant

Import **one constant** to get all convenience features:

```typescript
import { NgxVestForms } from 'ngx-vest-forms';

@Component({
  imports: [NgxVestForms], // Includes:
  // - NgxVestFormDirective (applies all directives via [ngxVestForm])
  // - NgxVestAutoAriaDirective (auto aria-invalid + aria-describedby)
  // - NgxVestAutoTouchDirective (auto touch detection)
  // - NgxVestFormBusyDirective (auto aria-busy on forms)
  // - NgxFormErrorComponent (styled error display)
})
```

**Benefits:**

- Type-safe (typed as `const` array)
- Tree-shakeable (only what you use)
- Single import line vs. three separate imports

### Import Paths Guide

Choose the right entry point for your use case:

#### Main Entry Point (Recommended)

```typescript
// ✅ Use for most applications
import { createVestForm, NgxVestForms, staticSafeSuite } from 'ngx-vest-forms';
```

**Includes:** All core functions + directives + components
**When to use:** Default choice for 95% of applications
**Bundle size:** ~5KB (includes UI components)

#### Core-Only Entry Point (Advanced)

```typescript
// ⚠️ Use only when building custom UI layer
import { createVestForm, staticSafeSuite } from 'ngx-vest-forms/core';
```

**Includes:** Only core validation logic (no Angular directives/components)
**When to use:** Building custom design system or need maximum tree-shaking
**Bundle size:** ~3KB (validation logic only)
**Trade-off:** Must implement your own ARIA attributes and error display

#### Bundle Entry Point (All Features)

```typescript
// 📦 Convenience import for everything
import {
  createVestForm,
  NgxVestForms,
  staticSafeSuite,
} from 'ngx-vest-forms/bundle';
```

**Includes:** Core + all optional packages (schemas, smart-state, etc.)
**When to use:** Using schema adapters (Zod, Valibot) or smart state features
**Bundle size:** ~8-10KB (all features)

#### Form Field Component (Optional)

```typescript
// 🎨 Layout wrapper with automatic error display
import { NgxVestFormField } from 'ngx-vest-forms/form-field';
```

**Includes:** Form field wrapper component
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

### Field Signals API (Auto-Generated)

The form proxy automatically creates signals for every field:

```typescript
const form = createVestForm(
  signal({ email: '', profile: { name: '', age: 0 } }),
  suite,
);

// ✅ Value signals (read-only)
form.email(); // Signal<string>
form.profileName(); // Nested: profile.name → profileName()

// ✅ Validation signals (computed, read-only)
form.emailValid(); // Signal<boolean> - no errors AND no pending
form.emailInvalid(); // Signal<boolean> - has errors (NEW in v2.0)
form.emailDirty(); // Signal<boolean> - value changed from initial (NEW in v2.0)
form.emailValidation(); // Signal<{ errors: string[], warnings: string[], structuredErrors?: StructuredValidationError[] }> (NEW in v2.0)
form.emailTouched(); // Signal<boolean>
form.emailPending(); // Signal<boolean> - async validation in progress
form.emailShowErrors(); // Signal<boolean> - based on error strategy

// ✅ Field object (for advanced usage)
form.emailField(); // Complete field state for <ngx-form-error>

// ✅ Setters and operations (handle Events or raw values)
form.setEmail($event); // Accepts DOM Event from (input)
form.setEmail('test@example.com'); // Or raw value
form.markAsTouchedEmail(); // Mark as touched (NEW in v2.0)
form.markAsDirtyEmail(); // Mark as dirty (NEW in v2.0)
form.resetEmail(); // Reset to initial value

// ✅ Form-level signals (NEW in v2.0)
form.valid(); // Signal<boolean> - entire form is valid
form.invalid(); // Signal<boolean> - form has errors
form.dirty(); // Signal<boolean> - any field changed
form.submittedStatus(); // Signal<'unsubmitted' | 'submitting' | 'submitted'>
form.pending(); // Signal<boolean> - any async validation pending
```

**📚 [Complete Field State Guide](./projects/examples/docs/FIELD_STATES.md)** - In-depth explanation of `dirty()` vs `touched()`, `invalid()` vs `!valid()`, when to use `markAsDirty()` vs `markAsTouched()`, decision matrix, and real-world patterns including warning display.

### Structured Validation Errors (NEW in v2.0)

ngx-vest-forms now provides **machine-readable structured errors** for better i18n support and error handling:

```typescript
const validation = form.emailValidation();

// String errors (classic)
validation.errors; // ['Email is required', 'Invalid email format']

// Structured errors (NEW - machine-readable with kind property)
validation.structuredErrors; // [
//   { kind: 'required', message: 'Email is required' },
//   { kind: 'email', message: 'Invalid email format' }
// ]

// Use in templates for internationalization
@for (error of form.emailValidation().structuredErrors; track error.kind) {
  @switch (error.kind) {
    @case ('required') {
      <p>{{ 'validation.required' | translate }}</p>
    }
    @case ('email') {
      <p>{{ 'validation.email' | translate }}</p>
    }
    @case ('minlength') {
      <p>{{ 'validation.minlength' | translate: error.params }}</p>
    }
    @default {
      <p>{{ error.message }}</p>
    }
  }
}
```

**Supported error kinds:**

- `required`, `email`, `minlength`, `maxlength`, `min`, `max`, `pattern`, `url`, `number`, `integer`, `match`, `custom`

**Benefits:**

- ✅ Type-safe error handling with `error.kind`
- ✅ i18n-ready (translate by kind, not by message)
- ✅ Extract params (e.g., `{ minlength: 8 }` for parameterized messages)
- ✅ Consistent error detection across Vest and schema validation

## 🔄 Angular Signal Forms API Alignment

ngx-vest-forms is **fully aligned** with [Angular Signal Forms](https://angular.dev/guide/forms/signal-forms) API design principles while adding Vest.js validation superpowers.

### ✅ API Compatibility Matrix

| Feature                     | Angular Signal Forms       | ngx-vest-forms                      | Status                       |
| --------------------------- | -------------------------- | ----------------------------------- | ---------------------------- |
| **Developer-Owned Signals** | ✅ `signal({ email: '' })` | ✅ `signal({ email: '' })`          | **100% Compatible**          |
| **Bidirectional Sync**      | ✅ Auto two-way binding    | ✅ Auto two-way binding             | **100% Compatible**          |
| **Value Access**            | `field().value()`          | `form.email()`                      | **Enhanced (Proxy)**         |
| **Validation State**        | `field().valid()`          | `form.emailValid()`                 | **Enhanced (Proxy)**         |
| **Mark Touched**            | `field().markAsTouched()`  | `form.markAsTouchedEmail()`         | **100% Compatible**          |
| **Mark Dirty**              | `field().markAsDirty()`    | `form.markAsDirtyEmail()`           | **100% Compatible**          |
| **Invalid State**           | `field().invalid()`        | `form.emailInvalid()`               | **Enhanced (Proxy)**         |
| **Dirty State**             | `field().dirty()`          | `form.emailDirty()`                 | **Enhanced (Proxy)**         |
| **Submitted Status**        | ❌ Not available           | ✅ `form.submittedStatus()`         | **ngx-vest-forms Exclusive** |
| **Structured Errors**       | ❌ Not available           | ✅ `.validation().structuredErrors` | **ngx-vest-forms Exclusive** |
| **Validation Engine**       | Validator functions        | Vest.js suites                      | **Different (Intentional)**  |

### Key Distinctions

**🎯 Where We're The Same:**

1. **Signals-First Philosophy** - Both use developer-owned signals, not framework-managed state
2. **Bidirectional Sync** - Changes in model signal → update form, changes in form → update model signal
3. **Method Naming** - `markAsTouched()`, `markAsDirty()`, `reset()` - identical API
4. **Angular 20+ Best Practices** - Standalone components, OnPush change detection, inject() DI

**🚀 Where We're Enhanced:**

1. **Proxy Field Access** - `form.email()` instead of `form.field('email').value()` (syntactic sugar)
2. **Vest.js Validation** - Portable validation logic (works in Node.js, React, tests)
3. **Async Validation** - Built-in `test.memo()`, `skipWhen()`, AbortSignal handling
4. **Cross-Field Rules** - Declarative `include.when()` for dependent validations
5. **Type + Business Logic** - Dual-layer validation (Zod/Valibot + Vest.js)
6. **Structured Errors** - `.validation()` returns `{ errors: string[], warnings: string[] }`
7. **Submitted Status** - Track form submission attempts with `submittedStatus()` signal

**Example Side-by-Side:**

```typescript
// Angular Signal Forms
const emailField = field('email', { value: '' });
const isValid = emailField().valid();
const isTouched = emailField().touched();
emailField().markAsTouched();

// ngx-vest-forms (Explicit API - same pattern)
const form = createVestForm(signal({ email: '' }), { suite });
const isValid = form.field('email').valid();
const isTouched = form.field('email').touched();
form.field('email').markAsTouched();

// ngx-vest-forms (Enhanced Proxy API - more ergonomic)
const form = createVestForm(signal({ email: '' }), { suite });
const isValid = form.emailValid(); // ← Proxy-generated signal
const isTouched = form.emailTouched(); // ← Proxy-generated signal
form.markAsTouchedEmail(); // ← Proxy-generated method (NEW in v2.0)
```

### Why Different Validation Engines?

Angular Signal Forms uses **validator functions** (similar to Reactive Forms):

```typescript
// Angular Signal Forms
const emailField = field('email', {
  value: '',
  validators: [Validators.required, Validators.email],
});
```

ngx-vest-forms uses **Vest.js suites** for **portability and power**:

```typescript
// ngx-vest-forms - Same validation logic works ANYWHERE
export const suite = staticSafeSuite((data = {}) => {
  test('email', 'Required', () => enforce(data.email).isNotEmpty());
  test('email', 'Invalid format', () => enforce(data.email).isEmail());

  // ✅ Advanced features Angular validators can't do easily:
  skipWhen(
    (res) => res.hasErrors('email'),
    () => {
      test('email', 'Already taken', async ({ signal }) => {
        await fetch(`/api/check/${data.email}`, { signal });
      });
    },
  );
});

// Works in Angular, Node.js, React, tests - same code!
```

### Migration Path from Angular Signal Forms

If you're coming from Angular Signal Forms, the transition is smooth:

1. **Keep your signal-based model** - `signal({ email: '', age: 0 })` works as-is
2. **Replace validators with Vest suite** - More powerful, portable validation
3. **Optionally use Proxy API** - Or stick with `.field('email')` explicit access
4. **Add accessibility for free** - `[ngxVestForm]` directive auto-handles ARIA

**📚 Learn More:**

- [Angular Signal Forms API Analysis](./docs/ANGULAR_SIGNAL_FORMS_API_ANALYSIS.md) - Detailed comparison
- [Strategic Overview](./docs/NGX_VEST_FORMS_STRATEGIC_OVERVIEW.md) - Design decisions and roadmap

## �🔍 Enhanced Proxy API

The `form.email()` syntax you see throughout this documentation is powered by **JavaScript Proxy objects** that auto-generate field accessors. This is the **default behavior** when you call `createVestForm()`.

### Browser Compatibility

- ✅ **Supported:** Chrome 49+, Firefox 18+, Safari 10+, Edge 12+, Node.js 6+
- ❌ **Not Supported:** Internet Explorer (all versions)

### When to Use

✅ **Use Enhanced Proxy (Default) when:**

- Building modern Angular applications with signals
- Want cleaner, more ergonomic field access syntax (`form.email()` vs `form.field('email').value()`)
- Working in modern browsers (95%+ global coverage)
- Performance overhead (~1-2ms per access) is acceptable

❌ **Use Explicit API when:**

- Need Internet Explorer compatibility
- Maximum performance is critical (high-frequency updates)
- Working with very large forms (1000+ fields)

### Explicit API Alternative

For IE support or when you need the base API without Proxy enhancement:

```typescript
// Enhanced API (default - what you see in examples)
const emailValue = form.email(); // Signal<string>
const isValid = form.emailValid(); // Signal<boolean>
form.setEmail('user@example.com'); // Setter

// Explicit API (IE-compatible, no Proxy)
const emailValue = form.field('email').value(); // Signal<string>
const isValid = form.field('email').valid(); // Signal<boolean>
form.field('email').set('user@example.com'); // Setter
```

Both APIs are **always available** - the Enhanced Proxy is just syntactic sugar over the explicit API.

**📚 [Complete Enhanced Proxy Documentation](./docs/enhanced-proxy.md)** - Performance considerations, field filtering, troubleshooting, and advanced usage patterns.

## 🎨 Optional: Form Field Component

For even cleaner markup, use the **NgxVestFormField** component that combines labels, inputs, and automatic error display:

```bash
npm install ngx-vest-forms-form-field
```

### Usage Comparison

**Without Form Field (Manual):**

```html
<div class="form-field">
  <label for="email">Email</label>
  <input id="email" [value]="form.email()" (input)="form.setEmail($event)" />
  <ngx-form-error [field]="form.emailField()" />
</div>
```

**With Form Field (Simplified):**

```html
<ngx-vest-form-field [field]="form.emailField()">
  <label for="email">Email</label>
  <input id="email" [value]="form.email()" (input)="form.setEmail($event)" />
</ngx-vest-form-field>
```

### Features

- ✅ **Automatic Error Display** - No need to manually add `<ngx-form-error>`
- ✅ **Consistent Layout** - Standardized spacing via CSS custom properties
- ✅ **Works Without Validation** - Can be used for layout consistency only
- ✅ **Themeable** - CSS custom properties with dark mode support
- ✅ **Flexible** - Works with any input type (text, select, textarea, etc.)

### Example Usage

```typescript
import { Component, signal } from '@angular/core';
import { createVestForm, NgxVestForms } from 'ngx-vest-forms';
import { NgxVestFormField } from 'ngx-vest-forms/form-field';

@Component({
  imports: [NgxVestForms, NgxVestFormField],
  template: `
    <form [ngxVestForm]="form" (submit)="save($event)">
      <ngx-vest-form-field [field]="form.emailField()">
        <label for="email">Email *</label>
        <input
          id="email"
          type="email"
          [value]="form.email()"
          (input)="form.setEmail($event)"
        />
      </ngx-vest-form-field>

      <ngx-vest-form-field [field]="form.messageField()">
        <label for="message">Message *</label>
        <textarea
          id="message"
          [value]="form.message()"
          (input)="form.setMessage($event)"
        ></textarea>
      </ngx-vest-form-field>

      <button type="submit">Send</button>
    </form>
  `,
})
export class ContactForm {
  form = createVestForm(validations, signal({ email: '', message: '' }));

  async save(event: Event) {
    event.preventDefault();
    const result = await this.form.submit();
    if (result.valid) console.log('✅', result.data);
  }
}
```

**📚 [Full Form Field Documentation](./projects/ngx-vest-forms/form-field/README.md)**

## Styling & Theming

ngx-vest-forms components are fully customizable through CSS custom properties. Both the error display and form field wrapper provide extensive theming options.

### Quick Start: Basic Theming

```css
:root {
  /* Error component colors (NgxFormErrorComponent) */
  --ngx-vest-forms-error-color: #dc2626;
  --ngx-vest-forms-warning-color: #f59e0b;

  /* Form field layout (NgxVestFormField) */
  --ngx-vest-form-field-gap: 0.5rem;
  --ngx-vest-form-field-margin: 1rem;
}
```

### NgxFormErrorComponent Styling

The error display component supports:

- **Colors**: Error/warning text, backgrounds, and borders
- **Spacing**: Gaps, padding, and margins
- **Typography**: Font size and line height
- **Borders**: Width and radius

#### Example: Filled Style with Borders

```css
:root {
  --ngx-vest-forms-error-color: #991b1b; /* Red-800 */
  --ngx-vest-forms-error-bg: #fef2f2; /* Red-50 */
  --ngx-vest-forms-error-border: #fca5a5; /* Red-300 */
  --ngx-vest-forms-border-width: 1px;
  --ngx-vest-forms-border-radius: 0.5rem;
  --ngx-vest-forms-padding: 0.75rem;
}
```

#### Example: Dark Mode

```css
@media (prefers-color-scheme: dark) {
  :root {
    --ngx-vest-forms-error-color: #fca5a5; /* Red-300 */
    --ngx-vest-forms-error-bg: #7f1d1d; /* Red-900 */
    --ngx-vest-forms-error-border: #991b1b; /* Red-800 */
  }
}
```

**📚 [Complete Error Styling Documentation](./projects/ngx-vest-forms/core/README.md#styling-ngxformerrorcomponent)**

### NgxVestFormField Styling

The form field wrapper provides layout customization:

- **Gap**: Spacing between label/input and error messages
- **Margin**: Bottom margin of field wrappers
- **Content Gap**: Spacing between label and input

#### Example: Spacious Layout

```css
:root {
  --ngx-vest-form-field-gap: 0.75rem; /* 12px */
  --ngx-vest-form-field-margin: 2rem; /* 32px */
  --ngx-vest-form-field-content-gap: 0.5rem; /* 8px */
}
```

#### Example: Tailwind Integration

```css
:root {
  --ngx-vest-form-field-gap: theme('spacing.3');
  --ngx-vest-form-field-margin: theme('spacing.6');
}
```

**📚 [Complete Form Field Styling Documentation](./projects/ngx-vest-forms/form-field/README.md#custom-styling)**

### Complete Theming Example

Combine both components for a cohesive design:

```typescript
@Component({
  selector: 'app-themed-form',
  imports: [NgxVestForms, NgxVestFormField],
  styles: `
    /* Layout */
    :host {
      --ngx-vest-form-field-gap: 0.5rem;
      --ngx-vest-form-field-margin: 1.5rem;

      /* Error styling */
      --ngx-vest-forms-error-color: #dc2626;
      --ngx-vest-forms-error-bg: #fef2f2;
      --ngx-vest-forms-error-border: #fca5a5;
      --ngx-vest-forms-border-width: 1px;
      --ngx-vest-forms-border-radius: 0.375rem;
      --ngx-vest-forms-padding: 0.5rem;
    }

    /* Dark mode */
    @media (prefers-color-scheme: dark) {
      :host {
        --ngx-vest-forms-error-color: #fca5a5;
        --ngx-vest-forms-error-bg: #7f1d1d;
        --ngx-vest-forms-error-border: #991b1b;
      }
    }

    /* Custom input styles */
    input,
    textarea {
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      padding: 0.5rem;
    }

    input:focus,
    textarea:focus {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
    }
  `,
  template: `
    <form [ngxVestForm]="form" (submit)="save($event)">
      <ngx-vest-form-field [field]="form.emailField()">
        <label for="email">Email</label>
        <input
          id="email"
          [value]="form.email()"
          (input)="form.setEmail($event)"
        />
      </ngx-vest-form-field>
    </form>
  `,
})
export class ThemedFormComponent {
  /* ... */
}
```

### Accessibility Features

Both components include built-in WCAG 2.2 Level AA compliance:

- **ARIA Live Regions**: Errors use `role="alert"` (assertive), warnings use `role="status"` (polite)
- **High Contrast Mode**: Automatically increases border width
- **Reduced Motion**: Respects `prefers-reduced-motion`
- **Color Contrast**: Default colors meet 4.5:1 ratio requirement

### Automatic Accessibility

The `NgxVestAutoAriaDirective` (included in `NgxVestForms`) adds ARIA attributes automatically:

```typescript
// Your template (what you write):
<input
  id="email"
  [value]="form.email()"
  (input)="form.setEmail($event)"
/>
<ngx-form-error [field]="form.emailField()" />

// Rendered HTML (what users get):
<input
  id="email"
  value="test@example.com"
  aria-invalid="true"          // ← Added automatically!
  aria-describedby="email-error" // ← Links to error message!
/>
<p id="email-error" role="alert">Invalid email format</p>
```

**How it works:**

- Detects `[value]` or `[checked]` bindings on inputs
- Finds parent form with `createVestForm`
- Extracts field name from setter calls (e.g., `form.setEmail($event)`)
- Updates `aria-invalid` and `aria-describedby` reactively
- Uses string `"true"` (not boolean) per ARIA 1.2 spec
- Preserves existing IDs (e.g., hint text)

**Special handling:**

- Radio buttons: Only first in group gets `aria-describedby` (prevents repetitive announcements)
- Manual override: Detects static `aria-invalid` or `aria-describedby` attributes and skips automation

### Automatic Form Busy State

The `NgxVestFormBusyDirective` (included in `NgxVestForms`) adds `aria-busy` to forms automatically:

```typescript
// Your template (what you write):
<form (submit)="save($event)">
  <input id="email" [value]="form.email()" (input)="form.setEmail($event)" />
  <button type="submit" [disabled]="form.pending() || form.submitting()">
    {{ form.submitting() ? 'Saving...' : 'Submit' }}
  </button>
</form>

// Rendered HTML during async operations:
<form aria-busy="true"> <!-- ← Added automatically! -->
  <input id="email" value="test@example.com" />
  <button type="submit" disabled>Saving...</button>
</form>
```

**How it works:**

- Detects `<form>` elements with `createVestForm` provider
- Monitors `form.pending()` and `form.submitting()` states
- Updates `aria-busy` reactively (string `"true"` per ARIA 1.2 spec)
- Removes attribute when form is not busy
- Informs assistive technologies about async operations

**Opt-out:**

```typescript
// Disable for specific form
<form ngxVestAutoFormBusyDisabled [attr.aria-busy]="customLogic()">
  <!-- Manual control -->
</form>

// Disable globally
provideNgxVestFormsConfig({ autoFormBusy: false })
```

### Error Display Strategies

Control **when** validation errors appear:

```typescript
const form = createVestForm(suite, model, {
  errorStrategy: 'on-touch', // Default - best UX
});
```

| Strategy      | Errors Show              | Use Case                               |
| ------------- | ------------------------ | -------------------------------------- |
| `'immediate'` | As user types            | Real-time feedback (password strength) |
| `'on-touch'`  | After blur **or** submit | **Recommended** - balanced UX          |
| `'on-submit'` | Only after submit        | Minimal interruption                   |
| `'manual'`    | Via `touchField()`       | Custom flows                           |

**Important:** The `on-touch` strategy shows errors for **all fields** (even untouched) after submit. This ensures accessibility - users can discover what's wrong by attempting submission (WCAG 2.2 guideline).

### Advanced: Dynamic Error Strategy

Most applications use a static strategy. For demo apps or admin panels where users need to switch error modes at runtime, you can pass a signal:

```typescript
const errorMode = signal<ErrorDisplayStrategy>('on-touch');

const form = createVestForm(suite, model, {
  errorStrategy: errorMode, // Pass signal reference (not errorMode())
});

// Switch at runtime - form reacts automatically
errorMode.set('immediate');
```

> **Note:** Pass the signal itself (`errorMode`), not the called value (`errorMode()`). The latter evaluates once and won't react to changes.

### Nested Forms & ID Convention

When using Enhanced Field Signals with nested object structures, follow the **camelCase ID convention** for automatic field resolution:

```typescript
// Model structure
const model = signal({
  personalInfo: {
    firstName: '',
    lastName: '',
    email: ''
  },
  address: {
    street: '',
    city: ''
  }
});

// ✅ CORRECT: Use camelCase IDs matching accessor names
<input
  id="personalInfoFirstName"
  [value]="form.personalInfoFirstName()"
  (input)="form.setPersonalInfoFirstName($event)"
/>

<input
  id="addressStreet"
  [value]="form.addressStreet()"
  (input)="form.setAddressStreet($event)"
/>

// ❌ WRONG: Don't use simple IDs for nested fields
<input
  id="firstName"  <!-- Won't auto-resolve to personalInfo.firstName -->
  [value]="form.personalInfoFirstName()"
/>
```

**How it works:** The `NgxVestAutoTouchDirective` (included in `NgxVestForms`) automatically resolves camelCase IDs to nested paths using the Enhanced Field Signals registry:

- `personalInfoFirstName` → `personalInfo.firstName`
- `addressInfoStreet` → `addressInfo.street`
- No manual `data-vest-field` attributes needed!

**Development tip:** Enable strict field resolution to catch ID naming mistakes early:

```typescript
// app.config.ts
provideNgxVestFormsConfig({
  strictFieldResolution: !environment.production, // Throws errors in dev, warns in prod
});
```

## 🚀 Advanced Usage

### Without Convenience Directives (Full Manual Control)

If you need complete control over ARIA attributes, error display, and styling, you can opt out of `NgxVestForms` and build everything yourself:

```typescript
import {
  Component,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { createVestForm, staticSafeSuite } from 'ngx-vest-forms';
import { test, enforce } from 'vest';

const loginSuite = staticSafeSuite((data = {}) => {
  test('email', 'Email is required', () => {
    enforce(data.email).isNotEmpty();
  });
  test('email', 'Invalid email format', () => {
    enforce(data.email).isEmail();
  });
  test('password', 'Password is required', () => {
    enforce(data.password).isNotEmpty();
  });
  test('password', 'Password must be at least 8 characters', () => {
    enforce(data.password).longerThan(7);
  });
});

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [], // No NgxVestForms - pure createVestForm
  template: `
    <form (submit)="save($event)">
      <!-- Email field with manual ARIA -->
      <label for="email">Email *</label>
      <input
        id="email"
        type="email"
        [value]="form.email()"
        (input)="form.setEmail($event)"
        (blur)="form.markAsTouchedEmail()"
        [attr.aria-invalid]="
          showEmailErrors() && !form.emailValid() ? 'true' : null
        "
        [attr.aria-describedby]="
          showEmailErrors() ? 'email-error email-hint' : 'email-hint'
        "
      />
      <p id="email-hint" class="hint">We'll never share your email</p>

      @if (showEmailErrors()) {
        <div id="email-error" role="alert" aria-live="assertive" class="error">
          @for (error of form.emailValidation().errors; track error) {
            <p>{{ error }}</p>
          }
        </div>
      }

      <!-- Password field with manual ARIA -->
      <label for="password">Password *</label>
      <input
        id="password"
        type="password"
        [value]="form.password()"
        (input)="form.setPassword($event)"
        (blur)="form.markAsTouchedPassword()"
        [attr.aria-invalid]="
          showPasswordErrors() && !form.passwordValid() ? 'true' : null
        "
        [attr.aria-describedby]="showPasswordErrors() ? 'password-error' : null"
      />

      @if (showPasswordErrors()) {
        <div
          id="password-error"
          role="alert"
          aria-live="assertive"
          class="error"
        >
          @for (error of form.passwordValidation().errors; track error) {
            <p>{{ error }}</p>
          }
        </div>
      }

      <button type="submit" [disabled]="form.pending()">
        {{ form.pending() ? 'Logging in...' : 'Login' }}
      </button>
    </form>
  `,
  styles: [
    `
      .hint {
        color: #666;
        font-size: 0.875rem;
        margin-top: 0.25rem;
      }
      .error {
        color: #dc2626;
        margin-top: 0.25rem;
        font-size: 0.875rem;
      }
    `,
  ],
})
export class LoginFormComponent {
  form = createVestForm(loginSuite, signal({ email: '', password: '' }), {
    errorStrategy: 'on-touch',
  });

  // Custom computed signals for conditional error display
  showEmailErrors = computed(
    () =>
      this.form.emailShowErrors() &&
      this.form.emailValidation().errors.length > 0,
  );

  showPasswordErrors = computed(
    () =>
      this.form.passwordShowErrors() &&
      this.form.passwordValidation().errors.length > 0,
  );

  async save(event: Event) {
    event.preventDefault();
    const result = await this.form.submit();
    if (result.valid) {
      console.log('Logging in:', result.data);
    } else {
      console.log('Invalid credentials:', result.errors);
    }
  }
  // Note: No ngOnDestroy needed - staticSafeSuite has no subscriptions!
}
```

**When to use manual approach:**

- ✅ Need custom ARIA patterns (e.g., `aria-describedby` with multiple IDs like hints + errors)
- ✅ Building a design system with custom error components
- ✅ Complex accessibility requirements beyond WCAG 2.2
- ✅ Custom styling that requires specific HTML structure
- ❌ Most applications (use `NgxVestForms` instead - less code, same accessibility)

### Advanced Example: Async Validation with test.memo()

When using **async validation with `test.memo()`**, you MUST use `createSafeSuite` so Vest memoization stays stable. Call `dispose()` in `ngOnDestroy` when you need to cancel pending async runs or reset internal state:

```typescript
import {
  Component,
  signal,
  OnDestroy,
  ChangeDetectionStrategy,
} from '@angular/core';
import { createVestForm, NgxVestForms, createSafeSuite } from 'ngx-vest-forms';
import { test, enforce, skipWhen, warn, include } from 'vest';
import debounce from 'vest/debounce';

interface RegisterFormModel {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

// ⚠️ CRITICAL: Use createSafeSuite (not staticSafeSuite) for test.memo()
const registerSuite = createSafeSuite<RegisterFormModel>((data = {}) => {
  test('name', 'Name is required', () => {
    enforce(data.name).isNotEmpty();
  });

  test('email', 'Email is required', () => {
    enforce(data.email).isNotEmpty();
  });

  test('email', 'Invalid email format', () => {
    enforce(data.email).isEmail();
  });

  // Async email uniqueness check (only after format is valid)
  skipWhen(
    (result) => result.hasErrors('email'),
    () => {
      test.memo(
        'email',
        'Email is already registered',
        async ({ signal }) => {
          const response = await fetch(`/api/check-email/${data.email}`, {
            signal,
          });
          if (!response.ok) throw new Error('Email taken');
        },
        [data.email], // Memoization key
      );
    },
  );

  test('password', 'Password is required', () => {
    enforce(data.password).isNotEmpty();
  });

  test('password', 'Password must be at least 8 characters', () => {
    enforce(data.password).longerThan(7);
  });

  // Password strength warning (non-blocking)
  test('password', 'Consider adding special characters', () => {
    warn(); // Non-blocking - doesn't prevent submission
    enforce(data.password).matches(/[!@#$%^&*(),.?":{}|<>]/);
  });

  // Debounced warning (reduces UI chatter during fast typing)
  test(
    'password',
    'Consider mixing uppercase and lowercase',
    debounce(() => {
      warn(); // MUST be called synchronously at the top
      enforce(data.password).matches(/[a-z]/) &&
        enforce(data.password).matches(/[A-Z]/);
    }, 500), // Wait 500ms after user stops typing
  );

  // Confirm password (only validate when password exists)
  include('confirmPassword').when('password');

  test('confirmPassword', 'Please confirm your password', () => {
    enforce(data.confirmPassword).isNotEmpty();
  });

  test('confirmPassword', 'Passwords must match', () => {
    enforce(data.confirmPassword).equals(data.password);
  });

  test('agreeToTerms', 'You must agree to the terms', () => {
    enforce(data.agreeToTerms).isTruthy();
  });
});

@Component({
  selector: 'app-register',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxVestForms],
  template: `
    <form [ngxVestForm]="form" (submit)="save($event)">
      <label for="name">Full Name *</label>
      <input id="name" [value]="form.name()" (input)="form.setName($event)" />
      <ngx-form-error [field]="form.nameField()" />

      <label for="email">Email *</label>
      <input
        id="email"
        type="email"
        [value]="form.email()"
        (input)="form.setEmail($event)"
      />
      @if (form.emailPending()) {
        <p class="text-blue-600">Checking availability...</p>
      }
      <ngx-form-error [field]="form.emailField()" />

      <label for="password">Password *</label>
      <input
        id="password"
        type="password"
        [value]="form.password()"
        (input)="form.setPassword($event)"
      />
      <ngx-form-error [field]="form.passwordField()" />

      <label for="confirmPassword">Confirm Password *</label>
      <input
        id="confirmPassword"
        type="password"
        [value]="form.confirmPassword()"
        (input)="form.setConfirmPassword($event)"
      />
      <ngx-form-error [field]="form.confirmPasswordField()" />

      <label>
        <input
          id="agreeToTerms"
          type="checkbox"
          [checked]="form.agreeToTerms()"
          (change)="form.setAgreeToTerms($event)"
        />
        I agree to the <a href="/terms">Terms and Conditions</a> *
      </label>
      <ngx-form-error [field]="form.agreeToTermsField()" />

      <button type="submit" [disabled]="form.pending() || form.submitting()">
        {{
          form.submitting()
            ? 'Creating Account...'
            : form.pending()
              ? 'Validating...'
              : 'Create Account'
        }}
      </button>
    </form>
  `,
})
export class RegisterFormComponent implements OnDestroy {
  form = createVestForm(
    registerSuite,
    signal<RegisterFormModel>({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false,
    }),
    { errorStrategy: 'on-touch' },
  );

  async save(event: Event) {
    event.preventDefault();
    const result = await this.form.submit();

    if (result.valid) {
      // Call your API
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      });

      if (response.ok) {
        console.log('✅ Registration successful!');
      }
    } else {
      console.log('❌ Form validation failed:', result.errors);
    }
  }

  ngOnDestroy() {
    this.form.dispose(); // Optional cleanup - cancels pending async validators and resets state
  }
}
```

**This example demonstrates:**

- ✅ Async validation with `test.memo()` (email uniqueness check)
- ✅ Conditional validation with `include().when()` (confirmPassword)
- ✅ Non-blocking warnings with `warn()` (password strength)
- ✅ Race condition protection with `AbortSignal`
- ✅ Pending state UI (`form.pending()`, `form.submitting()`)
- ✅ Optional teardown hook with `ngOnDestroy()` for `createSafeSuite`
- ✅ Complete WCAG 2.2 accessibility

## 📚 Complete API Reference

### `createVestForm(suite, model, options?)`

**Parameters:**

- `suite`: Vest validation suite (from `staticSafeSuite` or `createSafeSuite`)
- `model`: Initial form data (object or `Signal<T>`)
- `options`: Configuration object
  - `errorStrategy`: `'immediate' | 'on-touch' | 'on-submit' | 'manual'` or `Signal<ErrorDisplayStrategy>`

**Returns:** `EnhancedVestForm<TModel>`

### Form State Signals

```typescript
// Overall form state
form.valid(); // Signal<boolean> - is form valid (no errors AND no pending)?
form.invalid(); // Signal<boolean> - form has errors (NEW in v2.0)
form.dirty(); // Signal<boolean> - any field changed from initial (NEW in v2.0)
form.pending(); // Signal<boolean> - async validation running?
form.submitting(); // Signal<boolean> - submit() in progress?
form.submittedStatus(); // Signal<'unsubmitted' | 'submitting' | 'submitted'> (NEW in v2.0)
form.errors(); // Signal<Record<string, string[]>> - all errors
form.model(); // Signal<TModel> - current form data
form.result(); // Signal<SuiteResult> - raw Vest result

// Per-field signals (auto-generated via proxy)
form.fieldName(); // Signal<T> - field value
form.fieldNameValid(); // Signal<boolean> - field valid?
form.fieldNameInvalid(); // Signal<boolean> - field has errors (NEW in v2.0)
form.fieldNameDirty(); // Signal<boolean> - field changed (NEW in v2.0)
form.fieldNameValidation(); // Signal<{ errors: string[], warnings: string[] }> (NEW in v2.0)
form.fieldNameTouched(); // Signal<boolean> - user interacted?
form.fieldNamePending(); // Signal<boolean> - async validation?
form.fieldNameShowErrors(); // Signal<boolean> - show errors based on strategy
form.fieldNameShowWarnings(); // Signal<boolean> - show warnings based on strategy
form.fieldNameField(); // Complete field state for <ngx-form-error>
```

### Form Operations

```typescript
// Validation
await form.submit(); // Validates all fields, returns data (throws if invalid)
form.validate(); // Re-run all validations
form.validate('fieldName'); // Re-run specific field validation

// Field manipulation (auto-generated via proxy)
form.setFieldName($event); // Set field value (accepts Event or raw value)
form.markAsTouchedFieldName(); // Mark field as touched (NEW in v2.0 - renamed from touchFieldName)
form.markAsDirtyFieldName(); // Mark field as dirty (NEW in v2.0)
form.resetFieldName(); // Reset field to initial value

// Explicit field API (always available)
form.field('fieldName').set(value); // Set value
form.field('fieldName').markAsTouched(); // Mark touched
form.field('fieldName').markAsDirty(); // Mark dirty
form.field('fieldName').reset(); // Reset to initial

// Form-level operations
form.reset(); // Reset entire form to initial state
form.dispose(); // Optional teardown - cancel pending async runs and clear internal state
```

### NgxVestForms Constant

Import all convenience features in one line:

```typescript
import { NgxVestForms } from 'ngx-vest-forms/core';

@Component({
  imports: [NgxVestForms], // Includes:
  // 1. NgxVestAutoAriaDirective - Auto aria-invalid + aria-describedby
  // 2. NgxVestAutoTouchDirective - Auto touch detection on blur
  // 3. NgxVestFormBusyDirective - Auto aria-busy on forms
  // 4. NgxFormErrorComponent - Styled, accessible error display
})
```

**Opt-out options:**

```typescript
// Disable auto-ARIA for specific input
<input [value]="form.email()" ngxVestAutoAriaDisabled />

// Disable auto-touch for specific input
<input [value]="form.email()" ngxVestAutoTouchDisabled />

// Disable auto-busy for specific form
<form ngxVestAutoFormBusyDisabled [attr.aria-busy]="customLogic()">

// Global disable via config
provideNgxVestFormsConfig({
  autoAria: false,              // Disable auto-ARIA globally
  autoTouch: false,             // Disable auto-touch globally
  autoFormBusy: false,          // Disable auto-busy globally
  strictFieldResolution: false, // Throw errors on field resolution failures (dev: !environment.production)
  debug: true                   // Enable debug logging
})
```

## 🎓 Best Practices

### 1. Know When to Call `dispose()`

```typescript
// ✅ NO dispose() needed - staticSafeSuite has no subscriptions
@Component({...})
export class SimpleFormComponent {
  form = createVestForm(staticSafeSuite((data) => { ... }), signal({ ... }));
  // No ngOnDestroy needed!
}

// ✅ dispose() recommended - createSafeSuite keeps state you may want to reset
@Component({...})
export class AsyncFormComponent implements OnDestroy {
  form = createVestForm(createSafeSuite((data) => {
    test.memo('email', 'Taken', async ({ signal }) => {
      await checkEmail(data.email, { signal });
    }, [data.email]);
  }), signal({ ... }));

  ngOnDestroy() {
    this.form.dispose(); // Call to cancel pending async validators and reset state
  }
}
```

**Rule of thumb:** Call `dispose()` when you use `createSafeSuite` and want to cancel in-flight async validations or wipe form state on teardown. Stateless `staticSafeSuite` forms can skip it.

### 2. Use `staticSafeSuite` to Prevent Bugs

```typescript
// ❌ Fragile - Conditional only() guard breaks Vest's targeting
import { staticSuite, only } from 'vest';
const suite = staticSuite((data, field) => {
  if (field) only(field); // Vest expects only(field) on every run (undefined signals "run everything")
});

// ✅ GOOD - Automatic guard
import { staticSafeSuite } from 'ngx-vest-forms';
const suite = staticSafeSuite((data) => {
  // No guard needed - wrapper handles it!
});
```

**Why?** Vest expects `only(field)` each time you invoke the suite. Passing `undefined` tells it to run the whole suite; skipping or guarding the call can leave Vest thinking you're still targeting the previous field, which produces stale or partial results. `staticSafeSuite` keeps that discipline for you.

### 3. Use `createSafeSuite` for Async Validation with `test.memo()`

**⚠️ CRITICAL:** When using `test.memo()` for async validation caching, you **MUST** use `createSafeSuite`:

```typescript
// ❌ WRONG - Breaks test.memo() caching!
import { staticSafeSuite } from 'ngx-vest-forms';

const suite = staticSafeSuite((data) => {
  test.memo(
    'email',
    'Email taken',
    async ({ signal }) => {
      await checkEmail(data.email, { signal });
    },
    [data.email],
  );
});

// ✅ CORRECT - Enables test.memo() caching!
import { createSafeSuite } from 'ngx-vest-forms';

const suite = createSafeSuite((data) => {
  test.memo(
    'email',
    'Email taken',
    async ({ signal }) => {
      // This only runs when data.email changes! Cache works.
      await checkEmail(data.email, { signal });
    },
    [data.email],
  );
});
```

**Why?** Vest.js memoization keys include the **suite instance ID**. `staticSafeSuite` creates a new instance on every call, breaking memoization. `createSafeSuite` maintains the same instance ID.

### 4. Don't Disable Submit Buttons (Accessibility)

```typescript
// ❌ BAD - Disabling submit prevents error discovery
<button type="submit" [disabled]="!form.valid()">Submit</button>

// ✅ GOOD - Allow submit, let validation reveal errors
<button type="submit" [disabled]="form.pending() || form.submitting()">
  {{ form.submitting() ? 'Saving...' : 'Submit' }}
</button>
```

**Why?** Per WCAG 2.2, users should be able to attempt form submission to discover what fields are invalid. Only disable during async operations.

### 5. Use Proper ARIA Attributes (if not using NgxVestForms)

```typescript
// Manual ARIA (when you need full control)
<input
  [value]="form.email()"
  (input)="form.setEmail($event)"
  [attr.aria-invalid]="form.emailShowErrors() && !form.emailValid() ? 'true' : null"
  [attr.aria-describedby]="form.emailShowErrors() ? 'email-error' : null"
/>

@if (form.emailShowErrors()) {
  <p id="email-error" role="alert">{{ form.emailValidation().errors[0] }}</p>
}
```

**Note:** With `NgxVestForms`, this is automatic!

### 6. Model-Schema Alignment (When Using Schemas)

When using schema validation with Zod, Valibot, or ArkType, follow this **golden rule**:

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

##### Option 1: Schema handles validation (simpler)

```typescript
const schema = z
  .object({
    password: z.string().min(8).default(''),
    confirmPassword: z.string().min(1).default(''),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  });
```

##### Option 2: Vest handles validation (recommended - more flexible)

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

**See [Zod Basic Example](./projects/examples/src/app/03-schemas/zod-basic/) for full implementation.**

## 🔄 Migration from V1

### Breaking Changes

1. **New `[ngxVestForm]` directive** - Replaces old V1 directive (different API)
2. **No more `ngModel` / `[(formValue)]` bindings** - Use `[value]`/`(input)` instead
3. **Suite signature change** - Use `staticSafeSuite` wrapper
4. **No more `validateRootForm` directive** - See [Root Form Validation Migration Guide](./docs/migration/root-form-validation.md)

### Migration Steps

**Before (V1):**

```typescript
@Component({
  imports: [ngxVestForms],
  template: `
    <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
      <input name="email" [(ngModel)]="model.email" />
    </form>
  `,
})
export class MyFormComponent {
  model = signal({ email: '' });
  suite = myValidationSuite;
}
```

**After (V2 - Using new convenience directive):**

```typescript
@Component({
  imports: [NgxVestForms], // New convenience constant!
  template: `
    <form [ngxVestForm]="form" (submit)="save($event)">
      <!-- ✅ New directive applies all accessibility features automatically -->
      <input
        id="email"
        [value]="form.email()"
        (input)="form.setEmail($event)"
      />
      <ngx-form-error [field]="form.emailField()" />
    </form>
  `,
})
export class MyFormComponent {
  form = createVestForm(myValidationSuite, signal({ email: '' }));

  async save(event: Event) {
    event.preventDefault();
    const result = await this.form.submit();
    if (result.valid) {
      // Handle submission
    }
  }
  // Note: No ngOnDestroy needed - staticSafeSuite has no subscriptions!
}
```

## 📊 Performance

- **Bundle Size**: ~3KB (core only, no FormsModule)
- **Validation Speed**: ~60-80% faster than V1
- **Memory**: Lower (single state source)
- **Change Detection**: Optimized with OnPush + Signals

## � What's New in V2?

V2 represents a **complete architectural shift** from Angular Forms to Vest-first validation:

| Aspect                | V1 (NgForm-centric)     | V2 (Vest-first)         |
| --------------------- | ----------------------- | ----------------------- |
| **Core Dependency**   | Angular FormsModule     | Vest.js                 |
| **Form State**        | NgForm controls         | Vest validation result  |
| **Touch Detection**   | Manual blur handlers    | Automatic via directive |
| **API Style**         | Directive-based         | Factory function        |
| **Bundle Size**       | ~8KB (with FormsModule) | ~3KB (core only)        |
| **Framework Lock-in** | Angular-specific        | Framework-agnostic      |
| **Accessibility**     | Manual ARIA attributes  | Automatic ARIA          |

### Why the Change?

**V1 Problem**: Attempting to bridge two incompatible paradigms (Angular Forms + Vest) created complexity:

- Double bookkeeping of state
- Timing bugs between NgForm and Vest
- Unnecessary Angular dependencies
- Complex synchronization logic
- Manual ARIA attributes (15+ lines per field)

**V2 Solution**: Make Vest.js the single source of truth + automatic accessibility:

- ✅ **Simpler**: One state source (Vest)
- ✅ **Faster**: No double validation
- ✅ **Lighter**: No FormsModule required
- ✅ **Accessible**: Auto-ARIA by default
- ✅ **Flexible**: Works with any UI framework
- ✅ **80% Less Code**: Auto-generated signals + directives

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)

## 📝 License

MIT © [ngx-vest-forms Contributors](https://github.com/ngx-vest-forms/ngx-vest-forms)

## Acknowledgments

🙏 **Special thanks to [Brecht Billiet](https://twitter.com/brechtbilliet)** for creating the original version of this library and his pioneering work on Angular forms. His vision and expertise laid the foundation for what ngx-vest-forms has become today.

🙏 **Special thanks to [Laurens Westenberg](https://github.com/lwestenberg)** for the idea and inspiration of a Vest.js-first architecture. His experimental repository [ngx-minivest](https://github.com/lwestenberg/ngx-minivest/) demonstrated the potential of inverting the traditional approach, making Vest the single source of truth instead of Angular Forms. This concept became the cornerstone of ngx-vest-forms V2.

🙏 **Special thanks to [Evyatar Alush](https://twitter.com/evyataral)** - Creator of [Vest.js](https://vestjs.dev/)

- 🎯 **The validation engine** that powers ngx-vest-forms
- 🎙️ **Featured on PodRocket**: [Vest with Evyatar Alush](https://dev.to/podrocket/vest-with-evyatar-alush) - Deep dive into the philosophy and architecture of Vest.js

### Inspirations

**[Ward Bell](https://twitter.com/wardbell)** - Template-Driven Forms Advocate

- 📢 **Evangelized Template-Driven Forms**: [Prefer Template-Driven Forms](https://devconf.net/talk/prefer-template-driven-forms-ward-bell-ng-conf-2021) (ng-conf 2021)
- 🎥 **Original Vest.js + Angular Integration**: [Form validation done right](https://www.youtube.com/watch?v=EMUAtQlh9Ko) - The foundational talk that inspired this approach
- 💻 **Early Implementation**: [ngc-validate](https://github.com/wardbell/ngc-validate) - The initial version of template-driven forms with Vest.js

These pioneers laid the groundwork that made ngx-vest-forms possible, combining the power of declarative validation with the elegance of Angular's template-driven approach.

**Ready to get started?** Check out the [examples folder](./projects/examples/src/app/01-fundamentals) for more patterns!
