# @ngx-vest-forms/form-field

> Form field wrapper component for ngx-vest-forms with automatic error display and consistent layout

## Installation

```bash
npm install ngx-vest-forms-form-field
```

## Features

- ✅ **Content Projection** - Wraps label + input together for consistent layout
- ✅ **Automatic Error Display** - No need to manually add error components
- ✅ **Layout Consistency** - Standardized spacing via CSS custom properties
- ✅ **Accessibility** - Proper structure with semantic HTML
- ✅ **Optional Validation** - Works with or without field validation
- ✅ **Themeable** - CSS custom properties with dark mode support

## Quick Start

```typescript
import { Component, signal } from '@angular/core';
import { createVestForm } from 'ngx-vest-forms/core';
import { NgxVestFormField } from 'ngx-vest-forms/form-field';
import { contactValidations } from './contact.validations';

@Component({
  selector: 'app-contact-form',
  imports: [NgxVestFormField],
  template: `
    <form (ngSubmit)="save()">
      <ngx-vest-form-field [field]="form.emailField()">
        <label for="email">Email *</label>
        <input
          id="email"
          type="email"
          [value]="form.email() ?? ''"
          (input)="form.setEmail($event)"
        />
      </ngx-vest-form-field>

      <ngx-vest-form-field [field]="form.messageField()">
        <label for="message">Message</label>
        <textarea
          id="message"
          [value]="form.message() ?? ''"
          (input)="form.setMessage($event)"
        ></textarea>
      </ngx-vest-form-field>

      <button type="submit" [disabled]="form.pending()">Submit</button>
    </form>
  `,
})
export class ContactFormComponent {
  protected readonly form = createVestForm(
    contactValidations,
    signal({ email: '', message: '' }),
  );

  protected save = async () => {
    const result = await this.form.submit();
    if (result.valid) {
      console.log('Valid:', result.data);
    }
  };
}
```

## Usage Without Validation

The wrapper can also be used for layout consistency without validation:

```typescript
import { signal } from '@angular/core';

// In your component:
protected readonly name = signal('');

// In your template:
<ngx-vest-form-field>
  <label for="name">Name</label>
  <input id="name" type="text" [value]="name()" (input)="name.set($event)" />
</ngx-vest-form-field>
```

## Custom Styling

The form field wrapper provides layout customization through CSS custom properties. All properties are prefixed with `--ngx-vest-form-field-*`.

### CSS Custom Properties Reference

| Property                            | Default   | Description                                                |
| ----------------------------------- | --------- | ---------------------------------------------------------- |
| `--ngx-vest-form-field-gap`         | `0.5rem`  | Spacing between content (label + input) and error messages |
| `--ngx-vest-form-field-margin`      | `1rem`    | Bottom margin of the entire field wrapper                  |
| `--ngx-vest-form-field-content-gap` | `0.25rem` | Spacing between label and input inside the wrapper         |

### Styling Examples

#### Example 1: Compact Form

Reduce spacing for dense layouts:

```css
:root {
  --ngx-vest-form-field-gap: 0.25rem; /* 4px */
  --ngx-vest-form-field-margin: 0.75rem; /* 12px */
  --ngx-vest-form-field-content-gap: 0.125rem; /* 2px */
}
```

#### Example 2: Spacious Form

Increase spacing for better readability:

```css
:root {
  --ngx-vest-form-field-gap: 0.75rem; /* 12px */
  --ngx-vest-form-field-margin: 2rem; /* 32px */
  --ngx-vest-form-field-content-gap: 0.5rem; /* 8px */
}
```

#### Example 3: Custom Label Styling

Style labels and inputs while preserving layout:

```css
:root {
  --ngx-vest-form-field-gap: 0.75rem;
  --ngx-vest-form-field-margin: 1.5rem;
}

/* Custom label styles */
ngx-vest-form-field label {
  font-weight: 600;
  font-size: 0.875rem; /* 14px */
  color: #374151; /* Gray-700 */
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

/* Custom input styles */
ngx-vest-form-field input,
ngx-vest-form-field textarea,
ngx-vest-form-field select {
  border: 1px solid #d1d5db; /* Gray-300 */
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
}

ngx-vest-form-field input:focus,
ngx-vest-form-field textarea:focus,
ngx-vest-form-field select:focus {
  outline: 2px solid #3b82f6; /* Blue-500 */
  outline-offset: 2px;
  border-color: transparent;
}
```

#### Example 4: Card-Style Fields

Add backgrounds and borders for visual grouping:

```css
:root {
  --ngx-vest-form-field-gap: 0.5rem;
  --ngx-vest-form-field-margin: 1.5rem;
}

ngx-vest-form-field {
  display: block;
  background: #f9fafb; /* Gray-50 */
  border: 1px solid #e5e7eb; /* Gray-200 */
  border-radius: 0.5rem;
  padding: 1rem;
}

ngx-vest-form-field label {
  font-weight: 500;
  color: #1f2937; /* Gray-800 */
}
```

### Dark Mode Support

Customize for dark mode using `prefers-color-scheme`:

```css
@media (prefers-color-scheme: dark) {
  ngx-vest-form-field label {
    color: #f3f4f6; /* Gray-100 */
  }

  ngx-vest-form-field input,
  ngx-vest-form-field textarea,
  ngx-vest-form-field select {
    background-color: #1f2937; /* Gray-800 */
    border-color: #4b5563; /* Gray-600 */
    color: #f9fafb; /* Gray-50 */
  }
}
```

### Integration with Design Systems

#### Tailwind CSS

```css
:root {
  --ngx-vest-form-field-gap: theme('spacing.3');
  --ngx-vest-form-field-margin: theme('spacing.6');
  --ngx-vest-form-field-content-gap: theme('spacing.2');
}
```

Then use Tailwind classes for labels and inputs:

```html
<ngx-vest-form-field [field]="form.emailField()">
  <label for="email" class="block text-sm font-medium text-gray-700"
    >Email</label
  >
  <input
    id="email"
    type="email"
    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
    [value]="form.email()"
    (input)="form.setEmail($event)"
  />
</ngx-vest-form-field>
```

#### Bootstrap

```css
:root {
  --ngx-vest-form-field-gap: 0.5rem;
  --ngx-vest-form-field-margin: var(--bs-gutter-y, 1rem);
  --ngx-vest-form-field-content-gap: 0.25rem;
}
```

Use Bootstrap classes:

```html
<ngx-vest-form-field [field]="form.emailField()">
  <label for="email" class="form-label">Email</label>
  <input
    id="email"
    type="email"
    class="form-control"
    [value]="form.email()"
    (input)="form.setEmail($event)"
  />
</ngx-vest-form-field>
```

### Error Styling

The form field wrapper automatically includes `NgxFormErrorComponent` for error display. To customize error appearance, see the [NgxFormErrorComponent styling documentation](../core/README.md#styling-ngxformerrorcomponent).

You can combine form field layout with error styling:

```css
:root {
  /* Form field layout */
  --ngx-vest-form-field-gap: 0.5rem;
  --ngx-vest-form-field-margin: 1.5rem;

  /* Error styling (from NgxFormErrorComponent) */
  --ngx-vest-forms-error-color: #dc2626;
  --ngx-vest-forms-error-bg: #fef2f2;
  --ngx-vest-forms-error-border: #fca5a5;
  --ngx-vest-forms-border-width: 1px;
  --ngx-vest-forms-border-radius: 0.375rem;
  --ngx-vest-forms-padding: 0.5rem;
}
```

## Comparison with Manual Approach

**Before (Manual):**

```html
<div class="form-field">
  <label for="email">Email</label>
  <input id="email" [value]="form.email()" (input)="form.setEmail($event)" />
  <ngx-form-error [field]="form.emailField()" />
</div>
```

**After (With Wrapper):**

```html
<ngx-vest-form-field [field]="form.emailField()">
  <label for="email">Email</label>
  <input id="email" [value]="form.email()" (input)="form.setEmail($event)" />
</ngx-vest-form-field>
```

## API

### Input Properties

| Property | Type                            | Description                                                                                  |
| -------- | ------------------------------- | -------------------------------------------------------------------------------------------- |
| `field`  | `VestField<unknown>` (optional) | Field object from Enhanced Proxy API. When provided, automatically displays errors/warnings. |

## Accessibility

- Maintains proper label/input associations
- Error display uses WCAG 2.2 compliant ARIA attributes (via `NgxFormErrorComponent`)
- Supports keyboard navigation
- Compatible with screen readers
- Respects `prefers-reduced-motion`

## License

MIT © [ngx-vest-forms](https://github.com/ngx-vest-forms/ngx-vest-forms)
