---
description: ngx-vest-forms v2.0 - Angular Template-Driven Forms with Vest.js validation
applyTo: '**/*.ts, **/*.html'
---

# ngx-vest-forms Quick Reference

> **v2.0** | Angular 21+ | Vest.js 5.x | **See `vest.instructions.md` for validation patterns**

## Core Rules

| Rule | Correct | Wrong |
|------|---------|-------|
| Binding | `[ngModel]="formValue().name"` | `[(ngModel)]="formValue().name"` |
| Name = Path | `name="address.street"` | `name="street"` (missing path) |
| Optional chaining | `formValue().address?.street` | `formValue().address.street` |
| `only()` call | `only(field);` (unconditional) | `if(field){only(field)}` (breaks Vest!) |
| Nested components | `viewProviders: [vestFormsViewProviders]` | Missing viewProviders |

## Imports

```typescript
// Core
import { NgxVestForms, vestFormsViewProviders, ROOT_FORM } from 'ngx-vest-forms';
import { staticSuite, test, enforce, only, omitWhen } from 'vest';

// Types
import { NgxDeepPartial, NgxDeepRequired, NgxVestSuite, ValidationConfigMap, FieldPath } from 'ngx-vest-forms';

// Utilities
import { createValidationConfig, createEmptyFormState, createDebouncedPendingState } from 'ngx-vest-forms';
import { arrayToObject, objectToArray, setValueAtPath, clearFieldsWhen } from 'ngx-vest-forms';

// Tokens
import { NGX_ERROR_DISPLAY_MODE_TOKEN, NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN } from 'ngx-vest-forms';
```

## Quick Start

```typescript
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { NgxVestForms, NgxDeepPartial, NgxVestSuite } from 'ngx-vest-forms';
import { staticSuite, test, enforce, only } from 'vest';

type FormModel = NgxDeepPartial<{ firstName: string; email: string }>;

export const suite: NgxVestSuite<FormModel> = staticSuite((model, field?) => {
  only(field);  // ✅ ALWAYS unconditional
  test('firstName', 'Required', () => enforce(model.firstName).isNotBlank());
  test('email', 'Invalid', () => enforce(model.email).isEmail());
});

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxVestForms],
  template: `
    <form ngxVestForm [suite]="suite" [formValue]="formValue()" (formValueChange)="formValue.set($event)">
      <ngx-control-wrapper>
        <label for="firstName">First Name</label>
        <input id="firstName" name="firstName" [ngModel]="formValue().firstName" />
      </ngx-control-wrapper>
      <button type="submit">Submit</button>
    </form>
  `
})
export class MyFormComponent {
  protected readonly suite = suite;
  protected readonly formValue = signal<FormModel>({});
}
```

## Type-Safe Models

```typescript
// Form model: all optional (forms build incrementally)
type FormModel = NgxDeepPartial<{
  user: { firstName: string; email: string };
  addresses: { billing: { street: string; city: string } };
}>;

// Shape: all required (dev-mode validation)
export const formShape: NgxDeepRequired<FormModel> = {
  user: { firstName: '', email: '' },
  addresses: { billing: { street: '', city: '' } }
};

// For date fields
import { NgxFormCompatibleDeepRequired } from 'ngx-vest-forms';
// Date becomes Date | string in the shape
```

## Validation Patterns

> **Full details in `vest.instructions.md`**

```typescript
export const suite: NgxVestSuite<FormModel> = staticSuite((model, field?) => {
  only(field);  // ✅ CRITICAL: Never wrap in if()

  test('email', 'Required', () => enforce(model.email).isNotBlank());
  test('email', 'Invalid', () => enforce(model.email).isEmail());

  // Conditional validation
  omitWhen((model.age || 0) >= 18, () => {
    test('guardian', 'Required for minors', () => enforce(model.guardian).isNotBlank());
  });

  // Async validation
  test('username', 'Taken', async ({ signal }) => {
    await api.checkUsername(model.username, { signal });
  });
});

// Composable validations
function addressValidations(address: AddressModel | undefined, prefix: string) {
  test(`${prefix}.street`, 'Required', () => enforce(address?.street).isNotBlank());
  test(`${prefix}.city`, 'Required', () => enforce(address?.city).isNotBlank());
}
addressValidations(model.addresses?.billing, 'addresses.billing');
```

## validationConfig: Dependent Field Revalidation

When field A's value affects field B's validation, use `validationConfig`:

```typescript
import { createValidationConfig, ValidationConfigMap } from 'ngx-vest-forms';

// ✅ Builder API (recommended)
protected readonly validationConfig = createValidationConfig<FormModel>()
  .bidirectional('password', 'confirmPassword')  // Revalidate each other
  .whenChanged('age', 'emergencyContact')        // age change triggers emergencyContact
  .build();

// OR manual object
protected readonly validationConfig: ValidationConfigMap<FormModel> = {
  'password': ['confirmPassword'],
  'confirmPassword': ['password'],
};

// Template
<form ngxVestForm [validationConfig]="validationConfig" ...>
```

**Reactive config** for conditionally rendered fields:

```typescript
protected readonly validationConfig = computed(() => {
  const builder = createValidationConfig<FormModel>();
  if (this.formValue().gender === 'Other') {
    builder.whenChanged('gender', 'genderOther');
  }
  return builder.build();
});
```

## Error Display Components

### Control Wrapper (single controls)

```html
<ngx-control-wrapper>
  <label for="email">Email</label>
  <input id="email" name="email" [ngModel]="formValue().email" />
  <!-- Errors display automatically with ARIA attributes -->
</ngx-control-wrapper>
```

### Form Group Wrapper (ngModelGroup containers)

```html
<!-- ngModelGroup directly on wrapper (recommended) -->
<ngx-form-group-wrapper ngModelGroup="addresses">
  <ngx-control-wrapper>
    <input name="street" [ngModel]="formValue().addresses?.street" />
  </ngx-control-wrapper>
</ngx-form-group-wrapper>
```

### Error Display Modes

```typescript
// Global config
providers: [{ provide: NGX_ERROR_DISPLAY_MODE_TOKEN, useValue: 'on-submit' }]

// Per-instance: 'on-blur' | 'on-submit' | 'on-blur-or-submit' (default)
<div formErrorDisplay [errorDisplayMode]="'on-blur'">...</div>
```

### Custom Wrappers

```typescript
import { FormErrorDisplayDirective, createDebouncedPendingState } from 'ngx-vest-forms';

@Component({
  selector: 'app-custom-wrapper',
  hostDirectives: [{ directive: FormErrorDisplayDirective, inputs: ['errorDisplayMode'] }],
  template: `
    <ng-content />
    @if (errorDisplay.shouldShowErrors()) {
      <div role="alert" aria-live="assertive">
        @for (error of errorDisplay.errors(); track error) { <span>{{ error }}</span> }
      </div>
    }
    @if (showPending()) { <div role="status" aria-live="polite">Validating...</div> }
  `
})
export class CustomWrapperComponent {
  protected readonly errorDisplay = inject(FormErrorDisplayDirective, { self: true });
  private readonly pending = createDebouncedPendingState(this.errorDisplay.isPending, { showAfter: 200, minimumDisplay: 500 });
  protected readonly showPending = this.pending.showPendingMessage;
}
```

**Available signals:** `shouldShowErrors()`, `errors()`, `warnings()`, `isPending()`, `isValid()`, `isInvalid()`, `isTouched()`, `isDirty()`

**Warnings behavior:**

- Warnings are **non-blocking** and do not make a field invalid.
- Warnings are stored separately from `control.errors` and are cleared on `resetForm()`.
- Warnings may appear after `validationConfig` triggers validation, even if the field
  was not touched yet.

## Root Form Validation

For form-level validations (errors not tied to a specific field):

```typescript
import { ROOT_FORM } from 'ngx-vest-forms';

// Suite
test(ROOT_FORM, 'Passwords must match', () => {
  enforce(model.password).equals(model.confirmPassword);
});

// Template
<form ngxVestForm ngxValidateRootForm [ngxValidateRootFormMode]="'submit'" (errorsChange)="errors.set($event)">
  @if (errors()[ROOT_FORM]) {
    <div role="alert">{{ errors()[ROOT_FORM][0] }}</div>
  }
</form>
```

**Modes:** `'submit'` (default, recommended) | `'live'` (validates on every change)

## Nested Components

```typescript
@Component({
  selector: 'app-address-form',
  imports: [NgxVestForms],
  viewProviders: [vestFormsViewProviders],  // ✅ REQUIRED
  template: `
    <ngx-form-group-wrapper [ngModelGroup]="groupName()">
      <ngx-control-wrapper>
        <input name="street" [ngModel]="address()?.street" />
      </ngx-control-wrapper>
    </ngx-form-group-wrapper>
  `
})
export class AddressFormComponent {
  readonly groupName = input.required<string>();
  readonly address = input<AddressModel>();
}
```

## Array Utilities

```typescript
import { arrayToObject, objectToArray } from 'ngx-vest-forms';

// Load: array → object for ngModelGroup
const formModel = { phones: arrayToObject(['123', '456']) }; // { phones: { 0: '123', 1: '456' } }

// Submit: object → array for backend
const backendData = objectToArray(formModel, ['phones']); // { phones: ['123', '456'] }
```

## Form Control Methods

```typescript
protected readonly vestForm = viewChild.required('vestForm', { read: FormDirective });

// Reset form
reset() {
  this.formValue.set({});
  this.vestForm().resetForm();
}

// Trigger validation manually (structure changes without value changes)
onStructureChange() {
  this.vestForm().triggerFormValidation();
}
```

## API Reference

### Form Directive Inputs

| Input | Type | Description |
|-------|------|-------------|
| `suite` | `NgxVestSuite<T>` | Vest validation suite |
| `formValue` | `T` | Current form model value |
| `formShape` | `NgxDeepRequired<T>` | Dev-mode shape validation |
| `validationConfig` | `ValidationConfigMap<T>` | Dependent field revalidation map |
| `validationOptions` | `{ debounceTime?: number }` | Validation debounce options |

### Form Directive Outputs

| Output | Type | Description |
|--------|------|-------------|
| `formValueChange` | `T` | Emits on any value change |
| `validChange` | `boolean` | Emits when validity changes |
| `errorsChange` | `Record<string, string[]>` | Emits form-level errors (with ngxValidateRootForm) |

### Type Utilities

| Type | Purpose |
|------|---------|
| `NgxDeepPartial<T>` | All properties optional (form models) |
| `NgxDeepRequired<T>` | All properties required (shapes) |
| `NgxVestSuite<T>` | Typed validation suite |
| `ValidationConfigMap<T>` | Type-safe validation config |
| `FieldPath<T>` | All valid field paths for autocomplete |
| `NgxFormState<T>` | Form state type |

### Utility Functions

| Function | Purpose |
|----------|---------|
| `createValidationConfig<T>()` | Fluent builder for validation config |
| `createEmptyFormState<T>()` | Safe initial form state |
| `createDebouncedPendingState()` | Debounced pending indicator |
| `arrayToObject()` / `objectToArray()` | Array ↔ object conversion |
| `setValueAtPath()` | Set nested value |
| `clearFieldsWhen()` / `clearFields()` | Field clearing utilities |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| `[(ngModel)]` | Use `[ngModel]` with `(formValueChange)` |
| `formValue().address.street` | Use `formValue().address?.street` (optional chaining) |
| `if(field){only(field)}` | Call `only(field)` unconditionally |
| Missing `viewProviders` in nested component | Add `viewProviders: [vestFormsViewProviders]` |
| `name="street"` for nested path | Use `name="address.street"` (full path) |

## Resources

- [Vest.js Docs](https://vestjs.dev/)
- [Migration Guide v1→v2](../../docs/migration/MIGRATION-v1.x-to-v2.0.0.md)
- [Complete Example](../../docs/COMPLETE-EXAMPLE.md)
- [Accessibility Guide](../../.github/instructions/a11y.instructions.md)

