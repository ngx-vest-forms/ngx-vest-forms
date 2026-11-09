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

```text
// Before (v2.x)
import { NgxTypedVestSuite } from 'ngx-vest-forms';

export const suite: NgxTypedVestSuite<FormModel> = create((model) => {
  test('email', 'Required', () => enforce(model.email).isNotBlank());
});
// NOTE: This import no longer exists in v3; shown for migration context only.

// After (v3.x)
```

```typescript
import { NgxVestSuite } from 'ngx-vest-forms';

export const suite: NgxVestSuite<FormModel> = create((model) => {
  test('email', 'Required', () => enforce(model.email).isNotBlank());
});
```

A repo-wide find-and-replace from `NgxTypedVestSuite` to `NgxVestSuite` is safe.

## Public surface

`NgxVestSuite<T>` exposes the Vest 6 contract used by the library:

- `only(match).run(model)` for focused validation
- `focus({ only, skip, onlyGroup, skipGroup }).run(model)` for field and group focus. It is optional on the type, so hand-written suite fakes need not implement it; every Vest 6.3 suite has it.
- `run(model)` for full validation
- `get()`, `reset()`, `resetField(field)`, and `remove(field)`

## Schema-typed suites

Vest 6 types a suite from a schema passed as the second argument of `create()`. With `enforce.shape(...)` (or any Standard Schema), the callback's `model` gets the schema's output type, `run()` takes its input type, and `only()`, `focus()`, `afterField()` and result lookups such as `getErrors()`, `hasErrors()` and `isValid()` accept only the schema's field names. A misspelled field becomes a compile error.

An annotation such as `const suite: NgxVestSuite<Model> = create(...)` widens those field names back to `string`. To keep them, leave the suite's type inferred and check it with `satisfies`. The suite still binds to `[suite]`, because `NgxVestSuite<T>` declares its methods with method syntax and TypeScript checks their parameters bivariantly.

```typescript
import { NgxDeepPartial, NgxVestSuite } from 'ngx-vest-forms';
import { create, enforce, test } from 'vest';

type SignupModel = NgxDeepPartial<{ email: string; age: number }>;

// Every key optional: the directive runs one field at a time against a
// partial model, and a focused run checks only that field's part of the schema.
const signupSchema = enforce.shape({
  email: enforce.optional(enforce.isString()),
  age: enforce.optional(enforce.isNumber()),
});

export const signupSuite = create((model) => {
  test('email', 'Email is required', () => {
    enforce(model.email).isNotBlank();
  });
  test('age', 'You must be 18 or older', () => {
    enforce(model.age).greaterThanOrEquals(18);
  });
}, signupSchema) satisfies NgxVestSuite<SignupModel>;

signupSuite.only('email').run({ email: 'a@b.c' }); // OK
// @ts-expect-error 'emial' is not a field of the schema.
signupSuite.only('emial');
```

The field names are the schema's top-level keys. Nested Field Paths such as `'address.city'` are not in that union: `test('address.city', ...)` still works, and you read their messages from `result.getErrors()`, a record keyed by any path. The [native schema example](../apps/examples/src/app/pages/native-schema-demo/native-schema-demo.validations.ts) uses this pattern, and its spec checks the typing.

## Date field compatibility

When using `Date` fields in deep-partial form models, prefer expressing the contract in your Standard Schema if you already have one. For schema-less forms, the legacy `NgxDeepRequired<T>` fallback still supports the common pattern where form controls start with empty strings before a date is selected:

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

Compile-time typing remains strict; development-time contract diagnostics tolerate empty-string initialization from form controls for this legacy contract style. If you already use Standard Schema, prefer modeling the date coercion directly in the schema.

## Summary

- Use `NgxVestSuite<T>` everywhere in v3.
- If migrating from v2.x, rename `NgxTypedVestSuite` → `NgxVestSuite`; structural shape is unchanged.
- Use the Vest 6 execution model: `suite.only(field).run(model)` and `suite.run(model)`.
