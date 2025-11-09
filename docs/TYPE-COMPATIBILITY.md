# Type Compatibility - NgxTypedVestSuite vs NgxVestSuite

## Overview

This document explains the relationship between `NgxTypedVestSuite` and `NgxVestSuite`, and shows how to use strong typing with `FormFieldName<T>` autocomplete in your validation suites.

## Table of Contents

- [Quick Start](#quick-start)
- [Why Two Types?](#why-two-types)
- [Recommended Pattern](#recommended-pattern)
- [Type Inference Pattern](#type-inference-pattern)
- [Technical Explanation](#technical-explanation)

---

## Quick Start

Use `NgxTypedVestSuite` to get autocomplete for field names:

```typescript
import { staticSuite, test, enforce, only } from 'vest';
import {
  NgxVestSuite,
  NgxTypedVestSuite,
  FormFieldName,
  NgxDeepPartial,
} from 'ngx-vest-forms';

type UserModel = NgxDeepPartial<{
  email: string;
  password: string;
  profile: {
    age: number;
  };
}>;

// ✅ BEST: Define with NgxTypedVestSuite for strong typing
export const userSuite: NgxTypedVestSuite<UserModel> = staticSuite(
  (model: UserModel, field?: FormFieldName<UserModel>) => {
    only(field);
    // ✅ IDE autocomplete for: 'email' | 'password' | 'profile' | 'profile.age' | typeof ROOT_FORM
    test('email', 'Required', () => enforce(model.email).isNotBlank());
    test('profile.age', 'Must be 18+', () =>
      enforce(model.profile?.age).greaterThanOrEquals(18)
    );
  }
);

// Component - use type inference (no explicit type needed)
@Component({...})
class UserFormComponent {
  protected readonly suite = userSuite; // ✅ Works in templates, type inferred
  protected readonly formValue = signal<UserModel>({});
}
```

---

## Why Two Types?

**`NgxTypedVestSuite<T>`**: Strong typing with `FormFieldName<T>` autocomplete

- Use when **defining** validation suites
- Provides IDE autocomplete for all valid field paths
- Catches typos at compile time

**`NgxVestSuite<T>`**: Flexible base type with `any` field parameter

- Used internally by the form directive
- Accepts **both** typed and untyped suites seamlessly
- The `any` is safe because model parameter remains fully typed

---

## Recommended Pattern

**Always use `NgxTypedVestSuite` when defining validation suites, and let TypeScript infer the type in components:**

```typescript
// ✅ RECOMMENDED: Strong typing at definition
export const userValidation: NgxTypedVestSuite<UserModel> = staticSuite(
  (model: UserModel, field?: FormFieldName<UserModel>) => {
    only(field);
    // Full autocomplete for field names
    test('email', 'Required', () => enforce(model.email).isNotBlank());
  }
);

// ✅ In component: Use type inference
@Component({...})
class MyFormComponent {
  protected readonly suite = userValidation; // ✅ No explicit type needed
  protected readonly formValue = signal<UserModel>({});
}
```

**Why this works:**

- `NgxVestSuite` uses `any` for field parameter
- Accepts both `string` and `FormFieldName<T>`
- No type compatibility issues
- Full type safety where it matters (validation definition)

---

## Type Inference Pattern

If you prefer explicit typing in components, you can use `NgxVestSuite`:

```typescript
@Component({...})
class MyFormComponent {
  // ✅ Also works: Explicit NgxVestSuite type
  protected readonly suite: NgxVestSuite<UserModel> = userValidation;
  protected readonly formValue = signal<UserModel>({});
}
```

**Both patterns are valid - choose based on your team's preference.**

---

## Technical Explanation

### Why `any` for Field Parameter?

`NgxVestSuite` uses `any` for the field parameter to accept both:

1. Plain `string` field names
2. `FormFieldName<T>` from `NgxTypedVestSuite` (string literal union with autocomplete)

This strategic use of `any` is safe because:

- **Model parameter `T` remains fully typed** - This is where type safety matters most
- **Field validation happens at definition site** - Errors caught when writing validation logic
- **Runtime behavior is identical** - `string` and `FormFieldName<T>` are both strings at runtime
- **Enables type compatibility** - `NgxTypedVestSuite` works where `NgxVestSuite` is expected

### Type System Flow

```typescript
// 1. Define with strong typing
export const suite: NgxTypedVestSuite<UserModel> = staticSuite(
  (model: UserModel, field?: FormFieldName<UserModel>) => {
    // FormFieldName<UserModel> = 'email' | 'password' | 'profile' | 'profile.age' | typeof ROOT_FORM
    only(field); // ✅ Type-safe autocomplete
  }
);

// 2. Form directive accepts both types
@Directive(...)
class FormDirective<T> {
  suite = input<NgxVestSuite<T> | NgxTypedVestSuite<T> | null>(null);
  //             ^^^^^^^^^^^^^ - accepts any field parameter
  //                             ^^^^^^^^^^^^^^^^^^^ - strong typed field parameter
}

// 3. Runtime execution (both use same code path)
(suite as NgxVestSuite<T>)(model, field).done(...);
// Cast to NgxVestSuite for uniform execution
```

### Benefits

✅ **Strong typing where you write code** - `FormFieldName<T>` autocomplete when defining validations
✅ **Flexibility where you use code** - Works seamlessly in templates and components
✅ **Type safety** - Model parameter `T` remains fully typed throughout
✅ **No type assertions needed** - Everything just works
