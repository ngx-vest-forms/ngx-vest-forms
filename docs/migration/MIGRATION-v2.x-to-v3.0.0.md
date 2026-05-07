# Migration Guide: v2.x to v3.0.0

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
2. Replace any remaining `SC_ERROR_DISPLAY_MODE_TOKEN` providers with `NGX_ERROR_DISPLAY_MODE_TOKEN`.
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
