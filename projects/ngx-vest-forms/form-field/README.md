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

Override CSS custom properties to match your design system:

```css
:root {
  --ngx-vest-form-field-gap: 0.75rem;
  --ngx-vest-form-field-margin: 1.5rem;
  --ngx-vest-form-field-content-gap: 0.5rem;
}

/* Custom label styles */
ngx-vest-form-field label {
  font-weight: 600;
  color: var(--label-color);
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

## CSS Custom Properties

| Property                            | Default   | Description                        |
| ----------------------------------- | --------- | ---------------------------------- |
| `--ngx-vest-form-field-gap`         | `0.5rem`  | Spacing between content and errors |
| `--ngx-vest-form-field-margin`      | `1rem`    | Bottom margin of wrapper           |
| `--ngx-vest-form-field-content-gap` | `0.25rem` | Spacing between label and input    |

## Accessibility

- Maintains proper label/input associations
- Error display uses WCAG 2.2 compliant ARIA attributes (via `NgxFormErrorComponent`)
- Supports keyboard navigation
- Compatible with screen readers
- Respects `prefers-reduced-motion`

## License

MIT © [ngx-vest-forms](https://github.com/ngx-vest-forms/ngx-vest-forms)
