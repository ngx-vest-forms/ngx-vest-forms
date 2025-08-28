---
description: 'Best practices and guidelines for using ngx-vest-forms with Angular Template Driven Forms and Vest.js validation'
applyTo: '**/*.{ts,html,component.ts}'
---

# ngx-vest-forms Instructions

## Overview

`ngx-vest-forms` is a lightweight adapter that integrates Vest.js validation with Angular Template Driven Forms. It provides unidirectional data flow, type safety, and powerful validation capabilities without boilerplate code.

Note: Examples target Vest v5 APIs (staticSuite, only(field), async test signal). If you are on an older Vest version, upgrade or adapt accordingly.

## Core Principles

### 1. Form Structure Pattern

Always follow this three-part pattern:

1. **Model Signal**: Use a signal for the form data model
2. **Vest Suite**: Define validation in a separate `*.validations.ts` file
3. **Template**: Connect with `ngxVestForm` directive and proper bindings

#### Example Structure

```typescript
// user.model.ts
export interface UserModel {
  name: string;
  email: string;
}

// user.validations.ts
import { staticSuite, test, enforce, only } from 'vest';

export const userValidations = staticSuite(
  (data: Partial<UserModel> = {}, field?: string) => {
    only(field); // Optimize: only validate changed field

    test('name', 'Name is required', () => {
      enforce(data.name).isNotEmpty();
    });

    test('email', 'Email must be valid', () => {
      enforce(data.email)
        .isNotEmpty()
        .matches(/^[^@]+@[^@]+\.[^@]+$/);
    });
  },
);

// user-form.component.ts
@Component({
  // Prefer OnPush in real components
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ngxVestForms, NgxControlWrapper],
  template: `...`,
})
export class UserFormComponent {
  protected readonly model = signal<UserModel>({ name: '', email: '' });
  protected readonly suite = userValidations;
}
```

## Critical Binding Rules

### 2. Form Control Naming Convention

**⚠️ CRITICAL**: The `name` attribute MUST exactly match the model property name.

```html
<!-- ✅ CORRECT - name matches model property -->
<input name="email" [ngModel]="model().email" />

<!-- ❌ WRONG - name doesn't match -->
<input name="userEmail" [ngModel]="model().email" />
```

**Why**: Vest validates against model properties, Angular registers controls by `name`. Mismatches prevent error display.

### 3. Always Use One-Way Binding with [ngModel]

**✅ ALWAYS use `[ngModel]` (one-way binding)**

```html
<input name="email" [ngModel]="model().email" />
```

**❌ AVOID bare `ngModel` or two-way `[(ngModel)]`**

```html
<!-- Don't use these patterns -->
<input name="email" ngModel />
<input name="email" [(ngModel)]="model().email" />
```

**Reasoning**:

- `[(formValue)]` on the form already handles two-way synchronization
- One-way `[ngModel]` maintains unidirectional data flow
- Prevents race conditions and duplicate updates
- Ensures proper initial value hydration

### 4. Form Directive Setup

Always use this pattern for the form element:

```html
<form
  ngxVestForm
  [vestSuite]="suite"
  [(formValue)]="model"
  #vestForm="ngxVestForm"
>
  <!-- form fields -->
</form>
```

For schema validation, use the wrapper directive:

```html
<form
  ngxVestFormWithSchema
  [vestSuite]="suite"
  [formSchema]="schema"
  [(formValue)]="model"
  #vestForm="ngxVestForm"
>
  <!-- form fields -->
</form>
```

## Form State API

`vestForm.formState()` returns reactive, memoized state of the form:

- valid: boolean — true when there are no errors and no pending validations
- pending: boolean — true while any async test is inflight
- errors: Record<string, string[]> — keys are control paths (e.g., `email`, `address.street`, `items.0.name`)
- warnings?: Record<string, string[]> — optional warnings when enabled

Tip: Prefer computed signals when deriving UI state from formState() to avoid unnecessary recalculation.

## Validation Suite Best Practices

### 5. Suite Structure

```typescript
import { staticSuite, test, enforce, only, omitWhen } from 'vest';

export const formValidations = staticSuite(
  (data: Partial<FormModel> = {}, field?: string) => {
    // ALWAYS include this for performance
    only(field);

    // Simple validation
    test('fieldName', 'Error message', () => {
      enforce(data.fieldName).isNotEmpty();
    });

    // Conditional validation
    omitWhen(!data.isRequired, () => {
      test('conditionalField', 'This field is required', () => {
        enforce(data.conditionalField).isNotEmpty();
      });
    });

    // Async validation
    test('username', 'Username already taken', async ({ signal }) => {
      // Use signal for cancellation
      await checkUsernameAvailability(data.username, signal);
    });
  },
);
```

### 6. Cross-Field Validation

For validations involving multiple fields:

```typescript
import { NGX_ROOT_FORM } from 'ngx-vest-forms/core';

export const crossFieldValidations = staticSuite(
  (data: Partial<FormModel> = {}) => {
    // Password confirmation
    test(NGX_ROOT_FORM, 'Passwords must match', () => {
      enforce(data.confirmPassword).equals(data.password);
    });
  },
);
```

Use in template:

```html
<form
  ngxVestForm
  [vestSuite]="fieldSuite"
  formLevelValidation
  [formLevelSuite]="crossFieldSuite"
  [(formValue)]="model"
></form>
```

Which suite goes where:

- Field-level suite (`[vestSuite]`): per-control rules keyed by control paths.
- Form-level suite (`[formLevelSuite]` with `formLevelValidation`): rules that involve multiple fields or the entire model (`NGX_ROOT_FORM`).

## Error Display Patterns

### 7. Using NgxControlWrapper

The recommended approach for error display:

```html
<ngx-control-wrapper>
  <label for="email">Email</label>
  <input id="email" name="email" [ngModel]="model().email" type="email" />
</ngx-control-wrapper>
```

### 8. Custom Error Display

### 8.1 Minimal Example Error Display (Why We Use The Directive Early)

Even in the most minimal single-field example, prefer the `NgxFormErrorDisplayDirective` instead of hand-rolled conditionals like:

```html
<!-- Avoid in new examples -->
@if (vestForm.formState().errors.email) {
<div role="alert">{{ vestForm.formState().errors.email[0] }}</div>
}
```

Recommended:

```html
<div ngxFormErrorDisplay #display="formErrorDisplay">
  <input name="email" [ngModel]="model().email" />
  @if (display.shouldShowErrors() && display.errors().length) {
  <div role="alert">{{ display.errors()[0] }}</div>
  }
</div>
```

Rationale:

- Consistent UX: Default mode (on-blur-or-submit) prevents premature error flashing
- Accessibility: Encourages proper `aria-invalid` and `role="alert"` pairing
- Async Safety: Filters pending validation states to avoid flicker
- Copy-Paste Ready: Developers replicate a robust pattern, not a teaching shortcut
- Extensible: Switch modes via `errorDisplayMode` without rewriting logic

Shortcut patterns are acceptable in internal prototypes but should not appear in public-facing starter examples.

For custom error handling:

```html
<div>
  <input name="email" [ngModel]="model().email" #emailControl="ngModel" />
  @if (vestForm.formState().errors.email) { @for (error of
  vestForm.formState().errors.email; track error) {
  <span class="error">{{ error }}</span>
  } }
</div>
```

## Quick Start: Minimal Component (copy-paste)

```typescript
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ngxVestForms } from 'ngx-vest-forms/core';
import { NgxControlWrapper } from 'ngx-vest-forms/control-wrapper';
import { staticSuite, test, enforce, only } from 'vest';

interface UserModel {
  name: string;
  email: string;
}

export const userValidations = staticSuite(
  (data: Partial<UserModel> = {}, field?: string) => {
    only(field);
    test('name', 'Name is required', () => enforce(data.name).isNotEmpty());
    test('email', 'Email must be valid', () =>
      enforce(data.email)
        .isNotEmpty()
        .matches(/^[^@]+@[^@]+\.[^@]+$/),
    );
  },
);

@Component({
  standalone: true,
  selector: 'app-user-form',
  imports: [ngxVestForms, NgxControlWrapper],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form
      ngxVestForm
      [vestSuite]="suite"
      [(formValue)]="model"
      #vestForm="ngxVestForm"
      (ngSubmit)="onSubmit()"
    >
      <ngx-control-wrapper>
        <label>Name</label>
        <input name="name" [ngModel]="model().name" />
      </ngx-control-wrapper>
      <ngx-control-wrapper>
        <label>Email</label>
        <input name="email" [ngModel]="model().email" type="email" />
      </ngx-control-wrapper>
      <button
        type="submit"
        [disabled]="!vestForm.formState().valid || vestForm.formState().pending"
      >
        Submit
      </button>
    </form>
  `,
})
export class UserFormComponent {
  protected readonly model = signal<UserModel>({ name: '', email: '' });
  protected readonly suite = userValidations;
  onSubmit() {
    const data = this.model();
    // ... submit logic
  }
}
```

## Working with Complex Forms

### 9. Nested Objects with ngModelGroup

```html
<div ngModelGroup="address">
  <input name="street" [ngModel]="model().address.street" />
  <input name="city" [ngModel]="model().address.city" />
  <input name="zipCode" [ngModel]="model().address.zipCode" />
</div>
```

Validation suite:

```typescript
test('address.street', 'Street is required', () => {
  enforce(data.address?.street).isNotEmpty();
});
```

### 10. Form Arrays

```typescript
// Component
protected readonly model = signal<FormModel>({
  items: [{ name: '', quantity: 0 }]
});

addItem() {
  this.model.update(m => ({
    ...m,
    items: [...m.items, { name: '', quantity: 0 }]
  }));
}

removeItem(index: number) {
  this.model.update(m => ({
    ...m,
    items: m.items.filter((_, i) => i !== index)
  }));
}
```

Template:

```html
@for (item of model().items; track item; let i = $index) {
<div [ngModelGroup]="'items.' + i">
  <input [name]="'name'" [ngModel]="item.name" />
  <input [name]="'quantity'" [ngModel]="item.quantity" type="number" />
  <button type="button" (click)="removeItem(i)">Remove</button>
</div>
}
<button type="button" (click)="addItem()">Add Item</button>
```

Path naming details for arrays:

- Control names remain simple property names (`name`, `quantity`).
- The full path seen by validation and errors is `items.<index>.<name>` (e.g., `items.0.name`).
- Example suite rules:

```typescript
test('items.0.name', 'Item name is required', () =>
  enforce(data.items?.[0]?.name).isNotEmpty(),
);
```

## Type Safety

### 11. Using Schemas for Type Safety

With Zod:

```typescript
import { z } from 'zod';

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email()
});

type User = z.infer<typeof userSchema>;

// Component
protected readonly model = signal<User>({ name: '', email: '' });
protected readonly schema = userSchema;
```

### 12. Form-Compatible Types

Use utility types for form compatibility:

```typescript
import { NgxFormCompatibleDeepRequired } from 'ngx-vest-forms/core';

// Handles Date to string conversions for forms
type FormModel = NgxFormCompatibleDeepRequired<{
  name: string;
  birthDate: Date; // Will be string in form
}>;
```

## Utility Types and Functions

### 18. Library Utility Types

ngx-vest-forms provides several utility types exported from `ngx-vest-forms/core`:

```typescript
import {
  NgxDeepPartial,
  NgxDeepRequired,
  NgxFormCompatibleDeepRequired,
  arrayToObject,
  objectToArray,
} from 'ngx-vest-forms/core';
```

#### NgxDeepPartial&lt;T&gt;

Makes every property and child property partial recursively. Template-driven forms are inherently deep partial since they're created by the DOM.

```typescript
interface UserModel {
  name: string;
  profile: {
    age: number;
    isActive: boolean;
  };
}

// Result: all properties become optional recursively
type PartialUser = NgxDeepPartial<UserModel>;
// {
//   name?: string;
//   profile?: {
//     age?: number;
//     isActive?: boolean;
//   };
// }
```

#### NgxDeepRequired&lt;T&gt;

Makes every property required recursively:

```typescript
interface OptionalModel {
  name?: string;
  profile?: {
    age?: number;
  };
}

type RequiredModel = NgxDeepRequired<OptionalModel>;
// {
//   name: string;
//   profile: {
//     age: number;
//   };
// }
```

#### NgxFormCompatibleDeepRequired&lt;T&gt;

**Recommended for form models with Date fields.** Solves the `Date !== string` type mismatch that occurs in form initialization:

```typescript
interface UserModel {
  id?: number;
  name?: string;
  birthDate?: Date;
  profile?: {
    createdAt?: Date;
    isActive?: boolean;
  };
}

type FormUser = NgxFormCompatibleDeepRequired<UserModel>;
// {
//   id: number;
//   name: string;
//   birthDate: Date | string;  // <-- Only Date gets union treatment
//   profile: {
//     createdAt: Date | string;  // <-- Recursive application
//     isActive: boolean;         // <-- Other types unchanged
//   };
// }

// Now you can safely initialize with empty strings for dates:
const formData: FormUser = {
  id: 0,
  name: '',
  birthDate: '', // ✅ Valid: string allowed for Date properties
  profile: {
    createdAt: '', // ✅ Valid: works recursively
    isActive: false,
  },
};
```

### 19. Array/Object Conversion Utilities

For dynamic lists and arrays in template-driven forms:

### Array/Object Conversion Utilities

For dynamic lists and arrays in template-driven forms:

#### arrayToObject&lt;T&gt;(array: T[]): Record&lt;number, T&gt;

Converts arrays to objects with numeric keys (required for ngModelGroup):

```typescript
import { arrayToObject } from 'ngx-vest-forms/core';

// Component method
private updatePhoneNumbers(numbers: string[]): void {
  const phoneObject = arrayToObject(numbers);
  // ['123', '456'] becomes { 0: '123', 1: '456' }

  this.model.update(current => ({
    ...current,
    phoneNumbers: phoneObject
  }));
}
```

### Third-Party Alternative

For even more utility types, consider [ts-essentials](https://github.com/ts-essentials/ts-essentials):

```typescript
import { DeepPartial, DeepRequired } from 'ts-essentials';

// ts-essentials provides broader utility type coverage
// Use ngx-vest-forms utilities for form-specific needs
// Use ts-essentials for general TypeScript utility types
```

**When to use which:**

- **ngx-vest-forms utilities**: Form-specific needs, Date handling, array conversion
- **ts-essentials**: General TypeScript utilities, broader type manipulation needs
- **Built-in TypeScript**: Simple cases (`Partial<T>`, `Required<T>`, etc.)

#### objectToArray(object: unknown, keys: string[]): unknown

Converts specified object properties back to arrays (useful before saving):

```typescript
import { objectToArray } from 'ngx-vest-forms/core';

onSubmit() {
  const formData = this.model();

  // Convert form object back to arrays for API
  const apiData = objectToArray(formData, ['phoneNumbers', 'addresses']);
  // { phoneNumbers: { 0: '123', 1: '456' } }
  // becomes { phoneNumbers: ['123', '456'] }

  this.api.save(apiData);
}
```

### 20. Third-Party Alternative

For even more utility types, consider [ts-essentials](https://github.com/ts-essentials/ts-essentials):

```typescript
import { DeepPartial, DeepRequired } from 'ts-essentials';

// ts-essentials provides broader utility type coverage
// Use ngx-vest-forms utilities for form-specific needs
// Use ts-essentials for general TypeScript utility types
```

**When to use which:**

- **ngx-vest-forms utilities**: Form-specific needs, Date handling, array conversion
- **ts-essentials**: General TypeScript utilities, broader type manipulation needs
- **Built-in TypeScript**: Simple cases (`Partial<T>`, `Required<T>`, etc.)

## Testing with ngx-vest-forms

## Common Patterns

### 13. Conditional Fields

```typescript
// Component
protected readonly showOptionalField = computed(() =>
  this.model().includeOptional === true
);
```

```html
@if (showOptionalField()) {
<ngx-control-wrapper>
  <label for="optional">Optional Field</label>
  <input id="optional" name="optional" [ngModel]="model().optional" />
</ngx-control-wrapper>
}
```

### 14. Dynamic Disabling

```typescript
protected readonly emailDisabled = computed(() =>
  !this.model().name || this.model().name.length < 2
);
```

```html
<input name="email" [ngModel]="model().email" [disabled]="emailDisabled()" />
```

### 15. Form Submission

```typescript
onSubmit() {
  const formState = this.vestForm.formState();

  if (!formState.valid) {
    console.error('Form has errors:', formState.errors);
    return;
  }

  // Process valid form data
  const data = this.model();
  // ... save logic
}
```

```html
<form
  ngxVestForm
  [vestSuite]="suite"
  [(formValue)]="model"
  (ngSubmit)="onSubmit()"
  #vestForm="ngxVestForm"
>
  <button
    type="submit"
    [disabled]="!vestForm.formState().valid || vestForm.formState().pending"
  >
    Submit
  </button>
</form>
```

## Performance Optimization

### 16. Use only() in Validation Suites

Always include `only(field)` at the start of your suite:

```typescript
export const validations = staticSuite((data = {}, field?: string) => {
  only(field); // Critical for performance
  // ... tests
});
```

### 17. Use Computed Signals for Derived State

```typescript
// Good - reactive and cached
protected readonly isFormComplete = computed(() => {
  const state = this.vestForm.formState();
  return state.valid && !state.pending;
});

// Avoid - recalculates on every change detection
get isFormComplete() {
  // ...
}
```

## Troubleshooting

- No errors showing: Ensure each input `name` exactly matches the model property key and paths (e.g., `address.street`, `items.0.name`).
- Nested/array errors missing: Verify your suite uses the full control path that matches your ngModelGroup and `name` settings.
- Async validations feel stuck: Use the `signal` argument in async tests and avoid swallowing `AbortError` from canceled requests.

## Error Prevention Checklist

When generating forms with ngx-vest-forms:

- [ ] Every input has a `name` attribute matching the model property
- [ ] All inputs use `[ngModel]` (one-way binding), not `ngModel` or `[(ngModel)]`
- [ ] Form has `ngxVestForm` directive with `[vestSuite]` and `[(formValue)]`
- [ ] Validation suite uses `only(field)` for performance
- [ ] Nested objects use `ngModelGroup` with proper path syntax
- [ ] Form arrays use index-based naming (`items.0.name`)
- [ ] Error display uses arrays (v2 change from v1 strings)
- [ ] Cross-field validation uses `NGX_ROOT_FORM` constant
- [ ] Async validations handle cancellation via `signal`
- [ ] Schema validation uses `ngxVestFormWithSchema` directive

## Import Guidelines

```typescript
// Core functionality (most common)
import { ngxVestForms } from 'ngx-vest-forms/core';

// Utility types and functions
import {
  NgxDeepPartial,
  NgxDeepRequired,
  NgxFormCompatibleDeepRequired,
  arrayToObject,
  objectToArray,
} from 'ngx-vest-forms/core';

// UI helpers
import { NgxControlWrapper } from 'ngx-vest-forms/control-wrapper';

// Schema support
import { NgxVestFormWithSchemaDirective } from 'ngx-vest-forms/schemas';

// Advanced state management (rarely needed)
import { NgxVestFormsSmartStateDirective } from 'ngx-vest-forms/smart-state';

// Vest.js imports
import { staticSuite, test, enforce, only, omitWhen } from 'vest';

// Third-party alternatives for broader utility type needs
import { DeepPartial, DeepRequired } from 'ts-essentials';
```

Selectors and imports quick reference:

- Form directive selector: `ngxVestForm` (import token: `ngxVestForms`)
- Schema form directive selector: `ngxVestFormWithSchema` (import token: `NgxVestFormWithSchemaDirective`)
- Control wrapper selector: `ngx-control-wrapper` (import token: `NgxControlWrapper`)

## Migration from v1

Key differences when migrating:

- Prefix changes: `sc*` → `ngx*` (e.g., `scVestForm` → `ngxVestForm`)
- Errors are now arrays, not strings
- Shape/schema validation moved to schemas package
- Use `NGX_ROOT_FORM` instead of `ROOT_FORM`
- Form-level validation has new API with `formLevelValidation` attribute
- Removed `validationConfig`: model dependent validation in the suite via `only(field)`, `omitWhen()`, or move multi-field rules to the form-level suite.

Quick v1 → v2 mapping:

- scVestForm → ngxVestForm
- sc-control-wrapper → NgxControlWrapper (selector: `ngx-control-wrapper`)
- ROOT_FORM → NGX_ROOT_FORM
- Single error string → array of strings per field
- Shape validation inside core → schemas package (`ngxVestFormWithSchema` + `formSchema`)
- validationConfig → encode dependencies in Vest suite (only/omitWhen) or use form-level validations
