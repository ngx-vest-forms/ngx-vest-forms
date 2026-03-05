# Type Compatibility - NgxTypedVestSuite vs NgxVestSuite

> **Vest 6 Documentation:** This guide uses the modern Vest 6 pattern where suite callbacks take only the model parameter. Field focus is handled at the call site via `suite.only(field).run(model)`. For Vest 5 (v2.x), see [MIGRATION-v2.x-to-v3.0.0.md](./migration/MIGRATION-v2.x-to-v3.0.0.md).

## Overview

This document explains the relationship between `NgxTypedVestSuite` and `NgxVestSuite`, and shows how to use strong typing with `FieldPath<T>` autocomplete in your validation suites.

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
import { create, test, enforce } from 'vest';
import {
  NgxVestSuite,
  NgxTypedVestSuite,
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
export const userSuite: NgxTypedVestSuite<UserModel> = create(
  (model: UserModel) => {
    // ✅ IDE autocomplete for field names in test() calls
    test('email', 'Required', () => enforce(model.email).isNotBlank());
    test('profile.age', 'Must be 18+', () =>
      enforce(model.profile?.age).greaterThanOrEquals(18)
    );
  }
);
// Call site: userSuite.only('email').run(model) for field-level validation

// Component - use type inference (no explicit type needed)
@Component({...})
class UserFormComponent {
  protected readonly suite = userSuite; // ✅ Works in templates, type inferred
  protected readonly formValue = signal<UserModel>({});
}
```

---

## Why Two Types?

**`NgxTypedVestSuite<T>`**: Strong typing with model type `T`

- Use when **defining** validation suites
- Callback takes only the model: `(model: T) => void`
- Provides IDE autocomplete for field names in `test()` calls
- Catches typos at compile time

**`NgxVestSuite<T>`**: Flexible base type

- Used internally by the form directive
- Accepts **both** typed and untyped suites seamlessly
- The model parameter remains fully typed

---

## Recommended Pattern

**Always use `NgxTypedVestSuite` when defining validation suites, and let TypeScript infer the type in components:**

```typescript
// ✅ RECOMMENDED: Strong typing at definition
export const userValidation: NgxTypedVestSuite<UserModel> = create(
  (model: UserModel) => {
    // Full autocomplete for field names in test() calls
    test('email', 'Required', () => enforce(model.email).isNotBlank());
  }
);
// Call site: userValidation.only('email').run(model)

// ✅ In component: Use type inference
@Component({...})
class MyFormComponent {
  protected readonly suite = userValidation; // ✅ No explicit type needed
  protected readonly formValue = signal<UserModel>({});
}
```

**Why this works:**

- `NgxVestSuite` callback takes `(model: T) => void`
- Accepts both typed and untyped suites
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

### Why Model-Only Callback?

In Vest 6, suites take only the model parameter. Field focus is handled at the call site via `suite.only(field).run(model)`. Both `NgxVestSuite` and `NgxTypedVestSuite` use the callback signature `(model: T) => void`.

This is safe because:

- **Model parameter `T` remains fully typed** — This is where type safety matters most
- **Field validation happens at the call site** — `suite.only('email').run(model)` focuses on a single field
- **Runtime behavior is identical** — `suite.run(model)` validates all fields
- **Enables type compatibility** — `NgxTypedVestSuite` works where `NgxVestSuite` is expected

### Type System Flow

```typescript
// 1. Define with strong typing
export const suite: NgxTypedVestSuite<UserModel> = create(
  (model: UserModel) => {
    test('email', 'Required', () => enforce(model.email).isNotBlank());
  }
);

// 2. Form directive accepts both types
@Directive(...)
class FormDirective<T> {
  suite = input<NgxVestSuite<T> | NgxTypedVestSuite<T> | null>(null);
  //             ^^^^^^^^^^^^^ - base type
  //                             ^^^^^^^^^^^^^^^^^^^ - strong typed
}

// 3. Runtime execution
suite.only(field).run(model);  // Field-level validation
suite.run(model);              // Full validation
suite.reset();                 // Reset accumulated state
```

### Benefits

✅ **Strong typing where you write code** — IDE autocomplete for field names in `test()` calls
✅ **Flexibility where you use code** — Works seamlessly in templates and components
✅ **Type safety** — Model parameter `T` remains fully typed throughout
✅ **No type assertions needed** — Everything just works
✅ **Clean callbacks** — No extra `field?` parameter or `only()` call needed

---

## Date Field Compatibility

When using Date fields in your form models, `ngx-vest-forms` automatically handles the common pattern where UI libraries emit empty strings before a date is selected.

### Shape Validation with Date Fields

```typescript
type FormModel = NgxDeepPartial<{
  birthDate: Date;
  appointmentDate: Date;
}>;

// Shape uses Date objects for type safety
export const formShape: NgxDeepRequired<FormModel> = {
  birthDate: new Date(),
  appointmentDate: new Date(),
};
```

**What happens at runtime:**

1. **Initial state**: Date fields start as empty strings (`''`) from the UI
2. **Shape validation**: Automatically skips validation for Date fields receiving empty strings
3. **User interaction**: When a date is selected, the field updates to a Date object
4. **No errors**: Shape validation handles the transition seamlessly

This behavior applies to:

- Date fields receiving empty strings (`''`)
- Fields with `null` or `undefined` values during initialization
- Nested Date fields in complex form structures

**Note**: This is purely a runtime shape validation improvement. Your TypeScript types remain strict, ensuring type safety at compile time.

```

```
