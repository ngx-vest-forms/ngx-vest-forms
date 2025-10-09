# @ngx-vest-forms/core

Framework-agnostic validation core for ngx-vest-forms V2. Built on Vest.js with Angular Signals for reactive state management.

## Features

- 🚀 **Vest-First Architecture** - Single source of truth for validation state
- ⚡ **Framework Agnostic** - Core validation logic works without Angular dependencies
- 🎯 **Enhanced Field Signals API** - Automatic generation of field accessors via Proxy
- 📊 **Reactive State** - Built with Angular Signals for optimal performance
- 🎨 **Configurable Error Strategies** - Control when and how errors are displayed
- 🌳 **Tree Shakeable** - Only include what you use (~3KB gzipped)

## Installation

```bash
npm install ngx-vest-forms-core vest
```

## Quick Start

```typescript
import { createVestForm, staticSafeSuite } from 'ngx-vest-forms/core';
import { test, enforce } from 'vest';

// Define validation suite (automatic only(field) guard)
const userSuite = staticSafeSuite((data = {}) => {
  test('email', 'Email is required', () => {
    enforce(data.email).isNotEmpty();
  });

  test('email', 'Invalid email format', () => {
    enforce(data.email).isEmail();
  });
});

// Create form instance
const form = createVestForm(userSuite, { email: '' });

// Enhanced Field Signals API - automatic generation
form.email(); // Signal<string> - field value
form.emailValid(); // Signal<boolean> - field validity
form.emailValidation(); // Signal<{ errors: string[], warnings: string[] }> - structured errors
form.emailTouched(); // Signal<boolean> - field touched state
form.setEmail(); // (value: string | Event) => void - field setter
form.resetEmail(); // () => void - reset field to initial value

// Alternative explicit API
const emailField = form.field('email');
emailField.value(); // Signal<string>
emailField.markAsTouched(); // Mark as touched
emailField.set('user@example.com');
```

## Angular Component Usage

```typescript
@Component({
  selector: 'user-form',
  template: `
    <form>
      <input
        [value]="form.email()"
        (input)="form.setEmail($event)"
        placeholder="Email"
      />

      @if (form.emailShowErrors()) {
        <div class="error">
          {{ form.emailErrors()[0] }}
        </div>
      }

      <button (click)="handleSubmit()" [disabled]="!form.valid()">
        Submit
      </button>
    </form>
  `,
})
export class UserFormComponent {
  form = createVestForm(userSuite, { email: '' });

  async handleSubmit() {
    try {
      const validData = await this.form.submit();
      console.log('Valid data:', validData);
    } catch (error) {
      console.log('Validation failed');
    }
  }
}
```

## Error Display Strategies

Control when validation errors are shown to users:

```typescript
const form = createVestForm(
  userSuite,
  { email: '' },
  {
    errorStrategy: 'on-touch', // 'immediate' | 'on-touch' | 'on-submit' | 'manual'
  },
);
```

### Available Strategies

- **`immediate`** - Show errors as user types (real-time feedback)
- **`on-touch`** - Show errors after field loses focus **or form is submitted** (default, balanced UX)
- **`on-submit`** - Show errors only after form submission (minimal interruption)
- **`manual`** - Developer controls error display entirely

### Behavior Matrix

Understanding when errors appear for each strategy:

| Scenario                                          | immediate | on-touch | on-submit | manual |
| ------------------------------------------------- | --------- | -------- | --------- | ------ |
| Field has errors, not touched, form not submitted | ✅        | ❌       | ❌        | ❌     |
| Field has errors, touched, form not submitted     | ✅        | ✅       | ❌        | ❌     |
| Field has errors, **not touched**, form submitted | ✅        | ✅       | ✅        | ❌     |
| Field has errors, touched, form submitted         | ✅        | ✅       | ✅        | ❌     |
| Field is valid (no errors)                        | ❌        | ❌       | ❌        | ❌     |

> **💡 Important**: The `on-touch` strategy (default) shows errors for **untouched fields** after form submission. This ensures all validation errors are visible when users click Submit, following accessibility best practices (submit buttons should NOT be disabled).

## Configuration Options

```typescript
interface VestFormOptions {
  errorStrategy?: ErrorDisplayStrategy;
  enhancedFieldSignals?: boolean; // Enable/disable proxy API (default: true)
  includeFields?: string[]; // Fields to include in enhanced API
  excludeFields?: string[]; // Fields to exclude from enhanced API
  schema?: SchemaAdapter<any>; // Optional schema adapter
  debounceMs?: number; // Validation debounce time
}
```

## Dot-Path Support

Access nested object properties using dot notation:

```typescript
const form = createVestForm(suite, {
  user: {
    profile: {
      name: '',
      email: '',
    },
  },
});

// Access nested fields
form.field('user.profile.name').value();
form.field('user.profile.email').set('user@example.com');

// Enhanced API (if field names are known at compile time)
// Note: Nested field enhanced API requires TypeScript template literal types
```

## Performance Features

- **Lazy Signal Creation** - Fields created only when accessed
- **Caching** - Field instances reused across accesses
- **Vest EAGER Mode** - Stops validation after first error per field
- **Tree Shaking** - Unused utilities automatically excluded

## Framework Compatibility

While built for Angular, the core validation logic is framework-agnostic:

```typescript
// Works in any JavaScript environment
import { createVestForm } from 'ngx-vest-forms/core';

const form = createVestForm(suite, { email: '' });

// Use with React, Vue, Svelte, vanilla JS, etc.
form.validate('email');
console.log(form.result().getErrors('email'));
```

## TypeScript Support

Full TypeScript support with strict typing:

```typescript
interface UserModel {
  email: string;
  password: string;
}

const form = createVestForm<UserModel>(suite, { email: '', password: '' });

// TypeScript knows these exist and their types
form.email(); // Signal<string>
form.setEmail(''); // (value: string | Event) => void
```

## API Reference

### `createVestForm<TModel>(suite, initialModel, options?)`

Creates a new VestForm instance.

**Parameters:**

- `suite` - Validation suite (prefer `staticSafeSuite` or `createSafeSuite` from this package)
- `initialModel` - Initial form data (object or signal)
- `options?` - Configuration options

**Returns:** `EnhancedVestForm<TModel>`

### Form Methods

- `form.field(path)` - Get field accessor for path
- `form.validate(path?)` - Run validation (specific field or entire form)
- `form.submit()` - Submit form (validates first, returns Promise)
- `form.reset()` - Reset form to initial state
- `form.dispose()` - Optional teardown for `createSafeSuite` forms (cancels pending async validators, clears state)

### Form Properties

- `form.model` - WritableSignal with form data
- `form.valid` - Signal indicating if form is valid
- `form.pending` - Signal indicating if async validation is running
- `form.errors` - Signal with all form errors
- `form.submitting` - Signal indicating if form is being submitted

## Styling NgxFormErrorComponent

The `NgxFormErrorComponent` (included in this package) provides extensive customization through CSS custom properties. All properties are prefixed with `--ngx-vest-forms-*` to avoid naming conflicts.

### Default Appearance

By default, the error component displays text-only messages with no background, border, or padding:

```css
/* Default values - minimal styling */
:root {
  --ngx-vest-forms-error-color: #dc2626; /* Red-600 */
  --ngx-vest-forms-warning-color: #f59e0b; /* Amber-500 */
  --ngx-vest-forms-error-bg: transparent;
  --ngx-vest-forms-error-border: transparent;
  --ngx-vest-forms-warning-bg: transparent;
  --ngx-vest-forms-warning-border: transparent;
  --ngx-vest-forms-border-width: 0px;
  --ngx-vest-forms-border-radius: 0px;
  --ngx-vest-forms-padding: 0px;
}
```

### CSS Custom Properties Reference

| Property                          | Default       | Description                        |
| --------------------------------- | ------------- | ---------------------------------- |
| **Colors**                        |               |                                    |
| `--ngx-vest-forms-error-color`    | `#dc2626`     | Error text color                   |
| `--ngx-vest-forms-error-bg`       | `transparent` | Error background color             |
| `--ngx-vest-forms-error-border`   | `transparent` | Error border color                 |
| `--ngx-vest-forms-warning-color`  | `#f59e0b`     | Warning text color                 |
| `--ngx-vest-forms-warning-bg`     | `transparent` | Warning background color           |
| `--ngx-vest-forms-warning-border` | `transparent` | Warning border color               |
| **Spacing**                       |               |                                    |
| `--ngx-vest-forms-spacing`        | `0.375rem`    | Margin-top of error container      |
| `--ngx-vest-forms-gap`            | `0.25rem`     | Gap between multiple messages      |
| **Typography**                    |               |                                    |
| `--ngx-vest-forms-font-size`      | `0.875rem`    | Font size (14px)                   |
| `--ngx-vest-forms-line-height`    | `1.25`        | Line height for readability        |
| **Border & Padding**              |               |                                    |
| `--ngx-vest-forms-border-width`   | `0px`         | Border width (0 = no border)       |
| `--ngx-vest-forms-border-radius`  | `0px`         | Border radius (0 = square corners) |
| `--ngx-vest-forms-padding`        | `0px`         | Internal padding (0 = no padding)  |

### Styling Examples

#### Example 1: Minimal (Text Only)

The default style - just colored text:

```css
/* No customization needed - this is the default */
```

**Result:** Simple red/amber text below inputs with no background or borders.

#### Example 2: Outlined Style

Add borders and padding for more prominent errors:

```css
:root {
  --ngx-vest-forms-error-border: #fca5a5; /* Red-300 */
  --ngx-vest-forms-warning-border: #fcd34d; /* Amber-300 */
  --ngx-vest-forms-border-width: 1px;
  --ngx-vest-forms-border-radius: 0.375rem; /* 6px */
  --ngx-vest-forms-padding: 0.75rem; /* 12px */
}
```

#### Example 3: Filled Style

Use backgrounds for high visibility:

```css
:root {
  --ngx-vest-forms-error-color: #991b1b; /* Red-800 */
  --ngx-vest-forms-error-bg: #fef2f2; /* Red-50 */
  --ngx-vest-forms-error-border: #fca5a5; /* Red-300 */
  --ngx-vest-forms-warning-color: #92400e; /* Amber-800 */
  --ngx-vest-forms-warning-bg: #fffbeb; /* Amber-50 */
  --ngx-vest-forms-warning-border: #fcd34d; /* Amber-300 */
  --ngx-vest-forms-border-width: 1px;
  --ngx-vest-forms-border-radius: 0.5rem; /* 8px */
  --ngx-vest-forms-padding: 1rem; /* 16px */
}
```

#### Example 4: Material Design Style

Mimic Material Design error styling:

```css
:root {
  --ngx-vest-forms-error-color: #d32f2f;
  --ngx-vest-forms-warning-color: #f57c00;
  --ngx-vest-forms-font-size: 0.75rem; /* 12px */
  --ngx-vest-forms-spacing: 0.5rem; /* 8px */
}
```

### Dark Mode Support

The component includes automatic dark mode support via `prefers-color-scheme`:

```css
/* Built-in dark mode (no customization needed) */
@media (prefers-color-scheme: dark) {
  :root {
    --ngx-vest-forms-error-color: #fca5a5; /* Red-300 */
    --ngx-vest-forms-warning-color: #fcd34d; /* Amber-300 */
  }
}
```

#### Custom Dark Mode with Backgrounds

Override dark mode for filled style:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --ngx-vest-forms-error-color: #fca5a5; /* Red-300 */
    --ngx-vest-forms-error-bg: #7f1d1d; /* Red-900 */
    --ngx-vest-forms-error-border: #991b1b; /* Red-800 */
    --ngx-vest-forms-warning-color: #fcd34d; /* Amber-300 */
    --ngx-vest-forms-warning-bg: #78350f; /* Amber-900 */
    --ngx-vest-forms-warning-border: #92400e; /* Amber-800 */
  }
}
```

### Accessibility Features

The error component includes built-in accessibility compliance:

- **ARIA Live Regions**: Errors use `role="alert"` with `aria-live="assertive"`, warnings use `role="status"` with `aria-live="polite"`
- **High Contrast Mode**: Automatically increases border width to 2px
- **Reduced Motion**: Respects `prefers-reduced-motion` to disable animations
- **Color Contrast**: Default colors meet WCAG 2.2 Level AA (4.5:1 for normal text)

### Integration with Design Systems

#### Tailwind CSS

```css
:root {
  --ngx-vest-forms-error-color: theme('colors.red.600');
  --ngx-vest-forms-error-bg: theme('colors.red.50');
  --ngx-vest-forms-error-border: theme('colors.red.200');
  --ngx-vest-forms-spacing: theme('spacing.3');
  --ngx-vest-forms-border-radius: theme('borderRadius.lg');
  --ngx-vest-forms-padding: theme('spacing.4');
}
```

#### Bootstrap

```css
:root {
  --ngx-vest-forms-error-color: var(--bs-danger);
  --ngx-vest-forms-error-bg: var(--bs-danger-bg-subtle);
  --ngx-vest-forms-error-border: var(--bs-danger-border-subtle);
  --ngx-vest-forms-font-size: var(--bs-body-font-size);
  --ngx-vest-forms-border-radius: var(--bs-border-radius);
}
```

### Complete Example

```typescript
import { Component, signal } from '@angular/core';
import { createVestForm } from 'ngx-vest-forms/core';
import { NgxFormErrorComponent } from 'ngx-vest-forms/core';
import { userValidations } from './user.validations';

@Component({
  selector: 'app-user-form',
  imports: [NgxFormErrorComponent],
  styles: `
    /* Custom error styling for this component */
    :host {
      --ngx-vest-forms-error-color: #dc2626;
      --ngx-vest-forms-error-bg: #fef2f2;
      --ngx-vest-forms-error-border: #fca5a5;
      --ngx-vest-forms-border-width: 1px;
      --ngx-vest-forms-border-radius: 0.5rem;
      --ngx-vest-forms-padding: 0.75rem;
    }
  `,
  template: `
    <form (ngSubmit)="save()">
      <label for="email">Email</label>
      <input
        id="email"
        type="email"
        [value]="form.email() ?? ''"
        (input)="form.setEmail($event)"
      />
      <ngx-form-error [field]="form.emailField()" />

      <button type="submit">Submit</button>
    </form>
  `,
})
export class UserFormComponent {
  protected readonly form = createVestForm(
    userValidations,
    signal({ email: '' }),
  );

  protected save = async () => {
    const result = await this.form.submit();
    if (result.valid) console.log('Valid:', result.data);
  };
}
```

## Related Packages

- **`@ngx-vest-forms/form-field`** - Accessible UI components with automatic error display
- **`@ngx-vest-forms/ngform-sync`** - Optional NgForm integration
- **`@ngx-vest-forms/schemas`** - Schema adapters (Zod, Valibot, ArkType)

## License

MIT © ngx-vest-forms contributors
