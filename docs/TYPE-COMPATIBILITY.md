# Suite type compatibility

`ngx-vest-forms` v3 exports one canonical suite type: `NgxVestSuite<T>`. The v2 alias `NgxTypedVestSuite<T>` was removed in v3.0.0.

## Basic usage

Type Vest 6 model-only suites with `NgxVestSuite<T>`:

```ts
import { Component, signal } from '@angular/core';
import {
  NgxVestForms,
  type NgxDeepPartial,
  type NgxVestSuite,
} from 'ngx-vest-forms';
import { create, enforce, test } from 'vest';

type UserModel = NgxDeepPartial<{
  email: string;
  profile: { age: number };
}>;

export const userSuite: NgxVestSuite<UserModel> = create((model) => {
  test('email', 'Email is required', () => {
    enforce(model.email).isNotBlank();
  });

  test('profile.age', 'Must be 18 or older', () => {
    enforce(model.profile?.age).greaterThanOrEquals(18);
  });
});

@Component({
  selector: 'app-user-form',
  imports: [NgxVestForms],
  template: `...`,
})
export class UserFormComponent {
  protected readonly suite = userSuite;
  protected readonly formValue = signal<UserModel>({});
}
```

## Public contract of `NgxVestSuite<T>`

`NgxVestSuite<T>` exposes the Vest 6 suite interface used by the directive:

- `only(match).run(model)` for field-focused validation
- `focus({ only, skip, onlyGroup, skipGroup }).run(model)` for combined field and group focus (optional on the type so minimal test fakes do not have to implement it; every Vest 6.3+ suite provides it)
- `run(model)` for full validation
- `get()`, `reset()`, `resetField(field)`, and `remove(field)` (also exposed via `FormDirective.resetForm()`, `FormDirective.resetField()`, and `FormDirective.removeField()`)
- `subscribe()`, `dump()`, and `resume()` (typed without `any` in v3)

## Schema-typed suites

Vest 6 types a suite from a schema passed as the second argument of `create()`. With `enforce.shape(...)` (or any Standard Schema), the callback receives the schema output type, `run()` takes the schema input type, and `only()`, `focus()`, `afterField()`, `getErrors()`, `hasErrors()`, and `isValid()` accept only the schema's top-level field names.

Annotating `const suite: NgxVestSuite<Model> = create(...)` widens those field names back to `string`. To keep strict field-name checking while verifying compatibility with `[suite]`, use `satisfies NgxVestSuite<Model>`:

```ts
import type { NgxDeepPartial, NgxVestSuite } from 'ngx-vest-forms';
import { create, enforce, test } from 'vest';

type SignupModel = NgxDeepPartial<{ email: string; age: number }>;

// Keep every schema key optional: the form builds values one control at a time.
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

signupSuite.only('email').run({ email: 'a@b.c' }); // Valid
// @ts-expect-error 'emial' is not a field of the schema
signupSuite.only('emial');
```

The checked union covers top-level schema keys. Nested paths such as `'address.city'` still work in `test()` and appear on `result.getErrors()`. See `apps/examples/src/app/pages/native-schema-demo/native-schema-demo.validations.ts` for a runnable example.

## Date fields in legacy object contracts

When using a Standard Schema (Zod, Valibot, etc.), express `Date` coercion directly in the schema. If you use a legacy `NgxDeepRequired<T>` object contract for dev-mode diagnostics, ngx-vest-forms tolerates empty-string initialization (`''`) on `Date` fields while keeping TypeScript typing strict:

```ts
import type { NgxDeepPartial, NgxDeepRequired } from 'ngx-vest-forms';

type EventFormModel = NgxDeepPartial<{
  startDate: Date;
  endDate: Date;
}>;

export const eventFormContract: NgxDeepRequired<EventFormModel> = {
  startDate: new Date(),
  endDate: new Date(),
};
```

## Migrating from `NgxTypedVestSuite<T>`

`NgxTypedVestSuite<T>` was structurally identical to `NgxVestSuite<T>`. Rename all imports and references from `NgxTypedVestSuite` to `NgxVestSuite`. See [MIGRATION-v2.x-to-v3.0.0.md](./migration/MIGRATION-v2.x-to-v3.0.0.md) for the full v3 upgrade checklist.
