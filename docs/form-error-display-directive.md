# FormErrorDisplayDirective (`ngxFormErrorDisplay`)

A directive that extends `FormControlStateDirective` with built-in validation display behavior.

## Purpose

This directive handles **WHEN** to show validation messages based on configurable display modes. It builds on the data provided by `FormControlStateDirective` and adds logic for when validation messages should appear.

## Key Benefits

- Standardizes common validation display patterns like "show on touch" or "show after submit"
- Tracks form submission events automatically
- Prevents error/warning message flicker during pending validation
- Provides simple API for determining when errors should be visible

## Composition & hostDirectives

Both `FormControlStateDirective` and `FormErrorDisplayDirective` are designed to be used as `hostDirectives` in your own components or directives. This approach embraces Angular's composition API, allowing you to add form state and validation logic declaratively and without inheritance.

**Recommended:**
Use these as `hostDirectives` for maximum flexibility and composability in your custom form controls and wrappers.

```typescript
@Component({
  // ...
  hostDirectives: [FormErrorDisplayDirective], // or FormControlStateDirective
})
export class MyCustomFieldComponent { ... }
```

## Available Signals & APIs

| Name                 | Type       | Description                                         |
| -------------------- | ---------- | --------------------------------------------------- |
| `shouldShowErrors()` | `boolean`  | Whether errors should be displayed based on mode    |
| `errors()`           | `string[]` | Filtered error messages (empty during validation)   |
| `warnings()`         | `string[]` | Filtered warning messages (empty during validation) |
| `isPending()`        | `boolean`  | Whether validation is currently in progress         |
| `errorDisplayMode`   | `input()`  | Configure when errors should appear                 |
| `formSubmitted()`    | `boolean`  | Whether the parent form has been submitted          |

## Display Modes

The directive supports multiple modes for when to display errors:

| Mode                  | Description                                         |
| --------------------- | --------------------------------------------------- |
| `'on-blur'`           | Show errors only after a field is blurred (touched) |
| `'on-submit'`         | Show errors only after form submission              |
| `'on-blur-or-submit'` | Show errors if either condition is met (default)    |

**Warning:**
If the control's `ngModelOptions.updateOn` (or form-level `ngFormOptions.updateOn`) is set to `'submit'`, errors will only be shown after submit, regardless of the `errorDisplayMode` setting. When this mismatch is detected, a warning will be logged to the console in development mode to help you catch potential configuration issues.

**Note:**

- If the control's `ngModelOptions.updateOn` is `'submit'`, errors are only shown after submit, regardless of display mode.
- If `updateOn` is `'blur'` or `'change'`, display mode determines when errors appear as described above.

## When to Use

Choose this directive when:

- You want standardized error display behavior
- You need form submission awareness
- You want built-in filtering of messages during validation
- You're building components that respect user preferences for error visibility

## Basic Example

```html
<div ngxFormErrorDisplay #display="formErrorDisplay" errorDisplayMode="submit">
  <input name="username" ngModel />

  @if (display.isPending()) {
  <div class="spinner">Validating...</div>
  } @else if (display.shouldShowErrors()) {
  <div class="errors">
    @for (error of display.errors(); track error) {
    <div class="error">{{ error }}</div>
    }
  </div>
  }
</div>
```

## Global Configuration

You can configure the default error display mode for your entire application:

```typescript
import { provide } from '@angular/core';
import { CONTROL_WRAPPER_ERROR_DISPLAY } from 'ngx-vest-forms';

@Component({
  providers: [
    provide(CONTROL_WRAPPER_ERROR_DISPLAY, { useValue: 'on-submit' }),
  ],
})
export class AppComponent {}
```

## Relationship with FormControlStateDirective

- `FormControlStateDirective` provides the data (WHAT) - raw form state and parsed messages
- `FormErrorDisplayDirective` adds display behavior (WHEN) - timing and filtering of messages

The directive uses Angular's `hostDirectives` feature to compose functionality, so every `ngxFormErrorDisplay` automatically includes the functionality of `ngxFormControlState`.

## See Also

- [FormControlStateDirective](./form-control-state-directive.md) for accessing just the raw form state
- [NgxControlWrapper](../src/lib/components/control-wrapper/control-wrapper.component.ts) which uses this directive internally
