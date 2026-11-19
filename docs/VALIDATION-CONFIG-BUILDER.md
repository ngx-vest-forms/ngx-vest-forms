# ValidationConfig builder

`createValidationConfig<T>()` builds a compile-time checked `ValidationConfigMap<T>` for `<form ngxVestForm [validationConfig]="...">`.

Use `validationConfig` whenever a Vest 6 test for one field depends on another field's value (especially inside `omitWhen`, `skipWhen`, or cross-field comparisons). Angular only revalidates the field the user edits; `validationConfig` tells `FormDirective` which dependent fields to revalidate as well.

## Quick start

```ts
import { Component, signal } from '@angular/core';
import {
  createValidationConfig,
  NgxVestForms,
  type NgxDeepPartial,
} from 'ngx-vest-forms';

type SignupFormModel = NgxDeepPartial<{
  email: string;
  password: string;
  confirmPassword: string;
  country: string;
  state: string;
}>;

@Component({
  selector: 'app-signup-form',
  imports: [NgxVestForms],
  template: `
    <form
      ngxVestForm
      [suite]="suite"
      [validationConfig]="validationConfig"
      [formValue]="formValue()"
      (formValueChange)="formValue.set($event)"
    >
      <!-- controls -->
    </form>
  `,
})
export class SignupFormComponent {
  protected readonly formValue = signal<SignupFormModel>({});
  protected readonly suite = signupSuite;

  protected readonly validationConfig = createValidationConfig<SignupFormModel>()
    .bidirectional('password', 'confirmPassword')
    .whenChanged('country', 'state')
    .build();
}
```

Passing `<SignupFormModel>` gives you IDE autocomplete and compile-time checks for dotted field paths (including nested paths such as `'addresses.billing.country'`). Since v3, `[validationConfig]` rejects untyped `Record<string, string[]>` maps so path typos fail at compile time.

## API reference

### `whenChanged(trigger, revalidate)`

Adds a one-way dependency: when `trigger` changes, revalidate one or more dependent fields.

```ts
whenChanged(
  trigger: FieldPath<T>,
  revalidate: FieldPath<T> | ReadonlyArray<FieldPath<T>>
): this
```

```ts
createValidationConfig<FormModel>()
  .whenChanged('country', ['state', 'zipCode'])
  .whenChanged('addresses.billing.country', 'addresses.billing.state')
  .build();
```

Multiple `whenChanged` calls for the same trigger accumulate dependents and deduplicate automatically (logging a dev-mode warning if you add the exact same dependency twice).

### `bidirectional(field1, field2)`

Adds a two-way dependency: changing either field revalidates the other.

```ts
bidirectional(field1: FieldPath<T>, field2: FieldPath<T>): this
```

```ts
createValidationConfig<FormModel>()
  .bidirectional('password', 'confirmPassword')
  .bidirectional('startDate', 'endDate')
  .build();
```

### `group(fields)`

Connects every field in the list to every other field in the list.

```ts
group(fields: ReadonlyArray<FieldPath<T>>): this
```

```ts
createValidationConfig<FormModel>()
  .group(['email', 'phone', 'alternateEmail'])
  .build();
```

A group of N fields creates N × (N - 1) entries (for example, 10 fields create 90 dependencies). Prefer targeted `whenChanged()` calls for large sets of fields.

### `merge(other)`

Merges an existing `ValidationConfigMap<T>` into the builder and deduplicates entries. Useful for composing reusable helper configs or conditional rules.

```ts
merge(other: ValidationConfigMap<T>): this
```

```ts
function createAddressConfig() {
  return createValidationConfig<OrderFormModel>()
    .whenChanged('billing.country', ['billing.state', 'billing.zipCode'])
    .build();
}

protected readonly validationConfig = createValidationConfig<OrderFormModel>()
  .bidirectional('password', 'confirmPassword')
  .merge(createAddressConfig())
  .build();
```

### `build()`

Returns a fresh copy of the `ValidationConfigMap<T>`. The builder remains reusable if you want to keep chaining and build another copy.

```ts
build(): ValidationConfigMap<T>
```

## Dynamic configuration with signals

When dependencies depend on runtime state, wrap the builder in a `computed()` signal. `FormDirective` compares consecutive configs deeply, so rebuilding an identical map does not restart the pipeline.

```ts
protected readonly validationConfig = computed(() => {
  const builder = createValidationConfig<CheckoutFormModel>()
    .bidirectional('password', 'confirmPassword')
    .whenChanged('country', 'state');

  if (this.isInternational()) {
    builder.whenChanged('country', ['customsForm', 'taxId']);
  }

  return builder.build();
});
```

## Timing, debouncing, and submission

- **Debounce:** Dependent revalidation waits `100` ms by default (`NGX_VALIDATION_DEBOUNCE_PRESETS.default`). Override it globally or per component with `NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN`:

  ```ts
  // App-level debounce configuration
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

- **Submit safety:** When the user submits the form, `FormDirective` revalidates `validationConfig` dependents before emitting `(submitSettled)` and `(errorsChange)`. Submitting immediately after editing a trigger field cannot slip past a pending debounce window.
- **Quiet dependent errors:** `validationConfig` updates the dependent control's validity immediately, while `<ngx-control-wrapper>` still obeys its own `errorDisplayMode` (so an untouched dependent field does not flash errors prematurely).

## Troubleshooting

- **No autocomplete or `"Type 'string' is not assignable to type FieldPath<T>"`:** Pass your concrete model type to `createValidationConfig<MyFormModel>()`. Avoid writing helper functions with an unconstrained `<T>` generic, because `FieldPath<T>` cannot resolve keys for an unknown `T`.
- **Dependent field does not revalidate:** Confirm that the field path matches the control's `ngModelGroup` + `name` path, `[validationConfig]` is bound on `<form ngxVestForm>`, and the dependent control is currently mounted in the DOM.

## Related guides

- [ValidationConfig vs root-form](./VALIDATION-CONFIG-VS-ROOT-FORM.md)
- [Field path types](./FIELD-PATHS.md)
- [API tokens](./API-TOKENS.md#ngx_validation_config_debounce_token)
