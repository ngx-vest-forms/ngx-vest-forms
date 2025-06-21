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
  standalone: true,
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
