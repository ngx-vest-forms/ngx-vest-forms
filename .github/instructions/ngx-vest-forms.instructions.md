---
description: Comprehensive guide for using ngx-vest-forms, an Angular adapter for Vest.js validation with template-driven forms.
applyTo: '**/*.ts, **/*.html'
---
# ngx-vest-forms: Angular Template-Driven Forms with Vest.js Validation

Lightweight adapter bridging Angular template-driven forms with Vest.js validation by [Brecht Billiet](https://blog.simplified.courses/introducing-ngx-vest-forms/).

**Core Principles:**
- Use `[ngModel]` NOT `[(ngModel)]` for unidirectional data flow
- `DeepPartial<T>` for form models (forms build incrementally)
- **CRITICAL**: Call `only(field)` **unconditionally** in all validation suites (breaking change in latest version)
- `name` attribute MUST match property path exactly

> **⚠️ DEPRECATION NOTICE**: The `sc-` prefix for selectors is **deprecated** and will be removed in v3.0.0. Use the `ngx-` prefix instead:
> - ✅ **Recommended**: `ngxVestForm`, `<ngx-control-wrapper>`, `ngxValidateRootForm`, `NGX_ERROR_DISPLAY_MODE_TOKEN`
> - ⚠️ **Deprecated**: `scVestForm`, `<sc-control-wrapper>`, `validateRootForm`, `SC_ERROR_DISPLAY_MODE_TOKEN`
>
> Both prefixes work in v2.0+. See [Dual Selector Support](../../docs/DUAL-SELECTOR-SUPPORT.md) for migration guide.

> **See `.github/instructions/vest.instructions.md`** for comprehensive Vest.js validation patterns, async techniques, and performance optimization.

## Key Imports

```typescript
// Core
import { vestForms, vestFormsViewProviders } from 'ngx-vest-forms';

// Type Utilities (Ngx-prefixed recommended, backward compatible aliases available)
import { NgxDeepPartial, NgxDeepRequired, NgxFormCompatibleDeepRequired } from 'ngx-vest-forms';
import { DeepPartial, DeepRequired, FormCompatibleDeepRequired } from 'ngx-vest-forms'; // Legacy aliases

// Validation Suite Types
import { NgxVestSuite, NgxFieldKey } from 'ngx-vest-forms';

// Field Path Types (Type-safe field references with autocomplete)
import { FieldPath, ValidationConfigMap, FieldPathValue, ValidateFieldPath, LeafFieldPath } from 'ngx-vest-forms';

// Form State Types & Utilities
import { NgxFormState, createEmptyFormState } from 'ngx-vest-forms';

// Error Display (Ngx-prefixed recommended)
import { FormErrorDisplayDirective, FormControlStateDirective, NGX_ERROR_DISPLAY_MODE_TOKEN, ScErrorDisplayMode } from 'ngx-vest-forms';
import { SC_ERROR_DISPLAY_MODE_TOKEN } from 'ngx-vest-forms'; // Deprecated, use NGX_ERROR_DISPLAY_MODE_TOKEN

// Constants & Public Utilities
import { ROOT_FORM, NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN } from 'ngx-vest-forms';
import { clearFieldsWhen, clearFields, keepFieldsWhen } from 'ngx-vest-forms';
import { setValueAtPath } from 'ngx-vest-forms';
import { stringifyFieldPath } from 'ngx-vest-forms';
import { arrayToObject, deepArrayToObject, objectToArray } from 'ngx-vest-forms';

// Vest.js
import { staticSuite, test, enforce, only, omitWhen } from 'vest';
```

## Quick Start

```typescript
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { vestForms, NgxDeepPartial, NgxVestSuite } from 'ngx-vest-forms';
import { staticSuite, test, enforce, only } from 'vest';

// 1. Form Model
type MyFormModel = NgxDeepPartial<{ firstName: string; lastName: string }>;

// 2. Validation Suite
export const mySuite: NgxVestSuite<MyFormModel> = staticSuite((model, field?) => {
  only(field); // CRITICAL: Call unconditionally (breaking change)
  test('firstName', 'Required', () => enforce(model.firstName).isNotBlank());
});

// 3. Component
@Component({
  imports: [vestForms],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form ngxVestForm [suite]="suite" (formValueChange)="formValue.set($event)">
      <ngx-control-wrapper>
        <input name="firstName" [ngModel]="formValue().firstName"/>
      </ngx-control-wrapper>
    </form>
  `
})
export class MyFormComponent {
  protected readonly formValue = signal<MyFormModel>({});
  protected readonly suite = mySuite; // No type assertion needed
}
```

## CRITICAL: Name Attribute Must Match Property Path

```typescript
// ✅ CORRECT
<input name="firstName" [ngModel]="formValue().firstName" />
<input name="generalInfo.firstName" [ngModel]="formValue().generalInfo?.firstName" />

<div ngModelGroup="addresses">
  <div ngModelGroup="billingAddress">
    <input name="street" [ngModel]="formValue().addresses?.billingAddress?.street" />
  </div>
</div>

// ❌ WRONG
<input name="first_name" [ngModel]="formValue().firstName" />       // Mismatch!
<input name="firstName" [ngModel]="formValue().generalInfo?.firstName" />  // Missing path!
```

Required for: form control creation, validation mapping, shape validation, unidirectional flow.

## Essential Patterns

### Type-Safe Form Models

```typescript
// Form model (incremental) - use Ngx-prefixed version
type FormModel = NgxDeepPartial<{ name: string; birthDate: Date; }>;

// Shape for runtime validation
const formShape: NgxDeepRequired<FormModel> = { name: '', birthDate: new Date() };

// Date-compatible shape (accepts Date | string for Angular form compatibility)
const dateShape: NgxFormCompatibleDeepRequired<FormModel> = { name: '', birthDate: '' };

// Backward compatible aliases (legacy, prefer Ngx-prefixed versions)
type LegacyModel = DeepPartial<{ name: string }>;
const legacyShape: DeepRequired<LegacyModel> = { name: '' };
```

**Why Ngx prefix?** Prevents naming conflicts with other libraries and clearly identifies ngx-vest-forms utilities. Both versions work identically; the Ngx-prefixed versions are recommended for new code.

### Form State Type and Utilities

The `formState` computed signal returns an `NgxFormState<T>` with the current form state:

```typescript
import { NgxFormState, createEmptyFormState, vestForms } from 'ngx-vest-forms';
import { Component, computed, ViewChild, ChangeDetectionStrategy } from '@angular/core';

// Form state structure
interface NgxFormState<TModel> {
  valid: boolean;                    // Whether form is valid
  errors: Record<string, string[]>;  // Map of field errors by path
  value: TModel | null;              // Current form value (includes disabled)
}

// Parent component displaying child form state
@Component({
  template: `
    <ngx-child-form #childForm />
    <div>Valid: {{ formState().valid }}</div>
    <div>Errors: {{ formState().errors | json }}</div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParentComponent {
  // Angular 17.2+: Use viewChild() (functional query API) instead of @ViewChild
  private readonly childForm = viewChild<ChildFormComponent>('childForm');

  // Safe fallback when child form isn't initialized
  protected readonly formState = computed(() =>
    this.childForm()?.vestForm?.formState() ?? createEmptyFormState()
  );
}
```

**`createEmptyFormState()` returns:**
- `valid: true`
- `errors: {}`
- `value: null`

**Use cases:**
- Parent components displaying child form state
- Preventing null reference errors before form initialization
- Providing safe defaults for optional form references

**Performance Note:**
The `formState` signal uses optimized memoization with deep equality checking. It only recalculates when `valid`, `errors`, or `value` actually change - not on every status event. This makes `formState()` efficient for frequent access in templates and computed signals, even in large forms.

### Validation Patterns

> **⚠️ BREAKING CHANGE**: You MUST now call `only()` unconditionally. The old `if (field)` pattern breaks Vest's execution tracking. See [Migration Guide](../../docs/migration/MIGRATION-v1.x-to-v2.0.0.md).

```typescript
// ✅ CORRECT: Unconditional only() call (required since latest version)
export const suite: NgxVestSuite<FormModel> = staticSuite((model, field?) => {
  only(field); // ALWAYS call unconditionally (safe: only(undefined) runs all tests)

  test('email', 'Required', () => enforce(model.email).isNotBlank());
  test('email', 'Invalid', () => enforce(model.email).isEmail());
});

// ❌ WRONG: Conditional only() corrupts Vest's execution tracking
export const badSuite = staticSuite((model, field?) => {
  if (field) { only(field); } // BUG: Breaks omitWhen + validationConfig!
  test('email', 'Required', () => enforce(model.email).isNotBlank());
});

// Conditional validation
omitWhen((model.age || 0) >= 18, () => {
  test('guardian', 'Guardian required for minors', () => enforce(model.guardian).isNotBlank());
});

// Composable validations
export function addressValidations(model: AddressModel | undefined, field: string): void {
  test(`${field}.street`, 'Required', () => enforce(model?.street).isNotBlank());
}
addressValidations(model.addresses?.billing, 'addresses.billing');

// Async validation
test('username', 'Already taken', async ({ signal }) => {
  await apiService.checkUsername(model.username, { signal });
});
```

> See `.github/instructions/vest.instructions.md` for comprehensive validation patterns.

### Dependent Field Validation

Vest.js validates, Angular controls when. Use `validationConfig` to tell Angular to revalidate dependent fields:

> **⚠️ CRITICAL with `omitWhen`/`skipWhen`**: When using Vest.js's `omitWhen` or `skipWhen` for conditional validations, `validationConfig` is **essential** to ensure Angular re-validates dependent fields when conditions change. Without it, conditional validations won't update properly!

```typescript
import { ValidationConfigMap } from 'ngx-vest-forms';

// Component: Tell Angular which fields depend on each other with type safety
protected readonly validationConfig: ValidationConfigMap<FormModel> = {
  'password': ['confirmPassword'],  // When password changes, re-validate confirmPassword
  'age': ['emergencyContact']       // When age changes, re-validate emergencyContact (for omitWhen condition)
};

// Suite: Define the validation logic
// Example 1: Field comparison (password confirmation)
omitWhen(!model.password || !model.confirmPassword, () => {
  test('confirmPassword', 'Passwords must match', () => {
    enforce(model.confirmPassword).equals(model.password);
  });
});

// Example 2: Conditional requirement (age-based)
omitWhen((model.age || 0) >= 18, () => {
  test('emergencyContact', 'Required for minors', () => {
    enforce(model.emergencyContact).isNotBlank();
  });
});
```

**Why this matters:**
- When `password` changes → `omitWhen` condition changes → Angular needs to re-validate `confirmPassword`
- When `age` changes to 18+ → `omitWhen` skips validation → Angular needs to clear `emergencyContact` errors
- Without `validationConfig`, these dependent fields won't re-validate automatically

#### ValidationConfig Fluent Builder API (Recommended)

**NEW**: Use the type-safe builder API for cleaner, more maintainable validation configurations:

```typescript
import { createValidationConfig } from 'ngx-vest-forms';

// ✅ BEST: Type-safe builder with autocomplete
protected readonly validationConfig = createValidationConfig<FormModel>()
  .bidirectional('password', 'confirmPassword')     // Password confirmation
  .whenChanged('age', 'emergencyContact')           // Age affects emergency contact
  .group(['firstName', 'lastName', 'email'])        // Contact group
  .build();

// ❌ MANUAL: Verbose, error-prone
protected readonly validationConfig: ValidationConfigMap<FormModel> = {
  'password': ['confirmPassword'],
  'confirmPassword': ['password'],
  'age': ['emergencyContact'],
  'firstName': ['lastName', 'email'],
  'lastName': ['firstName', 'email'],
  'email': ['firstName', 'lastName'],
};
```

**Builder Methods:**
- `whenChanged(trigger, dependents)` - One-way: when trigger changes, revalidate dependents
- `bidirectional(field1, field2)` - Two-way: fields revalidate each other
- `group(fields)` - All fields in group revalidate each other
- `merge(config)` - Combine with existing configurations

**Benefits:**
- ✅ Full IDE autocomplete for field names
- ✅ Compile-time type checking (catches typos)
- ✅ Self-documenting code (intent is clear)
- ✅ Less boilerplate (no manual bidirectional setup)

#### Reactive validationConfig for Conditional Fields

**CRITICAL**: When using `validationConfig` with conditionally rendered fields (`@if` blocks), make it a **computed signal** to prevent "control not found" warnings:

```typescript
import { ValidationConfigMap } from 'ngx-vest-forms';

// ❌ WRONG: Static config references controls that may not exist
protected readonly validationConfig: ValidationConfigMap<FormModel> = {
  'gender': ['genderOther'],           // genderOther only exists when gender='Other'
  'quantity': ['justification']        // justification only exists when quantity > 5
};

// ✅ CORRECT: Computed config with builder API (recommended)
protected readonly validationConfig = computed(() => {
  const builder = createValidationConfig<FormModel>();

  // Only add dependency when the field actually exists in DOM
  if (this.formValue().gender === 'Other') {
    builder.whenChanged('gender', 'genderOther');
  }

  if ((this.formValue().quantity || 0) > 5) {
    builder.bidirectional('quantity', 'justification');
  }

  return builder.build();
});

// ✅ ALSO CORRECT: Computed config with manual object (legacy)
protected readonly validationConfig = computed<ValidationConfigMap<FormModel>>(() => {
  const config: ValidationConfigMap<FormModel> = {};

  if (this.formValue().gender === 'Other') {
    config['gender'] = ['genderOther'];
  }

  if ((this.formValue().quantity || 0) > 5) {
    config['quantity'] = ['justification'];
    config['justification'] = ['quantity'];  // Bidirectional
  }

  return config;
});
```

**Template binding:**

```typescript
<form ngxVestForm [validationConfig]="validationConfig()" ...>
  <input name="quantity" [ngModel]="formValue().quantity" />

  @if ((formValue().quantity || 0) > 5) {
    <textarea name="justification" [ngModel]="formValue().justification"></textarea>
  }
</form>
```

**Why this is necessary:**

1. Static config is evaluated once at component initialization
2. If referenced controls don't exist in DOM, Angular throws warnings
3. Computed signal reactively rebuilds config based on current field visibility
4. Prevents race conditions with conditional field rendering

### Conditional UI

```typescript
protected readonly showShipping = computed(() =>
  this.formValue().addresses?.differentShipping
);

// Template: @if (showShipping()) { <div ngModelGroup="shipping">...</div> }
```

## Validation Features: Three Complementary Tools

ngx-vest-forms provides three features for handling validation in complex, dynamic forms. These serve different purposes and often work together:

### validationConfig vs ngxValidateRootForm vs triggerFormValidation()

| Feature                       | Purpose                                        | Error Location                       | Use Cases                                        |
| ----------------------------- | ---------------------------------------------- | ------------------------------------ | ------------------------------------------------ |
| **`validationConfig`**        | **Re-validation trigger** when fields change   | **Field level** (`errors.fieldName`) | Fields that need re-validation when others change |
| **`ngxValidateRootForm`**        | Creates **form-level** validations             | **Form level** (`errors.rootForm`)   | Form-wide business rules                         |
| **`triggerFormValidation()`** | Manual validation trigger for structure changes | N/A (triggers existing validations)  | Structure changes without value changes          |

### Quick Decision Guide

**Use `validationConfig` when:**
- ☑ Field Y's **validation logic** checks field X's value
- ☑ When field X **changes**, field Y needs **re-validation**
- ☑ Need **automatic re-validation trigger**
- ☑ Examples: Password confirmation, quantity ↔ justification

**Use `ngxValidateRootForm` when:**
- ☑ Error belongs to **entire form** (not a specific field)
- ☑ Rule involves multiple unrelated fields
- ☑ Examples: "Brecht is not 30", at least one contact method

**Use `triggerFormValidation()` when:**
- ☑ Switching from **input field → non-input content** (e.g., `<input>` → `<p>`)
- ☑ Structure changes **without** value changes
- ☑ Clearing fields programmatically (when removing inputs entirely)
- ☑ Examples: Toggle between form input and informational paragraph

**NOT needed when:**
- ☒ Switching between different input fields (value changes trigger validation automatically)
- ☒ Showing all errors on regular form submit (automatic with `on-blur-or-submit` mode)

**CRITICAL: `triggerFormValidation()` does NOT mark fields as touched or show errors.**

It only re-runs validation logic.

> **Note on automatic behavior:** With the default `on-blur-or-submit` error display mode, errors are shown automatically when you submit via `(ngSubmit)`. The form internally calls `markAllAsTouched()` on submit. You only need to call `markAllAsTouched()` manually for special cases.

```typescript
// Standard form submission - NO manual call needed!
// Errors shown automatically via (ngSubmit) with default on-blur-or-submit mode
<form ngxVestForm (ngSubmit)="save()">
  <!-- ... -->
  <button type="submit">Submit</button>
</form>

save() {
  if (this.formValid()) {
    // Submit logic - errors already shown automatically if validation fails
  }
}

// Multiple forms with one button - NEED manual markAllAsTouched()
submitBoth() {
  this.form1().markAllAsTouched();
  this.form2().markAllAsTouched();
  if (this.form1().valid && this.form2().valid) {
    // Submit logic
  }
}

// Structure change: Re-run validation (doesn't show errors)
onTypeChange(newType: string) {
  this.formValue.update(v => ({ ...v, type: newType }));
  this.vestFormRef().triggerFormValidation();  // Updates validity state
}

// Both together (rare): Structure changed AND show errors immediately
onComplexChange() {
  this.formValue.update(v => ({ ...v, type: 'new' }));
  this.vestFormRef().triggerFormValidation();
  this.vestFormRef().markAllAsTouched();  // Only if you need to show errors immediately
}
```

**Use ALL THREE when:**
- ☑ Complex dynamic forms with field dependencies, form-level rules, AND structure changes
- ☑ Examples: Multi-step forms, purchase forms with conditional sections

> **📖 See Complete Guide**: `.github/instructions/VALIDATION-CONFIG-VS-ROOT-FORM.md` for detailed comparison, decision trees, and working examples.

## Error Display

### Built-in Control Wrapper

```typescript
<ngx-control-wrapper>
  <input name="email" [ngModel]="formValue().email"/>
  <!-- Errors display automatically -->
</ngx-control-wrapper>
```

### Error Display Modes

- `on-blur-or-submit` (default) - Show after blur OR submit
- `on-blur` - Show after blur only
- `on-submit` - Show after submit only

```typescript
// Global config
provide(NGX_ERROR_DISPLAY_MODE_TOKEN, { useValue: 'on-submit' })

// Per-instance
<div formErrorDisplay [errorDisplayMode]="'on-blur'">...</div>
```

### Custom Wrappers

```typescript
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormErrorDisplayDirective, createDebouncedPendingState } from 'ngx-vest-forms';

@Component({
  selector: 'ngx-custom-wrapper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: FormErrorDisplayDirective, inputs: ['errorDisplayMode'] }],
  template: `
    <ng-content />
    @if (errorDisplay.shouldShowErrors()) {
      <div role="alert" aria-live="polite">
        @for (error of errorDisplay.errors(); track error) { <span>{{ error }}</span> }
      </div>
    }
    @if (showPendingMessage()) {
      <div aria-busy="true" role="status" aria-live="polite">Validating...</div>
    }
  `
})
export class CustomWrapperComponent {
  protected readonly errorDisplay = inject(FormErrorDisplayDirective, { self: true });

  // Debounced pending state to prevent flashing for quick validations
  private readonly pendingState = createDebouncedPendingState(
    this.errorDisplay.isPending,
    { showAfter: 200, minimumDisplay: 500 }
  );
  protected readonly showPendingMessage = this.pendingState.showPendingMessage;
}
```

**Available signals:** `shouldShowErrors()`, `errors()`, `warnings()`, `isPending()`, `isTouched()`, `isDirty()`, `isValid()`, `isInvalid()`, `errorMessages()`, `warningMessages()`, `updateOn()`, `formSubmitted()`

**Debounced Pending State:**

The `createDebouncedPendingState()` utility prevents validation messages from flashing for quick async validations:
- **200ms delay** - Pending message only shows if validation takes longer than 200ms
- **500ms minimum** - Once shown, message stays visible for at least 500ms to prevent flickering
- Use with `errorDisplay.isPending` signal for optimal UX

### Accessibility & ARIA Compliance

The `ngx-control-wrapper` component automatically provides WCAG 2.2 AA compliant ARIA attributes:

**Automatic Features:**
- ✅ **Unique IDs** - Each error/warning/pending region gets a unique ID
- ✅ **aria-describedby** - Form controls automatically associated with error messages
- ✅ **aria-invalid** - Set to `"true"` on form controls when errors should be shown
- ✅ **Proper ARIA roles**:
  - Errors: `role="alert"` with `aria-live="assertive"` (blocking issues)
  - Warnings: `role="status"` with `aria-live="polite"` (non-blocking guidance)
  - Pending: `role="status"` with `aria-live="polite"` (validation in progress)
- ✅ **aria-atomic="true"** - Complete message announcements for screen readers
- ✅ **Decorative elements hidden** - Spinner marked with `aria-hidden="true"`

**Example Usage:**
```typescript
<ngx-control-wrapper>
  <label for="email">Email Address</label>
  <input id="email" name="email" [ngModel]="formValue().email" />
  <!--
    When validation fails:
    - Input gets aria-invalid="true"
    - Input gets aria-describedby="ngx-control-wrapper-0-error"
    - Error message has matching id and role="alert"
    - Screen reader announces: "Email is required" assertively
  -->
</ngx-control-wrapper>
```

**Custom Wrappers - ARIA Best Practices:**

When creating custom wrappers, follow these patterns:

```typescript
@Component({
  selector: 'ngx-accessible-wrapper',
  template: `
    <ng-content />

    @if (errorDisplay.shouldShowErrors()) {
      <div
        [id]="errorId"
        role="alert"
        aria-live="assertive"
        aria-atomic="true">
        @for (error of errorDisplay.errors(); track error) {
          <p>{{ error }}</p>
        }
      </div>
    }

    @if (errorDisplay.warnings().length > 0) {
      <div
        [id]="warningId"
        role="status"
        aria-live="polite"
        aria-atomic="true">
        @for (warn of errorDisplay.warnings(); track warn) {
          <p>{{ warn }}</p>
        }
      </div>
    }

    @if (errorDisplay.isPending()) {
      <div
        [id]="pendingId"
        role="status"
        aria-live="polite"
        aria-atomic="true">
        <span aria-hidden="true">⏳</span>
        Validating…
      </div>
    }
  `
})
export class AccessibleWrapperComponent implements AfterContentInit {
  protected readonly errorDisplay = inject(FormErrorDisplayDirective, { self: true });
  private readonly elementRef = inject(ElementRef);

  // Generate unique IDs
  private static nextId = 0;
  protected readonly uniqueId = `custom-wrapper-${AccessibleWrapperComponent.nextId++}`;
  protected readonly errorId = `${this.uniqueId}-error`;
  protected readonly warningId = `${this.uniqueId}-warning`;
  protected readonly pendingId = `${this.uniqueId}-pending`;

  ngAfterContentInit(): void {
    // Find all form controls and associate them with error messages
    const controls = this.elementRef.nativeElement.querySelectorAll('input, select, textarea');

    effect(() => {
      const ids: string[] = [];
      if (this.errorDisplay.shouldShowErrors()) ids.push(this.errorId);
      if (this.errorDisplay.warnings().length > 0) ids.push(this.warningId);
      if (this.errorDisplay.isPending()) ids.push(this.pendingId);

      const describedBy = ids.length > 0 ? ids.join(' ') : null;
      const shouldShowErrors = this.errorDisplay.shouldShowErrors();

      controls.forEach(control => {
        if (describedBy) {
          control.setAttribute('aria-describedby', describedBy);
        } else {
          control.removeAttribute('aria-describedby');
        }

        if (shouldShowErrors) {
          control.setAttribute('aria-invalid', 'true');
        } else {
          control.removeAttribute('aria-invalid');
        }
      });
    });
  }
}
```

**Key ARIA Guidelines:**
1. **Always use `role="alert"` for errors** - These are blocking issues that prevent form submission
2. **Always use `role="status"` for warnings and pending** - These are non-blocking updates
3. **Set `aria-atomic="true"`** - Ensures complete message is announced, not just changes
4. **Use `aria-hidden="true"` for decorative icons** - Prevents screen readers from announcing meaningless content
5. **Associate messages with controls via `aria-describedby`** - Screen reader users can move to control and still hear the error
6. **Set `aria-invalid="true"` only when errors should be shown** - Indicates validation state to assistive technologies

> **📖 For comprehensive accessibility guidance**, see `.github/instructions/a11y.instructions.md`

### Root Form Validation

Root form validation enables form-level validations that span multiple fields (e.g., password confirmation, cross-field dependencies).

#### Validation Modes

Root form validations check relationships between multiple fields. The mode determines when these validations run.

**Submit Mode (default)** - Validates only after form submission:
```typescript
<form
  ngxVestForm
  ngxValidateRootForm
  [ngxValidateRootFormMode]="'submit'"
  (errorsChange)="errors.set($event)">
  <!-- Validation triggered on submit -->
</form>
```

**Why 'submit' is the default:**

Root form validations like `"Brecht Billiet cannot be 30"` check multiple fields (`firstName` + `lastName` + `age`). In 'live' mode:
- User types "B" → ❌ Error appears immediately (but user hasn't finished typing!)
- User types "Brecht" → ❌ Still showing error (hasn't reached lastName yet)
- User types "Billiet" → ❌ Still showing error (hasn't reached age yet)

This creates terrible UX - users see errors for validations they cannot possibly satisfy yet.

Submit mode waits until the user attempts to submit (when all fields are likely filled), providing clear, actionable feedback.

**Live Mode** - Validates on every value change:
```typescript
<form
  ngxVestForm
  ngxValidateRootForm
  [ngxValidateRootFormMode]="'live'"
  (errorsChange)="errors.set($event)">
  <!-- Validation triggered on every change -->
</form>
```

**When to use 'live' mode:**
- Migrating from v2 and need identical behavior
- Simple two-field comparisons where immediate feedback is helpful
- You have a specific UX requirement for real-time validation

**Recommendation:** Use `'submit'` mode (default) for almost all cases. Root form validations are cross-field rules that users can only fix after filling multiple inputs.#### Validation Suite Pattern

```typescript
import { ROOT_FORM } from 'ngx-vest-forms';
import { staticSuite, test, enforce, only } from 'vest';

export const suite = staticSuite((model: FormModel, field?) => {
  only(field);

  // Regular field validations
  test('password', 'Required', () => enforce(model.password).isNotBlank());
  test('confirmPassword', 'Required', () => enforce(model.confirmPassword).isNotBlank());

  // Root form validation (cross-field)
  test(ROOT_FORM, 'Passwords must match', () => {
    enforce(model.password).equals(model.confirmPassword);
  });
});
```

#### Component Setup

```typescript
import { Component, signal } from '@angular/core';
import { ROOT_FORM } from 'ngx-vest-forms';

@Component({
  template: `
    <form
      ngxVestForm
      [suite]="suite"
      [formValue]="formValue()"
      ngxValidateRootForm
      [ngxValidateRootFormMode]="'submit'"
      (formValueChange)="formValue.set($event)"
      (errorsChange)="errors.set($event)">

      <input name="password" [ngModel]="formValue().password" />
      <input name="confirmPassword" [ngModel]="formValue().confirmPassword" />

      @if (errors()[ROOT_FORM]) {
        <div role="alert">{{ errors()[ROOT_FORM][0] }}</div>
      }

      <button type="submit">Submit</button>
    </form>
  `
})
export class MyFormComponent {
  protected readonly ROOT_FORM = ROOT_FORM;
  protected readonly formValue = signal<FormModel>({});
  protected readonly errors = signal<Record<string, string[]>>({});
  protected readonly suite = mySuite;
}
```

**When to use:**
- ✅ Cross-field validation (password confirmation, date ranges)
- ✅ Form-level business rules
- ✅ Submit-only validation (default prevents premature errors)
- ✅ Live validation (set mode to `'live'` for immediate feedback)

> **⚠️ Breaking Change**: Default mode changed from `'live'` to `'submit'`. To preserve old behavior, explicitly set `[ngxValidateRootFormMode]="'live'"`.

## Advanced Features

### Nested Components: `vestFormsViewProviders`

**CRITICAL**: Any component with `ngModelGroup` MUST use `vestFormsViewProviders`:

```typescript
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { vestForms, vestFormsViewProviders } from 'ngx-vest-forms';

@Component({
  selector: 'ngx-address-form',
  imports: [vestForms],
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [vestFormsViewProviders], // Required!
  template: `<div ngModelGroup="address">...</div>`
})
```

### Field Clearing Utilities

```typescript
// Conditional clearing
this.formValue.update(v => clearFieldsWhen(v, { fieldA: condition, fieldB: !condition }));

// Unconditional clearing
this.formValue.update(v => clearFields(v, ['tempData', 'draft']));

// Whitelist approach
this.formValue.update(v => keepFieldsWhen(v, { basic: true, shipping: needsShipping }));
```

### Public Utility Functions

```typescript
setValueAtPath(obj, path, value) // Set nested value (e.g., 'user.name', 'John')
stringifyFieldPath(segments)     // Convert path array to dot notation string
```

### Array ↔ Object Conversion Utilities

Angular template-driven forms struggle with arrays. Converting arrays to objects with numeric keys enables `ngModelGroup` to work properly with dynamic arrays (phone numbers, addresses, etc.).

```typescript
import { arrayToObject, deepArrayToObject, objectToArray } from 'ngx-vest-forms';

// FORM LOAD: Convert backend arrays → form-compatible objects
const phoneNumbers = ['123-4567', '987-6543'];
const formModel = {
  phoneNumbers: arrayToObject(phoneNumbers)  // {0: '123-4567', 1: '987-6543'}
};

// Deep conversion for nested arrays
const addresses = [
  { street: 'Main St', phones: ['111', '222'] },
  { street: '2nd Ave', phones: ['333'] }
];
const deepModel = {
  addresses: deepArrayToObject(addresses)
  // {
  //   0: { street: 'Main St', phones: {0: '111', 1: '222'} },
  //   1: { street: '2nd Ave', phones: {0: '333'} }
  // }
};

// FORM SUBMIT: Convert back to arrays for backend
const submitData = objectToArray(formModel, ['phoneNumbers']);
// { phoneNumbers: ['123-4567', '987-6543'] }

// Selective deep conversion (specify which properties)
const deepSubmit = objectToArray(deepModel, ['addresses', 'phones']);
// {
//   addresses: [
//     { street: 'Main St', phones: ['111', '222'] },
//     { street: '2nd Ave', phones: ['333'] }
//   ]
// }
```

**Complete workflow example:**

```typescript
import { Component, signal } from '@angular/core';
import { arrayToObject, objectToArray, deepArrayToObject } from 'ngx-vest-forms';

type BackendData = {
  phoneNumbers: string[];
  tags: string[];
};

type FormModel = {
  phoneNumbers: { [key: number]: string };
  tags: { [key: number]: string };
  name?: string;
};

@Component({
  // ...
})
export class MyFormComponent {
  protected readonly formValue = signal<FormModel>({});

  // Load data from backend
  async ngOnInit() {
    const backendData = await this.api.load(); // { phoneNumbers: ['123', '456'], tags: ['tag1'] }

    // Convert arrays to objects for form
    this.formValue.set({
      name: backendData.name,
      phoneNumbers: arrayToObject(backendData.phoneNumbers),
      tags: arrayToObject(backendData.tags)
    });
  }

  // Submit data to backend
  async save() {
    const formData = this.formValue();

    // Convert objects back to arrays for backend
    const backendData = objectToArray(formData, ['phoneNumbers', 'tags']);
    // { name: '...', phoneNumbers: ['123', '456'], tags: ['tag1'] }

    await this.api.save(backendData);
  }

  // Add item dynamically
  addPhoneNumber(newNumber: string) {
    this.formValue.update(v => ({
      ...v,
      phoneNumbers: arrayToObject([
        ...Object.values(v.phoneNumbers || {}),
        newNumber
      ])
    }));
  }

  // Remove item dynamically
  removePhoneNumber(index: number) {
    this.formValue.update(v => {
      const phones = Object.values(v.phoneNumbers || {})
        .filter((_, i) => i !== index);
      return { ...v, phoneNumbers: arrayToObject(phones) };
    });
  }
}
```

**Template usage:**

```html
<form ngxVestForm [suite]="suite" (formValueChange)="formValue.set($event)">
  <!-- Use ngModelGroup with numeric keys -->
  <div *ngFor="let phoneKV of formValue().phoneNumbers | keyvalue: originalOrder">
    <div [ngModelGroup]="phoneKV.key">
      <input name="number" [ngModel]="phoneKV.value" />
      <button type="button" (click)="removePhoneNumber(+phoneKV.key)">Remove</button>
    </div>
  </div>

  <button type="button" (click)="addPhoneNumber('')">Add Phone</button>
</form>
```

**When to use which:**
- `arrayToObject()` - Shallow conversion, single-level arrays
- `deepArrayToObject()` - Convert all nested arrays recursively
- `objectToArray()` - Selective conversion back to arrays (specify keys)

> **Note:** Use `structuredClone()` instead of deprecated `cloneDeep()` for object cloning

### Field Path Types and Utilities

ngx-vest-forms provides comprehensive type-safe field path support with IDE autocomplete and compile-time validation.

> **📖 Complete Guide**: See [Field Path Types Documentation](../../docs/FIELD-PATHS.md) for comprehensive coverage of type-safe field references, autocomplete patterns, and best practices.

#### Field Path Type Utilities

```typescript
import { FieldPath, ValidationConfigMap, FormFieldName, FieldPathValue } from 'ngx-vest-forms';

type FormModel = NgxDeepPartial<{
  user: {
    email: string;
    profile: { age: number; }
  }
}>;

// ✅ FieldPath<T> - All valid field paths with autocomplete
type Paths = FieldPath<FormModel>;
// Result: 'user' | 'user.email' | 'user.profile' | 'user.profile.age'

// ✅ ValidationConfigMap<T> - Type-safe validation config
const config: ValidationConfigMap<FormModel> = {
  'user.email': ['user.profile.age'],  // Autocomplete for all paths!
};

// ✅ FormFieldName<T> - Field names for Vest suites (includes ROOT_FORM)
export const suite: NgxVestSuite<FormModel> = staticSuite(
  (model: FormModel, field?: string) => {
    only(field);
    // Field parameter accepts any string field name
  }
);

// ✅ FieldPathValue<T, Path> - Infer value type at path
type EmailType = FieldPathValue<FormModel, 'user.email'>; // string
type AgeType = FieldPathValue<FormModel, 'user.profile.age'>; // number
```

#### Field Path Runtime Utilities

Convert path segment arrays to dot/bracket notation strings:

```typescript
import { stringifyFieldPath } from 'ngx-vest-forms';

// Stringify: ['addresses', 0, 'street'] → 'addresses[0].street'
const path = stringifyFieldPath(['addresses', 0, 'street']);
// 'addresses[0].street'

// Works with nested arrays and complex structures
stringifyFieldPath(['form', 'sections', 0, 'fields', 'name']);
// 'form.sections[0].fields.name'
```

**Use cases:**
- Converting path arrays to Vest.js field names
- Integrating with Standard Schema validation
- Building dynamic form field paths

### Other Features

- **Shape Validation**: `[formShape]="shape"` - Dev mode validation of `name` attributes
- **Validation Options**: `[validationOptions]="{ debounceTime: 300 }"`
- **Form Arrays**: See [guide](https://blog.simplified.courses/template-driven-forms-with-form-arrays/)
- **NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN**: Injection token for configurable dependent field validation debounce timing (default: 100ms)

## Utility Types and Functions Quick Reference

> **📖 Complete Documentation**: See [Utility Types & Functions README](../../projects/ngx-vest-forms/src/lib/utils/README.md) for detailed examples, use cases, and workflows.

### Available Utilities Summary

| Category | Function | Purpose | Section |
|----------|----------|---------|---------|
| **Types** | `NgxDeepPartial<T>` | Optional properties (form models) | [Essential Patterns](#type-safe-form-models) |
| | `NgxDeepRequired<T>` | Required properties (shapes) | [Essential Patterns](#type-safe-form-models) |
| | `NgxFormCompatibleDeepRequired<T>` | Date compatibility | [Essential Patterns](#type-safe-form-models) |
| | `NgxVestSuite<T>` | Cleaner suite types | [Validation Patterns](#validation-patterns) |
| | `NgxFieldKey<T>` | Field name autocomplete (legacy) | [Validation Patterns](#validation-patterns) |
| | `NgxFormState<T>` | Form state type | [Advanced Features](#utility-functions) |
| **Field Paths** | `FieldPath<T>` | Type-safe field paths | [Field Path Types](#field-path-types-and-utilities) |
| | `ValidationConfigMap<T>` | Type-safe validation config | [Field Path Types](#field-path-types-and-utilities) |
| | `FormFieldName<T>` | Field names for Vest suites | [Field Path Types](#field-path-types-and-utilities) |
| | `FieldPathValue<T, Path>` | Infer value type at path | [Field Path Types](#field-path-types-and-utilities) |
| | `LeafFieldPath<T>` | Extract leaf paths only | [Field Path Types](#field-path-types-and-utilities) |
| **Forms** | `createEmptyFormState()` | Safe fallback state | [Form State Type](#form-state-type-and-utilities) |
| | `setValueAtPath()` | Set nested values | [Advanced Features](#public-utility-functions) |
| **Arrays** | `arrayToObject()` | Array → Object (shallow) | [Advanced Features](#array--object-conversion-utilities) |
| | `deepArrayToObject()` | Array → Object (deep) | [Advanced Features](#array--object-conversion-utilities) |
| | `objectToArray()` | Object → Array (selective) | [Advanced Features](#array--object-conversion-utilities) |
| **Paths** | `stringifyFieldPath()` | Segments → String | [Advanced Features](#field-path-runtime-utilities) |
| **Clearing** | `clearFieldsWhen()` | Conditional clear | [Advanced Features](#field-clearing-utilities) |
| | `clearFields()` | Unconditional clear | [Advanced Features](#field-clearing-utilities) |
| | `keepFieldsWhen()` | Whitelist keep | [Advanced Features](#field-clearing-utilities) |
| **Validation** | `createValidationConfig<T>()` | Fluent builder for validation config | See [Builder Guide](../../docs/VALIDATION-CONFIG-BUILDER.md) |

**Import Path:** All utilities are exported from `'ngx-vest-forms'`

**Naming Convention:**
- ✅ **Recommended**: Use `Ngx`-prefixed versions (`NgxDeepPartial`, `NgxDeepRequired`, etc.)
- ⚠️ **Legacy**: Non-prefixed aliases available for backward compatibility (`DeepPartial`, `DeepRequired`, etc.)

The `Ngx` prefix prevents naming conflicts with other libraries and clearly identifies ngx-vest-forms utilities.

## Common Patterns

```typescript
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ... other config
})
export class MyFormComponent {
  // Loading state
  protected readonly isLoading = signal(false);

  async save() {
    this.isLoading.set(true);
    try { await this.api.submit(this.formValue()); }
    finally { this.isLoading.set(false); }
  }

  // Form reset
  resetForm() { this.formValue.set({}); }

  // Prefill form
  ngOnInit() { this.formValue.set({ firstName: 'John', lastName: 'Doe' }); }
}
```

### validationConfig vs ngxValidateRootForm: When to Use What

**Two complementary features for cross-field validation:**

| Feature | Purpose | Errors Appear At | Use For |
|---------|---------|------------------|---------|
| **`validationConfig`** | Controls **when** field validations run | **Field level** (`errors.fieldName`) | Field validations that depend on other fields |
| **`ngxValidateRootForm`** | Creates **form-level** validations | **Form level** (`errors.rootForm`) | Form-wide business rules |**Key Insight**: These solve different problems and work together!

> **📖 Complete Guide**: See [ValidationConfig vs ROOT_FORM Validation](../../docs/VALIDATION-CONFIG-VS-ROOT-FORM.md) for detailed comparison, decision trees, and common mistakes.

**Quick Decision Guide:**

Use `validationConfig` when:
- ✅ Error belongs to a **specific field** (e.g., `confirmPassword`)
- ✅ One field's validation **depends on another** (password ↔ confirmPassword)
- ✅ Using `omitWhen` for conditional requirements (age triggers emergencyContact)

Use `ngxValidateRootForm` when:
- ✅ Error belongs to the **entire form**, not a specific field
- ✅ Rule validates **multiple fields together** as business constraint
- ✅ Example: "Brecht is not 30 anymore" (firstName + lastName + age)

### Other Use Cases

| Use Case | Solution |
|----------|----------|
| Conditional validation logic | Vest.js `omitWhen()` |
| Default error display | Built-in `ngx-control-wrapper` |
| Custom error display (Material, etc.) | Custom wrapper with `FormErrorDisplayDirective` as hostDirective |

## Common Gotchas

| ❌ Wrong | ✅ Correct |
|---------|-----------|
| `[(ngModel)]="formValue().firstName"` | `[ngModel]="formValue().firstName"` |
| `[ngModel]="formValue().info.firstName"` | `[ngModel]="formValue().info?.firstName"` |
| `if (field) { only(field); }` | `only(field);` (unconditional call) |
| `suite((model) => { test(...) })` | `suite((model, field?) => { only(field); })` |
| `suite: StaticSuite<string, string, ...>` | `suite: NgxVestSuite<MyModel>` (cleaner!) |
| Nested component without `viewProviders` | `viewProviders: [vestFormsViewProviders]` |
| `validateRootForm` without mode | `ngxValidateRootForm [ngxValidateRootFormMode]="'submit'"` (explicit mode recommended) |## Best Practices

1. Use `NgxDeepPartial<T>` for form models (forms build incrementally, Ngx-prefixed recommended)
2. **CRITICAL**: Always call `only(field)` **unconditionally** in validation suites (breaking change - fixes omitWhen + validationConfig bugs)
3. Match `name` attributes exactly to property paths
4. Use `vestFormsViewProviders` in nested components with `ngModelGroup`
5. Use computed signals for conditional UI
6. Type validation suites with `NgxVestSuite<T>` for cleaner API (replaces verbose StaticSuite generics)
7. Use `NgxFieldKey<T>` for field parameter to get autocomplete hints (optional)
8. Compose validation suites for reusability (see vest.instructions.md)
9. Handle async validations with AbortController (see vest.instructions.md)
10. Test validation suites independently (they're just functions)
11. Use shape validation in development (catches typos)
12. Use `NgxFormCompatibleDeepRequired` for date fields accepting Date | string
13. Choose appropriate error display mode: `on-blur`, `on-submit`, or `on-blur-or-submit`
14. Use `FormErrorDisplayDirective` as hostDirective for custom wrappers
15. Respect accessibility (ARIA attributes: `role="alert"`, `aria-live`, `aria-busy`)
16. Use field clearing utilities when switching between form/non-form content
17. Use `stringifyFieldPath()` utility for converting path arrays to field names
18. Use array conversion utilities (`arrayToObject`/`objectToArray`) for form arrays
19. Use `structuredClone()` for deep cloning objects (native browser API)
20. **Always use `ChangeDetectionStrategy.OnPush`** for optimal performance with signals
21. Use `inject()` function instead of constructor injection
22. Prefer signal-based APIs (`viewChild()`, `input()`, `output()`) over decorators

## Resources

### Core Documentation
- [Field Path Types Guide](../../docs/FIELD-PATHS.md) - Complete guide to type-safe field references with autocomplete
- [Utility Types & Functions](../../projects/ngx-vest-forms/src/lib/utils/README.md) - Comprehensive API reference
- [Complete Example](../../docs/COMPLETE-EXAMPLE.md) - Full working example from start to finish
- [Migration Guide (v1.x → v2.0.0)](../../docs/migration/MIGRATION-v1.x-to-v2.0.0.md) - Upgrading from v1.x to v2.0.0
- [Selector Prefix Migration Guide](../../docs/SELECTOR-PREFIX-MIGRATION.md) - Migrating from sc- to ngx- prefix

### External Resources
- [Original Blog](https://blog.simplified.courses/introducing-ngx-vest-forms/) • [Vest.js Docs](https://vestjs.dev/) • [Angular Forms](https://angular.dev/guide/forms/template-driven-forms) • [Form Arrays](https://blog.simplified.courses/template-driven-forms-with-form-arrays/) • [Async Validation](https://blog.simplified.courses/asynchronous-form-validators-in-angular-with-vest/)

