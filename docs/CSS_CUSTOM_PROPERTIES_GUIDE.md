# CSS Custom Properties Theming Guide

## Overview

ngx-vest-forms now supports CSS custom properties for complete theming control. The implementation follows modern CSS patterns inspired by Lea Verou's dynamic CSS techniques, providing both a high-level API and fine-grained control.

## CSS Pseudo-Class Driven Approach

The styling follows a CSS pseudo-class driven approach for optimal UX.

### Warning States (Progressive Feedback)

- **`:focus:invalid`** - User actively typing, field invalid (soft orange feedback)
- Used when user is still working on the field
- Triggered by **non-blocking warnings** from Vest.js `warn()` tests
- Visual cue: soft orange border and shadow using `--ngx-vest-forms-warning-color`

### Error States (Final Feedback)

- **`:invalid:not(:focus)`** - User finished editing, field still invalid (hard red feedback)
- Used when user has moved away from an invalid field
- Triggered by **blocking errors** from regular Vest.js tests (without `warn()`)
- Visual cue: hard red border and shadow using `--ngx-vest-forms-error-color`

### Vest.js Integration

````typescript
// Create warnings vs errors in your validation suite
test('password', 'Password is required', () => {
  enforce(data.password).isNotEmpty(); // BLOCKING ERROR (red)
});

test('password', 'Password strength: WEAK', () => {
  warn(); // NON-BLOCKING WARNING (orange)
  enforce(data.password).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]$/);
});
```ties Theming Guide

## Overview

ngx-vest-forms now supports CSS custom properties for complete theming control. The implementation follows modern CSS patterns inspired by Lea Verou's dynamic CSS techniques, providing both a high-level API and fine-grained control.

## CSS Pseudo-Class Driven Approach

The visual feedback follows a CSS pseudo-class driven approach for optimal UX:

### Warning States (Progressive Feedback)

- **`:focus:invalid`** - User actively typing, field invalid (soft orange feedback)
- Used when user is still working on the field

### Error States (Final Feedback)

- **`:invalid:not(:focus)`** - User finished editing, field still invalid (hard red feedback)
- Used when user has moved away from an invalid field

## CSS Custom Properties API

ngx-vest-forms uses properly namespaced CSS custom properties to prevent collisions with other libraries or design systems. All public theming variables use the `--ngx-vest-forms-` prefix.

### Color Theming

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
````

### Component-Level Theming

```css
/* Theme a specific form */
.my-form {
  --ngx-vest-forms-error-color: #b91c1c;
  --ngx-vest-forms-warning-color: #ea580c;
}

/* Theme all forms in a section */
.premium-section {
  --ngx-vest-forms-error-color: #7c3aed;
  --ngx-vest-forms-warning-color: #0891b2;
}
```

### Internal State Properties

The components also expose internal state via custom properties (advanced usage):

```css
ngx-control-wrapper {
  /* These are managed internally */
  --_show-errors: 0 | 1; /* Whether errors should be shown */
  --_show-warnings: 0 | 1; /* Whether warnings should be shown */
}
```

## Usage Examples

### Basic Theming

```html
<form class="my-custom-form">
  <ngx-control-wrapper showWarnings>
    <label>Email</label>
    <input name="email" [ngModel]="model().email" type="email" />
  </ngx-control-wrapper>
</form>
```

```css
.my-custom-form {
  --ngx-vest-forms-error-color: #991b1b;
  --ngx-vest-forms-warning-color: #92400e;
}
```

### Dark Theme Support

```css
[data-theme='dark'] {
  --ngx-vest-forms-error-color: #f87171;
  --ngx-vest-forms-error-color-light: #fca5a5;
  --ngx-vest-forms-warning-color: #fbbf24;
  --ngx-vest-forms-warning-color-light: #fcd34d;
}
```

### Brand-Specific Colors

```css
.brand-form {
  --ngx-vest-forms-error-color: var(--brand-danger, #dc2626);
  --ngx-vest-forms-warning-color: var(--brand-warning, #d97706);
  --ngx-vest-forms-error-shadow: var(
    --brand-danger-shadow,
    rgb(220 38 38 / 0.2)
  );
  --ngx-vest-forms-warning-shadow: var(
    --brand-warning-shadow,
    rgb(217 119 6 / 0.3)
  );
}
```

## Benefits

1. **CSS-Driven Timing**: Visual feedback timing is handled by CSS pseudo-classes for optimal performance
2. **Themeable**: Complete control over colors via CSS custom properties
3. **Fallback Support**: Graceful degradation with sensible defaults
4. **Performance**: No JavaScript needed for visual state management
5. **Standards-Based**: Uses modern CSS features and web platform standards

## Browser Support

- CSS Custom Properties: All modern browsers
- `:focus:invalid` pseudo-class: All modern browsers
- Fallback colors provided for unsupported scenarios

## Migration from Hard-Coded Colors

If you were previously overriding styles with hard-coded colors:

```css
/* Old approach */
.ngx-control-wrapper input:invalid {
  border-color: #custom-red !important;
}

/* New approach */
.my-form {
  --ngx-vest-forms-error-color: #custom-red;
}
```

The new approach is more maintainable and doesn't require `!important`.

## Why Namespaced Variables?

The `--ngx-vest-forms-` prefix prevents naming collisions with:

- Other UI libraries (e.g., Material, Bootstrap, PrimeNG)
- Design system tokens (e.g., `--error-color`, `--danger-color`)
- Your application's own CSS custom properties

This ensures that ngx-vest-forms theming variables won't interfere with existing styles in your application.
