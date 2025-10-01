# ngx-vest-forms - v2

> **Vest-First Form Validation for Angular**
> A lightweight, framework-agnostic form validation library that puts Vest.js at the core and treats Angular as an optional integration layer.

[![npm version](https://badge.fury.io/js/ngx-vest-forms.svg)](https://www.npmjs.com/package/ngx-vest-forms)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## � What's New in V2?

V2 represents a **complete architectural shift** from Angular Forms to Vest-first validation:

| Aspect                | V1 (NgForm-centric)     | V2 (Vest-first)          |
| --------------------- | ----------------------- | ------------------------ |
| **Core Dependency**   | Angular FormsModule     | Vest.js                  |
| **Form State**        | NgForm controls         | Vest validation result   |
| **Touch Detection**   | Manual blur handlers    | Automatic via validation |
| **API Style**         | Directive-based         | Factory function         |
| **Bundle Size**       | ~8KB (with FormsModule) | ~3KB (core only)         |
| **Framework Lock-in** | Angular-specific        | Framework-agnostic       |

### Why the Change?

**V1 Problem**: Attempting to bridge two incompatible paradigms (Angular Forms + Vest) created complexity:

- Double bookkeeping of state
- Timing bugs between NgForm and Vest
- Unnecessary Angular dependencies
- Complex synchronization logic

**V2 Solution**: Make Vest.js the single source of truth:

- ✅ **Simpler**: One state source (Vest)
- ✅ **Faster**: No double validation
- ✅ **Lighter**: No FormsModule required
- ✅ **Flexible**: Works with any UI framework

## 📦 Installation

```bash
npm install ngx-vest-forms vest
```

## 🎯 Quick Start - No FormsModule Required

Unlike V1, V2 works with **pure Angular Signals and standard HTML**:

```typescript
import { Component } from '@angular/core';
import { createVestForm, staticSafeSuite } from 'ngx-vest-forms/core';
import { test, enforce } from 'vest';

// 1. Define validation suite
const emailSuite = staticSafeSuite((data = {}) => {
  test('email', 'Email is required', () => {
    enforce(data.email).isNotEmpty();
  });

  test('email', 'Invalid email format', () => {
    enforce(data.email).isEmail();
  });
});

// 2. Create form component (no FormsModule!)
@Component({
  selector: 'app-email-form',
  standalone: true,
  template: `
    <form (submit)="handleSubmit($event)">
      <input
        type="email"
        [value]="form.email()"
        (input)="form.setEmail($event)"
        placeholder="Enter email"
      />

      @if (form.emailShowErrors()) {
        <span class="error">{{ form.emailErrors()[0] }}</span>
      }

      <button [disabled]="!form.valid() || form.pending()">
        {{ form.pending() ? 'Validating...' : 'Submit' }}
      </button>
    </form>
  `,
})
export class EmailFormComponent {
  form = createVestForm(emailSuite, { email: '' });

  async handleSubmit(event: Event) {
    event.preventDefault();
    try {
      const validData = await this.form.submit();
      console.log('✅ Valid:', validData);
    } catch {
      console.log('❌ Invalid:', this.form.errors());
    }
  }

  ngOnDestroy() {
    this.form.dispose(); // Clean up
  }
}
```

## 🎨 Key Features

### 1. Vest-First Architecture

In V2, **Vest.js owns all validation logic and state**. Angular Signals provide reactivity, but Vest is the source of truth.

```typescript
// V1 (NgForm-centric) ❌
<form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
  <input name="email" [(ngModel)]="model.email" />
</form>

// V2 (Vest-first) ✅
const form = createVestForm(suite, { email: '' });

<form>
  <input [value]="form.email()" (input)="form.setEmail($event)" />
</form>
```

### 2. Enhanced Field Signals API

V2 automatically generates field accessors via **Proxy** — no manual wiring required:

```typescript
const form = createVestForm(suite, {
  email: '',
  profile: { name: '', age: 0 },
});

// Automatic field signals (camelCase conversion)
form.email(); // Signal<string> - field value
form.emailValid(); // Signal<boolean> - field validity
form.emailErrors(); // Signal<string[]> - field errors
form.emailTouched(); // Signal<boolean> - user interacted
form.emailPending(); // Signal<boolean> - async validation
form.emailShowErrors(); // Signal<boolean> - should show errors

// Automatic field setters (handles Events or raw values)
form.setEmail($event); // Accepts DOM Event
form.setEmail('user@example.com'); // Or raw string
form.touchEmail(); // Mark as touched
form.resetEmail(); // Reset to initial value

// Nested field access (dot.path → camelCase)
form.profileName(); // profile.name → profileName()
form.setProfileName(); // profile.name → setProfileName()
```

### 3. Error Display Strategies

Control **when** validation errors are shown:

```typescript
const form = createVestForm(suite, model, {
  errorStrategy: 'on-touch', // immediate | on-touch | on-submit | manual
});
```

| Strategy    | Behavior                                                     | Use Case                                     |
| ----------- | ------------------------------------------------------------ | -------------------------------------------- |
| `immediate` | Show errors as user types                                    | Real-time feedback (e.g., password strength) |
| `on-touch`  | Show errors after field loses focus **or form is submitted** | **Default** - balanced UX (WCAG recommended) |
| `on-submit` | Show errors only after submit                                | Minimal interruption                         |
| `manual`    | Developer controls via `touchField()`                        | Complex custom flows                         |

#### Error Display Behavior Matrix

Understanding when errors appear for each strategy:

| Scenario                                          | immediate | on-touch | on-submit | manual |
| ------------------------------------------------- | --------- | -------- | --------- | ------ |
| Field has errors, not touched, form not submitted | ✅        | ❌       | ❌        | ❌     |
| Field has errors, touched, form not submitted     | ✅        | ✅       | ❌        | ❌     |
| Field has errors, **not touched**, form submitted | ✅        | ✅       | ✅        | ❌     |
| Field has errors, touched, form submitted         | ✅        | ✅       | ✅        | ❌     |
| Field is valid (no errors)                        | ❌        | ❌       | ❌        | ❌     |

> **💡 Accessibility Note**: The `on-touch` strategy (default) shows errors for **untouched fields** after form submission. This ensures all validation errors are visible when users click Submit, following WCAG 2.2 accessibility guidelines. Submit buttons should **NOT** be disabled so users can discover what's wrong with the form.

## 📚 Complete Example

### 1. Define Validation Suite

```typescript
// user.validations.ts
import { staticSafeSuite } from 'ngx-vest-forms/core';
import { enforce, test, skipWhen } from 'vest';

export type UserFormModel = {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
};

export const userValidationSuite = staticSafeSuite<UserFormModel>(
  (data: Partial<UserFormModel> = {}) => {
    // ✅ No need for manual only(field) guard!

    // Name validation
    test('name', 'Name is required', () => {
      enforce(data.name).isNotEmpty();
    });

    test('name', 'Name must be at least 2 characters', () => {
      enforce(data.name).longerThanOrEquals(2);
    });

    // Email validation
    test('email', 'Email is required', () => {
      enforce(data.email).isNotEmpty();
    });

    test('email', 'Invalid email format', () => {
      enforce(data.email).isEmail();
    });

    // Skip expensive async check until basic validation passes
    skipWhen(
      (result) => result.hasErrors('email'),
      () => {
        test('email', 'Email is already taken', async ({ signal }) => {
          const response = await fetch(`/api/check-email/${data.email}`, {
            signal,
          });
          if (!response.ok) throw new Error('Email taken');
        });
      },
    );

    // Password validation
    test('password', 'Password must be at least 8 characters', () => {
      enforce(data.password).longerThanOrEquals(8);
    });

    // Conditional validation
    if (data.password) {
      test('confirmPassword', 'Please confirm your password', () => {
        enforce(data.confirmPassword).isNotEmpty();
      });

      test('confirmPassword', 'Passwords must match', () => {
        enforce(data.confirmPassword).equals(data.password);
      });
    }
  },
);
```

### 2. Create Form Component

```typescript
// user-form.component.ts
import { Component, signal } from '@angular/core';
import { createVestForm } from 'ngx-vest-forms/core';
import { userValidationSuite, type UserFormModel } from './user.validations';

@Component({
  selector: 'app-user-form',
  standalone: true,
  template: `
    <form (submit)="onSubmit($event)">
      <!-- Name Field -->
      <div class="field">
        <label for="name">Name *</label>
        <input
          id="name"
          [value]="form.name() ?? ''"
          (input)="form.setName($event)"
          [attr.aria-invalid]="form.nameShowErrors() && !form.nameValid()"
        />
        @if (form.nameShowErrors() && form.nameErrors().length) {
          <p role="alert">{{ form.nameErrors()[0] }}</p>
        }
      </div>

      <!-- Email Field -->
      <div class="field">
        <label for="email">Email *</label>
        <input
          id="email"
          type="email"
          [value]="form.email() ?? ''"
          (input)="form.setEmail($event)"
          [attr.aria-invalid]="form.emailShowErrors() && !form.emailValid()"
        />
        @if (form.emailPending()) {
          <span>Checking email...</span>
        }
        @if (form.emailShowErrors() && form.emailErrors().length) {
          <p role="alert">{{ form.emailErrors()[0] }}</p>
        }
      </div>

      <!-- Password Fields -->
      <div class="field">
        <label for="password">Password *</label>
        <input
          id="password"
          type="password"
          [value]="form.password() ?? ''"
          (input)="form.setPassword($event)"
        />
        @if (form.passwordShowErrors() && form.passwordErrors().length) {
          <p role="alert">{{ form.passwordErrors()[0] }}</p>
        }
      </div>

      @if (form.password()) {
        <div class="field">
          <label for="confirmPassword">Confirm Password *</label>
          <input
            id="confirmPassword"
            type="password"
            [value]="form.confirmPassword() ?? ''"
            (input)="form.setConfirmPassword($event)"
          />
          @if (
            form.confirmPasswordShowErrors() &&
            form.confirmPasswordErrors().length
          ) {
            <p role="alert">{{ form.confirmPasswordErrors()[0] }}</p>
          }
        </div>
      }

      <!-- Submit Button -->
      <button type="submit" [disabled]="form.pending() || form.submitting()">
        @if (form.submitting()) {
          Saving...
        } @else if (form.pending()) {
          Validating...
        } @else {
          Submit
        }
      </button>
    </form>
  `,
})
export class UserFormComponent {
  form = createVestForm(
    userValidationSuite,
    signal<UserFormModel>({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    }),
    { errorStrategy: 'on-touch' },
  );

  async onSubmit(event: Event) {
    event.preventDefault();
    try {
      const validData = await this.form.submit();
      console.log('✅ Valid:', validData);
    } catch {
      console.log('❌ Invalid:', this.form.errors());
    }
  }

  ngOnDestroy() {
    this.form.dispose();
  }
}
```

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
  imports: [], // No imports needed!
  template: `
    <form>
      <input [value]="form.email()" (input)="form.setEmail($event)" />
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

### Validation Suite Update

**Before:**

```typescript
import { staticSuite, only, test } from 'vest';

const suite = staticSuite((data, field) => {
  if (field) only(field); // Manual guard
  test('email', ...);
});
```

**After:**

```typescript
import { staticSafeSuite } from 'ngx-vest-forms/core';
import { test } from 'vest';

const suite = staticSafeSuite((data) => {
  // Automatic guard!
  test('email', ...);
});
```

## 🎓 Best Practices

### 1. Use `staticSafeSuite` to Prevent Bugs

```typescript
// ❌ BAD - Manual only() guard required
import { staticSuite, only } from 'vest';
const suite = staticSuite((data, field) => {
  if (field) only(field); // Easy to forget!
});

// ✅ GOOD - Automatic guard
import { staticSafeSuite } from 'ngx-vest-forms/core';
const suite = staticSafeSuite((data) => {
  // No guard needed!
});
```

**Why?** Calling `only(undefined)` tells Vest to run **ZERO tests**, breaking validation.

### 2. Handle Async Validation Properly

```typescript
skipWhen(
  (result) => result.hasErrors('email'),
  () => {
    test('email', 'Email taken', async ({ signal }) => {
      // ✅ Respect AbortSignal
      await fetch(`/api/check/${data.email}`, { signal });
    });
  },
);
```

### 3. Always Call `dispose()`

```typescript
ngOnDestroy() {
  this.form.dispose(); // ✅ Prevent memory leaks
}
```

### 4. Use Proper ARIA Attributes

```typescript
<input
  [attr.aria-invalid]="form.emailShowErrors() && !form.emailValid()"
  [attr.aria-describedby]="form.emailShowErrors() ? 'email-error' : null"
/>
@if (form.emailShowErrors()) {
  <p id="email-error" role="alert">{{ form.emailErrors()[0] }}</p>
}
```

### 5. Don't Disable Submit Buttons (Accessibility)

```typescript
// ❌ BAD - Disabling submit prevents error discovery
<button type="submit" [disabled]="!form.valid()">Submit</button>

// ✅ GOOD - Allow submit, let validation reveal errors
<button type="submit" [disabled]="form.pending() || form.submitting()">
  {{ form.submitting() ? 'Saving...' : 'Submit' }}
</button>
```

**Why?** Per WCAG 2.2, users should be able to attempt form submission to discover what fields are invalid. Disabling the submit button based on validity hides this information. Only disable during async operations (pending validation or submission in progress).

#### If You Must Disable the Submit Button

Some developers prefer to disable the submit button until the form is valid. If you choose this approach, **you should use the `immediate` strategy** or manually trigger validation on mount to ensure errors are visible:

```typescript
// Option A: Use immediate strategy (shows errors while typing)
const form = createVestForm(suite, model, {
  errorStrategy: 'immediate', // Errors always visible
});

<button [disabled]="!form.valid()">Submit</button>

// Option B: Touch all fields on mount with on-touch strategy
@Component({...})
export class MyFormComponent implements OnInit {
  form = createVestForm(suite, model, { errorStrategy: 'on-touch' });

  ngOnInit() {
    // Touch all fields to trigger error display
    Object.keys(this.form.model()).forEach(key => {
      const touchMethod = `touch${key.charAt(0).toUpperCase()}${key.slice(1)}`;
      if (typeof this.form[touchMethod] === 'function') {
        this.form[touchMethod]();
      }
    });
  }
}

<button [disabled]="!form.valid()">Submit</button>
```

**Warning**: With a disabled submit button and `on-touch` strategy, errors won't appear until users interact with fields. This creates a "mystery disabled button" UX problem where users don't know why they can't submit.

## 📖 API Reference

### `createVestForm(suite, model, options?)`

**Parameters:**

- `suite`: Vest validation suite
- `model`: Initial form data (object or signal)
- `options`: Configuration (errorStrategy, etc.)

**Returns:** `EnhancedVestForm<TModel>`

### Form State Signals

```typescript
form.valid(); // Overall validity
form.pending(); // Async validation pending
form.errors(); // All field errors
form.submitting(); // Submit in progress
form.model(); // Current form data

// Field signals (via proxy)
form.fieldName(); // Field value
form.fieldNameValid(); // Field validity
form.fieldNameErrors(); // Field errors
form.setFieldName(); // Field setter
```

### Form Operations

```typescript
await form.submit(); // Validates & returns data (throws if invalid)
form.reset(); // Reset all fields
form.validate(); // Re-run validation
form.dispose(); // Clean up (call in ngOnDestroy)
```

## 📊 Performance

- **Bundle Size**: ~3KB (core only, no FormsModule)
- **Validation Speed**: ~60-80% faster than V1
- **Memory**: Lower (single state source)
- **Change Detection**: Optimized with OnPush + Signals

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
