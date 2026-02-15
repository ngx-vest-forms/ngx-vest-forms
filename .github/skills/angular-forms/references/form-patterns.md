# Angular Template-Driven Form Patterns with ngx-vest-forms

## Table of Contents

- [Form Models & Types](#form-models--types)
- [Validation Suites](#validation-suites)
- [Error Display](#error-display)
- [Nested Forms & ngModelGroup](#nested-forms--ngmodelgroup)
- [Child Components](#child-components)
- [Cross-field Validation](#cross-field-validation)
- [Root Form Validation](#root-form-validation)
- [Conditional Sections](#conditional-sections)
- [Async Validation](#async-validation)
- [Composable Validations](#composable-validations)
- [Form Actions & State](#form-actions--state)
- [Array Utilities](#array-utilities)
- [Warnings](#warnings)
- [Custom Control Wrappers](#custom-control-wrappers)
- [Common Mistakes](#common-mistakes)
- [API Reference](#api-reference)

## Form Models & Types

Always use `NgxDeepPartial<T>` for form models because Angular template-driven forms build incrementally — not all properties exist initially:

```typescript
import { NgxDeepPartial, NgxDeepRequired } from 'ngx-vest-forms';

// Form model: all properties optional
type UserFormModel = NgxDeepPartial<{
  user: { firstName: string; lastName: string; email: string };
  addresses: {
    billing: { street: string; city: string; zip: string };
    shipping: { street: string; city: string; zip: string };
  };
}>;

// Shape for dev-mode runtime validation (catches name attribute typos)
const userFormShape: NgxDeepRequired<UserFormModel> = {
  user: { firstName: '', lastName: '', email: '' },
  addresses: {
    billing: { street: '', city: '', zip: '' },
    shipping: { street: '', city: '', zip: '' },
  },
};
```

For Date fields, use `NgxFormCompatibleDeepRequired` to allow `Date | string` in the shape.

### Dev-Mode Shape Validation

Pass `formShape` to catch `name` attribute typos at development time:

```typescript
@Component({
  template: `
    <form ngxVestForm [suite]="suite" [formValue]="formValue()"
          [formShape]="formShape" (formValueChange)="formValue.set($event)">
      ...
    </form>
  `
})
export class MyFormComponent {
  protected readonly formShape = userFormShape; // NgxDeepRequired<FormModel>
}
```

If a control's `name` doesn't match a path in the shape, a dev-mode console warning is shown.

## Validation Suites

### Basic Suite

```typescript
import { staticSuite, test, enforce, only } from 'vest';
import { NgxVestSuite, NgxDeepPartial } from 'ngx-vest-forms';

type FormModel = NgxDeepPartial<{ email: string; age: number }>;

export const suite: NgxVestSuite<FormModel> = staticSuite((model, field?) => {
  only(field);  // CRITICAL: Always unconditional. only(undefined) runs all tests.

  test('email', 'Email is required', () => enforce(model.email).isNotBlank());
  test('email', 'Invalid email', () => enforce(model.email).isEmail());
  test('age', 'Must be at least 18', () => enforce(model.age).greaterThanOrEquals(18));
});
```

### Typed Suite (compile-time field name checking)

```typescript
import { NgxTypedVestSuite, FormFieldName } from 'ngx-vest-forms';

const suite: NgxTypedVestSuite<FormModel> = staticSuite(
  (model: FormModel, field?: FormFieldName<FormModel>) => {
    only(field);
    test('email', 'Required', () => enforce(model.email).isNotBlank());
  }
);
```

### Conditional Validation with omitWhen

```typescript
export const suite: NgxVestSuite<FormModel> = staticSuite((model, field?) => {
  only(field);

  test('email', 'Required', () => enforce(model.email).isNotBlank());

  // Only validate shipping when checkbox is checked
  omitWhen(!model.addresses?.shippingDifferent, () => {
    test('addresses.shipping.street', 'Required', () =>
      enforce(model.addresses?.shipping?.street).isNotBlank()
    );
  });
});
```

### Optional Fields

```typescript
import { optional } from 'vest';

export const suite: NgxVestSuite<FormModel> = staticSuite((model, field?) => {
  only(field);

  optional({ alternateEmail: !model.alternateEmail });

  test('alternateEmail', 'Invalid format', () =>
    enforce(model.alternateEmail).isEmail()
  );
});
```

Vest omits optional tests when value is `'' | null | undefined` or callback returns `true`.

## Error Display

### Control Wrapper (single controls)

```html
<ngx-control-wrapper>
  <label for="email">Email</label>
  <input id="email" name="email" [ngModel]="formValue().email" />
  <!-- Errors render automatically with ARIA attributes -->
</ngx-control-wrapper>
```

### Form Group Wrapper (ngModelGroup containers)

```html
<!-- ngModelGroup directly on the wrapper -->
<ngx-form-group-wrapper ngModelGroup="addresses">
  <ngx-control-wrapper>
    <input name="street" [ngModel]="formValue().addresses?.street" />
  </ngx-control-wrapper>
</ngx-form-group-wrapper>
```

### Error Display Modes

| Mode | Behavior |
|------|----------|
| `'on-blur-or-submit'` | Show after blur OR form submit (**default**) |
| `'on-blur'` | Show only after blur/touch |
| `'on-submit'` | Show only after form submission |
| `'on-dirty'` | Show as soon as value changes |
| `'always'` | Show immediately, even on pristine fields |

```typescript
// Global
providers: [{ provide: NGX_ERROR_DISPLAY_MODE_TOKEN, useValue: 'on-dirty' }]

// Per-instance
<ngx-control-wrapper [errorDisplayMode]="'on-blur'">
```

### Warning Display Modes

| Mode | Behavior |
|------|----------|
| `'on-validated-or-touch'` | Show after validation or touch (**default**) |
| `'on-touch'` | Show only after blur/touch |
| `'on-dirty'` | Show as soon as value changes |
| `'always'` | Show immediately |

### Wrapper Usage Conventions

- Prefer `<ngx-control-wrapper>` element for single-control wrappers
- Use `ngxFormGroupWrapper` attribute on semantic elements: `<fieldset ngxFormGroupWrapper ngModelGroup="addresses">`
- Use `<ngx-form-group-wrapper>` element when a dedicated group wrapper element improves readability
- For groups with multiple descendant controls, use group wrappers (not control wrappers) to avoid accidental control-level ARIA association
- Avoid `<div ngx-control-wrapper>` attribute form by default

## Nested Forms & ngModelGroup

Use `ngModelGroup` to create nested object structures. The `name` attribute inside the group is relative to the group:

```html
<form ngxVestForm [suite]="suite" [formValue]="formValue()"
      (formValueChange)="formValue.set($event)">
  <div ngModelGroup="user">
    <input name="firstName" [ngModel]="formValue().user?.firstName" />
    <input name="lastName" [ngModel]="formValue().user?.lastName" />
  </div>

  <div ngModelGroup="addresses">
    <div ngModelGroup="billing">
      <input name="street" [ngModel]="formValue().addresses?.billing?.street" />
      <input name="city" [ngModel]="formValue().addresses?.billing?.city" />
    </div>
  </div>
</form>
```

Validation tests use the **full dot-notation path**:

```typescript
test('user.firstName', 'Required', () => enforce(model.user?.firstName).isNotBlank());
test('addresses.billing.street', 'Required', () =>
  enforce(model.addresses?.billing?.street).isNotBlank()
);
```

## Child Components

Split forms into reusable child components. The critical requirement is `vestFormsViewProviders`:

```typescript
import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { NgxVestForms, vestFormsViewProviders } from 'ngx-vest-forms';

@Component({
  selector: 'app-address-form',
  imports: [NgxVestForms],
  viewProviders: [vestFormsViewProviders],  // REQUIRED for child components
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ngx-form-group-wrapper [ngModelGroup]="groupName()">
      <ngx-control-wrapper>
        <label [for]="groupName() + '-street'">Street</label>
        <input [id]="groupName() + '-street'" name="street"
               [ngModel]="address()?.street" />
      </ngx-control-wrapper>
      <ngx-control-wrapper>
        <label [for]="groupName() + '-city'">City</label>
        <input [id]="groupName() + '-city'" name="city"
               [ngModel]="address()?.city" />
      </ngx-control-wrapper>
    </ngx-form-group-wrapper>
  `
})
export class AddressFormComponent {
  readonly groupName = input.required<string>();
  readonly address = input<AddressModel>();
}
```

Parent usage:

```html
<form ngxVestForm [suite]="suite" (formValueChange)="formValue.set($event)">
  <app-address-form groupName="billingAddress"
                    [address]="formValue().billingAddress" />
  @if (formValue().shippingDifferent) {
    <app-address-form groupName="shippingAddress"
                      [address]="formValue().shippingAddress" />
  }
</form>
```

## Cross-field Validation

When field A's value affects field B's validation, use `validationConfig`:

```typescript
import { createValidationConfig } from 'ngx-vest-forms';

// Builder API (recommended)
protected readonly validationConfig = createValidationConfig<FormModel>()
  .bidirectional('password', 'confirmPassword')   // Revalidate each other
  .whenChanged('age', 'emergencyContact')          // age change revalidates emergencyContact
  .build();

// Manual object
protected readonly validationConfig = {
  'password': ['confirmPassword'],
  'confirmPassword': ['password'],
};
```

Template:

```html
<form ngxVestForm [validationConfig]="validationConfig" ...>
```

Reactive config for conditionally rendered fields:

```typescript
protected readonly validationConfig = computed(() => {
  const builder = createValidationConfig<FormModel>();
  if (this.formValue().gender === 'Other') {
    builder.whenChanged('gender', 'genderOther');
  }
  return builder.build();
});
```

## Root Form Validation

For form-level validations not tied to a specific field:

```typescript
import { ROOT_FORM } from 'ngx-vest-forms';

// In suite
test(ROOT_FORM, 'Passwords must match', () => {
  enforce(model.password).equals(model.confirmPassword);
});
```

```html
<form ngxVestForm ngxValidateRootForm [ngxValidateRootFormMode]="'submit'"
      (errorsChange)="errors.set($event)">
  @if (errors()[ROOT_FORM]) {
    <div role="alert">{{ errors()[ROOT_FORM][0] }}</div>
  }
</form>
```

Modes: `'submit'` (default, recommended) | `'live'` (validates on every change)

## Conditional Sections

Use `@if` with `omitWhen` in the validation suite:

```html
<label>
  <input type="checkbox" name="hasShipping"
         [ngModel]="formValue().hasShipping" />
  Different shipping address
</label>

@if (formValue().hasShipping) {
  <app-address-form groupName="shippingAddress"
                    [address]="formValue().shippingAddress" />
}
```

```typescript
// Suite
omitWhen(!model.hasShipping, () => {
  addressValidations(model.shippingAddress, 'shippingAddress');
});
```

## Async Validation

Vest supports async tests with automatic cancellation via `AbortSignal`:

```typescript
import { skipWhen } from 'vest';

export const suite: NgxVestSuite<FormModel> = staticSuite((model, field?) => {
  only(field);

  test('username', 'Required', () => enforce(model.username).isNotBlank());

  // Guard expensive async call with skipWhen
  skipWhen(res => res.hasErrors('username'), () => {
    test('username', 'Already taken', async ({ signal }) => {
      const response = await fetch(`/api/check?u=${model.username}`, { signal });
      const { taken } = await response.json();
      if (taken) throw new Error();
    });
  });
});
```

### Performance: Memoization and Debouncing

```typescript
// Cache deterministic async results (re-runs only when dependencies change)
test.memo('email', 'Already taken', async ({ signal }) => {
  const res = await fetch(`/api/check?e=${model.email}`, { signal });
  if (!(await res.json()).available) throw new Error();
}, [model.email]);

// Debounce live-typing fields (300ms delay)
test.debounce('search', 'No results found', () => searchAPI(model.query), 300);
```

## Composable Validations

Extract reusable validation functions:

```typescript
// address.validations.ts
export function addressValidations(address: AddressModel | undefined, prefix: string) {
  test(`${prefix}.street`, 'Street is required', () =>
    enforce(address?.street).isNotBlank()
  );
  test(`${prefix}.city`, 'City is required', () =>
    enforce(address?.city).isNotBlank()
  );
  test(`${prefix}.zip`, 'ZIP is required', () =>
    enforce(address?.zip).isNotBlank()
  );
}

// Main suite
export const suite: NgxVestSuite<FormModel> = staticSuite((model, field?) => {
  only(field);
  addressValidations(model.billing, 'billing');
  addressValidations(model.shipping, 'shipping');
});
```

## Dynamic Collections

Use `each()` from Vest to validate arrays:

```typescript
import { each } from 'vest';

export const suite: NgxVestSuite<FormModel> = staticSuite((model, field?) => {
  only(field);

  each(model.phoneNumbers, (phone, index) => {
    test(`phoneNumbers.${index}.number`, 'Phone is required', () =>
      enforce(phone?.number).isNotBlank()
    );
  });
});
```

## Form Actions & State

```typescript
protected readonly vestForm = viewChild.required('vestForm', { read: FormDirective });

// Reset form
reset() {
  this.formValue.set({});
  this.vestForm().resetForm();
}

// Trigger validation on structure changes
onStructureChange() {
  this.vestForm().triggerFormValidation();
}

// Read form state
readonly isValid = computed(() => this.vestForm().formState().valid);
readonly errors = computed(() => this.vestForm().formState().errors);
```

## Array Utilities

Convert between arrays (backend) and objects (ngModelGroup):

```typescript
import { arrayToObject, objectToArray } from 'ngx-vest-forms';

// Load: array → object for template-driven form
const formData = { phones: arrayToObject(['123', '456']) };
// Result: { phones: { 0: '123', 1: '456' } }

// Submit: object → array for backend
const apiData = objectToArray(formData, ['phones']);
// Result: { phones: ['123', '456'] }
```

### Field Clearing Utilities

```typescript
import { clearFieldsWhen, clearFields, setValueAtPath } from 'ngx-vest-forms';

// Clear fields when a condition is met
const cleaned = clearFieldsWhen(formValue, !formValue.hasShipping, ['shippingAddress']);

// Clear specific fields unconditionally
const cleaned = clearFields(formValue, ['temporaryField']);

// Set a value at a nested path
const updated = setValueAtPath(formValue, 'addresses.billing.city', 'Amsterdam');
```

## Warnings

Vest warnings are non-blocking — they don't make a field invalid:

```typescript
import { warn } from 'vest';

test('password', 'Password is weak', () => {
  warn();  // Call synchronously at start
  enforce(model.password).matches(/^(?=.*[A-Z])(?=.*\d)/);
});
```

Warnings display via `shouldShowWarnings()` and `warnings()` on `FormErrorDisplayDirective`.

## Custom Control Wrappers

Create project-specific error display components:

```typescript
import { FormErrorDisplayDirective, createDebouncedPendingState } from 'ngx-vest-forms';

@Component({
  selector: 'app-field',
  hostDirectives: [{ directive: FormErrorDisplayDirective, inputs: ['errorDisplayMode'] }],
  template: `
    <ng-content />
    @if (errorDisplay.shouldShowErrors()) {
      <div role="alert" aria-live="assertive">
        @for (error of errorDisplay.errors(); track error) { <span>{{ error }}</span> }
      </div>
    }
    @if (showPending()) {
      <div role="status" aria-live="polite">Validating...</div>
    }
  `
})
export class FieldComponent {
  protected readonly errorDisplay = inject(FormErrorDisplayDirective, { self: true });
  private readonly pending = createDebouncedPendingState(this.errorDisplay.isPending, {
    showAfter: 200,
    minimumDisplay: 500,
  });
  protected readonly showPending = this.pending.showPendingMessage;
}
```

Available signals: `shouldShowErrors()`, `shouldShowWarnings()`, `errors()`, `warnings()`, `isPending()`, `isValid()`, `isInvalid()`, `isTouched()`, `isDirty()`

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| `[(ngModel)]` | Use `[ngModel]` with `(formValueChange)` |
| `formValue().address.street` | Use `formValue().address?.street` (optional chaining) |
| `if(field){only(field)}` | Call `only(field)` unconditionally |
| Missing `viewProviders` in child | Add `viewProviders: [vestFormsViewProviders]` |
| `name="street"` for nested path | Use `name="address.street"` (full path within group) |
| Plain interface for model | Use `NgxDeepPartial<T>` |
| `FormControl` / `FormBuilder` | Not needed — ngx-vest-forms creates controls automatically |

## API Reference

### Imports

```typescript
// Core
import { NgxVestForms, vestFormsViewProviders, ROOT_FORM } from 'ngx-vest-forms';
import { staticSuite, test, enforce, only, omitWhen, skipWhen, warn } from 'vest';

// Types
import { NgxDeepPartial, NgxDeepRequired, NgxVestSuite, NgxTypedVestSuite,
         ValidationConfigMap, FieldPath, FormFieldName } from 'ngx-vest-forms';

// Utilities
import { createValidationConfig, createEmptyFormState, createDebouncedPendingState,
         arrayToObject, objectToArray, setValueAtPath, clearFieldsWhen } from 'ngx-vest-forms';

// Tokens
import { NGX_ERROR_DISPLAY_MODE_TOKEN, NGX_WARNING_DISPLAY_MODE_TOKEN,
         NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN } from 'ngx-vest-forms';
```

### Form Directive Inputs

| Input | Type | Description |
|-------|------|-------------|
| `suite` | `NgxVestSuite<T>` | Vest validation suite |
| `formValue` | `T` | Current form model value |
| `formShape` | `NgxDeepRequired<T>` | Dev-mode shape validation |
| `validationConfig` | `ValidationConfigMap<T>` | Dependent field revalidation map |
| `validationOptions` | `{ debounceTime?: number }` | Validation debounce settings |

### Form Directive Outputs

| Output | Type | Description |
|--------|------|-------------|
| `formValueChange` | `T` | Emits on value change |
| `validChange` | `boolean` | Emits when validity changes |
| `errorsChange` | `Record<string, string[]>` | Form-level errors (with ngxValidateRootForm) |
| `dirtyChange` | `boolean` | Emits when dirty state changes |

### Type Utilities

| Type | Purpose |
|------|--------|
| `NgxDeepPartial<T>` | All properties optional (form models) |
| `NgxDeepRequired<T>` | All properties required (shapes) |
| `NgxFormCompatibleDeepRequired<T>` | Like `NgxDeepRequired` but `Date` becomes `Date \| string` |
| `NgxVestSuite<T>` | Typed validation suite |
| `NgxTypedVestSuite<T>` | Suite with compile-time field name checking |
| `ValidationConfigMap<T>` | Type-safe validation config |
| `FieldPath<T>` | All valid dot-notation field paths |
| `FormFieldName<T>` | Field names for typed suite parameter |
| `NgxFormState<T>` | Form state: `{ valid, errors, rawValue }` |

### Utility Functions

| Function | Purpose |
|----------|---------|
| `createValidationConfig<T>()` | Fluent builder for validation config |
| `createEmptyFormState<T>()` | Safe initial form state |
| `createDebouncedPendingState()` | Debounced pending indicator for async validation |
| `arrayToObject()` / `objectToArray()` | Array <-> object conversion for `ngModelGroup` |
| `deepArrayToObject()` | Recursively convert nested arrays |
| `setValueAtPath()` | Set value at a nested dot-notation path |
| `clearFieldsWhen()` / `clearFields()` | Conditional/unconditional field clearing |
