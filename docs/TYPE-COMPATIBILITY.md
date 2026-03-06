# Suite Type Compatibility

> **Current guidance:** Use `NgxVestSuite<T>` in new code. `NgxTypedVestSuite<T>` still works, but it is now a deprecated alias of the same structural type.

## Overview

In v3.x, `ngx-vest-forms` exposes one canonical public suite type: `NgxVestSuite<T>`.

`NgxTypedVestSuite<T>` remains exported for backward compatibility, but it is no longer the recommended type to document or introduce in new examples.

## Quick start

```typescript
import { Component, signal } from '@angular/core';
import { create, test, enforce } from 'vest';
import {
  NgxDeepPartial,
  NgxVestSuite,
} from 'ngx-vest-forms';

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

@Component({...})
class UserFormComponent {
  protected readonly suite = userSuite;
  protected readonly formValue = signal<UserModel>({});
}
```

## What changed in v3.x

- Suite callbacks now take only the model: `create((model) => { ... })`
- Field focus moved to the call site: `suite.only(field).run(model)`
- `NgxVestSuite<T>` became the canonical public wrapper for Vest 6 suites
- `NgxTypedVestSuite<T>` became a deprecated alias of `NgxVestSuite<T>`

## Which type should I use?

### `NgxVestSuite<T>`

Use this for:

- suite definitions
- component properties
- helper function parameters
- public APIs in your own library/app code

It gives you the current runtime shape and matches the library documentation.

### `NgxTypedVestSuite<T>`

Use this only when you are:

- maintaining older code that already uses it
- migrating incrementally and want to avoid churn in a single change

It is structurally identical to `NgxVestSuite<T>`, so behavior does not change — only the recommended naming does.

## Migration from the deprecated alias

This is a mechanical rename:

```typescript
// Before
import { NgxTypedVestSuite } from 'ngx-vest-forms';

export const suite: NgxTypedVestSuite<FormModel> = create((model) => {
  test('email', 'Required', () => enforce(model.email).isNotBlank());
});

// After
import { NgxVestSuite } from 'ngx-vest-forms';

export const suite: NgxVestSuite<FormModel> = create((model) => {
  test('email', 'Required', () => enforce(model.email).isNotBlank());
});
```

## Technical note

Both exported names currently resolve to the same structural contract:

- `only(match).run(model)` for focused validation
- `run(model)` for full validation
- `get()`, `reset()`, `resetField(field)`, and `remove(field)`

That means these assignments are valid:

```typescript
const suiteA: NgxVestSuite<FormModel> = create((model) => {
  test('email', 'Required', () => enforce(model.email).isNotBlank());
});

const suiteB: NgxTypedVestSuite<FormModel> = suiteA; // Works, but deprecated alias
const suiteC: NgxVestSuite<FormModel> = suiteB; // Also works
```

## Date field compatibility

When using `Date` fields in deep-partial form models, shape validation still supports the common pattern where form controls start with empty strings before a date is selected.

```typescript
import { NgxDeepPartial, NgxDeepRequired } from 'ngx-vest-forms';

type FormModel = NgxDeepPartial<{
  birthDate: Date;
  appointmentDate: Date;
}>;

export const formShape: NgxDeepRequired<FormModel> = {
  birthDate: new Date(),
  appointmentDate: new Date(),
};
```

Your compile-time typing remains strict, while runtime shape validation tolerates empty-string initialization from form controls.

## Summary

- Prefer `NgxVestSuite<T>` in all new examples and application code
- Treat `NgxTypedVestSuite<T>` as a backward-compatible alias
- Keep using the Vest 6 execution model: `suite.only(field).run(model)` and `suite.run(model)`
