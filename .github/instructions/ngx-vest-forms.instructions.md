---
description: ngx-vest-forms v3.0 - Angular Template-Driven Forms with Vest.js validation
applyTo: '**/*.ts, **/*.html'
---

# ngx-vest-forms invariants

Use this file as the **always-on guardrail sheet** for ngx-vest-forms.
Keep detailed examples and feature-specific workflows in the docs and the
`.agents/skills/ngx-vest-forms/` workflow sub-skills.

> **v3.0** | Angular 22+ | Vest.js 6.x | See `vest.instructions.md` for deeper validation patterns.

## Non-negotiable rules

| Rule | Correct | Wrong |
|------|---------|-------|
| Binding | `[ngModel]="formValue().name"` | `[(ngModel)]="formValue().name"` |
| Name = Path | `name="address.street"` | `name="street"` for nested controls |
| Optional chaining | `formValue().address?.street` | `formValue().address.street` |
| Suite callback | `create((model) => { ... })` | `create((model, field?) => { ... })` |
| Field focus | `suite.only(field).run(model)` | `only(field)` inside the suite callback |
| Child form components | `viewProviders: [vestFormsViewProviders]` | Missing `viewProviders` |
| Single-control wrapper | `<ngx-control-wrapper>` | Group-level misuse of control wrapper |
| Group wrapper | `<ngx-form-group-wrapper ngModelGroup="...">` | `ngx-control-wrapper` around a whole `ngModelGroup` |

## Canonical default pattern

```typescript
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  NgxDeepPartial,
  NgxVestForms,
  type NgxVestSuite,
} from 'ngx-vest-forms';
import { create, enforce, test } from 'vest';

type FormModel = NgxDeepPartial<{
  firstName: string;
  email: string;
}>;

const suite: NgxVestSuite<FormModel> = create((model) => {
  test('firstName', 'First name is required', () => {
    enforce(model.firstName).isNotBlank();
  });

  test('email', 'Valid email is required', () => {
    enforce(model.email).isEmail();
  });
});

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxVestForms],
  template: `
    <form
      ngxVestForm
      [suite]="suite"
      [formValue]="formValue()"
      (formValueChange)="formValue.set($event)"
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
        <input id="email" name="email" [ngModel]="formValue().email" />
      </ngx-control-wrapper>
    </form>
  `,
})
export class ExampleComponent {
  protected readonly formValue = signal<FormModel>({});
  protected readonly suite = suite;
}
```

## Type-safe form models

Use `NgxDeepPartial<T>` for the live form model because template-driven forms
build values incrementally.

```typescript
type ProfileFormModel = NgxDeepPartial<{
  user: {
    firstName: string;
    email: string;
  };
  addresses: {
    billing: {
      street: string;
      city: string;
    };
  };
}>;
```

Use `NgxDeepRequired<T>` for development-time shapes.

```typescript
import { type NgxDeepRequired } from 'ngx-vest-forms';

export const profileShape: NgxDeepRequired<ProfileFormModel> = {
  user: {
    firstName: '',
    email: '',
  },
  addresses: {
    billing: {
      street: '',
      city: '',
    },
  },
};
```

## Validation patterns

Use Vest 6 `create()` suites with a model-only callback. Field-level focus
happens at the call site.

```typescript
import { create, enforce, omitWhen, test, warn } from 'vest';
import { type NgxVestSuite } from 'ngx-vest-forms';

export const profileSuite: NgxVestSuite<ProfileFormModel> = create((model) => {
  test('user.firstName', 'First name is required', () => {
    enforce(model.user?.firstName).isNotBlank();
  });

  omitWhen(model.user?.email === '', () => {
    test('user.email', 'Email must be valid', () => {
      enforce(model.user?.email).isEmail();
    });
  });

  test('user.email', 'Using a work email is recommended', () => {
    warn();
    enforce(model.user?.email).includes('@');
  });
});

// Field-level validation
profileSuite.only('user.email').run(model);

// Full validation
profileSuite.run(model);
```

If async completion matters in Vest 6, use one of these patterns instead of
legacy result callbacks:

- `await profileSuite.run(model)`
- `profileSuite.afterEach(() => { ... }).run(model)`
- `profileSuite.afterField('user.email', () => { ... }).run(model)`

Do **not** use legacy Vest 5 patterns such as:

- `staticSuite((model, field?) => { ... })` — removed in Vest 6; use `create((model) => { ... })` plus `suite.runStatic(model)` for stateless execution
- `only(field)` inside the callback
- direct callable suite execution like `suite(model, field)`
- result `.done(...)` callbacks — use `await suite.run(...)`, `suite.afterEach(...)`, or `suite.afterField(...)`

## `validationConfig` for dependent fields

Use `validationConfig` when field A changes whether field B is valid.

```typescript
import { createValidationConfig } from 'ngx-vest-forms';

protected readonly validationConfig = createValidationConfig<ProfileFormModel>()
  .bidirectional('password', 'confirmPassword')
  .whenChanged('age', 'emergencyContact')
  .build();
```

For conditionally rendered fields, a computed config is fine:

```typescript
protected readonly validationConfig = computed(() => {
  const builder = createValidationConfig<ProfileFormModel>();

  if (this.formValue().gender === 'Other') {
    builder.whenChanged('gender', 'genderOther');
  }

  return builder.build();
});
```

## Wrappers and error display

- Prefer `<ngx-control-wrapper>` for a single control plus label/error UI.
- Use `<ngx-form-group-wrapper>` or `ngxFormGroupWrapper` for `ngModelGroup` containers.
- For dependent fields that should revalidate quietly, combine `validationConfig`
  with wrapper-level `errorDisplayMode="on-blur"`.
- Use `FormErrorDisplayDirective` only when building a custom wrapper/presenter.

```html
<ngx-form-group-wrapper ngModelGroup="address">
  <ngx-control-wrapper>
    <label for="street">Street</label>
    <input id="street" name="street" [ngModel]="formValue().address?.street" />
  </ngx-control-wrapper>
</ngx-form-group-wrapper>
```

## Root-form validation

Use `ROOT_FORM` for business rules that belong to the form as a whole instead
of a single field.

```typescript
import { ROOT_FORM } from 'ngx-vest-forms';

test(ROOT_FORM, 'At least one contact method is required', () => {
  enforce(model.email || model.phone).isTruthy();
});
```

```html
<form
  ngxVestForm
  ngxValidateRootForm
  [suite]="suite"
  [ngxValidateRootFormMode]="'submit'"
  (errorsChange)="errors.set($event)"
>
  @if (errors()[ROOT_FORM]) {
    <div role="alert">{{ errors()[ROOT_FORM][0] }}</div>
  }
</form>
```

## Child form components

Child components that participate in the parent form tree must provide the
shared view providers.

```typescript
import { Component, input } from '@angular/core';
import {
  NgxVestForms,
  vestFormsViewProviders,
  type NgxDeepPartial,
} from 'ngx-vest-forms';

@Component({
  selector: 'app-address-section',
  imports: [NgxVestForms],
  viewProviders: [vestFormsViewProviders],
  template: `
    <ngx-form-group-wrapper [ngModelGroup]="groupName()">
      <ngx-control-wrapper>
        <input name="street" [ngModel]="value()?.street" />
      </ngx-control-wrapper>
    </ngx-form-group-wrapper>
  `,
})
export class AddressSectionComponent {
  readonly groupName = input.required<string>();
  readonly value = input<NgxDeepPartial<{ street: string }> | undefined>();
}
```

## Dynamic form behavior

- Call `triggerFormValidation()` when the form structure changes without a value change.
- Call `resetField(field)` when you need to clear one field's validation history.
- Call `removeField(field)` when a field is removed from the DOM and its stale Vest state should be purged.
- Use `fieldBlur` for blur-driven draft save or analytics side effects.

## Common mistakes to avoid

- Reintroducing `[(ngModel)]`
- Letting `name` drift from the `[ngModel]` path
- Forgetting optional chaining on partial models
- Putting `only()` inside the suite callback
- Using `ngx-control-wrapper` around a full `ngModelGroup`
- Forgetting `vestFormsViewProviders` in child form sections
- Importing internal library files instead of the public API
