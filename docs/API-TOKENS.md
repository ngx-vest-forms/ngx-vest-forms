# API tokens reference

Injection tokens provided by `ngx-vest-forms` for configuring validation timing, form contracts, display modes, wrapper text, and equality checks at the application, route, or component level.

## Quick reference

| Token | Type | Default | Scope |
| --- | --- | --- | --- |
| `NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN` | `number` | `100` (`NGX_VALIDATION_CONFIG_DEBOUNCE_DEFAULT`) | Dependent revalidation triggered by `[validationConfig]` |
| `NGX_FORM_CONTRACT` | `NgxFormContractSource<unknown>` | none (optional) | Dev-mode structural contract fallback when `[formContract]` is omitted |
| `NGX_ERROR_DISPLAY_MODE_TOKEN` | `NgxErrorDisplayMode` | `'on-blur-or-submit'` | Default `errorDisplayMode` for wrappers and `FormErrorDisplayDirective` |
| `NGX_WARNING_DISPLAY_MODE_TOKEN` | `NgxWarningDisplayMode` | `'on-validated-or-touch'` | Default `warningDisplayMode` for wrappers and `FormErrorDisplayDirective` |
| `NGX_PENDING_LABEL` | `string \| Signal<string>` | `'Validating…'` | Pending indicator text in built-in wrappers and `FormErrorControlDirective` |
| `NGX_EQUALITY_FN` | `(a: unknown, b: unknown) => boolean` | `fastDeepEqual` | Deep equality comparator inside `FormDirective` |

Angular's hierarchical dependency injection applies to every token: component providers override route providers, which override application providers.

---

## `NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN`

Sets the debounce delay (in milliseconds) between a trigger field changing and its `[validationConfig]` dependents revalidating inside `FormDirective`.

This token affects only `[validationConfig]`-driven dependent revalidation. It does **not** debounce direct field, group, or root-form validation. For per-control typing debounce, bind `[validationOptions]="{ debounceTime: 300 }"` on the control's `ngModel` (or `ngModelGroup` / `ngxValidateRootForm`).

### Default and presets

Default: `NGX_VALIDATION_CONFIG_DEBOUNCE_DEFAULT` (`100` ms). Named presets are exported on `NGX_VALIDATION_DEBOUNCE_PRESETS`:

| Preset | Value (ms) | Typical use |
| --- | --- | --- |
| `immediate` | `0` | Unit tests, instant dependent feedback |
| `fast` / `default` | `100` | Password/confirm pairs |
| `relaxed` | `150` | Chains with several dependents |
| `typing` | `300` | Text inputs with slower dependents |
| `async` | `500` | Dependents backed by async validators |

### Usage

```ts
import { ApplicationConfig } from '@angular/core';
import {
  NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN,
  NGX_VALIDATION_DEBOUNCE_PRESETS,
} from 'ngx-vest-forms';

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN,
      useValue: NGX_VALIDATION_DEBOUNCE_PRESETS.relaxed,
    },
  ],
};
```

Per-control direct validation debounce (independent of the token above):

```html
<input
  name="email"
  [ngModel]="formValue().email"
  [validationOptions]="{ debounceTime: 500 }"
/>
```

---

## `NGX_FORM_CONTRACT`

Provides a structural form contract (`StandardSchemaV1<T>` or `NgxDeepRequired<T>`) to `FormDirective` through Angular DI. Contract checks run only in development mode (`isDevMode()`), log warnings without affecting runtime validity, and consume synchronous schema results only.

Use the helper functions instead of constructing raw provider objects:

- `provideFormContract(contract)` for a constant contract or a `Signal<NgxFormContract<T> | null>`.
- `provideFormContractFactory(() => ...)` when the contract depends on injected services or must be created lazily (runs once per injector when first resolved).
- `[formContract]` input on `<form ngxVestForm>` when the contract varies per usage site.

### Precedence

1. Explicit `[formContract]` input wins over `NGX_FORM_CONTRACT`.
2. Binding `[formContract]="null"` disables the injected fallback.
3. Omitting `[formContract]` falls back to `NGX_FORM_CONTRACT`.

### Static provider

```ts
import { Component, signal } from '@angular/core';
import {
  NgxVestForms,
  provideFormContract,
  type NgxDeepPartial,
  type NgxDeepRequired,
} from 'ngx-vest-forms';

type ProfileFormModel = NgxDeepPartial<{
  email: string;
  profile: { firstName: string };
}>;

const profileContract: NgxDeepRequired<ProfileFormModel> = {
  email: '',
  profile: { firstName: '' },
};

@Component({
  selector: 'app-profile-form',
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
      <div ngModelGroup="profile">
        <input name="firstName" [ngModel]="formValue().profile?.firstName" />
      </div>
    </form>
  `,
})
export class ProfileFormComponent {
  protected readonly formValue = signal<ProfileFormModel>({});
  protected readonly suite = profileValidationSuite;
}
```

### Factory provider

```ts
providers: [
  provideFormContractFactory(
    () => inject(CheckoutSchemaService).contract
  ),
]
```

### `toFormContract()`

`provideFormContract()` and `[formContract]` accept raw `NgxDeepRequired<T>` shapes directly and wrap them internally. Call `toFormContract(shape)` yourself only when you need an explicit `StandardSchemaV1<NgxDeepPartial<T>>` value to pass to other code.

---

## `NGX_ERROR_DISPLAY_MODE_TOKEN`

Sets the default `errorDisplayMode` for `<ngx-control-wrapper>`, `<ngx-form-group-wrapper>`, and `FormErrorDisplayDirective`.

```ts
type NgxErrorDisplayMode =
  | 'on-blur-or-submit'
  | 'on-blur'
  | 'on-submit'
  | 'on-dirty'
  | 'always';
```

| Mode | Behavior |
| --- | --- |
| `'on-blur-or-submit'` (default) | Show after the control is touched or the form is submitted. |
| `'on-blur'` | Show after the control is touched or the form is submitted (behaves identically to `'on-blur-or-submit'`; prefer `'on-blur-or-submit'` in new code). |
| `'on-submit'` | Show only after a form submission attempt. |
| `'on-dirty'` | Show as soon as the value changes, or after touch/submit. |
| `'always'` | Show immediately, including on pristine fields (except when the control uses `updateOn: 'submit'`, which still waits for a form submission attempt). |

```ts
import { NGX_ERROR_DISPLAY_MODE_TOKEN } from 'ngx-vest-forms';

providers: [
  { provide: NGX_ERROR_DISPLAY_MODE_TOKEN, useValue: 'on-submit' },
]
```

The legacy `SC_ERROR_DISPLAY_MODE_TOKEN` was removed in v3.0.0.

---

## `NGX_WARNING_DISPLAY_MODE_TOKEN`

Sets the default `warningDisplayMode` for `<ngx-control-wrapper>`, `<ngx-form-group-wrapper>`, and `FormErrorDisplayDirective`.

```ts
type NgxWarningDisplayMode =
  | 'on-validated-or-touch'
  | 'on-touch'
  | 'on-dirty'
  | 'always';
```

| Mode | Behavior |
| --- | --- |
| `'on-validated-or-touch'` (default) | Show after validation completes (including `validationConfig` triggers), touch, or submit. |
| `'on-touch'` | Show after touch or form submission. |
| `'on-dirty'` | Show as soon as the value changes, or after touch/submit. |
| `'always'` | Show immediately, including on pristine fields. |

```ts
import { NGX_WARNING_DISPLAY_MODE_TOKEN } from 'ngx-vest-forms';

providers: [
  { provide: NGX_WARNING_DISPLAY_MODE_TOKEN, useValue: 'on-touch' },
]
```

---

## `NGX_PENDING_LABEL`

Sets the pending text shown by `<ngx-control-wrapper>` and `<ngx-form-group-wrapper>` while async validation runs. Custom wrappers built on `FormErrorControlDirective` read the same value through `pendingLabel()`.

- **Type:** `InjectionToken<NgxPendingLabel>` (`string | Signal<string>`)
- **Default:** `'Validating…'`

Provide a static string for `$localize` or a `Signal<string>` for runtime language switches:

```ts
import { computed, inject } from '@angular/core';
import { NGX_PENDING_LABEL } from 'ngx-vest-forms';

// Static translation
providers: [
  { provide: NGX_PENDING_LABEL, useValue: $localize`Validating…` },
]

// Reactive runtime language switch
providers: [
  {
    provide: NGX_PENDING_LABEL,
    useFactory: () => {
      const i18n = inject(TranslationService);
      return computed(() => i18n.translate('form.validating'));
    },
  },
]
```

Provide it on a specific component to customize one form (for example `'Checking availability…'` in `/async-username`).

---

## `NGX_EQUALITY_FN`

Overrides the deep-equality comparator that `FormDirective` uses for `formValueChange` deduplication, form-to-model sync, and `formState()` memoization.

- **Type:** `InjectionToken<NgxEqualityFn>` (`(a: unknown, b: unknown) => boolean`)
- **Default:** `fastDeepEqual` (handles `Object.is` primitives, plain objects, arrays, cycles, `Date`, and `RegExp`; compares `Map`, `Set`, and functions by reference)

Override this token only when you have a measured reason (such as swapping in `dequal/lite` for bundle size, ignoring domain-specific keys, or instrumenting emissions in tests):

```ts
import { dequal } from 'dequal/lite';
import { NGX_EQUALITY_FN } from 'ngx-vest-forms';

providers: [
  { provide: NGX_EQUALITY_FN, useValue: dequal },
]
```

---

## Combined application config example

```ts
import { ApplicationConfig } from '@angular/core';
import {
  NGX_ERROR_DISPLAY_MODE_TOKEN,
  NGX_PENDING_LABEL,
  NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN,
  NGX_VALIDATION_DEBOUNCE_PRESETS,
  NGX_WARNING_DISPLAY_MODE_TOKEN,
} from 'ngx-vest-forms';

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN,
      useValue: NGX_VALIDATION_DEBOUNCE_PRESETS.relaxed,
    },
    {
      provide: NGX_ERROR_DISPLAY_MODE_TOKEN,
      useValue: 'on-blur-or-submit',
    },
    {
      provide: NGX_WARNING_DISPLAY_MODE_TOKEN,
      useValue: 'on-touch',
    },
    {
      provide: NGX_PENDING_LABEL,
      useValue: 'Checking…',
    },
  ],
};
```

## Related guides

- [Accessibility](./ACCESSIBILITY.md)
- [Custom control wrappers](./CUSTOM-CONTROL-WRAPPERS.md)
- [Complete example](./COMPLETE-EXAMPLE.md)
