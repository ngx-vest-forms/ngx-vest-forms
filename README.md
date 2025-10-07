# ngx-vest-forms (v2)

> **The most productive way to build accessible forms in Angular**
> Vest-first validation with automatic accessibility, zero boilerplate, and built-in best practices.

[![npm version](https://badge.fury.io/js/ngx-vest-forms.svg)](https://www.npmjs.com/package/ngx-vest-forms)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What You Get for Free

ngx-vest-forms eliminates the tedious parts of form development:

| Feature                 | Without ngx-vest-forms                                    | With ngx-vest-forms                |
| ----------------------- | --------------------------------------------------------- | ---------------------------------- |
| **ARIA Attributes**     | 15+ lines per field (aria-invalid, aria-describedby, IDs) | ✅ **Automatic**                   |
| **Form Busy State**     | Manual aria-busy bindings on every form                   | ✅ **Automatic**                   |
| **Error Display**       | Custom component + state management                       | ✅ **Built-in `<ngx-form-error>`** |
| **Touch Detection**     | Manual blur handlers + state tracking                     | ✅ **Automatic**                   |
| **Async Validation**    | Race conditions + AbortController wiring                  | ✅ **Built-in with `test.memo()`** |
| **Field Signals**       | Manual wiring (value, valid, errors, etc.)                | ✅ **Auto-generated proxies**      |
| **Code per Field**      | ~20-30 lines                                              | **~3-5 lines**                     |
| **WCAG 2.2 Compliance** | Manual implementation                                     | ✅ **By default**                  |

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

## ⚡ Quick Start - Batteries Included

Here's a **complete, production-ready, accessible** contact form in **under 40 lines**:

```typescript
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { createVestForm, NgxVestForms, staticSafeSuite } from 'ngx-vest-forms';
import { test, enforce } from 'vest';

// 1. Define validation rules (use staticSafeSuite for simplicity)
const contactSuite = staticSafeSuite((data = {}) => {
  test('email', 'Email is required', () => {
    enforce(data.email).isNotEmpty();
  });
  test('email', 'Invalid email format', () => {
    enforce(data.email).isEmail();
  });
  test('message', 'Message is required', () => {
    enforce(data.message).isNotEmpty();
  });
});

// 2. Build your form with NgxVestForms (auto-ARIA + auto-touch + error component)
@Component({
  selector: 'app-contact',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxVestForms], // ← ONE import for everything!
  template: `
    <form [ngxVestForm]="form" (submit)="save($event)">
      <label for="email">Email *</label>
      <input
        id="email"
        type="email"
        [value]="form.email()"
        (input)="form.setEmail($event)"
      />
      <ngx-form-error [field]="form.emailField()" />

      <label for="message">Message *</label>
      <textarea
        id="message"
        [value]="form.message()"
        (input)="form.setMessage($event)"
      ></textarea>
      <ngx-form-error [field]="form.messageField()" />

      <button type="submit" [disabled]="form.pending()">Send</button>
    </form>
  `,
})
export class ContactFormComponent {
  form = createVestForm(contactSuite, signal({ email: '', message: '' }));

  async save(event: Event) {
    event.preventDefault();
    const result = await this.form.submit();
    if (result.valid) {
      console.log('✅ Sending:', result.data);
    }
  }
  // Note: No ngOnDestroy needed - staticSafeSuite has no subscriptions!
}
```

**That's it!** You now have:

- ✅ WCAG 2.2 Level AA compliant form
- ✅ Automatic `aria-invalid="true"` when fields have errors
- ✅ Automatic `aria-describedby` linking errors to inputs
- ✅ Automatic `aria-busy="true"` during async operations
- ✅ Progressive error disclosure (errors appear after blur or submit)
- ✅ Visual error messages with proper semantic markup (`role="alert"`)
- ✅ Dark mode support
- ✅ Zero boilerplate - 80% less code than traditional forms

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
const form = createVestForm(suite, {
  email: '',
  profile: { name: '', age: 0 },
});

// ✅ Value signals (read-only)
form.email(); // Signal<string>
form.profileName(); // Nested: profile.name → profileName()

// ✅ Validation signals (computed, read-only)
form.emailValid(); // Signal<boolean>
form.emailErrors(); // Signal<string[]>
form.emailTouched(); // Signal<boolean>
form.emailPending(); // Signal<boolean> - async validation
form.emailShowErrors(); // Signal<boolean> - based on error strategy

// ✅ Field object (for advanced usage)
form.emailField(); // Complete field state for <ngx-form-error>

// ✅ Setters (handle Events or raw values)
form.setEmail($event); // Accepts DOM Event from (input)
form.setEmail('test@example.com'); // Or raw value
form.touchEmail(); // Mark as touched (optional - auto on blur)
form.resetEmail(); // Reset to initial value
```

## 🔍 Enhanced Proxy API

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
        (blur)="form.touchEmail()"
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
        (blur)="form.touchPassword()"
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

When using **async validation with `test.memo()`**, you MUST use `createSafeSuite` AND call `dispose()` in `ngOnDestroy`:

```typescript
import {
  Component,
  signal,
  OnDestroy,
  ChangeDetectionStrategy,
} from '@angular/core';
import { createVestForm, NgxVestForms, createSafeSuite } from 'ngx-vest-forms';
import { test, enforce, skipWhen, warn, include } from 'vest';

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
    this.form.dispose(); // ✅ REQUIRED when using createSafeSuite (has subscription)
  }
}
```

**This example demonstrates:**

- ✅ Async validation with `test.memo()` (email uniqueness check)
- ✅ Conditional validation with `include().when()` (confirmPassword)
- ✅ Non-blocking warnings with `warn()` (password strength)
- ✅ Race condition protection with `AbortSignal`
- ✅ Pending state UI (`form.pending()`, `form.submitting()`)
- ✅ Proper cleanup with `ngOnDestroy()` (required for `createSafeSuite`)
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
form.valid(); // Signal<boolean> - is form valid?
form.pending(); // Signal<boolean> - async validation running?
form.submitting(); // Signal<boolean> - submit() in progress?
form.errors(); // Signal<Record<string, string[]>> - all errors
form.model(); // Signal<TModel> - current form data
form.result(); // Signal<SuiteResult> - raw Vest result

// Per-field signals (auto-generated via proxy)
form.fieldName(); // Signal<T> - field value
form.fieldNameValid(); // Signal<boolean> - field valid?
form.fieldNameErrors(); // Signal<string[]> - field errors
form.fieldNameWarnings(); // Signal<string[]> - field warnings
form.fieldNameTouched(); // Signal<boolean> - user interacted?
form.fieldNamePending(); // Signal<boolean> - async validation?
form.fieldNameShowErrors(); // Signal<boolean> - show errors based on strategy
form.fieldNameField(); // Complete field state for <ngx-form-error>
```

### Form Operations

```typescript
// Validation
await form.submit(); // Validates all fields, returns data (throws if invalid)
form.validate(); // Re-run all validations
form.validate('fieldName'); // Re-run specific field validation

// Field manipulation
form.setFieldName($event); // Set field value (accepts Event or raw value)
form.touchFieldName(); // Mark field as touched (triggers error display)
form.resetFieldName(); // Reset field to initial value

// Form-level operations
form.reset(); // Reset entire form to initial state
form.dispose(); // Clean up subscriptions (call in ngOnDestroy)
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

// ⚠️ dispose() REQUIRED - createSafeSuite maintains a subscription
@Component({...})
export class AsyncFormComponent implements OnDestroy {
  form = createVestForm(createSafeSuite((data) => {
    test.memo('email', 'Taken', async ({ signal }) => {
      await checkEmail(data.email, { signal });
    }, [data.email]);
  }), signal({ ... }));

  ngOnDestroy() {
    this.form.dispose(); // ✅ REQUIRED to prevent memory leaks!
  }
}
```

**Rule of thumb:** Only call `dispose()` when using `createSafeSuite` (for `test.memo()` async caching).

### 2. Use `staticSafeSuite` to Prevent Bugs

```typescript
// ❌ BAD - Manual only() guard (easy to forget!)
import { staticSuite, only } from 'vest';
const suite = staticSuite((data, field) => {
  if (field) only(field); // Forgetting this breaks validation!
});

// ✅ GOOD - Automatic guard
import { staticSafeSuite } from 'ngx-vest-forms';
const suite = staticSafeSuite((data) => {
  // No guard needed - wrapper handles it!
});
```

**Why?** Calling `only(undefined)` tells Vest to run **ZERO tests**, breaking validation.

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

### Core Contributors & Inspirations

**[Evyatar Alush](https://twitter.com/evyataral)** - Creator of [Vest.js](https://vestjs.dev/)

- 🎯 **The validation engine** that powers ngx-vest-forms
- 🎙️ **Featured on PodRocket**: [Vest with Evyatar Alush](https://dev.to/podrocket/vest-with-evyatar-alush) - Deep dive into the philosophy and architecture of Vest.js

**[Ward Bell](https://twitter.com/wardbell)** - Template-Driven Forms Advocate

- 📢 **Evangelized Template-Driven Forms**: [Prefer Template-Driven Forms](https://devconf.net/talk/prefer-template-driven-forms-ward-bell-ng-conf-2021) (ng-conf 2021)
- 🎥 **Original Vest.js + Angular Integration**: [Form validation done right](https://www.youtube.com/watch?v=EMUAtQlh9Ko) - The foundational talk that inspired this approach
- 💻 **Early Implementation**: [ngc-validate](https://github.com/wardbell/ngc-validate) - The initial version of template-driven forms with Vest.js

These pioneers laid the groundwork that made ngx-vest-forms possible, combining the power of declarative validation with the elegance of Angular's template-driven approach.

**Ready to get started?** Check out the [examples folder](./projects/examples/src/app/01-fundamentals) for more patterns!
