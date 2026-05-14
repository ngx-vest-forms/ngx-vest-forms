# Migration Guide: v2.x to v3.0.0

## v3 deprecation removals

v3.0.0 deletes every `@deprecated` runtime helper, const alias, and type alias that v2.x kept around for backward compatibility. Consumers who migrated to the recommended `Ngx`-prefixed names need no changes; consumers still on the deprecated forms get a compile error pointing at the replacement.

| Removed                                     | Replacement                        | Migration tip                                                            |
| ------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------ |
| `cloneDeep(value)`                          | `structuredClone(value)`           | Native browser/Node API; no import needed.                               |
| `set(obj, path, value)`                     | `setValueAtPath(obj, path, value)` | Already exported from `ngx-vest-forms`; identical signature.             |
| `vestForms` (const array)                   | `NgxVestForms`                     | `import { NgxVestForms } from 'ngx-vest-forms';` — same array, renamed.  |
| `ROOT_FORM_CONSTANT`                        | `ROOT_FORM`                        | Single canonical export from `ngx-vest-forms`.                           |
| `DeepPartial<T>`                            | `NgxDeepPartial<T>`                | Structurally identical; rename the import.                               |
| `DeepRequired<T>`                           | `NgxDeepRequired<T>`               | Structurally identical; rename the import.                               |
| `FormCompatibleDeepRequired<T>`             | `NgxFormCompatibleDeepRequired<T>` | Structurally identical; rename the import.                               |
| `NgxTypedVestSuite<T>`                      | `NgxVestSuite<T>`                  | Structurally identical; rename the type reference.                       |
| `SC_ERROR_DISPLAY_MODE_DEFAULT` (re-export) | `NGX_ERROR_DISPLAY_MODE_DEFAULT`   | Was an internal re-export; if you imported it, switch to the `NGX_*` name. |

If you only used the recommended `Ngx*` / `NGX_*` names (or the canonical `setValueAtPath` / `structuredClone`), v3 is a no-op for this category.

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
    swapiService.userIdExists(model.userId!).pipe(
      takeUntil(fromEvent(signal, 'abort'))
    )
  );

  enforce(exists).isFalsy();
});
```

Migration takeaway: stop teaching “ignore late async results” as the primary pattern. Prefer passing the signal into the underlying request so the stale work is cancelled, not merely discarded.

### Prefer `memo()` for expensive deterministic blocks

Vest 6.3 exposes top-level `memo()` from `vest/memo`. Use it to wrap expensive validation blocks whose result should be reused until a dependency changes. The runnable purchase-form example in this repo uses this pattern; see `projects/examples/src/app/pages/purchase-form/purchase.validations.ts`.

If you are migrating older code, the Vest 5 `test.memo(...)` form is removed — move the test body into `memo(() => { test(...) }, deps)`.

```typescript
import { create, skipWhen, test } from 'vest';
import { memo } from 'vest/memo';

export const profileSuite = create((model: ProfileModel) => {
  test('userId', 'User ID is required', () => {
    enforce(model.userId).isNotBlank();
  });

  skipWhen((res) => res.hasErrors('userId'), () => {
    memo(() => {
      test('userId', 'User ID is already taken', async ({ signal }) => {
        const response = await fetch(`/api/users/${model.userId}`, { signal });
        const { exists } = await response.json();
        enforce(exists).isFalsy();
      });
    }, [model.userId]);
  });
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

**Warnings-only fields**: In v2, a field with only warnings produced `all['field'] === []` — an empty array carrying a non-enumerable `warnings` property. In v3 that field is absent from `all.errors` entirely (`all.errors['field'] === undefined`). If you iterate `Object.keys(all.errors)` to find "fields with messages", warnings-only fields will not appear; iterate `Object.keys(all.warnings)` separately to include them.

The `errorsChange` output on `FormDirective` still emits `Record<string, string[]>` (the `errors` slice of the new shape), so templates consuming `(errorsChange)="errors.set($event)"` and reading `errors()['field']` continue to work unchanged. For warnings inside templates, prefer the existing `fieldWarnings()` signal on the directive — it is per-field, reactive, and the recommended path for warning display.

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
