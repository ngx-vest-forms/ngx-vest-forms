# Form Field Showcase

## NgxVestFormField Wrapper Component

This example demonstrates the **NgxVestFormField** wrapper component which provides automatic error display and consistent layout for form fields.

## 🎯 Key Features

### Automatic Error Display

No need to manually add `<ngx-form-error>` components - errors display automatically:

```html
<!-- ❌ Manual (Basic Validation Example) -->
<div class="form-field">
  <label for="email">Email</label>
  <input id="email" [value]="form.email()" (input)="form.setEmail($event)" />
  <ngx-form-error [field]="form.emailField()" />
</div>

<!-- ✅ Automatic (Form Field Showcase) -->
<ngx-vest-form-field [field]="form.emailField()">
  <label for="email">Email</label>
  <input id="email" [value]="form.email()" (input)="form.setEmail($event)" />
</ngx-vest-form-field>
```

### Consistent Layout

Standardized spacing via CSS custom properties ensures all fields look consistent:

```css
:root {
  --ngx-vest-form-field-gap: 0.5rem;
  --ngx-vest-form-field-margin: 1rem;
  --ngx-vest-form-field-content-gap: 0.25rem;
}
```

### Multiple Field Types

Works with all HTML form controls:

- **Text inputs**: name, email, URL
- **Number inputs**: age with range validation
- **Textarea**: bio with character limits
- **Select dropdown**: country selection
- **Checkbox**: terms and conditions

### Accessibility

- Maintains proper label/input associations
- ARIA attributes handled automatically (via `NgxFormErrorComponent`)
- Screen reader compatible
- Keyboard navigation support

## 📚 What You'll Learn

1. **Wrapper Benefits**: How `NgxVestFormField` reduces boilerplate
2. **Automatic Errors**: Understanding the `[field]` input for auto-display
3. **Optional Validation**: Wrapper works without validation too (field input is optional)
4. **Custom Styling**: Override CSS properties to match your design
5. **Comparison**: See the difference vs. manual error display

## 🏗️ Component Structure

```
form-field-showcase/
├── form-field-showcase.validations.ts  # Vest validation suite
├── form-field-showcase.form.ts         # Form component with wrapper
├── form-field-showcase.html            # Template using NgxVestFormField
├── form-field-showcase.page.ts         # Page wrapper with debugger
├── form-field-showcase.content.ts      # Content configuration
└── README.md                           # This file
```

## 🎨 Custom Styling Example

```css
/* Override default spacing */
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

## 🔗 Related Examples

- **[Minimal Form](../01-fundamentals/minimal-form)**: Basic form without wrapper
- **[Basic Validation](../01-fundamentals/basic-validation)**: Manual error display
- **[Error Display Modes](../01-fundamentals/error-display-modes)**: Error strategies

## 📦 Package Reference

This example uses:

- `ngx-vest-forms/core` - Core validation logic
- `ngx-vest-forms/form-field` - NgxVestFormField wrapper component

Install separately:

```bash
npm install ngx-vest-forms-form-field
```

Or use the bundle:

```bash
npm install ngx-vest-forms/bundle
```

## ✅ Benefits Summary

| Feature               | Manual Approach              | With NgxVestFormField      |
| --------------------- | ---------------------------- | -------------------------- |
| Error Display         | Manual `<ngx-form-error>`    | ✅ Automatic               |
| Layout Consistency    | Custom CSS per field         | ✅ CSS custom properties   |
| Boilerplate           | ~15-20 lines per field       | ✅ ~8-10 lines per field   |
| Accessibility         | Manual ARIA implementation   | ✅ Automatic via component |
| Maintenance           | Update each field separately | ✅ Update wrapper once     |
| Optional Validation   | N/A                          | ✅ Works without `[field]` |
| Custom Styling        | Per-field CSS                | ✅ Global CSS variables    |
| Works with All Inputs | Yes                          | ✅ Yes                     |
| WCAG 2.2 Compliant    | Manual implementation        | ✅ By default              |

## 🚀 Try It

1. Toggle error display modes to see when errors appear
2. Submit with empty fields to see all validation errors
3. Fill fields correctly to see success state
4. Check the debugger panel to see form state changes
5. Compare with **Basic Validation** example to see the difference

---

**Next Step**: Explore [Schema Integration](../../04-schema-integration/README.md) for type-safe forms with Zod, Valibot, or ArkType
