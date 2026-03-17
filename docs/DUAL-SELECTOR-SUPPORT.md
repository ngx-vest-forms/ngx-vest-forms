# Dual Selector Support (sc- and ngx- prefixes)

## Overview

ngx-vest-forms currently supports **both** the legacy `sc-` prefix and the newer `ngx-` prefix for components, directives, and legacy token aliases. This allows gradual migration without breaking existing applications.

## Supported Selectors

### Components

#### ControlWrapperComponent

```html
<!-- Legacy (still supported) -->
<sc-control-wrapper>...</sc-control-wrapper>
<div scControlWrapper>...</div>
<div sc-control-wrapper>...</div>

<!-- New (recommended) -->
<ngx-control-wrapper>...</ngx-control-wrapper>
<div ngxControlWrapper>...</div>
<div ngx-control-wrapper>...</div>
```

**CSS Classes:** Both `sc-control-wrapper` and `ngx-control-wrapper` are applied automatically.

### Directives

#### FormDirective (Main form directive)

```html
<!-- Legacy (still supported) -->
<form scVestForm>...</form>

<!-- New (recommended) -->
<form ngxVestForm>...</form>
```

**Template Reference:** Both `#form="scVestForm"` and `#form="ngxVestForm"` work.

#### ValidateRootFormDirective

```html
<!-- Legacy (still supported) -->
<form scVestForm validateRootForm [validateRootFormMode]="'submit'"></form>

<!-- New (recommended) -->
<form
  ngxVestForm
  ngxValidateRootForm
  [ngxValidateRootFormMode]="'submit'"
></form>

<!-- Mixed (also works) -->
<form ngxVestForm validateRootForm [validateRootFormMode]="'submit'"></form>
```

#### FormErrorDisplayDirective

```html
<!-- Legacy (still supported) -->
<div formErrorDisplay>...</div>

<!-- New (recommended) -->
<div ngxErrorDisplay>...</div>
```

**Template Reference:** Both `#display="formErrorDisplay"` and `#display="ngxErrorDisplay"` work.

#### FormControlStateDirective

```html
<!-- Legacy (still supported) -->
<div formControlState>...</div>

<!-- New (recommended) -->
<div ngxControlState>...</div>
```

**Template Reference:** Both `#state="formControlState"` and `#state="ngxControlState"` work.

## Injection Tokens

### Error Display Mode

```typescript
// Legacy (still supported, deprecated)
import { SC_ERROR_DISPLAY_MODE_TOKEN } from 'ngx-vest-forms';

providers: [{ provide: SC_ERROR_DISPLAY_MODE_TOKEN, useValue: 'on-blur' }];

// New (recommended)
import { NGX_ERROR_DISPLAY_MODE_TOKEN } from 'ngx-vest-forms';

providers: [{ provide: NGX_ERROR_DISPLAY_MODE_TOKEN, useValue: 'on-blur' }];
```

**Priority:** If both tokens are provided, `NGX_ERROR_DISPLAY_MODE_TOKEN` takes precedence.

### Warning Display Mode

```typescript
import { NGX_WARNING_DISPLAY_MODE_TOKEN } from 'ngx-vest-forms';

providers: [{ provide: NGX_WARNING_DISPLAY_MODE_TOKEN, useValue: 'on-touch' }];
```

### Validation Config Debounce

```typescript
// Already uses ngx prefix
import {
  NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN,
  NGX_VALIDATION_DEBOUNCE_PRESETS,
} from 'ngx-vest-forms';

providers: [
  {
    provide: NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN,
    useValue: NGX_VALIDATION_DEBOUNCE_PRESETS.relaxed,
  },
];
```

## Migration Strategy

### Recommended Approach (Gradual)

1. **Start with imports** - Update TypeScript imports to use `ngx-` prefixed tokens and helpers where available
2. **Update templates gradually** - Change selectors on a per-component basis
3. **Update tokens** - Switch to `NGX_*` tokens in providers
4. **Remove deprecated usage** - Before the future major version that removes `sc-` compatibility

### Example Migration

**Before (v1.x):**

```typescript
import { NgxVestForms, SC_ERROR_DISPLAY_MODE_TOKEN } from 'ngx-vest-forms';

@Component({
  template: `
    <form scVestForm [formValue]="formValue()" [suite]="suite">
      <sc-control-wrapper>
        <input name="email" [ngModel]="formValue().email" />
      </sc-control-wrapper>
    </form>
  `,
  providers: [
    { provide: SC_ERROR_DISPLAY_MODE_TOKEN, useValue: 'on-submit' }
  ]
})
```

**After (v2.x):**

```typescript
import { NgxVestForms, NGX_ERROR_DISPLAY_MODE_TOKEN } from 'ngx-vest-forms';

@Component({
  template: `
    <form ngxVestForm [formValue]="formValue()" [suite]="suite">
      <ngx-control-wrapper>
        <input name="email" [ngModel]="formValue().email" />
      </ngx-control-wrapper>
    </form>
  `,
  providers: [
    { provide: NGX_ERROR_DISPLAY_MODE_TOKEN, useValue: 'on-submit' }
  ]
})
```

## Deprecation Timeline

- **Current major version**: Both `sc-` and `ngx-` prefixes are supported
- **Current guidance**: Prefer `ngx-` in all new code and migrations
- **Future major version**: `sc-` compatibility is expected to be removed

## Benefits of ngx- Prefix

1. **Namespace clarity** - `ngx-` clearly indicates Angular library
2. **Consistency** - Aligns with Angular community conventions
3. **Avoid conflicts** - Reduces risk of selector collisions
4. **Modern standards** - Follows current Angular ecosystem practices

## Technical Implementation

All selectors use Angular's multi-selector support:

```typescript
@Directive({
  selector: 'form[scVestForm], form[ngxVestForm]',
  exportAs: 'scVestForm, ngxVestForm'
})
```

This means:

- ✅ Same component/directive instance
- ✅ No code duplication
- ✅ Zero performance impact
- ✅ Same behavior regardless of which selector is used

## Testing

All existing tests continue to pass with `sc-` selectors. New tests should use `ngx-` selectors to validate dual support and prepare for eventual migration.

## Questions?

See the main README.md or open an issue on GitHub.
