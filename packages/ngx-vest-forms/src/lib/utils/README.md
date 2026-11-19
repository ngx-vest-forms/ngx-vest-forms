# Utilities reference

Canonical reference for the utility types and functions exported by `ngx-vest-forms` and its internal entry point `ngx-vest-forms/internal`.

## Contents

- [Type utilities](#type-utilities)
  - [`NgxDeepPartial<T>`](#ngxdeeppartialt)
  - [`NgxDeepRequired<T>`](#ngxdeeprequiredt)
  - [`NgxVestSuite<T>`](#ngxvestsuitet)
  - [`NgxFieldKey<T>`](#ngxfieldkeyt)
- [Form state and value utilities](#form-state-and-value-utilities)
  - [`setValueAtPath()`](#setvalueatpath)
  - [`getAllFormErrors()`](#getallformerrors)
  - [`createEmptyFormState()`](#createemptyformstate)
  - [`fieldWarningsToRecord()`](#fieldwarningstorecord)
  - [`createFormFeedbackSignals()`](#createformfeedbacksignals)
  - [`createDebouncedPendingState()`](#createdebouncedpendingstate)
- [Array/object conversion](#arrayobject-conversion)
  - [`arrayToObject()`](#arraytoobject)
  - [`deepArrayToObject()`](#deeparraytoobject)
  - [`objectToArray()`](#objecttoarray)
- [Field path utilities](#field-path-utilities)
  - [`stringifyFieldPath()`](#stringifyfieldpath)
- [Field clearing utilities](#field-clearing-utilities)
  - [`clearFieldsWhen()`](#clearfieldswhen)
  - [`clearFields()`](#clearfields)
  - [`keepFieldsWhen()`](#keepfieldswhen)
- [Standard Schema adapter](#standard-schema-adapter)
  - [`toFormContract()`](#toformcontract)
- [Internal entry point (`ngx-vest-forms/internal`)](#internal-entry-point-ngx-vest-formsinternal)

---

## Type utilities

### `NgxDeepPartial<T>`

Makes every property and nested property optional recursively. Use it to type every template-driven form model, because Angular builds form values one control at a time.

```ts
import { signal } from '@angular/core';
import type { NgxDeepPartial } from 'ngx-vest-forms';

interface UserModel {
  name: string;
  profile: {
    age: number;
    isActive: boolean;
  };
}

type UserFormModel = NgxDeepPartial<UserModel>;
const formValue = signal<UserFormModel>({});
```

### `NgxDeepRequired<T>`

Makes every property required recursively. Use it to define a fallback object contract when you do not already have a Standard Schema (such as Zod or Valibot).

```ts
import type { NgxDeepPartial, NgxDeepRequired } from 'ngx-vest-forms';

type FormModel = NgxDeepPartial<{
  name: string;
  profile: { age: number };
}>;

const formContract: NgxDeepRequired<FormModel> = {
  name: '',
  profile: { age: 0 },
};
```

> **Migrating from v2?** `NgxFormCompatibleDeepRequired<T>`, `NgxTypedVestSuite<T>`, and the unprefixed aliases (`DeepPartial`, `DeepRequired`, `FormCompatibleDeepRequired`) were removed in v3. See [MIGRATION-v2.x-to-v3.0.0.md](../../../../../docs/migration/MIGRATION-v2.x-to-v3.0.0.md).

### `NgxVestSuite<T>`

Canonical suite type in v3 for Vest 6 model-only suites.

```ts
import type { NgxVestSuite } from 'ngx-vest-forms';
import { create, enforce, test } from 'vest';

type FormModel = { email?: string; password?: string };

export const userSuite: NgxVestSuite<FormModel> = create((model) => {
  test('email', 'Email is required', () => {
    enforce(model.email).isNotBlank();
  });
});
```

For schema-typed suites with compile-time top-level field checking, use `satisfies NgxVestSuite<FormModel>`. See [TYPE-COMPATIBILITY.md](../../../../../docs/TYPE-COMPATIBILITY.md).

### `NgxFieldKey<T>`

Union of valid dotted field keys for `T` plus `ROOT_FORM`. Useful when typing focused call-site calls such as `suite.only(field).run(model)` in helpers or specs.

---

## Form state and value utilities

### `setValueAtPath()`

Mutates an object to set a value at a dot- or bracket-notation path, creating intermediate plain objects or arrays as needed. Unsafe prototype keys (`__proto__`, `prototype`, `constructor`) are ignored.

```ts
import { setValueAtPath } from 'ngx-vest-forms';

const model: Record<string, unknown> = {};
setValueAtPath(model, 'user.profile.name', 'Ada');
// { user: { profile: { name: 'Ada' } } }

setValueAtPath(model, 'addresses[0].street', 'Main St');
// { user: { profile: { name: 'Ada' } }, addresses: [{ street: 'Main St' }] }
```

### `getAllFormErrors()`

Collects all enabled control errors and warnings from an Angular `AbstractControl` into `{ errors, warnings }` (`NgxFormErrorsByPath`), keyed by dotted field path (including numeric array indices such as `phoneNumbers.0.number` and `ROOT_FORM`).

```ts
import { getAllFormErrors } from 'ngx-vest-forms';

const { errors, warnings } = getAllFormErrors(form);
// errors: { email: ['Email is required'], 'addresses.billing.street': ['Street is required'] }
// warnings: { username: ['Consider a longer username'] }
```

Inside components, prefer the reactive `vestForm().formState().errors` and `vestForm().fieldWarnings()` signals. Use `getAllFormErrors()` for one-shot snapshots such as logging or serialization.

### `createEmptyFormState()`

Returns a fallback `NgxFormState<T>` (`{ valid: true, errors: {}, value: null }`) for components that render before a `viewChild()` reference to `FormDirective` resolves.

```ts
import { createEmptyFormState, type NgxFormState } from 'ngx-vest-forms';

const emptyState: NgxFormState<CheckoutFormModel> =
  createEmptyFormState<CheckoutFormModel>();
```

### `fieldWarningsToRecord()`

Converts `FormDirective.fieldWarnings()` (`ReadonlyMap<string, readonly string[]>`) into a plain `Record<string, string[]>`.

```ts
import { fieldWarningsToRecord } from 'ngx-vest-forms';

const warnings = fieldWarningsToRecord(this.vestForm().fieldWarnings());
```

### `createFormFeedbackSignals()`

Bundles the four common presenter-facing computed signals (`formState`, `warnings`, `validatedFields`, `pending`) from a `Signal<FormDirective<T> | undefined>`.

```ts
import { Component, viewChild } from '@angular/core';
import {
  createFormFeedbackSignals,
  FormDirective,
  type NgxDeepPartial,
} from 'ngx-vest-forms';

type ProfileFormModel = NgxDeepPartial<{ email: string; username: string }>;

@Component({
  selector: 'app-profile-form',
  template: `...`,
})
export class ProfileFormComponent {
  protected readonly vestForm = viewChild(FormDirective<ProfileFormModel>);

  private readonly feedback = createFormFeedbackSignals(this.vestForm);
  protected readonly formState = this.feedback.formState;
  protected readonly warnings = this.feedback.warnings;
  protected readonly validatedFields = this.feedback.validatedFields;
  protected readonly pending = this.feedback.pending;
}
```

Pass `{ formState: customSignal }` as the second argument when you need to merge or override `formState`. If you only need a single derived signal, a plain `computed()` is simpler.

### `createDebouncedPendingState()`

Creates a debounced `showPendingMessage` signal from an `isPending: Signal<boolean>` input to avoid flashing a "Validating..." indicator on fast async checks.

```ts
import { Component, inject } from '@angular/core';
import {
  createDebouncedPendingState,
  FormErrorDisplayDirective,
} from 'ngx-vest-forms';

@Component({
  selector: 'app-custom-wrapper',
  hostDirectives: [
    { directive: FormErrorDisplayDirective, inputs: ['errorDisplayMode'] },
  ],
  template: `
    <ng-content />
    @if (showPendingMessage()) {
      <div role="status" aria-live="polite" aria-atomic="true">Validating…</div>
    }
  `,
})
export class CustomWrapperComponent {
  protected readonly errorDisplay = inject(FormErrorDisplayDirective, {
    self: true,
  });

  private readonly pendingState = createDebouncedPendingState(
    this.errorDisplay.isPending,
    { showAfter: 200, minimumDisplay: 500 }
  );

  protected readonly showPendingMessage = this.pendingState.showPendingMessage;
}
```

Options (`DebouncedPendingStateOptionsInput`) accept either a static object or a `Signal<DebouncedPendingStateOptions>`:

- `showAfter` (default: `200` ms): wait before showing the pending state. If validation finishes earlier, it never shows.
- `minimumDisplay` (default: `500` ms): once shown, stay visible for at least this duration to prevent flicker.

The built-in `<ngx-control-wrapper>` and `<ngx-form-group-wrapper>` already apply this helper (defaulting to `{ showAfter: 500, minimumDisplay: 500 }`, configurable via `[pendingDebounce]`) and read the text from `NGX_PENDING_LABEL`.

---

## Array/object conversion

Angular template-driven forms work best when dynamic lists are stored as numeric-keyed objects under an `ngModelGroup`. These utilities convert between arrays and numeric-keyed objects.

### `arrayToObject()`

Converts a flat array into a numeric-keyed object (`Record<number, T>`).

```ts
import { arrayToObject } from 'ngx-vest-forms';

arrayToObject(['123-4567', '987-6543']);
// { 0: '123-4567', 1: '987-6543' }
```

### `deepArrayToObject()`

Converts an array and any nested arrays inside plain objects recursively into numeric-keyed objects.

```ts
import { deepArrayToObject } from 'ngx-vest-forms';

deepArrayToObject([{ street: 'Main St', phones: ['111', '222'] }]);
// { 0: { street: 'Main St', phones: { 0: '111', 1: '222' } } }
```

### `objectToArray()`

Converts named numeric-keyed object properties back into arrays before sending data to an API.

```ts
function objectToArray(object: object, keys: readonly string[]): unknown;
```

The return type is `unknown`, so assert the concrete target type at the call site.

- Only listed keys convert, plus numeric-keyed objects inside them (and numeric-keyed ancestors that hold a converted key).
- An empty `{}` under a converted key becomes `[]`.
- Unsafe prototype keys (`__proto__`, `prototype`, `constructor`) are omitted at every level.
- A single-entry wrapper whose sole key is converted unwraps to the bare array.

```ts
import { objectToArray } from 'ngx-vest-forms';

const formData = {
  name: 'Ada',
  phoneNumbers: { 0: '123-4567', 1: '987-6543' },
  addresses: {
    0: { street: 'Main St', phones: { 0: '111', 1: '222' } },
  },
};

const payload = objectToArray(formData, [
  'phoneNumbers',
  'addresses',
  'phones',
]) as {
  name: string;
  phoneNumbers: string[];
  addresses: Array<{ street: string; phones: string[] }>;
};
```

Template binding with `@for` and `keyvalue`:

```html
<form
  ngxVestForm
  [suite]="suite"
  [formValue]="formValue()"
  (formValueChange)="formValue.set($event)"
>
  <div ngModelGroup="phoneNumbers">
    @for (entry of formValue().phoneNumbers | keyvalue: byNumericKey; track entry.key) {
      <ngx-control-wrapper>
        <input [name]="entry.key" [ngModel]="entry.value" />
        <button type="button" (click)="removePhoneNumber(+entry.key)">
          Remove
        </button>
      </ngx-control-wrapper>
    }
  </div>
</form>
```

---

## Field path utilities

For compile-time path types (`FieldPath<T>`, `LeafFieldPath<T>`, `ValidationConfigMap<T>`, `FormFieldName<T>`, `FieldPathValue<T, P>`, `ValidateFieldPath<T, P>`), see [FIELD-PATHS.md](../../../../../docs/FIELD-PATHS.md).

### `stringifyFieldPath()`

Converts a segment array into a dot/bracket path string.

```ts
import { stringifyFieldPath } from 'ngx-vest-forms';

stringifyFieldPath(['addresses', 0, 'street']);
// 'addresses[0].street'
```

---

## Field clearing utilities

Immutable top-level helpers for clearing hidden form sections inside `(formValueChange)`. See [FIELD-CLEARING-UTILITIES.md](../../../../../docs/FIELD-CLEARING-UTILITIES.md) for full patterns including `removeField()`.

### `clearFieldsWhen()`

Sets top-level keys to `undefined` where the condition is `true`.

```ts
import { clearFieldsWhen } from 'ngx-vest-forms';

protected handleFormChange(value: OrderFormModel): void {
  this.formValue.set(
    clearFieldsWhen(value, {
      shippingAddress: !value.needsShipping,
    })
  );
}
```

### `clearFields()`

Unconditionally sets the listed top-level keys to `undefined`.

```ts
import { clearFields } from 'ngx-vest-forms';

this.formValue.update((v) => clearFields(v, ['tempData', 'draft']));
```

### `keepFieldsWhen()`

Keeps top-level keys whose condition is `true` and sets listed keys whose condition is `false` to `undefined`.

```ts
import { keepFieldsWhen } from 'ngx-vest-forms';

this.formValue.update((v) =>
  keepFieldsWhen(v, {
    basicInfo: true,
    shipping: needsShipping,
  })
);
```

---

## Standard Schema adapter

### `toFormContract()`

Wraps an `NgxDeepRequired<T>` object contract as a `StandardSchemaV1<NgxDeepPartial<T>>`. `provideFormContract(...)` and `[formContract]` accept legacy shape objects directly, so call `toFormContract()` only when you need an explicit `StandardSchemaV1` value.

```ts
import {
  toFormContract,
  type NgxDeepPartial,
  type NgxDeepRequired,
  type StandardSchemaV1,
} from 'ngx-vest-forms';

type ProfileModel = NgxDeepPartial<{ name: string; profile: { age: number } }>;

const profileShape: NgxDeepRequired<ProfileModel> = {
  name: '',
  profile: { age: 0 },
};

const contract: StandardSchemaV1<ProfileModel> = toFormContract(profileShape);
```

---

## Internal entry point (`ngx-vest-forms/internal`)

These `@internal` helpers moved to the `ngx-vest-forms/internal` secondary entry point in v3. They carry **no semver guarantees** and may change without notice.

```ts
import {
  fastDeepEqual,
  getFormControlField,
  getFormGroupField,
  mergeValuesAndRawValues,
  parseFieldPath,
  shallowEqual,
} from 'ngx-vest-forms/internal';
```

| Helper | Purpose |
| --- | --- |
| `getFormControlField(rootForm, control)` | Dotted path of a control relative to the root form. |
| `getFormGroupField(rootForm, group)` | Dotted path of a nested group relative to the root form. |
| `mergeValuesAndRawValues(form)` | Deep copy of `form.getRawValue()` (including disabled controls) without unsafe prototype keys. |
| `parseFieldPath(path)` | Splits a dot/bracket path string into string and numeric segments. |
| `shallowEqual(a, b)` | First-level structural equality check. |
| `fastDeepEqual(a, b)` | Recursive structural equality (`Object.is` primitives, cycles, `Date`, `RegExp`; `Map`/`Set`/functions by reference). To override the comparator `FormDirective` uses, provide [`NGX_EQUALITY_FN`](../../../../../docs/API-TOKENS.md#ngx_equality_fn). |

## Related documentation

- [Main README](../../../../../README.md)
- [API tokens](../../../../../docs/API-TOKENS.md)
- [Field path types](../../../../../docs/FIELD-PATHS.md)
- [Field clearing utilities](../../../../../docs/FIELD-CLEARING-UTILITIES.md)
