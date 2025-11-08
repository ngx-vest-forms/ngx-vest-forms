<!-- prettier-ignore -->
<div align="center">

<img src="./course.jpeg" alt="ngx-vest-forms" align="center" height="96" />

# ngx-vest-forms

[![npm version](https://img.shields.io/npm/v/ngx-vest-forms.svg?style=flat-square)](https://www.npmjs.com/package/ngx-vest-forms)
[![Build Status](https://img.shields.io/github/actions/workflow/status/ngx-vest-forms/ngx-vest-forms/cd.yml?branch=master&style=flat-square&label=Build)](https://github.com/ngx-vest-forms/ngx-vest-forms/actions/workflows/cd.yml)
[![Angular](https://img.shields.io/badge/Angular-18+-dd0031?style=flat-square&logo=angular)](https://angular.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

⭐ If you like this project, star it on GitHub — it helps a lot!

[Overview](#overview) • [Getting Started](#getting-started) • [Complete Example](#complete-example) • [Core Concepts](#core-concepts) • [Validation](#validation) • [Intermediate Topics](#intermediate-topics) • [Advanced Topics](#advanced-topics) • [Features](#features) • [Documentation](#documentation) • [Resources](#resources) • [Developer Resources](#developer-resources) • [Acknowledgments](#acknowledgments)

</div>

> [!NOTE]
> **New Maintainer**: I'm [the-ult](https://bsky.app/profile/the-ult.bsky.social), now maintaining this project as Brecht Billiet has moved on to other priorities. Huge thanks to Brecht for creating this amazing library and his foundational work on Angular forms!

> [!TIP]
> **What's New**: Major improvements in the latest release! See **[Release Notes](./docs/PR-60-CHANGES.md)** for complete details.
>
> - ✅ **Critical Fix**: Validation timing with `omitWhen` + `validationConfig`
> - ✅ **New Types**: `NgxDeepPartial`, `NgxDeepRequired`, `NgxVestSuite` (cleaner API)
> - ✅ **Array Utilities**: Convert arrays to/from objects for template-driven forms
> - ✅ **Field Path Helpers**: Parse and stringify field paths for Standard Schema

> [!WARNING]
> **Breaking Change**: You must now call `only()` **unconditionally** in validation suites.
>
> **Migration**: Remove `if (field)` wrapper around `only()` calls:
>
> ```typescript
> // ❌ OLD (will break)
> if (field) {
>   only(field);
> }
>
> // ✅ NEW (required)
> only(field); // Safe: only(undefined) runs all tests
> ```
>
> **Why**: Conditional `only()` calls corrupt Vest's execution tracking, breaking `omitWhen` + `validationConfig`.
>
> **See**: [Performance Optimization with `only()`](#performance-optimization-with-only) section and [Migration Guide](./docs/PR-60-CHANGES.md#migration-guide) for complete details.

A lightweight, type-safe adapter between Angular template-driven forms and [Vest.js](https://vestjs.dev) validation. Build complex forms with unidirectional data flow, sophisticated async validations, and zero boilerplate.

> [!TIP]
> **For Developers**: This project includes comprehensive instruction files for GitHub Copilot and detailed development guides. See [Developer Resources](#developer-resources) to copy these files to your workspace for enhanced development experience.

## Overview

**ngx-vest-forms** transforms Angular template-driven forms into a powerful, type-safe solution for complex form scenarios. By combining Angular's simplicity with Vest.js's validation power, you get:

- **Unidirectional Data Flow** - Predictable state management with Angular signals
- **Type Safety** - Full TypeScript support with runtime shape validation
- **Async Validations** - Built-in support for complex, conditional validations
- **Zero Boilerplate** - Automatic form control creation and validation wiring
- **Conditional Logic** - Show/hide fields and validation rules dynamically
- **Reusable Validations** - Share validation suites across frameworks

### Why Choose ngx-vest-forms?

Traditional Angular reactive forms require extensive boilerplate for complex scenarios. Template-driven forms are simpler but lack type safety and advanced validation features. **ngx-vest-forms bridges this gap**, giving you the best of both worlds.

```typescript
// Before: Complex reactive form setup
const form = this.fb.group({
  generalInfo: this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]]
  })
});

// After: Simple, type-safe template-driven approach
protected readonly formValue = signal<MyFormModel>({});
protected readonly suite = myValidationSuite;
```

## Getting Started

### Prerequisites

- **Angular**: >=18.0.0 (Signals support required)
- **Vest.js**: >=5.4.6 (Validation engine)
- **TypeScript**: >=5.8.0 (Modern Angular features)
- **Node.js**: >=22.0.0 (Required for Angular 18+)

### Installation

```bash
npm install ngx-vest-forms
```

### Quick Start

Create your first ngx-vest-forms component in 3 simple steps:

#### Step 1: Define your form model

```typescript
import { signal } from '@angular/core';
import { vestForms, NgxDeepPartial } from 'ngx-vest-forms';

type MyFormModel = NgxDeepPartial<{
  generalInfo: {
    firstName: string;
    lastName: string;
  };
}>;
```

#### Step 2: Set up your component

Use `[ngModel]` (not `[(ngModel)]`) for unidirectional data flow:

```typescript
import { vestForms, NgxDeepPartial } from 'ngx-vest-forms';

// A form model is always deep partial because angular will create it over time organically
type MyFormModel = NgxDeepPartial<{
  generalInfo: {
    firstName: string;
    lastName: string;
  };
}>;

@Component({
  imports: [vestForms],
  template: `
    <form
      scVestForm
      (formValueChange)="formValue.set($event)"
      (ngSubmit)="onSubmit()"
    >
      <div ngModelGroup="generalInfo">
        <label>First name</label>
        <input
          type="text"
          name="firstName"
          [ngModel]="formValue().generalInfo?.firstName"
        />

        <label>Last name</label>
        <input
          type="text"
          name="lastName"
          [ngModel]="formValue().generalInfo?.lastName"
        />
      </div>
    </form>
  `,
})
export class MyComponent {
  // This signal will hold the state of our form
  protected readonly formValue = signal<MyFormModel>({});
}
```

#### Step 3: That's it! 🎉

Your form automatically creates FormGroups and FormControls with type-safe, unidirectional data flow.

> [!IMPORTANT]
> Notice we use `[ngModel]` (not `[(ngModel)]`) for unidirectional data flow, and the `?` operator since template-driven forms are `DeepPartial`.

### Minimal Example

Here's the absolute minimum to get started with ngx-vest-forms:

```typescript
import { Component, signal } from '@angular/core';
import { vestForms, NgxDeepPartial } from 'ngx-vest-forms';

type SimpleForm = NgxDeepPartial<{
  email: string;
  name: string;
}>;

@Component({
  selector: 'app-simple-form',
  imports: [vestForms],
  template: `
    <form
      scVestForm
      (formValueChange)="formValue.set($event)"
      (ngSubmit)="onSubmit()"
    >
      <label for="email">Email</label>
      <input id="email" name="email" [ngModel]="formValue().email" />

      <label for="name">Name</label>
      <input id="name" name="name" [ngModel]="formValue().name" />

      <button type="submit">Submit</button>
    </form>
  `,
})
export class SimpleFormComponent {
  protected readonly formValue = signal<SimpleForm>({});

  protected onSubmit(): void {
    console.log('Form submitted:', this.formValue());
  }
}
```

That's all you need! The `scVestForm` directive automatically:

- Creates FormControls for each input
- Manages form state with signals
- Provides type-safe unidirectional data flow

## Complete Example

A complete working form with ngx-vest-forms requires just 4 steps:

1. **Define your form model** using `NgxDeepPartial<T>`
2. **Create a validation suite** with Vest.js using `staticSuite()`
3. **Set up your component** with a signal for form state
4. **Build your template** with `scVestForm` directive and `[ngModel]` bindings

The result: A fully functional form with type safety, automatic form control creation, validation on blur/submit, and error display - all with minimal boilerplate.

> **📖 Complete Guide**: See **[Complete Example](./docs/COMPLETE-EXAMPLE.md)** for a full working example with detailed explanations of each step, key concepts, and common patterns.

## Core Concepts

### Understanding Form State

Angular automatically creates FormGroups and FormControls based on your template structure. The `scVestForm` directive provides these outputs:

| Output            | Description                                     |
| ----------------- | ----------------------------------------------- |
| `formValueChange` | Emits when form value changes (debounced)       |
| `dirtyChange`     | Emits when dirty state changes                  |
| `validChange`     | Emits when validation state changes             |
| `errorsChange`    | Emits complete list of errors for form/controls |

### Public Methods

| Method                    | Description                                                                                                           |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `triggerFormValidation()` | Manually triggers form validation update when form structure changes without value changes (e.g., conditional fields) |

### Form Models and Type Safety

All form models in ngx-vest-forms use `NgxDeepPartial<T>` (or the legacy alias `DeepPartial<T>`) because Angular's template-driven forms build up values incrementally:

```typescript
import { NgxDeepPartial } from 'ngx-vest-forms';

type MyFormModel = NgxDeepPartial<{
  generalInfo: {
    firstName: string;
    lastName: string;
  };
}>;
```

> **Note**: The `Ngx` prefix prevents naming conflicts with other libraries. Both `NgxDeepPartial` and `DeepPartial` work identically; the Ngx-prefixed version is recommended for new code.

This is why you must use the `?` operator in templates:

```html
<input [ngModel]="formValue().generalInfo?.firstName" name="firstName" />
```

### Validation Suite Type Safety

Use `NgxVestSuite<T>` for cleaner validation suite types:

```typescript
import { NgxVestSuite, NgxDeepPartial } from 'ngx-vest-forms';
import { staticSuite, only, test, enforce } from 'vest';

type FormModel = NgxDeepPartial<{
  email: string;
  password: string;
}>;

// ✅ Clean API with NgxVestSuite
const suite: NgxVestSuite<FormModel> = staticSuite((model, field?) => {
  only(field); // CRITICAL: Always call only() unconditionally

  test('email', 'Email is required', () => {
    enforce(model.email).isNotBlank();
  });
});

// ❌ Old verbose way (still works but more complex)
// const suite: StaticSuite<string, string, (model: FormModel, field?: string) => void> = ...
```

The `NgxVestSuite<T>` type provides:

- **Cleaner API**: No need to specify `StaticSuite` generic parameters
- **Type Safety**: Full TypeScript support for model and field parameters
- **Template Compatibility**: Works seamlessly in Angular templates without `$any()` casts

### Form State Type and Utilities

The `formState` computed signal returns an `NgxFormState<T>` object with the current form state:

```typescript
import { NgxFormState, createEmptyFormState } from 'ngx-vest-forms';

// The form state contains:
interface NgxFormState<TModel> {
  valid: boolean; // Whether the form is valid
  errors: Record<string, string[]>; // Map of field errors by path
  value: TModel | null; // Current form value (includes disabled fields)
}

// Useful for parent components displaying child form state
@Component({
  template: `
    <app-child-form #childForm />
    <div>Form Valid: {{ formState().valid }}</div>
    <div>Errors: {{ formState().errors | json }}</div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParentComponent {
  // Modern Angular 20+: Use viewChild() instead of @ViewChild
  private readonly childForm = viewChild<ChildFormComponent>('childForm');

  // Provide safe fallback when child form isn't initialized yet
  protected readonly formState = computed(
    () => this.childForm()?.vestForm?.formState() ?? createEmptyFormState()
  );
}
```

The `createEmptyFormState()` utility creates a safe default state:

- `valid: true`
- `errors: {}`
- `value: null`

This prevents null reference errors in templates when child forms or form references might be undefined.

### Shape Validation: Catching Typos Early

Template-driven forms are type-safe, but not in the `name` attributes or `ngModelGroup` attributes.
Making a typo in those can result in a time-consuming endeavor. For this we have introduced shapes.
A shape is an object where the `scVestForm` can validate to. It is a deep required of the form model:

```typescript
import { DeepPartial, DeepRequired, vestForms } from 'ngx-vest-forms';

type MyFormModel = DeepPartial<{
  generalInfo: {
    firstName: string;
    lastName: string;
  };
}>;

export const myFormModelShape: DeepRequired<MyFormModel> = {
  generalInfo: {
    firstName: '',
    lastName: '',
  },
};

@Component({
  imports: [vestForms],
  template: `
    <form
      scVestForm
      [formShape]="shape"
      (formValueChange)="formValue.set($event)"
      (ngSubmit)="onSubmit()"
    >
      <div ngModelGroup="generalInfo">
        <label>First name</label>
        <input
          type="text"
          name="firstName"
          [ngModel]="formValue().generalInformation?.firstName"
        />

        <label>Last name</label>
        <input
          type="text"
          name="lastName"
          [ngModel]="formValue().generalInformation?.lastName"
        />
      </div>
    </form>
  `,
})
export class MyComponent {
  protected readonly formValue = signal<MyFormModel>({});
  protected readonly shape = myFormModelShape;
}
```

By passing the shape to the `formShape` input the `scVestForm` will validate the actual form value
against the form shape every time the form changes, but only when Angular is in devMode.

Making a typo in the name attribute or an ngModelGroup attribute would result in runtime errors.
The console would look like this:

```chatinput
Error: Shape mismatch:

[ngModel] Mismatch 'firstame'
[ngModelGroup] Mismatch: 'addresses.billingddress'
[ngModel] Mismatch 'addresses.billingddress.steet'
[ngModel] Mismatch 'addresses.billingddress.number'
[ngModel] Mismatch 'addresses.billingddress.city'
[ngModel] Mismatch 'addresses.billingddress.zipcode'
[ngModel] Mismatch 'addresses.billingddress.country'


    at validateShape (shape-validation.ts:28:19)
    at Object.next (form.directive.ts:178:17)
    at ConsumerObserver.next (Subscriber.js:91:33)
    at SafeSubscriber._next (Subscriber.js:60:26)
    at SafeSubscriber.next (Subscriber.js:31:18)
    at subscribe.innerSubscriber (switchMap.js:14:144)
    at OperatorSubscriber._next (OperatorSubscriber.js:13:21)
    at OperatorSubscriber.next (Subscriber.js:31:18)
    at map.js:7:24
```

## Validation

ngx-vest-forms uses [Vest.js](https://vestjs.dev) for validation - a lightweight, flexible validation framework that works across any JavaScript environment.

### Creating Your First Validation Suite

Vest suites use `staticSuite()` with `only()` for performance optimization:

```typescript
import { enforce, only, staticSuite, test } from 'vest';

export const myFormSuite = staticSuite((model: MyFormModel, field?) => {
  only(field); // Call unconditionally at top

  test('firstName', 'First name is required', () => {
    enforce(model.firstName).isNotBlank();
  });
});
```

**Test parameters**: `test(fieldName, errorMessage, validationFunction)`

- Use dot notation for nested fields: `'addresses.billingAddress.street'`

### Connecting Validation to Your Form

The biggest pain point ngx-vest-forms solves: **Connecting Vest suites to Angular with zero boilerplate**:

```typescript
// Component
class MyComponent {
  protected readonly formValue = signal<MyFormModel>({});
  protected readonly suite = myFormModelSuite;
}
```

```html
<!-- Template -->
<form
  scVestForm
  [suite]="suite"
  (formValueChange)="formValue.set($event)"
  (ngSubmit)="onSubmit()"
>
  ...
</form>
```

That's it! Validations are completely wired. Behind the scenes:

1. Control gets created, Angular recognizes the `ngModel` directives
2. These directives implement `AsyncValidator` and connect to the Vest suite
3. User types into control
4. The validate function gets called
5. Vest returns the errors
6. ngx-vest-forms puts those errors on the Angular form control

This means `valid`, `invalid`, `errors`, `statusChanges` all work just like a regular Angular form.

### Displaying Validation Errors

Use the `sc-control-wrapper` component to show validation errors consistently:

```html
<div ngModelGroup="generalInfo" sc-control-wrapper>
  <div sc-control-wrapper>
    <label>First name</label>
    <input
      type="text"
      name="firstName"
      [ngModel]="formValue().generalInfo?.firstName"
    />
  </div>

  <div sc-control-wrapper>
    <label>Last name</label>
    <input
      type="text"
      name="lastName"
      [ngModel]="formValue().generalInfo?.lastName"
    />
  </div>
</div>
```

Errors show automatically:

- ✅ On blur
- ✅ On submit

You can use `sc-control-wrapper` on:

- Elements that hold `ngModelGroup`
- Elements that have an `ngModel` (or form control) inside of them

### Performance Optimization with `only()`

**Critical**: Always call `only()` unconditionally at the top of your validation suite:

```typescript
export const suite = staticSuite((model, field?) => {
  only(field); // ✅ CORRECT - Unconditional call
  // ...tests
});

// ❌ WRONG - Conditional call
export const badSuite = staticSuite((model, field?) => {
  if (field) only(field); // Breaks Vest's execution tracking!
});
```

**Why**: `only(undefined)` is safe (runs all tests), while `only('fieldName')` optimizes by running only that field's tests. Conditional calls corrupt Vest's internal state and break `omitWhen` + `validationConfig` timing.

- ✅ **Fixed**: Proper validation with `omitWhen` and nested fields with `validationConfig`

> [!IMPORTANT]
> **Critical Pattern**: You MUST call `only()` unconditionally. Never wrap it in `if (field)`. This ensures validation uses current form values and prevents timing issues with `omitWhen` and `validationConfig`. Conditional `only()` calls corrupt Vest's internal execution tracking.

### Error Display Control

The `sc-control-wrapper` component uses the `FormErrorDisplayDirective` under the hood to manage when and how errors are displayed.

#### Error Display Modes

ngx-vest-forms supports three error display modes:

- **`on-blur-or-submit`** (default) - Show errors after field blur OR form submission
- **`on-blur`** - Show errors only after field blur
- **`on-submit`** - Show errors only after form submission

#### Configuring Error Display

**Global Configuration** - Set the default mode for your entire application:

```typescript
import { ApplicationConfig } from '@angular/core';
import { SC_ERROR_DISPLAY_MODE_TOKEN } from 'ngx-vest-forms';

export const appConfig: ApplicationConfig = {
  providers: [{ provide: SC_ERROR_DISPLAY_MODE_TOKEN, useValue: 'on-submit' }],
};

// Or in a component
@Component({
  providers: [{ provide: SC_ERROR_DISPLAY_MODE_TOKEN, useValue: 'on-submit' }],
})
export class MyComponent {}
```

**Per-Instance Configuration** - Override the mode for specific form fields:

```typescript
@Component({
  template: `
    <div sc-control-wrapper [errorDisplayMode]="'on-blur'">
      <input name="email" [ngModel]="formValue().email" />
    </div>
  `,
})
export class MyFormComponent {}
```

> **Note**: The `sc-control-wrapper` component accepts `errorDisplayMode` as an input to override the global setting for specific fields.

### Validation Options

You can configure additional `validationOptions` at various levels like `form`, `ngModelGroup` or `ngModel`.

For example, to debounce validation (useful for API calls):

```html
<form scVestForm ... [validationOptions]="{ debounceTime: 0 }">
  ...
  <div sc-control-wrapper>
    <label>UserId</label>
    <input
      type="text"
      name="userId"
      [ngModel]="formValue().userId"
      [validationOptions]="{ debounceTime: 300 }"
    />
  </div>
  ...
</form>
```

## Intermediate Topics

### Conditional Fields

Use computed signals to show/hide fields dynamically. Angular automatically manages FormControl creation/removal:

```typescript
class MyComponent {
  protected readonly showLastName = computed(
    () => !!this.formValue().firstName
  );
}
```

```html
@if(showLastName()) {
  <input name="lastName" [ngModel]="formValue().lastName" />
}

  <label>Last name</label>
  <input
    type="text"
    name="lastName"
    [ngModel]="formValue().generalInformation?.lastName"
  />
</div>
}
```

### Reactive Disabling

To achieve reactive disabling, we just have to take advantage of computed signals as well:

```typescript
class MyComponent {
  protected readonly lastNameDisabled = computed(
    () => !this.formValue().generalInfo?.firstName
  );
}
```

We can bind the computed signal to the `disabled` directive of Angular.

```html
<input
  type="text"
  name="lastName"
  [disabled]="lastNameDisabled()"
  [ngModel]="formValue().generalInformation?.lastName"
/>
```

### Conditional Validations

Vest makes it extremely easy to create conditional validations.
Assume we have a form model that has `age` and `emergencyContact`.
The `emergencyContact` is required, but only when the person is not of legal age.

We can use the `omitWhen` so that when the person is below 18, the assertion
will not be done.

```typescript
import { enforce, omitWhen, only, staticSuite, test } from 'vest';

...
omitWhen((model.age || 0) >= 18, () => {
  test('emergencyContact', 'Emergency contact is required', () => {
    enforce(model.emergencyContact).isNotBlank();
  });
});
```

You can put those validations on every field that you want. On form group fields and on form control fields.
Check this interesting example below:

- [x] Password is always required
- [x] Confirm password is only required when there is a password
- [x] The passwords should match, but only when they are both filled in

````typescript
test('passwords.password', 'Password is not filled in', () => {
  enforce(model.passwords?.password).isNotBlank();
});
```typescript
omitWhen(!model.passwords?.password, () => {
  test('passwords.confirmPassword', 'Confirm password required', () => {
    enforce(model.passwords?.confirmPassword).isNotBlank();
  });

  test('passwords', 'Passwords must match', () => {
    enforce(model.passwords?.confirmPassword).equals(model.passwords?.password);
  });
});
````

This pattern is testable, reusable across frameworks, and readable.

````

Forget about manually adding, removing validators on reactive forms and not being able to
re-use them. This code is easy to test, easy to re-use on frontend, backend, angular, react, etc...
**Oh, it's also pretty readable**

### Dependent Field Validation with Conditional Rendering

When fields that depend on each other are conditionally rendered (using `@if`), you need a **reactive validationConfig** to avoid "control not found" warnings.

> **💡 Related Pattern**: If you're also switching between form inputs and non-form content (like informational text), you'll need [`triggerFormValidation()`](#handling-form-structure-changes) in addition to computed `validationConfig`. See the [comparison matrix](#handling-dynamic-forms-two-common-patterns) for when to use each.

#### The Problem

```typescript
// ❌ This causes warnings when conditional fields don't exist
class MyComponent {
  protected readonly validationConfig = {
    quantity: ['justification'], // justification only shows when quantity > 5!
  };
}
````

#### The Solution

Use a **computed signal** for `validationConfig`:

```typescript
import { Component, signal, computed } from '@angular/core';

@Component({
  template: `
    <form scVestForm [validationConfig]="validationConfig()" ...>
      <input name="quantity" [ngModel]="formValue().quantity" />

      @if ((formValue().quantity || 0) > 5) {
        <textarea
          name="justification"
          [ngModel]="formValue().justification"
        ></textarea>
      }
    </form>
  `,
})
export class MyComponent {
  protected readonly formValue = signal<MyFormModel>({});

  // ✅ Computed config only references controls that exist
  protected readonly validationConfig = computed(() => {
    const config: Record<string, string[]> = {};

    // Only add dependency when field is in DOM
    if ((this.formValue().quantity || 0) > 5) {
      config['quantity'] = ['justification'];
      config['justification'] = ['quantity']; // Bidirectional validation
    }

    return config;
  });
}
```

**Key Points:**

- ✅ **Reactive**: Config updates when field visibility changes
- ✅ **No Warnings**: Only references controls that exist in DOM
- ✅ **Bidirectional**: Works for two-way validation dependencies
- ✅ **Type-Safe**: Full TypeScript support

**Template Binding:**

```html
<!-- Notice the function call: validationConfig() -->
<form scVestForm [validationConfig]="validationConfig()" ...></form>
```

## Advanced Topics

### Handling Dynamic Forms: Two Common Patterns

Dynamic forms present two distinct challenges that require different solutions:

| Challenge                                           | Solution                                                                              | When to Use                                                |
| --------------------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| **Conditional fields with validation dependencies** | [Computed `validationConfig`](#dependent-field-validation-with-conditional-rendering) | Fields depend on each other AND are conditionally rendered |
| **Structure changes without value changes**         | [`triggerFormValidation()`](#handling-form-structure-changes)                         | Switching between form inputs and non-form content         |

> **💡 Pro Tip**: These solutions are complementary and often used together in complex forms with both conditional validation dependencies and dynamic structure changes.

### Handling Form Structure Changes

When form structure changes dynamically (e.g., switching between form inputs and non-form elements like `<p>` tags), use `triggerFormValidation()` to manually update validation state:

```typescript
@Component({
  template: `
    <form scVestForm [suite]="suite" #vestForm="scVestForm">
      <select
        name="type"
        [ngModel]="formValue().type"
        (ngModelChange)="onTypeChange($event)"
      >
        <option value="typeA">Type A</option>
        <option value="typeC">Type C (no input)</option>
      </select>

      @if (formValue().type === 'typeA') {
        <input name="fieldA" [ngModel]="formValue().fieldA" />
      } @else {
        <p>No additional input required.</p>
      }
    </form>
  `,
})
class MyComponent {
  protected readonly vestFormRef = viewChild.required('vestForm', {
    read: FormDirective,
  });

  protected onTypeChange(type: string) {
    this.formValue.update((v) => {
      const updated = clearFieldsWhen(v, { fieldA: type !== 'typeA' });
      return { ...updated, type };
    });
    this.vestFormRef().triggerFormValidation();
  }
}
```

> **📖 Detailed Guide**: See **[Field Clearing Utilities](./docs/FIELD-CLEARING-UTILITIES.md)** and **[Structure Change Detection Guide](./docs/STRUCTURE_CHANGE_DETECTION.md)** for comprehensive examples.

        [ngModel]="formValue().procedureType"
        (ngModelChange)="onProcedureTypeChange($event)"
      >
        <option value="typeA">Type A</option>
        <option value="typeB">Type B</option>
        <option value="typeC">Type C (No input)</option>
      </select>

      @if (formValue().procedureType === 'typeA') {
        <input name="fieldA" [ngModel]="formValue().fieldA" />
      } @else if (formValue().procedureType === 'typeB') {
        <input name="fieldB" [ngModel]="formValue().fieldB" />
      } @else if (formValue().procedureType === 'typeC') {
        <p>No additional input required.</p>
      }
    </form>

`,
changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyFormComponent {
// Modern Angular 20+: Use viewChild() function API
private readonly vestForm =
viewChild.required<FormDirective<MyFormModel>>('vestForm');
protected readonly formValue = signal<MyFormModel>({});
protected readonly validationSuite = myValidationSuite;

onProcedureTypeChange(newType: string) {
// Update the form value
this.formValue.update((current) => ({
...current,
procedureType: newType,
// Clear fields that are no longer relevant
...(newType !== 'typeA' && { fieldA: undefined }),
...(newType !== 'typeB' && { fieldB: undefined }),
}));

    // ✅ CRITICAL: Trigger validation update after structure change
    this.vestForm().triggerFormValidation();

}
}

````

**When to use `triggerFormValidation()`**: After form structure changes (showing/hiding fields), clearing form sections, or switching between form inputs and non-form content.

> **🔗 See Also**: [Computed `validationConfig`](#dependent-field-validation-with-conditional-rendering) for validation dependencies, and [Field Clearing Utilities](./docs/FIELD-CLEARING-UTILITIES.md) for state management.

#### Field Clearing Pattern

**When field clearing is required**: When switching between form inputs and non-form elements (e.g., `<input>` ↔ `<p>` tags).

**Why**: Angular removes FormControls when switching to non-form content, but component signals retain old values, creating state inconsistency.

```typescript
// Use clearFieldsWhen to synchronize state
import { clearFieldsWhen } from 'ngx-vest-forms';

this.formValue.update(v => clearFieldsWhen(v, {
  fieldA: procedureType !== 'typeA' // Clear when NOT showing input
}));
````

**When NOT required**: Pure form-to-form conditionals (switching input types with same `name`) – Angular maintains FormControl throughout.

##### When Field Clearing is NOT Required

Pure form-to-form conditionals (switching input types with same `name`) usually don't need field clearing because Angular maintains the FormControl throughout:

```typescript
// These switches DON'T require field clearing:
@if (inputType === 'text') {
  <input name="field" [ngModel]="formValue().field" type="text" />
} @else {
  <input name="field" [ngModel]="formValue().field" type="number" />
}
```

> **📖 Complete Guide**: See **[Field Clearing Utilities](./docs/FIELD-CLEARING-UTILITIES.md)** for detailed patterns and use cases.

```typescript
// Trigger validation update after structure change
this.vestFormRef().triggerFormValidation();
}

```

### Field State Utilities

When building dynamic forms, you often need to conditionally show/hide form inputs or switch between form inputs and non-form content (like informational text). ngx-vest-forms provides specialized utilities to keep your component state synchronized with Angular's form state during these transitions.

**Key Utilities:**

- **`clearFieldsWhen(state, conditions)`** - Conditionally clear fields based on boolean conditions (most common)
- **`clearFields(state, fieldArray)`** - Unconditionally clear specific fields (for reset operations)
- **`keepFieldsWhen(state, conditions)`** - Keep only fields that meet conditions (whitelist approach)

**When to Use:**

These utilities are primarily needed when your template conditionally renders form inputs in some branches and non-form content (like `<p>` tags) in others. They ensure your component state stays consistent with the actual form structure.

**Example:**

```typescript
import { clearFieldsWhen } from 'ngx-vest-forms';

// Clear shipping address when switching from input to "No shipping needed" message
const updatedState = clearFieldsWhen(formValue(), {
  'addresses.shippingAddress': !useShippingAddress,
  emergencyContact: age >= 18, // Clear when adult (no emergency contact input shown)
});
```

**Important Note:**

Pure form-to-form conditionals (switching between different input types with the same `name`) typically don't require these utilities as Angular maintains the FormControl throughout the transition.

> **📖 Detailed Guide**: See **[Field Clearing Utilities](./docs/FIELD-CLEARING-UTILITIES.md)** for comprehensive examples, use cases, and when field clearing is required vs. not required.

### Composable Validations

Break down complex validation logic into reusable functions that can be shared across forms, frameworks, and even frontend/backend:

```typescript
// Reusable validation function
export function addressValidations(
  model: AddressModel | undefined,
  field: string
): void {
  test(`${field}.street`, 'Street is required', () => {
    enforce(model?.street).isNotBlank();
  });
  test(`${field}.city`, 'City is required', () => {
    enforce(model?.city).isNotBlank();
  });
  // ... more validations
}

// Use in your suite
export const orderSuite: NgxVestSuite<OrderFormModel> = staticSuite(
  (model, field?) => {
    only(field);
    addressValidations(model.billingAddress, 'billingAddress');
    addressValidations(model.shippingAddress, 'shippingAddress');
  }
);
```

**Benefits:**

- ✅ **Reusability** - Share validation logic across different forms
- ✅ **Maintainability** - Update validation logic in one place
- ✅ **Testability** - Test validation functions independently
- ✅ **Cross-framework** - Use same logic on frontend/backend, Angular/React

> **📖 Detailed Guide**: See **[Composable Validations](./docs/COMPOSABLE-VALIDATIONS.md)** for advanced patterns, conditional composition, organizing validation files, nested compositions, and testing strategies.

### Custom Control Wrappers

Create your own error display components using the `FormErrorDisplayDirective`, which provides all the validation state you need:

```typescript
@Component({
  selector: 'app-custom-wrapper',
  hostDirectives: [FormErrorDisplayDirective],
  template: `
    <div class="field-wrapper">
      <ng-content />
      @if (errorDisplay.shouldShowErrors()) {
        <div class="error">
          @for (error of errorDisplay.errors(); track error) {
            <span>{{ error }}</span>
          }
        </div>
      }
      @if (errorDisplay.isPending()) {
        <div class="validating">Validating...</div>
      }
    </div>
  `,
})
export class CustomWrapperComponent {
  protected readonly errorDisplay = inject(FormErrorDisplayDirective, {
    self: true,
  });
}
```

**When to create custom wrappers:**

- Match your design system (Material, PrimeNG, etc.)
- Custom error formatting (tooltips, popovers, inline)
- Add UI elements (icons, help text, character counters)
- Specific accessibility patterns

> **📖 Detailed Guide**: See **[Custom Control Wrappers](./docs/CUSTOM-CONTROL-WRAPPERS.md)** for Material Design examples, available signals reference, and best practices.

### Validations on the Root Form

For form-level validations that span multiple fields, use the `ROOT_FORM` constant with `[validateRootForm]="true"`:

```typescript
import { ROOT_FORM } from 'ngx-vest-forms';

// In your suite
test(ROOT_FORM, 'Passwords must match', () => {
  enforce(model.confirmPassword).equals(model.password);
});
```

```html
<form
  scVestForm
  [validateRootForm]="true"
  [suite]="suite"
  (errorsChange)="errors.set($event)"
>
  <!-- Display root-level errors -->
  {{ errors()?.['rootForm'] }}
</form>
```

### Validation of Dependent Controls

When field validations depend on other fields (e.g., `confirmPassword` depends on `password`), use `validationConfig` to trigger re-validation:

```typescript
// In your suite - Vest handles the logic
omitWhen(!model.password, () => {
  test('confirmPassword', 'Passwords must match', () => {
    enforce(model.confirmPassword).equals(model.password);
  });
});
```

```typescript
// In your component - validationConfig handles Angular orchestration
protected validationConfig = {
  password: ['confirmPassword'] // When password changes, revalidate confirmPassword
};
```

```html
<form scVestForm [suite]="suite" [validationConfig]="validationConfig">
  <input name="password" [ngModel]="formValue().password" />
  <input name="confirmPassword" [ngModel]="formValue().confirmPassword" />
</form>
```

**Why `validationConfig` is needed**: Vest.js handles validation logic, but cannot tell Angular to revalidate other form controls. The `validationConfig` bridges this gap by telling Angular's form system which fields should be revalidated when others change.
There is also a complex example of form arrays with complex validations in the examples.

### Child Form Components

Large forms are difficult to maintain in a single file. ngx-vest-forms supports splitting forms into reusable child components, which is essential for code organization and component reusability (like address forms used in multiple places).

**Critical Requirement:**

Child components that contain form fields **MUST** use `vestFormsViewProviders` to access the parent form:

```typescript
import { Component, input } from '@angular/core';
import { vestForms, vestFormsViewProviders } from 'ngx-vest-forms';

@Component({
  selector: 'app-address',
  viewProviders: [vestFormsViewProviders], // ⚠️ REQUIRED for child form components
  template: `
    <div sc-control-wrapper>
      <label>Street</label>
      <input [ngModel]="address().street" name="street" />
    </div>
    <!-- More address fields... -->
  `,
})
export class AddressComponent {
  readonly address = input<AddressModel>();
}
```

**Key Benefits:**

- **Component Reusability** - Share address, phone number, or other form sections across multiple forms
- **Code Organization** - Keep large forms manageable by splitting them into logical sections
- **Type Safety** - Each child component can have its own strongly-typed model
- **Dynamic Field Names** - Use inputs to customize field name prefixes (e.g., `billingAddress.street` vs `shippingAddress.street`)

> **📖 Detailed Guide**: See **[Child Components](./docs/CHILD-COMPONENTS.md)** for complete examples including dynamic field names, nested child components, and troubleshooting common issues.

## Features

Now that you've seen how ngx-vest-forms works, here's a complete overview of its capabilities:

### Core Features

- **Unidirectional Data Flow** - Predictable state management with Angular signals
- **Type Safety** - Full TypeScript support with `DeepPartial<T>` and `DeepRequired<T>`
- **Zero Boilerplate** - Automatic FormControl and FormGroup creation
- **Shape Validation** - Runtime validation against your TypeScript models (dev mode)

### Advanced Validation

- **Async Validations** - Built-in support with AbortController and pending state
- **Conditional Logic** - Use `omitWhen()` for conditional validation rules
- **Composable Suites** - Reusable validation functions across projects
- **Custom Debouncing** - Configure validation timing per field or form
- **Warnings Support** - Non-blocking feedback with Vest's `warn()` feature
- **Performance Optimization** - Field-level validation with `only()` pattern

### Dynamic Forms

- **Conditional Fields** - Show/hide fields based on form state
- **Form Arrays** - Dynamic lists with add/remove functionality
- **Reactive Disabling** - Disable fields based on computed signals
- **State Management** - Preserve field state across conditional rendering
- **Structure Change Detection** - Manual trigger for validation updates when form structure changes

### Developer Experience

- **Runtime Shape Checking** - Catch typos in `name` attributes early
- **Flexible Error Display** - Built-in `sc-control-wrapper` or create custom wrappers with `FormErrorDisplayDirective`
- **Error Display Modes** - Control when errors show: on-blur, on-submit, or both
- **Validation Config** - Declare field dependencies for complex scenarios
- **Field State Utilities** - Helper functions for managing dynamic form state
- **Modern Angular** - Built for Angular 18+ with standalone components and signals

## Documentation

### Detailed Guides

For comprehensive documentation beyond this README, check out our detailed guides:

- **[Utility Types & Functions Reference](./projects/ngx-vest-forms/src/lib/utils/README.md)** - Complete guide to all utility types and functions
  - Type utilities: `NgxDeepPartial`, `NgxDeepRequired`, `NgxFormCompatibleDeepRequired`
  - Form utilities: `getAllFormErrors()`, `setValueAtPath()`, `mergeValuesAndRawValues()`
  - Array/Object conversion: `arrayToObject()`, `deepArrayToObject()`, `objectToArray()`
  - Field path utilities: `parseFieldPath()`, `stringifyFieldPath()`
  - Field clearing: `clearFieldsWhen()`, `clearFields()`, `keepFieldsWhen()`
  - Equality utilities: `shallowEqual()`, `fastDeepEqual()`
  - Shape validation: `validateShape()`
- **[Structure Change Detection Guide](./docs/STRUCTURE_CHANGE_DETECTION.md)** - Advanced handling of conditional form scenarios
  - Alternative approaches and their trade-offs
  - Performance considerations and best practices
  - Detailed API reference with examples
  - When and why to use `triggerFormValidation()`

### Coming Soon

- **Advanced Form Arrays Guide** - Dynamic lists, nested arrays, and complex scenarios
- **Custom Validation Guide** - Building reusable validation suites and complex rules
- **Performance Optimization Guide** - Tips and techniques for large-scale forms

## Resources

### Documentation & Tutorials

- **[Angular Official Documentation](https://angular.dev/guide/forms)** - Template-driven forms guide
- **[Vest.js Documentation](https://vestjs.dev)** - Validation framework used by ngx-vest-forms
- **[Live Examples Repository](https://github.com/ngx-vest-forms/ngx-vest-forms/tree/master/projects/examples)** - Complex form examples and patterns
- **[Interactive Stackblitz Demo](https://stackblitz.com/~/github.com/simplifiedcourses/ngx-vest-forms-stackblitz)** - Try it in your browser

### Running Examples Locally

Clone this repo and run the examples:

```bash
npm install
npm start
```

### Learning Resources

[![Angular Forms Course](course.jpeg)](https://www.simplified.courses/complex-angular-template-driven-forms)

**[Complex Angular Template-Driven Forms Course](https://www.simplified.courses/complex-angular-template-driven-forms)** - Master advanced form patterns and become a form expert.

### Founding Articles by Brecht Billiet

This library was originally created by [Brecht Billiet](https://twitter.com/brechtbilliet). Here are his foundational blog posts that inspired and guided the development:

- **[Introducing ngx-vest-forms](https://blog.simplified.courses/introducing-ngx-vest-forms/)** - The original introduction and motivation
- **[Making Angular Template-Driven Forms Type-Safe](https://blog.simplified.courses/making-angular-template-driven-forms-typesafe/)** - Deep dive into type safety
- **[Asynchronous Form Validators in Angular with Vest](https://blog.simplified.courses/asynchronous-form-validators-in-angular-with-vest/)** - Advanced async validation patterns
- **[Template-Driven Forms with Form Arrays](https://blog.simplified.courses/template-driven-forms-with-form-arrays/)** - Dynamic form arrays implementation

### Community & Support

- **[GitHub Issues](https://github.com/ngx-vest-forms/ngx-vest-forms/issues)** - Report bugs or request features
- **[GitHub Discussions](https://github.com/ngx-vest-forms/ngx-vest-forms/discussions)** - Ask questions and share ideas
- **[npm Package](https://www.npmjs.com/package/ngx-vest-forms)** - Official package page

## Developer Resources

### Comprehensive Instruction Files

This project includes detailed instruction files designed to help developers master ngx-vest-forms and Vest.js patterns:

- **[`.github/instructions/ngx-vest-forms.instructions.md`](.github/instructions/ngx-vest-forms.instructions.md)** - Complete guide for using ngx-vest-forms library
- **[`.github/instructions/vest.instructions.md`](.github/instructions/vest.instructions.md)** - Comprehensive Vest.js validation patterns and best practices
- **[`.github/copilot-instructions.md`](.github/copilot-instructions.md)** - Main GitHub Copilot instructions for this workspace

### Using Instruction Files in Your Workspace

For the best development experience with ngx-vest-forms, **copy these instruction files to your own project's `.github/` directory**:

```bash
# Create the directories in your project
mkdir -p .github/instructions

# Copy the instruction files
curl -o .github/instructions/ngx-vest-forms.instructions.md \
  https://raw.githubusercontent.com/ngx-vest-forms/ngx-vest-forms/main/.github/instructions/ngx-vest-forms.instructions.md

curl -o .github/instructions/vest.instructions.md \
  https://raw.githubusercontent.com/ngx-vest-forms/ngx-vest-forms/main/.github/instructions/vest.instructions.md

# Optionally, adapt the main copilot instructions for your project
curl -o .github/copilot-instructions.md \
  https://raw.githubusercontent.com/ngx-vest-forms/ngx-vest-forms/main/.github/copilot-instructions.md
```

**Benefits of copying instruction files:**

- **GitHub Copilot Integration** - Enhanced code generation aligned with best practices
- **Comprehensive Documentation** - Complete patterns and examples at your fingertips
- **Consistent Code Quality** - Maintain validation patterns and architectural standards
- **Faster Development** - Quick reference for complex scenarios and optimizations

## Acknowledgments

🙏 **Special thanks to [Brecht Billiet](https://twitter.com/brechtbilliet)** for creating the original version of this library and his pioneering work on Angular forms. His vision and expertise laid the foundation for what ngx-vest-forms has become today.

### Core Contributors & Inspirations

**[Evyatar Alush](https://twitter.com/evyataral)** - Creator of [Vest.js](https://vestjs.dev/)

- 🎯 **The validation engine** that powers ngx-vest-forms
- 🎙️ **Featured on PodRocket**: [Vest with Evyatar Alush](https://dev.to/podrocket/vest-with-evyatar-alush) - Deep dive into the philosophy and architecture of Vest.js

**[Ward Bell](https://twitter.com/wardbell)** - Template-Driven Forms Advocate

- 📢 **Evangelized Template-Driven Forms**: [Prefer Template-Driven Forms](https://devconf.net/talk/prefer-template-driven-forms-ward-bell-ng-conf-2021) (ng-conf 2021)
- 🎥 **Original Vest.js + Angular Integration**: [Form validation done right](https://www.youtube.com/watch?v=EMUAtQlh9Ko) - The foundational talk that inspired this approach
- 💻 **Early Implementation**: [ngc-validate](https://github.com/wardbell/ngc-validate) - The initial version of template-driven forms with Vest.js

These pioneers laid the groundwork that made ngx-vest-forms possible, combining the power of declarative validation with the elegance of Angular's template-driven approach.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```

```

```

```
