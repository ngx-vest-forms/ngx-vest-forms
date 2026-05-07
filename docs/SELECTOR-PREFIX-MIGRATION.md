# Selector Prefix Migration Guide: `sc-` → `ngx-`

## Overview

As of **v3.0.0**, the `sc-` selector family and related legacy aliases were removed from ngx-vest-forms.

**Removed in v3.0.0:**

- `scVestForm` → `ngxVestForm`
- `validateRootForm` → `ngxValidateRootForm`
- `validateRootFormMode` → `ngxValidateRootFormMode`
- `formControlState` → `ngxControlState`
- `formErrorDisplay` → `ngxErrorDisplay`
- `formErrorControl` → `ngxErrorControl`
- `<sc-control-wrapper>` / `[scControlWrapper]` / `[sc-control-wrapper]` → `ngx` equivalents
- `<sc-form-group-wrapper>` / `[scFormGroupWrapper]` → `ngx` equivalents
- `#form="scVestForm"` → `#form="ngxVestForm"`

Use this codemod before upgrading a v2.x app to v3.x.

## Required migration steps

1. Run the codemod script below across your app.
2. Replace any remaining template references and provider tokens manually.
3. Run your test suite and build.

## Replacement map

| Old | New |
| --- | --- |
| `<sc-control-wrapper>` | `<ngx-control-wrapper>` |
| `[scControlWrapper]` | `[ngxControlWrapper]` |
| `[sc-control-wrapper]` | `[ngx-control-wrapper]` |
| `<sc-form-group-wrapper>` | `<ngx-form-group-wrapper>` |
| `[scFormGroupWrapper]` | `[ngxFormGroupWrapper]` |
| `scVestForm` | `ngxVestForm` |
| `validateRootForm` | `ngxValidateRootForm` |
| `validateRootFormMode` | `ngxValidateRootFormMode` |
| `formControlState` | `ngxControlState` |
| `formErrorDisplay` | `ngxErrorDisplay` |
| `formErrorControl` | `ngxErrorControl` |
| `"scVestForm"` | `"ngxVestForm"` |

## Required codemod

```bash
#!/bin/bash
# migrate-selectors.sh

find . -type f \( -name "*.ts" -o -name "*.html" \) -not -path "*/node_modules/*" | while read file; do
  sed -i '' 's/sc-control-wrapper/ngx-control-wrapper/g' "$file"
  sed -i '' 's/scControlWrapper/ngxControlWrapper/g' "$file"
  sed -i '' 's/sc-form-group-wrapper/ngx-form-group-wrapper/g' "$file"
  sed -i '' 's/scFormGroupWrapper/ngxFormGroupWrapper/g' "$file"
  sed -i '' 's/scVestForm/ngxVestForm/g' "$file"
  sed -i '' 's/validateRootFormMode/ngxValidateRootFormMode/g' "$file"
  sed -i '' 's/validateRootForm/ngxValidateRootForm/g' "$file"
  sed -i '' 's/formControlState/ngxControlState/g' "$file"
  sed -i '' 's/formErrorDisplay/ngxErrorDisplay/g' "$file"
  sed -i '' 's/formErrorControl/ngxErrorControl/g' "$file"

  echo "Migrated: $file"
done
```

## Manual follow-up

After the codemod:

- replace any `SC_ERROR_DISPLAY_MODE_TOKEN` usage with `NGX_ERROR_DISPLAY_MODE_TOKEN`
- update template refs such as `#wrapper="ngxErrorDisplay"` and `#state="ngxControlState"`
- update custom CSS selectors that still target legacy `sc-` host classes

See [migration/MIGRATION-v2.x-to-v3.0.0.md](./migration/MIGRATION-v2.x-to-v3.0.0.md) for the full v3 breaking-change checklist.
