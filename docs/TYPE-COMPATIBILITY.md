# Suite Type Compatibility

> **v3 guidance:** Use `NgxVestSuite<T>` everywhere. The legacy `NgxTypedVestSuite<T>` alias was **removed in v3.0.0**.

## Overview

`ngx-vest-forms` v3.x exposes one canonical public suite type: `NgxVestSuite<T>`. The earlier `NgxTypedVestSuite<T>` alias is no longer exported — imports of it will fail to compile.

## Quick start

```typescript
import { Component, signal } from '@angular/core';
import { create, test, enforce } from 'vest';
import { NgxDeepPartial, NgxVestSuite } from 'ngx-vest-forms';

type UserModel = NgxDeepPartial<{
  email: string;
  password: string;
  profile: {
    age: number;
  };
}>;

export const userSuite: NgxVestSuite<UserModel> = create((model) => {
  test('email', 'Required', () => enforce(model.email).isNotBlank());
  test('profile.age', 'Must be 18+', () =>
    enforce(model.profile?.age).greaterThanOrEquals(18)
  );
});

// Field focus is handled at the call site.
// userSuite.only('email').run(model)

@Component({
  /* ... */
})
class UserFormComponent {
  protected readonly suite = userSuite;
  protected readonly formValue = signal<UserModel>({});
}
```

## What changed in v3.x

- Suite callbacks now take only the model: `create((model) => { ... })`.
- Field focus moved to the call site: `suite.only(field).run(model)`.
- `NgxVestSuite<T>` is the canonical public wrapper for Vest 6 suites.
- `NgxTypedVestSuite<T>` was **removed**.

## Migration from `NgxTypedVestSuite<T>`

Mechanical rename — the public API surface of the two types was identical:

```typescript
// Before (v2.x)
import { NgxTypedVestSuite } from 'ngx-vest-forms';

export const suite: NgxTypedVestSuite<FormModel> = create((model) => {
  test('email', 'Required', () => enforce(model.email).isNotBlank());
});

// After (v3.x)
import { NgxVestSuite } from 'ngx-vest-forms';

export const suite: NgxVestSuite<FormModel> = create((model) => {
  test('email', 'Required', () => enforce(model.email).isNotBlank());
});
```

A repo-wide find-and-replace from `NgxTypedVestSuite` to `NgxVestSuite` is safe.

## Public surface

`NgxVestSuite<T>` exposes the Vest 6 contract used by the library:

- `only(match).run(model)` for focused validation
- `run(model)` for full validation
- `get()`, `reset()`, `resetField(field)`, and `remove(field)`

## Date field compatibility

When using `Date` fields in deep-partial form models, shape validation supports the common pattern where form controls start with empty strings before a date is selected:

```typescript
import { NgxDeepPartial, NgxDeepRequired } from 'ngx-vest-forms';

type FormModel = NgxDeepPartial<{
  birthDate: Date;
  appointmentDate: Date;
}>;

export const formContract: NgxDeepRequired<FormModel> = {
  birthDate: new Date(),
  appointmentDate: new Date(),
};
```

Compile-time typing remains strict; runtime shape validation tolerates empty-string initialization from form controls.

## Summary

- Use `NgxVestSuite<T>` everywhere in v3.
- If migrating from v2.x, rename `NgxTypedVestSuite` → `NgxVestSuite`; structural shape is unchanged.
- Use the Vest 6 execution model: `suite.only(field).run(model)` and `suite.run(model)`.
