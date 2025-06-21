# ngx-vest-forms

> 🚨 **Upgrading to v2?** See our [**Migration Guide**](./docs/MIGRATION_GUIDE_V2.md) for step-by-step instructions and breaking changes overview.
>
> 📋 **New to v2?** Check the [**Changes Overview**](./docs/CHANGES_OVERVIEW.md) to understand what's new and improved.
>
> ⚠️ **NGX Naming Convention (v2.2+):** All public API elements now use NGX prefixes (e.g., `NgxFormDirective`, `NgxFormState`). See the [migration guide](./docs/MIGRATION_GUIDE_V2.md#ngx-naming-convention-update-v22) for migration steps.

## Modern, Type-Safe, Zero-Boilerplate Angular Forms with Vest

`ngx-vest-forms` is a lightweight, modern (lightweight) adapter for Angular Template Driven Forms and [vestjs](https://vestjs.dev). It enables unidirectional, type-safe, and reactive forms with minimal code, leveraging Angular signals, standalone components, and the latest best practices.

**Key Features:**

- **Zero Boilerplate:** Just use `ngModel`/`ngModelGroup` and connect a Vest suite—no manual wiring or error handling needed.
- **Type Safety:** Optional schema support (Zod, ArkType, Valibot, or object template) for compile-time safety and IDE inference.
- **Form-Compatible Types:** Built-in utility types like `FormCompatibleDeepRequired<T>` solve Date/string mismatches in form initialization.
- **Signals & Reactivity:** All form state (value, errors, validity, pending, etc.) is exposed as signals for easy, reactive UI updates.
- **Powerful Validations:** Use Vest.js for declarative, composable, and async validation logic.
- **Accessible by Default:** Built-in error display, ARIA roles, and keyboard support via `<ngx-control-wrapper>`.
- **Modern Angular:** Designed for Angular 17+ standalone components, signals, and new control flow (`@if`, `@for`).
- **Native HTML5 validation is disabled:** The `novalidate` attribute is automatically added to all forms using `ngxVestForm`, so all validation is handled by VestJS and Angular, not the browser. See details below.
- **Advanced Features Available:** Optional smart state management and UI helper components (like Control Wrapper) available as secondary entry points.

---

## UI Helper: Control Wrapper (Optional)

For streamlined error display and accessibility in your forms, `ngx-vest-forms` offers the `NgxControlWrapper` as an **optional secondary entry point**. This component simplifies wrapping your form inputs to automatically handle error messages and ARIA attributes.

### Control Wrapper: Installation and Usage

The `NgxControlWrapper` is available from `ngx-vest-forms/control-wrapper`:

```typescript
// Import from the control-wrapper secondary entry point
import { NgxControlWrapper } from 'ngx-vest-forms/control-wrapper';

@Component({
  standalone: true,
  imports: [
    ngxVestForms, // Core directive
    NgxControlWrapper, // The wrapper component
    // ... other imports
  ],
  template: `
    <form ngxVestForm [vestSuite]="mySuite" [(formValue)]="model">
      <ngx-control-wrapper>
        <label for="username">Username:</label>
        <input id="username" name="username" ngModel />
      </ngx-control-wrapper>
      <button type="submit">Submit</button>
    </form>
  `,
})
export class MyFormComponent {
  // ...
}
```

**📖 [Complete Control Wrapper Documentation](./projects/ngx-vest-forms/control-wrapper/README.md)** - Detailed guide on usage, configuration, and customization.

---

## Advanced Features: Smart State Management (Optional)

For complex applications that need intelligent data merging, conflict resolution, and external data synchronization, `ngx-vest-forms` provides advanced smart state management as an **optional secondary entry point**.

### When You Need Smart State Management

- **User profiles** that might be updated by admins while users edit
- **Collaborative editing** with real-time synchronization
- **Long-running forms** where external data changes during editing
- **Mobile/offline apps** that sync when connectivity returns

### Installation and Usage

Smart state management is available as a separate entry point to keep the core library lightweight:

```typescript
// Import from the smart-state secondary entry point
import { NgxVestFormsSmartStateDirective } from 'ngx-vest-forms/smart-state';

@Component({
  imports: [ngxVestForms, NgxVestFormsSmartStateDirective],
  template: `
    <form
      ngxVestForm
      ngxSmartStateExtension
      [vestSuite]="userSuite"
      [(formValue)]="userProfile"
      [externalData]="externalUserData()"
      [smartStateOptions]="smartOptions"
      #form="ngxVestForm"
    >
      <!-- Your form fields -->
    </form>
  `,
})
export class UserProfileComponent {
  userProfile = signal<UserProfile | null>(null);
  externalUserData = signal<UserProfile | null>(null);

  // Smart state options - automatically handles intelligent merging
  smartOptions: SmartStateOptions<UserProfile> = {
    mergeStrategy: 'smart',
    preserveFields: ['firstName', 'email'], // Preserve user edits on these fields
    conflictResolution: true,
  };

  async refreshUserData() {
    const userData = await this.userService.getUser();
    this.externalUserData.set(userData);
    // Smart state automatically handles intelligent merging
  }
}
```

**📖 [Complete Smart State Documentation](./projects/ngx-vest-forms/smart-state/README.md)** - Comprehensive guide with advanced patterns, conflict resolution strategies, and real-world examples.

---

## Schema Utilities: Type Safety & Validation (Optional)

For enhanced type safety and schema-based validation, `ngx-vest-forms` provides powerful schema utilities as an **optional secondary entry point**. These utilities work with popular schema libraries like Zod, Valibot, and ArkType, or simple object templates.

### Schema Utilities: Installation and Usage

Schema utilities are available from `ngx-vest-forms/schemas`:

```typescript
// Import from the schemas secondary entry point
import {
  ngxModelToStandardSchema,
  InferSchemaType,
  SchemaDefinition,
} from 'ngx-vest-forms/schemas';

const userTemplate = {
  name: '',
  email: '',
  age: 0,
};

const userSchema = ngxModelToStandardSchema(userTemplate);
type User = InferSchemaType<typeof userSchema>;

@Component({
  standalone: true,
  imports: [ngxVestForms],
  template: `
    <form ngxVestForm [formSchema]="userSchema" [(formValue)]="userData">
      <input name="name" ngModel placeholder="Name" />
      <input name="email" type="email" ngModel placeholder="Email" />
      <input name="age" type="number" ngModel placeholder="Age" />
    </form>
  `,
})
export class UserFormComponent {
  protected readonly userSchema = userSchema;
  protected readonly userData = signal<User>(userTemplate);
}
```

**📖 [Complete Schema Utilities Documentation](./projects/ngx-vest-forms/schemas/README.md)** - Comprehensive guide with examples for Zod, Valibot, ArkType, and object templates.

---

## Native HTML5 Validation is Disabled (`novalidate`)

When you use `ngxVestForm`, the `novalidate` attribute is **automatically added** to your `<form>`. This disables the browser's built-in HTML5 validation UI and ensures that **all validation is handled by VestJS** and your Angular logic.

**Why?**

- **Consistency:** VestJS provides a single source of truth for validation logic and error messages, ensuring a consistent user experience across browsers.
- **No Double Validation:** Disabling native validation prevents redundant or conflicting error messages from the browser.
- **Full Control:** VestJS supports complex, conditional, and cross-field validations that native HTML5 cannot handle.

**How?**

- You do **not** need to add `novalidate` manually. The directive does this for you:

  ```html
  <form ngxVestForm ...>
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

## Installation

```sh
npm i ngx-vest-forms
```

---

## Quick Start: Idiomatic Usage

### 1. Define Your Model and (Optional) Schema

```typescript
import { signal } from '@angular/core';
import { ngxModelToStandardSchema } from 'ngx-vest-forms';

const userModel = { name: '', email: '' };
const userSchema = ngxModelToStandardSchema(userModel); // Or use Zod/ArkType/Valibot
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
import { ngxVestForms } from 'ngx-vest-forms';

@Component({
  standalone: true,
  imports: [ngxVestForms],
  template: `
    <form
      ngxVestForm
      [vestSuite]="suite"
      [(formValue)]="model"
      [formSchema]="schema"
      #vestForm="ngxVestForm"
    >
      <ngx-control-wrapper>
        <label>Name: <input name="name" [(ngModel)]="model().name" /></label>
      </ngx-control-wrapper>
      <ngx-control-wrapper>
        <label>Email: <input name="email" [(ngModel)]="model().email" /></label>
      </ngx-control-wrapper>
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
  protected readonly model = signal(userModel);
  protected readonly schema = userSchema;
  protected readonly suite = userSuite;
}
```

---

## Best Practices (v2+)

- **Always use `<ngx-control-wrapper>` or `[ngxControlWrapper]`** for every input or group. This handles error display, accessibility, and pending state automatically.
- **Error display modes are now: 'on-blur', 'on-submit', 'on-blur-or-submit'** (was: 'touch', 'submit', 'touchOrSubmit').
- **Error display logic is now aware of the control's `ngModelOptions.updateOn` value** for correct timing. If `updateOn: 'submit'`, errors only show after submit, regardless of display mode.
- **Warning:** If you set `errorDisplayMode` to `'on-blur'` or `'on-blur-or-submit'` but use `ngModelOptions.updateOn: 'submit'`, errors will only show after submit. A warning is logged in development mode to help you catch this configuration issue.
- **Use `[(formValue)]` two-way binding** for your form model (a signal or store property). Remove all `[formValue]`/`(formValueChange)` patterns unless you need unidirectional data flow.
- **Use signals and `computed()`** for all form state and derived UI logic.
- **Use the new Angular control flow** (`@if`, `@for`, `@defer`) in templates.
- **Never manually display field errors**—let the control wrapper handle it.
- **Use `[validateRootForm]="true"` when you need root-level (cross-field) validation.**
- **Provide a `[formSchema]`** for type safety and IDE support, especially for complex/nested forms.
- **Use `[validationConfig]`** for cross-field dependencies (e.g., confirm password, cyclic dependencies).
- **Remove all deprecated patterns** (old signals, `[formShape]`, manual error markup, etc.).
- **Keep validation suites in separate files** for clarity and reusability.
- \*\*Document unique capabilities in each example.

---

## Root-Level Form Validation with `validateRootForm`

The `[validateRootForm]` directive, when applied to your `<form ngxVestForm ...>`, enables validations that pertain to the form as a whole, rather than individual fields. This is useful for scenarios requiring cross-field validation or conditions that depend on multiple form values.

By default, `[validateRootForm]` is `false`. If you need root-level validation, you can set it to `true`:
`<form ngxVestForm [vestSuite]="mySuite" [(formValue)]="model" [validateRootForm]="true">`.

### How it Works

1.  **Define Root Validations in Your Vest Suite:**
    In your Vest suite, you target these form-level validations using a special key. By default, this key is `'rootForm'`. You can customize this key by providing a different value for the `NGX_ROOT_FORM` injection token. The `injectNgxRootFormKey()` utility function can be used to access the current root form key if needed.

    ```typescript
    // my-suite.ts
    import {
      staticSuite,
      test,
      enforce,
      only,
      injectNgxRootFormKey,
    } from 'vest';

    export const mySuite = staticSuite(
      (data: MyFormModel = {}, field?: string) => {
        const rootFormKey = injectNgxRootFormKey(); // Defaults to 'rootForm'
        only(field); // Important for performance

        test('name', 'Name is required.', () => {
          enforce(data.name).isNotEmpty();
        });

        test('email', 'A valid email is required.', () => {
          enforce(data.email).isEmail();
        });

        // Example Root Validation
        test(rootFormKey, 'Either a name or an email must be provided.', () => {
          enforce(data.name || data.email).isTruthy();
        });

        test(rootFormKey, 'If age is under 18, consent must be given.', () => {
          omitWhen(!data.age || data.age >= 18, () => {
            enforce(data.consent).isTruthy();
          });
        });
      },
    );
    ```

2.  **Accessing Root Issues:**
    Root-level errors, warnings, and internal Vest suite errors (if any occur during root validation) are exposed through the `formState().root` signal on the `ngxVestForm` directive.

    ```typescript
    // my-component.ts
    import { Component, viewChild, signal } from '@angular/core';
    import { NgxFormDirective, NgxFormState } from 'ngx-vest-forms';
    import { mySuite } from './my-suite';

    @Component({
      // ...
    })
    export class MyFormComponent {
      protected readonly suite = mySuite;
      protected model = signal({
        name: '',
        email: '',
        age: null,
        consent: false,
      });
      protected vestForm = viewChild.required(
        NgxFormDirective<typeof this.model>,
      );

      // Access root issues:
      // const formState = this.vestForm().formState();
      // const rootIssues = formState.root;
      // const rootErrors = rootIssues?.errors;
      // const rootWarnings = rootIssues?.warnings;
      // const internalError = rootIssues?.internalError;
    }
    ```

    In your template:

    ```html
    <form
      ngxVestForm
      #formRef="ngxVestForm"
      [vestSuite]="suite"
      [(formValue)]="model"
    >
      <!-- fields -->

      @if (formRef.formState().root?.errors; as rootErrors) {
      <div class="text-red-500">
        <h4>Form Errors:</h4>
        <ul>
          @for (error of rootErrors; track error) {
          <li>{{ error }}</li>
          }
        </ul>
      </div>
      } @if (formRef.formState().root?.warnings; as rootWarnings) {
      <div class="text-yellow-500">
        <h4>Form Warnings:</h4>
        <ul>
          @for (warning of rootWarnings; track warning) {
          <li>{{ warning }}</li>
          }
        </ul>
      </div>
      } @if (formRef.formState().root?.internalError; as internalError) {
      <div class="text-red-700">
        <p>
          A system error occurred during form validation: {{ internalError }}
        </p>
      </div>
      }
    </form>
    ```

### When to Use `validateRootForm`

- **Cross-Field Dependencies:** When the validity of one field depends on another (e.g., "password" and "confirm password" must match, but this is often better handled at the field level for `confirmPassword` with `equals(data.password)`. A better root example: "If 'country' is 'USA', 'state' is required."
- **Conditional Form-Wide Rules:** "If 'subscribeToNewsletter' is true, then 'email' must be provided and valid." (Though 'email' validation itself is a field validation, the _requirement_ based on another field can be a root validation).
- **Overall Form State Checks:** "At least one contact method (phone or email) must be provided."
- **Business Rules Involving Multiple Fields:** "If 'userType' is 'admin', then 'department' cannot be 'support'."

The `validateRootForm` directive and the corresponding `formState().root` provide a structured way to handle these complex, form-wide validation scenarios.

---

## Example: Advanced Form with Schema and Cross-Field Validation

```typescript
import { Component, signal } from '@angular/core';
import { ngxVestForms, ngxModelToStandardSchema } from 'ngx-vest-forms';
import { staticSuite, test, enforce } from 'vest';

const purchaseTemplate = {
  amount: null,
  description: '',
};
const purchaseSchema = ngxModelToStandardSchema(purchaseTemplate);
const purchaseSuite = staticSuite((data = {}, field?: string) => {
  test('amount', 'Amount is required', () => enforce(data.amount).isNotEmpty());
  test('description', 'Description is required', () =>
    enforce(data.description).isNotEmpty(),
  );
  // Cross-field: amount required if description is not empty, etc.
});

@Component({
  standalone: true,
  imports: [ngxVestForms],
  template: `
    <form
      ngxVestForm
      [vestSuite]="suite"
      [(formValue)]="model"
      [formSchema]="schema"
      #vestForm="ngxVestForm"
    >
      <ngx-control-wrapper>
        <label
          >Amount: <input name="amount" [(ngModel)]="model().amount"
        /></label>
      </ngx-control-wrapper>
      <ngx-control-wrapper>
        <label
          >Description:
          <input name="description" [(ngModel)]="model().description"
        /></label>
      </ngx-control-wrapper>
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
| 🆕 **New to ngx-vest-forms**  | Start with [Installation](#installation) and [Quick Start](#quick-start-idiomatic-usage)                                              |
| ⬆️ **Upgrading from v1.x**    | [Migration Guide](./docs/MIGRATION_GUIDE_V2.md) → [Changes Overview](./docs/CHANGES_OVERVIEW.md)                                      |
| 🔧 **Need advanced features** | [Smart State Guide](./docs/smart-state-management.md) or [Control Wrapper Guide](./projects/ngx-vest-forms/control-wrapper/README.md) |
| 📊 **Want type safety**       | [Schema Utilities Guide](./projects/ngx-vest-forms/schemas/README.md)                                                                 |
| 🚀 **Ready to build**         | [Examples Collection](./docs/EXAMPLES.md)                                                                                             |

### Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/simplifiedcourses/ngx-vest-forms/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/simplifiedcourses/ngx-vest-forms/discussions)
- 📚 **Documentation**: All guides linked above
- 💡 **Examples**: Working examples in [projects/examples/](./projects/examples/)
