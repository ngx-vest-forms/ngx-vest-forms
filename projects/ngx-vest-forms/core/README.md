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
import { createVestForm } from 'ngx-vest-forms/core';
import { staticSuite, test, enforce, only } from 'vest';

// Define validation suite
const userSuite = staticSuite((data = {}, field) => {
  if (field) only(field);

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
form.emailErrors(); // Signal<string[]> - field errors
form.emailTouched(); // Signal<boolean> - field touched state
form.setEmail(); // (value: string | Event) => void - field setter
form.touchEmail(); // () => void - mark field as touched
form.resetEmail(); // () => void - reset field to initial value

// Alternative explicit API
const emailField = form.field('email');
emailField.value(); // Signal<string>
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

- `suite` - Vest static suite for validation
- `initialModel` - Initial form data (object or signal)
- `options?` - Configuration options

**Returns:** `EnhancedVestForm<TModel>`

### Form Methods

- `form.field(path)` - Get field accessor for path
- `form.validate(path?)` - Run validation (specific field or entire form)
- `form.submit()` - Submit form (validates first, returns Promise)
- `form.reset()` - Reset form to initial state
- `form.dispose()` - Cleanup subscriptions

### Form Properties

- `form.model` - WritableSignal with form data
- `form.valid` - Signal indicating if form is valid
- `form.pending` - Signal indicating if async validation is running
- `form.errors` - Signal with all form errors
- `form.submitting` - Signal indicating if form is being submitted

## Related Packages

- **`@ngx-vest-forms/control-wrapper`** - Accessible UI components
- **`@ngx-vest-forms/ngform-sync`** - Optional NgForm integration
- **`@ngx-vest-forms/schemas`** - Schema adapters (Zod, Valibot, ArkType)

## License

MIT © ngx-vest-forms contributors
