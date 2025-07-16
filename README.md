# ngx-vest-forms

> 🚨 **Upgrading to v2?** See our [**Migration Guide**](./docs/MIGRATION_GUIDE_V2.md) for step-by-step instructions and a [**Breaking Changes Overview**](./docs/BREAKING_CHANGES_PUBLIC_API.md).

---

## 🚀 What's New in v2?

- **Modular architecture:** Import only what you need for smaller bundles.
- **Unified NGX naming:** All public APIs use the `Ngx` prefix for clarity and Angular convention.
- **Tree-shaking:** Optional features (smart state, schemas, control wrapper) are now secondary entry points.
- **Unified form state:** All form state (value, errors, validity, pending) is exposed via a single signal.
- **Improved error display:** Errors show on blur or submit by default, with configurable modes.
- **Accessibility:** ARIA roles, keyboard support, and error display are built-in.
- **Migration is easy:** Most users need zero code changes—see the [Migration Guide](./docs/MIGRATION_GUIDE_V2.md).

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

## Modular Architecture & Tree-shaking

`ngx-vest-forms` v2 features a modular architecture with multiple entry points for optimal bundle size:

### Available Entry Points

| Entry Point                      | Purpose                                 | When to Use                             |
| -------------------------------- | --------------------------------------- | --------------------------------------- |
| `ngx-vest-forms`                 | Main package (re-exports core)          | Default usage, backward compatibility   |
| `ngx-vest-forms/core`            | Core form functionality                 | Explicit core imports, same bundle size |
| `ngx-vest-forms/schemas`         | Schema adapters (Zod, Valibot, ArkType) | When using schema validation            |
| `ngx-vest-forms/smart-state`     | Advanced state management               | Complex form state scenarios            |
| `ngx-vest-forms/control-wrapper` | UI helper components                    | Custom form controls                    |

### Import Examples

```typescript
// Main package (includes everything from core)
import { ngxVestForms, NgxFormDirective } from 'ngx-vest-forms';

// Core entry point (same functionality and bundle size)
import { ngxVestForms, NgxFormDirective } from 'ngx-vest-forms/core';

// Modular imports for specific features
import { zodAdapter } from 'ngx-vest-forms/schemas';
import { NgxVestFormsSmartStateDirective } from 'ngx-vest-forms/smart-state';
import { NgxControlWrapper } from 'ngx-vest-forms/control-wrapper';
```

**Note**: Both `ngx-vest-forms` and `ngx-vest-forms/core` have identical bundle sizes since the main package simply re-exports from core. Use either based on your preference for import clarity.

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
import { ngxVestForms } from 'ngx-vest-forms/core'; // Optimized import
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

**📖 [Complete Control Wrapper & Advanced Directives Documentation](./projects/ngx-vest-forms/control-wrapper/README.md)**

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

## Building Your Own Custom Control Wrapper

You are not limited to the default `<ngx-control-wrapper>` component. For full design control, you can use the `NgxFormErrorDisplayDirective` directly to build your own custom wrapper component. This is ideal if you want to match your application's design system or use a different CSS framework (e.g., not Tailwind CSS).

### Example: Custom Control Wrapper Component

```typescript
import { Component, inject } from '@angular/core';
import { NgxFormErrorDisplayDirective } from 'ngx-vest-forms';

@Component({
  selector: 'custom-control-wrapper',
  standalone: true,
  hostDirectives: [NgxFormErrorDisplayDirective],
  template: `
    <ng-content />
    @if (formErrorDisplay.isPending()) {
      <div class="my-spinner">Validating...</div>
    } @else if (formErrorDisplay.shouldShowErrors()) {
      <div class="my-errors">
        @for (error of formErrorDisplay.errors(); track error) {
          <div class="my-error-message">{{ error }}</div>
        }
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
      margin-bottom: 1rem;
    }
    .my-error-message {
      color: #d32f2f;
      font-size: 0.9rem;
      margin-top: 0.25rem;
    }
    .my-spinner {
      color: #1976d2;
      font-size: 0.9rem;
    }
    .my-errors {
      margin-top: 0.25rem;
    }
  `,
})
export class CustomControlWrapperComponent {
  protected readonly formErrorDisplay = inject(NgxFormErrorDisplayDirective, {
    self: true,
  });
}
```

**Usage in a Form:**

```html
<form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
  <custom-control-wrapper>
    <label for="name">Name</label>
    <input id="name" name="name" [ngModel]="model().name" />
  </custom-control-wrapper>
  <!-- ... other fields ... -->
</form>
```

**Tip:** You can style `.my-error-message`, `.my-spinner`, and `.my-errors` however you like. This approach works with any CSS framework or custom styles.

For more details, see the [Advanced Directives Documentation](./projects/ngx-vest-forms/control-wrapper/README.md).

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
  template: `
    <form ngxVestForm [(formValue)]="model" ngxVestFormsSmartState>
      <!-- fields -->
    </form>
  `,
})
export class AdvancedFormComponent {
  protected readonly model = signal({ ... });
}
```

**📖 [Smart State Management Documentation](./projects/ngx-vest-forms/smart-state/README.md)**

### Schema Utilities for Type Safety

**Recommended:** For type safety and schema-driven validation, use [Zod](https://zod.dev/), [Valibot](https://valibot.dev/), or [ArkType](https://arktype.io/). These libraries follow the [Standard Schema](https://standardschema.dev/) initiative and provide robust, interoperable schemas for your forms.

- **Zod**: Popular, expressive, and TypeScript-first schema library.
- **Valibot**: Lightweight, fast, and modern schema validation.
- **ArkType**: Advanced type-level schema validation and inference.

**Example Usage:**

```typescript
import { z } from 'zod';
const userSchema = z.object({ name: z.string(), email: z.string().email() });
type User = z.infer<typeof userSchema>;

@Component({
  template: `
    <form ngxVestForm [formSchema]="userSchema" [(formValue)]="userData">
      <!-- form fields -->
    </form>
  `,
})
export class UserFormComponent {
  protected readonly userSchema = userSchema;
  protected readonly userData = signal<User>({ name: '', email: '' });
}
```

**Fallback:** If you have legacy models or custom requirements, use `modelToStandardSchema` to generate a schema from a plain object template.

```typescript
import { ngxModelToStandardSchema } from 'ngx-vest-forms/schemas';
const userTemplate = { name: '', age: 0 };
const userSchema = ngxModelToStandardSchema(userTemplate);
type User = InferSchemaType<typeof userSchema>;
```

**API Reference & Migration Guidance:**

- Prefer Zod, Valibot, or ArkType for new and migrated forms.
- Use `modelToStandardSchema` only for legacy or custom scenarios.
- See the [schemas README](./projects/ngx-vest-forms/schemas/README.md) for details and migration notes.

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

- 📋 **[v2 Migration Guide](./docs/MIGRATION_GUIDE_V2.md)** - Step-by-step migration instructions
- ⚠️ **[Breaking Changes (Public API)](./docs/BREAKING_CHANGES_PUBLIC_API.md)** - All breaking changes
- 🏗️ **[Breaking Changes (Internal)](./docs/BREAKING_CHANGES_INTERNAL.md)** - For contributors/maintainers
- 📝 **[Changes Overview](./docs/CHANGES_OVERVIEW.md)** - High-level summary

---

## Migrating from v1?

If you're upgrading from ngx-vest-forms v1, see the [Migration Guide](./docs/MIGRATION_GUIDE_V2.md) and [Breaking Changes Overview](./docs/BREAKING_CHANGES_PUBLIC_API.md) for step-by-step instructions, API changes, and troubleshooting tips. Most users need zero code changes, but see the guides for schema utilities, error object migration, and advanced features.

## Common Pitfalls & Troubleshooting

- **Type Errors:** Update all imports and type references to use the new NGX-prefixed APIs.
- **Error Display Issues:** v2 errors are arrays, not strings. Update your error display logic to handle multiple errors per field.
- **Import Errors:** Optional features (schemas, smart state, control wrapper) are now secondary entry points—update your imports accordingly.
- **Deprecated APIs:** Legacy signals and old error config are removed. Use the new unified APIs and configuration system.
- **Schema Migration:** If you used `validateShape`, migrate to `modelToStandardSchema` or a schema adapter (see below).

## Migration from Core

If you were previously using shape validation in v1:

```typescript
// Before (v1)
import { validateShape } from 'ngx-vest-forms';
validateShape(formValue, shape);

// After (v2)
import { ngxModelToStandardSchema } from 'ngx-vest-forms/schemas';
const schema = ngxModelToStandardSchema(shape);
// Use schema for validation, type inference, etc.
```

## Real-World Schema Adapter Example (Zod)

```typescript
import { z } from 'zod';
import { zodAdapter } from 'ngx-vest-forms/schemas';

const userSchema = z.object({ name: z.string(), email: z.string().email() });
const standardSchema = zodAdapter(userSchema);
```

---

## Real-World Examples

### Basic Form

```typescript
// user-form.component.ts
import { Component, signal } from '@angular/core';
import { ngxVestForms } from 'ngx-vest-forms/core';
import { NgxControlWrapper } from 'ngx-vest-forms/control-wrapper';
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

### Advanced: Smart State

```typescript
import { NgxVestFormsSmartStateDirective } from 'ngx-vest-forms/smart-state';
@Component({
  standalone: true,
  imports: [ngxVestForms, NgxVestFormsSmartStateDirective],
  template: `
    <form ngxVestForm [(formValue)]="model" ngxVestFormsSmartState>
      <!-- fields -->
    </form>
  `,
})
export class AdvancedFormComponent {
  protected readonly model = signal({ ... });
}
```

### Schema Integration

```typescript
import { ngxModelToStandardSchema } from 'ngx-vest-forms/schemas';
const userSchema = ngxModelToStandardSchema({ name: '', age: 0 });
type User = InferSchemaType<typeof userSchema>;
```

---

## Error Display Modes & Accessibility

- **Error display modes:** `'on-blur'`, `'on-submit'`, `'on-blur-or-submit'` (default). Configure globally or per control wrapper.
- **Accessibility:** All wrappers/components use ARIA roles, keyboard navigation, and visible focus indicators. Error messages are announced for screen readers.

---

## Troubleshooting & FAQ

**Q: Why aren't my errors showing?**

- Check your error display mode (`errorDisplayMode`). Default is `'on-blur-or-submit'`.
- If using `ngModelOptions.updateOn: 'submit'`, errors only show after submit.

**Q: How do I migrate from v1?**

- See the [Migration Guide](./docs/MIGRATION_GUIDE_V2.md). Most users only need to update imports and selectors.

**Q: Can I use my own form field components?**

- Yes! Use `NgxFormErrorDisplayDirective` as a host directive for custom wrappers.

**Q: How do I enable root-level (cross-field) validation?**

- Add `[validateRootForm]="true"` to your form and use the root key in your Vest suite.

**Q: How do I get type safety for my form model?**

- Use schema utilities (`ngxModelToStandardSchema`, Zod, Valibot, ArkType) for compile-time safety and IDE inference.

---

## Migration & Documentation Quick Links

- 📋 **[v2 Migration Guide](./docs/MIGRATION_GUIDE_V2.md)** - Step-by-step migration instructions
- ⚠️ **[Breaking Changes (Public API)](./docs/BREAKING_CHANGES_PUBLIC_API.md)** - All breaking changes
- 🏗️ **[Breaking Changes (Internal)](./docs/BREAKING_CHANGES_INTERNAL.md)** - For contributors/maintainers

---

## Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/simplifiedcourses/ngx-vest-forms/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/simplifiedcourses/ngx-vest-forms/discussions)
- 📚 **Documentation**: All guides linked above
- 💡 **Examples**: Working examples in [projects/examples/](./projects/examples/)

---

## 📚 Feature Documentation & Further Reading

- **Examples Gallery:** [projects/examples/README.md](./projects/examples/README.md) — Progressive, real-world examples from basic to advanced.
- **Control Wrapper Guide:** [projects/ngx-vest-forms/control-wrapper/README.md](./projects/ngx-vest-forms/control-wrapper/README.md) — Error display, accessibility, and UI abstraction.
- **Schema Utilities Guide:** [projects/ngx-vest-forms/schemas/README.md](./projects/ngx-vest-forms/schemas/README.md) — Type safety, schema integration, and API reference.
- **Smart State Management:** [projects/ngx-vest-forms/smart-state/README.md](./projects/ngx-vest-forms/smart-state/README.md) — Advanced state management, conflict resolution, and external data sync.
