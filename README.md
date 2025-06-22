# ngx-vest-forms

> 🚨 **Upgrading to v2?** See our [**Migration Guide**](./docs/MIGRATION_GUIDE_V2.md) for step-by-step instructions and a [**Breaking Changes Overview**](./docs/BREAKING_CHANGES_PUBLIC_API.md).

`ngx-vest-forms` is a lightweight, modern adapter for Angular Template Driven Forms and [Vest](https://vestjs.dev). It enables unidirectional, type-safe, and reactive forms with minimal code, leveraging Angular signals, standalone components, and the latest best practices.

## What is ngx-vest-forms?

It's a small library that bridges the gap between declarative Vest validation suites and Angular's template-driven forms. It automatically handles validation, state tracking (value, errors, validity, pending), and error display, exposing everything as reactive signals.

**Key Features:**

- **Zero Boilerplate:** Just use `ngModel`/`ngModelGroup` and connect a Vest suite—no manual wiring or error handling needed.
- **Type Safety:** Optional schema support (Zod, ArkType, Valibot, or object template) for compile-time safety and IDE inference.
- **Form-Compatible Types:** Built-in utility types like `FormCompatibleDeepRequired<T>` solve Date/string mismatches in form initialization.
- **Signals & Reactivity:** All form state (value, errors, validity, pending, etc.) is exposed as signals for easy, reactive UI updates.
- **Powerful Validations:** Use Vest.js for declarative, composable, and async validation logic.
- **Accessible by Default:** Built-in error display, ARIA roles, and keyboard support via `<ngx-control-wrapper>`.
- **Modern Angular:** Designed for Angular 17+ standalone components, signals, and new control flow (`@if`, `@for`).
- **Native HTML5 validation is disabled:** The `novalidate` attribute is automatically added to all forms using `ngxVestForm`, so all validation is handled by VestJS and Angular, not the browser.
- **Advanced Features Available:** Optional smart state management and UI helper components available as secondary entry points.

## Why and When to Use It

Use `ngx-vest-forms` when you want to:

- **Eliminate Boilerplate:** Stop writing manual validation logic, state tracking, and error handling in your components. Just use `ngModel` and connect a Vest suite.
- **Embrace Type Safety:** Use schemas (Zod, ArkType, Valibot, or a simple template) to get compile-time safety and powerful type inference for your form models.
- **Build Reactive UIs:** All form and control states are signals, making it trivial to build dynamic, performant UIs with Angular's new control flow (`@if`, `@for`).
- **Decouple Validation from Components:** Keep your validation logic pure, reusable, and separate from your UI components.
- **Adopt Modern Angular:** The library is built for Angular 17+ and embraces standalone components, signals, and composition over inheritance.

---

## Installation

```sh
npm i ngx-vest-forms vest
```

## Core Features & Quick Start

The core of the library is the `ngxVestForm` directive, which automatically links your form with a Vest validation suite.

### 1. Define Your Model and (Optional) Schema

```typescript
// user.model.ts
import { signal } from '@angular/core';

// A simple object template is enough for type inference
const userModel = { name: '', email: '' };

// Optionally, create a schema for more robust validation and type generation
import { ngxModelToStandardSchema } from 'ngx-vest-forms/schemas';
const userSchema = ngxModelToStandardSchema(userModel);
```

### 2. Create a Vest Validation Suite

```typescript
// user.validations.ts
import { staticSuite, test, enforce } from 'vest';

export const userValidations = staticSuite((data = {}, field?: string) => {
  // The `only` function from Vest is used internally to optimize validation runs
  test('name', 'Name is required', () => enforce(data.name).isNotEmpty());
  test('email', 'A valid email is required', () =>
    enforce(data.email).isEmail(),
  );
});
```

### 3. Use in a Standalone Angular Component

```typescript
// user-form.component.ts
import { Component, signal } from '@angular/core';
import { ngxVestForms } from 'ngx-vest-forms';
import { NgxControlWrapper } from 'ngx-vest-forms/control-wrapper'; // UI Helper
import { userModel } from './user.model';
import { userValidations } from './user.validations';

@Component({
  standalone: true,
  imports: [ngxVestForms, NgxControlWrapper],
  template: `
    <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
      <ngx-control-wrapper>
        <label for="name">Name</label>
        <input id="name" name="name" [ngModel]="model().name" />
      </ngx-control-wrapper>

      <ngx-control-wrapper>
        <label for="email">Email</label>
        <input id="email" name="email" [ngModel]="model().email" type="email" />
      </ngx-control-wrapper>
    </form>
  `,
})
export class UserFormComponent {
  protected readonly model = signal(userModel);
  protected readonly suite = userValidations;
}
```

---

## Building Form Fields & Displaying Errors

A key part of any forms library is how it handles UI, particularly error messages. `ngx-vest-forms` provides two powerful approaches: a convenient pre-built wrapper and a composable directive for building your own custom form fields.

### 1. The Easy Way: `NgxControlWrapper`

For maximum convenience, the library includes `NgxControlWrapper`, an optional UI helper that handles everything you need for a form field:

- A container for your `<label>` and control (`<input>`, `<select>`, etc.).
- Automatic error message display with smooth animations.
- Pending (async validation) indicator.
- Accessibility (ARIA attributes) baked in.

**Installation & Usage:**

The `NgxControlWrapper` is available from a secondary entry point to keep the core bundle small.

```typescript
// Import from the control-wrapper secondary entry point
import { NgxControlWrapper } from 'ngx-vest-forms/control-wrapper';

@Component({
  standalone: true,
  imports: [ngxVestForms, NgxControlWrapper],
  // ...
})
export class MyFormComponent {}
```

**📖 [Complete Control Wrapper Documentation](./projects/ngx-vest-forms/control-wrapper/README.md)**

### 2. The Flexible Way: Build Your Own with `NgxFormErrorDisplayDirective`

For complete control over your form field's markup and behavior, you can easily create your own wrapper component. This is the recommended approach for building a reusable component library.

The `NgxFormErrorDisplayDirective` provides all the necessary logic and state signals. You can use it as a `hostDirective` to instantly power your custom component.

**Why build your own?**

- **Full Design Control:** Match your application's specific design system.
- **Reusable Logic:** Create a standardized form field component for your entire application.
- **Composition:** Add any other directives or behaviors you need.

**Example Custom Field Component:**

```typescript
// my-form-field.component.ts
import { Component, inject } from '@angular/core';
import { NgxFormErrorDisplayDirective } from 'ngx-vest-forms';

@Component({
  selector: 'my-form-field',
  standalone: true,
  hostDirectives: [NgxFormErrorDisplayDirective],
  template: `
    <ng-content />

    @if (formErrorDisplay.isPending()) {
      <div class="spinner">Validating...</div>
    } @else if (formErrorDisplay.shouldShowErrors()) {
      <div class="errors">
        @for (error of formErrorDisplay.errors(); track error) {
          <div class="error-message">{{ error }}</div>
        }
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
      margin-bottom: 1rem;
    }
    .error-message {
      color: red;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }
  `,
})
export class MyFormFieldComponent {
  // Inject the directive to access its API
  protected readonly formErrorDisplay = inject(NgxFormErrorDisplayDirective, {
    self: true,
  });
}
```

**Usage in a Form:**

```html
<!-- In your form component's template -->
<form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
  <my-form-field>
    <label for="name">Name</label>
    <input id="name" name="name" [ngModel]="model().name" />
  </my-form-field>
  <!-- ... other fields ... -->
</form>
```

---

## Advanced Features

Beyond the basics, `ngx-vest-forms` offers powerful, optional modules for advanced scenarios. These are available as secondary entry points to keep the core library lean.

### Smart State Management

For complex applications that need intelligent data merging, conflict resolution, and external data synchronization, `ngx-vest-forms` provides advanced smart state management.

**When to Use It:**

- **User profiles** that might be updated by admins while users are editing.
- **Collaborative editing** with real-time synchronization.
- **Long-running forms** where external data changes during editing.
- **Mobile/offline apps** that sync when connectivity returns.

**Installation & Usage:**

Smart state management is available from `ngx-vest-forms/smart-state`:

```typescript
// Import from the smart-state secondary entry point
import { NgxVestFormsSmartStateDirective } from 'ngx-vest-forms/smart-state';

@Component({
  standalone: true,
  imports: [ngxVestForms, NgxVestFormsSmartStateDirective],
  // ...
})
export class UserProfileComponent {
  // ...
}
```

**📖 [Complete Smart State Documentation](./docs/smart-state-management.md)**

### Schema Utilities for Type Safety

For enhanced type safety and schema-driven validation, `ngx-vest-forms` provides powerful schema utilities. These work with popular schema libraries like Zod, Valibot, and ArkType, or even simple object templates.

**Why Use Schemas?**

- **Compile-Time Safety:** Catch typos and incorrect data structures at build time.
- **Powerful Type Inference:** Get full autocompletion and type checking for your form models.
- **Single Source of Truth:** Define your data shape once and reuse it across your application.

**Installation & Usage:**

Schema utilities are available from `ngx-vest-forms/schemas`:

```typescript
// Import from the schemas secondary entry point
import { ngxModelToStandardSchema } from 'ngx-vest-forms/schemas';
import type { InferSchemaType } from 'ngx-vest-forms/schemas';

// 1. With object template
const userTemplate = { name: '', age: 0 };
const userSchema = ngxModelToStandardSchema(userTemplate);
type User = InferSchemaType<typeof userSchema>;

// 2. With Zod
import { z } from 'zod';
const zodSchema = z.object({
  name: z.string().min(1),
  age: z.number().min(0),
});
const userSchemaFromZod = ngxModelToStandardSchema(zodSchema);

// 3. With Valibot
import * as v from 'valibot';
const valibotSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1)),
  age: v.pipe(v.number(), v.minValue(0)),
});
const userSchemaFromValibot = ngxModelToStandardSchema(valibotSchema);

@Component({
  template: `
    <form
      ngxVestForm
      [vestSuite]="suite"
      [formSchema]="userSchema"
      [(formValue)]="userData"
    >
      <ngx-control-wrapper>
        <label for="name">Name</label>
        <input id="name" name="name" [ngModel]="userData().name" />
      </ngx-control-wrapper>

      <ngx-control-wrapper>
        <label for="age">Age</label>
        <input id="age" name="age" type="number" [ngModel]="userData().age" />
      </ngx-control-wrapper>
    </form>
  `,
})
export class UserFormComponent {
  protected readonly userSchema = userSchema;
  protected readonly userData = signal<User>(userTemplate);
  protected readonly suite = userValidations;
}
```

**📖 [Complete Schema Utilities Documentation](./projects/ngx-vest-forms/schemas/README.md)**

---

## Best Practices

- **Use Wrappers:** Always use `<ngx-control-wrapper>` or a custom-built equivalent for every input. This handles error display, accessibility, and pending state automatically.

- **Unidirectional Data Flow for Controls:** Use `[ngModel]` for individual controls to ensure data flows one way from your model to the view. The `ngxVestForm` directive will handle updating the model signal internally.

- **Two-Way Binding for the Form:** Use `[(formValue)]` on the `<form>` element for convenient two-way binding with your form's model signal.

- **Use Signals:** Leverage signals and `computed()` for all form state and derived UI logic.

- **Modern Control Flow:** Use the new Angular control flow (`@if`, `@for`, `@defer`) in templates for better performance and readability.

- **Separate Validation Logic:** Keep validation suites in separate `*.validations.ts` files for clarity, reusability, and separation of concerns.

- **Provide a Schema:** Use `[formSchema]` for type safety and IDE support, especially for complex or nested forms.

- **Handle Cross-Field Validation:**

  - Use `[validateRootForm]="true"` for root-level (cross-field) validation.
  - Use `[validationConfig]` for more complex cross-field dependencies (e.g., confirm password, cyclic dependencies).

- **Understand Error Display:**

  - The available `errorDisplayMode`s are: `'on-blur'`, `'on-submit'`, and `'on-blur-or-submit'` (default).
  - Error display logic respects a control's `ngModelOptions.updateOn` value. If `updateOn: 'submit'`, errors will only show after form submission, regardless of the display mode. A warning is logged in development to help catch this.

- **Remove Deprecated Patterns:** Avoid using old patterns like `[formShape]`, manual error markup, or deprecated signal APIs.

- **Never manually display field errors:** Let the control wrapper handle error display automatically.

---

## Root-Level Form Validation with `validateRootForm`

The `[validateRootForm]` directive enables validations that pertain to the form as a whole, rather than individual fields. This is useful for scenarios requiring cross-field validation or conditions that depend on multiple form values.

By default, `[validateRootForm]` is `false`. To enable it, set it to `true`:

```html
<form
  ngxVestForm
  [vestSuite]="mySuite"
  [(formValue)]="model"
  [validateRootForm]="true"
>
  <!-- form fields -->
</form>
```

### How it Works

1. **Define Root Validations in Your Vest Suite:**
   In your Vest suite, you target these form-level validations using a special key. By default, this key is `'rootForm'`. You can customize this key by providing a different value for the `NGX_ROOT_FORM` injection token. The `injectNgxRootFormKey()` utility function can be used to access the current root form key if needed.

   ```typescript
   // my-suite.ts
   import { staticSuite, test, enforce, only } from 'vest';
   import { injectNgxRootFormKey } from 'ngx-vest-forms';

   export const mySuite = staticSuite(
     (data: MyFormModel = {}, field?: string) => {
       only(field);

       // Regular field validations
       test('email', 'Email is required', () =>
         enforce(data.email).isNotEmpty(),
       );
       test('phone', 'Phone is required', () =>
         enforce(data.phone).isNotEmpty(),
       );

       // Root-level validation
       const rootFormKey = injectNgxRootFormKey(); // Defaults to 'rootForm'
       test(rootFormKey, 'At least one contact method required', () => {
         enforce(data.email || data.phone).isTruthy();
       });
     },
   );
   ```

2. **Accessing Root Issues:**
   Root-level errors, warnings, and internal Vest suite errors are exposed through the `formState().root` signal on the `ngxVestForm` directive.

   ```typescript
   // my-component.ts
   import { Component, viewChild, signal } from '@angular/core';
   import { NgxFormDirective } from 'ngx-vest-forms';
   import { mySuite } from './my-suite';

   @Component({
     template: `
       <form ngxVestForm #vestForm="ngxVestForm" [validateRootForm]="true">
         <!-- form fields -->

         @if (vestForm.formState().root?.errors.length) {
           <div class="form-errors" role="alert">
             @for (error of vestForm.formState().root.errors; track error) {
               <div class="error">{{ error }}</div>
             }
           </div>
         }
       </form>
     `,
   })
   export class MyFormComponent {
     protected readonly suite = mySuite;
     protected readonly model = signal({ email: '', phone: '' });
   }
   ```

### When to Use `validateRootForm`

- **Cross-Field Dependencies:** When the validity of one field depends on another (e.g., "If 'country' is 'USA', 'state' is required.")
- **Conditional Form-Wide Rules:** "If 'subscribeToNewsletter' is true, then 'email' must be provided and valid."
- **Overall Form State Checks:** "At least one contact method (phone or email) must be provided."
- **Business Rules Involving Multiple Fields:** "If 'userType' is 'admin', then 'department' cannot be 'support'."

---

## Native HTML5 Validation is Disabled (`novalidate`)

When you use `ngxVestForm`, the `novalidate` attribute is **automatically added** to your `<form>`. This disables the browser's built-in HTML5 validation UI and ensures that **all validation is handled by VestJS** and your Angular logic.

**Why?**

- **Consistency:** VestJS provides a single source of truth for validation logic and error messages, ensuring a consistent user experience across browsers.
- **No Double Validation:** Disabling native validation prevents redundant or conflicting error messages from the browser.
- **Full Control:** VestJS supports complex, conditional, and cross-field validations that native HTML5 cannot handle.

**How?**

You do **not** need to add `novalidate` manually. The directive does this for you:

```html
<form ngxVestForm [vestSuite]="mySuite" [(formValue)]="model">
  <!-- ... -->
</form>
```

Renders as:

```html
<form ngxvestform="" novalidate>
  <!-- ... -->
</form>
```

**Best Practice:**
Define all validation rules (e.g., required, min/max, pattern) in your VestJS suite. Do **not** rely on native HTML5 validation attributes, as they will be ignored by the browser when `novalidate` is present.

---

## Migration & Documentation Resources

### v2 Migration Resources

- 📋 **[v2 Migration Guide](./docs/MIGRATION_GUIDE_V2.md)** - Complete step-by-step migration instructions
- 📝 **[Changes Overview](./docs/CHANGES_OVERVIEW.md)** - High-level summary of what's new and changed
- ⚠️ **[Breaking Changes (Public API)](./docs/BREAKING_CHANGES_PUBLIC_API.md)** - Detailed breaking changes documentation
- 🏗️ **[Breaking Changes (Internal)](./docs/BREAKING_CHANGES_INTERNAL.md)** - For library contributors and maintainers

### Feature Documentation

- 🧠 **[Smart State Management](./docs/smart-state-management.md)** - Advanced state management with conflict resolution
- 🎨 **[Control Wrapper Guide](./projects/ngx-vest-forms/control-wrapper/README.md)** - UI wrapper component documentation
- 📊 **[Schema Utilities](./projects/ngx-vest-forms/schemas/README.md)** - Type safety with schema libraries
- 💡 **[Examples Collection](./docs/EXAMPLES.md)** - Comprehensive examples from basic to advanced

### Quick Start Based on Your Needs

| Your Situation                | Recommended Reading                                                                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 🆕 **New to ngx-vest-forms**  | Start with [Installation](#installation) and [Quick Start](#core-features--quick-start)                                               |
| ⬆️ **Upgrading from v1.x**    | [Migration Guide](./docs/MIGRATION_GUIDE_V2.md) → [Changes Overview](./docs/CHANGES_OVERVIEW.md)                                      |
| 🔧 **Need advanced features** | [Smart State Guide](./docs/smart-state-management.md) or [Control Wrapper Guide](./projects/ngx-vest-forms/control-wrapper/README.md) |
| 📊 **Want type safety**       | [Schema Utilities Guide](./projects/ngx-vest-forms/schemas/README.md)                                                                 |
| 🚀 **Ready to build**         | [Examples Collection](./docs/EXAMPLES.md)                                                                                             |

### Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/simplifiedcourses/ngx-vest-forms/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/simplifiedcourses/ngx-vest-forms/discussions)
- 📚 **Documentation**: All guides linked above
- 💡 **Examples**: Working examples in [projects/examples/](./projects/examples/)
