# Form Validation Directives

ngx-vest-forms provides two complementary directives for handling form validation state:

1. **`NgxFormControlStateDirective` (`ngxFormControlState`)**: Provides the raw state and parsed validation messages
2. **`NgxFormErrorDisplayDirective` (`ngxFormErrorDisplay`)**: Adds display behavior on top of the state

This approach gives you flexibility to choose either the low-level state access or the higher-level display logic, depending on your needs.

## Composition & hostDirectives

Both `NgxFormControlStateDirective` and `NgxFormErrorDisplayDirective` are designed to be used as `hostDirectives` in your own components or directives. This approach embraces Angular's composition API, allowing you to add form state and validation logic declaratively and without inheritance.

**Recommended:**
Use these as `hostDirectives` for maximum flexibility and composability in your custom form controls and wrappers.

```typescript
@Component({
  // ...
  hostDirectives: [NgxFormErrorDisplayDirective], // or NgxFormControlStateDirective
})
export class MyCustomFieldComponent { ... }
```

## NgxFormControlStateDirective (`ngxFormControlState`)

A directive that provides reactive signals for the state of Angular form controls and parsed Vest validation messages.

### Purpose

This directive focuses exclusively on **WHAT** data is available from form controls, without opinions on **WHEN** or **HOW** to display it. It's like a data provider that simply gives you access to form state and validation messages.

### Key Features

- Connects to the nearest `NgModel` or `NgModelGroup` in content or host
- Parses Vest validation results into user-friendly arrays of messages
- Provides separate signals for different aspects of form state (more efficient reactivity)
- Maintains clear separation between raw form state and derived validation data

### Available Signals

| Signal                   | Type               | Description                                                    |
| ------------------------ | ------------------ | -------------------------------------------------------------- |
| `controlState()`         | `FormControlState` | Core Angular form control state (valid, touched, errors, etc.) |
| `errorMessages()`        | `string[]`         | User-friendly error messages extracted from Vest validation    |
| `warningMessages()`      | `string[]`         | Non-blocking warning messages from Vest validation             |
| `hasPendingValidation()` | `boolean`          | Whether async validation is in progress                        |

### When to Use

- When you need direct access to form control state via signals
- When you want to implement your own custom display logic
- When you want maximum control over how/when validation messages appear
- For building reusable form components with custom validation UX

### Basic Example

```html
<div ngxFormControlState #state="formControlState">
  <input name="email" ngModel />

  <!-- Custom error display logic -->
  @if (state.controlState().isDirty && state.errorMessages().length) {
  <ul class="error-list">
    @for (error of state.errorMessages(); track error) {
    <li>{{ error }}</li>
    }
  </ul>
  }
</div>
```

## NgxFormErrorDisplayDirective (`ngxFormErrorDisplay`)

A directive that builds on `NgxFormControlStateDirective` to add display behavior for validation messages.

### Purpose

This directive handles **WHEN** to show validation messages based on configurable display modes. It's a higher-level abstraction that combines data access with display logic.

### Key Features

- Tracks form submission events automatically
- Provides configurable display modes (touch, submit, touchOrSubmit)
- Filters validation messages during pending validation
- Offers convenient methods to determine when errors should be visible

### Display Modes

| Mode            | Description                                                    |
| --------------- | -------------------------------------------------------------- |
| `touch`         | Show errors only after field is touched                        |
| `submit`        | Show errors only after form submission                         |
| `touchOrSubmit` | Show errors if field is touched OR form is submitted (default) |

### When to Use

- When you want standardized error display behavior
- When you need built-in form submission tracking
- When building components that should respect user error display preferences
- For implementing consistent validation UX across an application

### Basic Example

```html
<div ngxFormErrorDisplay #display="formErrorDisplay" errorDisplayMode="submit">
  <input name="username" ngModel />

  <!-- Errors show only after form submission -->
  @if (display.shouldShowErrors()) {
  <div class="errors">
    @for (error of display.errors(); track error) {
    <div class="error">{{ error }}</div>
    }
  </div>
  }
</div>
```

## Choosing Between the Directives

- Use `NgxFormControlStateDirective` when you need just the raw data and want complete control
- Use `NgxFormErrorDisplayDirective` when you want built-in display behavior with configurable modes

For most common scenarios, `NgxFormErrorDisplayDirective` provides a more convenient API that handles common validation display patterns for you. For advanced or custom scenarios, you might prefer the lower-level `NgxFormControlStateDirective`.
