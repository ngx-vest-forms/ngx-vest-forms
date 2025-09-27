# ngx-vest-forms Control Wrapper

The `NgxControlWrapper` (`<ngx-control-wrapper>` or `[ngxControlWrapper]`) is a utility component in `ngx-vest-forms` designed to simplify the display of validation errors and pending states for individual form controls. It acts as a dedicated container around your input fields, automatically handling error messages, ARIA attributes, and visual cues for validation status.

**Key Features:**

- **Automatic Error Display:** Shows validation errors from Vest suites without manual template logic.
- **Pending State Indicator:** Optionally displays a message or spinner during asynchronous validation.
- **Accessibility:** Adds appropriate ARIA attributes (`aria-describedby`, `aria-invalid`) to the input field.
- **Configurable Behavior:** Control when errors are displayed (on blur, on submit, or both) via the `errorDisplayMode` input or global configuration.
- **Standalone and Composable:** Can be used as a standalone component or composed into custom form field components using `hostDirectives`.

## Why Use Control Wrapper?

- **Reduced Boilerplate:** Eliminates repetitive `*ngIf` blocks for error messages in your templates.
- **Consistent UI:** Ensures a uniform look and feel for error messages and pending states across your application.
- **Improved Accessibility:** Automatically manages ARIA attributes, making your forms more accessible.
- **Simplified Logic:** Centralizes error display logic, making your component templates cleaner and easier to maintain.

## Installation and Usage

The `NgxControlWrapper` is available as a **secondary entry point** to keep the core library lean.

### 1. Import

```typescript
// Import from the control-wrapper secondary entry point
import { NgxControlWrapper } from 'ngx-vest-forms/control-wrapper';

@Component({
  imports: [
    // ... other Angular modules
    ngxVestForms, // Core directive
    NgxControlWrapper, // The wrapper component
  ],
  // ...
})
export class MyFormComponent {
  // ...
}
```

### 2. Template Usage

Wrap each form control (or a group of related controls like radio buttons) with `<ngx-control-wrapper>` or apply the `[ngxControlWrapper]` directive to a container element.

**As an Element:**

```html
<form ngxVestForm [vestSuite]="mySuite" [(formValue)]="model">
  <ngx-control-wrapper>
    <label for="username">Username:</label>
    <input id="username" name="username" ngModel />
    <!-- Errors for 'username' will be displayed here -->
  </ngx-control-wrapper>

  <ngx-control-wrapper errorDisplayMode="on-submit">
    <label for="email">Email:</label>
    <input id="email" name="email" type="email" ngModel />
    <!-- Errors for 'email' will show only after form submission -->
  </ngx-control-wrapper>

  <button type="submit">Submit</button>
</form>
```

**As an Attribute:**

```html
<form ngxVestForm [vestSuite]="mySuite" [(formValue)]="model">
  <div ngxControlWrapper>
    <label for="password">Password:</label>
    <input id="password" name="password" type="password" ngModel />
  </div>

  <button type="submit">Submit</button>
</form>
```

## Configuration

### `errorDisplayMode`

Controls when validation errors are displayed.

- **Type:** `'on-blur' | 'on-submit' | 'on-blur-or-submit'`
- **Default:** `'on-blur-or-submit'` (globally configurable)
- **Input:** `[errorDisplayMode]`

**Behavior:**

- `'on-blur'`: Errors appear when the control loses focus.
- `'on-submit'`: Errors appear only after the form has been submitted at least once.
- `'on-blur-or-submit'`: Errors appear either when the control loses focus OR after the form has been submitted.

**Important Interaction with `ngModelOptions.updateOn`:**

The `errorDisplayMode` respects the `updateOn` setting of the `NgModel` directive:

- If an `NgModel` has `[ngModelOptions]="{ updateOn: 'submit' }"`, its errors will **only** be displayed after a form submission, regardless of the `errorDisplayMode`.
- If `updateOn` is `'blur'` or `'change'` (default), the `errorDisplayMode` behaves as described above.

#### Interplay: `updateOn` vs `errorDisplayMode`

`updateOn` decides **when Angular updates control value & runs its validators**. `errorDisplayMode` decides **when we are allowed to reveal already‑computed errors**. They are intentionally orthogonal so you can, for example, validate on every change but show errors only after blur, or defer all validation to submit while still using blur/submission visual semantics consistently.

There is one UX gap in native Angular behavior: with `updateOn: 'change'`, if a required field is left empty, the user focuses it and then blurs without typing, no value change occurs → Angular does not re‑run validation → there are still no errors to display (even though UX expectations are that a required indicator should now appear). `ngx-vest-forms` bridges that gap with a one‑time, safe "first blur validation" trigger. It runs exactly once per control (unless `updateOn: 'submit'`) to prime Vest so the wrapper can show the appropriate error message. This improves accessibility by ensuring screen readers and keyboard users receive immediate, actionable feedback after leaving an empty required field.

##### Quick Matrix

| Angular `updateOn` | errorDisplayMode    | User action sequence               | When validation is (re)run\*                           | When errors become visible | Notes                                                   |
| ------------------ | ------------------- | ---------------------------------- | ------------------------------------------------------ | -------------------------- | ------------------------------------------------------- |
| `change` (default) | `on-blur`           | Focus → type → blur                | On each value change; plus first‑blur fallback if none | At blur (touched)          | Fallback covers "focus → blur without typing"           |
| `change`           | `on-submit`         | (Any) → submit                     | On each change; submit triggers form-level suite again | After first submit         | Pre-submit errors hidden even if already validated      |
| `change`           | `on-blur-or-submit` | Focus → (type?) → blur / OR submit | Changes + first‑blur fallback + submit                 | Blur OR submit             | Most forgiving default                                  |
| `blur`             | `on-blur`           | Focus → type → blur                | Only at blur (Angular)                                 | Same blur event            | Fallback not needed (Angular already validates on blur) |
| `blur`             | `on-submit`         | Focus/blur cycles → submit         | Each blur; submit reruns form-level if needed          | After first submit         | Blur validations cached but hidden until submit         |
| `blur`             | `on-blur-or-submit` | Focus → blur OR submit             | Each blur; submit as needed                            | Blur OR submit             | Similar to `on-blur` unless user never blurs field      |
| `submit`           | `on-blur`           | Focus/blur → submit                | Only at submit (Angular)                               | After submit (not blur)    | `updateOn: 'submit'` overrides blur visibility timing   |
| `submit`           | `on-submit`         | Submit                             | Only at submit                                         | After submit               | Simplest late feedback mode                             |
| `submit`           | `on-blur-or-submit` | Focus/blur → submit                | Only at submit                                         | After submit               | Blur has no effect pre-submit                           |

\*Validation run timing above refers to Vest suite executions orchestrated by `ngxVestForm` for the field; additional dependent validations (via `validationConfig`) may run after related fields settle.

##### Design Rationale

- Keeping a small set of display modes (`on-blur`, `on-submit`, `on-blur-or-submit`) avoids ambiguity and makes behavior predictable.
- `updateOn` continues to govern data + validity lifecycle; we do not override its core semantics, only fill the UX gap for the untouched-empty-blur case under `change`.
- The one-time first-blur trigger is idempotent, skips `updateOn: 'submit'`, and will not fire again after a genuine change.

##### Should there be an `on-change` error display mode?

We deliberately did **not** include an `on-change` (immediate) display mode because:

1. Accessibility & UX: Showing errors while a user is still typing increases cognitive load, especially for longer inputs (emails, passwords). Blur-based feedback is generally calmer and still quick.
2. Separation of concerns: You can still surface _live_ helper hints (e.g., password strength) via warnings or custom UI without promoting hard validation errors mid-entry.
3. Simplicity: Fewer modes reduce configuration mistakes and learning curve.

If you truly need immediate error surfacing you can: (a) read `vestForm.formState().errors` directly and render custom UI, or (b) create a thin directive extending `NgxFormErrorDisplayDirective` with a different predicate (dirty OR submitted). If community demand grows, a future `'on-change'` (or `'on-change-or-submit'`) mode can be added without breaking existing behavior.

> Accessibility Note: Errors are revealed only when users can meaningfully act on them. This file was generated with accessibility in mind, but please still audit with tooling (e.g., Accessibility Insights) and manual keyboard / screen reader testing.

### Global Configuration

You can set the default `errorDisplayMode` for all `NgxControlWrapper` instances in your application by providing the `NGX_ERROR_DISPLAY_MODE_DEFAULT` injection token.

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { NGX_ERROR_DISPLAY_MODE_DEFAULT } from 'ngx-vest-forms'; // Core library export

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    { provide: NGX_ERROR_DISPLAY_MODE_DEFAULT, useValue: 'on-blur' }, // Set default to 'on-blur'
  ],
};
```

This global default can still be overridden on a per-instance basis using the `[errorDisplayMode]` input.

## Customization

### Styling

The `NgxControlWrapper` renders error messages within a `div` with the class `ngx-control-errors`. You can style this class and its children to match your application's design.

**Example SCSS:**

```scss
.ngx-control-errors {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: red; // Or your theme's error color

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  li {
    // Style for individual error messages
  }
}

// Styling for pending state (if you implement a visual indicator)
.ngx-control-pending {
  // e.g., display a spinner or subtle loading animation
}
```

### Pending State

The `NgxControlWrapper` exposes a `isPending` signal that indicates if an asynchronous validation is in progress for the wrapped control. You can use this to show a loading indicator. The component itself does not render a default pending indicator; you would typically add this in your custom form field components or by extending the wrapper.

## Advanced Usage: Composition with Custom Form Fields

The `NgxControlWrapper` is built upon `NgxFormErrorDisplayDirective`, which itself uses `NgxFormControlStateDirective`. These directives can be composed into your own custom form field components using Angular's `hostDirectives` feature. This allows you to leverage the error display and state management logic of `ngx-vest-forms` while creating bespoke UI components.

Refer to the documentation for `NgxFormErrorDisplayDirective` and `NgxFormControlStateDirective` for more details on building custom form field components.

## Relationship to Core Directives

- **`ngxVestForm` (NgxFormDirective):** Manages the overall form state, validation suite execution, and communication with VestJS.
- **`NgModel` / `NgModelGroup`:** Angular directives that bind form controls to your data model.
- **`NgxFormControlStateDirective`:** Provides signals for the raw state of an `NgModel` or `NgModelGroup` (errors, warnings, pending, touched, etc.).
- **`NgxFormErrorDisplayDirective`:** Extends `NgxFormControlStateDirective` with logic for _when_ to display errors based on `errorDisplayMode` and form submission status.
- **`NgxControlWrapper`:** A presentational component that uses `NgxFormErrorDisplayDirective` (via `hostDirectives`) to display errors and manage ARIA attributes for a wrapped control. It provides the default HTML structure for error messages.

By separating these concerns, `ngx-vest-forms` offers flexibility:

- Use `NgxControlWrapper` for quick, standard error display.
- Use `NgxFormErrorDisplayDirective` or `NgxFormControlStateDirective` with `hostDirectives` to build custom form field components with full control over the markup and behavior, while still benefiting from the underlying state management and error display logic.

## Migration Notes

- **Upgrading from v1:** The error display logic has changed in v2. Use `<ngx-control-wrapper>` for automatic error and pending state display. See the [Migration Guide](../../../../docs/MIGRATION_GUIDE_V2.md).
- **Error Object Structure:** Errors are now arrays (`Record<string, string[]>`). Update your error display templates accordingly.
- **See Also:** [Migration Guide](../../../../docs/MIGRATION_GUIDE_V2.md), [Breaking Changes Overview](../../../../docs/BREAKING_CHANGES_PUBLIC_API.md)

## Common Pitfalls & Troubleshooting

- **Missing Wrapper:** If errors are not shown, ensure form fields are wrapped in `<ngx-control-wrapper>`.
- **Error Display Issues:** Update your templates to handle array-based errors.
- **Import Errors:** Import from `ngx-vest-forms/control-wrapper`, not the core package.
- **Styling Issues:** Use Tailwind or modern CSS for consistent error styling.

## Form Validation Directives

### NgxFormControlStateDirective (`ngxFormControlState`)

A directive that provides reactive signals for the state of Angular form controls and parsed Vest validation messages.

#### Key Features

- **Reactive State Signals:** Exposes `errors`, `pending`, `touched`, and `dirty` states as signals.
- **Vest Integration:** Parses and provides Vest validation messages reactively.
- **Touch and Dirty Management:** Automatically marks controls as touched or dirty based on user interaction.

#### Usage

Typically used internally by `NgxFormErrorDisplayDirective` and `NgxControlWrapper`. Not meant for direct use in templates.

### NgxFormErrorDisplayDirective (`ngxFormErrorDisplay`)

A directive that builds on `NgxFormControlStateDirective` to add display behavior for validation messages.

#### Additional Key Features

- **Automatic Error Display:** Shows validation errors from Vest suites without manual template logic.
- **Configurable Display Logic:** Control when errors are displayed (on blur, on submit, or both) via `errorDisplayMode`.
- **Accessibility:** Adds appropriate ARIA attributes to the input field.

#### How to Use

Automatically used by `NgxControlWrapper`. Typically, you would use `<ngx-control-wrapper>` in your templates, which internally uses this directive to display errors.
