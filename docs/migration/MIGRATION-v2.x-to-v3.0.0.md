# Migration Guide: v2.x to v3.0.0

## v3 deprecation removals

v3.0.0 deletes every `@deprecated` runtime helper, const alias, and type alias that v2.x kept around for backward compatibility. Consumers who migrated to the recommended `Ngx`-prefixed names need no changes; consumers still on the deprecated forms get a compile error pointing at the replacement.

| Removed                          | Replacement                       | Migration tip                                                                          |
| -------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------- |
| `cloneDeep(value)`               | `structuredClone(value)`          | Native browser/Node API; no import needed.                                             |
| `set(obj, path, value)`          | `setValueAtPath(obj, path, value)`| Already exported from `ngx-vest-forms`; identical signature.                            |
| `vestForms` (const array)        | `NgxVestForms`                    | `import { NgxVestForms } from 'ngx-vest-forms';` — same array, renamed.                |
| `ROOT_FORM_CONSTANT`             | `ROOT_FORM`                       | Single canonical export from `ngx-vest-forms`.                                         |
| `DeepPartial<T>`                 | `NgxDeepPartial<T>`               | Structurally identical; rename the import.                                             |
| `DeepRequired<T>`                | `NgxDeepRequired<T>`              | Structurally identical; rename the import.                                             |
| `FormCompatibleDeepRequired<T>`  | `NgxFormCompatibleDeepRequired<T>`| Structurally identical; rename the import.                                             |
| `NgxTypedVestSuite<T>`           | `NgxVestSuite<T>`                 | Structurally identical; rename the type reference.                                     |
| `SC_ERROR_DISPLAY_MODE_DEFAULT` (re-export) | `NGX_ERROR_DISPLAY_MODE_DEFAULT` | Was an internal re-export; if you imported it, switch to the `NGX_*` name. |

If you only used the recommended `Ngx*` / `NGX_*` names (or the canonical `setValueAtPath` / `structuredClone`), v3 is a no-op for this category.

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
