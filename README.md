<!-- prettier-ignore -->
<div align="center">

# ngx-vest-forms

A lightweight, type-safe adapter between Angular template-driven forms and [Vest.js](https://vestjs.dev) validation. Build complex forms with unidirectional data flow, sophisticated async validations, and minimal boilerplate.

[![npm version](https://img.shields.io/npm/v/ngx-vest-forms.svg?style=flat-square)](https://www.npmjs.com/package/ngx-vest-forms)
[![Build Status](https://img.shields.io/github/actions/workflow/status/ngx-vest-forms/ngx-vest-forms/cd.yml?branch=master&style=flat-square&label=Build)](https://github.com/ngx-vest-forms/ngx-vest-forms/actions/workflows/cd.yml)
[![Angular](<https://img.shields.io/badge/Angular-19+%20(min)%20%E2%80%94%2020%20recommended-dd0031?style=flat-square&logo=angular>)](https://angular.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

⭐ If you like this project, star it on GitHub — it helps a lot!

[Quick Start](#installation--quick-start) • [Docs](#documentation) • [Key Features](#key-features) • [Migration](#migration) • [FAQ](#faq) • [Resources](#resources)

</div>

> **New Maintainer**:
>
> I'm [the-ult](https://bsky.app/profile/the-ult.bsky.social), now maintaining this project as Brecht Billiet has moved on to other priorities. Huge thanks to Brecht for creating this amazing library and his foundational work on Angular forms!

## Why ngx-vest-forms?

- Unidirectional state with Angular signals
- Type-safe template-driven forms with runtime shape validation (dev only)
- Powerful Vest.js validations (sync/async, conditional, composable)
- Minimal boilerplate: controls and validation wiring are automatic

See the full guides under [Documentation](#documentation).

## Installation & Quick Start

### Prerequisites

- **Angular**: >=19.0.0 minimum, 20.x recommended (all used APIs stable)
- **Vest.js**: >=5.4.6 (Validation engine)
- **TypeScript**: >=5.8.0 (Modern Angular features)
- **Node.js**: >=20 (Maintenance release)

### Installation

```bash
npm install ngx-vest-forms
```

> **v.2.0.0 NOTE:**
>
> You must call `only()` **unconditionally** in Vest suites.
>
> ```ts
> // ✅ Correct
> only(field); // only(undefined) safely runs all tests
> ```
>
> Why: Conditional `only()` breaks Vest's change detection mechanism and causes timing issues with `omitWhen` + `validationConfig` in ngx-vest-forms.
> See the [Migration Guide](./docs/migration/MIGRATION-v1.x-to-v2.0.0.md#1-unconditional-only-pattern-required-critical).
>
> Selector prefix: use `ngx-` (recommended). The legacy `sc-` works in v2.x but is deprecated and will be removed in v3.

### Quick Start

Start simple (with validations):

```ts
import { Component, signal } from '@angular/core';
import { NgxVestForms, NgxDeepPartial, NgxVestSuite } from 'ngx-vest-forms';
import { staticSuite, only, test, enforce } from 'vest';

type MyFormModel = NgxDeepPartial<{ email: string; name: string }>;

// Minimal validation suite (always call only(field) unconditionally)
const suite: NgxVestSuite<MyFormModel> = staticSuite((model, field?) => {
  only(field);
  test('email', 'Email is required', () => {
    enforce(model.email).isNotBlank();
  });
});

@Component({
  imports: [NgxVestForms],
  template: `
    <form ngxVestForm [suite]="suite" (formValueChange)="formValue.set($event)">
      <ngx-control-wrapper>
        <label for="email">Email</label>
        <input id="email" name="email" [ngModel]="formValue().email" />
        <!-- Errors display automatically below input -->
      </ngx-control-wrapper>

      <ngx-control-wrapper>
        <label for="name">Name</label>
        <input id="name" name="name" [ngModel]="formValue().name" />
      </ngx-control-wrapper>

      <button type="submit">Submit</button>
    </form>
  `,
})
export class MyComponent {
  protected readonly formValue = signal<MyFormModel>({});
  protected readonly suite = suite;
}
```

Notes.

- Use `[ngModel]` (not `[(ngModel)]`) for unidirectional data flow
- The `?` operator is required because template-driven forms build values incrementally (`NgxDeepPartial`)
- The `name` attribute MUST exactly match the property path used in `[ngModel]` — see [Field Paths](./docs/FIELD-PATHS.md)

That's all you need. The directive automatically creates controls, wires validation, and manages state.

## Key Features

- **Unidirectional state with signals** — Models are `NgxDeepPartial<T>` so values build up incrementally
- **Type-safe with runtime shape validation** — Automatic control creation and validation wiring (dev mode checks)
- **Vest.js validations** — Sync/async, conditional, composable patterns with `only(field)` optimization
- **Error display modes** — Control when errors show: `on-blur`, `on-submit`, `on-blur-or-submit` (default), `on-dirty`, or `always`
- **Warning display modes** — Control when warnings show: `on-touch`, `on-validated-or-touch` (default), `on-dirty`, or `always`
- **Form state tracking** — Access touched, dirty, valid/invalid states for individual fields or entire form
- **Error display helpers** — `ngx-control-wrapper` component (recommended) plus directive building blocks for custom wrappers:
  - `ngx-form-group-wrapper` component (recommended for `ngModelGroup` containers)
  - `FormErrorDisplayDirective` (state + display policy)
  - `FormErrorControlDirective` (adds ARIA wiring + stable region IDs)
- **Cross-field dependencies** — `validationConfig` for field-to-field triggers, `ROOT_FORM` for form-level rules
- **Utilities** — Field paths, field clearing, validation config builder

### Error & Warning Display Modes

Control when validation errors and warnings are shown to users with multiple built-in modes:

#### Error Display Modes

```typescript
// Global configuration via DI token
import { NGX_ERROR_DISPLAY_MODE_TOKEN } from 'ngx-vest-forms';

providers: [
  { provide: NGX_ERROR_DISPLAY_MODE_TOKEN, useValue: 'on-dirty' }
]

// Recommended: Use ngx-control-wrapper component
<ngx-control-wrapper [errorDisplayMode]="'on-blur'">
  <input name="email" [ngModel]="formValue().email" />
</ngx-control-wrapper>
```

| Mode | Behavior |
|------|----------|
| `'on-blur-or-submit'` | Show after blur OR form submit (default) |
| `'on-blur'` | Show only after blur/touch |
| `'on-submit'` | Show only after form submission |
| `'on-dirty'` | Show as soon as value changes (or after blur/submit) |
| `'always'` | Show immediately, even on pristine fields |

#### Warning Display Modes

```typescript
// Global configuration via DI token
import { NGX_WARNING_DISPLAY_MODE_TOKEN } from 'ngx-vest-forms';

providers: [
  { provide: NGX_WARNING_DISPLAY_MODE_TOKEN, useValue: 'always' }
]

// Per-instance configuration
<ngx-control-wrapper [warningDisplayMode]="'on-dirty'">
  <input name="username" [ngModel]="formValue().username" />
</ngx-control-wrapper>
```

| Mode | Behavior |
|------|----------|
| `'on-validated-or-touch'` | Show after validation runs or touch (default) |
| `'on-touch'` | Show only after blur/touch |
| `'on-dirty'` | Show as soon as value changes (or after blur/submit) |
| `'always'` | Show immediately, even on pristine fields |

#### Group-Safe Mode Example

```html
// Group-safe mode (use this on an ngModelGroup container)
<ngx-form-group-wrapper ngModelGroup="address">
  <ngx-control-wrapper>
    <label for="street">Street</label>
    <input id="street" name="street" [ngModel]="formValue().address?.street" />
  </ngx-control-wrapper>

  <ngx-control-wrapper>
    <label for="city">City</label>
    <input id="city" name="city" [ngModel]="formValue().address?.city" />
  </ngx-control-wrapper>
</ngx-form-group-wrapper>
```

#### ARIA association (advanced)

`<ngx-control-wrapper>` can optionally apply `aria-describedby` / `aria-invalid` to **descendant** controls.
This is controlled by `ariaAssociationMode`:

- `"all-controls"` (default) — stamps all descendant `input/select/textarea`
- `"single-control"` — stamps only if exactly one control exists (useful for input + extra buttons)
- `"none"` — never mutates descendant controls (group-safe / manual wiring)

For `ngModelGroup` containers, prefer using `<ngx-form-group-wrapper>` (group-safe by default).

📖 See also:

- [Accessibility Guide](./docs/ACCESSIBILITY.md)
- [`ControlWrapperComponent` docs](./projects/ngx-vest-forms/src/lib/components/control-wrapper/README.md)

> **Styling note**: `ngx-control-wrapper` uses Tailwind CSS utility classes for default styling.
> If your project doesn't use Tailwind, see the [component docs](./projects/ngx-vest-forms/src/lib/components/control-wrapper/README.md#styling-dependency-tailwind-css) for alternatives.

📖 **[Complete Guide: Custom Control Wrappers](./docs/CUSTOM-CONTROL-WRAPPERS.md)**

### Form State

Access complete form and field state through the `FormErrorDisplayDirective` or `FormControlStateDirective`:

```typescript
@Component({
  template: `
    <ngx-control-wrapper #wrapper="ngxErrorDisplay">
      <input name="email" [ngModel]="formValue().email" />

      @if (wrapper.isTouched()) {
        <span>Field was touched</span>
      }
      @if (wrapper.isPending()) {
        <span>Validating...</span>
      }
    </ngx-control-wrapper>
  `
})
```

**Available state signals:**

- `isTouched()` / `isDirty()` — User interaction state
- `isValid()` / `isInvalid()` — Validation state
- `isPending()` — Async validation in progress
- `errorMessages()` / `warningMessages()` — Current validation messages
- `shouldShowErrors()` / `shouldShowWarnings()` — Computed based on display mode and state

**Warnings behavior:**

- Warnings are **non-blocking** and do not make a field invalid.
- Warnings are stored separately from `control.errors` and are cleared on `resetForm()`.
- Warnings may appear after `validationConfig` triggers validation, even if the field was not touched yet.
- Use `NGX_WARNING_DISPLAY_MODE_TOKEN` to control when warnings display (see [Warning Display Modes](#warning-display-modes)).

**Tip**: For async validations, use `createDebouncedPendingState()` to prevent "Validating..." messages from flashing when validation completes quickly (< 200ms).

📖 **[Complete Guide: Custom Control Wrappers](./docs/CUSTOM-CONTROL-WRAPPERS.md)**

## Advanced Features

### Validation Config

Automatically re-validate dependent fields when another field changes. Essential when using Vest.js's `omitWhen`/`skipWhen` for conditional validations.

**When to use**: Password confirmation, conditional required fields, or any field that depends on another field's value.

```typescript
protected readonly validationConfig = {
  'password': ['confirmPassword'],  // When password changes, re-validate confirmPassword
  'age': ['emergencyContact']       // When age changes, re-validate emergencyContact
};
```

**Important**: `validationConfig` only triggers re-validation—validation logic is always defined in your Vest suite.

📖 **[Complete Guide: ValidationConfig vs Root-Form](./docs/VALIDATION-CONFIG-VS-ROOT-FORM.md)**

### Root-Form Validation

Form-level validation rules that don't belong to any specific field (e.g., "at least one contact method required").

**When to use**: Business rules that evaluate multiple fields but errors should appear at form level, not on individual fields.

```typescript
import { ROOT_FORM } from 'ngx-vest-forms';

// In your Vest suite
test(ROOT_FORM, 'At least one contact method is required', () => {
  enforce(model.email || model.phone).isTruthy();
});
```

```html
<!-- In template -->
<form ngxVestForm ngxValidateRootForm [suite]="suite">
  <!-- Show form-level errors -->
  <div *ngIf="vestForm.errors?.rootForm">{{ vestForm.errors.rootForm }}</div>
</form>
```

📖 **[Complete Guide: ValidationConfig vs Root-Form](./docs/VALIDATION-CONFIG-VS-ROOT-FORM.md)**

### Dynamic Form Structure

Manually trigger validation when form structure changes between **input fields and non-input content** (like `<p>` tags) without value changes.

**When to use**: When switching from form controls to informational text/paragraphs where no control values change.

**NOT needed when**: Switching between different input fields (value changes trigger validation automatically).

**IMPORTANT**: `triggerFormValidation()` only re-runs validation logic—it does NOT mark fields as touched or show errors.

> **Note on form submission**: With the default `on-blur-or-submit` error display mode, errors are shown automatically when you submit via `(ngSubmit)`. The form automatically calls `markAllAsTouched()` internally. You only need to call `markAllAsTouched()` manually for special cases like multiple forms with one submit button.

```typescript
// Structure change: Re-run validation
@if (type() === 'typeA') {
  <input name="fieldA" [ngModel]="formValue().fieldA" />
} @else {
  <p>No input required</p>  // ← No form control, needs triggerFormValidation()
}

onTypeChange(newType: string) {
  this.formValue.update(v => ({ ...v, type: newType }));
  this.vestForm.triggerFormValidation();  // Re-runs validation, doesn't show errors
}

// Standard form submission - NO manual call needed!
// Errors shown automatically via (ngSubmit) with default on-blur-or-submit mode
<form ngxVestForm (ngSubmit)="save()">
  <!-- ... -->
  <button type="submit">Submit</button>
</form>

// Multiple forms with one button - NEED manual markAllAsTouched()
submitBoth() {
  this.form1().markAllAsTouched();
  this.form2().markAllAsTouched();
  if (this.form1().valid && this.form2().valid) {
    // Submit logic
  }
}
```

📖 **[Complete Guide: Structure Change Detection](./docs/STRUCTURE_CHANGE_DETECTION.md)**

### Shape Validation (Development Mode)

In development mode, ngx-vest-forms validates that your form's structure matches your TypeScript model, catching common mistakes early:

```typescript
// Your model
type MyFormModel = NgxDeepPartial<{
  email: string;
  address: { street: string; city: string };
}>;

// Define shape for runtime validation
const shape: NgxDeepRequired<MyFormModel> = {
  email: '',
  address: { street: '', city: '' },
};
```

```html
<form ngxVestForm [suite]="suite" [formShape]="shape">
  <!-- ✅ Correct: matches shape -->
  <input name="email" [ngModel]="formValue().email" />
  <input name="address.street" [ngModel]="formValue().address?.street" />

  <!-- ❌ Error in dev mode: typo detected -->
  <input name="emial" [ngModel]="formValue().email" />

  <!-- ❌ Error in dev mode: path doesn't exist in shape -->
  <input name="address.zipcode" [ngModel]="formValue().address?.zipcode" />
</form>
```

**Benefits:**

- Catch typos in `name` attributes immediately during development
- Ensure template structure matches TypeScript model
- Zero runtime cost in production (checks disabled automatically)
- Works with nested objects and arrays

**Important**: Shape validation only runs in development mode (`isDevMode()` returns `true`). Production builds have zero overhead.

📖 **[Complete Guide: Field Paths](./docs/FIELD-PATHS.md)**

## Documentation

### Getting Started

- **[Complete Example](./docs/COMPLETE-EXAMPLE.md)** - Step-by-step walkthrough from basic form to advanced patterns
- **[Composable Validations](./docs/COMPOSABLE-VALIDATIONS.md)** - Break validation logic into reusable, testable functions

### Advanced Patterns

- **[ValidationConfig vs Root-Form](./docs/VALIDATION-CONFIG-VS-ROOT-FORM.md)** - Cross-field dependencies and form-level rules
- **[Field Path Types](./docs/FIELD-PATHS.md)** - Type-safe dot-notation paths for nested properties
- **[Structure Change Detection](./docs/STRUCTURE_CHANGE_DETECTION.md)** - Handle dynamic form structure updates
- **[Field Clearing Utilities](./docs/FIELD-CLEARING-UTILITIES.md)** - Type-safe utilities for clearing nested form values

### UI & Integration

- **[Child Components](./docs/CHILD-COMPONENTS.md)** - Split large forms into smaller, maintainable components
- **[Custom Control Wrappers](./docs/CUSTOM-CONTROL-WRAPPERS.md)** - Build consistent error display patterns
- **[API Tokens](./docs/API-TOKENS.md)** - Configure error display modes and other global settings

### Reference

- **[Utilities README](./projects/ngx-vest-forms/src/lib/utils/README.md)** - Canonical reference for all utility functions

### Examples

- **[Examples Project](./projects/examples)** - Working code examples with business hours forms, purchase forms, and validation config demos
  - Run locally: `npm install && npm start`
  - Includes smart components, UI components, and complete validation patterns

## Migration

- v1.x → v2.0.0: **[Migration Guide](./docs/migration/MIGRATION-v1.x-to-v2.0.0.md)**
- Selector prefixes: **[Dual Selector Support](./docs/DUAL-SELECTOR-SUPPORT.md)**

Browser support follows Angular 19+ targets (no `structuredClone` polyfill required).

## FAQ

### Do I need validations to use ngx-vest-forms?

No—but you’ll almost always want them. Common cases to start without a suite:

- Prototyping UI while deferring rules
- Gradual migration: adopt unidirectional state and type-safe models first
- Server-driven validation: display backend errors while you add a client suite later

You can add a Vest suite at any time by binding `[suite]` on the form.

## Resources

### Documentation & Tutorials

- **[Angular Official Documentation](https://angular.dev/guide/forms)** - Template-driven forms guide
- **[Vest.js Documentation](https://vestjs.dev)** - Validation framework used by ngx-vest-forms
- **[Live Examples Repository](https://github.com/ngx-vest-forms/ngx-vest-forms/tree/master/projects/examples)** - Complex form examples and patterns

### Running Examples Locally

```bash
npm install
npm start
```

### Learning Resources

**[Complex Angular Template-Driven Forms Course](https://www.simplified.courses/complex-angular-template-driven-forms)** - Master advanced form patterns and become a form expert.

### Founding Articles by Brecht Billiet

This library was originally created by [Brecht Billiet](https://twitter.com/brechtbilliet). Here are his foundational blog posts that inspired and guided the development:

- **[Introducing ngx-vest-forms](https://blog.simplified.courses/introducing-ngx-vest-forms/)** - The original introduction and motivation
- **[Making Angular Template-Driven Forms Type-Safe](https://blog.simplified.courses/making-angular-template-driven-forms-typesafe/)** - Deep dive into type safety
- **[Asynchronous Form Validators in Angular with Vest](https://blog.simplified.courses/asynchronous-form-validators-in-angular-with-vest/)** - Advanced async validation patterns
- **[Template-Driven Forms with Form Arrays](https://blog.simplified.courses/template-driven-forms-with-form-arrays/)** - Dynamic form arrays implementation

## Developer Resources

### Comprehensive Instruction Files

This project includes detailed instruction files designed to help developers master ngx-vest-forms and Vest.js patterns:

- **[`.github/instructions/ngx-vest-forms.instructions.md`](.github/instructions/ngx-vest-forms.instructions.md)** - Complete guide for using ngx-vest-forms library
- **[`.github/instructions/vest.instructions.md`](.github/instructions/vest.instructions.md)** - Comprehensive Vest.js validation patterns and best practices
- **[`.github/copilot-instructions.md`](.github/copilot-instructions.md)** - Main GitHub Copilot instructions for this workspace

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
