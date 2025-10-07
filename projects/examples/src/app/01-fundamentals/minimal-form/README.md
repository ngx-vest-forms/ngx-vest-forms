# Minimal Form Example

The smallest, production-quality pattern showing how to use `ngx-vest-forms` V2 with the new Vest.js-first approach.

## 🎯 Learning Objectives

### What You'll Learn

Core Concepts:

- ✅ Form creation using `createVestForm()` factory function
- ✅ Enhanced Field Signals API with proxy-based field access
- ✅ Native HTML bindings with `[value]` and `(input)`
- ✅ No directive dependencies - pure Vest.js + Angular signals
- ✅ Performance optimization with `only(field)` in the Vest suite

Architecture Patterns:

- ✅ Two-part pattern: Vest suite + Form factory
- ✅ OnPush change detection with signals
- ✅ Modern Angular template control flow
- ✅ Direct field access via Enhanced Field Signals API

## 🏗️ Implementation Details

### Component Architecture

```typescript
@Component({
  selector: 'ngx-minimal-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MinimalForm {
  // Create form instance using Vest.js-first approach
  protected readonly form = createVestForm(
    minimalFormValidationSuite,
    signal<MinimalFormModel>({ email: '' }),
  );

  // Expose form instance for parent components
  readonly formState = () => this.form;
}
```

### Template (V2 Best Practice)

We use native HTML bindings with the Enhanced Field Signals API for clean, performant form handling.

```html
<form (ngSubmit)="save()">
  <div class="form-field">
    <label for="email">Email Address</label>
    <input
      id="email"
      name="email"
      type="email"
      [value]="form.email()"
      (input)="form.setEmail($event)"
      placeholder="you@example.com"
      [attr.aria-invalid]="form.emailShowErrors() && !form.emailValid()"
      [attr.aria-describedby]="form.emailShowErrors() ? 'email-error' : null"
    />

    <div id="email-error" role="alert" aria-live="assertive" aria-atomic="true">
      @if (form.emailShowErrors() && form.emailErrors().length) { {{
      form.emailErrors()[0] }} }
    </div>
  </div>

  <button
    type="submit"
    [disabled]="!form.valid() || form.pending() || form.submitting()"
  >
    Submit
  </button>
</form>
```

### Validation Suite Example

```typescript
import { enforce, only, staticSuite, test } from 'vest';

export const minimalFormValidationSuite = staticSuite(
  (data: Partial<MinimalFormModel> = {}, field?: string) => {
    only(field); // Critical for performance

    test('email', 'Email is required', () => {
      enforce(data.email).isNotEmpty();
    });

    test('email', 'Please enter a valid email', () => {
      enforce(data.email).matches(/^[^@]+@[^@]+\.[^@]+$/);
    });
  },
);
```

### Why Use Enhanced Field Signals API?

| Concern              | Manual Field Access   | Enhanced Field Signals   |
| -------------------- | --------------------- | ------------------------ |
| Type Safety          | Manual path strings   | Compile-time validation  |
| Error Timing         | Manual implementation | Built-in `showErrors()`  |
| Performance          | Manual optimization   | Cached field instances   |
| Developer Experience | Verbose API calls     | Clean proxy-based access |

Result: The Enhanced Field Signals API provides better DX, type safety, and performance.

## ❌ Common Mistakes to Avoid

### ❌ Don't Forget Form Cleanup (For Reactive Suites Only)

```typescript
// If using reactive suites (create() instead of staticSuite()):
ngOnDestroy() {
  this.form.dispose(); // Clean up subscriptions
}

// Static suites don't need cleanup - no subscriptions created
```

### ❌ Don't Skip Performance Optimization

```typescript
// WRONG: Validates all fields on every change
staticSuite((data) => {
  test('email', 'Required', () => enforce(data.email).isNotBlank());
});

// CORRECT: Only validates changed field
staticSuite((data, field?) => {
  only(field); // Critical for performance
  test('email', 'Required', () => enforce(data.email).isNotBlank());
});
```

### ❌ Don't Ignore Accessibility

Forms **must** be accessible. Essential ARIA attributes include:

```html
<!-- ❌ WRONG: Missing accessibility attributes -->
<input name="email" [value]="form.email()" />
<div>Error message</div>

<!-- ✅ CORRECT: Proper ARIA relationships -->
<label for="email">Email Address</label>
<input
  id="email"
  name="email"
  [value]="form.email()"
  (input)="form.setEmail($event)"
  [attr.aria-invalid]="form.emailShowErrors() && !form.emailValid()"
  [attr.aria-describedby]="hasErrors ? 'email-error' : null"
/>
<div id="email-error" role="alert">Error message</div>
```

**Critical WCAG 2.2 requirements:**

- `aria-describedby`: Links input to error messages for screen readers
- `aria-invalid`: Indicates validation state to assistive technology
- `role="alert"` + `aria-live="assertive"` + `aria-atomic="true"`: Announces blocking errors immediately while preventing partial announcements
- `id` attributes: Provide targets for `aria-describedby`
- `<label>` elements: Associate descriptive text with form controls
- `role="status"` (or `aria-live="polite"`): Use for non-blocking warnings or confirmations so announcements are polite and non-interruptive

## 🔄 Form State Lifecycle

The form state changes as the user interacts:

1. **Initial**: `{ valid: false, pending: false, errors: {}, warnings: {} }`
2. **User types**: Validation runs, errors appear/disappear
3. **Valid state**: `{ valid: true, pending: false, errors: {}, warnings: {} }`
4. **Submit enabled**: Button becomes clickable when valid

## 🚀 Next Steps

After mastering this pattern:

1. **Basic Validation** – add more fields & explore form state transitions
2. **Simple Form** – introduce real-world composition
3. **Control Wrapper** – automatic error rendering via hostDirectives

---

**Key Takeaway**: Minimal does not mean "bare"; it means "no unnecessary code". We use the error display directive because it provides essential UX with virtually zero overhead.
