# API Tokens Reference

This guide documents the injection tokens provided by ngx-vest-forms for configuring validation and error display behavior.

## Overview

Injection tokens allow you to configure library behavior at different levels of your component tree using Angular's dependency injection system.

## Validation Configuration

### `NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN`

Controls the debounce timing for **`validationConfig`-triggered dependent-field revalidation** inside `FormDirective`.

**Type:** `InjectionToken<number>`

**Purpose:** Set the debounce delay (in milliseconds) between a trigger field changing and its `validationConfig` dependents being revalidated. This is **not** an app-wide typing debounce: it does not change the debounce used for direct field, group, or root-form validation. For per-control validation debounce, use `validationOptions` (see below).

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
      useValue: 300, // 300ms between a trigger change and dependent revalidation
    },
  ],
});
```

**Component-Level Configuration:**

```typescript
import { Component, signal } from '@angular/core';
import {
  createValidationConfig,
  NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN,
  NgxDeepPartial,
} from 'ngx-vest-forms';

type SignupFormModel = NgxDeepPartial<{
  password: string;
  confirmPassword: string;
}>;

@Component({
  selector: 'ngx-signup-form',
  template: `
    <form
      ngxVestForm
      [suite]="validationSuite"
      [validationConfig]="validationConfig"
      (formValueChange)="formValue.set($event)"
    >
      <input name="password" type="password" [ngModel]="formValue().password" />
      <input
        name="confirmPassword"
        type="password"
        [ngModel]="formValue().confirmPassword"
      />
    </form>
  `,
  providers: [
    {
      provide: NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN,
      // Wait 500ms after password edits before revalidating confirmPassword
      useValue: 500,
    },
  ],
})
export class SignupFormComponent {
  protected readonly formValue = signal<SignupFormModel>({});
  protected readonly validationSuite = signupValidationSuite;
  protected readonly validationConfig =
    createValidationConfig<SignupFormModel>()
      .bidirectional('password', 'confirmPassword')
      .build();
}
```

The token only has an effect on forms that use `[validationConfig]`. Direct validation of the field the user is typing in is unaffected.

#### Default Behavior

If `NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN` is not provided, dependent-field revalidation is debounced by **100ms** (`NGX_VALIDATION_DEBOUNCE_PRESETS.default`). You can also provide one of the named presets — `immediate` (0), `fast` (100), `default` (100), `relaxed` (150), `typing` (300), `async` (500) — instead of a raw number.

#### Best Practices

- **Tight feedback loops (e.g. password/confirm):** 0-100ms (`immediate`/`fast`)
- **Chains with several dependents per trigger:** 150-300ms (`relaxed`/`typing`)
- **Dependents that run async validations:** 300-500ms (`typing`/`async`)
- **Tests:** `NGX_VALIDATION_DEBOUNCE_PRESETS.immediate` to avoid timer waits

#### Per-Control Validation Debounce (`validationOptions`)

To debounce a control's **own** validation while the user types, use `validationOptions` on the control:

```typescript
<input
  name="email"
  [ngModel]="formValue().email"
  [validationOptions]="{ debounceTime: 500 }"
/>
```

These are two independent pipelines — neither overrides the other. `validationOptions.debounceTime` debounces the control's direct validation; `NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN` debounces the `validationConfig`-driven revalidation of dependent fields.

## Form Contract Configuration

### `NGX_FORM_CONTRACT`

Provides a structural contract to `FormDirective` through Angular DI.

**Type:** `InjectionToken<NgxFormContractSource<unknown>>`

**Purpose:** Register a fixed form contract once at the component or subtree level so forms can omit `[formContract]` when the contract does not vary per usage site.

#### When to Use It

- **Prefer `provideFormContract(...)`** when a component always uses the same contract
- **Prefer `provideFormContractFactory(...)`** when the contract depends on injected services or should be created lazily
- **Use `[formContract]`** only when the contract genuinely varies per template usage

#### Static Provider

```typescript
import { Component, signal } from '@angular/core';
import {
  NgxDeepPartial,
  NgxDeepRequired,
  NgxVestForms,
  provideFormContract,
} from 'ngx-vest-forms';

type ProfileFormModel = NgxDeepPartial<{
  email: string;
  profile: {
    firstName: string;
  };
}>;

const profileContract: NgxDeepRequired<ProfileFormModel> = {
  email: '',
  profile: {
    firstName: '',
  },
};

@Component({
  selector: 'ngx-profile-form',
  imports: [NgxVestForms],
  providers: [provideFormContract(profileContract)],
  template: `
    <form
      ngxVestForm
      [suite]="suite"
      [formValue]="formValue()"
      (formValueChange)="formValue.set($event)"
    >
      <input name="email" [ngModel]="formValue().email" />
      <input
        name="profile.firstName"
        [ngModel]="formValue().profile?.firstName"
      />
    </form>
  `,
})
export class ProfileFormComponent {
  protected readonly formValue = signal<ProfileFormModel>({});
  protected readonly suite = profileValidationSuite;
}
```

#### Factory Provider

```typescript
import { Component, inject, signal } from '@angular/core';
import {
  NgxVestForms,
  provideFormContractFactory,
  type StandardSchemaV1,
} from 'ngx-vest-forms';

type CheckoutFormModel = {
  billingAddress?: {
    postcode?: string;
  };
};

declare class CheckoutSchemaService {
  readonly contract: StandardSchemaV1<CheckoutFormModel>;
}

@Component({
  selector: 'ngx-checkout-form',
  imports: [NgxVestForms],
  providers: [
    provideFormContractFactory(
      () =>
        inject(CheckoutSchemaService)
          .contract as StandardSchemaV1<CheckoutFormModel>
    ),
  ],
  template: `
    <form
      ngxVestForm
      [suite]="suite"
      [formValue]="formValue()"
      (formValueChange)="formValue.set($event)"
    >
      <!-- fields -->
    </form>
  `,
})
export class CheckoutFormComponent {
  protected readonly formValue = signal<CheckoutFormModel>({});
  protected readonly suite = checkoutValidationSuite;
}
```

#### Interaction with `[formContract]`

- If `[formContract]` is omitted, the directive falls back to `NGX_FORM_CONTRACT`
- If `[formContract]` is bound, the explicit input wins over the provider
- If `[formContract]="null"`, the explicit `null` disables the injected fallback

#### Development Behavior

The provider path has the same behavior as `[formContract]`:

- runs structural checks only in development mode
- logs schema/shape mismatch warnings without affecting form validity
- supports either a `StandardSchemaV1<T>` contract or a legacy `NgxDeepRequired<T>` shape

## Error Display Configuration

### `NGX_ERROR_DISPLAY_MODE_TOKEN`

Controls how validation errors are displayed in the `ngx-control-wrapper` component.

**Type:** `InjectionToken<NgxErrorDisplayMode>`

**Purpose:** Configure whether errors should be displayed immediately or only after blur/submit.

#### Error Display Modes

```typescript
type NgxErrorDisplayMode =
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

### Error display mode token

Use `NGX_ERROR_DISPLAY_MODE_TOKEN` to configure the default error display mode. The legacy `SC_ERROR_DISPLAY_MODE_TOKEN` was removed in v3.0.0.

```typescript
import { NGX_ERROR_DISPLAY_MODE_TOKEN } from 'ngx-vest-forms';
```

## Equality Configuration

### `NGX_EQUALITY_FN`

Customizes the deep-equality function the library uses internally for change detection.

**Type:** `InjectionToken<NgxEqualityFn>` where `NgxEqualityFn = (a: unknown, b: unknown) => boolean`

**Purpose:** Swap the comparator that `FormDirective` uses for `formValueChange` `distinctUntilChanged`, the form↔model two-way sync effect, and the `formState` signal's structural equality. Defaults to the library's built-in `fastDeepEqual`.

#### When to override

- **Bundle size**: drop in a smaller library like `dequal/lite` (~300 B) if you don't need the cycle handling, function reference-equality, and `Object.is` semantics that `fastDeepEqual` provides.
- **Tests**: stub with reference equality (`(a, b) => a === b`) to assert how often the directive emits.
- **Domain rules**: project requires custom equality (e.g., ignore certain keys, treat unrelated objects as equal).

This is purely additive — if you don't provide the token, behavior is unchanged.

#### Usage

**Global Configuration:**

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { NGX_EQUALITY_FN } from 'ngx-vest-forms';
import { dequal } from 'dequal/lite';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    {
      provide: NGX_EQUALITY_FN,
      useValue: dequal,
    },
  ],
});
```

**Component-Level Configuration (e.g. for tests):**

```typescript
import { Component } from '@angular/core';
import { NGX_EQUALITY_FN } from 'ngx-vest-forms';

@Component({
  selector: 'ngx-test-form',
  template: `<!-- ... -->`,
  providers: [
    {
      provide: NGX_EQUALITY_FN,
      // Strict reference equality — every distinct object emits.
      useValue: (a: unknown, b: unknown) => a === b,
    },
  ],
})
export class TestFormComponent {}
```

#### Default behavior

The default factory returns `fastDeepEqual`, which:

- Compares primitives with `Object.is` semantics (`NaN === NaN`, `0 ≠ -0`)
- Walks plain objects and arrays structurally
- Compares `Date` by timestamp and `RegExp` by `source` + `flags`
- Treats `Map`, `Set`, and functions as reference-only
- Handles cyclic graphs by tracking visited object pairs

Most applications never need to override this token. Reach for the override when you have a measured reason — bundle constraint, behavioral mismatch, or test instrumentation.

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
      useValue: 200, // Default 200ms dependent-revalidation debounce for all forms
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
      useValue: 500, // 500ms dependent-revalidation debounce for this form only
    },
  ],
})
export class ComplexFormComponent {
  // This component's validationConfig dependents revalidate after 500ms,
  // overriding the app-wide 200ms
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
    // Debounce validationConfig dependent revalidation by 250ms globally
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

- `ValidationOptions` (import from `ngx-vest-forms`) - Field-level validation configuration
- [Accessibility Guide](./ACCESSIBILITY.md) - Error announcement patterns
- [Complete Example](./COMPLETE-EXAMPLE.md) - Full form implementation with configuration
