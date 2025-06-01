# ngx-vest-forms Breaking Changes: Public API Migration Guide

This document lists all **public API breaking changes** in recent versions of `ngx-vest-forms` (v2+), with migration steps and rationale. It is intended for developers upgrading from v1. For internal/architectural changes, see `BREAKING_CHANGES_INTERNAL.md`.

---

## Table of Contents

- [ngx-vest-forms Breaking Changes: Public API Migration Guide](#ngx-vest-forms-breaking-changes-public-api-migration-guide)
  - [Table of Contents](#table-of-contents)
  - [1. Two-way Binding with `model()` for `[formValue]`](#1-two-way-binding-with-model-for-formvalue)
    - [What changed?](#what-changed)
    - [Why?](#why)
    - [Migration](#migration)
    - [Migration steps](#migration-steps)
  - [2. Unified `formState` Signal and Deprecation of Old API](#2-unified-formstate-signal-and-deprecation-of-old-api)
    - [What changed?](#what-changed-1)
    - [Why?](#why-1)
    - [Migration](#migration-1)
      - [Comparison Table](#comparison-table)
      - [Example](#example)
  - [3. Error Display Behavior: Now Shown on Blur and Submit](#3-error-display-behavior-now-shown-on-blur-and-submit)
    - [What changed?](#what-changed-2)
    - [Why?](#why-2)
    - [Migration](#migration-2)
      - [Comparison Table](#comparison-table-1)
  - [4. Root Form Validation Default](#4-root-form-validation-default)
    - [What changed?](#what-changed-3)
    - [Why?](#why-3)
    - [Migration](#migration-3)
      - [Comparison Table](#comparison-table-2)
  - [5. `[formShape]` Input Deprecated](#5-formshape-input-deprecated)
    - [What changed?](#what-changed-4)
    - [Why?](#why-4)
    - [Migration](#migration-4)
      - [Comparison Table](#comparison-table-3)
  - [6. Customizing the Root Form Key](#6-customizing-the-root-form-key)
    - [What changed?](#what-changed-5)
    - [Why?](#why-5)
    - [Migration](#migration-5)
  - [7. Error Handling for Model Template Mismatches](#7-error-handling-for-model-template-mismatches)
    - [What changed?](#what-changed-6)
    - [Why?](#why-6)
    - [Migration](#migration-6)
  - [8. `[formValue]` and `[formSchema]` Inputs Are Now Optional](#8-formvalue-and-formschema-inputs-are-now-optional)
    - [What changed?](#what-changed-7)
    - [Why?](#why-7)
    - [Migration](#migration-7)
  - [9. Validation Configuration and Options](#9-validation-configuration-and-options)
    - [What changed?](#what-changed-8)
    - [Why?](#why-8)
    - [Migration](#migration-8)
  - [10. Error Object Structure Change](#10-error-object-structure-change)
    - [What changed?](#what-changed-9)
    - [Why?](#why-9)
    - [Migration](#migration-9)
      - [Comparison Table](#comparison-table-4)
  - [11. Control Wrapper Selector Changed](#11-control-wrapper-selector-changed)
    - [What changed?](#what-changed-10)
    - [Why?](#why-10)
    - [Migration](#migration-10)
  - [12. Standalone Components and Modern Angular APIs](#12-standalone-components-and-modern-angular-apis)
    - [What changed?](#what-changed-11)
    - [Why?](#why-11)
    - [Migration](#migration-11)
  - [13. New Schema Adapter and Standard Schema Integration](#13-new-schema-adapter-and-standard-schema-integration)
    - [What changed?](#what-changed-12)
    - [Why?](#why-12)
    - [Migration](#migration-12)
  - [14. Configurable Error Display Mode in Control Wrapper](#14-configurable-error-display-mode-in-control-wrapper)
    - [What changed?](#what-changed-13)
    - [Why?](#why-13)
    - [Migration](#migration-13)
  - [15. Field Path Utilities (New)](#15-field-path-utilities-new)
    - [What changed?](#what-changed-14)
    - [Why?](#why-14)
    - [Migration](#migration-14)
  - [16. FormControlStateDirective: Build Your Own Custom Form Field](#16-formcontrolstatedirective-build-your-own-custom-form-field)
    - [What changed?](#what-changed-15)
    - [Why?](#why-15)
    - [How to use](#how-to-use)
      - [Building Custom Form Fields](#building-custom-form-fields)
  - [17. Error Display Modes Renamed and Now UpdateOn-Aware](#17-error-display-modes-renamed-and-now-updateon-aware)
    - [What changed?](#what-changed-16)
    - [Why?](#why-16)
    - [Migration](#migration-15)
      - [Comparison Table](#comparison-table-5)
  - [References](#references)

---

## 1. Two-way Binding with `model()` for `[formValue]`

### What changed?

- The `[formValue]` input and `(formValueChange)` output pattern is replaced by a single two-way binding using `[(formValue)]` via Angular's `model()` API.
- You now bind your signal or store property directly to the form, and it stays in sync automatically.

### Why?

- Dramatically simplifies form integration, reduces boilerplate, and makes it easier to connect your form to signals or state stores (like NgRx SignalStore).
- Aligns with modern Angular best practices for signals and two-way binding.

### Migration

- **Before:**
  ```html
  <form
    scVestForm
    [formValue]="formValue()"
    (formValueChange)="formValue.set($event)"
  >
    ...
  </form>
  ```
- **After:**
  ```html
  <form scVestForm [(formValue)]="formValue">...</form>
  ```
- If you use a signal store (e.g., NgRx SignalStore):
  ```html
  <form scVestForm [(formValue)]="store.formValue">...</form>
  ```
- No need to manually handle value change events or update your signal/store in the template.

### Migration steps

1. Replace `[formValue]="formValue()" (formValueChange)="formValue.set($event)"` with `[(formValue)]="formValue"` in your templates.
2. Remove any manual event handlers for form value changes in your component.
3. If using a store, bind the store's signal directly.

---

## 2. Unified `formState` Signal and Deprecation of Old API

### What changed?

- The new `formState` signal is now the recommended and unified way to access all form state in `ngx-vest-forms` (value, errors, validity, pending, etc.).
- The old signals (`errors`, `isValid`, `isInvalid`, `isPending`, `isDisabled`, `isIdle`) are **deprecated** and will be removed in a future release.

### Why?

- To simplify the API, improve type safety, and provide a single source of truth for all form state.
- This change aligns with modern Angular and signals best practices, and makes it easier to reason about form state in your components and templates.

### Migration

- Replace all usages of the old signals with the new `formState` API.
- Remove usage of the deprecated signals in your components and templates.

#### Comparison Table

| Old Pattern (Deprecated) | New Pattern (Recommended)       |
| ------------------------ | ------------------------------- |
| `vestForm.errors()`      | `vestForm.formState().errors`   |
| `vestForm.isValid()`     | `vestForm.formState().valid`    |
| `vestForm.isPending()`   | `vestForm.formState().pending`  |
| `vestForm.isDisabled()`  | `vestForm.formState().disabled` |
| `vestForm.isIdle()`      | `vestForm.formState().idle`     |

#### Example

```typescript
// Old
const valid = vestForm.isValid();
const errors = vestForm.errors();

// New
const value = vestForm.formState().value;
const valid = vestForm.formState().valid;
const errors = vestForm.formState().errors;
```

```html
<!-- Old -->
@if (vestForm.errors()?.fieldName as errors) {
<ul>
  @for (error of errors; track error) { ... }
</ul>
}

<!-- New -->
@if (vestForm.formState().errors?.fieldName as errors) {
<ul>
  @for (error of errors; track error) { ... }
</ul>
}
```

---

## 3. Error Display Behavior: Now Shown on Blur and Submit

### What changed?

- Error messages for form controls are now displayed when a control loses focus (on blur) or after the form has been submitted (not just on blur).

### Why?

- This change improves user experience by ensuring that validation errors are visible after a user attempts to submit a form, even if some controls have not lost focus individually.

### Migration

- No code changes required unless you relied on errors only being shown after a control loses focus. Now, errors will also show after the first submit attempt.
- **To keep the old behavior (errors only on blur), set the default error display mode globally:**

  In your app or module providers:

  ```typescript
  import { provide } from '@angular/core';
  import { CONTROL_WRAPPER_ERROR_DISPLAY } from 'ngx-vest-forms';

  @NgModule({
    providers: [
      provide(CONTROL_WRAPPER_ERROR_DISPLAY, { useValue: 'on-blur' }),
    ],
  })
  export class AppModule {}
  ```

  Or, for a single control wrapper instance:

  ```html
  <div scControlWrapper errorDisplayMode="on-blur">
    <input ... />
  </div>
  ```

#### Comparison Table

| Old Behavior              | New Behavior (Default)                   |
| ------------------------- | ---------------------------------------- |
| Errors shown only on blur | Errors shown on blur **or** after submit |

---

## 4. Root Form Validation Default

### What changed?

- The default value for the `[validateRootForm]` input on the `scVestForm` directive is now `true`.

### Why?

- This change ensures that root-level (cross-field or form-wide) validations are enabled by default, making it easier to catch form-wide validation issues without extra configuration.

### Migration

- If your forms do not require root-level validation, you must now explicitly set `[validateRootForm]="false"` on your form to disable it.

#### Comparison Table

| Old Default (`[validateRootForm]`) | New Default (`[validateRootForm]`) |
| ---------------------------------- | ---------------------------------- |
| `false`                            | `true`                             |

---

## 5. `[formShape]` Input Deprecated

### What changed?

- The `[formShape]` input is deprecated. Use `[formSchema]` with `modelToStandardSchema` instead.

### Why?

- The new `[formSchema]` input and `modelToStandardSchema` utility provide a more robust and type-safe way to validate form models and catch typos in `name` and `ngModelGroup` attributes.

### Migration

- Update your forms to use `[formSchema]` and `modelToStandardSchema` instead of `[formShape]`.
- For detailed migration examples and comprehensive schema adapter usage, see [Schema Adapters Documentation](docs/schema-adapters.md).

#### Comparison Table

| Old Pattern (Deprecated)                        | New Pattern (Recommended)                                               |
| ----------------------------------------------- | ----------------------------------------------------------------------- |
| `<form scVestForm [formShape]="modelTemplate">` | `<form scVestForm [formSchema]="modelToStandardSchema(modelTemplate)">` |

---

## 6. Customizing the Root Form Key

### What changed?

- The root form errors use the key `'rootForm'` by default. You can now override this by providing the `ROOT_FORM` injection token.

### Why?

- This allows for more flexibility in multi-form applications or when integrating with other systems that require a custom root key.

### Migration

- If you override the `ROOT_FORM` token, you must use the same key in your validation suite and when accessing root form errors.

---

## 7. Error Handling for Model Template Mismatches

### What changed?

- The library now throws a `ModelTemplateMismatchError` at runtime if there is a typo or mismatch in `name` or `ngModelGroup` attributes compared to the model template.

### Why?

- This change improves developer experience by surfacing typos and mismatches early, preventing silent errors and hard-to-debug issues.

### Migration

- Ensure that all `name` and `ngModelGroup` attributes in your templates exactly match the keys in your model template. Any mismatch will now result in a runtime error.

---

## 8. `[formValue]` and `[formSchema]` Inputs Are Now Optional

### What changed?

- The `[formValue]` and `[formSchema]` inputs for the `scVestForm` directive are now explicitly documented as **optional**.

### Why?

- `[formValue]` is for setting an initial value, useful for pre-populating forms. The form can derive its value directly from its `ngModel` controls via `NgForm`, making an initial `formValue` optional.
- `[formSchema]` provides compile-time type safety and enables schema-based validation features. While highly recommended, the core validation logic relies on the `vestSuite`, which can operate without an explicit `formSchema`.

### Migration

- You are **not required** to provide `[formValue]` if your form doesn't need pre-population.
- You are **not required** to provide `[formSchema]`, although it is strongly recommended for type safety and leveraging schema validation libraries (like Zod, ArkType, Valibot).

---

## 9. Validation Configuration and Options

### What changed?

- The validation configuration is now more explicit and must be provided via `[validationConfig]` and `[validationOptions]` as needed.

### Why?

- This change allows for more granular and predictable validation behavior, especially for complex forms with dependencies or debounced validations.

### Migration

- Review your forms and ensure that any custom validation configuration is passed using the new inputs.

---

## 10. Error Object Structure Change

### What changed?

- The structure of the `ValidationErrors` object set on an `AbstractControl` by `ngx-vest-forms` has changed.
- Previously, Vest errors for a field were joined into a single string under the key `error` (e.g., `{ error: 'Message1, Message2' }`).
- Now, Vest errors are stored as an array of strings under the key `errors` (plural) (e.g., `{ errors: ['Message1', 'Message2'] }`).

### Why?

- To align the internal structure used by `FormDirective` with the expectations of `ControlWrapperComponent`.
- To provide a more standard and flexible array format for error messages, making it easier to display multiple distinct errors for a single field if needed.

### Migration

- If you were accessing validation errors directly on a control or via the `vestForm.errors()` signal using the singular `error` key, you must update your code to use the plural `errors` key and access the array elements.

#### Comparison Table

| Old Pattern (Deprecated)             | New Pattern (Recommended)             |
| ------------------------------------ | ------------------------------------- |
| `myFormControl.errors?.['error']`    | `myFormControl.errors?.['errors']`    |
| `vestForm.errors()?.username?.error` | `vestForm.errors()?.username?.errors` |

---

## 11. Control Wrapper Selector Changed

### What changed?

- The attribute selector for the control wrapper component has changed from `[sc-control-wrapper]` to `[scControlWrapper]`.
- An element selector `sc-control-wrapper` has been added.

### Why?

- The attribute selector was updated to follow Angular's standard camelCase convention for directive selectors.
- The element selector provides an alternative way to use the component, which can be clearer in some template structures.

### Migration

- Update your templates to use the new camelCase version: `[scControlWrapper]`.
- You can now optionally use the element selector `<sc-control-wrapper>` instead of the attribute selector on a `div` or other container element.

---

## 12. Standalone Components and Modern Angular APIs

### What changed?

- The library now expects usage of Angular 16+ standalone components, signals, and modern control flow syntax (`@if`, `@for`).

### Why?

- To align with Angular's latest best practices and improve performance, maintainability, and developer experience.

### Migration

- Update your application to use standalone components and signals where appropriate. Avoid legacy NgModules and traditional observables for state management.

---

## 13. New Schema Adapter and Standard Schema Integration

### What changed?

- The new `modelToStandardSchema` utility now produces schemas compatible with the [Standard Schema](https://standardschema.dev/) specification.
- The internal schema-adapter is designed to work with any Standard Schema v1 compatible library, including Zod, ArkType, and Valibot.

### Why?

- Adopting the Standard Schema spec enables better interoperability, tooling, and future-proofing for form validation.
- Using established libraries like Zod, ArkType, or Valibot provides more robust, feature-rich, and well-tested validation than custom shape-based solutions.

### Migration

- You can now use Zod, ArkType, or Valibot schemas directly with `ngx-vest-forms` for type-safe, runtime-validated forms.
- The `modelToStandardSchema` helper is still available for basic type inference, but it only checks that the value is a non-null object and does not perform deep validation.
- For production-grade validation, migrate to a Standard Schema compatible library and pass its schema to `[formSchema]`.

---

## 14. Configurable Error Display Mode in Control Wrapper

### What changed?

- The `sc-control-wrapper` component now supports a configurable error display mode, allowing you to control when errors are shown (on blur, on submit, or both).
- You can set the default globally using the `CONTROL_WRAPPER_ERROR_DISPLAY` injection token, or override per instance using the `errorDisplayMode` input.

### Why?

- This provides more flexibility for teams to match their preferred UX patterns for error display.

### Migration

- By default, errors are shown on blur or submit (`'on-blur-or-submit'`). This used to be `'on-blur'` only.
- You can now set the mode globally or per instance as needed.

---

## 15. Field Path Utilities (New)

### What changed?

- Added utility functions for robust, type-safe access to deeply nested fields in form models: `getValueAtPath`, `setValueAtPath`, `parseFieldPath`, and `stringifyFieldPath`.

### Why?

- Dynamic and array-based forms often require programmatic access to deeply nested values or paths. These utilities make it easy and safe to work with such structures, reducing manual string manipulation and bugs.

### Migration

- You can now use these utilities to get/set values at any depth in your form model, parse field paths, and generate valid field path strings for dynamic forms or custom wrappers.

---

## 16. FormControlStateDirective: Build Your Own Custom Form Field

### What changed?

- The new `FormControlStateDirective` (`scFormControlState`) is now available as a standalone directive.
- This directive provides a reactive signal (`controlState`) with the current state of the nearest `NgModel` or `NgModelGroup`.
- It is used internally by `scControlWrapper`, but you can apply it directly to build your own custom form field wrappers or advanced UI.

### Why?

- Enables advanced use cases and custom form field implementations without relying on the default `scControlWrapper`.
- Provides a clean, idiomatic Angular API for accessing control state (valid, errors, pending, etc.) as a signal.

### How to use

```html
<!-- Example: Custom form field using scFormControlState -->
<div scFormControlState #state="formControlState">
  <input name="email" ngModel />
  @if (state.controlState().isInvalid) {
  <span class="text-red-600">Invalid!</span>
  }
</div>
```

#### Building Custom Form Fields

For more advanced use cases, you can create your own custom form field components using the `FormControlStateDirective`. This allows you to build custom UI components that reactively display control state while maintaining full control over styling and behavior.

Here's an example of creating a custom form field component:

```typescript
import { Component, inject, computed } from '@angular/core';
import { FormControlStateDirective } from 'ngx-vest-forms';

@Component({
  selector: 'app-custom-field',
  template: `
    <div
      class="custom-field"
      [class.is-invalid]="invalid()"
      [class.is-pending]="pending()"
    >
      <ng-content></ng-content>

      @if (shouldShowErrors()) {
        <div class="error-messages">
          @for (error of errors(); track error) {
            <p class="error-text">{{ error }}</p>
          }
        </div>
      }

      @if (pending()) {
        <div class="pending-indicator">Validating...</div>
      }
    </div>
  `,
  styles: [
    `
      .custom-field {
        /* Your custom styling */
      }
      .is-invalid {
        border-color: red;
      }
      .is-pending {
        opacity: 0.7;
      }
      .error-messages {
        color: red;
        margin-top: 4px;
      }
    `,
  ],
  hostDirectives: [FormControlStateDirective],
})
export class CustomFieldComponent {
  // Inject the directive to access the control state
  private readonly formControlState = inject(FormControlStateDirective);

  // Create computed signals based on the control state
  protected readonly invalid = computed(
    () => this.formControlState.controlState().isInvalid,
  );

  protected readonly pending = computed(
    () => this.formControlState.controlState().isPending,
  );

  protected readonly touched = computed(
    () => this.formControlState.controlState().isTouched,
  );

  protected readonly errors = computed(() =>
    Array.isArray(this.formControlState.controlState().errors?.['errors'])
      ? this.formControlState.controlState().errors['errors']
      : [],
  );

  protected readonly shouldShowErrors = computed(
    () => this.invalid() && this.touched(),
  );
}
```

This approach gives you total flexibility to:

- Create custom form field UIs that match your design system
- Implement specialized validation behaviors not provided by the default `scControlWrapper`
- Add animations, tooltips, or other UI features to your form fields
- Create field types specialized for different data types (date pickers, number inputs, etc.)

- See the documentation in `docs/form-control-state-directive.md` for more details and advanced usage.

---

## 17. Error Display Modes Renamed and Now UpdateOn-Aware

### What changed?

- Error display modes have been renamed:
  - `'touch'` → `'on-blur'`
  - `'submit'` → `'on-submit'`
  - `'touchOrSubmit'` → `'on-blur-or-submit'`
- Error display logic is now aware of the control's `ngModelOptions.updateOn` value:
  - If `updateOn: 'submit'`, errors are only shown after submit, regardless of display mode.
  - If `updateOn: 'blur'` or `'change'`, display mode determines when errors appear as described.

### Why?

- To align terminology with Angular and clarify intent.
- To ensure error messages are only shown when validation has actually run, improving UX and correctness.

### Migration

- Update all usages of error display modes in your templates and configuration:
  - Replace `'touch'` with `'on-blur'`
  - Replace `'submit'` with `'on-submit'`
  - Replace `'touchOrSubmit'` with `'on-blur-or-submit'`
- Review any custom error display logic to ensure it does not assume errors can be shown before validation (especially with `updateOn: 'submit'`).

#### Comparison Table

| Old Mode                     | New Mode              | Behavior Change                                    |
| ---------------------------- | --------------------- | -------------------------------------------------- |
| `'touch'`                    | `'on-blur'`           | No change (except name)                            |
| `'submit'`                   | `'on-submit'`         | No change (except name)                            |
| `'touchOrSubmit'`            | `'on-blur-or-submit'` | No change (except name)                            |
| (any) + `updateOn: 'submit'` | (any)                 | Errors only shown after submit, regardless of mode |

---

## References

- See the [README.md](README.md) for migration guides and more details on each breaking change.
- For further help, check the [examples](projects/examples) directory or open an issue on GitHub.
- [Introducing ngx-vest-forms: Simplify Complex Angular Form](https://blog.simplified.courses/introducing-ngx-vest-forms/)
