# Complete Example: User Form

> **Vest 6 Example:** This guide demonstrates the modern Vest 6 pattern with model-only callbacks and call-site field focus. For Vest 5 patterns (v2.x), see the [v2.x-to-v3.0.0 migration guide](./migration/MIGRATION-v2.x-to-v3.0.0.md).

## Full Working Example

```typescript
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { create, test, enforce } from 'vest';
import {
  NgxVestForms,
  NgxDeepPartial,
  NgxDeepRequired,
  NgxVestSuite,
} from 'ngx-vest-forms';

// 1. Define your form model (always NgxDeepPartial)
type UserFormModel = NgxDeepPartial<{
  firstName: string;
  lastName: string;
  email: string;
}>;

// 2. Create a shape for runtime validation (recommended)
const userFormShape: NgxDeepRequired<UserFormModel> = {
  firstName: '',
  lastName: '',
  email: '',
};

// 3. Create a Vest validation suite
const userValidationSuite: NgxVestSuite<UserFormModel> = create(
  (model: UserFormModel) => {
    test('firstName', 'First name is required', () => {
      enforce(model.firstName).isNotBlank();
    });

    test('lastName', 'Last name is required', () => {
      enforce(model.lastName).isNotBlank();
    });

    test('email', 'Valid email is required', () => {
      enforce(model.email).isEmail();
    });
  }
);
// Call site: userValidationSuite.only('firstName').run(model) for field-level validation

// 4. Create the component
@Component({
  selector: 'ngx-user-form',
  imports: [NgxVestForms],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form
      ngxVestForm
      [suite]="suite"
      [formShape]="shape"
      [formValue]="formValue()"
      (formValueChange)="formValue.set($event)"
      (ngSubmit)="save()"
    >
      <!-- Each field wrapped for error display -->
      <div ngx-control-wrapper>
        <label for="firstName">First Name</label>
        <input
          id="firstName"
          name="firstName"
          [ngModel]="formValue().firstName"
        />
      </div>

      <div ngx-control-wrapper>
        <label for="lastName">Last Name</label>
        <input id="lastName" name="lastName" [ngModel]="formValue().lastName" />
      </div>

      <div ngx-control-wrapper>
        <label for="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          [ngModel]="formValue().email"
        />
      </div>

      <button type="submit">Submit</button>
    </form>
  `,
})
export class UserFormComponent {
  protected readonly formValue = signal<UserFormModel>({});
  protected readonly suite = userValidationSuite;
  protected readonly shape = userFormShape;

  protected save() {
    console.log('Form submitted:', this.formValue());
  }
}
```

## What This Example Demonstrates

- ✅ **Type-safe form model** with `NgxDeepPartial<T>`
- ✅ **Automatic form control creation** - No manual FormControl definitions
- ✅ **Validation on blur and submit** - Default error display modes
- ✅ **Error display** with built-in `ngx-control-wrapper`
- ✅ **Runtime shape validation** - Catches typos in development mode
- ✅ **Unidirectional data flow** - Using `[ngModel]` (not `[(ngModel)]`)
- ✅ **Performance optimized** — Field-level validation via `suite.only(field).run(model)` at call site
- ✅ **Canonical suite typing** — Uses `NgxVestSuite<T>` in new code

`NgxTypedVestSuite<T>` still works, but it is a deprecated alias of `NgxVestSuite<T>` and should be avoided in new examples.

## Key Points to Remember

### 1. Always Use `NgxDeepPartial` for Form Models

Form values are built incrementally, so not all properties are always present:

```typescript
type MyFormModel = NgxDeepPartial<{
  firstName: string;
  lastName: string;
}>;
```

### 2. Create a Shape for Runtime Validation

Use `NgxDeepRequired` to create a shape that matches your model structure:

```typescript
const myFormShape: NgxDeepRequired<MyFormModel> = {
  firstName: '',
  lastName: '',
};
```

This enables shape validation in development mode to catch typos in `name` attributes.

### 3. Suite Callbacks Take Only the Model

In Vest 6, suite callbacks take only the model parameter. Field focus is handled at the call site:

```typescript
const suite = create((model) => {
  test('firstName', 'Required', () => {
    enforce(model.firstName).isNotBlank();
  });
});

// Field-level validation at the call site:
suite.only('firstName').run(model); // Validate only 'firstName'
suite.run(model); // Validate all fields
suite.reset(); // Reset accumulated state
```

**Never** use the old Vest 5 pattern with `field?` parameter and `only()` inside the callback:

```typescript
// ❌ WRONG — old Vest 5 pattern
const suite = create((model, field?) => {
  only(field);
  ...
});
```

### 4. Use `[ngModel]` Not `[(ngModel)]`

For unidirectional data flow, use property binding only:

```typescript
// ✅ CORRECT - Unidirectional flow
<input [ngModel]="formValue().firstName" name="firstName" />

// ❌ WRONG - Two-way binding bypasses form events
<input [(ngModel)]="formValue().firstName" name="firstName" />
```

Update the form value through the `(formValueChange)` event:

```typescript
<form ngxVestForm (formValueChange)="formValue.set($event)">
```

### 5. Name Attribute Must Match Property Path

The `name` attribute must exactly match the property path in your `[ngModel]` binding:

```typescript
// ✅ CORRECT - name matches property path
<input name="firstName" [ngModel]="formValue().firstName" />

// For nested properties, use dot notation
<input name="address.street" [ngModel]="formValue().address?.street" />

// ❌ WRONG - name doesn't match property path
<input name="first_name" [ngModel]="formValue().firstName" />
```

## Optional: Derived Feedback Signals for Presenter Components

If your form body passes state into a presentational component (for example, a
sidebar summary, sticky footer, or debug panel), derive those signals once with
`createFormFeedbackSignals()` instead of repeating several `computed()` wrappers.

You do **not** need this helper to use ngx-vest-forms. Direct derivation from
`this.vestForm()` is still a first-class option and is often clearer when you
only need one signal.

```typescript
import { Component, signal, viewChild } from '@angular/core';
import {
  create,
  test,
  enforce,
} from 'vest';
import {
  createFormFeedbackSignals,
  FormDirective,
  NgxDeepPartial,
  NgxVestForms,
  NgxVestSuite,
} from 'ngx-vest-forms';

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
  imports: [NgxVestForms],
  template: `
    <form
      ngxVestForm
      [suite]="suite"
      [formValue]="formValue()"
      (formValueChange)="formValue.set($event)"
    >
      <input name="firstName" [ngModel]="formValue().firstName" />
      <input name="email" [ngModel]="formValue().email" />
    </form>

    <aside>
      <p>Valid: {{ formState().valid ? 'yes' : 'no' }}</p>
      <p>Pending: {{ pending() ? 'yes' : 'no' }}</p>
      <pre>{{ warnings() | json }}</pre>
      <pre>{{ validatedFields() | json }}</pre>
    </aside>
  `,
})
export class UserFormComponent {
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

Why is this exposed as a **function**? Because it only packages signal
composition around the `viewChild()` result you already have. No extra
directive, provider, or lifecycle abstraction is necessary.

If you only need one derived value, direct derivation is usually simpler:

```typescript
protected readonly formState = computed(
  () => this.vestForm()?.formState() ?? createEmptyFormState()
);
```

Use `fieldWarningsToRecord()` when you only need the warnings conversion, and
`createEmptyFormState()` when you only need a safe fallback packaged state.

## Next Steps

Now that you understand the basics, explore more advanced features:

- **[Composable Validations](./COMPOSABLE-VALIDATIONS.md)** - Reusable validation patterns
- **[Custom Control Wrappers](./CUSTOM-CONTROL-WRAPPERS.md)** - Custom error display components
- **[Child Components](./CHILD-COMPONENTS.md)** - Splitting large forms
- **[Field Clearing Utilities](./FIELD-CLEARING-UTILITIES.md)** - Managing dynamic form state

## Live Examples

Check out these complete, real-world examples:

- **[Purchase Form Demo](https://github.com/ngx-vest-forms/ngx-vest-forms/tree/master/projects/examples/src/app/pages/purchase-form)** - Complex form with nested objects and conditional logic
- **[Business Hours Demo](https://github.com/ngx-vest-forms/ngx-vest-forms/tree/master/projects/examples/src/app/pages/business-hours-form)** - Dynamic form arrays with validation
- **[Interactive Stackblitz Demo](https://stackblitz.com/~/github.com/simplifiedcourses/ngx-vest-forms-stackblitz)** - Try it in your browser
