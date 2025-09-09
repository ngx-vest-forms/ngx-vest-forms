# ngx-vest-forms: Angular Template-Driven Forms with Vest.js Validation

## What is ngx-vest-forms?

ngx-vest-forms is a lightweight adapter that bridges Angular template-driven forms with Vest.js validation, created by [Brecht Billiet](https://blog.simplified.courses/introducing-ngx-vest-forms/). It enables unidirectional data flow in forms with sophisticated async validations and conditional logic, making complex form handling both simple and maintainable.

### Core Philosophy
- **Unidirectional Data Flow**: Use `[ngModel]` (NOT `[(ngModel)]`) for clean architecture
- **Type Safety**: Template-driven forms with full TypeScript support
- **Performance First**: Vest.js `only()` pattern for optimized field-level validation
- **Simplicity**: Minimal boilerplate with maximum functionality
- **Battle-Tested**: Production-ready solution used in large-scale applications

> **Note**: For comprehensive Vest.js validation patterns and advanced techniques, see `.github/instructions/vest.instructions.md`

## Prerequisites

**Note**: For exact version requirements, see main copilot instructions which define workspace-compatible versions.

## Installation

```bash
npm install ngx-vest-forms vest
```

## Quick Start Guide

### 1. Basic Form Setup

```typescript
import { Component, signal } from '@angular/core';
import { vestForms, DeepPartial } from 'ngx-vest-forms';

// Define your form model with DeepPartial for incremental building
type MyFormModel = DeepPartial<{
  generalInfo: {
    firstName: string;
    lastName: string;
  }
}>

@Component({
  selector: 'app-my-form',
  standalone: true,
  imports: [vestForms],
  template: `
    <form scVestForm
          (formValueChange)="formValue.set($event)"
          (ngSubmit)="onSubmit()">
      <div ngModelGroup="generalInfo">
        <label>First name</label>
        <input name="firstName" [ngModel]="formValue().generalInfo?.firstName"/>

        <label>Last name</label>
        <input name="lastName" [ngModel]="formValue().generalInfo?.lastName"/>
      </div>

      <button type="submit">Submit</button>
    </form>
  `
})
export class MyFormComponent {
  protected readonly formValue = signal<MyFormModel>({});

  onSubmit() {
    console.log('Form submitted:', this.formValue());
  }
}
```

### 2. Adding Validation

```typescript
// validations/my-form.validations.ts
import { enforce, only, staticSuite, test } from 'vest';
import { MyFormModel } from '../models/my-form.model';

export const myFormValidationSuite = staticSuite(
  (model: MyFormModel, field?: string) => {
    // For complete staticSuite patterns, see: .github/instructions/vest.instructions.md
    if (field) { only(field); }

    test('generalInfo.firstName', 'First name is required', () => {
      enforce(model.generalInfo?.firstName).isNotBlank();
    });

    test('generalInfo.lastName', 'Last name is required', () => {
      enforce(model.generalInfo?.lastName).isNotBlank();
    });
  }
);
```

```typescript
// Updated component with validation
@Component({
  template: `
    <form scVestForm
          [suite]="validationSuite"
          (formValueChange)="formValue.set($event)"
          (ngSubmit)="onSubmit()">
      <div ngModelGroup="generalInfo" sc-control-wrapper>
        <div sc-control-wrapper>
          <label>First name</label>
          <input name="firstName" [ngModel]="formValue().generalInfo?.firstName"/>
        </div>

        <div sc-control-wrapper>
          <label>Last name</label>
          <input name="lastName" [ngModel]="formValue().generalInfo?.lastName"/>
        </div>
      </div>
    </form>
  `
})
export class MyFormComponent {
  protected readonly formValue = signal<MyFormModel>({});
  protected readonly validationSuite = myFormValidationSuite;
}
```

## CRITICAL: Name Attribute Matching

**The most important rule**: The `name` attribute MUST exactly match the property path used in `[ngModel]` bindings.

```typescript
// ✅ CORRECT Examples
<input name="firstName" [ngModel]="formValue().firstName" />
<input name="generalInfo.firstName" [ngModel]="formValue().generalInfo?.firstName" />

<div ngModelGroup="addresses">
  <div ngModelGroup="billingAddress">
    <input name="street" [ngModel]="formValue().addresses?.billingAddress?.street" />
  </div>
</div>

// ❌ WRONG Examples
<input name="first_name" [ngModel]="formValue().firstName" />
<input name="firstName" [ngModel]="formValue().generalInfo?.firstName" />
<input name="street" [ngModel]="formValue().addresses?.billingAddress?.street" />
```

### Why This Matters
- **Form Control Creation**: Angular creates form controls based on the `name` attribute
- **Validation Mapping**: Vest.js validation errors are mapped using these paths
- **Shape Validation**: Development-time validation ensures consistency
- **Unidirectional Flow**: Proper data binding requires exact path matching

## Essential Patterns

### Form Models with Type Safety

```typescript
import { DeepPartial, DeepRequired } from 'ngx-vest-forms';

// Form model (what the form builds incrementally)
export type PurchaseFormModel = DeepPartial<{
  generalInfo: {
    firstName: string;
    lastName: string;
    email: string;
  };
  addresses: {
    billingAddress: AddressModel;
    shippingAddress?: AddressModel;
    shippingAddressDifferentFromBilling: boolean;
  };
}>;

// Shape for runtime validation (complete structure)
export const purchaseFormShape: DeepRequired<PurchaseFormModel> = {
  generalInfo: {
    firstName: '',
    lastName: '',
    email: ''
  },
  addresses: {
    billingAddress: {
      street: '',
      number: '',
      city: '',
      zipcode: '',
      country: ''
    },
    shippingAddress: {
      street: '',
      number: '',
      city: '',
      zipcode: '',
      country: ''
    },
    shippingAddressDifferentFromBilling: false
  }
};
```

### Unidirectional Data Flow

```typescript
@Component({
  template: `
    <form scVestForm
          [formShape]="formShape"
          [suite]="validationSuite"
          (formValueChange)="formValue.set($event)">
      <!-- Use [ngModel] NOT [(ngModel)] -->
      <input [ngModel]="formValue().email" name="email"/>
    </form>
  `
})
export class MyComponent {
  protected readonly formValue = signal<MyFormModel>({});
  protected readonly formShape = myFormShape;
  protected readonly validationSuite = myValidationSuite;
}
```

### Performance-Optimized Validation Suites

```typescript
export const validationSuite = staticSuite(
  (model: FormModel, field?: string) => {
    // ALWAYS include this performance optimization
    if (field) {
      only(field); // Only validate the changed field
    }

    test('email', 'Email is required', () => {
      enforce(model.email).isNotBlank();
    });

    test('email', 'Email must be valid', () => {
      enforce(model.email).matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });
  }
);
```

### Conditional Validations

```typescript
import { omitWhen } from 'vest';

// Angular-specific conditional validation example:
omitWhen((model.age || 0) >= 18, () => {
  test('emergencyContact', 'Emergency contact is required for minors', () => {
    enforce(model.emergencyContact).isNotBlank();
  });
});
```

> **Complete Conditional Patterns**: See `.github/instructions/vest.instructions.md` for comprehensive conditional validation techniques including `omitWhen`, `skipWhen`, and complex conditions.

### Composable Validations

```typescript
// Angular-specific reusable validation example:
export function addressValidations(model: AddressModel | undefined, field: string): void {
  test(`${field}.street`, 'Street is required', () => {
    enforce(model?.street).isNotBlank();
  });
}

// Usage in main suite:
addressValidations(model.addresses?.billingAddress, 'addresses.billingAddress');
```

> **Advanced Composition**: See `.github/instructions/vest.instructions.md` for comprehensive composable validation patterns and suite organization strategies.

### Async Validations

```typescript
// Angular service integration example:
export const createAsyncValidationSuite = (apiService: ApiService) => {
  return staticSuite((model: FormModel, field?: string) => {
    if (field) { only(field); }

    test('username', 'Username is already taken', async ({ signal }) => {
      return await apiService.checkUsername(model.username, { signal });
    });
  });
};
```

> **Complete Async Patterns**: See `.github/instructions/vest.instructions.md` for comprehensive async validation techniques, AbortController usage, and performance optimization.

### Dependent Field Validation

#### Understanding the Architectural Separation

**Critical Concept**: Vest.js and Angular handle different aspects of form validation:

| Responsibility | Handled By | Description |
|---|---|---|
| **Validation Logic** | Vest.js | Defines what makes a field valid/invalid |
| **Form Control Lifecycle** | Angular | When to run validation and update UI |
| **Cross-field Dependencies** | `validationConfig` | Tells Angular when to revalidate related fields |

**Why `validationConfig` Cannot Be Replaced:**

Vest.js can express cross-field validation logic (e.g., "passwords must match"), but it **cannot trigger Angular to revalidate a different form control** when a dependency changes. Only Angular can call `updateValueAndValidity()` on form controls.

**The Gap `validationConfig` Fills:**

```typescript
// ❌ Without validationConfig:
// User changes password → only password field validates
// confirmPassword field shows stale validation state

// ✅ With validationConfig:
// User changes password → both password AND confirmPassword validate
// All dependent fields show current validation state
```

#### Implementation Pattern

```typescript
// Component
protected readonly validationConfig = {
  'passwords.password': ['passwords.confirmPassword'],
  'age': ['emergencyContact']
};

// Validation suite
omitWhen(!model.passwords?.password || !model.passwords?.confirmPassword, () => {
  test('passwords.confirmPassword', 'Passwords do not match', () => {
    enforce(model.passwords?.confirmPassword).equals(model.passwords?.password);
  });
});
```

### Conditional UI with Computed Signals

```typescript
@Component({
  template: `
    @if (showShippingAddress()) {
      <div ngModelGroup="shippingAddress">
        <!-- Shipping address fields -->
      </div>
    }
  `
})
export class MyComponent {
  protected readonly formValue = signal<FormModel>({});

  protected readonly showShippingAddress = computed(() =>
    this.formValue().addresses?.shippingAddressDifferentFromBilling
  );
}
```

## Error Display

### Using Control Wrapper Component

```typescript
<form scVestForm [suite]="validationSuite">
  <div ngModelGroup="generalInfo" sc-control-wrapper>
    <div sc-control-wrapper>
      <label>First name</label>
      <input name="firstName" [ngModel]="formValue().generalInfo?.firstName"/>
      <!-- Errors display automatically -->
    </div>
  </div>
</form>
```

### Root Form Validation

```typescript
import { ROOT_FORM } from 'ngx-vest-forms';

// In validation suite
test(ROOT_FORM, 'Form-level validation error', () => {
  enforce(someCondition).isTruthy();
});

// In component
<form scVestForm
      [validateRootForm]="true"
      (errorsChange)="errors.set($event)">
</form>
```

## Advanced Features

### Shape Validation (Development Mode)
Automatically validates that your `name` attributes match your form structure:

```typescript
<form scVestForm [formShape]="formShape">
  <!-- Development mode will warn about mismatched names -->
</form>
```

### Validation Options

```typescript
protected readonly validationOptions = {
  debounceTime: 300 // Debounce validation calls
};

<form scVestForm [validationOptions]="validationOptions">
```

### Form Arrays Support
For dynamic form arrays, see the [comprehensive form arrays guide](https://blog.simplified.courses/template-driven-forms-with-form-arrays/).

## Common Patterns

### Loading States

```typescript
protected readonly isLoading = signal(false);

async onSubmit() {
  this.isLoading.set(true);
  try {
    await this.apiService.submitForm(this.formValue());
  } finally {
    this.isLoading.set(false);
  }
}
```

### Form Reset

```typescript
resetForm() {
  this.formValue.set({});
}
```

### Prefilling Forms

```typescript
ngOnInit() {
  // Load existing data
  this.formValue.set({
    generalInfo: {
      firstName: 'John',
      lastName: 'Doe'
    }
  });
}
```

#### When to Use Each Approach

**Use Vest.js `omitWhen()` for:**
- Conditional validation logic (e.g., "validate field X only if condition Y")
- Complex business rules within the validation suite
- Optimizing which validations run

**Use `validationConfig` for:**
- Triggering Angular to revalidate dependent fields
- Cross-field dependencies where changing field X should revalidate field Y
- Ensuring UI error states update correctly

**Example - Both Working Together:**
```typescript
// validationConfig: Tells Angular WHEN to revalidate
protected readonly validationConfig = {
  'password': ['confirmPassword']
};

// Vest suite: Defines WHAT validation logic to run
omitWhen(!model.password || !model.confirmPassword, () => {
  test('confirmPassword', 'Passwords must match', () => {
    enforce(model.confirmPassword).equals(model.password);
  });
});
```

## Common Gotchas & Solutions

### ❌ Wrong: Using Two-Way Binding
```typescript
<input [(ngModel)]="formValue().firstName" name="firstName"/>
```

### ✅ Correct: Using One-Way Binding
```typescript
<input [ngModel]="formValue().firstName" name="firstName"/>
```

### ❌ Wrong: Missing Optional Chaining
```typescript
<input [ngModel]="formValue().generalInfo.firstName" name="firstName"/>
```

### ✅ Correct: Using Optional Chaining
```typescript
<input [ngModel]="formValue().generalInfo?.firstName" name="firstName"/>
```

### ❌ Wrong: Missing `only()` Pattern
```typescript
export const suite = staticSuite((model: FormModel) => {
  // Missing field parameter and only() optimization
});
```

### ✅ Correct: Including `only()` Pattern
```typescript
export const suite = staticSuite((model: FormModel, field?: string) => {
  if (field) { only(field); } // Critical for performance
});
```

> **Performance Details**: See `.github/instructions/vest.instructions.md` for comprehensive performance optimization strategies.

## Best Practices

1. **Always use `DeepPartial<T>` for form models** - Forms build incrementally
2. **Always use the `only(field)` pattern** - Critical for performance (see vest.instructions.md)
3. **Match `name` attributes exactly to property paths** - Essential for binding
4. **Use computed signals for conditional UI** - Reactive and performant
5. **Compose validation suites** - Reusable and maintainable (see vest.instructions.md)
6. **Handle async validations properly** - Use AbortController (see vest.instructions.md)
7. **Test validation suites independently** - They're just functions
8. **Use shape validation in development** - Catches typos early

## Resources

- **Original Blog Post**: https://blog.simplified.courses/introducing-ngx-vest-forms/
- **Vest.js Documentation**: https://vestjs.dev/
- **Angular Template-Driven Forms**: https://angular.dev/guide/forms/template-driven-forms
- **Form Arrays Guide**: https://blog.simplified.courses/template-driven-forms-with-form-arrays/
- **Async Validation Article**: https://blog.simplified.courses/asynchronous-form-validators-in-angular-with-vest/

## Credits

ngx-vest-forms was created by [Brecht Billiet](https://twitter.com/brechtbilliet) and is inspired by his extensive work on Angular forms and the principles of clean, maintainable code architecture.
