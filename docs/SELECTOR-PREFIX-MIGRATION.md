# Selector prefix migration: `sc-` to `ngx-`

v3.0.0 removes the legacy `sc-` selector family, unprefixed directive aliases, `[ngxModel]`/`[ngxModelGroup]` aliases, `SC_ERROR_DISPLAY_MODE_TOKEN`, and `ScErrorDisplayMode`.

Run the codemod below before upgrading a v2.x application to v3.x.

## Replacement map

| Removed (v2.x) | Replacement (v3.x) |
| --- | --- |
| `<sc-control-wrapper>` | `<ngx-control-wrapper>` |
| `[scControlWrapper]`, `[sc-control-wrapper]`, `[ngx-control-wrapper]` | `[ngxControlWrapper]` |
| `<sc-form-group-wrapper>` | `<ngx-form-group-wrapper>` |
| `[scFormGroupWrapper]` | `[ngxFormGroupWrapper]` |
| `scVestForm`, `#form="scVestForm"` | `ngxVestForm`, `#form="ngxVestForm"` |
| `validateRootForm` | `ngxValidateRootForm` |
| `validateRootFormMode` | `ngxValidateRootFormMode` |
| `formControlState`, `#s="formControlState"` | `ngxControlState`, `#s="ngxControlState"` |
| `formErrorDisplay`, `#d="formErrorDisplay"` | `ngxErrorDisplay`, `#d="ngxErrorDisplay"` |
| `formErrorControl`, `#ec="formErrorControl"` | `ngxErrorControl`, `#ec="ngxErrorControl"` |
| `[ngxModel]`, `[ngxModelGroup]` | Remove attribute (keep Angular's `ngModel` / `ngModelGroup`) |
| `SC_ERROR_DISPLAY_MODE_TOKEN` | `NGX_ERROR_DISPLAY_MODE_TOKEN` |
| `ScErrorDisplayMode` | `NgxErrorDisplayMode` |

## Codemod script

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
      s{\bSC_ERROR_DISPLAY_MODE_TOKEN\b}{NGX_ERROR_DISPLAY_MODE_TOKEN}g;
      s{\bScErrorDisplayMode\b}{NgxErrorDisplayMode}g;
    ' "$file"

    echo "Migrated: $file"
  done
```

## Manual follow-up

1. Remove any stray `ngxModel` or `ngxModelGroup` attributes alongside `ngModel` / `ngModelGroup`.
2. Update custom CSS selectors targeting removed `sc-` host classes or `[ngx-control-wrapper]`.
3. Rebuild and run your test suite.

See [MIGRATION-v2.x-to-v3.0.0.md](./migration/MIGRATION-v2.x-to-v3.0.0.md) for the complete v3 upgrade checklist.
