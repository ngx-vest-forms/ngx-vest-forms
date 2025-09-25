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

### `errorDisplayMode` & `warningDisplayMode` (Breaking Change)

`errorDisplayMode` now governs only blocking error visibility. Progressive guidance moved to a separate `warningDisplayMode` input.

| Input                | Purpose                            | Default               | Allowed Values                                                   |
| -------------------- | ---------------------------------- | --------------------- | ---------------------------------------------------------------- |
| `errorDisplayMode`   | When to show blocking errors       | `'on-blur-or-submit'` | `'on-blur' \| 'on-submit' \| 'on-blur-or-submit'`                |
| `warningDisplayMode` | When to show non-blocking warnings | `'on-change'`         | `'on-change' \| 'on-blur' \| 'on-submit' \| 'on-blur-or-submit'` |

#### Allowed Combinations (warning → error)

| warningDisplayMode  | Permitted errorDisplayMode(s)  | Reason                                                  |
| ------------------- | ------------------------------ | ------------------------------------------------------- |
| `on-change`         | any of error modes             | Warnings appear earliest                                |
| `on-blur`           | `on-blur`, `on-blur-or-submit` | Errors must not precede warnings                        |
| `on-blur-or-submit` | `on-submit`                    | Errors must not fire before first possible warning gate |
| `on-submit`         | (invalid)                      | Warnings can't appear later/equal than errors           |

Invalid combinations throw an error at runtime.

#### Behavior Summary

- Errors: blocking, role="alert", appear according to `errorDisplayMode` (never earlier than `updateOn` semantics; `updateOn: 'submit'` always gates).
- Warnings: non-blocking, role="status", follow `warningDisplayMode`; debounced only for `'on-change'`.

#### Interaction with `ngModelOptions.updateOn`

- `updateOn: 'submit'`: Errors always after submit. Warnings still follow `warningDisplayMode` (except impossible combos are blocked).
- `updateOn: 'blur'`: Error blur-timing aligns naturally; no extra bootstrap needed.
- `updateOn: 'change'`: First-blur bootstrap runs once so untouched-but-blurred required fields surface errors.

#### Interplay: `updateOn` vs `errorDisplayMode`

`updateOn` decides **when Angular updates control value & runs its validators**. `errorDisplayMode` decides **when we are allowed to reveal already‑computed errors**. They are intentionally orthogonal so you can, for example, validate on every change but show errors only after blur, or defer all validation to submit while still using blur/submission visual semantics consistently.

There is one UX gap in native Angular behavior: with `updateOn: 'change'`, if a required field is left empty, the user focuses it and then blurs without typing, no value change occurs → Angular does not re‑run validation → there are still no errors to display (even though UX expectations are that a required indicator should now appear). `ngx-vest-forms` bridges that gap with a one‑time, safe "first blur validation" trigger. It runs exactly once per control (unless `updateOn: 'submit'`) to prime Vest so the wrapper can show the appropriate error message. This improves accessibility by ensuring screen readers and keyboard users receive immediate, actionable feedback after leaving an empty required field.

##### Quick Matrix (Errors)

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

- Explicit separation clarifies mental model: progressive hints vs blocking feedback.
- Prevents illogical combos (e.g. warnings appearing after errors).
- Keeps accessibility semantics intact (alerts vs status regions).
- Debounced warnings reduce visual noise while preserving responsiveness.

##### On-Change Warnings Details

Progressive hints with minimal latency:

```ts
{ provide: NGX_ON_CHANGE_WARNING_DEBOUNCE, useValue: 220 } // tweak debounce
```

- Errors still require blur or submit → avoids flicker & premature failure states.
- Ideal for password strength, heuristic username hints, optional suggestions.

If you need hard errors immediately, you can still read `vestForm.formState().errors` directly or roll a custom directive.

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

The `NgxControlWrapper` supports complete theming via CSS custom properties and renders error messages within a `div` with the class `ngx-control-errors`.

#### CSS Custom Properties Theming (Recommended)

You can theme the control wrapper's validation styling using CSS custom properties:

```css
:root {
  /* Error colors (defaults to red-600/red-500) */
  --ngx-vest-forms-error-color: #dc2626;
  --ngx-vest-forms-error-color-light: #ef4444;
  --ngx-vest-forms-error-shadow: rgb(220 38 38 / 0.2);

  /* Warning colors (defaults to yellow-600/yellow-500) */
  --ngx-vest-forms-warning-color: #d97706;
  --ngx-vest-forms-warning-color-light: #f59e0b;
  --ngx-vest-forms-warning-shadow: rgb(217 119 6 / 0.3);
}

/* Theme specific forms */
.my-custom-form {
  --ngx-vest-forms-error-color: #991b1b;
  --ngx-vest-forms-warning-color: #92400e;
}

/* Dark theme support */
[data-theme='dark'] {
  --ngx-vest-forms-error-color: #f87171;
  --ngx-vest-forms-warning-color: #fbbf24;
}
```

The styling follows a CSS pseudo-class driven approach:

- **`:focus:invalid`** - Progressive warnings while user is actively typing (soft orange feedback)
- **`:invalid:not(:focus)`** - Final errors when user has finished editing (hard red feedback)

#### Error Message Styling

For error message display, you can style the container and message elements:

**Example SCSS:**

```scss
.ngx-control-errors {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: var(--ngx-vest-forms-error-color, #dc2626);

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

**📖 [Complete CSS Theming Guide](../../docs/CSS_CUSTOM_PROPERTIES_GUIDE.md)**

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
