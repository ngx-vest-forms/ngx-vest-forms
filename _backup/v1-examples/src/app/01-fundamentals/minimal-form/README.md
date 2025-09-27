# Minimal Form Example

The smallest, production-quality pattern showing how to wire up `ngx-vest-forms` with correct error timing and performance.

## 🎯 Learning Objectives

### What You'll Learn

Core Concepts:

- ✅ Single-field form using `ngxFormErrorDisplay` directive for proper error timing
- ✅ Two-way model synchronization with `[(formValue)]`
- ✅ One-way field binding with `[ngModel]` (never `[(ngModel)]`)
- ✅ Performance optimization with `only(field)` in the Vest suite
- ✅ Form state API usage for submit button enablement

Architecture Patterns:

- ✅ Three-part pattern: Signal model + Vest suite + Template
- ✅ OnPush change detection with signals
- ✅ Modern Angular template control flow
- ✅ Clean separation of concerns

## 🏗️ Implementation Details

### Component Architecture

```typescript
@Component({
  selector: 'ngx-minimal-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ngxVestForms, NgxFormErrorDisplayDirective],
})
export class MinimalForm {
  // Signal-based reactive state
  protected readonly model = signal<MinimalFormModel>({ email: '' });

  // Vest validation suite with performance optimization
  protected readonly suite = minimalFormValidationSuite;

  // Expose form state for parent components
  readonly formState = computed(() => this.vestFormRef().formState());
}
```

### Template (Current Best Practice)

We use the `NgxFormErrorDisplayDirective` to demonstrate proper error timing (on blur or submit) instead of immediate error flashing.

```html
<form
  ngxVestForm
  [vestSuite]="suite"
  [(formValue)]="model"
  #vestForm="ngxVestForm"
  (ngSubmit)="onSubmit()"
>
  <div ngxFormErrorDisplay #emailDisplay="formErrorDisplay">
    <label for="email">Email Address</label>
    <input
      id="email"
      name="email"
      type="email"
      [ngModel]="model().email"
      placeholder="you@example.com"
      [attr.aria-invalid]="emailDisplay.shouldShowErrors() ? 'true' : null"
      [attr.aria-describedby]="
        emailDisplay.shouldShowErrors() ? 'email-error' : null
      "
    />

    @if (emailDisplay.shouldShowErrors() && emailDisplay.errors().length) {
    <div id="email-error" role="alert">{{ emailDisplay.errors()[0] }}</div>
    }
  </div>

  <button
    type="submit"
    [disabled]="!vestForm.formState().valid || vestForm.formState().pending"
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

### Why Use the Error Display Directive?

| Concern                | Manual Immediate         | ngxFormErrorDisplay      |
| ---------------------- | ------------------------ | ------------------------ |
| Error Timing           | Immediate (can distract) | Blur or submit (default) |
| Pending Async Flicker  | Must implement manually  | Built-in filtering       |
| Consistency Across App | Copy/paste variations    | Single directive pattern |

Result: The directive provides better UX and consistent error handling patterns.

## ❌ Common Mistakes to Avoid

### ❌ Don't Use Two-Way Binding on Fields

```html
<!-- WRONG: Causes double updates -->
<input [(ngModel)]="model().email" />

<!-- CORRECT: Use one-way binding -->
<input [ngModel]="model().email" />
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
<input name="email" [ngModel]="model().email" />
<div>Error message</div>

<!-- ✅ CORRECT: Proper ARIA relationships -->
<label for="email">Email Address</label>
<input
  id="email"
  name="email"
  [ngModel]="model().email"
  [attr.aria-invalid]="hasErrors ? 'true' : null"
  [attr.aria-describedby]="hasErrors ? 'email-error' : null"
/>
<div id="email-error" role="alert">Error message</div>
```

**Critical WCAG 2.2 requirements:**

- `aria-describedby`: Links input to error messages for screen readers
- `aria-invalid`: Indicates validation state to assistive technology
- `role="alert"`: Announces errors when they appear
- `id` attributes: Provide targets for `aria-describedby`
- `<label>` elements: Associate descriptive text with form controls

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
