# Basic Validation Example

## Foundation Level • Best-Practice Error Timing • Multiple Field Types

## 🎯 Learning Objectives

This example demonstrates the core fundamentals of ngx-vest-forms with production-quality error timing using `ngxFormErrorDisplay`. It models the raw API surface while maintaining proper UX and accessibility.

### What You'll Master

- **Three-Part Pattern**: Model Signal + Vest Suite + Template integration
- **Error Handling**: `ngxFormErrorDisplay` for blur-or-submit timing vs immediate access
- **One-Way Binding**: Proper use of `[ngModel]` for unidirectional data flow
- **Form Submission**: Validation state checks and proper submission flow
- **Multiple Field Types**: Text, email, number, select, textarea, and checkbox
- **Conditional Validation**: Role-based requirements (bio for senior positions)
- **Performance**: Using `only(field)` optimization in Vest suites

## 🏗️ Architecture Breakdown

### 1. Model Signal (Reactive State)

```typescript
protected readonly model = signal<UserFormModel>({
  name: '',
  email: '',
  age: 0,
  role: '',
  bio: '',
  agreeToTerms: false,
});
```

**Why Signals?**

- Reactive updates trigger validation automatically
- Better performance than traditional change detection
- Type-safe state management
- Composable with computed values

### 2. Vest Validation Suite (Business Logic)

```typescript
/**
 * Field names for type-safe validation
 * 🎯 BEST PRACTICE: Always create this type for compile-time safety
 */
type UserFieldNames = keyof UserFormModel;

export const userValidationSuite = staticSuite(
  (data: Partial<UserFormModel> = {}, field?: UserFieldNames) => {
    only(field); // 🔥 Critical for performance

    test('name', 'Name is required', () => {
      enforce(data.name).isNotEmpty();
    });

    test('name', 'Name must be between 2 and 50 characters', () => {
      enforce(data.name).longerThan(1).shorterThan(51);
    });

    test('email', 'Email is required', () => {
      enforce(data.email).isNotEmpty();
    });

    test('email', 'Please enter a valid email address', () => {
      enforce(data.email).matches(/^[^@]+@[^@]+\.[^@]+$/);
    });

    test('age', 'Age is required', () => {
      enforce(data.age).isNumber().greaterThan(0);
    });

    test('age', 'Age must be between 18 and 120', () => {
      enforce(data.age).greaterThanOrEquals(18).lessThanOrEquals(120);
    });

    test('role', 'Please select a role', () => {
      enforce(data.role).isNotEmpty();
    });

    // Conditional validation - bio required for senior roles
    if (data.role === 'Senior Developer' || data.role === 'Team Lead') {
      test('bio', 'Bio is required for senior positions', () => {
        enforce(data.bio).isNotEmpty();
      });

      test('bio', 'Bio must be at least 50 characters for senior roles', () => {
        enforce(data.bio).longerThan(49);
      });
    }

    test('agreeToTerms', 'You must agree to the terms and conditions', () => {
      enforce(data.agreeToTerms).isTruthy();
    });
  },
);
```

**Key Patterns:**

- **Type Safety**: `UserFieldNames` provides compile-time field validation
- **Performance**: `only(field)` optimizes validation by only checking changed fields
- **Granular Errors**: Multiple `test()` calls provide specific error messages
- **Conditional Logic**: Business rules like senior role requirements
- **User Experience**: Descriptive error messages guide users to success

**🎯 TypeScript Benefits:**

- ✅ **IntelliSense**: Get autocomplete when calling validation suite
- ✅ **Compile-time Safety**: Catch typos in field names before runtime
- ✅ **Refactoring Support**: Renaming model fields updates validation automatically
- ✅ **Self-Documentation**: Types clearly show which fields can be validated

### 3. Template Integration (UI Layer)

```html
<form
  ngxVestForm
  [vestSuite]="suite"
  [(formValue)]="model"
  #vestForm="ngxVestForm"
  (ngSubmit)="onSubmit()"
>
  <div ngxFormErrorDisplay #nameDisplay="formErrorDisplay">
    <label for="name">Full Name *</label>
    <input
      id="name"
      name="name"
      [ngModel]="model().name"
      [attr.aria-invalid]="nameDisplay.shouldShowErrors() ? 'true' : null"
      [attr.aria-describedby]="
        'name-hint ' + (nameDisplay.shouldShowErrors() ? 'name-errors' : '')
      "
    />
    <div id="name-hint" class="form-hint">
      Enter your full name (2-50 characters)
    </div>
    @if (nameDisplay.shouldShowErrors() && nameDisplay.errors().length) {
    <div id="name-errors" role="alert">{{ nameDisplay.errors()[0] }}</div>
    }
  </div>
  <!-- other fields using ngxFormErrorDisplay ... -->
</form>
```

**Critical Bindings:**

- `[vestSuite]="suite"` connects validation logic
- `[(formValue)]="model"` enables two-way form state sync
- `[ngModel]="model().field"` provides one-way field binding
- `ngxFormErrorDisplay` provides proper error timing (recommended)

## 📋 Validation Rules Showcase

| Field     | Rules                   | Purpose                                         |
| --------- | ----------------------- | ----------------------------------------------- |
| **Name**  | Required, 2-50 chars    | Basic string validation with length constraints |
| **Email** | Required, valid format  | Email pattern matching with regex               |
| **Age**   | Required, 18-120 range  | Numeric validation with business rules          |
| **Role**  | Required, enum values   | Select field with predefined options            |
| **Bio**   | Conditional (50+ chars) | Context-dependent validation for senior roles   |
| **Terms** | Required agreement      | Boolean validation for legal compliance         |

### Conditional Logic in Action

```typescript
// Bio is only required for senior positions
if (data.role === 'senior' || data.role === 'lead') {
  test('bio', 'Bio is required for senior positions', () => {
    enforce(data.bio).isNotEmpty();
  });
}
```

This demonstrates how validation rules can depend on other field values, enabling sophisticated business logic.

## 🔍 Form State API

The `vestForm.formState()` provides reactive access to validation state:

```typescript
interface FormState {
  valid: boolean; // No errors and no pending validations
  pending: boolean; // Async validations in progress
  errors: Record<string, string[]>; // Field errors by name
  warnings?: Record<string, string[]>; // Optional warnings
}
```

### Usage Examples

```html
<!-- Submit button state -->
<button
  [disabled]="!vestForm.formState().valid || vestForm.formState().pending"
>
  @if (vestForm.formState().pending) { Validating... } @else { Submit }
</button>

<!-- Error display with ngxFormErrorDisplay (recommended) -->
<div ngxFormErrorDisplay #fieldDisplay="formErrorDisplay">
  <input name="fieldName" [ngModel]="model().fieldName" />
  @if (fieldDisplay.shouldShowErrors()) { @for (error of fieldDisplay.errors();
  track error) {
  <span class="error">{{ error }}</span>
  } }
</div>
```

## 🎯 Error Display Patterns

This example demonstrates the **recommended approach** to error handling:

### Using `ngxFormErrorDisplay` (Better UX)

```html
<div ngxFormErrorDisplay #fieldDisplay="formErrorDisplay">
  <label for="email">Email Address</label>
  <input
    id="email"
    name="email"
    [ngModel]="model().email"
    [attr.aria-invalid]="fieldDisplay.shouldShowErrors() ? 'true' : null"
    [attr.aria-describedby]="
      'email-hint ' + (fieldDisplay.shouldShowErrors() ? 'email-errors' : '')
    "
  />
  <div id="email-hint" class="form-hint">We'll use this to contact you</div>
  @if (fieldDisplay.shouldShowErrors()) {
  <div id="email-errors" class="errors" role="alert">
    @for (error of fieldDisplay.errors(); track error) {
    <div>{{ error }}</div>
    }
  </div>
  }
</div>
```

**Benefits:**

- ✅ Errors appear **only after blur or submit** (proper timing)
- ✅ Better user experience (no premature error feedback)
- ✅ **WCAG 2.2 compliant** with proper ARIA relationships
- ✅ Screen reader accessible with `aria-describedby` and `role="alert"`
- ✅ Follows ngx-vest-forms best practices

**When to use:** Production forms, user-facing applications, when UX matters

## 🚨 Common Mistakes to Avoid

### ❌ Wrong: Two-way binding

```html
<input name="email" [(ngModel)]="model().email" />
```

### ✅ Correct: One-way binding

```html
<input name="email" [ngModel]="model().email" />
```

**Why?** The `[(formValue)]` on the form already handles two-way synchronization. Using `[(ngModel)]` creates conflicts and duplicate updates.

### ❌ Wrong: Name mismatch

```html
<input name="userEmail" [ngModel]="model().email" />
```

### ✅ Correct: Exact name match

```html
<input name="email" [ngModel]="model().email" />
```

**Why?** The `name` attribute must exactly match the model property for validation to work correctly.

### ❌ Wrong: Missing only() optimization

```typescript
staticSuite((data, field?) => {
  // Missing only(field) - validates entire form on every change
  test('name', 'Required', () => enforce(data.name).isNotEmpty());
});
```

### ✅ Correct: Performance optimization

```typescript
staticSuite((data, field?) => {
  only(field); // Only validate the changed field
  test('name', 'Required', () => enforce(data.name).isNotEmpty());
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
  [attr.aria-describedby]="'email-hint ' + (hasErrors ? 'email-errors' : '')"
/>
<div id="email-hint">We'll use this to contact you</div>
<div id="email-errors" role="alert">Error message</div>
```

**Critical WCAG 2.2 requirements:**

- `aria-describedby`: Links input to help text and error messages
- `aria-invalid`: Indicates validation state to screen readers
- `role="alert"`: Announces errors when they appear
- `id` attributes: Provide targets for `aria-describedby`
- `<label>` elements: Associate descriptive text with form controls

## 🎓 Educational Value

This example serves as the **foundation** for understanding ngx-vest-forms:

1. **Raw API Understanding**: See how the library works without abstractions
2. **Manual Control**: Full control over error display and form behavior
3. **Pattern Recognition**: Understand the three-part architecture
4. **Performance Awareness**: Learn why `only(field)` matters

## 🚀 Next Steps

After mastering this example, explore:

1. **NgxControlWrapper** - Automatic error display helpers
2. **Schema Validation** - Type-safe validation with Zod
3. **Advanced Patterns** - Complex forms and async validation

## 💡 Best Practices Demonstrated

- ✅ Signal-based reactive state management
- ✅ Performance-optimized validation with `only(field)`
- ✅ Proper one-way binding patterns
- ✅ Accessible error messaging
- ✅ Clean separation of concerns
- ✅ Type-safe form models
- ✅ Conditional validation logic

---

**Remember**: This example uses the directive-based pattern because it provides good UX with minimal extra code. You now understand both the raw state (`vestForm.formState()`) and the preferred presentation mechanism (`ngxFormErrorDisplay`).
