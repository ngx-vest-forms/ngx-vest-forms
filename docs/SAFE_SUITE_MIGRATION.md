# Safe Suite Wrappers Migration Guide

## Problem Overview

When using Vest's `only(field)` function, calling it with `undefined` tells Vest to run **ZERO tests** instead of all tests. This is the most common mistake when writing Vest validation suites with ngx-vest-forms.

**Symptom**: Only 1 validation error displays at a time, even when multiple fields are invalid.

## Solution

Use `staticSafeSuite` or `createSafeSuite` wrappers that automatically handle the `if (field) { only(field); }` guard pattern for you.

---

## Migration Examples

### Example 1: Basic Form Validation

#### ❌ Before (Unsafe Pattern)

```typescript
// user.validations.ts
import { staticSuite, enforce, only, test } from 'vest';

export interface UserModel {
  email: string;
  password: string;
}

export const userValidations = staticSuite(
  (data: UserModel = {}, field?: string) => {
    only(field); // ❌ BUG: When field is undefined, NO tests run!

    test('email', 'Email is required', () => {
      enforce(data.email).isNotEmpty();
    });

    test('email', 'Email format is invalid', () => {
      enforce(data.email).isEmail();
    });

    test('password', 'Password must be at least 8 characters', () => {
      enforce(data.password).longerThan(7);
    });
  },
);
```

**Problem**: When you call `userValidations({ email: '', password: '' })` without a field parameter, `only(undefined)` causes Vest to run zero tests, so no errors are displayed.

#### ✅ After (Safe Pattern)

```typescript
// user.validations.ts
import { staticSafeSuite } from 'ngx-vest-forms/core';
import { enforce, test } from 'vest';

export interface UserModel {
  email: string;
  password: string;
}

export const userValidations = staticSafeSuite<UserModel>((data, field) => {
  // ✅ NO NEED for: if (field) { only(field); }
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
});
```

**Result**: All validation tests run correctly, whether you call it with or without a field parameter.

---

### Example 2: Form with Cross-Field Validation

#### ❌ Before (Unsafe Pattern)

```typescript
// register.validations.ts
import { staticSuite, enforce, only, test, include } from 'vest';

export const registerValidations = staticSuite((data = {}, field) => {
  only(field); // ❌ BUG!

  test('password', 'Password is required', () => {
    enforce(data.password).isNotEmpty();
  });

  test('password', 'Password must be at least 8 characters', () => {
    enforce(data.password).longerThan(7);
  });

  include('confirmPassword').when('password');
  test('confirmPassword', 'Passwords must match', () => {
    enforce(data.confirmPassword).equals(data.password);
  });
});
```

#### ✅ After (Safe Pattern)

```typescript
// register.validations.ts
import { staticSafeSuite } from 'ngx-vest-forms/core';
import { enforce, test, include } from 'vest';

export interface RegisterModel {
  password: string;
  confirmPassword: string;
}

export const registerValidations = staticSafeSuite<RegisterModel>(
  (data, field) => {
    test('password', 'Password is required', () => {
      enforce(data.password).isNotEmpty();
    });

    test('password', 'Password must be at least 8 characters', () => {
      enforce(data.password).longerThan(7);
    });

    include('confirmPassword').when('password');
    test('confirmPassword', 'Passwords must match', () => {
      enforce(data.confirmPassword).equals(data.password);
    });
  },
);
```

---

### Example 3: Stateful Suite with Subscriptions

#### ❌ Before (Unsafe Pattern)

```typescript
// profile.validations.ts
import { create, enforce, only, test } from 'vest';

export const profileValidations = create((data = {}, field) => {
  only(field); // ❌ BUG!

  test('displayName', 'Display name is required', () => {
    enforce(data.displayName).isNotEmpty();
  });

  test('bio', 'Bio must be under 500 characters', () => {
    enforce(data.bio).shorterThan(501);
  });
});
```

#### ✅ After (Safe Pattern)

```typescript
// profile.validations.ts
import { createSafeSuite } from 'ngx-vest-forms/core';
import { enforce, test } from 'vest';

export interface ProfileModel {
  displayName: string;
  bio: string;
}

export const profileValidations = createSafeSuite<ProfileModel>(
  (data, field) => {
    test('displayName', 'Display name is required', () => {
      enforce(data.displayName).isNotEmpty();
    });

    test('bio', 'Bio must be under 500 characters', () => {
      enforce(data.bio).shorterThan(501);
    });
  },
);
```

---

### Example 4: Type-Safe Field Names

#### ✅ Recommended Pattern

```typescript
// contact.validations.ts
import { staticSafeSuite } from 'ngx-vest-forms/core';
import { enforce, test } from 'vest';

export interface ContactModel {
  name: string;
  email: string;
  message: string;
}

// Define field names as a union type for better type safety
export type ContactFields = 'name' | 'email' | 'message';

export const contactValidations = staticSafeSuite<ContactModel, ContactFields>(
  (data, field) => {
    test('name', 'Name is required', () => {
      enforce(data.name).isNotEmpty();
    });

    test('email', 'Email is required', () => {
      enforce(data.email).isNotEmpty();
    });

    test('email', 'Email format is invalid', () => {
      enforce(data.email).isEmail();
    });

    test('message', 'Message is required', () => {
      enforce(data.message).isNotEmpty();
    });

    test('message', 'Message must be at least 10 characters', () => {
      enforce(data.message).longerThan(9);
    });
  },
);

// TypeScript will catch invalid field names at compile time:
// contactValidations(data, 'invalidField'); // ❌ Type error!
```

---

## Component Usage Examples

### With createVestForm

```typescript
import { Component, signal } from '@angular/core';
import { createVestForm } from 'ngx-vest-forms/core';
import { userValidations, type UserModel } from './user.validations';

@Component({
  selector: 'app-user-form',
  template: `
    <form (ngSubmit)="onSubmit()">
      <input
        [value]="form.email()"
        (input)="form.setEmail($event)"
        [attr.aria-invalid]="form.emailShowErrors() && !form.emailValid()"
      />
      @if (form.emailShowErrors() && form.emailErrors().length) {
        <p role="alert">{{ form.emailErrors()[0] }}</p>
      }

      <button type="submit" [disabled]="!form.valid()">Submit</button>
    </form>
  `,
})
export class UserFormComponent {
  protected readonly form = createVestForm(
    userValidations, // ✅ Uses safe suite
    signal<UserModel>({ email: '', password: '' }),
  );

  onSubmit = async () => {
    try {
      await this.form.submit();
      console.log('Valid:', this.form.model());
    } catch {
      console.log('Invalid:', this.form.errors());
    }
  };

  ngOnDestroy() {
    this.form.dispose();
  }
}
```

---

## Quick Reference

| Pattern           | Use Case                                             | Methods                              | Stateful |
| ----------------- | ---------------------------------------------------- | ------------------------------------ | -------- |
| `staticSafeSuite` | **Recommended** - Most forms, server-side validation | Run validation only                  | ❌ No    |
| `createSafeSuite` | Need subscriptions, `.get()`, `.reset()`             | Run validation + subscribe/get/reset | ✅ Yes   |

---

## Migration Checklist

- [ ] Replace `staticSuite` with `staticSafeSuite`
- [ ] Replace `create` with `createSafeSuite`
- [ ] Remove manual `only(field)` calls
- [ ] Remove manual `if (field) { only(field); }` guards
- [ ] Add model type parameter: `staticSafeSuite<ModelType>`
- [ ] Optional: Add field type parameter: `staticSafeSuite<Model, FieldNames>`
- [ ] Import from `'ngx-vest-forms/core'` instead of `'vest'`
- [ ] Test that form-level validation shows all errors
- [ ] Test that field-level validation shows only that field's errors

---

## Benefits

✅ **Prevents the `only(undefined)` bug** - Automatic guard pattern
✅ **Less boilerplate** - No manual `if (field)` checks needed
✅ **Type-safe** - Optional field name typing
✅ **Drop-in replacement** - Works exactly like Vest's native functions
✅ **Well-tested** - Comprehensive test coverage included
✅ **Zero overhead** - Thin wrapper, no performance impact

---

## Need Help?

- See [`safe-suite.ts`](../projects/ngx-vest-forms/core/src/lib/utils/safe-suite.ts) for implementation
- See [`safe-suite.spec.ts`](../projects/ngx-vest-forms/core/src/lib/utils/safe-suite.spec.ts) for test examples
- See [bug fix documentation](./bug-fixes/only-field-validation-bug.md) for detailed explanation
- See [Vest.js official docs](https://vestjs.dev/) for Vest-specific features
