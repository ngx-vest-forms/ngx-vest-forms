---
name: core
description: Default setup for an ngx-vest-forms v3 form, plus form state, submit, reset, global tokens and testing. Read it for a first form, a "proper example", component structure, form contracts, or tests that exercise a form or suite.
---

# ngx-vest-forms core workflow

The invariants live in the router, [`../SKILL.md`](../SKILL.md). This file is the default implementation they add up to.

## Build a form

Build in this order; the form is done when every step is present:

1. A Form Model type wrapped in `NgxDeepPartial<T>`, because template-driven forms build the value incrementally.
2. A Vest suite: `create((model) => { ... })`, typed `NgxVestSuite<Model>`, one `test(fieldPath, message, fn)` per rule, field names equal to the Field Paths.
3. Optionally, a Form Contract for dev-mode path diagnostics. Reuse a Standard Schema the app already has (Zod v4, Valibot, ArkType); otherwise write an `NgxDeepRequired<Model>` shape. Provide it once with `provideFormContract(contract)` in the component's `providers`; bind `[formContract]` only when it differs per usage.
4. A `formValue` signal in the component.
5. `<form ngxVestForm [suite] [formValue] (formValueChange)>`, plus `(submitSettled)` when the form submits.
6. One `[ngModel]` + `name` per control, each inside `<ngx-control-wrapper>` with a `<label for>` and a matching `id`.
7. `imports: [NgxVestForms]`. Angular 22 defaults to OnPush, so leave `changeDetection` unset.

```ts
import { Component, signal } from '@angular/core';
import {
  NgxVestForms,
  provideFormContract,
  type NgxDeepPartial,
  type NgxDeepRequired,
  type NgxSubmitSettledEvent,
  type NgxVestSuite,
} from 'ngx-vest-forms';
import { create, enforce, test } from 'vest';

type Profile = NgxDeepPartial<{
  firstName: string;
  email: string;
  address: { street: string; city: string };
}>;

const profileContract: NgxDeepRequired<Profile> = {
  firstName: '',
  email: '',
  address: { street: '', city: '' },
};

export const profileSuite: NgxVestSuite<Profile> = create((model) => {
  test('firstName', 'First name is required', () => {
    enforce(model.firstName).isNotBlank();
  });
  test('email', 'Enter a valid email', () => {
    enforce(model.email).matches(/^[^@\s]+@[^@\s]+$/);
  });
  test('address.city', 'City is required', () => {
    enforce(model.address?.city).isNotBlank();
  });
});

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
      (submitSettled)="save($event)"
    >
      <ngx-control-wrapper>
        <label for="firstName">First name</label>
        <input
          id="firstName"
          name="firstName"
          [ngModel]="formValue().firstName"
        />
      </ngx-control-wrapper>

      <ngx-control-wrapper>
        <label for="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          [ngModel]="formValue().email"
        />
      </ngx-control-wrapper>

      <ngx-form-group-wrapper ngModelGroup="address">
        <ngx-control-wrapper>
          <label for="street">Street</label>
          <input
            id="street"
            name="street"
            [ngModel]="formValue().address?.street"
          />
        </ngx-control-wrapper>
        <ngx-control-wrapper>
          <label for="city">City</label>
          <input id="city" name="city" [ngModel]="formValue().address?.city" />
        </ngx-control-wrapper>
      </ngx-form-group-wrapper>

      <button type="submit">Save</button>
    </form>
  `,
})
export class ProfileFormComponent {
  protected readonly suite = profileSuite;
  protected readonly formValue = signal<Profile>({});

  protected save(event: NgxSubmitSettledEvent<Profile>): void {
    if (event.valid) {
      // persist event.value
    }
  }
}
```

Field-scoped runs happen at the call site, `suite.only('email').run(model)`, and only when code outside the form needs them; the directive already runs each field this way.

## Form state, submit and reset

Get the directive with `#vestForm="ngxVestForm"` plus `viewChild.required('vestForm', { read: FormDirective })`, or `viewChild(FormDirective<Model>)`.

| Need                                                  | Use                                                                                                                           |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| decide a submit, with async tests                     | `(submitSettled)`; it also revalidates `validationConfig` dependents first                                                    |
| errors by field path                                  | `(errorsChange)`, or `formState().errors`                                                                                     |
| errors, warnings and pending as ready signals         | `createFormFeedbackSignals(vestForm)` → `formState`, `warnings`, `validatedFields`, `pending`                                 |
| errors and warnings of an arbitrary `AbstractControl` | `getAllFormErrors(control)` → `{ errors, warnings }`                                                                          |
| `valid`, `pending`, dirty state                       | directive signals `valid()`, `pending()`, `status()`; outputs `(validChange)`, `(dirtyChange)`                                |
| start over                                            | set the signal, then `resetForm(value)`                                                                                       |
| reset one field's validation                          | `resetField(path)`; for a field that is gone for good, `removeField(path)`                                                    |
| end a submit cycle but keep values and touched state  | `clearSubmittedState()` ([guide](https://github.com/ngx-vest-forms/ngx-vest-forms/blob/master/docs/CLEAR-SUBMITTED-STATE.md)) |
| one button submitting several forms                   | `markAllAsTouched()` on each                                                                                                  |
| own focus handling after a failed submit              | `[focusFirstInvalidOnSubmit]="false"`                                                                                         |
| wizard steps that validate a subset                   | `[validationFocus]="{ onlyGroup: 'step1' }"` with Vest `group()`s in the suite                                                |

Errors, warnings and touched paths key array items with dot segments: `users.0.name`.

## App-wide tokens

| Token                                  | Sets                                                                                                                        |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `NGX_ERROR_DISPLAY_MODE_TOKEN`         | default `errorDisplayMode` (`'on-blur-or-submit'`)                                                                          |
| `NGX_WARNING_DISPLAY_MODE_TOKEN`       | default `warningDisplayMode` (`'on-validated-or-touch'`)                                                                    |
| `NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN` | `validationConfig` debounce; `NGX_VALIDATION_DEBOUNCE_PRESETS.immediate` (0) suits tests                                    |
| `NGX_PENDING_LABEL`                    | the wrappers' "Validating…" text, as a string or a `Signal<string>` for runtime language switches                           |
| `NGX_EQUALITY_FN`                      | the comparator behind `formValueChange` dedupe and model sync (default deep equal); swap for bundle size or domain equality |
| `NGX_FORM_CONTRACT`                    | the contract, via `provideFormContract(...)` or `provideFormContractFactory(...)`                                           |

Per-control debounce is `[validationOptions]="{ debounceTime: 300 }"` on the `ngModel`. Details: [`API-TOKENS.md`](https://github.com/ngx-vest-forms/ngx-vest-forms/blob/master/docs/API-TOKENS.md).

## Split the suite

Large suites stay readable as plain functions that take a model slice and a path prefix and call `test()` with full Field Paths: `addressValidations(model.billing, 'billing')`. See [`COMPOSABLE-VALIDATIONS.md`](https://github.com/ngx-vest-forms/ngx-vest-forms/blob/master/docs/COMPOSABLE-VALIDATIONS.md).

## Tests

For any test that runs a suite or renders a form, read [`references/testing-vest-6.md`](references/testing-vest-6.md). The short version: `suite.runStatic(model)` for pure suite tests, and `beforeEach(() => suite.reset())` for every `create()` suite shared across tests.

## Where to look next

- Dependent fields → [`../validation-config-builder/SKILL.md`](../validation-config-builder/SKILL.md)
- Form-level rules → [`../root-form-validation/SKILL.md`](../root-form-validation/SKILL.md)
- Path typing (`FieldPath<T>`, `FormFieldName<T>`, `ValidationConfigMap<T>`) → [`FIELD-PATHS.md`](https://github.com/ngx-vest-forms/ngx-vest-forms/blob/master/docs/FIELD-PATHS.md)
- A longer worked example → [`COMPLETE-EXAMPLE.md`](https://github.com/ngx-vest-forms/ngx-vest-forms/blob/master/docs/COMPLETE-EXAMPLE.md)
