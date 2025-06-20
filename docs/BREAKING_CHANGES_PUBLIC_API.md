# ngx-vest-forms Breaking Changes: Public API Migration Guide

> 📋 **Quick Start:** Looking for a streamlined migration guide? Check our [**v2 Migration Guide**](./MIGRATION_GUIDE_V2.md) for a complete step-by-step walkthrough.

This document lists all **public API breaking changes** in recent versions of `ngx-vest-forms` (v2+), with migration steps and rationale. It is intended for developers upgrading from v1. For internal/architectural changes, see `BREAKING_CHANGES_INTERNAL.md`.

## Quick Overview of Major Changes

| Change                          | Version | Impact    | Migration Required                    |
| ------------------------------- | ------- | --------- | ------------------------------------- |
| Smart State Modularization      | v2.1+   | 🟡 Medium | Only if using smart state features    |
| Control Wrapper Modularization  | v2.2+   | 🟢 Low    | Only if using NgxControlWrapper       |
| Schema Utilities Modularization | v2.3+   | 🟢 Low    | Only if using schema utilities        |
| Component Renaming              | v2.2+   | 🟢 Low    | Only if using ControlWrapperComponent |

**📊 Bundle Impact:** Core users get up to 44% smaller bundle size.

---

## Smart State Management Modularization (v2.1+)

**What changed?**

Smart state management features have been moved to a **secondary entry point** to keep the core library lightweight. This is a **breaking change** if you were using smart state features.

**Why the change?**

- **Smaller core bundle:** Users who don't need advanced smart state features get a smaller core bundle
- **Optional complexity:** Advanced features are now clearly opt-in
- **Better separation of concerns:** Core form logic is separated from advanced state management
- **Future extensibility:** Enables other advanced features to be modularized similarly

**Migration Required:**

If you were using smart state management features (introduced in v2.0), you must update your imports and component setup:

### Before (v2.0):

```typescript
// All features available from main entry point
import { ngxVestForms, SmartStateOptions } from 'ngx-vest-forms';

@Component({
  imports: [ngxVestForms],
  template: `
    <form
      ngxVestForm
      [vestSuite]="suite"
      [(formValue)]="model"
      [externalData]="external()"
      [smartStateOptions]="options()"
    >
      <!-- form fields -->
    </form>
  `
})
```

### After (v2.1+):

```typescript
// Smart state features require separate import
import { ngxVestForms } from 'ngx-vest-forms';
import { ngxVestFormsSmartStateDirective, SmartStateOptions } from 'ngx-vest-forms/smart-state';

@Component({
  imports: [ngxVestForms, ngxVestFormsSmartStateDirective],
  template: `
    <form
      ngxVestForm
      ngxSmartStateExtension
      [vestSuite]="suite"
      [(formValue)]="model"
      [externalData]="external()"
      [smartStateOptions]="options()"
    >
      <!-- form fields -->
    </form>
  `
})
```

**Key Changes:**

1. **Import:** Smart state types and directives must be imported from `ngx-vest-forms/smart-state`
2. **Component Imports:** Add `ngxVestFormsSmartStateDirective` to your component's `imports` array
3. **Template:** Add `ngxSmartStateExtension` directive to your form element
4. **Bundle Impact:** Core users get ~30% smaller bundle, smart state users have minimal overhead

**If you're not using smart state features:** No changes required. Your existing code continues to work unchanged.

**Documentation:** See [Smart State Management Guide](smart-state-management.md) for complete usage examples and patterns.

---

## Control Wrapper Modularization (v2.2+)

**What changed?**

The `NgxControlWrapper` and its related configuration (`ERROR_DISPLAY_MODE_DEFAULT`, `ErrorDisplayMode`) have been moved to a **new secondary entry point**: `ngx-vest-forms/control-wrapper`. The configuration token `CONTROL_WRAPPER_ERROR_DISPLAY` has been renamed to `ERROR_DISPLAY_MODE_DEFAULT` and is now exported from the core `ngx-vest-forms` package, while the `NgxControlWrapper` itself is in the new entry point.

**Why the change?**

- **Smaller core bundle:** Users who build their own UI for error display or don't need the provided wrapper won't include its code in their main bundle.
- **Optional UI Helpers:** The `NgxControlWrapper` is a UI helper, and making it optional aligns with the goal of keeping the core library focused on form logic and validation.
- **Clearer Separation:** Separates core validation logic, advanced state features, and UI utilities into distinct, opt-in modules.

**Migration Required:**

If you were using `NgxControlWrapper` or the `CONTROL_WRAPPER_ERROR_DISPLAY` token:

### Before (v2.1 and earlier):

```typescript
// NgxControlWrapper and its config were part of the core or directly accessible
import {
  ngxVestForms,
  NgxControlWrapper,
  CONTROL_WRAPPER_ERROR_DISPLAY,
  ErrorDisplayMode,
} from 'ngx-vest-forms';

@Component({
  imports: [ngxVestForms, NgxControlWrapper],
  // ...
})
export class MyFormComponent {}

// Provider example
providers: [
  {
    provide: CONTROL_WRAPPER_ERROR_DISPLAY,
    useValue: 'on-blur' as ErrorDisplayMode,
  },
];
```

### After (v2.2+):

```typescript
// NgxControlWrapper is imported from its own entry point
// ERROR_DISPLAY_MODE_DEFAULT (renamed) and ErrorDisplayMode type are from the core
import {
  ngxVestForms,
  ERROR_DISPLAY_MODE_DEFAULT,
  ErrorDisplayMode,
} from 'ngx-vest-forms';
import { NgxControlWrapper } from 'ngx-vest-forms/control-wrapper';

@Component({
  imports: [ngxVestForms, NgxControlWrapper],
  // ...
})
export class MyFormComponent {}

// Provider example (token renamed, type from core)
providers: [
  {
    provide: ERROR_DISPLAY_MODE_DEFAULT,
    useValue: 'on-blur' as ErrorDisplayMode,
  },
];
```

**Key Changes:**

1.  **`NgxControlWrapper` Import:** Import `NgxControlWrapper` from `ngx-vest-forms/control-wrapper`.
2.  **Component Imports Array:** Ensure `NgxControlWrapper` is added to your Angular component's `imports` array if used in the template.
3.  **Configuration Token Renamed:** The injection token `CONTROL_WRAPPER_ERROR_DISPLAY` is now `ERROR_DISPLAY_MODE_DEFAULT`.
4.  **Token and Type Import:** `ERROR_DISPLAY_MODE_DEFAULT` and the `ErrorDisplayMode` type are now imported from the core `ngx-vest-forms` package.
5.  **Bundle Impact:** Users not importing `NgxControlWrapper` will see a slightly smaller bundle. Users of the wrapper will have a new, small, separate chunk for it.

**If you're not using `NgxControlWrapper` or its global configuration:** No changes are required regarding this specific modularization.

**Documentation:** See the [Control Wrapper Guide](../../projects/ngx-vest-forms/control-wrapper/README.md) for complete usage examples and patterns.

---

## Schema Utilities Modularization (v2.3+)

**What changed?**

Schema utilities and types (`SchemaDefinition`, `InferSchemaType`, `modelToStandardSchema`, `extractTemplateFromSchema`, `isStandardSchema`, `shapeToSchema`) have been moved to a **new secondary entry point**: `ngx-vest-forms/schemas`. This is a **breaking change** if you were importing these utilities from the main `ngx-vest-forms` package.

**Why the change?**

- **Smaller core bundle:** Users who don't need schema integration get a smaller core bundle
- **Optional complexity:** Schema utilities are now clearly opt-in for enhanced type safety
- **Better separation of concerns:** Core form logic is separated from schema integration features
- **Modular architecture:** Follows the same pattern as other optional features (smart-state, control-wrapper)

**Migration Required:**

If you were using schema utilities from the main package:

### Before (v2.2 and earlier):

```typescript
// Schema utilities were part of the core package
import {
  ngxVestForms,
  modelToStandardSchema,
  SchemaDefinition,
  InferSchemaType,
} from 'ngx-vest-forms';

const userSchema = modelToStandardSchema(userTemplate);
```

### After (v2.3+):

```typescript
// Schema utilities are imported from their own entry point
import { ngxVestForms } from 'ngx-vest-forms';
import {
  modelToStandardSchema,
  SchemaDefinition,
  InferSchemaType,
} from 'ngx-vest-forms/schemas';

const userSchema = modelToStandardSchema(userTemplate);
```

**Key Changes:**

1. **Import Location:** All schema utilities must be imported from `ngx-vest-forms/schemas`
2. **Core Package:** The core `ngx-vest-forms` package no longer exports schema utilities
3. **Bundle Impact:** Users not using schemas get a smaller core bundle
4. **Functionality:** All schema utilities work exactly the same, only the import location has changed

**If you're not using schema utilities:** No changes required. Your existing code continues to work unchanged.

**Documentation:** See the [Schema Utilities Guide](../../projects/ngx-vest-forms/schemas/README.md) for complete usage examples and patterns.

---

## Component Naming: ControlWrapperComponent → NgxControlWrapper (v2.2+)

**What changed?**

The control wrapper component has been renamed from `ControlWrapperComponent` to `NgxControlWrapper` to follow Angular naming conventions and provide a clearer, more consistent API.

**Why the change?**

- **Angular Conventions:** Follows standard Angular naming patterns for standalone components
- **Clarity:** The `NgxControlWrapper` name clearly indicates this is an ngx-vest-forms component
- **Consistency:** Aligns with the `<ngx-control-wrapper>` element selector
- **API Improvement:** Provides a more intuitive import and usage experience

**Migration Required:**

### Before (v2.1 and earlier):

```typescript
import { ControlWrapperComponent } from 'ngx-vest-forms/control-wrapper';

@Component({
  imports: [ngxVestForms, ControlWrapperComponent],
  // ...
})
```

### After (v2.2+):

```typescript
import { NgxControlWrapper } from 'ngx-vest-forms/control-wrapper';

@Component({
  imports: [ngxVestForms, NgxControlWrapper],
  // ...
})
```

**Key Changes:**

1. **Import Name:** Change `ControlWrapperComponent` to `NgxControlWrapper` in imports
2. **Component Imports Array:** Update the component's `imports` array to use `NgxControlWrapper`
3. **Template Usage:** Template usage remains the same (`<ngx-control-wrapper>` or `[ngxControlWrapper]`)

**Template usage unchanged:**

```html
<!-- These selectors remain the same -->
<ngx-control-wrapper>
  <input name="field" ngModel />
</ngx-control-wrapper>

<!-- or -->
<div ngxControlWrapper>
  <input name="field" ngModel />
</div>
```

---

## New Features (Non-Breaking)

### Smart State Management (v2.x+)

**What's new?**

Optional smart state management capabilities that intelligently handle external data updates, conflict resolution, and state merging using Angular's `linkedSignal` feature.

**Note:** As of v2.1+, these features require importing from the secondary entry point `ngx-vest-forms/smart-state` (see migration section above).

**Key Benefits:**

- Prevents data loss when external data updates while users are editing
- Handles real-time collaborative updates automatically
- Reduces complexity with built-in merge strategies and conflict resolution
- Improves user experience with clear conflict feedback

**New Inputs:**

- `[externalData]` - External data source for smart merging
- `[smartStateOptions]` - Configuration for merge strategies and conflict resolution

**New API Methods:**

- `conflictState()` - Signal indicating conflict status and details
- `acceptExternalChanges()` - Resolve conflicts by accepting external data
- `keepLocalChanges()` - Resolve conflicts by keeping user edits

**Example:**

```typescript
// Before: Simple form (still works)
<form ngxVestForm [vestSuite]="suite" [(formValue)]="userProfile">
  <!-- form fields -->
</form>

// After: With smart state management (optional)
<form
  ngxVestForm
  [vestSuite]="suite"
  [(formValue)]="userProfile"
  [externalData]="externalUserData()"
  [smartStateOptions]="{
    mergeStrategy: 'smart',
    preserveFields: ['email', 'preferences.theme']
  }"
  #form="ngxVestForm"
>
  <!-- form fields -->

  @if (form.conflictState().hasConflict) {
    <div class="conflict-banner">
      <p>Data conflict detected!</p>
      <button (click)="form.acceptExternalChanges()">Accept Changes</button>
      <button (click)="form.keepLocalChanges()">Keep My Changes</button>
    </div>
  }
</form>
```

**Migration:** No migration needed. Existing forms continue to work without changes. Smart state features are purely additive and opt-in.

**Documentation:** See [Smart State Management Guide](smart-state-management.md) for complete usage examples and patterns.

---

## Navigation

### 🔄 Modularization Changes (v2.1+)

- [Smart State Management Modularization](#smart-state-management-modularization-v21)
- [Control Wrapper Modularization](#control-wrapper-modularization-v22)
- [Schema Utilities Modularization](#schema-utilities-modularization-v23)
- [Component Naming Changes](#component-naming-controlwrappercomponent--ngxcontrolwrapper-v22)

### 🆕 New Features & API Changes

- [Smart State Management Features](#smart-state-management-v2x)
- [Two-way Binding with model()](#1-two-way-binding-with-model-for-formvalue)
- [Unified formState Signal](#2-unified-formstate-signal-and-deprecation-of-old-api)
- [Error Display Improvements](#3-error-display-behavior-now-shown-on-blur-and-submit)
- [Root Form Validation Changes](#4-root-form-validation-default)

### 📚 Related Documentation

- [Migration Guide](./MIGRATION_GUIDE_V2.md) - Step-by-step migration instructions
- [Changes Overview](./CHANGES_OVERVIEW.md) - High-level summary of changes
- [Internal Changes](./BREAKING_CHANGES_INTERNAL.md) - For contributors
  - [Schema Utilities Modularization (v2.3+)](#schema-utilities-modularization-v23)
    - [Before (v2.2 and earlier):](#before-v22-and-earlier-1)
    - [After (v2.3+):](#after-v23)
  - [Component Naming: ControlWrapperComponent → NgxControlWrapper (v2.2+)](#component-naming-controlwrappercomponent--ngxcontrolwrapper-v22)
    - [Before (v2.1 and earlier):](#before-v21-and-earlier-2)
    - [After (v2.2+):](#after-v22-1)
  - [New Features (Non-Breaking)](#new-features-non-breaking)
    - [Smart State Management (v2.x+)](#smart-state-management-v2x)
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
  - [13. New Composition API: FormErrorDisplayDirective and FormControlStateDirective](#13-new-composition-api-formerrordisplaydirective-and-formcontrolstatedirective)
    - [What changed?](#what-changed-12)
    - [Why?](#why-12)
    - [Usage Patterns](#usage-patterns)
      - [1. Building Custom Form Components with hostDirectives](#1-building-custom-form-components-with-hostdirectives)
      - [2. Direct Template Usage with Template Reference Variables](#2-direct-template-usage-with-template-reference-variables)
      - [3. Available Signals and Methods](#3-available-signals-and-methods)
    - [Migration](#migration-12)
      - [Before (Custom Implementation)](#before-custom-implementation)
      - [After (Using New Directives)](#after-using-new-directives)
    - [Why?](#why-13)
    - [Migration](#migration-13)
  - [14. Configurable Error Display Mode in Control Wrapper](#14-configurable-error-display-mode-in-control-wrapper)
    - [What changed?](#what-changed-13)
    - [Why?](#why-14)
    - [Migration](#migration-14)
  - [15. Field Path Utilities (New)](#15-field-path-utilities-new)
    - [What changed?](#what-changed-14)
    - [Why?](#why-15)
    - [Migration](#migration-15)
  - [16. FormControlStateDirective: Build Your Own Custom Form Field](#16-formcontrolstatedirective-build-your-own-custom-form-field)
    - [What changed?](#what-changed-15)
    - [Why?](#why-16)
    - [How to use](#how-to-use)
      - [Building Custom Form Fields](#building-custom-form-fields)
  - [17. Error Display Modes Renamed and Now UpdateOn-Aware](#17-error-display-modes-renamed-and-now-updateon-aware)
    - [What changed?](#what-changed-16)
    - [Why?](#why-17)
    - [Migration](#migration-16)
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
    ngxVestForm
    [formValue]="formValue()"
    (formValueChange)="formValue.set($event)"
  >
    ...
  </form>
  ```
- **After:**
  ```html
  <form ngxVestForm [(formValue)]="formValue">...</form>
  ```
- If you use a signal store (e.g., NgRx SignalStore):
  ```html
  <form ngxVestForm [(formValue)]="store.formValue">...</form>
  ```
- No need to manually handle value change events or update your signal/store in the template.

### Migration steps

1. Replace `[formValue]="formValue()" (formValueChange)="formValue.set($event)"` with `[(formValue)]="formValue"` in your templates.
2. Remove any manual event handlers for form value changes in your component.
3. If using a store, bind the store's signal directly.

---

## 2. Unified `formState` Signal and Deprecation of Old API

### What changed?

- The new `formState` signal is now the recommended and unified way to access all form state in `ngx-vest-forms` (value, errors, warnings, root-level issues, validity, pending, etc.).
- The old signals (`errors`, `isValid`, `isInvalid`, `isPending`, `isDisabled`, `isIdle`) are **deprecated** and will be removed in a future release.
- Field-specific errors are now in `formState().errors`.
- Field-specific warnings are now in `formState().warnings`.
- Root-level issues (errors, warnings, or internal suite errors for form-wide validations) are now in `formState().root` which has the shape `{ errors?: string[]; warnings?: string[]; internalError?: string; } | null`.

### Why?

- To simplify the API, improve type safety, and provide a single source of truth for all form state, clearly distinguishing between field-specific and root-level issues.
- This change aligns with modern Angular and signals best practices, and makes it easier to reason about form state in your components and templates.

### Migration

- Replace all usages of the old signals with the new `formState` API.
- Update access to errors and warnings to use the new structure.
- If you were using `viewChild` or `contentChild` with the directive, ensure you are using the signal-based versions (`viewChild()`, `contentChild()`).

#### Comparison Table

| Old Pattern (Deprecated) | New Pattern (Recommended)                        |
| ------------------------ | ------------------------------------------------ |
| `vestForm.errors()`      | `vestForm.formState().errors` (field errors)     |
|                          | `vestForm.formState().warnings` (field warnings) |
|                          | `vestForm.formState().root` (root issues)        |
| `vestForm.isValid()`     | `vestForm.formState().valid`                     |
| `vestForm.isPending()`   | `vestForm.formState().pending`                   |
| `vestForm.isDisabled()`  | `vestForm.formState().disabled`                  |
| `vestForm.isIdle()`      | `vestForm.formState().idle`                      |

#### Example

```typescript
// Old
const valid = vestForm.isValid();
const fieldErrors = vestForm.errors(); // Previously mixed field and potentially root errors

// New
const formState = vestForm.formState();
const value = formState.value;
const valid = formState.valid;
const fieldErrors = formState.errors; // Only field-specific errors
const fieldWarnings = formState.warnings; // Field-specific warnings
const rootIssues = formState.root; // { errors?: [], warnings?: [], internalError?: string }
```

```html
<!-- Old -->
@if (vestForm.errors()?.fieldName as errors) {
<ul>
  @for (error of errors; track error) {
  <!-- ... -->
  }
</ul>
}

<!-- New for Field Errors -->
@if (vestForm.formState().errors?.fieldName; as fieldErrors) {
<ul>
  @for (error of fieldErrors; track error) {
  <!-- ... -->
  }
</ul>
}
<!-- New for Field Warnings -->
@if (vestForm.formState().warnings?.fieldName; as fieldWarnings) {
<ul>
  @for (warning of fieldWarnings; track warning) {
  <!-- ... -->
  }
</ul>
}

<!-- New for Root Errors -->
@if (vestForm.formState().root?.errors; as rootErrors) {
<div class="form-root-errors">
  <h4>Form Errors:</h4>
  <ul>
    @for (error of rootErrors; track error) {
    <li>{{ error }}</li>
    }
  </ul>
</div>
}
<!-- New for Root Warnings -->
@if (vestForm.formState().root?.warnings; as rootWarnings) {
<div class="form-root-warnings">
  <h4>Form Warnings:</h4>
  <ul>
    @for (warning of rootWarnings; track warning) {
    <li>{{ warning }}</li>
    }
  </ul>
</div>
}
<!-- New for Root Internal Error -->
@if (vestForm.formState().root?.internalError; as internalError) {
<div class="form-root-internal-error">
  <p>A system error occurred: {{ internalError }}</p>
</div>
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
  <div ngxControlWrapper errorDisplayMode="on-blur">
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

- The default value for the `[validateRootForm]` input on the `ngxVestForm` directive is now `true`.

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
- For detailed migration examples and comprehensive schema adapter usage, see [Schema Adapters Documentation](./schema-adapters.md).

#### Comparison Table

| Old Pattern (Deprecated)                         | New Pattern (Recommended)                                                |
| ------------------------------------------------ | ------------------------------------------------------------------------ |
| `<form ngxVestForm [formShape]="modelTemplate">` | `<form ngxVestForm [formSchema]="modelToStandardSchema(modelTemplate)">` |

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

- The `[formValue]` and `[formSchema]` inputs for the `ngxVestForm` directive are now explicitly documented as **optional**.

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

- To align the internal structure used by `FormDirective` with the expectations of `NgxControlWrapper`.
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

- The attribute selector for the control wrapper component has changed from `[ngx-control-wrapper]` to `[ngxControlWrapper]`.
- An element selector `ngx-control-wrapper` has been added.

### Why?

- The attribute selector was updated to follow Angular's standard camelCase convention for directive selectors.
- The element selector provides an alternative way to use the component, which can be clearer in some template structures.

### Migration

- Update your templates to use the new camelCase version: `[ngxControlWrapper]`.
- You can now optionally use the element selector `<ngx-control-wrapper>` instead of the attribute selector on a `div` or other container element.

---

## 12. Standalone Components and Modern Angular APIs

### What changed?

- The library now expects usage of Angular 16+ standalone components, signals, and modern control flow syntax (`@if`, `@for`).

### Why?

- To align with Angular's latest best practices and improve performance, maintainability, and developer experience.

### Migration

- Update your application to use standalone components and signals where appropriate. Avoid legacy NgModules and traditional observables for state management.

---

## 13. New Composition API: FormErrorDisplayDirective and FormControlStateDirective

### What changed?

- **NEW**: `FormControlStateDirective` - Provides raw form control state (errors, warnings, pending, etc.) without display opinions
- **NEW**: `FormErrorDisplayDirective` - Extends `FormControlStateDirective` with configurable error display behavior
- Both directives support Angular's `hostDirectives` composition pattern for building custom form components
- Template reference variables via `exportAs` for direct access in templates

### Why?

- Enables developers to build custom form field wrappers while leveraging the library's validation logic
- Embraces Angular's modern composition API over inheritance patterns
- Provides granular control over when and how validation messages are displayed
- Separates data concerns (FormControlStateDirective) from display concerns (FormErrorDisplayDirective)

### Usage Patterns

#### 1. Building Custom Form Components with hostDirectives

```typescript
@Component({
  selector: 'my-custom-field',
  template: `
    <label>{{ label }}</label>
    <input [name]="name" ngModel />

    @if (errorDisplay.shouldShowErrors()) {
      <div class="errors">
        @for (error of errorDisplay.errors(); track error) {
          <div class="error">{{ error }}</div>
        }
      </div>
    }

    @if (errorDisplay.isPending()) {
      <span class="spinner">Validating...</span>
    }
  `,
  hostDirectives: [FormErrorDisplayDirective], // Composition over inheritance
})
export class MyCustomFieldComponent {
  readonly errorDisplay = inject(FormErrorDisplayDirective);

  @Input() label!: string;
  @Input() name!: string;
}
```

#### 2. Direct Template Usage with Template Reference Variables

```html
<!-- Using FormErrorDisplayDirective directly -->
<div
  scFormErrorDisplay
  #display="formErrorDisplay"
  errorDisplayMode="on-blur-or-submit"
>
  <input type="email" name="email" ngModel />

  @if (display.shouldShowErrors()) {
  <div class="errors">
    @for (error of display.errors(); track error) {
    <div class="error">{{ error }}</div>
    }
  </div>
  } @if (display.warnings().length > 0) {
  <div class="warnings">
    @for (warning of display.warnings(); track warning) {
    <div class="warning">{{ warning }}</div>
    }
  </div>
  }
</div>

<!-- Using just FormControlStateDirective for raw data -->
<div ngxFormControlState #state="formControlState">
  <input type="text" name="username" ngModel />

  <!-- Custom display logic -->
  @if (state.controlState()?.isInvalid && state.errorMessages().length > 0) {
  <div class="custom-error-display">
    Custom validation feedback: {{ state.errorMessages()[0] }}
  </div>
  }
</div>
```

#### 3. Available Signals and Methods

**FormControlStateDirective provides:**

- `controlState()` - Angular form control state (touched, dirty, valid, etc.)
- `errorMessages()` - Array of error messages from Vest validation
- `warningMessages()` - Array of warning messages from Vest validation
- `hasPendingValidation()` - Boolean indicating async validation in progress
- `updateOn()` - The ngModelOptions.updateOn value ('change', 'blur', 'submit')

**FormErrorDisplayDirective adds:**

- `shouldShowErrors()` - Smart logic for when to display errors based on display mode
- `errors()` - Filtered error messages (hides during pending validation)
- `warnings()` - Filtered warning messages (hides during pending validation)
- `isPending()` - Simplified pending state check
- `formSubmitted()` - Boolean indicating if the form has been submitted
- `errorDisplayMode` input - Configure when errors show ('on-blur', 'on-submit', 'on-blur-or-submit')

### Migration

- **No breaking changes** - These are new additions that supplement existing functionality
- Replace custom form control state tracking with these standardized directives
- Use `hostDirectives` pattern for new custom form components
- Leverage template reference variables for simpler template access

#### Before (Custom Implementation)

```typescript
@Component({
  template: `
    <!-- Manual error handling -->
    @if (control?.invalid && (control?.touched || formSubmitted)) {
      <div>{{ getErrorMessage() }}</div>
    }
  `,
})
export class OldCustomField {
  @ViewChild(NgModel) control?: NgModel;
  formSubmitted = false;

  getErrorMessage() {
    // Custom error extraction logic
  }
}
```

#### After (Using New Directives)

```typescript
@Component({
  template: `
    <!-- Declarative error handling -->
    @if (errorDisplay.shouldShowErrors()) {
      <div>{{ errorDisplay.errors()[0] }}</div>
    }
  `,
  hostDirectives: [FormErrorDisplayDirective],
})
export class NewCustomField {
  readonly errorDisplay = inject(FormErrorDisplayDirective);
  // No manual state tracking needed!
}
```

---

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

- The `ngx-control-wrapper` component now supports a configurable error display mode, allowing you to control when errors are shown (on blur, on submit, or both).
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

- The new `FormControlStateDirective` (`ngxFormControlState`) is now available as a standalone directive.
- This directive provides a reactive signal (`controlState`) with the current state of the nearest `NgModel` or `NgModelGroup`.
- It is used internally by `ngxControlWrapper`, but you can apply it directly to build your own custom form field wrappers or advanced UI.

### Why?

- Enables advanced use cases and custom form field implementations without relying on the default `ngxControlWrapper`.
- Provides a clean, idiomatic Angular API for accessing control state (valid, errors, pending, etc.) as a signal.

### How to use

```html
<!-- Example: Custom form field using ngxFormControlState -->
<div ngxFormControlState #state="formControlState">
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
- Implement specialized validation behaviors not provided by the default `ngxControlWrapper`
- Add animations, tooltips, or other UI features to your form fields
- Create field types specialized for different data types (date pickers, number inputs, etc.)

- See the documentation in `./form-control-state-directive.md` for more details and advanced usage.

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
