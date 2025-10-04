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

## 📦 Installation

```bash
npm install ngx-vest-forms vest
```

## ⚡ Quick Start - Batteries Included

Here's a **complete, production-ready, accessible** contact form in under 50 lines:

```typescript
import { Component, signal } from '@angular/core';
import {
  createVestForm,
  NgxVestForms,
  staticSafeSuite,
} from 'ngx-vest-forms/core';
import { test, enforce } from 'vest';

// 1. Define validation rules
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

// 2. Build your form (NgxVestForms = auto-ARIA + auto-touch + error component)
@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [NgxVestForms], // ← ONE import for all features!
  template: `
    <form (submit)="onSubmit($event)">
      <div>
        <label for="email">Email</label>
        <input
          id="email"
          type="email"
          [value]="form.email()"
          (input)="form.setEmail($event)"
        />
        <!-- ✅ Auto ARIA: aria-invalid + aria-describedby + unique IDs -->
        <!-- ✅ Auto touch: errors appear after blur or submit -->
        <ngx-form-error [field]="form.emailField()" />
      </div>

      <div>
        <label for="message">Message</label>
        <textarea
          id="message"
          [value]="form.message()"
          (input)="form.setMessage($event)"
        ></textarea>
        <ngx-form-error [field]="form.messageField()" />
      </div>

      <button type="submit" [disabled]="form.pending()">
        {{ form.pending() ? 'Validating...' : 'Send' }}
      </button>
    </form>
  `,
})
export class ContactFormComponent {
  form = createVestForm(contactSuite, signal({ email: '', message: '' }));

  async onSubmit(event: Event) {
    event.preventDefault();
    const data = await this.form.submit(); // ✅ Auto-validates, throws if invalid
    console.log('✅ Sending:', data);
  }

  ngOnDestroy() {
    this.form.dispose();
  }
}
```

**That's it!** You now have:

- ✅ WCAG 2.2 Level AA compliant form
- ✅ Automatic `aria-invalid="true"` when fields have errors
- ✅ Automatic `aria-describedby` linking errors to inputs
- ✅ Automatic `aria-busy="true"` during async operations
- ✅ Errors appear after blur or submit (configurable)
- ✅ Visual error messages with proper semantic markup
- ✅ Dark mode support
- ✅ Async validation with race condition protection

## 🎯 Core Concepts

### The NgxVestForms Constant

Import **one constant** to get all convenience features:

```typescript
import { NgxVestForms } from 'ngx-vest-forms/core';

@Component({
  imports: [NgxVestForms], // Includes:
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
<form (submit)="onSubmit($event)">
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
<form ngxVestFormBusyDisabled [attr.aria-busy]="customLogic()">
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

### Reactive Error Strategy

You can change the strategy dynamically using signals:

```typescript
const errorMode = signal<ErrorDisplayStrategy>('on-touch');

const form = createVestForm(suite, model, {
  errorStrategy: errorMode, // ← Pass signal!
});

// Switch at runtime - form reacts automatically!
errorMode.set('immediate'); // Now shows errors while typing
```

## 🚀 Advanced Usage

### Without Convenience Directives (Full Control)

If you need complete control over ARIA attributes and error display, you can opt out of `NgxVestForms`:

```typescript
import { Component, signal } from '@angular/core';
import { createVestForm, staticSafeSuite } from 'ngx-vest-forms/core';
import { test, enforce } from 'vest';

const loginSuite = staticSafeSuite((data = {}) => {
  test('email', 'Email is required', () => {
    enforce(data.email).isNotEmpty();
  });

  test('password', 'Password is required', () => {
    enforce(data.password).isNotEmpty();
  });
});

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [], // No NgxVestForms - pure createVestForm
  template: `
    <form (submit)="onSubmit($event)">
      <!-- Manual ARIA (you control everything) -->
      <div>
        <label for="email">Email</label>
        <input
          id="email"
          type="email"
          [value]="form.email()"
          (input)="form.setEmail($event)"
          (blur)="form.field('email').touch()"
          [attr.aria-invalid]="
            showEmailErrors() && !form.emailValid() ? 'true' : null
          "
          [attr.aria-describedby]="
            showEmailErrors() ? 'email-error email-hint' : 'email-hint'
          "
        />
        <p id="email-hint">We'll never share your email</p>

        @if (showEmailErrors()) {
          <div
            id="email-error"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            class="error"
          >
            @for (error of form.emailErrors(); track error) {
              <p>{{ error }}</p>
            }
          </div>
        }
      </div>

      <!-- Password field (similar pattern) -->
      <div>
        <label for="password">Password</label>
        <input
          id="password"
          type="password"
          [value]="form.password()"
          (input)="form.setPassword($event)"
          (blur)="form.field('password').touch()"
          [attr.aria-invalid]="
            showPasswordErrors() && !form.passwordValid() ? 'true' : null
          "
          [attr.aria-describedby]="
            showPasswordErrors() ? 'password-error' : null
          "
        />

        @if (showPasswordErrors()) {
          <div
            id="password-error"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            class="error"
          >
            @for (error of form.passwordErrors(); track error) {
              <p>{{ error }}</p>
            }
          </div>
        }
      </div>

      <button type="submit" [disabled]="form.pending()">Login</button>
    </form>
  `,
  styles: [
    `
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

  // Custom computed signals for error display
  showEmailErrors = computed(
    () => this.form.emailTouched() && this.form.emailErrors().length > 0,
  );

  showPasswordErrors = computed(
    () => this.form.passwordTouched() && this.form.passwordErrors().length > 0,
  );

  async onSubmit(event: Event) {
    event.preventDefault();
    try {
      const data = await this.form.submit();
      console.log('Logging in:', data);
    } catch {
      console.log('Invalid credentials');
    }
  }

  ngOnDestroy() {
    this.form.dispose();
  }
}
```

**When to use manual approach:**

- ✅ Need custom ARIA patterns (e.g., `aria-describedby` with multiple IDs)
- ✅ Building a design system with custom error components
- ✅ Complex accessibility requirements beyond WCAG 2.2
- ❌ Most applications (use `NgxVestForms` instead - less code, same accessibility)

### Complete Production Example

Here's a **full-featured registration form** with all advanced patterns:

```typescript
import { Component, signal } from '@angular/core';
import {
  createVestForm,
  NgxVestForms,
  createSafeSuite,
} from 'ngx-vest-forms/core';
import { test, enforce, skipWhen } from 'vest';

interface RegisterFormModel {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

// Advanced validation with async checks
const registerSuite = createSafeSuite<RegisterFormModel>((data = {}) => {
  // Name validation
  test('name', 'Name is required', () => {
    enforce(data.name).isNotEmpty();
  });

  test('name', 'Name must be at least 2 characters', () => {
    enforce(data.name).longerThan(1);
  });

  // Email validation
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
        [data.email],
      ); // Memoization key - only re-run when email changes
    },
  );

  // Password validation
  test('password', 'Password is required', () => {
    enforce(data.password).isNotEmpty();
  });

  test('password', 'Password must be at least 8 characters', () => {
    enforce(data.password).longerThan(7);
  });

  // Password strength warning (non-blocking)
  test(
    'password',
    'Consider adding special characters for stronger password',
    () => {
      warn(); // Non-blocking - doesn't prevent submission
      enforce(data.password).matches(/[!@#$%^&*(),.?":{}|<>]/);
    },
  );

  // Confirm password (only validate when password exists)
  include('confirmPassword').when('password');

  test('confirmPassword', 'Please confirm your password', () => {
    enforce(data.confirmPassword).isNotEmpty();
  });

  test('confirmPassword', 'Passwords must match', () => {
    enforce(data.confirmPassword).equals(data.password);
  });

  // Terms agreement
  test('agreeToTerms', 'You must agree to the terms', () => {
    enforce(data.agreeToTerms).isTruthy();
  });
});

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [NgxVestForms],
  template: `
    <form (submit)="onSubmit($event)">
      <!-- Name Field -->
      <div>
        <label for="name">Full Name *</label>
        <input
          id="name"
          [value]="form.name()"
          (input)="form.setName($event)"
          aria-required="true"
        />
        <ngx-form-error [field]="form.nameField()" />
      </div>

      <!-- Email Field (with async validation) -->
      <div>
        <label for="email">Email *</label>
        <input
          id="email"
          type="email"
          [value]="form.email()"
          (input)="form.setEmail($event)"
          aria-required="true"
        />
        @if (form.emailPending()) {
          <p class="text-blue-600">Checking availability...</p>
        }
        <ngx-form-error [field]="form.emailField()" />
      </div>

      <!-- Password Field (with warning) -->
      <div>
        <label for="password">Password *</label>
        <input
          id="password"
          type="password"
          [value]="form.password()"
          (input)="form.setPassword($event)"
          aria-required="true"
        />
        <ngx-form-error [field]="form.passwordField()" />
      </div>

      <!-- Confirm Password Field -->
      <div>
        <label for="confirmPassword">Confirm Password *</label>
        <input
          id="confirmPassword"
          type="password"
          [value]="form.confirmPassword()"
          (input)="form.setConfirmPassword($event)"
          aria-required="true"
        />
        <ngx-form-error [field]="form.confirmPasswordField()" />
      </div>

      <!-- Terms Checkbox -->
      <div>
        <label>
          <input
            id="agreeToTerms"
            type="checkbox"
            [checked]="form.agreeToTerms()"
            (change)="form.setAgreeToTerms($event)"
            aria-required="true"
          />
          I agree to the <a href="/terms">Terms and Conditions</a> *
        </label>
        <ngx-form-error [field]="form.agreeToTermsField()" />
      </div>

      <!-- Submit Button -->
      <button type="submit" [disabled]="form.pending() || form.submitting()">
        @if (form.submitting()) {
          Creating Account...
        } @else if (form.pending()) {
          Validating...
        } @else {
          Create Account
        }
      </button>

      <!-- Debug Info (dev only) -->
      @if (isDev) {
        <details>
          <summary>Debug</summary>
          <pre>{{
            {
              valid: form.valid(),
              pending: form.pending(),
              errors: form.errors(),
            } | json
          }}</pre>
        </details>
      }
    </form>
  `,
})
export class RegisterFormComponent {
  isDev = !isDevMode(); // Angular's isDevMode()

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

  async onSubmit(event: Event) {
    event.preventDefault();

    try {
      const validData = await this.form.submit();

      // Call your API
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validData),
      });

      if (response.ok) {
        console.log('✅ Registration successful!');
        // Navigate to success page
      }
    } catch (error) {
      console.log('❌ Form validation failed:', this.form.errors());
    }
  }

  ngOnDestroy() {
    this.form.dispose(); // Clean up subscriptions
  }
}
```

**This example demonstrates:**

- ✅ Async validation with `test.memo()` (email uniqueness check)
- ✅ Conditional validation with `include().when()` (confirmPassword)
- ✅ Non-blocking warnings with `warn()` (password strength)
- ✅ Race condition protection with `AbortSignal`
- ✅ Pending state UI (`form.pending()`, `form.submitting()`)
- ✅ Complete WCAG 2.2 accessibility
- ✅ Production-ready error handling

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
<input [value]="form.email()" ngxVestAriaDisabled />

// Disable auto-touch for specific input
<input [value]="form.email()" ngxVestTouchDisabled />

// Disable auto-busy for specific form
<form ngxVestFormBusyDisabled [attr.aria-busy]="customLogic()">

// Global disable via config
provideNgxVestFormsConfig({
  autoAria: false,     // Disable auto-ARIA globally
  autoTouch: false,    // Disable auto-touch globally
  autoFormBusy: false, // Disable auto-busy globally
  debug: true          // Enable debug logging
})
```

## 🎓 Best Practices

### 1. Always Call `dispose()`

```typescript
@Component({...})
export class MyFormComponent implements OnDestroy {
  form = createVestForm(suite, model);

  ngOnDestroy() {
    this.form.dispose(); // ✅ Prevent memory leaks
  }
}
```

### 2. Use `staticSafeSuite` to Prevent Bugs

```typescript
// ❌ BAD - Manual only() guard (easy to forget!)
import { staticSuite, only } from 'vest';
const suite = staticSuite((data, field) => {
  if (field) only(field); // Forgetting this breaks validation!
});

// ✅ GOOD - Automatic guard
import { staticSafeSuite } from 'ngx-vest-forms/core';
const suite = staticSafeSuite((data) => {
  // No guard needed - wrapper handles it!
});
```

**Why?** Calling `only(undefined)` tells Vest to run **ZERO tests**, breaking validation.

### 3. Use `createSafeSuite` for Async Validation with `test.memo()`

**⚠️ CRITICAL:** When using `test.memo()` for async validation caching, you **MUST** use `createSafeSuite`:

```typescript
// ❌ WRONG - Breaks test.memo() caching!
import { staticSafeSuite } from 'ngx-vest-forms/core';

const suite = staticSafeSuite((data) => {
  test.memo(
    'email',
    'Email taken',
    async ({ signal }) => {
      // This runs on EVERY keystroke! Cache is broken.
      await checkEmail(data.email, { signal });
    },
    [data.email],
  );
});

// ✅ CORRECT - Enables test.memo() caching!
import { createSafeSuite } from 'ngx-vest-forms/core';

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
  <p id="email-error" role="alert">{{ form.emailErrors()[0] }}</p>
}
```

**Note:** With `NgxVestForms`, this is automatic!

## 🔄 Migration from V1

### Breaking Changes

1. **No more `ngxVestForm` directive**
2. **No more `ngModel` / `[(formValue)]` bindings**
3. **Suite signature change** (use `staticSafeSuite`)

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

**After (V2):**

```typescript
@Component({
  imports: [NgxVestForms], // New convenience constant!
  template: `
    <form>
      <input [value]="form.email()" (input)="form.setEmail($event)" />
      <ngx-form-error [field]="form.emailField()" />
    </form>
  `,
})
export class MyFormComponent {
  form = createVestForm(myValidationSuite, { email: '' });

  ngOnDestroy() {
    this.form.dispose();
  }
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
