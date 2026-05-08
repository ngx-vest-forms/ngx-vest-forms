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
- `<sc-control-wrapper>` / `[scControlWrapper]` / `[sc-control-wrapper]` → `<ngx-control-wrapper>` / `[ngxControlWrapper]`
- `<sc-form-group-wrapper>` / `[scFormGroupWrapper]` → `<ngx-form-group-wrapper>` / `[ngxFormGroupWrapper]`
- `[ngx-control-wrapper]` → `[ngxControlWrapper]`
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
| `[sc-control-wrapper]` | `[ngxControlWrapper]` |
| `<sc-form-group-wrapper>` | `<ngx-form-group-wrapper>` |
| `[scFormGroupWrapper]` | `[ngxFormGroupWrapper]` |
| `[ngx-control-wrapper]` | `[ngxControlWrapper]` |
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

find . -type f \( -name "*.ts" -o -name "*.html" \) -not -path "*/node_modules/*" -print0 |
  while IFS= read -r -d '' file; do
    perl -0pi -e '
      s{<sc-control-wrapper\b}{<ngx-control-wrapper}g;
      s{</sc-control-wrapper>}{</ngx-control-wrapper>}g;
      s{(?<=\s)sc-control-wrapper(?=[\s=>])}{ngxControlWrapper}g;
      s{\bscControlWrapper\b}{ngxControlWrapper}g;
      s{<sc-form-group-wrapper\b}{<ngx-form-group-wrapper}g;
      s{</sc-form-group-wrapper>}{</ngx-form-group-wrapper>}g;
      s{(?<=\s)sc-form-group-wrapper(?=[\s=>])}{ngxFormGroupWrapper}g;
      s{\bscFormGroupWrapper\b}{ngxFormGroupWrapper}g;
      s{(?<=\s)ngx-control-wrapper(?=[\s=>])}{ngxControlWrapper}g;
      s{\bscVestForm\b}{ngxVestForm}g;
      s{\bvalidateRootFormMode\b}{ngxValidateRootFormMode}g;
      s{\bvalidateRootForm\b}{ngxValidateRootForm}g;
      s{\bformControlState\b}{ngxControlState}g;
      s{\bformErrorDisplay\b}{ngxErrorDisplay}g;
      s{\bformErrorControl\b}{ngxErrorControl}g;
    ' "$file"

    echo "Migrated: $file"
  done
```

## Manual follow-up

After the codemod:

- replace any `SC_ERROR_DISPLAY_MODE_TOKEN` usage with `NGX_ERROR_DISPLAY_MODE_TOKEN`
- update template refs such as `#wrapper="ngxErrorDisplay"` and `#state="ngxControlState"`
- update custom CSS selectors that still target legacy `sc-` host classes or the removed `[ngx-control-wrapper]` attribute selector

See [migration/MIGRATION-v2.x-to-v3.0.0.md](./migration/MIGRATION-v2.x-to-v3.0.0.md) for the full v3 breaking-change checklist.
