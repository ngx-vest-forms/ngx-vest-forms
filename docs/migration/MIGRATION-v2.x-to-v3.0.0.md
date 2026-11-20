# Migration guide: v2.x to v3.0.0

## Peer dependency updates (required)

v3 raises the peer dependencies of `ngx-vest-forms`:

| Package | v2.x | v3.0.0 |
| --- | --- | --- |
| `@angular/core`, `@angular/forms` | `>=19.0.0` | `>=22.0.0 <23.0.0` |
| `vest` | `>=5.4.6` | `>=6.3.4 <7.0.0` |
| `rxjs` | `>=7.8.0` | `>=7.8.0` |

TypeScript ~6.0 is expected alongside Angular 22. `@standard-schema/spec` (`^1.0.0`) is installed automatically as a regular dependency.

```bash
npm install ngx-vest-forms@beta vest@^6.3.4
```

## 1. Rewrite Vest 5 suites to Vest 6 model-only callbacks

In v2, the directive called `suite(model, field)` and the suite callback had to call `only(field)` unconditionally. In v3, the directive focuses the field at the call site via `suite.only(field).run(model)`, so the callback takes only `model` and must not call `only()`.

```ts
// Before (v2 / Vest 5)
import { enforce, only, staticSuite, test } from 'vest';

const suite: NgxVestSuite<MyFormModel> = staticSuite((model, field?) => {
  only(field);
  test('email', 'Email is required', () => {
    enforce(model.email).isNotBlank();
  });
});

// After (v3 / Vest 6)
import { create, enforce, test } from 'vest';

const suite: NgxVestSuite<MyFormModel> = create((model) => {
  test('email', 'Email is required', () => {
    enforce(model.email).isNotBlank();
  });
});
```

- Switch `staticSuite(...)` (removed in Vest 6) to `create(...)`. For stateless server-side or script runs outside the directive, call `suite.runStatic(model)`.
- Replace Vest 5 `test.memo(...)` calls with top-level `memo(() => { test(...); }, deps)` imported from `'vest/memo'`.
- In async tests, pass Vest 6's `({ signal })` `AbortSignal` into `fetch` or RxJS `takeUntil(fromEvent(signal, 'abort'))` so stale in-flight requests cancel automatically.

## 2. Removed deprecated exports and aliases

v3 removes every `@deprecated` helper, constant, type alias, and `sc-` selector from v2.x:

| Removed | Replacement | Notes |
| --- | --- | --- |
| `cloneDeep(value)` | `structuredClone(value)` | Native browser/Node API |
| `set(obj, path, value)` | `setValueAtPath(obj, path, value)` | Identical signature |
| `vestForms` | `NgxVestForms` | Same directive/component array |
| `ROOT_FORM_CONSTANT` | `ROOT_FORM` | Canonical constant |
| `DeepPartial<T>` | `NgxDeepPartial<T>` | Structurally identical |
| `DeepRequired<T>` | `NgxDeepRequired<T>` | Structurally identical |
| `NgxTypedVestSuite<T>` | `NgxVestSuite<T>` | Structurally identical |
| `FormCompatibleDeepRequired<T>`, `NgxFormCompatibleDeepRequired<T>` | Express `Date` coercion in a Standard Schema | Copy-paste fallback below |
| `[formShape]` input, `validateShape()` | `[formContract]`, `provideFormContract()`, `toFormContract()` | Accepts Standard Schema v1 or `NgxDeepRequired<T>` |
| `sc-` selectors, `SC_ERROR_DISPLAY_MODE_TOKEN`, `ScErrorDisplayMode`, `[ngxModel]`, `[ngxModelGroup]` | `ngx-` equivalents | Run the codemod in [SELECTOR-PREFIX-MIGRATION.md](../SELECTOR-PREFIX-MIGRATION.md) |

### `[formShape]` to `[formContract]`

`[formContract]` and `provideFormContract(...)` accept any [Standard Schema v1](https://standardschema.dev) schema (Zod v4, Valibot, etc.) or a legacy `NgxDeepRequired<T>` shape object:

```html
<!-- v2 -->
<form ngxVestForm [suite]="suite" [formShape]="myContract"></form>

<!-- v3: legacy shape fallback still works -->
<form ngxVestForm [suite]="suite" [formContract]="myContract"></form>

<!-- v3: Standard Schema (recommended for new code, or via provideFormContract(zodSchema)) -->
<form ngxVestForm [suite]="suite" [formContract]="zodSchema"></form>
```

Dev-mode contract diagnostics consume synchronous schema results only; unknown-key warnings follow your schema's strictness (legacy shapes keep extra-key warnings).

### Fallback snippet for `NgxFormCompatibleDeepRequired`

If you do not move `Date` coercion into a Standard Schema (for example `z.union([z.date(), z.literal('')])`) and need the old type verbatim:

```ts
// Adapted from ts-essentials DeepRequired (MIT License).
type _Primitive = string | number | boolean | bigint | symbol | undefined | null;
type _Builtin = _Primitive | Function | Date | Error | RegExp;
type _IsNever<T> = [T] extends [never] ? true : false;
type _IsTuple<T extends ReadonlyArray<any>> = number extends T['length'] ? false : true;

export type FormCompatibleDeepRequired<T> = T extends Date
  ? Date | string
  : T extends Error
    ? Required<T>
    : T extends _Builtin
      ? T
      : T extends Map<infer K, infer V>
        ? Map<FormCompatibleDeepRequired<K>, FormCompatibleDeepRequired<V>>
        : T extends ReadonlyMap<infer K, infer V>
          ? ReadonlyMap<FormCompatibleDeepRequired<K>, FormCompatibleDeepRequired<V>>
          : T extends WeakMap<infer K, infer V>
            ? WeakMap<FormCompatibleDeepRequired<K> & object, FormCompatibleDeepRequired<V>>
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
                          ? Array<Exclude<FormCompatibleDeepRequired<U>, undefined>>
                          : ReadonlyArray<Exclude<FormCompatibleDeepRequired<U>, undefined>>
                      : T extends {}
                        ? { [K in keyof T]-?: FormCompatibleDeepRequired<T[K]> }
                        : Required<T>;
```

## 3. `getAllFormErrors` returns `{ errors, warnings }` and uses dotted array keys

v2 returned `Record<string, string[]>` with a non-enumerable `warnings` property attached to each array. v3 returns `{ errors, warnings }` (`NgxFormErrorsByPath`):

```ts
// Before (v2)
const all = getAllFormErrors(form);
const fieldErrors = all['user.name'];

// After (v3)
const { errors, warnings } = getAllFormErrors(form);
const fieldErrors = errors['user.name'];
const fieldWarnings = warnings['user.name'];
```

`(errorsChange)` still emits `Record<string, string[]>` (the `errors` record).

In addition, array indices in `getAllFormErrors`, `formState().errors`, `errorsChange`, and `touchedFieldPaths` / `validatedFields` now use dot notation everywhere (`users.0.name` instead of `users[0].name`).

## 4. Internal helpers moved to `ngx-vest-forms/internal`

Six `@internal` helpers moved from `'ngx-vest-forms'` to `'ngx-vest-forms/internal'` (which carries no semver guarantees):

- `fastDeepEqual`
- `shallowEqual`
- `parseFieldPath`
- `getFormControlField`
- `getFormGroupField`
- `mergeValuesAndRawValues`

`getAllFormErrors` and `NgxFormErrorsByPath` stay on `'ngx-vest-forms'`.

## 5. Strictly typed `validationConfig` and indexed array `FieldPath<T>`

- `NgxValidationConfig<T>` drops its untyped `Record<string, string[]>` branch. Invalid field paths in `[validationConfig]` now fail at compile time. Use `createValidationConfig<MyModel>()` or annotate `ValidationConfigMap<MyModel>`. For runtime-driven server paths, cast explicitly to `NgxValidationConfig<MyModel>`.
- `FieldPath<T>` and `LeafFieldPath<T>` now address array elements by index (`` `addresses.${number}.street` `` instead of `'addresses.street'`). Replace index-free array paths with indexed paths, and add `as const` when storing template-literal paths in variables.
- Internal type parameters were removed from `FieldPath<T>`, `LeafFieldPath<T>`, `ValidationConfigBuilder` methods, and `objectToArray`. Drop any explicit extra type arguments.

## 6. Wrapper ARIA, IDs, pending label, and held messages

- **ARIA form-widget roles:** `<ngx-control-wrapper>` and `ngxErrorControl` now stamp `aria-invalid` and `aria-describedby` onto elements with ARIA form-widget roles (`checkbox`, `combobox`, `listbox`, `radiogroup`, `searchbox`, `slider`, `spinbutton`, `switch`, `textbox`) and skip native inputs nested inside them. See [ADR-0010](../adr/0010-aria-association-targets-aria-form-widgets.md).
- **Per-app IDs:** If your app sets a non-default `APP_ID`, generated region IDs become `ngx-control-wrapper-<APP_ID>-0-error`. Read IDs from `FormErrorControlDirective` rather than hard-coding them.
- **Held messages while pending:** `errors()`, `warnings()`, `shouldShowErrors()`, and `shouldShowWarnings()` keep the last settled result while an async re-check is pending so live regions do not flicker or re-announce. Tests that expect an error to disappear immediately on keystroke must wait for the async check to settle.

## 7. Other breaking behavioral changes

- **Model writes emit Angular form events:** `[formValue]` sync now calls `patchValue(value)` without `{ emitEvent: false }`. Subscribers to `ngForm.form.valueChanges` / `statusChanges` fire on programmatic model writes (`(formValueChange)` still does not echo back). Model updates made inside `(formValueChange)` now win cleanly without logging `NGX-100`.
- **`objectToArray(obj, keys)` converts only listed keys:** Unlisted numeric-keyed objects stay objects unless they sit inside or contain a converted key. Add any missing keys to `keys`.
- **`NgxDeepPartial<T>` allows explicit `undefined`:** Properties are typed `prop?: X | undefined`, which aligns with `exactOptionalPropertyTypes`. Type helpers that accept partial slices as `NgxDeepPartial<X>` instead of `Partial<X>`.
- **`NgxVestSuite<T>` removes `any`:** `subscribe` returns `() => void`, `dump()` returns `unknown`, and `resume()` accepts `unknown`.

## 8. Key v3 additions and v4 deprecations

**Notable additions in v3:**

- `(submitSettled)` output on `<form ngxVestForm>` for async-safe submit handling (`NgxSubmitSettledEvent<T>`), plus automatic dependent revalidation before submit settles.
- `[focusFirstInvalidOnSubmit]` input (default `true`).
- `FormDirective.resetField(field)` and `FormDirective.removeField(field)` for per-field Vest 6 state management.
- `provideFormContract()` / `provideFormContractFactory()` DI helpers, `NGX_PENDING_LABEL`, and `NGX_EQUALITY_FN` tokens (see [API-TOKENS.md](../API-TOKENS.md)).
- Automatic validator attachment for Angular Signal Forms custom controls (`FormValueControl` / `FormCheckboxControl`) bound with `[ngModel]`.

**Deprecated in v3 (scheduled for removal in v4):**

- `FormDirective.idle$` (use `status` / `pending` signals or `ngForm.form.statusChanges`).
- `FormDirective.createAsyncValidator` (internal library plumbing).
- `ValidateRootFormDirective.createAsyncValidator` (internal library plumbing).

## Known limitations

- **Trigger control recreation under `validationConfig`:** Destroying and recreating a trigger control with `@if` while `validationConfig` stays unchanged is not re-subscribed automatically. See [ADR-0004](../adr/0004-validation-config-trigger-control-recreation-unsupported.md).
- **Rapid trigger edits during cooldown:** Rapid trigger edits inside the 500 ms re-entry guard are deferred and replayed automatically once the cooldown ends (latest value wins). See [ADR-0003](../adr/0003-validation-config-cooldown-can-drop-rapid-input.md).

## Selector codemod

For the full list of removed `sc-` selectors and the automated migration script, see [SELECTOR-PREFIX-MIGRATION.md](../SELECTOR-PREFIX-MIGRATION.md).
