# API Tokens Reference

This guide documents the injection tokens provided by ngx-vest-forms for configuring validation and error display behavior.

## Overview

Injection tokens allow you to configure library behavior at different levels of your component tree using Angular's dependency injection system.

## Validation Configuration

### `NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN`

Controls the debounce timing for validation execution across your application or specific component subtrees.

**Type:** `InjectionToken<number>`

**Purpose:** Set the debounce delay (in milliseconds) for validation to reduce excessive validation calls while users type.

#### Usage

**Global Configuration (Application-Level):**

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN } from 'ngx-vest-forms';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    {
      provide: NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN,
      useValue: 300, // 300ms debounce for all forms
    },
  ],
});
```

**Component-Level Configuration:**

```typescript
import { Component, signal } from '@angular/core';
import {
  NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN,
  NgxDeepPartial,
} from 'ngx-vest-forms';

type SearchFormModel = NgxDeepPartial<{
  query: string;
  filters: {
    category: string;
  };
}>;

@Component({
  selector: 'ngx-search-form',
  template: `
    <form
      ngxVestForm
      [suite]="validationSuite"
      (formValueChange)="formValue.set($event)"
    >
      <input
        name="query"
        placeholder="Search..."
        [ngModel]="formValue().query"
      />
      <select name="filters.category" [ngModel]="formValue().filters?.category">
        <option value="">All</option>
        <option value="books">Books</option>
        <option value="electronics">Electronics</option>
      </select>
    </form>
  `,
  providers: [
    {
      provide: NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN,
      useValue: 500, // 500ms debounce only for this search form
    },
  ],
})
export class SearchFormComponent {
  protected readonly formValue = signal<SearchFormModel>({});
  protected readonly validationSuite = searchValidationSuite;
}
```

#### Default Behavior

If `NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN` is not provided:

- Validation executes **immediately** on value changes (no debounce)
- This is suitable for simple forms but may cause performance issues with complex async validations

#### Best Practices

- **Fast Forms (< 10 fields, no async):** 0-100ms or no debounce
- **Medium Forms (10-30 fields, some async):** 150-300ms
- **Complex Forms (> 30 fields, heavy async):** 300-500ms
- **Search/Filter Forms:** 300-500ms for better UX

#### Per-Field Override

You can override debounce at the field level using `validationOptions`:

```typescript
<input
  name="email"
  [ngModel]="formValue().email"
  [validationOptions]="{ debounceTime: 500 }"
/>
```

This field-level configuration takes precedence over the token value.

## Error Display Configuration

### `NGX_ERROR_DISPLAY_MODE_TOKEN`

Controls how validation errors are displayed in the `ngx-control-wrapper` component.

**Type:** `InjectionToken<ScErrorDisplayMode>`

**Purpose:** Configure whether errors should be displayed immediately or only after blur/submit.

#### Error Display Modes

```typescript
type ScErrorDisplayMode =
  | 'on-blur'
  | 'on-submit'
  | 'on-blur-or-submit'
  | 'on-dirty'
  | 'always';
```

- **`on-blur-or-submit`** (default): Show errors after field loses focus OR after form submission
- **`on-blur`**: Show errors only after the field loses focus
- **`on-submit`**: Show errors only after form submission attempt
- **`on-dirty`**: Show errors as soon as value changes (or after blur/submit)
- **`always`**: Show errors immediately, including pristine fields

#### Usage

**Global Configuration:**

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { NGX_ERROR_DISPLAY_MODE_TOKEN } from 'ngx-vest-forms';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    {
      provide: NGX_ERROR_DISPLAY_MODE_TOKEN,
      useValue: 'on-blur', // Show errors only on blur
    },
  ],
});
```

**Component-Level Configuration:**

```typescript
import { Component, signal } from '@angular/core';
import { NGX_ERROR_DISPLAY_MODE_TOKEN, NgxDeepPartial } from 'ngx-vest-forms';

type LoginFormModel = NgxDeepPartial<{
  email: string;
  password: string;
}>;

@Component({
  selector: 'ngx-login-form',
  template: `
    <form
      ngxVestForm
      [suite]="validationSuite"
      (formValueChange)="formValue.set($event)"
    >
      <ngx-control-wrapper>
        <label for="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          [ngModel]="formValue().email"
        />
      </ngx-control-wrapper>

      <ngx-control-wrapper>
        <label for="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          [ngModel]="formValue().password"
        />
      </ngx-control-wrapper>

      <button type="submit">Login</button>
    </form>
  `,
  providers: [
    {
      provide: NGX_ERROR_DISPLAY_MODE_TOKEN,
      useValue: 'on-submit', // Only show errors on submit
    },
  ],
})
export class LoginFormComponent {
  protected readonly formValue = signal<LoginFormModel>({});
  protected readonly validationSuite = loginValidationSuite;
}
```

#### UX Considerations

**Use `on-blur-or-submit` (default) when:**

- You want balanced UX with errors shown on blur or submit
- Standard forms with typical validation needs
- Users benefit from feedback without excessive interruption

**Use `on-blur` when:**

- You want to avoid showing errors until user leaves the field
- Form has many interdependent fields
- Users need to complete a field before seeing validation

**Use `on-submit` when:**

- Form is very complex or has many optional fields
- You want minimal UI disruption during data entry
- Errors are only relevant when user attempts to submit

**Use `on-dirty` when:**

- You want immediate feedback while users type
- You are validating short/simple fields where fast iteration helps

**Use `always` when:**

- You need persistent visibility (e.g. demos, audits, guided flows)
- You intentionally want validation state visible before interaction

#### Accessibility Note

All error display modes maintain WCAG 2.2 Level AA compliance. The `ngx-control-wrapper` component uses `role="status"` with `aria-live="polite"` to announce errors to screen readers regardless of the display mode.

See [Accessibility Guide](./ACCESSIBILITY.md) for more details.

### `NGX_WARNING_DISPLAY_MODE_TOKEN`

Controls how non-blocking warnings are displayed in the `ngx-control-wrapper` component.

**Type:** `InjectionToken<NgxWarningDisplayMode>`

**Purpose:** Configure whether warnings should be displayed only after touch or also after validation runs (e.g., `validationConfig`-triggered).

#### Warning Display Modes

```typescript
type NgxWarningDisplayMode =
  | 'on-touch'
  | 'on-validated-or-touch'
  | 'on-dirty'
  | 'always';
```

- **`on-validated-or-touch`** (default): Show warnings after validation has run or after touch
- **`on-touch`**: Show warnings only after the field loses focus (touched)
- **`on-dirty`**: Show warnings as soon as value changes (or after blur/submit)
- **`always`**: Show warnings immediately, including pristine fields

#### Usage

**Global Configuration:**

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { NGX_WARNING_DISPLAY_MODE_TOKEN } from 'ngx-vest-forms';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    {
      provide: NGX_WARNING_DISPLAY_MODE_TOKEN,
      useValue: 'on-touch', // Only show warnings after touch
    },
  ],
});
```

**Component-Level Configuration:**

```typescript
import { Component, signal } from '@angular/core';
import { NGX_WARNING_DISPLAY_MODE_TOKEN, NgxDeepPartial } from 'ngx-vest-forms';

type SignupModel = NgxDeepPartial<{
  username: string;
}>;

@Component({
  selector: 'ngx-signup-form',
  template: `
    <form
      ngxVestForm
      [formValue]="formValue()"
      (formValueChange)="formValue.set($event)"
    >
      <ngx-control-wrapper>
        <label for="username">Username</label>
        <input id="username" name="username" [ngModel]="formValue().username" />
      </ngx-control-wrapper>
    </form>
  `,
  providers: [
    {
      provide: NGX_WARNING_DISPLAY_MODE_TOKEN,
      useValue: 'on-touch',
    },
  ],
})
export class SignupFormComponent {
  protected readonly formValue = signal<SignupModel>({});
}
```

#### UX Considerations

**Use `on-validated-or-touch` (default) when:**

- Warnings are part of cross-field validation flows
- You want warnings to appear when dependent validation runs

**Use `on-touch` when:**

- You want warnings only after explicit user interaction
- You want to reduce non-blocking feedback before users focus a field

**Use `on-dirty` when:**

- Warnings should appear during active editing
- You want non-blocking guidance quickly without waiting for blur

**Use `always` when:**

- You want persistent advisory guidance visible at all times
- You are running a guided/demo flow where warnings should be explicit

### Legacy Token: `SC_ERROR_DISPLAY_MODE_TOKEN`

**Status:** ⚠️ Deprecated

The `SC_ERROR_DISPLAY_MODE_TOKEN` is an alias for `NGX_ERROR_DISPLAY_MODE_TOKEN` maintained for backward compatibility. It will be removed in v3.0.

```typescript
// ❌ Legacy (works in v2.x but will be removed)
import { SC_ERROR_DISPLAY_MODE_TOKEN } from 'ngx-vest-forms';

// ✅ Recommended
import { NGX_ERROR_DISPLAY_MODE_TOKEN } from 'ngx-vest-forms';
```

## Token Hierarchy

Injection tokens follow Angular's hierarchical dependency injection. More specific providers override more general ones:

```
Application Level (lowest priority)
  ↓
Module Level
  ↓
Component Level (highest priority)
```

### Example: Multi-Level Configuration

```typescript
// app.config.ts - Application-wide defaults
import { NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN } from 'ngx-vest-forms';

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN,
      useValue: 200, // Default 200ms debounce for all forms
    },
  ],
};

// complex-form.ts - Override for specific component
import { Component } from '@angular/core';
import { NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN } from 'ngx-vest-forms';

@Component({
  selector: 'ngx-complex-form',
  providers: [
    {
      provide: NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN,
      useValue: 500, // 500ms debounce for this complex form only
    },
  ],
})
export class ComplexFormComponent {
  // This component uses 500ms debounce, overriding ngx-wide 200ms
}
```

## Complete Configuration Example

```typescript
import { ApplicationConfig } from '@angular/core';
import {
  NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN,
  NGX_ERROR_DISPLAY_MODE_TOKEN,
  NGX_WARNING_DISPLAY_MODE_TOKEN,
} from 'ngx-vest-forms';

export const appConfig: ApplicationConfig = {
  providers: [
    // Debounce validation by 250ms globally
    {
      provide: NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN,
      useValue: 250,
    },
    // Show errors on blur by default
    {
      provide: NGX_ERROR_DISPLAY_MODE_TOKEN,
      useValue: 'on-blur',
    },
    // Show warnings only after touch
    {
      provide: NGX_WARNING_DISPLAY_MODE_TOKEN,
      useValue: 'on-touch',
    },
  ],
};
```

## See Also

- [Validation Options](../projects/ngx-vest-forms/src/lib/directives/validation-options.ts) - Field-level validation configuration
- [Accessibility Guide](./ACCESSIBILITY.md) - Error announcement patterns
- [Complete Example](./COMPLETE-EXAMPLE.md) - Full form implementation with configuration
