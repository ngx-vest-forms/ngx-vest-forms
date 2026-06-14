# Migration Guide: v2.x to v3.0.0

## v3 deprecation removals

v3.0.0 deletes every `@deprecated` runtime helper, const alias, and type alias that v2.x kept around for backward compatibility. Consumers who migrated to the recommended `Ngx`-prefixed names need no changes; consumers still on the deprecated forms get a compile error pointing at the replacement.

| Removed                                     | Replacement                        | Migration tip                                                                                                                                                         |
| ------------------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cloneDeep(value)`                          | `structuredClone(value)`           | Native browser/Node API; no import needed.                                                                                                                            |
| `set(obj, path, value)`                     | `setValueAtPath(obj, path, value)` | Already exported from `ngx-vest-forms`; identical signature.                                                                                                          |
| `vestForms` (const array)                   | `NgxVestForms`                     | `import { NgxVestForms } from 'ngx-vest-forms';` — same array, renamed.                                                                                               |
| `ROOT_FORM_CONSTANT`                        | `ROOT_FORM`                        | Single canonical export from `ngx-vest-forms`.                                                                                                                        |
| `DeepPartial<T>`                            | `NgxDeepPartial<T>`                | Structurally identical; rename the import.                                                                                                                            |
| `DeepRequired<T>`                           | `NgxDeepRequired<T>`               | Structurally identical; rename the import.                                                                                                                            |
| `FormCompatibleDeepRequired<T>`             | _(removed)_                        | See "Replacing `NgxFormCompatibleDeepRequired`" below for a copy-paste snippet, or express Date coercion in your schema (e.g., `z.union([z.date(), z.literal('')])`). |
| `NgxTypedVestSuite<T>`                      | `NgxVestSuite<T>`                  | Structurally identical; rename the type reference.                                                                                                                    |
| `SC_ERROR_DISPLAY_MODE_DEFAULT` (re-export) | `NGX_ERROR_DISPLAY_MODE_DEFAULT`   | Was an internal re-export; if you imported it, switch to the `NGX_*` name.                                                                                            |
| `[formShape]` input                         | `[formContract]`                   | See "`[formShape]` → `[formContract]`" below. Raw `NgxDeepRequired<T>` shapes are still accepted; wrap with `toFormContract(shape)` for explicit conversion.          |
| `NgxFormCompatibleDeepRequired<T>`          | _(removed)_                        | See "Replacing `NgxFormCompatibleDeepRequired`" below.                                                                                                                |

If you only used the recommended `Ngx*` / `NGX_*` names (or the canonical `setValueAtPath` / `structuredClone`), v3 is a no-op for this category.

### `[formShape]` → `[formContract]`

The `[formShape]` input on `<form ngxVestForm>` is removed in v3 and replaced by `[formContract]`, which accepts any [Standard Schema v1](https://standardschema.dev) value (Zod v4, Valibot, hand-rolled, …) **or** a legacy `NgxDeepRequired<T>` shape object for back-compat.

If you already have a schema, pass it directly and let that remain your structural contract. Keep raw `NgxDeepRequired<T>` shapes for migration or for apps that want a low-dependency fallback without bringing in a schema library.

```html
<!-- v2 -->
<form ngxVestForm [suite]="suite" [formShape]="myContract"></form>

<!-- v3: raw NgxDeepRequired<T> shape still accepted (migration/fallback) -->
<form ngxVestForm [suite]="suite" [formContract]="myContract"></form>

<!-- v3: explicit conversion from legacy shape to Standard Schema -->
<form ngxVestForm [suite]="suite" [formContract]="toFormContract(myContract)"></form>

<!-- v3: real Standard Schema (preferred when your app already has one) -->
<form ngxVestForm [suite]="suite" [formContract]="zodSchema"></form>
```

`@standard-schema/spec` is now a `peerDependency` (`>=1.0.0`). Most consumers don't need to install it directly — bring it in only if you author your own `StandardSchemaV1<T>` literals. The internal `validateShape()` helper has been removed; use `toFormContract()` from `ngx-vest-forms` if you need explicit shape→schema conversion.

Unknown-key warnings now depend on the strictness of the supplied Standard Schema. If you keep using a raw `NgxDeepRequired<T>` contract, the legacy extra-property typo checks still apply. The directive only consumes **synchronous** contract results for its development-only diagnostics; async schema results are ignored by that pass.

### Replacing `NgxFormCompatibleDeepRequired`

`NgxFormCompatibleDeepRequired<T>` was a project-specific helper that mapped `Date` (and `Date | undefined`) to `Date | string` so date-picker components could use `''` as a no-selection placeholder. v3 removes it for two reasons:

1. The `[formContract]` input now accepts any [Standard Schema v1](https://standardschema.dev) value. Schema validators (Zod, Valibot, ArkType) express Date coercion natively — e.g., `z.union([z.date(), z.literal('')])` or `z.coerce.date()` — so you don't need a TypeScript-only workaround.
2. It had no equivalent in `ts-essentials` or any standard library, making it surprising in a Standard-Schema-first API surface.

**Recommended migration:** move Date coercion into your schema. **Fallback:** if you still need the type as-is, copy this snippet into your project (it depends only on `_Primitive`, `_Builtin`, `_IsNever`, `_IsTuple` helpers — included below):

```typescript
// Adapted from ts-essentials DeepRequired (MIT License).
// https://github.com/ts-essentials/ts-essentials
type _Primitive =
  | string
  | number
  | boolean
  | bigint
  | symbol
  | undefined
  | null;
type _Builtin = _Primitive | Function | Date | Error | RegExp;
type _IsNever<T> = [T] extends [never] ? true : false;
type _IsTuple<T extends ReadonlyArray<any>> = number extends T['length']
  ? false
  : true;

export type FormCompatibleDeepRequired<T> = T extends Date
  ? Date | string
  : T extends Error
    ? Required<T>
    : T extends _Builtin
      ? T
      : T extends Map<infer K, infer V>
        ? Map<FormCompatibleDeepRequired<K>, FormCompatibleDeepRequired<V>>
        : T extends ReadonlyMap<infer K, infer V>
          ? ReadonlyMap<
              FormCompatibleDeepRequired<K>,
              FormCompatibleDeepRequired<V>
            >
          : T extends WeakMap<infer K, infer V>
            ? WeakMap<
                FormCompatibleDeepRequired<K> & object,
                FormCompatibleDeepRequired<V>
              >
            : T extends Set<infer U>
              ? Set<FormCompatibleDeepRequired<U>>
              : T extends ReadonlySet<infer U>
                ? ReadonlySet<FormCompatibleDeepRequired<U>>
                : T extends WeakSet<infer U>
                  ? WeakSet<FormCompatibleDeepRequired<U> & object>
                  : T extends Promise<infer U>
                    ? Promise<FormCompatibleDeepRequired<U>>
                    : T extends ReadonlyArray<infer U>
                      ? _IsNever<_IsTuple<T>> extends false
                        ? { [K in keyof T]-?: FormCompatibleDeepRequired<T[K]> }
                        : T extends Array<U>
                          ? Array<
                              Exclude<FormCompatibleDeepRequired<U>, undefined>
                            >
                          : ReadonlyArray<
                              Exclude<FormCompatibleDeepRequired<U>, undefined>
                            >
                      : T extends {}
                        ? { [K in keyof T]-?: FormCompatibleDeepRequired<T[K]> }
                        : Required<T>;
```

## What's new in v3 beyond Vest 6

Migrating to Vest 6 gets you model-only suites, `suite.run(...)`, `suite.only(...).run(...)`, top-level `memo()`, hybrid run results, and async-test `AbortSignal`. ngx-vest-forms v3 adopts that baseline and the directive's async validator drives the suite via `suite.only(field).run(model)`, so the Vest-6 patterns below compose with the form without extra wiring.

### Use Vest 6's async-test `AbortSignal` to cancel in-flight requests

Each async test receives an `AbortSignal` via its test context. Vest fires the prior run's signal when a new run for the same test ID starts. Because the form directive issues a fresh `suite.only(field).run(model)` on every relevant edit, Vest's own stale-cancellation aborts the in-flight async test automatically — provided the test body passes `signal` into its underlying request.

```typescript
test('username', 'Username is already taken', async ({ signal }) => {
  const response = await fetch(
    `/api/check-username?value=${encodeURIComponent(model.username!)}`,
    { signal }
  );
  const { taken } = await response.json();
  enforce(taken).isFalsy();
});
```

For RxJS-backed APIs, adapt the same signal:

```typescript
import { fromEvent, lastValueFrom, takeUntil } from 'rxjs';

test('userId', 'User ID is already taken', async ({ signal }) => {
  const exists = await lastValueFrom(
    swapiService
      .userIdExists(model.userId!)
      .pipe(takeUntil(fromEvent(signal, 'abort')))
  );

  enforce(exists).isFalsy();
});
```

Migration takeaway: stop teaching “ignore late async results” as the primary pattern. Prefer passing the signal into the underlying request so the stale work is cancelled, not merely discarded.

### Prefer `memo()` for expensive deterministic blocks

Vest 6.3 exposes top-level `memo()` from `vest/memo`. Use it to wrap expensive validation blocks whose result should be reused until a dependency changes. The runnable purchase-form example in this repo uses this pattern; see `apps/examples/src/app/pages/purchase-form/purchase.validations.ts`.

If you are migrating older code, the Vest 5 `test.memo(...)` form is removed — move the test body into `memo(() => { test(...) }, deps)`.

```typescript
import { create, skipWhen, test } from 'vest';
import { memo } from 'vest/memo';

export const profileSuite = create((model: ProfileModel) => {
  test('userId', 'User ID is required', () => {
    enforce(model.userId).isNotBlank();
  });

  skipWhen(
    (res) => res.hasErrors('userId'),
    () => {
      memo(() => {
        test('userId', 'User ID is already taken', async ({ signal }) => {
          const response = await fetch(`/api/users/${model.userId}`, {
            signal,
          });
          const { exists } = await response.json();
          enforce(exists).isFalsy();
        });
      }, [model.userId]);
    }
  );
});
```

Adoption guidance:

- use `memo()` around deterministic blocks that would otherwise rerun on unrelated fields or repeated identical input
- keep `memo()` outside ad-hoc `if` trees; pair it with stable suite structure and `skipWhen(...)` / `omitWhen(...)`
- if you are migrating older Vest 5 `test.memo(...)` examples, move the block into `memo(() => { test(...) }, deps)`

Before:

```typescript
test.memo(
  'userId',
  'User ID is already taken',
  async ({ signal }) => {
    await checkUserId(model.userId, { signal });
  },
  [model.userId]
);
```

After:

```typescript
memo(() => {
  test('userId', 'User ID is already taken', async ({ signal }) => {
    await checkUserId(model.userId, { signal });
  });
}, [model.userId]);
```

## `getAllFormErrors` returns `{ errors, warnings }`

v2 returned `Record<string, string[]>` and attached field-level warnings as a non-enumerable `warnings` property on each errors array. That side-channel was invisible to `Object.keys`, spreads, `JSON.stringify`, and `structuredClone`, which made it easy to miss and impossible to serialise.

v3 returns a sibling-record shape so errors and warnings are first-class:

```typescript
export type NgxFormErrorsByPath = {
  errors: Record<string, string[]>;
  warnings: Record<string, string[]>;
};

export function getAllFormErrors(form?: AbstractControl): NgxFormErrorsByPath;
```

Before:

```typescript
const all = getAllFormErrors(form);
const fieldErrors = all['user.name']; // string[]
const fieldWarnings = (all['user.name'] as string[] & { warnings?: string[] })
  .warnings;
```

After:

```typescript
const all = getAllFormErrors(form);
const fieldErrors = all.errors['user.name']; // string[] | undefined
const fieldWarnings = all.warnings['user.name']; // string[] | undefined
```

The `errorsChange` output on `FormDirective` still emits `Record<string, string[]>` (the `errors` slice of the new shape), so templates consuming `(errorsChange)="errors.set($event)"` and reading `errors()['field']` continue to work unchanged. For warnings inside templates, prefer the existing `fieldWarnings()` signal on the directive — it is per-field, reactive, and the recommended path for warning display.

## Internal helpers moved to `ngx-vest-forms/internal`

Six previously `@internal` symbols have been **removed from the primary `'ngx-vest-forms'` entry point** and are now only reachable from the new `'ngx-vest-forms/internal'` secondary entry point:

| Symbol                    | v2.x import                | v3 import                            |
| ------------------------- | -------------------------- | ------------------------------------ |
| `fastDeepEqual`           | `from 'ngx-vest-forms'`    | `from 'ngx-vest-forms/internal'`     |
| `shallowEqual`            | `from 'ngx-vest-forms'`    | `from 'ngx-vest-forms/internal'`     |
| `parseFieldPath`          | `from 'ngx-vest-forms'`    | `from 'ngx-vest-forms/internal'`     |
| `getFormControlField`     | `from 'ngx-vest-forms'`    | `from 'ngx-vest-forms/internal'`     |
| `getFormGroupField`       | `from 'ngx-vest-forms'`    | `from 'ngx-vest-forms/internal'`     |
| `mergeValuesAndRawValues` | `from 'ngx-vest-forms'`    | `from 'ngx-vest-forms/internal'`     |

```typescript
// Before (v2.x)
import { parseFieldPath } from 'ngx-vest-forms';

// After (v3)
import { parseFieldPath } from 'ngx-vest-forms/internal';
```

The `ngx-vest-forms/internal` entry point carries **no semver guarantees** — it is for advanced use only and may change in any release. `getAllFormErrors` and `NgxFormErrorsByPath` are **not** affected; they remain on the primary `'ngx-vest-forms'` entry along with all other documented public API.

## Known limitations (v3)

These are accepted, documented limitations in the v3 line. Each links to an Architecture Decision Record (ADR) with the full rationale and the conditions under which it will be revisited.

- **`validationConfig` cooldown can drop rapid trigger-field input.** The time-based re-entry guard that prevents bidirectional validation loops can also suppress a genuine, very rapid user edit to a trigger field that lands inside the cooldown window; the dependent field reconciles on the next qualifying change. See [docs/adr/0003-validation-config-cooldown-can-drop-rapid-input.md](../adr/0003-validation-config-cooldown-can-drop-rapid-input.md).
- **`validationConfig` trigger-control recreation is not supported.** If a `validationConfig` trigger control is destroyed and recreated (e.g. behind `@if`), the pipeline stays bound to the original control instance and the recreated control no longer drives dependent-field revalidation. **Workaround:** keep the trigger control mounted and toggle it via `disabled`/hidden styling instead of `@if`-destroying it, or re-create the whole form group so the dependent field and its `validationConfig` are re-wired together. See [docs/adr/0004-validation-config-trigger-control-recreation-unsupported.md](../adr/0004-validation-config-trigger-control-recreation-unsupported.md).

## v3 selector + token removals

v3.0.0 removes the legacy `sc-` selectors, duplicate directive aliases, duplicate root-form inputs, and `SC_ERROR_DISPLAY_MODE_TOKEN`.

### Removed symbols

- `form[scVestForm]`
- `exportAs: 'scVestForm'`
- `form[validateRootForm]`
- `validateRootForm`
- `validateRootFormMode`
- `[formControlState]`
- `exportAs: 'formControlState'`
- `[formErrorDisplay]`
- `exportAs: 'formErrorDisplay'`
- `[formErrorControl]`
- `exportAs: 'formErrorControl'`
- `sc-control-wrapper`, `[scControlWrapper]`, `[sc-control-wrapper]`
- `[ngx-control-wrapper]`
- `sc-form-group-wrapper`, `[scFormGroupWrapper]`
- `SC_ERROR_DISPLAY_MODE_TOKEN`

### Renamed symbols

- `ScErrorDisplayMode` → `NgxErrorDisplayMode`
- `SC_ERROR_DISPLAY_MODE_DEFAULT` → `NGX_ERROR_DISPLAY_MODE_DEFAULT`
- `SC_WARNING_DISPLAY_MODE_DEFAULT` → `NGX_WARNING_DISPLAY_MODE_DEFAULT`

### Keep using

- `form[ngxVestForm]`
- `ngxValidateRootForm`
- `ngxValidateRootFormMode`
- `ngxControlState`
- `ngxErrorDisplay`
- `ngxErrorControl`
- `ngx-control-wrapper`, `[ngxControlWrapper]`
- `ngx-form-group-wrapper`, `[ngxFormGroupWrapper]`
- `NGX_ERROR_DISPLAY_MODE_TOKEN`

### Migration steps

1. Run the codemod in [../SELECTOR-PREFIX-MIGRATION.md](../SELECTOR-PREFIX-MIGRATION.md).
2. Replace any remaining `SC_ERROR_DISPLAY_MODE_TOKEN` providers with `NGX_ERROR_DISPLAY_MODE_TOKEN`. If you imported `ScErrorDisplayMode`, `SC_ERROR_DISPLAY_MODE_DEFAULT`, or `SC_WARNING_DISPLAY_MODE_DEFAULT`, switch to the `Ngx*`/`NGX_*` names — the values are unchanged.
3. Replace template refs and aliases:
   - `#form="scVestForm"` → `#form="ngxVestForm"`
   - `#state="formControlState"` → `#state="ngxControlState"`
   - `#display="formErrorDisplay"` → `#display="ngxErrorDisplay"`
   - `#ec="formErrorControl"` → `#ec="ngxErrorControl"`
4. Replace root-form bindings:
   - `validateRootForm` → `ngxValidateRootForm`
   - `validateRootFormMode` → `ngxValidateRootFormMode`
5. Replace kebab-case wrapper attributes with PascalCase:
   - `ngx-control-wrapper` attribute → `ngxControlWrapper`
   - `sc-control-wrapper` attribute → `ngxControlWrapper`
6. Update any custom CSS that targets removed `sc-` host classes.
7. Rebuild and rerun your tests.

### Example

```html
<!-- Before (v2.x) -->
<form
  scVestForm
  validateRootForm
  [validateRootFormMode]="'submit'"
  #form="scVestForm"
>
  <div formErrorControl #ec="formErrorControl">
    <input name="email" [ngModel]="formValue().email" />
  </div>
</form>

<!-- After (v3.x) -->
<form
  ngxVestForm
  ngxValidateRootForm
  [ngxValidateRootFormMode]="'submit'"
  #form="ngxVestForm"
>
  <div ngxErrorControl #ec="ngxErrorControl">
    <input name="email" [ngModel]="formValue().email" />
  </div>
</form>
```
