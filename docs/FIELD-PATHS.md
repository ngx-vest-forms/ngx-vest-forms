# Field path types

Compile-time TypeScript utilities for dot-notation field paths in `ngx-vest-forms`. All types are erased at compile time with zero runtime cost.

## Core types

### `FieldPath<T>`

Produces a union of all valid dot-notation field paths for `T`, supporting nested objects (up to 10 levels deep), optional properties (`NgxDeepPartial<T>`), and indexed array paths.

```ts
import type { FieldPath, NgxDeepPartial } from 'ngx-vest-forms';

type UserModel = NgxDeepPartial<{
  name: string;
  profile: {
    age: number;
    address: {
      city: string;
    };
  };
}>;

// 'name' | 'profile' | 'profile.age' | 'profile.address' | 'profile.address.city'
type UserPaths = FieldPath<UserModel>;
```

#### Array paths

Every path below an array carries a `${number}` index segment (`addresses.0.street`), matching how Angular template-driven forms register array items under numeric `ngModelGroup` keys and how `getAllFormErrors`, `fieldWarnings`, `fieldBlur`, `validationConfig`, and Vest `each()` name fields.

```ts
type OrderModel = {
  addresses: Array<{ street: string }>;
  tags: string[];
};

// 'addresses' | `addresses.${number}` | `addresses.${number}.street`
// | 'tags' | `tags.${number}`
type OrderPaths = FieldPath<OrderModel>;

const valid: OrderPaths = 'addresses.0.street';
// const flat: OrderPaths = 'addresses.street';      // Compile error: missing index
// const bracket: OrderPaths = 'addresses[0].street'; // Compile error: use dot notation

declare const i: number;
const inline: OrderPaths = `addresses.${i}.street`; // OK inline
const key = `addresses.${i}.street` as const;
const stored: OrderPaths = key; // OK with `as const`
```

Nested arrays carry one index segment per level (`orders.0.lines.3.sku`). Elements typed `any` or `unknown` accept any sub-path below the index.

### `LeafFieldPath<T>`

Extracts only leaf paths (paths to primitive values), excluding intermediate objects.

```ts
import type { LeafFieldPath } from 'ngx-vest-forms';

type Model = {
  user: {
    name: string;
    profile: { age: number };
  };
};

// 'user.name' | 'user.profile.age'
type Leaves = LeafFieldPath<Model>;
```

### `ValidationConfigMap<T>`

Maps trigger `FieldPath<T>` keys to arrays of dependent `FieldPath<T>` values. Bound `[validationConfig]` inputs are strictly checked against this type in v3.

```ts
import type { ValidationConfigMap } from 'ngx-vest-forms';

type SignupModel = {
  email?: string;
  password?: string;
  confirmPassword?: string;
};

const config: ValidationConfigMap<SignupModel> = {
  password: ['confirmPassword'],
  email: ['password', 'confirmPassword'],
};
```

For fluent composition with `.bidirectional()`, `.whenChanged()`, `.group()`, and `.merge()`, see [ValidationConfig builder](./VALIDATION-CONFIG-BUILDER.md).

### `FormFieldName<T>`

Unions `FieldPath<T>` with `typeof ROOT_FORM`. Use it for helper parameters or typed field-name constants.

```ts
import { ROOT_FORM, type FormFieldName } from 'ngx-vest-forms';
import { create, enforce, test } from 'vest';

type FormModel = {
  email?: string;
  user?: { name?: string };
};

// 'email' | 'user' | 'user.name' | typeof ROOT_FORM
const userNameField: FormFieldName<FormModel> = 'user.name';

export const suite = create((model: FormModel) => {
  test(userNameField, 'Name is required', () => {
    enforce(model.user?.name).isNotBlank();
  });

  test(ROOT_FORM, 'Provide an email or a name', () => {
    enforce(model.email || model.user?.name).isTruthy();
  });
});
```

Note that Vest's global `test()` accepts `string`; to check field names at compile time inside a suite, pass a schema to `create()` and use `satisfies NgxVestSuite<T>` (see [Suite type compatibility](./TYPE-COMPATIBILITY.md#schema-typed-suites)).

### `FieldPathValue<T, Path>`

Resolves the value type at `Path` (stripping `NgxDeepPartial`'s `| undefined` on the leaf). Supports dot-indexed (`addresses.0.street`), bracket-indexed (`addresses[0].street`), and index-free (`addresses.street`) array paths.

```ts
import type { FieldPathValue } from 'ngx-vest-forms';

type Model = {
  user: { profile: { age: number } };
  addresses: Array<{ street: string; city: string }>;
};

type Age = FieldPathValue<Model, 'user.profile.age'>; // number
type Street = FieldPathValue<Model, 'addresses.0.street'>; // string
type Address = FieldPathValue<Model, 'addresses.0'>; // { street: string; city: string }
```

### `ValidateFieldPath<T, Path>`

Compile-time path guard: evaluates to `Path` when `Path extends FieldPath<T>`, or `never` otherwise. Useful when authoring generic helpers that accept a path string and verify it against `T`.

```ts
import type { ValidateFieldPath } from 'ngx-vest-forms';

type Model = { name: string; age: number };

type Valid = ValidateFieldPath<Model, 'name'>; // 'name'
type Invalid = ValidateFieldPath<Model, 'missing'>; // never
```

## Runtime path helpers

Every path reported by ngx-vest-forms at runtime (`formState().errors`, `getAllFormErrors`, `fieldWarnings`, `fieldBlur.field`, `validatedFields`) uses dot notation, including array indices (`users.0.name`).

- **`stringifyFieldPath(segments)`** converts a Standard Schema issue path array into bracket notation (`['users', 0, 'name']` becomes `'users[0].name'`) for display or logging. To match library-reported paths, join segments with `'.'` instead.
- **`setValueAtPath(obj, path, value)`** writes a nested value by dot or bracket path and ignores unsafe prototype keys (`__proto__`, `prototype`, `constructor`).
- **`arrayToObject()` / `deepArrayToObject()` / `objectToArray()`** convert between arrays and numeric-keyed objects for `ngModelGroup` bindings. See [Utilities reference](../packages/ngx-vest-forms/src/lib/utils/README.md).

## Troubleshooting

- **Autocomplete does not appear:** Ensure `"strict": true` in `tsconfig.json` and TypeScript ~6.0 (matching Angular 22), then restart the TypeScript language server.
- **"Type instantiation is excessively deep":** `FieldPath<T>` recurses up to 10 levels deep; flatten deeper models or split them into smaller section models.
- **Dynamic helper function rejects valid paths:** Write helpers against a concrete model type rather than an unconstrained generic `<T>`, because `FieldPath<T>` cannot resolve keys on an unknown `T`.
- **Indexed array path rejected:** Use dot notation (`items.0.name`), not brackets (`items[0].name`), and add `as const` when storing template-literal paths in a variable.

## Related guides

- [ValidationConfig builder](./VALIDATION-CONFIG-BUILDER.md)
- [Suite type compatibility](./TYPE-COMPATIBILITY.md)
- [Utilities reference](../packages/ngx-vest-forms/src/lib/utils/README.md)
- [v2.x to v3.0.0 migration guide](./migration/MIGRATION-v2.x-to-v3.0.0.md)
