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
import { vestForms, DeepPartial } from 'ngx-vest-forms';

type MyFormModel = DeepPartial<{
  generalInfo: {
    firstName: string;
    lastName: string;
  };
}>;
```

#### Step 2: Set up your component

Use `[ngModel]` (not `[(ngModel)]`) for unidirectional data flow:

```typescript
import { vestForms, DeepPartial } from 'ngx-vest-forms';

// A form model is always deep partial because angular will create it over time organically
type MyFormModel = DeepPartial<{
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

## Complete Example

Let's see a complete working form with validation to understand how everything fits together:

```typescript
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { staticSuite, test, enforce, only } from 'vest';
import { vestForms, DeepPartial, DeepRequired } from 'ngx-vest-forms';

// 1. Define your form model (always DeepPartial)
type UserFormModel = DeepPartial<{
  firstName: string;
  lastName: string;
  email: string;
}>;

// 2. Create a shape for runtime validation (recommended)
const userFormShape: DeepRequired<UserFormModel> = {
  firstName: '',
  lastName: '',
  email: '',
};

// 3. Create a Vest validation suite
const userValidationSuite = staticSuite(
  (model: UserFormModel, field?: string) => {
    if (field) {
      only(field); // Critical for performance - only validate the active field
    }

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

// 4. Create the component
@Component({
  selector: 'app-user-form',
  imports: [vestForms],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form
      scVestForm
      [suite]="suite"
      [formShape]="shape"
      (formValueChange)="formValue.set($event)"
      (ngSubmit)="onSubmit()"
    >
      <!-- Each field wrapped for error display -->
      <div sc-control-wrapper>
        <label>First Name</label>
        <input [ngModel]="formValue().firstName" name="firstName" />
      </div>

      <div sc-control-wrapper>
        <label>Last Name</label>
        <input [ngModel]="formValue().lastName" name="lastName" />
      </div>

      <div sc-control-wrapper>
        <label>Email</label>
        <input [ngModel]="formValue().email" name="email" type="email" />
      </div>

      <button type="submit">Submit</button>
    </form>
  `,
})
export class UserFormComponent {
  protected readonly formValue = signal<UserFormModel>({});
  protected readonly suite = userValidationSuite;
  protected readonly shape = userFormShape;

  protected onSubmit() {
    console.log('Form submitted:', this.formValue());
  }
}
```

That's it! You now have a fully functional form with:

- ✅ Type-safe form model
- ✅ Automatic form control creation
- ✅ Validation on blur and submit
- ✅ Error display with `sc-control-wrapper`
- ✅ Runtime shape validation (dev mode)

## Core Concepts

### Understanding Form State

The form value will be automatically populated like this:

```typescript
formValue = {
  generalInfo: {
    firstName: '',
    lastName: '',
  },
};
```

The ngForm will contain automatically created FormGroups and FormControls.
This does not have anything to do with this package. It's just Angular:

```typescript
form = {
  controls: {
    generalInformation: { // FormGroup
      controls: {
        firstName: {...}, // FormControl
        lastName: {...} //FormControl
      }
    }
  }
}
```

The `scVestForm` directive offers these outputs:

| Output            | Description                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| `formValueChange` | Emits when the form value changes (debounced since template-driven forms are created over time) |
| `dirtyChange`     | Emits when the dirty state of the form changes                                                  |
| `validChange`     | Emits when the form becomes valid or invalid                                                    |
| `errorsChange`    | Emits the complete list of errors for the form and all its controls                             |

### Public Methods

| Method                    | Description                                                                                                           |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `triggerFormValidation()` | Manually triggers form validation update when form structure changes without value changes (e.g., conditional fields) |

### Form Models and Type Safety

All form models in ngx-vest-forms use `DeepPartial<T>` because Angular's template-driven forms build up values incrementally:

```typescript
import { DeepPartial } from 'ngx-vest-forms';

type MyFormModel = DeepPartial<{
  generalInfo: {
    firstName: string;
    lastName: string;
  };
}>;
```

This is why you must use the `?` operator in templates:

```html
<input [ngModel]="formValue().generalInfo?.firstName" name="firstName" />
```

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

This is how you write a basic Vest suite:

```typescript
import { enforce, only, staticSuite, test } from 'vest';
import { MyFormModel } from '../models/my-form.model';

export const myFormModelSuite = staticSuite(
  (model: MyFormModel, field?: string) => {
    if (field) {
      // Needed to not run every validation every time
      only(field);
    }

    test('firstName', 'First name is required', () => {
      enforce(model.firstName).isNotBlank();
    });

    test('lastName', 'Last name is required', () => {
      enforce(model.lastName).isNotBlank();
    });
  }
);
```

In the `test` function:

- **First parameter**: The field name (use dot notation for nested fields: `addresses.billingAddress.street`)
- **Second parameter**: The validation error message
- **Third parameter**: The validation assertion

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

ngx-vest-forms automatically optimizes validation performance by running validations only for the field being interacted with:

```typescript
import { enforce, only, staticSuite, test } from 'vest';

export const myFormModelSuite = staticSuite(
  (model: MyFormModel, field?: string) => {
    if (field) {
      only(field); // Only validate the specific field during user interaction
    }
    // When field is undefined (e.g., on submit), all validations run

    test('firstName', 'First name is required', () => {
      enforce(model.firstName).isNotBlank();
    });
    test('lastName', 'Last name is required', () => {
      enforce(model.lastName).isNotBlank();
    });
  }
);
```

This pattern ensures:

- ✅ During typing/blur: Only the current field validates (better performance)
- ✅ On form submit: All fields validate (complete validation)
- ✅ Untouched fields don't show errors prematurely (better UX)

> [!IMPORTANT]
> Always include the optional `field?: string` parameter in your suite and use the `only(field)` pattern. The library automatically passes the field name during individual field validation.

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

What if we want to remove a form control or form group? With reactive forms that would require a lot of work
but since Template driven forms do all the hard work for us, we can simply create a computed signal for that and
bind that in the template. Having logic in the template is considered a bad practice, so we can do all
the calculations in our class.

Let's hide `lastName` if `firstName` is not filled in:

```html
<div ngModelGroup="generalInfo">
  <label>First name</label>
  <input
    type="text"
    name="firstName"
    [ngModel]="formValue().generalInformation?.firstName"
  />

  @if(lastNameAvailable()){
  <label>Last name</label>
  <input
    type="text"
    name="lastName"
    [ngModel]="formValue().generalInformation?.lastName"
  />
  }
</div>
```

```typescript
class MyComponent {
  ...
  protected readonly lastNameAvailable =
    computed(() => !!this.formValue().generalInfo?.firstName);
}
```

This will automatically add and remove the form control from our form model.
This also works for a form group:

```html
@if(showGeneralInfo()){
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

```typescript
test('passwords.password', 'Password is not filled in', () => {
  enforce(model.passwords?.password).isNotBlank();
});
omitWhen(!model.passwords?.password, () => {
  test('passwords.confirmPassword', 'Confirm password is not filled in', () => {
    enforce(model.passwords?.confirmPassword).isNotBlank();
  });
});
omitWhen(
  !model.passwords?.password || !model.passwords?.confirmPassword,
  () => {
    test('passwords', 'Passwords do not match', () => {
      enforce(model.passwords?.confirmPassword).equals(
        model.passwords?.password
      );
    });
  }
);
```

Forget about manually adding, removing validators on reactive forms and not being able to
re-use them. This code is easy to test, easy to re-use on frontend, backend, angular, react, etc...
**Oh, it's also pretty readable**

## Advanced Topics

### Handling Form Structure Changes

When form structure changes dynamically in combination with _NON_ form elements (e.g., conditional fields are shown/hidden), the validation state may not update automatically since no control values change. For these scenarios, use the `triggerFormValidation()` method:

#### The Problem

```typescript
// Form structure changes based on selection
@if (procedureType() === 'typeA') {
  <input name="fieldA" [ngModel]="formValue().fieldA" />
}
@else if (procedureType() === 'typeB') {
  <input name="fieldB" [ngModel]="formValue().fieldB" />
}
@else if (procedureType() === 'typeC') {
  <!-- NON-FORM ELEMENT -->
  <p>No additional input required for this procedure type.</p>
}
```

**Issue**: When switching from `typeA` to `typeC`, the input field is removed but no control values change, so validation doesn't update automatically.

#### The Solution

```typescript
import { Component, signal, viewChild } from '@angular/core';

@Component({
  template: `
    <form
      scVestForm
      [suite]="validationSuite"
      (formValueChange)="formValue.set($event)"
      #vestForm="scVestForm"
    >
      <select
        name="procedureType"
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
})
export class MyFormComponent {
  readonly vestForm =
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
    this.vestForm.triggerFormValidation();
  }
}
```

#### When to Use `triggerFormValidation()`

Call this method in these scenarios:

- **After changing form structure** - When conditional fields are shown/hidden
- **After clearing form sections** - When resetting parts of the form
- **After dynamic field addition/removal** - When programmatically modifying form structure
- **After switching form modes** - When toggling between different form layouts

#### Field Clearing Pattern for Component State Consistency

##### When Field Clearing is Required

Field clearing utilities are **specifically needed** when conditional logic switches between:

- **Form inputs** (`<input>`, `<select>`, `<textarea>`) ↔ **NON-form elements** (`<p>`, `<div>`, informational content)

**Primary Use Case - The Problem Scenario:**

```typescript
// This template structure REQUIRES manual field clearing:
@if (procedureType === 'typeA') {
  <input name="fieldA" [ngModel]="formValue().fieldA" />  // Form input
} @else if (procedureType === 'typeB') {
  <input name="fieldB" [ngModel]="formValue().fieldB" />  // Form input
} @else if (procedureType === 'typeC') {
  <p>No additional input required for this procedure.</p>   // NON-form element!
}
```

**Why This Creates State Inconsistency:**

1. **Switching FROM form input TO non-form content:** Angular removes FormControl, but component signal retains old value
2. **Result:** `ngForm.form.value` becomes clean, but `formValue()` signal remains stale
3. **Problem:** State inconsistency between Angular's form state and your component state

```typescript
// Before switching from typeA to typeC:
formValue() = { procedureType: 'typeA', fieldA: 'some-value' };
ngForm.form.value = { procedureType: 'typeA', fieldA: 'some-value' };

// After switching (WITHOUT manual clearing):
formValue() = { procedureType: 'typeC', fieldA: 'some-value' }; // ❌ Stale fieldA!
ngForm.form.value = { procedureType: 'typeC' }; // ✅ Clean

// After switching (WITH manual clearing):
formValue() = { procedureType: 'typeC' }; // ✅ Consistent
ngForm.form.value = { procedureType: 'typeC' }; // ✅ Consistent
```

##### When Field Clearing is NOT Required

Pure form-to-form conditionals usually don't need manual field clearing:

```typescript
// This template structure usually DOES NOT require manual field clearing:
@if (inputType === 'text') {
  <input name="field" [ngModel]="formValue().field" type="text" />     // Form input
} @else if (inputType === 'number') {
  <input name="field" [ngModel]="formValue().field" type="number" />   // Form input
} @else if (inputType === 'email') {
  <input name="field" [ngModel]="formValue().field" type="email" />    // Form input
}
```

**Why:** All branches contain form inputs with the same `name` attribute, so Angular maintains the FormControl and your component state naturally stays consistent.

**The Pattern:**

```typescript
onStructureChange(newValue: string) {
  this.formValue.update((current) => ({
    ...current,
    procedureType: newValue,
    // Clear fields that are no longer relevant
    ...(newValue !== 'typeA' && { fieldA: undefined }),
    ...(newValue !== 'typeB' && { fieldB: undefined }),
  }));

  // Trigger validation update after structure change
  this.vestFormRef.triggerFormValidation();
}
```

#### Alternative: Utility Helper

For cleaner code, you can use the built-in utility functions from ngx-vest-forms:

```typescript
import { clearFieldsWhen } from 'ngx-vest-forms';

// In your component method
onStructureChange(newValue: string) {
  this.formValue.update((current) =>
    clearFieldsWhen(current, {
      fieldA: newValue !== 'typeA',
      fieldB: newValue !== 'typeB',
    })
  );

  // Trigger validation update after structure change
  this.vestFormRef.triggerFormValidation();
}
```

**Additional Utility Functions:**

````typescript
import { clearFields, keepFieldsWhen } from 'ngx-vest-forms';

// Clear specific fields unconditionally
const cleanedState = clearFields(currentFormValue, ['fieldA', 'fieldB']);

// Keep only fields that meet conditions
const filteredState = keepFieldsWhen(currentFormValue, {
  procedureType: true, // always keep
  fieldA: procedureType === 'typeA',
  fieldB: procedureType === 'typeB',
});
```#### Validation Suite Pattern for Conditional Fields

```typescript
import { staticSuite, test, enforce, omitWhen, only } from 'vest';

export const myValidationSuite = staticSuite(
  (model: MyFormModel, field?: string) => {
    if (field) {
      only(field); // Performance optimization
    }

    // Always validate procedure type
    test('procedureType', 'Procedure type is required', () => {
      enforce(model.procedureType).isNotBlank();
    });

    // Conditional validations
    omitWhen(model.procedureType !== 'typeA', () => {
      test('fieldA', 'Field A is required for Type A', () => {
        enforce(model.fieldA).isNotBlank();
      });
    });

    omitWhen(model.procedureType !== 'typeB', () => {
      test('fieldB', 'Field B is required for Type B', () => {
        enforce(model.fieldB).isNotBlank();
      });
    });

    // Note: No validation needed for typeC as it has no input fields
  }
);
````

### Field State Utilities

ngx-vest-forms provides utility functions specifically designed for the scenario where conditional logic switches between **form inputs** and **non-form elements** (like informational text, paragraphs, or other non-input content).

> **Key Use Case:** These utilities are primarily needed when your template conditionally renders form inputs in some branches and non-form content in others. They ensure your component state stays consistent with the actual form structure.

### `clearFieldsWhen`

Conditionally clears fields when switching from form inputs to non-form content.

```typescript
import { clearFieldsWhen } from 'ngx-vest-forms';

// EXAMPLE: Clear fields when switching to non-form content (typeC shows info text, not input)
const updatedState = clearFieldsWhen(currentFormValue, {
  fieldA: procedureType !== 'typeA', // Clear when NOT showing fieldA input
  fieldB: procedureType !== 'typeB', // Clear when NOT showing fieldB input
  // When procedureType === 'typeC', both fields are cleared (typeC shows <p> text, not inputs)
  shippingAddress: !useShippingAddress, // Clear when showing "No shipping needed" message
});
```

### `clearFields`

Unconditionally clears specific fields. Useful for form reset operations or cleanup tasks.

```typescript
import { clearFields } from 'ngx-vest-forms';

// Clear specific fields unconditionally
const cleanedState = clearFields(currentFormValue, [
  'temporaryData',
  'draftSaved',
]);
```

### `keepFieldsWhen`

Creates a new state containing only fields that meet specified conditions. Takes a "whitelist" approach instead of clearing unwanted fields.

```typescript
import { keepFieldsWhen } from 'ngx-vest-forms';

// Keep only relevant fields
const filteredState = keepFieldsWhen(currentFormValue, {
  basicInfo: true, // always keep
  addressInfo: needsAddress,
  paymentInfo: requiresPayment,
});
```

### Why These Utilities Are Needed

The utilities are specifically needed when conditionally switching between **form inputs** and **non-form elements**:

**The Core Problem:**

1. **Template structure:** `@if (condition) { <input> } @else { <p>Info text</p> }`
2. **Angular's behavior:** Automatically removes FormControls when switching to non-form content
3. **Your component signals:** Retain old field values from when input was present
4. **Result:** State inconsistency between `ngForm.form.value` (clean) and `formValue()` (stale)

**The Solution:**

These utilities synchronize your component state with Angular's form state, ensuring consistency when form structure changes involve non-form content.

> **Note:** Pure form-to-form conditionals (e.g., switching between different input types with the same `name`) typically don't require these utilities as Angular maintains the FormControl throughout.

### More Examples

#### Conditional Fields Example

```typescript
import {
  Component,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form scVestForm [suite]="suite" (formValueChange)="formValue.set($event)">
      <!-- Age field -->
      <div sc-control-wrapper>
        <label>Age</label>
        <input [ngModel]="formValue().age" name="age" type="number" />
      </div>

      <!-- Emergency contact - only required if under 18 -->
      @if (emergencyContactRequired()) {
        <div sc-control-wrapper>
          <label>Emergency Contact</label>
          <input
            [ngModel]="formValue().emergencyContact"
            name="emergencyContact"
          />
        </div>
      }
    </form>
  `,
})
export class ConditionalFormComponent {
  protected readonly formValue = signal<ConditionalFormModel>({});

  // Computed signal for conditional logic
  protected readonly emergencyContactRequired = computed(
    () => (this.formValue().age || 0) < 18
  );
}
```

#### Live Examples

- **[Purchase Form Demo](https://github.com/ngx-vest-forms/ngx-vest-forms/tree/master/projects/examples/src/app/components/smart/purchase-form)** - Complex form with nested objects, validation dependencies, and conditional logic
- **[Business Hours Demo](https://github.com/ngx-vest-forms/ngx-vest-forms/tree/master/projects/examples/src/app/components/smart/business-hours-form)** - Dynamic form arrays with complex validation rules

> **💡 Pro Tip**: Check out our detailed [Structure Change Detection Guide](./docs/STRUCTURE_CHANGE_DETECTION.md) for advanced handling of conditional form scenarios, alternative approaches, and performance considerations.

### Composable Validations

We can compose validations suites with sub suites. After all, we want to re-use certain pieces of our
validation logic and we don't want one huge unreadable suite.
This is quite straightforward with Vest.

Let's take this simple function that validates an address:

```typescript
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
  test(`${field}.zipcode`, 'Zipcode is required', () => {
    enforce(model?.zipcode).isNotBlank();
  });
  test(`${field}.number`, 'Number is required', () => {
    enforce(model?.number).isNotBlank();
  });
  test(`${field}.country`, 'Country is required', () => {
    enforce(model?.country).isNotBlank();
  });
}
```

Our suite would consume it like this:

```typescript
import { enforce, omitWhen, only, staticSuite, test } from 'vest';
import { PurchaseFormModel } from '../models/purchaseFormModel';

export const mySuite = staticSuite(
  (model: PurchaseFormModel, field?: string) => {
    if (field) {
      only(field);
    }
    addressValidations(
      model.addresses?.billingAddress,
      'addresses.billingAddress'
    );
    addressValidations(
      model.addresses?.shippingAddress,
      'addresses.shippingAddress'
    );
  }
);
```

We achieved decoupling, readability and reuse of our addressValidations.

#### A More Complex Example

Let's combine the conditional part with the reusable part.
We have 2 addresses, but the shippingAddress is only required when the `shippingAddressIsDifferentFromBillingAddress`
Checkbox is checked. But if it is checked, all fields are required.
And if both addresses are filled in, they should be different.

This gives us validation on:

- [x] The addresses form field (they can't be equal)
- [x] The shipping Address field (only required when checkbox is checked)
- [x] validation on all the address fields (street, number, etc) on both addresses

```typescript
addressValidations(model.addresses?.billingAddress, 'addresses.billingAddress');
omitWhen(!model.addresses?.shippingAddressDifferentFromBillingAddress, () => {
  addressValidations(
    model.addresses?.shippingAddress,
    'addresses.shippingAddress'
  );
  test('addresses', 'The addresses appear to be the same', () => {
    enforce(JSON.stringify(model.addresses?.billingAddress)).notEquals(
      JSON.stringify(model.addresses?.shippingAddress)
    );
  });
});
```

### Creating Custom Control Wrappers

If the default `sc-control-wrapper` doesn't meet your design requirements, you can easily create your own using the `FormErrorDisplayDirective`. This directive provides all the necessary state and logic for displaying errors, warnings, and pending states.

##### Basic Custom Wrapper

```typescript
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormErrorDisplayDirective } from 'ngx-vest-forms';

@Component({
  selector: 'app-custom-control-wrapper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: FormErrorDisplayDirective,
      inputs: ['errorDisplayMode'],
    },
  ],
  template: `
    <div class="field-wrapper">
      <ng-content />

      @if (errorDisplay.shouldShowErrors()) {
        <div class="error-message">
          @for (error of errorDisplay.errors(); track error) {
            <span>{{ error.message || error }}</span>
          }
        </div>
      }

      @if (errorDisplay.isPending()) {
        <div class="validating">Validating...</div>
      }
    </div>
  `,
})
export class CustomControlWrapperComponent {
  protected readonly errorDisplay = inject(FormErrorDisplayDirective, {
    self: true,
  });
}
```

##### Advanced Custom Wrapper with Warnings

The `FormErrorDisplayDirective` also exposes warning messages from Vest.js:

```typescript
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormErrorDisplayDirective } from 'ngx-vest-forms';

@Component({
  selector: 'app-advanced-wrapper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [FormErrorDisplayDirective],
  template: `
    <div class="form-field">
      <ng-content />

      <!-- Errors -->
      @if (errorDisplay.shouldShowErrors()) {
        <div class="errors" role="alert" aria-live="polite">
          @for (error of errorDisplay.errors(); track error) {
            <p class="error">{{ error.message || error }}</p>
          }
        </div>
      }

      <!-- Warnings (non-blocking feedback) -->
      @if (errorDisplay.warnings().length > 0) {
        <div class="warnings" role="status" aria-live="polite">
          @for (warning of errorDisplay.warnings(); track warning) {
            <p class="warning">{{ warning }}</p>
          }
        </div>
      }

      <!-- Pending state -->
      @if (errorDisplay.isPending()) {
        <div class="pending" aria-busy="true">
          <span class="spinner"></span>
          Validating...
        </div>
      }
    </div>
  `,
})
export class AdvancedWrapperComponent {
  protected readonly errorDisplay = inject(FormErrorDisplayDirective, {
    self: true,
  });
}
```

##### Available Signals from FormErrorDisplayDirective

The directive exposes these computed signals for building custom UIs:

```typescript
// Error display control
shouldShowErrors(); // boolean - Whether to show errors based on mode and state
errors(); // string[] - Filtered errors (empty during pending)
warnings(); // string[] - Filtered warnings (empty during pending)
isPending(); // boolean - Whether async validation is running

// Raw state signals (from FormControlStateDirective)
errorMessages(); // string[] - All error messages
warningMessages(); // string[] - All warning messages
controlState(); // FormControlState - Complete control state
isTouched(); // boolean - Whether control has been touched
isDirty(); // boolean - Whether control value has changed
isValid(); // boolean - Whether control is valid
isInvalid(); // boolean - Whether control is invalid
hasPendingValidation(); // boolean - Whether validation is pending
updateOn(); // string - The ngModelOptions.updateOn value
formSubmitted(); // boolean - Whether form has been submitted
```

##### Real-World Example: Material Design Style Wrapper

```typescript
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormErrorDisplayDirective } from 'ngx-vest-forms';

@Component({
  selector: 'app-mat-field-wrapper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: FormErrorDisplayDirective,
      inputs: ['errorDisplayMode'],
    },
  ],
  host: {
    class: 'mat-form-field',
    '[class.mat-form-field-invalid]': 'errorDisplay.shouldShowErrors()',
    '[attr.aria-busy]': "errorDisplay.isPending() ? 'true' : null",
  },
  template: `
    <div class="mat-form-field-wrapper">
      <div class="mat-form-field-flex">
        <ng-content />
      </div>

      <div class="mat-form-field-subscript-wrapper">
        @if (errorDisplay.shouldShowErrors()) {
          <div class="mat-error" role="alert" aria-live="assertive">
            @for (error of errorDisplay.errors(); track error) {
              <span>{{ error.message || error }}</span>
            }
          </div>
        }

        @if (
          errorDisplay.warnings().length > 0 && !errorDisplay.shouldShowErrors()
        ) {
          <div class="mat-hint mat-warn" role="status">
            @for (warning of errorDisplay.warnings(); track warning) {
              <span>{{ warning }}</span>
            }
          </div>
        }

        @if (errorDisplay.isPending()) {
          <div class="mat-hint" aria-busy="true">
            <mat-spinner diameter="16"></mat-spinner>
            Validating...
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        margin-bottom: 1rem;
      }

      .mat-error {
        color: #f44336;
        font-size: 0.875rem;
      }

      .mat-hint {
        color: rgba(0, 0, 0, 0.6);
        font-size: 0.875rem;
      }

      .mat-warn {
        color: #ff9800;
      }
    `,
  ],
})
export class MatFieldWrapperComponent {
  protected readonly errorDisplay = inject(FormErrorDisplayDirective, {
    self: true,
  });
}
```

##### Using Your Custom Wrapper

Once created, use your custom wrapper just like the built-in `sc-control-wrapper`:

```typescript
@Component({
  imports: [vestForms, CustomControlWrapperComponent],
  template: `
    <form scVestForm [suite]="suite" (formValueChange)="formValue.set($event)">
      <app-custom-control-wrapper>
        <label>Email</label>
        <input name="email" [ngModel]="formValue().email" type="email" />
      </app-custom-control-wrapper>
    </form>
  `
})
```

#### Best Practices for Custom Wrappers

1. **Use `hostDirectives`** - Always apply `FormErrorDisplayDirective` as a host directive for automatic state management
2. **Respect accessibility** - Use proper ARIA attributes (`role="alert"`, `aria-live`, `aria-busy`)
3. **Filter during pending** - The directive's `errors()` and `warnings()` signals automatically filter during validation
4. **Leverage computed signals** - All exposed signals are computed, so they update automatically
5. **Style based on state** - Use host bindings to apply CSS classes based on error display state

### Conditional validations

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

```typescript
test('passwords.password', 'Password is not filled in', () => {
  enforce(model.passwords?.password).isNotBlank();
});
omitWhen(!model.passwords?.password, () => {
  test('passwords.confirmPassword', 'Confirm password is not filled in', () => {
    enforce(model.passwords?.confirmPassword).isNotBlank();
  });
});
omitWhen(
  !model.passwords?.password || !model.passwords?.confirmPassword,
  () => {
    test('passwords', 'Passwords do not match', () => {
      enforce(model.passwords?.confirmPassword).equals(
        model.passwords?.password
      );
    });
  }
);
```

Forget about manually adding, removing validators on reactive forms and not being able to
re-use them. This code is easy to test, easy to re-use on frontend, backend, angular, react, etc...
**Oh, it's also pretty readable**

### Validations on the Root Form

When we want to validate multiple fields that are depending on each other,
it is a best practice to wrap them in a parent form group.
If `password` and `confirmPassword` have to be equal the validation should not happen on
`password` nor on `confirmPassword`, it should happen on `passwords`:

```typescript
const form = {
  // validation happens here
  passwords: {
    password: '',
    confirmPassword: '',
  },
};
```

Sometimes we don't have the ability to create a form group for 2 depending fields, or sometimes we just
want to create validation rules on portions of the form. For that we can use `validateRootForm`.
Use the `errorsChange` output to keep the errors as state in a signal that we can use in the template
wherever we want.

```html
{{ errors()?.['rootForm'] }}
<!-- render the errors on the rootForm -->
{{ errors() }}
<!-- render all the errors -->
<form
  scVestForm
  [formValue]="formValue()"
  [validateRootForm]="true"
  [formShape]="shape"
  [suite]="suite"
  (errorsChange)="errors.set($event)"
  ...
></form>
```

```typescript
export class MyformComponent {
  protected readonly formValue = signal<MyFormModel>({});
  protected readonly suite = myFormModelSuite;
  // Keep the errors in state
  protected readonly errors = signal<Record<string, string>>({});
}
```

When setting the `[validateRootForm]` directive to true, the form will
also create an ngValidator on root level, that listens to the ROOT_FORM field.

To make this work we need to use the field in the vest suite like this:

```typescript
import { ROOT_FORM } from 'ngx-vest-forms';

test(ROOT_FORM, 'Brecht is not 30 anymore', () => {
  enforce(
    model.firstName === 'Brecht' &&
      model.lastName === 'Billiet' &&
      model.age === 30
  ).isFalsy();
});
```

### Validation of dependant controls and or groups

Sometimes, form validations are dependent on the values of other form controls or groups.
This scenario is common when a field's validity relies on the input of another field.
A typical example is the `confirmPassword` field, which should only be validated if the `password` field is filled in.
When the `password` field value changes, it necessitates re-validating the `confirmPassword` field to ensure
consistency.

#### Understanding the Architecture: Why `validationConfig` Is Needed

Before diving into the implementation, it's important to understand the architectural boundaries between Vest.js and Angular:

**What Vest.js Handles:**

- ✅ Validation logic and rules
- ✅ Conditional validation with `omitWhen()`, `skipWhen()`
- ✅ Field-level optimization with `only()`
- ✅ Async validations with AbortController
- ✅ Cross-field validation logic (e.g., "passwords must match")

**What Vest.js Cannot Do:**

- ❌ Trigger Angular to revalidate a different form control
- ❌ Control Angular's form control lifecycle
- ❌ Tell Angular "when field X changes, also validate field Y"

**Angular's Limitation:**
Angular template-driven forms do not natively know about cross-field dependencies. When a field changes, only its own validators run automatically.

**How `validationConfig` Bridges This Gap:**

The `validationConfig` tells Angular's form system: "when field X changes, also call `updateValueAndValidity()` on field Y". This ensures that:

- Cross-field validations run at the right time
- UI error states update correctly
- Form validation state remains consistent

**Example of the Problem:**

```typescript
// In your Vest suite
test('confirmPassword', 'Passwords must match', () => {
  enforce(model.confirmPassword).equals(model.password);
});
```

Without `validationConfig`: If user changes `password`, the `confirmPassword` field won't be revalidated automatically, even though its validity depends on the password value.

With `validationConfig`: Angular knows to revalidate `confirmPassword` whenever `password` changes.

**Architectural Benefits of This Separation:**

This separation of concerns provides several advantages:

- **Clarity**: Vest.js focuses on validation logic, `validationConfig` handles Angular orchestration
- **Reusability**: Vest suites work across frameworks, while `validationConfig` is Angular-specific
- **Maintainability**: Changes to validation logic don't affect dependency management
- **Performance**: Only necessary validations run, only necessary controls revalidate
- **Testability**: Validation logic can be tested independently from Angular form behavior

Here's how you can handle validation dependencies with ngx-vest-forms and vest.js:

Use Vest to create a suite where you define the conditional validations.
For example, the `confirmPassword` field should only be validated when the `password` field is not empty.
Additionally, you need to ensure that both fields match.

```typescript
import { enforce, omitWhen, staticSuite, test } from 'vest';
import { MyFormModel } from '../models/my-form.model';

import { enforce, omitWhen, only, staticSuite, test } from 'vest';

    test('password', 'Password is required', () => {
      enforce(model.password).isNotBlank();
    });

    omitWhen(!model.password, () => {
      test('confirmPassword', 'Confirm password is required', () => {
        enforce(model.confirmPassword).isNotBlank();
      });
    });

    omitWhen(!model.password || !model.confirmPassword, () => {
      test('passwords', 'Passwords do not match', () => {
        enforce(model.confirmPassword).equals(model.password);
      });
    });
  }
);
```

Creating a validation config.
The `scVestForm` has an input called `validationConfig`, that we can use to let the system know when to retrigger validations.

```typescript
protected validationConfig = {
    password: ['passwords.confirmPassword']
}
```

Here we see that when password changes, it needs to update the field `passwords.confirmPassword`.
This validationConfig is completely dynamic, and can also be used for form arrays.

```html
<form scVestForm ... [validationConfig]="validationConfig">
  <div ngModelGroup="passwords">
    <label>Password</label>
    <input
      type="password"
      name="password"
      [ngModel]="formValue().passwords?.password"
    />

    <label>Confirm Password</label>
    <input
      type="password"
      name="confirmPassword"
      [ngModel]="formValue().passwords?.confirmPassword"
    />
  </div>
</form>
```

#### Advanced State Management Patterns

The `validationConfig` works seamlessly with different state management approaches. By default, most examples show using a single signal for both input and output:

```typescript
// Standard pattern: single signal for both input and output
protected readonly formValue = signal<MyFormModel>({});

// Template
<form scVestForm
      [formValue]="formValue()"
      (formValueChange)="formValue.set($event)"
      [validationConfig]="validationConfig">
```

However, you can also use **separate signals** for input and output if your application architecture requires it:

```typescript
// Advanced pattern: separate input and output signals
protected readonly inputFormValue = signal<MyFormModel>({});
protected readonly outputFormValue = signal<MyFormModel>({});

// Template
<form scVestForm
      [formValue]="inputFormValue()"
      (formValueChange)="handleFormChange($event)"
      [validationConfig]="validationConfig">
  <input name="password" [ngModel]="outputFormValue().password" />
  <input name="confirmPassword" [ngModel]="outputFormValue().confirmPassword" />
</form>

// Component
handleFormChange(value: MyFormModel) {
  // Update output signal independently
  this.outputFormValue.set(value);
  // Optionally sync input signal or perform other logic
}
```

**Why this works**: The validation configuration operates at the **form control level**, listening directly to Angular's form control changes rather than component signals. This makes it independent of your chosen state management pattern.

This pattern is useful when:

- You need different processing logic for form inputs vs outputs
- You're integrating with state management libraries
- You want to maintain separate concerns between form display and form handling

#### Form array validations

An example can be found [in this simplified courses article](https://blog.simplified.courses/template-driven-forms-with-form-arrays/)
There is also a complex example of form arrays with complex validations in the examples.

### Child form components

Big forms result in big files. It makes sense to split them up.
For instance an address form can be reused, so we want to create a child component for that.
We have to make sure that this child component can access the ngForm.
For that we have to use the `vestFormViewProviders` from `ngx-vest-forms`

```typescript
...
import { input } from '@angular/core';
import { vestForms, vestFormsViewProviders } from 'ngx-vest-forms';

@Component({
  ...
  viewProviders: [vestFormsViewProviders]
})
export class AddressComponent {
  readonly address = input<AddressModel>();
}
```

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
