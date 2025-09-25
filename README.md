# ngx-vest-forms

> 🚨 **Upgrading to v2?** See our [**Migration Guide**](./docs/MIGRATION_GUIDE_V2.md) for step-by-step instructions and a [\*\*Bre### Available Entry Points

| Entry Point                      | Purpose                               | When to Use                                |
| -------------------------------- | ------------------------------------- | ------------------------------------------ |
| `ngx-vest-forms`                 | Main package (re-exports core)        | Default usage, backward compatibility      |
| `ngx-vest-forms/core`            | Core form functionality only          | Minimal bundle, Vest validation only       |
| `ngx-vest-forms/schemas`         | Schema validation + wrapper directive | Type-safe validation with Zod/Valibot      |
| `ngx-vest-forms/control-wrapper` | UI helper components                  | Ready-made form controls (Tailwind-styled) |
| `ngx-vest-forms/smart-state`     | Advanced state management             | Complex form state scenarios               |

> 🚨 **Upgrading to v2?** See our [**Migration Guide**](./docs/MIGRATION_GUIDE_V2.md) for step-by-step instructions and a [\*\*Breaking Cha

---

## 🚀 What's New in v2?

- **Modular architecture:** Import only what you need for smaller bundles.
- **Unified NGX naming:** All public APIs use the `Ngx` prefix for clarity and Angular convention.
- **Tree-shaking:** Optional features (smart state, schemas, control wrapper) are now secondary entry points.
- **Unified form state:** All form state (value, errors, validity, pending) is exposed via a single signal.
- **Improved error display:** Errors show on blur or submit by default, with configurable modes.
- **Accessibility:** ARIA roles, keyboard support, and error display are built-in.
- **Migration is easy:** Most users need zero code changes—see the [Migration Guide](./docs/MIGRATION_GUIDE_V2.md).

## What is ngx-vest-forms?

It's a small library that bridges the gap between declarative Vest validation suites and Angular's template-driven forms. It automatically handles validation, state tracking (value, errors, validity, pending), and error display, exposing everything as reactive signals.

**Key Features:**

- **Zero Boilerplate:** Just use `ngModel`/`ngModelGroup` and connect a Vest suite—no manual wiring or error handling needed.
- **Type Safety:** Optional schema support (Zod, ArkType, Valibot, or object template) for compile-time safety and IDE inference. Field validation is also type-safe using `keyof` patterns.
- **Form-Compatible Types:** Built-in utility types like `FormCompatibleDeepRequired<T>` solve Date/string mismatches in form initialization.
- **Signals & Reactivity:** All form state (value, errors, validity, pending, etc.) is exposed as signals for easy, reactive UI updates.
- **Powerful Validations:** Use Vest.js for declarative, composable, and async validation logic with TypeScript field name safety.
- **Accessible by Default:** Built-in error display, ARIA roles, and keyboard support via `<ngx-control-wrapper>`.
- **Modern Angular:** Designed for Angular 19+ standalone components, signals, zoneless.
- **Native HTML5 validation is disabled:** The `novalidate` attribute is automatically added to all forms using `ngxVestForm`, so all validation is handled by VestJS and Angular, not the browser. **Important:** Avoid HTML validation attributes (`min`, `max`, `required`, `pattern`) as they can interfere with Vest validation even when `novalidate` is applied.
- **Advanced Features Available:** Optional smart state management and UI helper components available as secondary entry points.

## Why Use Vest.js?

**Vest.js** is a modern, framework-agnostic validation library designed for field-level, incremental, and interactive form validation. It excels at:

- **Field-level validation:** Only validates fields that change, providing instant feedback and optimal UX.
- **Separation of concerns:** Keeps validation logic separate from UI and business logic for maintainability and reusability.
- **Declarative syntax:** Easy-to-read, unit-test-like validation suites.
- **Framework agnostic:** Works with any UI framework, including Angular, React, Vue, and more.
- **State management:** Manages validation state internally, so you don’t have to.

**Learn more:** [Vest vs. the Rest](https://vestjs.dev/docs/vest_vs_the_rest)

---

## 🎯 Dual Validation Strategy: Vest.js + Standard Schema

`ngx-vest-forms` supports **both** Vest.js and Standard Schema validation working together for the best user experience and data integrity:

### **Interactive Field Validation** (Vest.js)

- **When**: As users type/interact with fields
- **Purpose**: Immediate feedback for better UX
- **What**: Field-level validation, async validation, conditional logic
- **Performance**: Incremental, optimized for user interaction

### **Submit-time Structure Validation** (Standard Schema)

- **When**: Automatically on form submit
- **Purpose**: Complete data structure and domain validation
- **What**: Type safety, shape validation, business rules
- **Performance**: Single validation pass for complete data

### **Why Both?**

| Aspect          | Vest.js (Interactive) | Schema (Submit-time) |
| --------------- | --------------------- | -------------------- |
| **Timing**      | As user types         | On form submit       |
| **Scope**       | Individual fields     | Complete object      |
| **Purpose**     | UX feedback           | Data integrity       |
| **Performance** | Incremental           | Single pass          |
| **State**       | `formState().errors`  | `formState().schema` |

### **Example: Best of Both Worlds**

````typescript
import { z } from 'zod';
import { staticSuite, test, enforce, only } from 'vest';

// Schema for type safety and submit validation
const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email()
});
type User = z.infer<typeof userSchema>;

// Field names for type-safe validation
type UserFieldNames = keyof User;

// Vest suite for interactive field validation
const userSuite = staticSuite((data: Partial<User> = {}, field?: UserFieldNames) => {
  only(field); // Optimize: only validate the changed field

  test('name', 'Name is required', () => {
    enforce(data.name).isNotEmpty();
  });
  test('email', 'Please enter a valid email', () => {
    enforce(data.email).matches(/^[^@]+@[^@]+\.[^@]+$/);
  });
});

@Component({
  template: `
    <form ngxVestFormWithSchema
          [vestSuite]="userSuite"     <!-- Interactive validation (Vest) -->
          [formSchema]="userSchema"   <!-- Submit validation (Schema) -->
          [(formValue)]="userData"
          (ngSubmit)="save()">

      <!-- Immediate feedback as user types -->
      <input name="name" [ngModel]="userData().name">
      @if (vestForm.formState().errors.name) {
        <span class="field-error">{{ vestForm.formState().errors.name[0] }}</span>
      }

      <!-- Complete validation on submit -->
      @if (vestForm.formState().schema?.success === false) {
        <div class="submit-errors">
          @for (issue of vestForm.formState().schema.issues; track issue.message) {
            <p>{{ issue.message }}</p>
          }
        </div>
      }
    </form>
  `

**Key Benefits:**

- ✅ **Best UX**: Immediate field feedback + comprehensive submit validation

- ✅ **Performance**: Incremental validation + single final check

- ✅ **Type Safety**: Full TypeScript inference from schemas

- ✅ **Separation**: No duplicate validation logic or conflicting state

**Reference:** [Vest vs. the Rest](https://vestjs.dev/docs/vest_vs_the_rest) | [Standard Schema Specification](https://standardschema.dev/)

## Installation

```sh
npm i ngx-vest-forms vest
````

## Modular Architecture & Tree-shaking

`ngx-vest-forms` v2 features a modular architecture with multiple entry points for optimal bundle size:

### Available Entry Points

| Entry Point                      | Purpose                               | When to Use                                 |
| -------------------------------- | ------------------------------------- | ------------------------------------------- |
| `ngx-vest-forms`                 | Main package (re-exports core)        | Default usage, backward compatibility       |
| `ngx-vest-forms/core`            | Core form functionality only          | Minimal bundle, Vest validation only        |
| `ngx-vest-forms/schemas`         | Schema validation + wrapper directive | Type-safe validation with Zod/Valibot       |
| `ngx-vest-forms/smart-state`     | Advanced state management             | Complex form state scenarios                |
| `ngx-vest-forms/control-wrapper` | UI helper components                  | Custom form control (`ngx-control-wrapper`) |

### Import Examples

```typescript
// Main package (includes everything from core)
import { ngxVestForms, NgxFormDirective } from 'ngx-vest-forms';

// Core entry point (same functionality and bundle size)
import { ngxVestForms, NgxFormDirective } from 'ngx-vest-forms/core';

// Modular imports for specific features
import { zodAdapter } from 'ngx-vest-forms/schemas';
import { NgxVestFormsSmartStateDirective } from 'ngx-vest-forms/smart-state';
import { NgxControlWrapper } from 'ngx-vest-forms/control-wrapper';
```

**Note**: Both `ngx-vest-forms` and `ngx-vest-forms/core` have identical bundle sizes since the main package simply re-exports from core. Use either based on your preference for import clarity.

## v2 Architecture: Clean Separation

The v2 refactor implements a clean, modular architecture:

```mermaid
ngx-vest-forms/core (no schema knowledge)
         ↑
         │ depends on
         │
ngx-vest-forms/schemas (extends core with schema features)
```

### Design Principles

1. **Core is minimal** - Only essential Vest validation, no schema logic
2. **Features are optional** - Schema, UI components, and smart state are separate packages
3. **No circular dependencies** - Clean unidirectional dependencies
4. **Tree-shakeable** - Unused features don't increase bundle size
5. **Composable** - Mix and match features as needed

### How It Works

- The core `NgxFormDirective` has no knowledge of schemas
- The schemas package provides:
  - `NgxSchemaValidationDirective` - Adds schema validation to any form with core
  - `NgxVestFormWithSchemaDirective` - Convenient wrapper combining both
- The control-wrapper package provides ready-made UI components (Tailwind-based)
- Each package can evolve independently
- Users only pay for what they use

### Why Separate Packages?

**Core** - Pure validation logic, no UI opinions
**Control-wrapper** - Optional UI components with Tailwind styling
**Schemas** - Optional type-safe schema validation
**Smart-state** - Optional advanced state management

This separation allows:

- **Custom design systems** to use core building blocks with their own UI
- **Rapid development teams** to use ready-made components
- **Minimal bundles** for teams that only need core validation
- **Flexible styling** - not locked into Tailwind CSS

## Core Features & Quick Start

The core of the library is the `ngxVestForm` directive, which automatically links your form with a Vest validation suite.

### Automatic Submit-time Schema Validation

Schema validation is now provided through the `schemas` secondary entry point, keeping the core bundle lean. You have two options:

**Option 1: Convenient Wrapper (Recommended)**
Use `ngxVestFormWithSchema` from `ngx-vest-forms/schemas` for a single-directive solution:

```typescript
import { NgxVestFormWithSchemaDirective } from 'ngx-vest-forms/schemas';

@Component({
  imports: [NgxVestFormWithSchemaDirective, NgxControlWrapper],
  template: `
    <form ngxVestFormWithSchema
          [vestSuite]="suite"
          [formSchema]="schema"
          [(formValue)]="model"
          #vestForm="ngxVestForm">
      <!-- form fields -->
    </form>
  `
})
```

**Option 2: Manual Composition**
Attach `NgxSchemaValidationDirective` alongside `ngxVestForm` or `ngxVestFormCore`:

```typescript
import { ngxVestForms } from 'ngx-vest-forms/core';
import { NgxSchemaValidationDirective } from 'ngx-vest-forms/schemas';

@Component({
  imports: [ngxVestForms, NgxSchemaValidationDirective],
  template: `
    <form ngxVestForm
          [vestSuite]="suite"
          ngxSchemaValidation
          [formSchema]="schema"
          [(formValue)]="model">
      <!-- form fields -->
    </form>
  `
})
```

Both approaches provide:

- Automatic schema validation on form submit
- Results exposed via `formState().schema` with `success`, `issues`, and `errorMap`
- No manual `(ngSubmit)` handlers needed for schema parsing

### 1. Define Your Model and (Optional) Schema

```typescript
// user.model.ts
import { signal } from '@angular/core';

// A simple object template is enough for type inference
const userModel = { name: '', email: '' };

// Optionally, create a schema for more robust validation and type generation
import { ngxModelToStandardSchema } from 'ngx-vest-forms/schemas';
const userSchema = ngxModelToStandardSchema(userModel);
```

### 2. Create a Vest Validation Suite

```typescript
// user.validations.ts
import { staticSuite, test, enforce, only } from 'vest';

// Field names for type-safe validation
type UserFieldNames = keyof typeof userModel;

export const userValidations = staticSuite(
  (data = {}, field?: UserFieldNames) => {
    only(field); // Optimize: only validate the changed field

    test('name', 'Name is required', () => enforce(data.name).isNotEmpty());
    test('email', 'A valid email is required', () =>
      enforce(data.email).isEmail(),
    );
  },
);
```

### 3. Use in a Standalone Angular Component

```typescript
// user-form.component.ts
import { Component, signal } from '@angular/core';
import { ngxVestForms } from 'ngx-vest-forms/core'; // Optimized import
import { NgxVestFormWithSchemaDirective } from 'ngx-vest-forms/schemas';
import { NgxControlWrapper } from 'ngx-vest-forms/control-wrapper'; // UI Helper
import { userModel } from './user.model';
import { userValidations } from './user.validations';

@Component({
  imports: [ngxVestForms, NgxControlWrapper, NgxVestFormWithSchemaDirective],
  template: `
    <form
      ngxVestFormWithSchema
      [vestSuite]="suite"
      [formSchema]="userSchema"
      [(formValue)]="model"
    >
      <ngx-control-wrapper>
        <label for="name">Name</label>
        <input id="name" name="name" [ngModel]="model().name" />
      </ngx-control-wrapper>

      <ngx-control-wrapper>
        <label for="email">Email</label>
        <input id="email" name="email" [ngModel]="model().email" type="email" />
      </ngx-control-wrapper>
    </form>
  `,
})
export class UserFormComponent {
  protected readonly model = signal(userModel);
  protected readonly suite = userValidations;
}
```

### Recommended Binding Pattern: `[ngModel]` (One-Way) vs `ngModel` (Two-Way Attribute)

> ✅ **Recommendation:** Use the one-way form of the binding (`[ngModel]="model().field"`) for every control inside a `ngxVestForm`. Avoid the bare `ngModel` attribute unless you explicitly want an initially empty control.

`ngx-vest-forms` already provides a single outbound synchronization channel through `[(formValue)]="model"`. Using the implicit two‑way `ngModel` binding duplicates responsibilities (the control tries to push into the model while the form directive is also managing writes) and can introduce subtle race conditions or transient states. A one‑way `[ngModel]` binding keeps data flow unidirectional:

1. Model signal (source of truth) → control initial value via `[ngModel]`
2. User edits control → Angular form updates internal `NgForm` → `ngxVestForm` effect merges & emits → updates external `model` signal through `[(formValue)]`

With the bare `ngModel` attribute (no square brackets), Angular sets up a separate two‑way binding. This results in:

- Redundant writes (control value tries to update the model while the directive is also syncing)
- Harder debugging of timing issues in async validation
- Missing initial hydration if you rely only on the model signal's pre-populated value (a bare `ngModel` without a bound value starts as an empty string)

#### Side-by-Side Example

```html
<!-- Recommended (one-way inbound) -->
<input name="email" [ngModel]="model().email" />

<!-- Fallback (implicit two-way) -->
<input name="email" ngModel />
```

#### Pre-populated Value Behavior

| Pattern     | Model initialized to `preset@example.com` | Input initial value  |
| ----------- | ----------------------------------------- | -------------------- |
| `[ngModel]` | Yes (hydrated from model)                 | `preset@example.com` |
| `ngModel`   | Not bound → starts empty                  | `` (empty string)    |

#### Why This Matters

- **Single Source of Truth:** Only the form directive mutates the external model, simplifying mental model.
- **Consistency With Signals:** Signals work best with clear directional flow; `[ngModel]` preserves this.
- **Lower Risk of Glitches:** Eliminates duplicate change notifications that can briefly show stale validation state.
- **Deterministic Initial State:** Ensures pre-populated edit forms render existing data immediately.

#### When Is Bare `ngModel` Acceptable?

Only when you explicitly want a blank control regardless of an existing model value (rare) or in quick prototypes. Even then, migrating to `[ngModel]` later is trivial.

### Creating Non-Blocking Warnings with Vest.js

`ngx-vest-forms` supports both **blocking errors** (prevent form submission) and **non-blocking warnings** (progressive guidance) using Vest.js's `warn()` function.

#### Vest.js Warning Syntax

```typescript
// user.validations.ts
import { staticSuite, test, enforce, warn, only } from 'vest';

export const userValidations = staticSuite(
  (data: Partial<UserModel> = {}, field?: string) => {
    only(field); // Performance optimization

    // BLOCKING ERROR - prevents form submission
    test('password', 'Password is required', () => {
      enforce(data.password).isNotEmpty();
    });

    // NON-BLOCKING WARNING - progressive guidance
    test('password', 'Password strength: WEAK', () => {
      warn(); // This makes it a warning instead of an error
      enforce(data.password).matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]$/,
      );
    });

    test('password', 'Password strength: MEDIUM', () => {
      warn(); // Must be called at the start of the test
      enforce(data.password).matches(
        /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]$/,
      );
    });
  },
);
```

#### Component Usage

```html
<form ngxVestForm [vestSuite]="userValidations" [(formValue)]="model">
  <ngx-control-wrapper showWarnings>
    <label for="password">Password</label>
    <input
      id="password"
      name="password"
      [ngModel]="model().password"
      type="password"
    />
    <!--
    Progressive warnings appear with soft orange styling (:focus:invalid)
    Blocking errors appear with hard red styling (:invalid:not(:focus))
    -->
  </ngx-control-wrapper>
</form>
```

#### Key Benefits

- **Progressive Feedback**: Warnings guide users during typing without being obtrusive
- **Form Submission**: Warnings don't prevent submission (only blocking errors do)
- **CSS-Driven Styling**: Visual distinction automatically handled by pseudo-class selectors
- **Accessibility**: Warnings use `role="status"`, errors use `role="alert"`

**📖 [Complete Vest.js Documentation](./docs/vest.instructions.md)** | **📖 [CSS Styling Guide](./docs/CSS_CUSTOM_PROPERTIES_GUIDE.md)**

### Error & Warning Visibility (Breaking Change)

`ngx-vest-forms` now cleanly separates three orthogonal concerns:

- **When Angular runs validators & updates values** → `ngModelOptions.updateOn` (`'change'` (default), `'blur'`, `'submit'`).
- **When blocking errors (failed tests) become visible** → `errorDisplayMode` (`'on-blur'`, `'on-submit'`, `'on-blur-or-submit'`).
- **When non‑blocking warnings (tests using `warn()`) become visible** → `warningDisplayMode` (`'on-change'`, `'on-blur'`, `'on-submit'`, `'on-blur-or-submit'`).

Progressive guidance is handled exclusively by `warningDisplayMode='on-change'` (default) with debounced live updates; blocking errors remain conservative to avoid mid‑typing noise.

#### Why a One-Time First-Blur Trigger Exists

Angular with `updateOn: 'change'` does not re-run validators if the user focuses an empty required field and blurs without typing. UX expectations (and accessibility best practices) typically call for showing the missing-required feedback at that point. We add a one-time first-blur validation trigger (skipped for `updateOn: 'submit'`) to prime the Vest suite so the wrapper can display the message. It fires only once per control unless the user changes the value later (normal change validation resumes).

#### Error Display Matrix

| `updateOn` | `errorDisplayMode`  | User Flow (simplified) | Validation Runs\*                             | Errors Visible When | Notes                                     |
| ---------- | ------------------- | ---------------------- | --------------------------------------------- | ------------------- | ----------------------------------------- |
| `change`   | `on-blur`           | Focus → (type?) → blur | On each change + first-blur fallback if none  | On blur             | Fallback covers focus→blur empty case     |
| `change`   | `on-submit`         | Interact → submit      | On changes; submit re-validates dependents    | After first submit  | Pre-submit errors hidden                  |
| `change`   | `on-blur-or-submit` | Blur OR submit         | Changes + fallback + submit                   | Blur or submit      | Default                                   |
| `blur`     | `on-blur`           | Type → blur            | At blur (Angular)                             | Same blur event     | No fallback necessary                     |
| `blur`     | `on-submit`         | Blur cycles → submit   | Each blur; submit reruns form-level if needed | After first submit  | Cached errors hidden until submit         |
| `blur`     | `on-blur-or-submit` | Blur OR submit         | Each blur; submit as needed                   | Blur or submit      | Similar to on-blur unless no blur happens |
| `submit`   | `on-blur`           | Focus/blur → submit    | Only at submit                                | After submit        | Submit timing dominates                   |
| `submit`   | `on-submit`         | Submit                 | Only at submit                                | After submit        | Simplest late feedback                    |
| `submit`   | `on-blur-or-submit` | Blur attempts → submit | Only at submit                                | After submit        | Blur has no effect pre-submit             |

#### Warning Display Matrix

| `updateOn` | `warningDisplayMode` | User Flow (simplified) | Validation Runs\*                 | Warnings Visible When  | Notes                                             |
| ---------- | -------------------- | ---------------------- | --------------------------------- | ---------------------- | ------------------------------------------------- |
| `change`   | `on-change`          | Type                   | Each change (debounced read)      | Live (debounced)       | Debounce via `NGX_ON_CHANGE_WARNING_DEBOUNCE`     |
| `change`   | `on-blur`            | Type → blur            | Each change + first-blur fallback | After blur             | Mirrors error timing if both blur-based           |
| `change`   | `on-blur-or-submit`  | Type → blur/submit     | Changes + fallback + submit       | Blur or submit         | Not earlier than errors if combined rule enforced |
| `change`   | `on-submit`          | Type → submit          | Changes; submit                   | After submit           | Discouraged (low guidance)                        |
| `blur`     | `on-change`          | Type → blur            | At blur (Angular)                 | After blur (not live)  | updateOn limits immediacy                         |
| `blur`     | `on-blur`            | Type → blur            | At blur                           | After blur             | ---                                               |
| `blur`     | `on-blur-or-submit`  | Blur OR submit         | Each blur; submit as needed       | Blur or submit         | ---                                               |
| `blur`     | `on-submit`          | Blur cycles → submit   | Each blur; submit                 | After submit           | Low guidance                                      |
| `submit`   | `on-change`          | Type → submit          | Only at submit                    | After submit (no live) | updateOn overrides live intent                    |
| `submit`   | `on-blur`            | Focus/blur → submit    | Only at submit                    | After submit           | Blur timing suppressed                            |
| `submit`   | `on-blur-or-submit`  | Blur attempts → submit | Only at submit                    | After submit           | ---                                               |
| `submit`   | `on-submit`          | Submit                 | Only at submit                    | After submit           | ---                                               |

\*Rows describe Vest executions; dependency-triggered validations may add additional runs.

#### On-Change Warnings

Progressive, low-friction guidance pattern:

```ts
{ provide: NGX_ON_CHANGE_WARNING_DEBOUNCE, useValue: 220 }
```

Use for strength meters, availability hints, heuristic suggestions. Keep blocking errors conservative to reduce noise and meet accessibility expectations.

> Accessibility note: This behavior was implemented with accessibility in mind, but manual audits with tools like Accessibility Insights and screen reader testing are still recommended.

#### Test Coverage

The library’s test suite includes a targeted pair of tests verifying both behaviors (hydration vs empty) so we don’t need to duplicate every scenario across both binding styles.

> ℹ️ This recommendation aligns with the library’s goal of **unidirectional data flow**: external model → controls; user interaction → internal form → external model (single path outward).

---

## Building Form Fields & Displaying Errors

A key part of any forms library is how it handles UI, particularly error messages. `ngx-vest-forms` provides two powerful approaches: a convenient pre-built wrapper and a composable directive for building your own custom form fields.

### 1. The Easy Way: `NgxControlWrapper`

For maximum convenience, the library includes `NgxControlWrapper`, an optional UI helper that handles everything you need for a form field:

- A container for your `<label>` and control (`<input>`, `<select>`, etc.).
- Automatic error message display with smooth animations.
- Pending (async validation) indicator.
- Accessibility (ARIA attributes) baked in.

**Installation & Usage:**

The `NgxControlWrapper` is available from a secondary entry point to keep the core bundle small.

```typescript
// Import from the control-wrapper secondary entry point
import { NgxControlWrapper } from 'ngx-vest-forms/control-wrapper';

@Component({
  imports: [ngxVestForms, NgxControlWrapper],
  // ...
})
export class MyFormComponent {}
```

**📖 [Complete Control Wrapper & Advanced Directives Documentation](./projects/ngx-vest-forms/control-wrapper/README.md)**

#### CSS Custom Properties Theming

The `NgxControlWrapper` supports complete theming via CSS custom properties. You can override the default colors and styling by setting CSS variables:

```css
:root {
  /* Error colors (defaults to red-600/red-500) */
  --ngx-vest-forms-error-color: #dc2626;
  --ngx-vest-forms-error-color-light: #ef4444;
  --ngx-vest-forms-error-shadow: rgb(220 38 38 / 0.2);

  /* Warning colors (defaults to yellow-600/yellow-500) */
  --ngx-vest-forms-warning-color: #d97706;
  --ngx-vest-forms-warning-color-light: #f59e0b;
  --ngx-vest-forms-warning-shadow: rgb(217 119 6 / 0.3);
}

/* Theme specific forms */
.my-custom-form {
  --ngx-vest-forms-error-color: #991b1b;
  --ngx-vest-forms-warning-color: #92400e;
}
```

The styling follows a CSS pseudo-class driven approach:

- **`:focus:invalid`** - Progressive warnings while user is actively typing (soft orange feedback)
- **`:invalid:not(:focus)`** - Final errors when user has finished editing (hard red feedback)

**📖 [Complete CSS Theming Guide](./docs/CSS_CUSTOM_PROPERTIES_GUIDE.md)**

### 2. The Flexible Way: Build Your Own with `NgxFormErrorDisplayDirective`

For complete control over your form field's markup and behavior, you can easily create your own wrapper component. This is the recommended approach for building a reusable component library.

The `NgxFormErrorDisplayDirective` provides all the necessary logic and state signals. You can use it as a `hostDirective` to instantly power your custom component.

**Why build your own?**

- **Full Design Control:** Match your application's specific design system.
- **Reusable Logic:** Create a standardized form field component for your entire application.
- **Composition:** Add any other directives or behaviors you need.

**Example Custom Field Component:**

```typescript
// my-form-field.component.ts
import { Component, inject } from '@angular/core';
import { NgxFormErrorDisplayDirective } from 'ngx-vest-forms';

@Component({
  selector: 'my-form-field',

  hostDirectives: [NgxFormErrorDisplayDirective],
  template: `
    <ng-content />

    @if (formErrorDisplay.isPending()) {
      <div class="spinner">Validating...</div>
    } @else if (formErrorDisplay.shouldShowErrors()) {
      <div class="errors">
        @for (error of formErrorDisplay.errors(); track error) {
          <div class="error-message">{{ error }}</div>
        }
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
      margin-bottom: 1rem;
    }
    .error-message {
      color: red;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }
  `,
})
export class MyFormFieldComponent {
  // Inject the directive to access its API
  protected readonly formErrorDisplay = inject(NgxFormErrorDisplayDirective, {
    self: true,
  });
}
```

**Usage in a Form:**

```html
<!-- In your form component's template -->
<form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
  <my-form-field>
    <label for="name">Name</label>
    <input id="name" name="name" [ngModel]="model().name" />
  </my-form-field>
  <!-- ... other fields ... -->
</form>
```

---

## Building Your Own Custom Control Wrapper

You are not limited to the default `<ngx-control-wrapper>` component. For full design control, you can use the `NgxFormErrorDisplayDirective` directly to build your own custom wrapper component. This is ideal if you want to match your application's design system or use a different CSS framework (e.g., not Tailwind CSS).

### Example: Custom Control Wrapper Component

```typescript
import { Component, inject } from '@angular/core';
import { NgxFormErrorDisplayDirective } from 'ngx-vest-forms';

@Component({
  selector: 'custom-control-wrapper',

  hostDirectives: [NgxFormErrorDisplayDirective],
  template: `
    <ng-content />
    @if (formErrorDisplay.isPending()) {
      <div class="my-spinner">Validating...</div>
    } @else if (formErrorDisplay.shouldShowErrors()) {
      <div class="my-errors">
        @for (error of formErrorDisplay.errors(); track error) {
          <div class="my-error-message">{{ error }}</div>
        }
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
      margin-bottom: 1rem;
    }
    .my-error-message {
      color: #d32f2f;
      font-size: 0.9rem;
      margin-top: 0.25rem;
    }
    .my-spinner {
      color: #1976d2;
      font-size: 0.9rem;
    }
    .my-errors {
      margin-top: 0.25rem;
    }
  `,
})
export class CustomControlWrapperComponent {
  protected readonly formErrorDisplay = inject(NgxFormErrorDisplayDirective, {
    self: true,
  });
}
```

**Usage in a Form:**

```html
<form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
  <custom-control-wrapper>
    <label for="name">Name</label>
    <input id="name" name="name" [ngModel]="model().name" />
  </custom-control-wrapper>
  <!-- ... other fields ... -->
</form>
```

**Tip:** You can style `.my-error-message`, `.my-spinner`, and `.my-errors` however you like. This approach works with any CSS framework or custom styles.

For more details, see the [Advanced Directives Documentation](./projects/ngx-vest-forms/control-wrapper/README.md).

---

## Form-Level (Cross-Field) Validation

For validation that depends on multiple fields or involves form-wide business rules, `ngx-vest-forms` provides opt-in form-level validation.

### When to Use It

- **Password confirmation**: Ensuring password and confirm password fields match
- **Cross-field dependencies**: At least one contact method (email or phone) required
- **Business rules**: Form-wide constraints like minimum order amounts
- **Submit-gated validation**: Rules that should only run after the user attempts to submit

### Basic Usage

Form-level validation requires two things:

1. Add `formLevelValidation` attribute to enable the feature
2. Provide a dedicated `[formLevelSuite]` for your cross-field validation rules

```typescript
// form-level.validations.ts
import { staticSuite, test, enforce } from 'vest';
import { NGX_ROOT_FORM } from 'ngx-vest-forms/core';

export const formLevelValidations = staticSuite((data = {}) => {
  test(NGX_ROOT_FORM, 'Passwords must match', () => {
    enforce(data.confirmPassword).equals(data.password);
  });

  test(NGX_ROOT_FORM, 'At least one contact method required', () => {
    enforce(data.email || data.phone).isTruthy();
  });
});
```

```html
<form
  ngxVestForm
  [vestSuite]="fieldSuite"           <!-- Field-level validation -->
  formLevelValidation                <!-- Enable form-level validation -->
  [formLevelSuite]="formLevelSuite"  <!-- Form-level validation suite -->
  [(formValue)]="model"
  #form="ngxVestForm"
>
  <input name="password" [ngModel]="model().password" />
  <input name="confirmPassword" [ngModel]="model().confirmPassword" />

  <!-- Display form-level errors -->
  @if (form.formState().root?.errors?.length) {
    <div class="form-level-errors">
      @for (error of form.formState().root.errors; track error) {
        <p class="error">{{ error }}</p>
      }
    </div>
  }
</form>
```

### Validation Modes

Form-level validation supports two modes:

- **Submit mode** (default): Validation runs only after the first form submission
- **Live mode**: Validation runs in real-time as users interact with the form

```html
<!-- Submit mode (default) - better UX for complex validation -->
<form ngxVestForm formLevelValidation [formLevelSuite]="suite">
  <!-- Live mode - immediate feedback -->
  <form
    ngxVestForm
    formLevelValidation
    [formLevelValidationMode]="'live'"
    [formLevelSuite]="suite"
  ></form>
</form>
```

### Migration from v1

If you're upgrading from v1, the API has changed significantly for better clarity and performance:

```html
<!-- v1 (old) -->
<form
  scVestForm
  [suite]="suite"
  [validateRootForm]="true"
  (errorsChange)="errors.set($event)"
>
  <!-- v2 (new) -->
  <form
    ngxVestForm
    [vestSuite]="fieldSuite"
    formLevelValidation
    [formLevelSuite]="formLevelSuite"
    #form="ngxVestForm"
  ></form>
</form>
```

For complete migration details, see the [Migration Guide](./docs/MIGRATION_GUIDE_V2.md#6-root-level-cross-field-validation--breaking).

---

## Advanced Features

Beyond the basics, `ngx-vest-forms` offers powerful, optional modules for advanced scenarios. These are available as secondary entry points to keep the core library lean.

### Smart State Management

For complex applications that need intelligent data merging, conflict resolution, and external data synchronization, `ngx-vest-forms` provides advanced smart state management.

**When to Use It:**

- **User profiles** that might be updated by admins while users are editing.
- **Collaborative editing** with real-time synchronization.
- **Long-running forms** where external data changes during editing.
- **Mobile/offline apps** that sync when connectivity returns.

**Installation & Usage:**

Smart state management is available from `ngx-vest-forms/smart-state`:

```typescript
// Import from the smart-state secondary entry point
import { NgxVestFormsSmartStateDirective } from 'ngx-vest-forms/smart-state';

@Component({

  imports: [ngxVestForms, NgxVestFormsSmartStateDirective],
  template: `
    <form ngxVestForm [(formValue)]="model" ngxVestFormsSmartState>
      <!-- fields -->
    </form>
  `,
})
export class AdvancedFormComponent {
  protected readonly model = signal({ ... });
}
```

**📖 [Smart State Management Documentation](./projects/ngx-vest-forms/smart-state/README.md)**

### Schema Utilities for Type Safety

**Recommended:** For type safety and schema-driven validation, use [Zod](https://zod.dev/), [Valibot](https://valibot.dev/), or [ArkType](https://arktype.io/). These libraries follow the [Standard Schema](https://standardschema.dev/) initiative and provide robust, interoperable schemas for your forms.

- **Zod**: Popular, expressive, and TypeScript-first schema library.
- **Valibot**: Lightweight, fast, and modern schema validation.
- **ArkType**: Advanced type-level schema validation and inference.

**Example Usage:**

```typescript
import { z } from 'zod';
const userSchema = z.object({ name: z.string(), email: z.string().email() });
type User = z.infer<typeof userSchema>;

@Component({
  template: `
    <form ngxVestForm [formSchema]="userSchema" [(formValue)]="userData">
      <!-- form fields -->
    </form>
  `,
})
export class UserFormComponent {
  protected readonly userSchema = userSchema;
  protected readonly userData = signal<User>({ name: '', email: '' });
}
```

**Fallback:** If you have legacy models or custom requirements, use `modelToStandardSchema` to generate a schema from a plain object template.

```typescript
import { ngxModelToStandardSchema } from 'ngx-vest-forms/schemas';
const userTemplate = { name: '', age: 0 };
const userSchema = ngxModelToStandardSchema(userTemplate);
type User = InferSchemaType<typeof userSchema>;
```

**API Reference & Migration Guidance:**

- Prefer Zod, Valibot, or ArkType for new and migrated forms.
- Use `modelToStandardSchema` only for legacy or custom scenarios.
- See the [schemas README](./projects/ngx-vest-forms/schemas/README.md) for details and migration notes.

---

## Utilities & Helper Functions

### Form State Utilities

#### `createEmptyFormState<TModel>()`

Creates an empty `NgxFormState` with default values for use as fallbacks when form state might be undefined.

**Use Case:** When displaying child form state that may not be initialized yet, such as in parent components with FormStateDisplay.

**Import:**

```typescript
import { createEmptyFormState } from 'ngx-vest-forms/core';
```

**Basic Usage:**

```typescript
@Component({
  template: `
    <!-- FormStateDisplay requires non-null NgxFormState -->
    <ngx-form-state-display
      [formState]="formState()"
      title="Child Form State"
    />
  `,
})
export class ParentComponent {
  private readonly childForm = viewChild<MyFormComponent>('childForm');

  // Provide type-safe fallback for FormStateDisplay
  protected readonly formState = computed(
    () => this.childForm()?.formState() ?? createEmptyFormState(),
  );
}
```

**With Type Safety:**

```typescript
interface UserModel {
  name: string;
  email: string;
}

// Type-safe empty state with proper model type
const emptyState = createEmptyFormState<UserModel>();
```

**Key Benefits:**

- **Type Safety**: Generic support for proper typing
- **Consistency**: Eliminates verbose boilerplate across components
- **Compatibility**: Always compatible with FormStateDisplay expectations
- **Developer Experience**: Reduces 17 lines of fallback code to 1 function call

**Properties Set:**

```typescript
{
  value: null,
  errors: {},
  warnings: {},
  root: null,
  status: 'VALID',
  dirty: false,
  valid: true,
  invalid: false,
  pending: false,
  disabled: false,
  idle: true,
  submitted: false,
  errorCount: 0,
  warningCount: 0,
  firstInvalidField: null,
  schema: undefined
}
```

#### `arrayToObject<T>()` and `objectToArray()`

Utility functions for converting between arrays and objects for dynamic form arrays with `ngModelGroup`.

**Import:**

```typescript
import { arrayToObject, objectToArray } from 'ngx-vest-forms/core';
```

**Usage:**

```typescript
// Convert array to object for ngModelGroup compatibility
const phoneArray = ['123-456-7890', '098-765-4321'];
const phoneObject = arrayToObject(phoneArray);
// Result: { 0: '123-456-7890', 1: '098-765-4321' }

// Convert back to array for API submission
const backToArray = objectToArray(phoneObject, ['phoneNumbers']);
```

**📖 [Complete Utilities Documentation](./docs/ngx-vest-forms-best-practices.md#utility-types-and-functions)**

---

## Migration & Documentation Resources

- 📋 **[v2 Migration Guide](./docs/MIGRATION_GUIDE_V2.md)** - Step-by-step migration instructions
- ⚠️ **[Breaking Changes (Public API)](./docs/BREAKING_CHANGES_PUBLIC_API.md)** - All breaking changes
- 🏗️ **[Breaking Changes (Internal)](./docs/BREAKING_CHANGES_INTERNAL.md)** - For contributors/maintainers
- 📝 **[Changes Overview](./docs/CHANGES_OVERVIEW.md)** - High-level summary

---

## Migrating from v1?

If you're upgrading from ngx-vest-forms v1, see the [Migration Guide](./docs/MIGRATION_GUIDE_V2.md) and [Breaking Changes Overview](./docs/BREAKING_CHANGES_PUBLIC_API.md) for step-by-step instructions, API changes, and troubleshooting tips. Most users need zero code changes, but see the guides for schema utilities, error object migration, and advanced features.

## Common Pitfalls & Troubleshooting

- **HTML Validation Interference:** 🚨 **CRITICAL** - Avoid HTML validation attributes (`min`, `max`, `required`, `pattern`, `minlength`, `maxlength`) on form controls. Even though `ngxVestForm` automatically adds `novalidate`, these attributes can still interfere with Vest validation logic, form validity state, and error display timing. Define all validation rules in your Vest suite instead.
- **Type Errors:** Update all imports and type references to use the new NGX-prefixed APIs.
- **Error Display Issues:** v2 errors are arrays, not strings. Update your error display logic to handle multiple errors per field.
- **Import Errors:** Optional features (schemas, smart state, control wrapper) are now secondary entry points—update your imports accordingly.
- **Deprecated APIs:** Legacy signals and old error config are removed. Use the new unified APIs and configuration system.
- **Schema Migration:** If you used `validateShape`, migrate to `modelToStandardSchema` or a schema adapter (see below).

## Migration from Core

If you were previously using shape validation in v1:

```typescript
// Before (v1)
import { validateShape } from 'ngx-vest-forms';
validateShape(formValue, shape);

// After (v2)
import { ngxModelToStandardSchema } from 'ngx-vest-forms/schemas';
const schema = ngxModelToStandardSchema(shape);
// Use schema for validation, type inference, etc.
```

## Real-World Schema Adapter Example (Zod)

```typescript
import { z } from 'zod';
import { zodAdapter } from 'ngx-vest-forms/schemas';

const userSchema = z.object({ name: z.string(), email: z.string().email() });
const standardSchema = zodAdapter(userSchema);
```

---

## Real-World Examples

### Basic Form

```typescript
// user-form.component.ts
import { Component, signal } from '@angular/core';
import { ngxVestForms } from 'ngx-vest-forms/core';
import { NgxControlWrapper } from 'ngx-vest-forms/control-wrapper';
import { userModel } from './user.model';
import { userValidations } from './user.validations';

@Component({
  imports: [ngxVestForms, NgxControlWrapper],
  template: `
    <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
      <ngx-control-wrapper>
        <label for="name">Name</label>
        <input id="name" name="name" [ngModel]="model().name" />
      </ngx-control-wrapper>

      <ngx-control-wrapper>
        <label for="email">Email</label>
        <input id="email" name="email" [ngModel]="model().email" type="email" />
      </ngx-control-wrapper>
    </form>
  `,
})
export class UserFormComponent {
  protected readonly model = signal(userModel);
  protected readonly suite = userValidations;
}
```

### Advanced: Smart State

```typescript
import { NgxVestFormsSmartStateDirective } from 'ngx-vest-forms/smart-state';
@Component({

  imports: [ngxVestForms, NgxVestFormsSmartStateDirective],
  template: `
    <form ngxVestForm [(formValue)]="model" ngxVestFormsSmartState>
      <!-- fields -->
    </form>
  `,
})
export class AdvancedFormComponent {
  protected readonly model = signal({ ... });
}
```

### Schema Integration

```typescript
import { ngxModelToStandardSchema } from 'ngx-vest-forms/schemas';
const userSchema = ngxModelToStandardSchema({ name: '', age: 0 });
type User = InferSchemaType<typeof userSchema>;
```

Use with the convenient wrapper:

```html
<form
  ngxVestFormWithSchema
  [vestSuite]="suite"
  [formSchema]="userSchema"
  [(formValue)]="model"
>
  <!-- fields -->
</form>
```

---

## Error Display Modes & Accessibility

- **Error display modes:** `'on-blur'`, `'on-submit'`, `'on-blur-or-submit'` (default). Configure globally or per control wrapper.
- **Accessibility:** All wrappers/components use ARIA roles, keyboard navigation, and visible focus indicators. Error messages are announced for screen readers.

### Manual Error Handling (Without Control Wrappers)

When building custom form fields without `NgxControlWrapper`, you have **two approaches** for error display:

#### 1. Recommended: `ngxFormErrorDisplay` Directive

Use this directive for proper error timing and better UX:

```html
<div
  ngxFormErrorDisplay
  #fieldDisplay="formErrorDisplay"
  [attr.data-invalid]="fieldDisplay.shouldShowErrors() ? 'true' : null"
>
  <input name="email" [ngModel]="model().email" />
  @if (fieldDisplay.shouldShowErrors()) {
  <ul class="errors" role="alert">
    @for (error of fieldDisplay.errors(); track error) {
    <li>{{ error }}</li>
    }
  </ul>
  }
</div>
```

**Benefits:**

- ✅ Errors appear only after blur or submit (better UX)
- ✅ Follows configured `errorDisplayMode`
- ✅ Accessibility-compliant with `role="alert"`
- ✅ Consistent timing across all form fields

#### 2. Direct Access (Immediate Display)

For debugging or immediate feedback:

```html
<div class="form-field">
  <input name="email" [ngModel]="model().email" />
  @if (vestForm.formState().errors['email']; as errors) { @for (error of errors;
  track error) {
  <span class="error">{{ error }}</span>
  } }
</div>
```

**Use cases:** Development/debugging, admin interfaces, immediate feedback requirements.

> **Best Practice:** Use `ngxFormErrorDisplay` for production forms to ensure proper error timing and accessibility compliance.

### Configure defaults (DI providers)

Configure core defaults at app/route/component level using provider helpers from `ngx-vest-forms/core`:

```ts
import { ApplicationConfig } from '@angular/core';
import {
  provideNgxVestFormsCore,
  withRootFormKey,
  withErrorDisplayMode,
} from 'ngx-vest-forms/core';

export const appConfig: ApplicationConfig = {
  providers: [
    ...provideNgxVestFormsCore({
      rootFormKey: 'form',
      errorDisplayMode: 'on-blur-or-submit',
    }),
    // Or granular
    withRootFormKey('form'),
    withErrorDisplayMode('on-submit'),
  ],
};
```

---

## ⚠️ Critical: Form Control Names

> **Required:** The `name` attribute on form controls MUST match the property name in your model signal.

```html
<!-- ✅ CORRECT - name matches model property -->
<input name="email" [ngModel]="model().email" />

<!-- ❌ WRONG - name doesn't match model property -->
<input name="user_email" [ngModel]="model().email" />
```

### Technical Requirements

**Technical Reason:**

- **Vest validates** against your model property names (`email`)
- **Angular registers controls** using the `name` attribute (`user_email`)
- **The library maps validation errors** between Vest results and Angular form controls
- **Mismatches prevent** validation errors from displaying correctly

### Symptoms of Name Mismatch

- ✅ Validation runs (you can see it in Vest suite execution)
- ❌ Errors don't appear in the UI
- ❌ Form value has unexpected property names
- ❌ Type safety breaks between form and model
- ❌ Schema validation fails to map correctly

### Special Cases

**Nested Objects with `ngModelGroup`:**

```html
<div ngModelGroup="address">
  <!-- name must match the nested property path -->
  <input name="street" [ngModel]="model().address.street" />
  <input name="city" [ngModel]="model().address.city" />
</div>
```

**Dynamic Forms/Arrays:**

```html
<div *ngFor="let item of items; let i = index">
  <!-- Use computed property paths for dynamic forms -->
  <input [name]="'items.' + i + '.value'" [ngModel]="item.value" />
</div>
```

**With Schema Validation:**
When using schemas (`ngxVestFormWithSchema`), the schema property names, Vest suite field names, and HTML `name` attributes must all align:

```typescript
// Schema defines structure
const schema = z.object({
  userEmail: z.string().email(), // ← This name
});

// Vest suite validates same field names
const suite = staticSuite((data, field) => {
  test('userEmail', 'Invalid email', () => {
    // ← Same name
    enforce(data.userEmail)
      .isNotEmpty()
      .matches(/^[^@]+@[^@]/);
  });
});
```

```html
<!-- HTML name attribute matches both -->
<input name="userEmail" [ngModel]="model().userEmail" />
```

---

## Troubleshooting & FAQ

**Q: Why aren't my validation errors showing in the UI?**

- **First, check the `name` attribute:** Ensure `name="fieldName"` matches your model property exactly (`[ngModel]="model().fieldName"`)
- Check your error display mode (`errorDisplayMode`). Default is `'on-blur-or-submit'`.
- If using `ngModelOptions.updateOn: 'submit'`, errors only show after submit.
- Verify your Vest suite is running by adding `console.log` in the test functions.

**Q: Why are my validation errors inconsistent or showing strange browser messages?**

- **🚨 CRITICAL:** Remove HTML validation attributes (`min`, `max`, `required`, `pattern`, `minlength`, `maxlength`) from your form controls. Even though `ngxVestForm` automatically adds `novalidate`, these attributes can still interfere with Vest validation. Define all validation rules in your Vest suite instead.

**Q: Why aren't my errors showing?**

- Check your error display mode (`errorDisplayMode`). Default is `'on-blur-or-submit'`.
- If using `ngModelOptions.updateOn: 'submit'`, errors only show after submit.

**Q: How do I migrate from v1?**

- See the [Migration Guide](./docs/MIGRATION_GUIDE_V2.md). Most users only need to update imports and selectors.

**Q: Can I use my own form field components?**

- Yes! Use `NgxFormErrorDisplayDirective` as a host directive for custom wrappers.

**Q: How do I enable form-level (cross-field) validation?**

- Add `formLevelValidation` to your form and provide a dedicated `[formLevelSuite]`. Use `NGX_ROOT_FORM` in your Vest suite for the root form key.

**Q: How do I get type safety for my form model?**

- Use schema utilities (`ngxModelToStandardSchema`, Zod, Valibot, ArkType) for compile-time safety and IDE inference.

---

## Migration & Documentation Quick Links

- 📋 **[v2 Migration Guide](./docs/MIGRATION_GUIDE_V2.md)** - Step-by-step migration instructions
- ⚠️ **[Breaking Changes (Public API)](./docs/BREAKING_CHANGES_PUBLIC_API.md)** - All breaking changes
- 🏗️ **[Breaking Changes (Internal)](./docs/BREAKING_CHANGES_INTERNAL.md)** - For contributors/maintainers

---

## Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/simplifiedcourses/ngx-vest-forms/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/simplifiedcourses/ngx-vest-forms/discussions)
- 📚 **Documentation**: All guides linked above
- 💡 **Examples**: Working examples in [projects/examples/](./projects/examples/)

---

## 📚 Feature Documentation & Further Reading

- **Examples Gallery:** [projects/examples/README.md](./projects/examples/README.md) — Progressive, real-world examples from basic to advanced.
- **Control Wrapper Guide:** [projects/ngx-vest-forms/control-wrapper/README.md](./projects/ngx-vest-forms/control-wrapper/README.md) — Error display, accessibility, and UI abstraction.
- **Schema Utilities Guide:** [projects/ngx-vest-forms/schemas/README.md](./projects/ngx-vest-forms/schemas/README.md) — Type safety, schema integration, and API reference.
- **Smart State Management:** [projects/ngx-vest-forms/smart-state/README.md](./projects/ngx-vest-forms/smart-state/README.md) — Advanced state management, conflict resolution, and external data sync.
