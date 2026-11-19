# Complete example: user form

A complete v3 form using `NgxDeepPartial<T>`, a development-mode form contract, a Vest 6 model-only suite, `<ngx-control-wrapper>`, and `(submitSettled)`.

## Full working example

```ts
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  NgxVestForms,
  provideFormContract,
  type NgxDeepPartial,
  type NgxDeepRequired,
  type NgxSubmitSettledEvent,
  type NgxVestSuite,
} from 'ngx-vest-forms';
import { create, enforce, test } from 'vest';

// 1. Define the form model (always NgxDeepPartial because controls build values incrementally)
type UserFormModel = NgxDeepPartial<{
  firstName: string;
  lastName: string;
  email: string;
}>;

// 2. Define a dev-mode form contract (or reuse an existing Standard Schema such as Zod)
const userFormContract: NgxDeepRequired<UserFormModel> = {
  firstName: '',
  lastName: '',
  email: '',
};

// 3. Create a Vest 6 model-only suite
const userValidationSuite: NgxVestSuite<UserFormModel> = create((model) => {
  test('firstName', 'First name is required', () => {
    enforce(model.firstName).isNotBlank();
  });

  test('lastName', 'Last name is required', () => {
    enforce(model.lastName).isNotBlank();
  });

  test('email', 'Valid email is required', () => {
    enforce(model.email ?? '').matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });
});

// 4. Bind the form
@Component({
  selector: 'app-user-form',
  imports: [NgxVestForms],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideFormContract(userFormContract)],
  template: `
    <form
      ngxVestForm
      [suite]="suite"
      [formValue]="formValue()"
      (formValueChange)="formValue.set($event)"
      (submitSettled)="onSubmit($event)"
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
        <label for="lastName">Last name</label>
        <input
          id="lastName"
          name="lastName"
          [ngModel]="formValue().lastName"
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

      <button type="submit">Submit</button>
    </form>
  `,
})
export class UserFormComponent {
  protected readonly formValue = signal<UserFormModel>({});
  protected readonly suite = userValidationSuite;

  protected onSubmit(event: NgxSubmitSettledEvent<UserFormModel>): void {
    if (!event.valid) {
      return;
    }

    console.log('Form submitted:', event.value);
  }
}
```

## Five rules to remember

### 1. Type form models with `NgxDeepPartial<T>`

Template-driven forms construct values as controls register and users type, so every level can be `undefined` until populated. Read nested properties with optional chaining (`formValue().address?.street`).

### 2. Provide a form contract for dev-mode typo checks

When a component always uses the same contract, register it with `providers: [provideFormContract(schemaOrShape)]`. If you already validate payloads with Zod or Valibot (Standard Schema v1), pass that schema instead of maintaining a separate `NgxDeepRequired<T>` object. Use the `[formContract]` input only when the contract varies per usage site.

### 3. Keep Vest 6 suite callbacks model-only

ngx-vest-forms runs focused checks at the call site via `suite.only(field).run(model)`. Write `create((model) => { ... })` and type the suite with `NgxVestSuite<T>`. Do not accept a `field` argument or call `only(field)` inside the callback (that was the Vest 5 pattern).

### 4. Use `[ngModel]` instead of `[(ngModel)]`

Bind `[ngModel]` one way and update your signal from `(formValueChange)` on `<form ngxVestForm>`. Two-way `[(ngModel)]` mutates state outside the form stream and can trigger `NGX-100` sync warnings.

### 5. Match `name` and `ngModelGroup` to the model path

The control's enclosing `ngModelGroup` names joined with its `name` attribute must match the property path in `[ngModel]`:

```html
<!-- Top-level field: path is "firstName" -->
<input name="firstName" [ngModel]="formValue().firstName" />

<!-- Nested field: path is "address.street" -->
<div ngModelGroup="address">
  <input name="street" [ngModel]="formValue().address?.street" />
</div>
```

Do not write `name="address.street"` without `ngModelGroup="address"`: Angular creates a literal key `'address.street'` instead of `{ address: { street } }`.

## Optional: derived feedback signals for presenter components

When a form passes status, errors, warnings, and validated fields into a sidebar, summary banner, or debug panel, derive them once with `createFormFeedbackSignals()` instead of writing four separate `computed()` expressions:

```ts
import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import {
  createFormFeedbackSignals,
  FormDirective,
  NgxVestForms,
  type NgxDeepPartial,
  type NgxVestSuite,
} from 'ngx-vest-forms';
import { create, enforce, test } from 'vest';

type UserFormModel = NgxDeepPartial<{
  firstName: string;
  email: string;
}>;

const suite: NgxVestSuite<UserFormModel> = create((model) => {
  test('firstName', 'First name is required', () => {
    enforce(model.firstName).isNotBlank();
  });

  test('email', 'Email is required', () => {
    enforce(model.email).isNotBlank();
  });
});

@Component({
  selector: 'app-user-form-with-summary',
  imports: [JsonPipe, NgxVestForms],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form
      ngxVestForm
      [suite]="suite"
      [formValue]="formValue()"
      (formValueChange)="formValue.set($event)"
    >
      <ngx-control-wrapper>
        <label for="firstName">First name</label>
        <input id="firstName" name="firstName" [ngModel]="formValue().firstName" />
      </ngx-control-wrapper>

      <ngx-control-wrapper>
        <label for="email">Email</label>
        <input id="email" name="email" [ngModel]="formValue().email" />
      </ngx-control-wrapper>
    </form>

    <aside>
      <p>Valid: {{ formState().valid ? 'yes' : 'no' }}</p>
      <p>Pending: {{ pending() ? 'yes' : 'no' }}</p>
      <pre>{{ warnings() | json }}</pre>
      <pre>{{ validatedFields() | json }}</pre>
    </aside>
  `,
})
export class UserFormWithSummaryComponent {
  protected readonly formValue = signal<UserFormModel>({});
  protected readonly suite = suite;
  protected readonly vestForm = viewChild(FormDirective<UserFormModel>);

  private readonly feedback = createFormFeedbackSignals(this.vestForm);
  protected readonly formState = this.feedback.formState;
  protected readonly warnings = this.feedback.warnings;
  protected readonly validatedFields = this.feedback.validatedFields;
  protected readonly pending = this.feedback.pending;
}
```

If you only need a single derived signal, a plain `computed()` is simpler:

```ts
protected readonly formState = computed(
  () => this.vestForm()?.formState() ?? createEmptyFormState<UserFormModel>()
);
```

## Next steps

- [Composable validations](./COMPOSABLE-VALIDATIONS.md) - Split large suites into reusable functions
- [ValidationConfig vs root-form](./VALIDATION-CONFIG-VS-ROOT-FORM.md) - Cross-field dependencies and form-level rules
- [Child components](./CHILD-COMPONENTS.md) - Split large templates with `vestFormsViewProviders`
- [Custom control wrappers](./CUSTOM-CONTROL-WRAPPERS.md) - Theme wrappers or build custom ones
- [Field clearing utilities](./FIELD-CLEARING-UTILITIES.md) - Handle conditional sections cleanly

## Runnable examples in this repository

- [Starter form (`apps/examples/src/app/pages/starter-form`)](../apps/examples/src/app/pages/starter-form) - Copy-ready baseline matching this guide (`/starter`)
- [Purchase form (`apps/examples/src/app/pages/purchase-form`)](../apps/examples/src/app/pages/purchase-form) - Nested groups, warnings, and cross-field rules (`/purchase`)
- [Business hours (`apps/examples/src/app/pages/business-hours-form`)](../apps/examples/src/app/pages/business-hours-form) - Dynamic form arrays and root-form rules (`/business-hours`)
