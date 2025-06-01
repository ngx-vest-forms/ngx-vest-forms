# ngx-vest-forms

## Modern, Type-Safe, Zero-Boilerplate Angular Forms with Vest

`ngx-vest-forms` is a lightweight, modern (lightweight) adapter for Angular Template Driven Forms and [vestjs](https://vestjs.dev). It enables unidirectional, type-safe, and reactive forms with minimal code, leveraging Angular signals, standalone components, and the latest best practices.

**Key Features:**

- **Zero Boilerplate:** Just use `ngModel`/`ngModelGroup` and connect a Vest suite—no manual wiring or error handling needed.
- **Type Safety:** Optional schema support (Zod, ArkType, Valibot, or object template) for compile-time safety and IDE inference.
- **Form-Compatible Types:** Built-in utility types like `FormCompatibleDeepRequired<T>` solve Date/string mismatches in form initialization.
- **Signals & Reactivity:** All form state (value, errors, validity, pending, etc.) is exposed as signals for easy, reactive UI updates.
- **Powerful Validations:** Use Vest.js for declarative, composable, and async validation logic.
- **Accessible by Default:** Built-in error display, ARIA roles, and keyboard support via `<sc-control-wrapper>`.
- **Modern Angular:** Designed for Angular 17+ standalone components, signals, and new control flow (`@if`, `@for`).

---

## Installation

```sh
npm i ngx-vest-forms
```

---

## Quick Start: Idiomatic Usage

### 1. Define Your Model and (Optional) Schema

```typescript
import { signal } from '@angular/core';
import { modelToStandardSchema } from 'ngx-vest-forms';

const userTemplate = { name: '', email: '' };
const userSchema = modelToStandardSchema(userTemplate); // Or use Zod/ArkType/Valibot
```

### 2. Create a Vest Validation Suite

```typescript
import { staticSuite, test, enforce } from 'vest';

const userSuite = staticSuite((data = {}, field?: string) => {
  test('name', 'Name is required', () => enforce(data.name).isNotEmpty());
  test('email', 'Email is required', () => enforce(data.email).isNotEmpty());
});
```

### 3. Use in a Standalone Angular Component

```typescript
import { Component } from '@angular/core';
import { vestForms } from 'ngx-vest-forms';

@Component({
  standalone: true,
  imports: [vestForms],
  template: `
    <form
      scVestForm
      [vestSuite]="suite"
      [(formValue)]="model"
      [formSchema]="schema"
      #vestForm="scVestForm"
    >
      <sc-control-wrapper>
        <label>Name: <input name="name" [(ngModel)]="model().name" /></label>
      </sc-control-wrapper>
      <sc-control-wrapper>
        <label>Email: <input name="email" [(ngModel)]="model().email" /></label>
      </sc-control-wrapper>
      <button
        type="submit"
        [disabled]="
          vestForm.formState().pending || vestForm.formState().invalid
        "
      >
        Submit
      </button>
    </form>
  `,
})
export class UserFormComponent {
  protected readonly model = signal(userTemplate);
  protected readonly schema = userSchema;
  protected readonly suite = userSuite;
}
```

---

## Best Practices (v2+)

- **Always use `<sc-control-wrapper>` or `[scControlWrapper]`** for every input or group. This handles error display, accessibility, and pending state automatically.
- **Error display modes are now: 'on-blur', 'on-submit', 'on-blur-or-submit'** (was: 'touch', 'submit', 'touchOrSubmit').
- **Error display logic is now aware of the control's `ngModelOptions.updateOn` value** for correct timing. If `updateOn: 'submit'`, errors only show after submit, regardless of display mode.
- **Warning:** If you set `errorDisplayMode` to `'on-blur'` or `'on-blur-or-submit'` but use `ngModelOptions.updateOn: 'submit'`, errors will only show after submit. A warning is logged in development mode to help you catch this configuration issue.
- **Use `[(formValue)]` two-way binding** for your form model (a signal or store property). Remove all `[formValue]`/`(formValueChange)` patterns unless you need unidirectional data flow.
- **Use signals and `computed()`** for all form state and derived UI logic.
- **Use the new Angular control flow** (`@if`, `@for`, `@defer`) in templates.
- **Never manually display field errors**—let the control wrapper handle it.
- **Use `[validateRootForm]="false"` only if you do not want root-level (cross-field) validation.**
- **Provide a `[formSchema]`** for type safety and IDE support, especially for complex/nested forms.
- **Use `[validationConfig]`** for cross-field dependencies (e.g., confirm password, cyclic dependencies).
- **Remove all deprecated patterns** (old signals, `[formShape]`, manual error markup, etc.).
- **Keep validation suites in separate files** for clarity and reusability.
- \*\*Document unique capabilities in each example.

---

## Example: Advanced Form with Schema and Cross-Field Validation

```typescript
import { Component, signal } from '@angular/core';
import { vestForms, modelToStandardSchema } from 'ngx-vest-forms';
import { staticSuite, test, enforce } from 'vest';

const purchaseTemplate = {
  amount: null,
  description: '',
};
const purchaseSchema = modelToStandardSchema(purchaseTemplate);
const purchaseSuite = staticSuite((data = {}, field?: string) => {
  test('amount', 'Amount is required', () => enforce(data.amount).isNotEmpty());
  test('description', 'Description is required', () =>
    enforce(data.description).isNotEmpty(),
  );
  // Cross-field: amount required if description is not empty, etc.
});

@Component({
  standalone: true,
  imports: [vestForms],
  template: `
    <form
      scVestForm
      [vestSuite]="suite"
      [(formValue)]="model"
      [formSchema]="schema"
      #vestForm="scVestForm"
    >
      <sc-control-wrapper>
        <label
          >Amount: <input name="amount" [(ngModel)]="model().amount"
        /></label>
      </sc-control-wrapper>
      <sc-control-wrapper>
        <label
          >Description:
          <input name="description" [(ngModel)]="model().description"
        /></label>
      </sc-control-wrapper>
      <button
        type="submit"
        [disabled]="
          vestForm.formState().pending || vestForm.formState().invalid
        "
      >
        Submit
      </button>
      <pre>{{ vestForm.formState() | json }}</pre>
    </form>
  `,
})
export class PurchaseFormComponent {
  protected readonly model = signal(purchaseTemplate);
  protected readonly schema = purchaseSchema;
  protected readonly suite = purchaseSuite;
}
```

---

## Migration & Breaking Changes

See [`BREAKING_CHANGES_PUBLIC_API.md`](./docs/BREAKING_CHANGES_PUBLIC_API.md) for a full migration guide and details on all breaking changes in v2+.

**Notable:**

- Error display modes have been renamed and are now updateOn-aware. See migration guide for details.

---

## Further Reading & Resources

- [Vest.js Documentation](https://vestjs.dev)
- [Angular Signals](https://angular.dev/reference/signals)
- [Zod](https://zod.dev/), [ArkType](https://arktype.io/), [Valibot](https://valibot.dev/)
- [ngx-vest-forms Examples](./docs/EXAMPLES.md)

---

## Contributing & Internal Changes

For internal (library developer) breaking changes and architectural notes, see [`BREAKING_CHANGES_INTERNAL.md`](./docs/BREAKING_CHANGES_INTERNAL.md).

## Schema Adapters for Type Safety and Validation

`ngx-vest-forms` includes a powerful schema adapter system that enhances your forms with robust type safety and validation using schema libraries or simple object templates.

### Key Benefits

- **Type Safety:** Get compile-time checks for form structure and values
- **Runtime Validation:** Validate user input against schema constraints
- **Multiple Schema Libraries:** Works with Zod, Valibot, ArkType, or simple object templates
- **Developer Experience:** Improved IntelliSense and error detection in your IDE

### When to Use Schema Adapters

- For complex, nested form structures
- When you need runtime validation beyond Vest
- To share validation logic between frontend and backend
- For precise type inference in your form values

### Basic Example

```typescript
import { modelToStandardSchema } from 'ngx-vest-forms';
import { Component, signal } from '@angular/core';
import { vestForms } from 'ngx-vest-forms';

// Simple object template approach
const userTemplate = {
  name: '',
  email: '',
};

// Create a schema from the template
const userSchema = modelToStandardSchema(userTemplate);

@Component({
  standalone: true,
  imports: [vestForms],
  template: `
    <form
      scVestForm
      [formSchema]="userSchema"
      [(formValue)]="userData"
      #userForm="scVestForm"
    >
      <!-- Access values via formState().value -->
      <input name="name" [ngModel]="userForm.formState().value?.name" />
      <input name="email" [ngModel]="userForm.formState().value?.email" />
    </form>
  `,
})
export class UserFormComponent {
  protected readonly userSchema = userSchema;
  protected readonly userData = signal(userTemplate);
}
```

### Using Schema Libraries (Zod Example)

```typescript
import { z } from 'zod';

// Define a schema with validation rules
const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
});

// Infer the type from the schema
type User = z.infer<typeof userSchema>;
```

### Available Schema Utilities

- **`modelToStandardSchema(template)`** - Convert object templates to standard schemas
- **`extractTemplateFromSchema(schema)`** - Extract templates from schemas (useful for runtime validation)

For complete examples and advanced usage including Valibot and ArkType, see:

- [Business Hours Form with Zod](projects/examples/src/app/business-hours-form/business-hours-form.zod-example.ts)
- [Schema Adapters Documentation](docs/schema-adapters.md) - **Comprehensive guide with all schema libraries, migration patterns, and best practices**

### Resources

- [Prefer Template-Driven Forms | ng-conf 2021](https://www.youtube.com/watch?v=L7rGogdfe2Q) -- by Ward Bell
- [Form Validation Done Right | ng-conf 2022](https://www.youtube.com/watch?v=EMUAtQlh9Ko) -- by Ward Bell
- [Template-driven or reactive forms in Angular](https://blog.simplified.courses/template-driven-or-reactive-forms-in-angular/) -- by Brecht Billiet
- [Introducing ngx-vest-forms: Simplify Complex Angular Form](https://blog.simplified.courses/introducing-ngx-vest-forms/) -- by Brecht Billiet
- [A practical guide to Angular Template-Driven Forms](https://timdeschryver.dev/blog/a-practical-guide-to-angular-template-driven-forms) -- by Tim Deschryver
- [Why I switched to template-driven forms](https://armenvardanyan.dev/blog/why-i-switched-to-template-driven-forms) -- by Armen Vardanyan

## Example Gallery Navigation

See [`EXAMPLES.md`](./docs/EXAMPLES.md) for a curated, progressive list of examples from basic to advanced, including dynamic fields and schema-driven validation.

**New Example:**

- [Contact Form: Field-level validation only, root form validation disabled](projects/examples/src/app/contact-form/contact-form.component.ts)

This example demonstrates how to use `[validateRootForm]="false"` for forms that only require field-level validation.

---

## Two-way Binding with `model()` for `[formValue]` (Angular 17+)

### New Recommended Pattern: `[(formValue)]` Two-way Binding

Starting with v2+, `ngx-vest-forms` supports two-way binding for form values using the new `model()` API. This allows you to bind your signal or store property directly to the form, keeping it in sync automatically—no manual event handling required.

**Before:**

```html
<form
  scVestForm
  [formValue]="formValue()"
  (formValueChange)="formValue.set($event)"
>
  ...
</form>
```

**After (Recommended):**

```html
<form scVestForm [(formValue)]="formValue">...</form>
```

If you use a signal store (e.g., NgRx SignalStore), you can bind the store's signal directly:

```html
<form scVestForm [(formValue)]="store.formValue">...</form>
```

**Migration steps:**

1. Replace `[formValue]="formValue()" (formValueChange)="formValue.set($event)"` with `[(formValue)]="formValue"` in your templates.
2. Remove any manual event handlers for form value changes in your component.
3. If using a store, bind the store's signal directly.

**Why migrate?**

- **Simpler code:** No more manual event handling for form value changes.
- **Direct store integration:** Works seamlessly with signals and signal-based stores.
- **Less boilerplate:** One binding keeps everything in sync.
- **Easier to reason about:** The form value is always up-to-date in your signal or store.

**Backward compatibility:**

The old `[formValue]`/`(formValueChange)` pattern is still supported for backward compatibility, but the new two-way binding is preferred for all new code.

---

## Creating a simple form (Recommended: Use `formState`)

The recommended way to work with forms in `ngx-vest-forms` is to use the new `formState` signal, which exposes the entire form state (value, errors, validity, pending, etc.) in a single, type-safe object. This simplifies your component logic and template, and ensures you always have the latest state in a single place.

Let's start by explaining how to create a simple form.
Suppose you want a form with a form group called `generalInfo` that has 2 properties:

- `firstName`
- `lastName`

Import the `vestForms` const in the imports section of the `@Component` decorator. Apply the `scVestForm` directive to the `form` tag, and provide the Vest validation suite using the `[vestSuite]` input.

Optionally, you can provide an initial value using `[formValue]` and a schema for type-safety using `[formSchema]`.

In the form, create a form group for `generalInfo` with the `ngModelGroup` directive, and two inputs with the `name` attribute and `[ngModel]` input. **Do not use the banana-in-a-box syntax; use only square brackets for unidirectional dataflow.**

````typescript
import {
  vestForms,
  DeepPartial,
  VestSuite,
  FormDirective,
} from 'ngx-vest-forms';
import { suite, test, enforce } from 'vest';
import { Component, viewChild, computed, Signal } from '@angular/core';

## Advanced Utilities and Type Safety

### Custom Async Validators with Vest

`ngx-vest-forms` provides a static utility for integrating Vest validation into custom Angular async validators, useful for standalone controls or reactive forms:

#### `FormDirective.createVestAsyncValidator`

This static method allows you to create an Angular `AsyncValidatorFn` using a Vest suite. It is especially useful for custom controls or when integrating Vest validation into reactive forms.

**Example:**

```typescript
import { FormDirective } from 'ngx-vest-forms';
import { suite, test, enforce } from 'vest';
import { FormControl } from '@angular/forms';

const usernameSuite = suite((model = {}, field) => {
  test('username', 'Username is required', () => {
    enforce(model.username).isNotEmpty();
  });
  test('username', 'Username must be at least 3 chars', () => {
    enforce(model.username).longerThanOrEquals(3);
  });
});

const usernameControl = new FormControl('', {
  asyncValidators: [
    FormDirective.createVestAsyncValidator(
      usernameSuite,
      'username',
      () => ({ username: usernameControl.value }),
      300 // debounce ms
    )
  ]
});
````

### Field Path Utilities

For advanced scenarios, you can manipulate deeply nested form values and errors using field-path utilities:

- `getValueAtPath(obj, path)` – Safely get a value at a deep path (e.g., `'addresses[1].city'`).
- `setValueAtPath(obj, path, value)` – Set a value at a deep path, creating objects/arrays as needed.
- `parseFieldPath(path)` – Convert a string path like `'addresses[1].city'` to an array: `['addresses', 1, 'city']`.
- `stringifyFieldPath(pathArray)` – Convert a path array back to a string.

**Example:**

```typescript
import {
  getValueAtPath,
  setValueAtPath,
  parseFieldPath,
  stringifyFieldPath,
} from 'ngx-vest-forms';

const formValue = {
  addresses: [
    { street: 'Main St', city: 'Springfield' },
    { street: 'Second St', city: 'Shelbyville' },
  ],
};
const street = getValueAtPath(formValue, 'addresses[1].street'); // 'Second St'
setValueAtPath(formValue, 'addresses[0].city', 'Capital City');
const pathArray = parseFieldPath('addresses[0].street'); // ['addresses', 0, 'street']
const pathString = stringifyFieldPath(['addresses', 1, 'city']); // 'addresses[1].city'
```

### Type Utility: DeepPartial

`DeepPartial<T>` is a utility type for making all properties of a type (including nested ones) optional. This is useful for template-driven forms, where not all fields may be present at all times.

> **Recommendation:** For robust type safety and advanced type utilities, we recommend using [`ts-essentials`](https://github.com/ts-essentials/ts-essentials) in your project. `ts-essentials` provides a well-tested, comprehensive `DeepPartial` and many other helpful types.

**Example:**

```typescript
import type { DeepPartial } from 'ngx-vest-forms';

type MyFormModel = DeepPartial<{
  generalInfo: {
    firstName: string;
    lastName: string;
  };
  addresses: Array<{
    street: string;
    city: string;
  }>;
}>;
```

### Type Utility: FormCompatibleDeepRequired

`FormCompatibleDeepRequired<T>` is a specialized utility type that solves the Date/string type mismatch issue when initializing forms with Date properties. This type makes all properties required (like `DeepRequired<T>`) but specifically allows `string` values for `Date` properties to accommodate form initialization patterns.

**Problem it solves:**

- Model interfaces use `Date` types for semantic correctness
- UI libraries (like PrimeNG p-calendar) require empty string `''` for placeholder display
- This creates a `Date !== string` type mismatch during form initialization

**When to use:**

- ✅ Your model contains `Date` properties that need form initialization
- ✅ You want all form fields to be required (no optional properties)
- ✅ Working with UI libraries that require empty strings for date inputs
- ✅ You need type safety while maintaining Date/string flexibility

**When NOT to use:**

- ❌ No Date properties in your model → Use regular `DeepRequired<T>`
- ❌ Want to preserve optional properties → Use custom approach
- ❌ API contracts require strict Date types → Use transform functions

**Example:**

```typescript
import type { FormCompatibleDeepRequired } from 'ngx-vest-forms';

interface UserModel {
  id?: number;
  name?: string;
  birthDate?: Date;
  profile?: {
    createdAt?: Date;
    isActive?: boolean;
  };
}

// Transform to form-compatible type
type UserFormType = FormCompatibleDeepRequired<UserModel>;
// Result: {
//   id: number;
//   name: string;
//   birthDate: Date | string;    // ← Only Date gets union treatment
//   profile: {
//     createdAt: Date | string;  // ← Works recursively
//     isActive: boolean;         // ← Other types unchanged
//   };
// }

// Now you can safely initialize with empty strings for dates:
const formData: UserFormType = {
  id: 0,
  name: '',
  birthDate: '', // ✅ Valid: string allowed for Date properties
  profile: {
    createdAt: '', // ✅ Valid: works recursively
    isActive: false,
  },
};

// Also allows actual Date objects:
const formDataWithDates: UserFormType = {
  id: 1,
  name: 'John',
  birthDate: new Date(), // ✅ Still valid
  profile: {
    createdAt: new Date(), // ✅ Still valid
    isActive: true,
  },
};
```

**Comparison with alternatives:**

| Type Utility                    | Makes Required | Date/String Union | Use Case                             |
| ------------------------------- | -------------- | ----------------- | ------------------------------------ |
| `DeepPartial<T>`                | ❌             | ❌                | Form models with optional fields     |
| `DeepRequired<T>`               | ✅             | ❌                | Required fields, no Date properties  |
| `FormCompatibleDeepRequired<T>` | ✅             | ✅                | Required fields WITH Date properties |

```typescript
generalInfo: {
firstName: string;
lastName: string;
};
}>;


const mySuite = staticSuite((model = {}) => {
  test('generalInfo.firstName', 'First name is required', () => {
    enforce(model.generalInfo?.firstName).isNotEmpty();
  });
  test('generalInfo.lastName', 'Last name is required', () => {
    enforce(model.generalInfo?.lastName).isNotEmpty();
  });
});

@Component({
  selector: 'app-my-component',
  imports: [vestForms],
  template: `
    <form
      scVestForm
      #vestForm="scVestForm"
      [vestSuite]="mySuite"
      [formValue]="formValue()"
    >
      <div ngModelGroup="generalInfo">
        <label>First Name:</label>
        <input name="firstName" ngModel required />
        @let firstNameErrors = vestForm.formState().errors?.generalInfo?.firstName;
        @if (firstNameErrors) {
          <div class="error">
            <ul>
              @for (error of firstNameErrors; track error) {
                <li>{{ error }}</li>
              }
            </ul>
          </div>
        }

        <label>Last Name:</label>
        <input name="lastName" ngModel />
        @let lastNameErrors = vestForm.formState().errors?.generalInfo?.lastName;
        @if (lastNameErrors) {
          <div class="error">
            <ul>
              @for (error of lastNameErrors; track error) {
                <li>{{ error }}</li>
              }
            </ul>
          </div>
        }
      </div>
      <button type="submit" [disabled]="isSubmitDisabled()">Submit</button>
      <pre>Form Valid: {{ vestForm.formState().valid }}</pre>
      <pre>Form Value: {{ vestForm.formState().value | json }}</pre>
    </form>
  `,
})
export class MyComponent {
  protected readonly vestForm = viewChild.required(FormDirective<MyFormModel>);
  protected readonly mySuite = mySuite;
  protected readonly formValue = signal<MyFormModel>({ generalInfo: { firstName: '', lastName: '' } });
  protected readonly isSubmitDisabled = computed(() =>
    !this.vestForm().formState().valid || this.vestForm().formState().pending
  );

  submit() {
    if (this.vestForm().formState().valid) {
      console.log('Form Submitted:', this.vestForm().formState().value);
      // Handle form submission
    } else {
      console.log('Form is invalid');
    }
  }
}

```

**Note:** Template-driven forms are deep partial, so always use the `?` operator in your templates when accessing nested properties.

The `scVestForm` directive manages the form's state and validation based on the `[vestSuite]` and the `ngModel` bindings within the form.

#### Why use `formState`?

- **Unified API:** All form state (value, errors, validity, pending, etc.) is available in one place.
- **Type Safety:** The `formState` object is fully typed based on your form model and schema.
- **Future-proof:** The old signals (`errors`, `isValid`, etc.) are deprecated and will be removed in a future release. Use `formState` for all new code. The `(formValueChange)` output is not deprecated and is the only correct way for the form to notify the parent of value changes. See below for usage.
- **Read-only Value:** `formState().value` is a read-only snapshot of the current form value, always reflecting the value provided by the parent via `[formValue]`. Mutations must be performed in the parent and passed down; the form directive never mutates or owns the value.

#### Deprecated signals (will be removed):

- `errors`
- `isValid`, `isInvalid`, `isPending`, `isDisabled`, `isIdle`

**Migrate to `formState` as soon as possible.**

#### Important: `(formValueChange)` is **not** deprecated

The `(formValueChange)` output is the only supported and correct way for the form to notify the parent of value changes. The parent must update its signal/state in response to this event. The form directive never mutates or owns the value; it is always controlled by the parent. See the next section for usage and best practices.

---

## When to Use `(formValueChange)`

While `ngx-vest-forms` manages form state and errors internally via the `formState` signal, there are important scenarios where you should use the `(formValueChange)` output:

### 1. Synchronizing Form State with External Signals or Stores

If you want to keep an external signal, state management store, or parent component in sync with the form's value, use `(formValueChange)` to update that external state whenever the form changes.

**Example:**

```html
<form
  scVestForm
  [formValue]="externalSignal()"
  (formValueChange)="externalSignal.set($event)"
  [formSchema]="modelTemplate"
  [vestSuite]="suite"
>
  <!-- form fields -->
</form>
```

- **Why:** This ensures two-way binding between your form and an external signal or store.
- **When:** Use this pattern if your form is part of a larger stateful workflow, or you want to reset/patch the form from outside.

### 2. Triggering Side Effects on Form Changes

If you need to perform side effects (e.g., autosave, analytics, conditional logic) whenever the form value changes, use `(formValueChange)` to run your handler.

**Example:**

```html
<form
  scVestForm
  (formValueChange)="onFormValueChanged($event)"
  [formSchema]="modelTemplate"
  [vestSuite]="suite"
>
  <!-- form fields -->
</form>
```

```typescript
onFormValueChanged(value: MyFormType) {
  // e.g., trigger autosave, update parent, log analytics, etc.
}
```

- **Why:** This allows you to react to form changes in real time.
- **When:** Use for autosave, conditional UI, or integration with other services.

### 3. Resetting or Re-initializing the Form

If you want to programmatically reset or re-initialize the form from outside, you can use `(formValueChange)` to keep track of the latest value, and then set `[formValue]` as needed.

### When You Do **Not** Need `(formValueChange)`

- **Error Display & Validation:** The form directive manages errors and validation state internally. You do not need `(formValueChange)` just to display errors or update validation.
- **Simple Forms:** If your form is self-contained and does not need to sync with external state or trigger side effects, you can omit `(formValueChange)`.

#### Summary Table

| Use Case                              | Use `(formValueChange)`? | Example Purpose     |
| ------------------------------------- | :----------------------: | ------------------- |
| Sync with external signal/store       |            ✅            | Two-way binding     |
| Autosave/side effects on value change |            ✅            | Autosave, analytics |
| Error display/validation only         |            ❌            | Not needed          |
| Simple, self-contained form           |            ❌            | Not needed          |

**Documentation Note:**
Use `(formValueChange)` only when you need to synchronize form value externally or trigger side effects. For error display and validation, rely on the `formState` signal.

### Optional Inputs

| Input               | Type                               | Description                                                                                                                                                       | Default               |
| ------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `formValue`         | `T \| null`                        | Optional initial value for the form. Useful for pre-populating the form when editing existing data. The type `T` is inferred from `formSchema` if provided.       | `null`                |
| `formSchema`        | `SchemaDefinition \| null`         | Optional schema definition (e.g., a Zod schema) to enable compile-time type inference for `formValue` and the `vestSuite`. Strongly recommended for robust forms. | `null`                |
| `vestSuite`         | `VestSuite<T> \| null`             | **Required.** The Vest validation suite function used to validate the form's model. This is the core of the validation logic.                                     | `null`                |
| `validationConfig`  | `Record<string, string[]> \| null` | Optional configuration to define dependencies between form fields. When a field listed as a key changes, the fields listed in its value array are re-validated.   | `null`                |
| `validationOptions` | `ValidationOptions`                | Optional configuration for validation behavior, such as debounce time.                                                                                            | `{ debounceTime: 0 }` |

### Avoiding typos with `formSchema` (Optional but Recommended)

Template-driven forms are generally type-safe thanks to TypeScript, but the string values used in `name` attributes or `ngModelGroup` directives are not checked at compile time. A typo here can lead to unexpected behavior or runtime errors that are hard to track down.

To mitigate this, `ngx-vest-forms` allows you to provide an optional `[formSchema]`. This schema (e.g., a Zod schema) defines the expected structure and types of your form data.

```typescript
import { z } from 'zod'; // Example using Zod
import { vestForms, DeepPartial } from 'ngx-vest-forms';

// Define your form model type
type MyFormModel = DeepPartial<{
  generalInfo: {
    firstName?: string;
    lastName?: string;
  };
}>;

// Define a Zod schema matching the form structure
export const myFormSchema = z.object({
  generalInfo: z.object({
    firstName: z.string().min(1), // Add Zod validation rules if desired
    lastName: z.string().optional(),
  }),
});

// Infer the type from the schema if needed elsewhere
// type InferredMyFormModel = z.infer<typeof myFormSchema>;

@Component({
  selector: 'app-my-component',

  imports: [vestForms],
  template: `
    <form
      scVestForm
      [vestSuite]="suite"
      [formSchema]="schema"
      #vestForm="scVestForm"
    >
      <!-- ... form controls ... -->
    </form>
  `,
})
export class MyComponent {
  protected readonly suite = mySuite; // Your Vest suite
  protected readonly schema = myFormSchema; // Provide the schema
  // ... other component logic ...
}
```

By providing the `[formSchema]`, you gain:

1.  **Type Inference:** The type `T` for `formValue`, `vestSuite`, and `formValueChange` can be automatically inferred from the schema, improving type safety in your component class.
2.  **Future Enhancements:** While not currently implemented for runtime checks against typos in `name` attributes based _solely_ on the schema, providing it lays the groundwork for potential future development tooling or stricter runtime checks if desired. The primary benefit _today_ is improved compile-time type safety within your component class and suite definitions.

**Note:** The `[formShape]` input mentioned in previous versions has been deprecated and should be replaced with `[formSchema]`. Use `[formSchema]` for defining the schema of your form.

Making a typo in the name attribute or an `ngModelGroup` attribute might still lead to runtime issues where parts of the form data don't match your expected model, but the schema helps ensure the _overall structure_ and _types_ are consistent within your TypeScript code.

For example, if you typed `fistName` instead of `firstName` in your template:

```html
<input name="fistName" [ngModel]="formValue()?.generalInfo?.fistName" />
```

While the schema enforces `firstName` in your TypeScript, this typo would mean the value entered in this input wouldn't be correctly placed in your `formValue` signal under the `firstName` property. Providing the schema primarily aids compile-time safety within your component class and suite definitions.

### Conditional fields

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
    [ngModel]="formValue()?.generalInfo?.firstName"
  />

  @if(lastNameAvailable()){
  <label>Last name</label>
  <input
    type="text"
    name="lastName"
    [ngModel]="formValue()?.generalInfo?.lastName"
  />
  }
</div>
```

```typescript
// Add these computed signals to your MyComponent class
export class MyComponent {
  // ... existing properties like vestForm, suite ...

  // Access form value directly from the directive's signal
  private formValue = computed(() => this.vestForm().formValueChange());

  protected readonly lastNameAvailable = computed(
    () => !!this.formValue()?.generalInfo?.firstName,
  );
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
    [ngModel]="formValue()?.generalInfo?.firstName"
  />

  <label>Last name</label>
  <input
    type="text"
    name="lastName"
    [ngModel]="formValue()?.generalInfo?.lastName"
  />
</div>
}
```

```typescript
// Add this computed signal to your MyComponent class
export class MyComponent {
  // ... existing properties ...
  private formValue = computed(() => this.vestForm().formValueChange());

  // Example logic for showing/hiding the group based on firstName length
  protected readonly showGeneralInfo = computed(
    () => (this.formValue()?.generalInfo?.firstName?.length ?? 0) > 0,
  );
}
```

### Reactive disabling

To achieve reactive disabling, we just have to take advantage of computed signals as well:

```typescript
// Add this computed signal to your MyComponent class
export class MyComponent {
  // ... existing properties ...
  private formValue = computed(() => this.vestForm().formValueChange());

  protected readonly lastNameDisabled = computed(
    () => !this.formValue()?.generalInfo?.firstName, // Disable lastName if firstName is empty
  );
}
```

We can bind the computed signal to the `disabled` attribute of the input element.

```html
<input
  type="text"
  name="lastName"
  [disabled]="lastNameDisabled()"
  [ngModel]="vestForm.formValue()?.generalInfo?.lastName"
/>
```

### Validations

The absolute gem in ngx-vest-forms is the flexibility in validations without writing any boilerplate.
The only dependency this lib has is [vest.js](https://vestjs.dev). An awesome lightweight validation framework.
You can use it on the backend/frontend/Angular/react etc...

We use vest because it introduces the concept of vest suites. These are suites that kind of look like unit-tests
but that are highly flexible:

- **Declarative Syntax:** Write validations in a clear, test-like format.
- **Reusable:** Define validation logic once and reuse it across components or even projects.
- **Composable:** Break down complex validation logic into smaller, manageable, and reusable functions.
- **Conditional:** Easily define validations that only run when specific conditions are met.
- **Asynchronous:** Built-in support for asynchronous validation rules (e.g., checking username availability).
- **Framework Agnostic:** Write suites once and use them anywhere JavaScript runs.
- **Performance:** Optimized for performance, validating only the necessary fields when possible.
- **Testability:** Suites are just functions, making them easy to unit test.

This is how you write a simple Vest suite:

```typescript
import { enforce, only, staticSuite, test } from 'vest';
import { MyFormModel } from '../models/my-form.model';

export const myFormValidationSuite = staticSuite(
  (model: MyFormModel = {}, field?: string) => {
    if (field) {
      // Needed to not run every validation every time a field changes
      only(field);
    }

    test('generalInfo.firstName', 'First name is required', () => {
      enforce(model.generalInfo?.firstName).isNotEmpty();
    });

    test('generalInfo.lastName', 'Last name is required', () => {
      enforce(model.generalInfo?.lastName).isNotEmpty();
    });
  },
);
```

In the `test` function the first parameter is the field name (matching the `name` or `ngModelGroup` attribute), the second is the validation error message.
The field name uses dot notation for nested properties. So if we would have an `addresses` form group with a `billingAddress` form group inside
and a form control `street` the field would be: `addresses.billingAddress.street`.

This syntax should be self-explanatory and the entire enforcements guidelines can be found on [vest.js](https://vestjs.dev).

## Vest Suite Types: `suite` vs `staticSuite`

### When to use `suite` vs `staticSuite`

- **`suite` (or `create`)**: Use this to create a **dynamic validation suite**. Each call to the suite function creates a new, independent validation state. Use this when you need to validate different data sets independently, or when you want to run validations in parallel (e.g., multiple forms, or server-side validation).

  **Example:**

  ```typescript
  import { create } from 'vest';
  const mySuite = create((data = {}) => {
    // validations
  });
  // Each call: mySuite(data) returns a new result
  ```

- **`staticSuite`**: Use this to create a **static, stateful validation suite** optimized for field-level validation in UI forms. Vest maintains a single suite state, merging results between runs. This is ideal for form libraries and UI frameworks (like Angular, React, etc.) where you want to validate only the changed field and keep validation state between runs. Recommended for most frontend form validation scenarios, especially with `ngx-vest-forms`.

  **Example:**

  ```typescript
  import { staticSuite, test, enforce } from 'vest';
  const mySuite = staticSuite((data = {}, field) => {
    test('email', 'Email required', () => {
      enforce(data.email).isNotEmpty();
    });
  });
  ```

#### Summary Table

| Use Case                                   | Use          |
| ------------------------------------------ | ------------ |
| UI forms, field-level validation, stateful | staticSuite  |
| Stateless, parallel, or server-side runs   | suite/create |

**In your Angular + ngx-vest-forms project:**

> Always use `staticSuite` for form validation suites, unless you have a very specific need for stateless or parallel validation.

Now let's connect this to our form. The primary way to do this is by binding your suite function to the `[vestSuite]` input on the `scVestForm` directive:

```html
<form
  scVestForm
  [vestSuite]="suite"
  #vestForm="scVestForm"
  (ngSubmit)="onSubmit()"
>
  <!-- ... form controls ... -->
</form>
```

```typescript
import { myFormValidationSuite } from './my-form.validations'; // Import your suite

@Component({
  /* ... */
})
export class MyComponent {
  protected readonly suite = myFormValidationSuite; // Assign the suite function

  // Inject the directive if you need to access its state/signals
  private readonly vestForm =
    viewChild.required<FormDirective<MyFormModel>>('vestForm');

  onSubmit() {
    // ... submission logic ...
  }
}
```

That's it. Validations are completely wired now. `ngx-vest-forms` handles the connection internally using several directives:

- `scVestForm`: The main directive on the `<form>` tag.
- `FormModelDirective`: Attaches to elements with `[ngModel]` and `[name]`.
- `FormModelGroupDirective`: Attaches to elements with `[ngModelGroup]`.

These directives automatically implement Angular's `AsyncValidator` interface and connect to the provided `[vestSuite]`.

It goes like this:

- Control gets created, Angular recognizes the `ngModel` and `ngModelGroup` directives.
- `ngx-vest-forms` directives (`FormModelDirective`, `FormModelGroupDirective`) attach and register themselves with the main `scVestForm` directive.
- These directives implement `AsyncValidator` and connect to the `[vestSuite]` provided to `scVestForm`.
- User types into a control.
- Angular triggers the `validate` method on the corresponding `ngx-vest-forms` directive.
- The directive calls the Vest suite, passing the current form model and the specific field being validated (`only(field)`).
- Vest runs the relevant tests and returns any errors.
- The `ngx-vest-forms` directive translates Vest errors into Angular's `ValidationErrors` format and updates the control's validity state.

This means that standard Angular form properties and signals like `valid`, `invalid`, `errors`, `pending`, `statusChanges` etc., continue to work as expected.

#### Showing validation errors

Now we want to show the validation errors in a consistent way.
For that we have provided the `sc-control-wrapper` element component and the `[scControlWrapper]` attribute directive.

You can use them on:

- elements that hold `ngModelGroup` (use the attribute `[scControlWrapper]`)
- elements that have an `ngModel` (or form control) inside of them (use the attribute `[scControlWrapper]`)
- As a standalone element wrapping your control (`<sc-control-wrapper>...</sc-control-wrapper>`)

This will show errors automatically when:

- The control is touched
- The form is submitted

**Note:** The default behavior is `touchOrSubmit`. You can customize this using the `errorDisplayMode` input or the `CONTROL_WRAPPER_ERROR_DISPLAY` injection token. See the [Error Display Configuration](#error-display-configuration-for-control-wrapper) section for details.

#### Building Custom Form Fields with FormControlStateDirective

For advanced use cases where you need complete control over form field UI/UX, you can use the `scFormControlState` directive to build your own custom form field components. The `sc-control-wrapper` component uses this directive internally, but you can use it directly for custom implementations.

The `FormControlStateDirective` provides a reactive signal (`controlState`) with the current state of the nearest `NgModel` or `NgModelGroup`, allowing you to build custom UI components with full access to control state.

**Basic Usage:**

```html
<div scFormControlState #state="formControlState">
  <label>
    <span>Email</span>
    <input type="email" name="email" ngModel />
  </label>

  @if (state.controlState().isInvalid && state.controlState().isTouched) {
  <span class="error-message">
    @for (error of state.controlState().errors?.['errors']; track error) {
    <div>{{ error }}</div>
    }
  </span>
  }
</div>
```

**Creating a Custom Form Field Component:**

```typescript
import { Component, inject, computed } from '@angular/core';
import { FormControlStateDirective } from 'ngx-vest-forms';

@Component({
  selector: 'app-custom-field',
  template: `
    <div class="field-container" [class.is-invalid]="invalid()">
      <ng-content></ng-content>

      @if (showErrors()) {
        <div class="error-container">
          @for (error of errors(); track error) {
            <div class="error-message">{{ error }}</div>
          }
        </div>
      }
    </div>
  `,
  hostDirectives: [FormControlStateDirective],
})
export class CustomFieldComponent {
  private readonly controlState = inject(FormControlStateDirective)
    .controlState;

  protected readonly invalid = computed(() => !!this.controlState().isInvalid);

  protected readonly errors = computed(() =>
    Array.isArray(this.controlState().errors?.['errors'])
      ? this.controlState().errors['errors']
      : [],
  );

  protected readonly showErrors = computed(
    () => this.invalid() && this.controlState().isTouched,
  );
}
```

See the [complete documentation](docs/form-control-state-directive.md) for more details on using the `FormControlStateDirective` for advanced use cases.

Let's update our form (using the attribute selector):

```html
<div ngModelGroup="generalInfo" scControlWrapper>
  <div scControlWrapper>
    <label>First name</label>
    <input
      type="text"
      name="firstName"
      [ngModel]="formValue().generalInfo?.firstName"
    />
  </div>

  <div scControlWrapper>
    <label>Last name</label>
    <input
      type="text"
      name="lastName"
      [ngModel]="formValue().generalInfo?.lastName"
    />
  </div>
</div>
```

Or using the element selector:

```html
<div ngModelGroup="generalInfo" scControlWrapper>
  <sc-control-wrapper>
    <label>First name</label>
    <input
      type="text"
      name="firstName"
      [ngModel]="formValue().generalInfo?.firstName"
    />
  </sc-control-wrapper>

  <sc-control-wrapper>
    <label>Last name</label>
    <input
      type="text"
      name="lastName"
      [ngModel]="formValue().generalInfo?.lastName"
    />
  </sc-control-wrapper>
</div>
```

This is the only thing we need to do to create a form that is completely wired with vest.

- [x] Automatic creation of form controls and form groups
- [x] Automatic connection to vest suites
- [x] Type safety via optional schemas
- [x] Automatic adding of css error classes and showing validation messages
  - [x] On touch
  - [x] On submit

> **Note:** While `sc-control-wrapper` simplifies displaying errors for individual controls (removing the need to access `vestForm.errors()` directly in the template for that specific control), you will still typically need the `#vestForm="scVestForm"` template reference variable and the corresponding `viewChild` in your component. This reference is necessary for interacting with the **overall form's state**, such as:
>
> - Disabling the submit button based on overall validity (`[disabled]="vestForm.isInvalid()"`)
> - Accessing the complete form value (`this.vestForm().formValueChange()`) or validity (`this.vestForm().isInvalid()`) in your component logic (e.g., within `onSubmit`).
> - Calling methods on the form directive instance (e.g., `this.vestForm().markAllAsTouched()`).

### Conditional validations

Vest makes it extremely easy to create conditional validations using `omitWhen` or `skipWhen`.
Assume we have a form model that has `age` and `emergencyContact`.
The `emergencyContact` is required, but only when the person is not of legal age.

We can use `omitWhen` so that the `emergencyContact` test is skipped entirely when the person is 18 or older.

```typescript
import { enforce, omitWhen, suite, test } from 'vest';

// ... inside your suite function ...

test('age', 'Age is required', () => {
  enforce(model.age).isNumeric();
});

omitWhen((model.age ?? 0) >= 18, () => {
  test('emergencyContact', 'Emergency contact is required for minors', () => {
    enforce(model.emergencyContact).isNotEmpty();
  });
});
```

You can apply conditional logic to any test. Here's the password/confirm password example:

- Password is always required.
- Confirm password is only required when a password has been entered.
- The passwords must match, but only if both fields have been filled in.

```typescript
// ... inside your suite function ...

test('passwords.password', 'Password is required', () => {
  enforce(model.passwords?.password).isNotEmpty();
});

// Only require confirmPassword if password has a value
omitWhen(!model.passwords?.password, () => {
  test('passwords.confirmPassword', 'Please confirm your password', () => {
    enforce(model.passwords?.confirmPassword).isNotEmpty();
  });
});

// Only check for matching passwords if both fields are filled
omitWhen(
  !model.passwords?.password || !model.passwords?.confirmPassword,
  () => {
    test('passwords.confirmPassword', 'Passwords do not match', () => {
      enforce(model.passwords?.confirmPassword).equals(
        model.passwords?.password,
      );
    });
  },
);
```

This approach keeps validation logic clean, readable, testable, and reusable, avoiding the manual complexity of adding/removing validators in Reactive Forms.

### Composable validations

We can compose validation suites with sub-suites or reusable validation functions. After all, we want to reuse certain pieces of our
validation logic (like address validation) and avoid one huge, unreadable suite.
This is quite straightforward with Vest.

Let's define a reusable function that validates an address object:

```typescript
import { enforce, test } from 'vest';
import { AddressModel } from './address.model'; // Example model

// Reusable validation function for an address
export function addressValidations(
  model: AddressModel | undefined,
  fieldPrefix: string, // e.g., 'billingAddress' or 'shippingAddress.details'
): void {
  test(`${fieldPrefix}.street`, 'Street is required', () => {
    enforce(model?.street).isNotEmpty();
  });
  test(`${fieldPrefix}.city`, 'City is required', () => {
    enforce(model?.city).isNotEmpty();
  });
  test(`${fieldPrefix}.zipCode`, 'Zip code is required', () => {
    enforce(model?.zipCode).isNotEmpty();
  });
  // Add more address-specific tests...
}
```

Our main suite can then consume this function for different address fields:

```typescript
import { suite, only } from 'vest';
import { PurchaseFormModel } from '../models/purchaseFormModel'; // Example model
import { addressValidations } from './address.validations'; // Import the reusable function

export const purchaseFormSuite = suite(
  (model: PurchaseFormModel = {}, field?: string) => {
    if (field) {
      only(field);
    }

    // Validate billing address
    addressValidations(model.billingAddress, 'billingAddress');

    // Conditionally validate shipping address if needed
    if (model.useShippingAddress) {
      addressValidations(model.shippingAddress, 'shippingAddress');
    }

    // ... other purchase form validations ...
  },
);
```

This achieves decoupling, readability, and reuse of our `addressValidations` logic.

### Asynchronous Validations

Vest seamlessly handles asynchronous validations, such as checking if a username is already taken.
You define async tests using Promises.

```typescript
import { enforce, test, warn, suite } from 'vest';
import { checkUsernameAvailability } from './api.service'; // Example API service call returning a Promise<void> or Promise<boolean>

export const userProfileSuite = suite((model = {}, field?: string) => {
  // ... other synchronous tests ...

  test('username', 'Username is required', () => {
    enforce(model.username).isNotEmpty();
  });

  // Example async test using a Promise
  test('username', 'Checking username availability...', async () => {
    if (!model.username) return; // Don't check if empty
    const isAvailable = await checkUsernameAvailability(model.username); // Assume this returns true if available, false/throws if not
    if (!isAvailable) {
      throw new Error('Username is already taken.'); // Vest catches thrown errors
    }
    // If the promise resolves without error, the test passes
  });

  // You can also use `warn()` for non-blocking warnings
  warn(); // Put warnings after all blocking tests
  test('username', 'Username might be too common', () => {
    // Example: Check against a list of common usernames
    // if (isCommonUsername(model.username)) {
    //   throw new Error('Consider a more unique username.'); // This would be a warning
    // }
  });
});
```

`ngx-vest-forms` automatically handles the pending state (`isPending` signal) while async validations are running.

See the [Vest documentation on async tests](https://vestjs.dev/docs/guides/async_validations) for more details.

### Root Form Validation

Sometimes, you need to validate the form as a whole, comparing multiple fields (e.g., ensuring start date is before end date). Vest allows tests without a specific field name, which target the root level.

**By default, `ngx-vest-forms` now enables root-level validation.** The `ValidateRootFormDirective` is automatically applied and adds an async validator to the root `NgForm`.

If you need to **disable** root-level validation (e.g., for performance reasons on complex forms where it's not needed, or for legacy forms), you can set the `[validateRootForm]` input to `false`:

```html
<form
  scVestForm
  [vestSuite]="suite"
  [validateRootForm]="false" <!-- Disable root validation -->
  #vestForm="scVestForm"
>
  <!-- ... -->
</form>
```

To define root-level tests in your suite, use tests without a specific field name. You can use the `ROOT_FORM` constant exported by `vest` for clarity, although any test without a field name is treated as a root-level test:

```typescript
import { test, enforce, suite, ROOT_FORM } from 'vest';

export const dateRangeSuite = suite((model = {}, field?: string) => {
  // ... field-specific tests for startDate and endDate ...

  test(ROOT_FORM, 'Start date must be before end date', () => {
    // Ensure dates exist before comparing
    if (model.startDate && model.endDate) {
      enforce(model.startDate).isBefore(model.endDate);
    }
  });
});
```

The key used for these root-level errors in the `errors` signal is determined by the `ROOT_FORM` injection token provided within `ngx-vest-forms`. This token defaults to the string `'rootForm'`. You can access this key programmatically using the `injectRootFormKey` utility function.

```typescript
import { injectRootFormKey } from 'ngx-vest-forms';

// Inside your component or service:
const rootKey = injectRootFormKey(); // Gets the current key (default: 'rootForm')
```

Root-level errors will be available via `vestForm.errors()?.[rootKey]` (always an array). You might display these errors in a dedicated summary section:

```html
<!-- Example displaying root errors -->
<div *ngIf="vestForm.errors()?.[rootKey] as rootErrors">
  <h4>Form Errors:</h4>
  <ul>
    <li *ngFor="let error of rootErrors">{{ error }}</li>
  </ul>
</div>
```

See the documentation for `ROOT_FORM` token and `injectRootFormKey` in `form-token.ts` for more details on customization.

### Dependent Field Validation (`[validationConfig]`)

Often, changing one field requires re-validating another (e.g., changing password requires re-validating confirm password). `ngx-vest-forms` handles this via the `[validationConfig]` input.

Provide an object where keys are field names, and values are arrays of _other_ field names that should be re-validated when the key field changes.

```typescript
@Component({
  /* ... */
})
export class MyComponent {
  protected readonly suite = passwordSuite; // Suite with password/confirm logic

  // When 'passwords.password' changes, also re-validate 'passwords.confirmPassword'
  // When 'passwords.confirmPassword' changes, also re-validate 'passwords.password' (for the match check)
  protected readonly validationConfig = {
    'passwords.password': ['passwords.confirmPassword'],
    'passwords.confirmPassword': ['passwords.password'],
  };
}
```

```html
<form
  scVestForm
  [vestSuite]="suite"
  [validationConfig]="validationConfig"
  #vestForm="scVestForm"
>
  <div ngModelGroup="passwords">
    <label>Password:</label>
    <input type="password" name="password" [ngModel]="..." />

    <label>Confirm Password:</label>
    <input type="password" name="confirmPassword" [ngModel]="..." />
  </div>
</form>
```

Now, when the user types in the `password` field, both `passwords.password` and `passwords.confirmPassword` tests in the Vest suite will be triggered, ensuring the validation state stays consistent.

## Field Path Utilities

`ngx-vest-forms` provides utility functions for working with deep/nested field paths in form models. These are especially useful for advanced scenarios, such as dynamic forms, custom error display, or when you need to programmatically access or update deeply nested values.

**When to use:**

- Accessing or updating values at a dynamic or deeply nested path in your form model.
- Building custom form controls or wrappers that need to work with arbitrary field paths.
- Implementing custom error display or logic that requires field path manipulation.

**How to use:**

Import the utilities from `ngx-vest-forms/utils/field-path.utils`:

```typescript
import {
  getValueAtPath,
  setValueAtPath,
  parseFieldPath,
  stringifyFieldPath,
} from 'ngx-vest-forms';
```

### Practical Example: Using Field Path Utilities in a Real Form with Signals and Modern Angular Control Flow

You can use these utilities to read or update deeply nested values in your form, or to access errors at a dynamic path. This is especially useful for dynamic forms, custom wrappers, or programmatic updates. The example below demonstrates:

- Using signals and `computed` for reactive access to nested values and errors
- The new Angular control flow syntax (`@if`, `@for`)
- Programmatic updates to nested values using `setValueAtPath`

```typescript
import { Component, computed, Signal, viewChild } from '@angular/core';
import { vestForms, FormDirective, VestSuite } from 'ngx-vest-forms';
import { getValueAtPath, setValueAtPath } from 'ngx-vest-forms';

type Address = { street: string; city: string };
type ExampleFormModel = {
  generalInfo: { firstName: string; lastName: string };
  addresses: Address[];
};

const exampleSuite: VestSuite<ExampleFormModel> = (
  data = {},
  field?: string,
) => {
  // ... your Vest validation logic ...
};

@Component({
  selector: 'sc-field-path-form-example',
  standalone: true,
  imports: [vestForms],
  template: `
    <form
      scVestForm
      [vestSuite]="suite"
      [formValue]="initialValue"
      #vestForm="scVestForm"
    >
      <div ngModelGroup="generalInfo">
        <label>First Name: <input name="firstName" ngModel /></label>
        <label>Last Name: <input name="lastName" ngModel /></label>
      </div>
      <div ngModelGroup="addresses">
        @for (i of [0, 1]; track i) {
          <div ngModelGroup="{{ i }}">
            <label>Street: <input name="street" ngModel /></label>
            <label>City: <input name="city" ngModel /></label>
          </div>
        }
      </div>
      <button type="button" (click)="setSecondStreet()">
        Set 2nd Street to 'Updated St'
      </button>
      <pre>Form Value: {{ vestForm.formState().value | json }}</pre>
      <pre>Errors: {{ vestForm.formState().errors | json }}</pre>
      <div>
        <strong>Second Street (signal):</strong> {{ secondStreetSignal() }}
      </div>
      <div>
        <strong>Address[0] City Errors (signal):</strong>
        @if (address0CityErrorsSignal()) {
          <span>
            @for (err of address0CityErrorsSignal(); track err) {
              <span>{{ err }}</span>
            }
          </span>
        }
      </div>
    </form>
  `,
})
export class FieldPathExampleComponent {
  protected readonly suite = exampleSuite;
  protected readonly initialValue: ExampleFormModel = {
    generalInfo: { firstName: 'Alice', lastName: 'Smith' },
    addresses: [
      { street: 'Main St', city: 'Springfield' },
      { street: 'Second St', city: 'Shelbyville' },
    ],
  };
  protected readonly vestForm = viewChild.required(
    FormDirective<ExampleFormModel>,
  );

  // Signal for the nested value
  readonly secondStreetSignal: Signal<string | undefined> = computed(() =>
    getValueAtPath(this.vestForm().formState().value, 'addresses[1].street'),
  );

  // Signal for the nested errors
  readonly address0CityErrorsSignal: Signal<string[] | undefined> = computed(
    () =>
      getValueAtPath(this.vestForm().formState().errors, 'addresses[0].city'),
  );

  setSecondStreet(): void {
    const value = { ...this.vestForm().formState().value };
    setValueAtPath(value, 'addresses[1].street', 'Updated St');
    this.vestForm().setFormValue(value);
  }
}
```

This pattern allows you to:

- Read or update any nested value in your form model using a string path (e.g., `'addresses[1].street'`).
- Access errors for a specific field path, which is useful for custom error display or dynamic forms.
- Programmatically update form values at any depth, which is useful for custom controls, wizards, or patching data.

See [`projects/examples/src/app/simple-form/field-path-example.ts`](projects/examples/src/app/simple-form/field-path-example.ts) for a full, working example.

**Why:**

- These utilities ensure robust, type-safe access to deeply nested fields, especially in dynamic or array-based forms.
- They help avoid manual string manipulation and reduce bugs when working with complex form models.

See [`projects/examples/src/app/simple-form/field-path-example.ts`](projects/examples/src/app/simple-form/field-path-example.ts) for a full example.

## Form Arrays

`ngx-vest-forms` supports `FormArray` scenarios, often used for dynamic lists of inputs. While the core concepts remain the same (using `ngModel`, `ngModelGroup`, and a Vest suite), structuring the suite and template requires careful handling of indices.

For a detailed guide and examples on using `ngx-vest-forms` with Form Arrays, please refer to this dedicated blog post:

- [Handling Form Arrays with ngx-vest-forms](https://blog.simplified.courses/handling-form-arrays-with-ngx-vest-forms/) (Replace with actual link if available, otherwise remove link)

### Error Display Configuration for Control Wrapper

The `sc-control-wrapper` component and `[scControlWrapper]` directive now support configurable error display behavior. You can control when errors are shown (on touch, on submit, or both) globally or per instance.

#### Per-Instance Configuration

Use the `errorDisplayMode` input to override the error display mode for a specific control wrapper:

```html
<sc-control-wrapper errorDisplayMode="on-submit">
  <input name="email" [ngModel]="formValue().email" />
</sc-control-wrapper>

<!-- Or with the attribute selector -->
<div scControlWrapper errorDisplayMode="on-submit">
  <input name="email" [ngModel]="formValue().email" />
</div>
```

Possible values:

- `'on-blur'`: Show errors only when the control is touched.
- `'on-submit'`: Show errors only after the form is submitted.
- `'on-blur-or-submit'`: Show errors when touched OR after submit (_default_).

#### Global Configuration

You can set the default error display mode for all control wrappers in your app by providing the `CONTROL_WRAPPER_ERROR_DISPLAY` injection token:

```typescript
import { provide } from '@angular/core';
import { CONTROL_WRAPPER_ERROR_DISPLAY } from 'ngx-vest-forms';

@NgModule({
  providers: [
    provide(CONTROL_WRAPPER_ERROR_DISPLAY, { useValue: 'on-submit' }),
  ],
})
export class AppModule {}
```

The per-instance input always takes precedence over the global config.

## Advanced Usage

### Using `computed()` with Form State

You can easily create derived state based on the form's signals using Angular's `computed()` function. Inject the `FormDirective` instance using `viewChild` and access its signals:

```typescript
import { Component, inject, viewChild, computed, Signal } from '@angular/core';
import { FormDirective, vestForms, VestSuite } from 'ngx-vest-forms';
// ... other imports

type MyForm = {
  /* ... */
};
declare const mySuite: VestSuite<MyForm>;

@Component({
  // ... component metadata
  standalone: true,
  imports: [vestForms],
  template: `
    <form scVestForm #vestForm="scVestForm" [vestSuite]="mySuite">
      <!-- Form fields -->
      <button type="submit" [disabled]="isSubmitDisabled()">Submit</button>
      @if (showWarning()) {
        <div>Please double-check your entries.</div>
      }
    </form>
  `,
})
export class MyAdvancedComponent {
  protected readonly vestForm = viewChild.required(FormDirective<MyForm>);
  protected readonly mySuite = mySuite;

  // Example: Disable submit button if form is invalid or pending
  protected readonly isSubmitDisabled: Signal<boolean> = computed(() => {
    return !this.vestForm().isValid() || this.vestForm().isPending();
  });

  // Example: Show a warning if the form is dirty but invalid
  protected readonly showWarning: Signal<boolean> = computed(() => {
    return this.vestForm().dirtyChange() && !this.vestForm().isValid();
  });
}
```

### Integrating with External Signal State (`linkedSignal`)

If your initial form data comes from another signal (e.g., from a state management store or an API call), you might want the form to react to changes in that source signal while still allowing local edits. Angular's `linkedSignal` can be a pattern for this, although it adds complexity.

**Note:** This is an advanced pattern. Carefully consider if the complexity is necessary for your use case. The standard `[formValue]` input often suffices for setting initial data.

```typescript
import {
  Component,
  inject,
  signal,
  Signal,
  WritableSignal,
  computed,
} from '@angular/core';
import { linkedSignal } from '@angular/cdk/signals'; // Import from CDK or implement your own
import { FormDirective, vestForms, VestSuite } from 'ngx-vest-forms';
import { SomeStoreService } from './some-store.service'; // Example service

type UserProfile = { name: string; email: string };
declare const userProfileSuite: VestSuite<UserProfile>;

@Component({
  // ... component metadata
  standalone: true,
  imports: [vestForms],
  template: `
    <!-- Bind the linked signal's value to [formValue] -->
    <form
      scVestForm
      #vestForm="scVestForm"
      [vestSuite]="userProfileSuite"
      [formValue]="formDataSource()"
    >
      <label>Name: <input name="name" ngModel /></label>
      <label>Email: <input name="email" type="email" ngModel /></label>
      <button type="button" (click)="resetToStore()">Reset to Store</button>
      <button type="submit" [disabled]="!vestForm().isValid()">Save</button>
    </form>
  `,
})
export class UserProfileComponent {
  private readonly store = inject(SomeStoreService); // Assume returns Signal<UserProfile | null>
  protected readonly vestForm = viewChild.required(FormDirective<UserProfile>);
  protected readonly userProfileSuite = userProfileSuite;

  // Signal containing the source data from the store
  private readonly userFromStore: Signal<UserProfile | null> =
    this.store.currentUserProfile;

  // linkedSignal manages the data passed to the form
  protected formDataSource: WritableSignal<UserProfile | null> = linkedSignal({
    // Source signal to link to
    source: this.userFromStore,
    // Logic to compute the value based on the source and previous state
    computation: (storeData, previous) => {
      // Simple strategy: If store data changes, reset the form to store data.
      // Otherwise, keep the current local form state.
      // More complex merging logic might be needed depending on requirements.
      if (storeData !== previous?.source) {
        console.log('Source changed, resetting formDataSource to:', storeData);
        return storeData ? { ...storeData } : null; // Return a copy
      }
      // If source hasn't changed, keep the potentially modified value from the form
      return previous?.value ?? null;
    },
  });

  // Method to explicitly reset the linked signal (and thus the form) to the store value
  resetToStore(): void {
    const storeValue = this.userFromStore();
    console.log('Manual reset to store value:', storeValue);
    this.formDataSource.set(storeValue ? { ...storeValue } : null); // Set a copy
  }

  save(): void {
    if (this.vestForm().isValid()) {
      const currentFormValue = this.vestForm().formValueChange();
      console.log('Saving:', currentFormValue);
      // this.store.updateUserProfile(currentFormValue);
    }
  }
}
```

**Key Considerations for `linkedSignal` Pattern:**

- **Complexity:** Adds significant complexity compared to just setting `[formValue]` once.
- **`linkedSignal` Source:** You'll need to import `linkedSignal` (e.g., from `@angular/cdk/signals` when available, or implement a similar utility).
- **Reset Logic:** Carefully define the `computation` logic to handle how changes from the `source` affect the form's data (reset, merge, etc.).
- **Immutability:** Ensure you are setting _copies_ of objects to `linkedSignal` and potentially within the `computation` to avoid unintended side effects.

### Using `model()` Inputs in Wrapper Components

Angular's `model()` signal input is useful for creating two-way bindings on component inputs. While you **cannot** use `model()` directly on standard HTML form elements (`<input>`, `<select>`) managed by `ngx-vest-forms` (as they rely on `ngModel`), you **can** use `model()` on your own wrapper components that might _contain_ parts of a form.

**Example:** Imagine a custom `address-input.component` that uses `model()` for its `address` input. Inside that component's template, you would still use `ngModel` on the actual `<input>` fields for street, city, etc., potentially within an `ngModelGroup`. The parent component using `address-input` would bind using `[(address)]="parentSignal"`.

```typescript
// ---- Parent Component ----
import { AddressInputComponent } from './address-input.component';
// ...
@Component({
  // ...
  imports: [vestForms, AddressInputComponent],
  template: `
    <form scVestForm [vestSuite]="suite">
      <div ngModelGroup="billingAddress">
        <!-- Bind parent signal to the model() input of the child -->
        <sc-address-input [(address)]="billingAddressSignal" />
      </div>
    </form>
  `,
})
export class ParentFormComponent {
  protected billingAddressSignal = signal<Address | null>(null);
  // ... suite, etc.
}

// ---- Child AddressInputComponent ----
import { NgModelGroup } from '@angular/forms'; // Needed if using ngModelGroup inside
// ...
@Component({
  selector: 'sc-address-input',
  standalone: true,
  imports: [vestForms], // If using ngx-vest-forms directives inside
  // Required if using ngModelGroup/ngModel inside this component's template
  viewProviders: [vestFormsViewProviders],
  template: `
    <!-- No ngModelGroup needed here if parent provides it -->
    <label>Street: <input name="street" ngModel /></label>
    <label>City: <input name="city" ngModel /></label>
    <!-- ... other address fields with ngModel -->
  `,
})
export class AddressInputComponent {
  // Use model() for the component's input
  readonly address = model<Address | null>(null);
}
```

This pattern allows creating reusable form sections as components with clean two-way binding APIs, while still leveraging `ngx-vest-forms` and TDF internally. Remember to include `vestFormsViewProviders` in the child component if it uses `ngModel`/`ngModelGroup`.

## Examples

to check the examples, clone this repo and run:

```shell
npm i
npm start
```

There is an example of a complex form with a lot of conditionals and specifics,
and there is an example of a form array with complex validations that is used to
create a form to add business hours. A free tutorial will follow soon.

You can check the examples in the github repo [here](https://github.com/simplifiedcourses/ngx-vest-forms/blob/master/projects/examples).
[Here](https://stackblitz.com/~/github.com/simplifiedcourses/ngx-vest-forms-stackblitz){:target="\_blank"} is a stackblitz example for you.
It's filled with form complexities and also contains form array logic.

## Want to learn more?

[![course.jpeg](course.jpeg)](https://www.simplified.courses/complex-angular-template-driven-forms)

[This course](https://www.simplified.courses/complex-angular-template-driven-forms) teaches you to become a form expert in no time.

---

## Breaking Changes

### Root Form Validation Default

- The default for `[validateRootForm]` is now `true`.
- If you do not want root-level validation, set `[validateRootForm]="false"` on your form.

#### When should you set `[validateRootForm]` to `false`?

You might want to set `[validateRootForm]` to `false` in these situations:

- **Performance optimization:** If root-level validation is expensive and not always needed, you may want to disable it by default and only enable it when required.
- **Legacy or simple forms:** If your form setup predates root-level validation or is very simple, you may not want to introduce extra validation logic.

See the [Validations on the root form](#validations-on-the-root-form) section for more details.
