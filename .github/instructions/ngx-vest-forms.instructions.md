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

// Error Display
import { FormErrorDisplayDirective, FormControlStateDirective, SC_ERROR_DISPLAY_MODE_TOKEN, ScErrorDisplayMode } from 'ngx-vest-forms';

// Constants & Utilities
import { ROOT_FORM, VALIDATION_CONFIG_DEBOUNCE_TIME } from 'ngx-vest-forms';
import { clearFieldsWhen, clearFields, keepFieldsWhen } from 'ngx-vest-forms';
import { getAllFormErrors, getFormControlField, getFormGroupField, mergeValuesAndRawValues, setValueAtPath } from 'ngx-vest-forms';
import { parseFieldPath, stringifyFieldPath } from 'ngx-vest-forms';
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
    <form scVestForm [suite]="suite" (formValueChange)="formValue.set($event)">
      <div sc-control-wrapper>
        <input name="firstName" [ngModel]="formValue().firstName"/>
      </div>
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
    <app-child-form #childForm />
    <div>Valid: {{ formState().valid }}</div>
    <div>Errors: {{ formState().errors | json }}</div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParentComponent {
  // Modern Angular 20+: Use viewChild() instead of @ViewChild
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

> **⚠️ BREAKING CHANGE**: You MUST now call `only()` unconditionally. The old `if (field)` pattern breaks Vest's execution tracking. See [Migration Guide](../../docs/PR-60-CHANGES.md#migration-guide).

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

#### Reactive validationConfig for Conditional Fields

**CRITICAL**: When using `validationConfig` with conditionally rendered fields (`@if` blocks), make it a **computed signal** to prevent "control not found" warnings:

```typescript
import { ValidationConfigMap } from 'ngx-vest-forms';

// ❌ WRONG: Static config references controls that may not exist
protected readonly validationConfig: ValidationConfigMap<FormModel> = {
  'gender': ['genderOther'],           // genderOther only exists when gender='Other'
  'quantity': ['justification']        // justification only exists when quantity > 5
};

// ✅ CORRECT: Computed config only references existing controls with type safety
protected readonly validationConfig = computed<ValidationConfigMap<FormModel>>(() => {
  const config: ValidationConfigMap<FormModel> = {};

  // Only add dependency when the field actually exists in DOM
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
<form scVestForm [validationConfig]="validationConfig()" ...>
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

### validationConfig vs validateRootForm vs triggerFormValidation()

| Feature                       | Purpose                                        | Error Location                       | Use Cases                                        |
| ----------------------------- | ---------------------------------------------- | ------------------------------------ | ------------------------------------------------ |
| **`validationConfig`**        | **Re-validation trigger** when fields change   | **Field level** (`errors.fieldName`) | Fields that need re-validation when others change |
| **`validateRootForm`**        | Creates **form-level** validations             | **Form level** (`errors.rootForm`)   | Form-wide business rules                         |
| **`triggerFormValidation()`** | Manual validation trigger for structure changes | N/A (triggers existing validations)  | Structure changes without value changes          |

### Quick Decision Guide

**Use `validationConfig` when:**
- ☑ Field Y's **validation logic** checks field X's value
- ☑ When field X **changes**, field Y needs **re-validation**
- ☑ Need **automatic re-validation trigger**
- ☑ Examples: Password confirmation, quantity ↔ justification

**Use `validateRootForm` when:**
- ☑ Error belongs to **entire form** (not a specific field)
- ☑ Rule involves multiple unrelated fields
- ☑ Examples: "Brecht is not 30", at least one contact method

**Use `triggerFormValidation()` when:**
- ☑ Form **structure changes** without value changes
- ☑ Switching between inputs and non-form content
- ☑ Clearing fields programmatically
- ☑ Examples: Dynamic form modes, conditional layouts

**Use ALL THREE when:**
- ☑ Complex dynamic forms with field dependencies, form-level rules, AND structure changes
- ☑ Examples: Multi-step forms, purchase forms with conditional sections

> **📖 See Complete Guide**: `.github/instructions/VALIDATION-CONFIG-VS-ROOT-FORM.md` for detailed comparison, decision trees, and working examples.

## Error Display

### Built-in Control Wrapper

```typescript
<div sc-control-wrapper>
  <input name="email" [ngModel]="formValue().email"/>
  <!-- Errors display automatically -->
</div>
```

### Error Display Modes

- `on-blur-or-submit` (default) - Show after blur OR submit
- `on-blur` - Show after blur only
- `on-submit` - Show after submit only

```typescript
// Global config
provide(SC_ERROR_DISPLAY_MODE_TOKEN, { useValue: 'on-submit' })

// Per-instance
<div formErrorDisplay [errorDisplayMode]="'on-blur'">...</div>
```

### Custom Wrappers

```typescript
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormErrorDisplayDirective } from 'ngx-vest-forms';

@Component({
  selector: 'app-custom-wrapper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: FormErrorDisplayDirective, inputs: ['errorDisplayMode'] }],
  template: `
    <ng-content />
    @if (errorDisplay.shouldShowErrors()) {
      <div role="alert" aria-live="polite">
        @for (error of errorDisplay.errors(); track error) { <span>{{ error }}</span> }
      </div>
    }
    @if (errorDisplay.isPending()) { <div aria-busy="true">Validating...</div> }
  `
})
export class CustomWrapperComponent {
  protected readonly errorDisplay = inject(FormErrorDisplayDirective, { self: true });
}
```

**Available signals:** `shouldShowErrors()`, `errors()`, `warnings()`, `isPending()`, `isTouched()`, `isDirty()`, `isValid()`, `isInvalid()`, `errorMessages()`, `warningMessages()`, `updateOn()`, `formSubmitted()`

### Root Form Validation

Root form validation enables form-level validations that span multiple fields (e.g., password confirmation, cross-field dependencies).

#### Validation Modes

Root form validations check relationships between multiple fields. The mode determines when these validations run.

**Submit Mode (default)** - Validates only after form submission:
```typescript
<form
  scVestForm
  validateRootForm
  [validateRootFormMode]="'submit'"
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
  scVestForm
  validateRootForm
  [validateRootFormMode]="'live'"
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
      scVestForm
      [suite]="suite"
      [formValue]="formValue()"
      validateRootForm
      [validateRootFormMode]="'submit'"
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

> **⚠️ Breaking Change**: Default mode changed from `'live'` to `'submit'`. To preserve old behavior, explicitly set `[validateRootFormMode]="'live'"`.

## Advanced Features

### Nested Components: `vestFormsViewProviders`

**CRITICAL**: Any component with `ngModelGroup` MUST use `vestFormsViewProviders`:

```typescript
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { vestForms, vestFormsViewProviders } from 'ngx-vest-forms';

@Component({
  selector: 'app-address-form',
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

### Utility Functions

```typescript
getAllFormErrors(form)           // Get all errors by path
getFormControlField(root, ctrl)  // Get dot-notation path of control
getFormGroupField(root, group)   // Get dot-notation path of group
mergeValuesAndRawValues(form)    // Include disabled fields in value
setValueAtPath(obj, path, value) // Set nested value (e.g., 'user.name', 'John')
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
  async onSubmit() {
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
<form scVestForm [suite]="suite" (formValueChange)="formValue.set($event)">
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

Convert between different field path formats (useful for Standard Schema integration, Angular forms, and Vest.js field names):

```typescript
import { parseFieldPath, stringifyFieldPath } from 'ngx-vest-forms';

// Parse: 'addresses[0].street' → ['addresses', 0, 'street']
const segments = parseFieldPath('addresses[0].street');
// ['addresses', 0, 'street']

// Stringify: ['addresses', 0, 'street'] → 'addresses[0].street'
const path = stringifyFieldPath(['addresses', 0, 'street']);
// 'addresses[0].street'

// Works with nested arrays and complex structures
parseFieldPath('users[0].contacts[1].email');
// ['users', 0, 'contacts', 1, 'email']

stringifyFieldPath(['form', 'sections', 0, 'fields', 'name']);
// 'form.sections[0].fields.name'
```

**Use cases:**
- Converting Angular form paths to Vest.js field names
- Integrating with Standard Schema validation
- Manipulating nested form structures programmatically
- Building dynamic form field paths

### Other Features

- **Shape Validation**: `[formShape]="shape"` - Dev mode validation of `name` attributes
- **Validation Options**: `[validationOptions]="{ debounceTime: 300 }"`
- **Form Arrays**: See [guide](https://blog.simplified.courses/template-driven-forms-with-form-arrays/)
- **VALIDATION_CONFIG_DEBOUNCE_TIME**: Constant (100ms) controlling dependent field validation timing

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
| **Forms** | `createEmptyFormState()` | Safe fallback state | [Advanced Features](#utility-functions) |
| | `getAllFormErrors()` | Get all error paths | [Advanced Features](#utility-functions) |
| | `setValueAtPath()` | Set nested values | [Advanced Features](#utility-functions) |
| | `getFormControlField()` | Get control path | [Advanced Features](#utility-functions) |
| | `getFormGroupField()` | Get group path | [Advanced Features](#utility-functions) |
| | `mergeValuesAndRawValues()` | Include disabled fields | [Advanced Features](#utility-functions) |
| **Arrays** | `arrayToObject()` | Array → Object (shallow) | [Advanced Features](#array--object-conversion-utilities) |
| | `deepArrayToObject()` | Array → Object (deep) | [Advanced Features](#array--object-conversion-utilities) |
| | `objectToArray()` | Object → Array (selective) | [Advanced Features](#array--object-conversion-utilities) |
| **Paths** | `parseFieldPath()` | String → Segments | [Advanced Features](#field-path-utilities) |
| | `stringifyFieldPath()` | Segments → String | [Advanced Features](#field-path-utilities) |
| **Clearing** | `clearFieldsWhen()` | Conditional clear | [Advanced Features](#field-clearing-utilities) |
| | `clearFields()` | Unconditional clear | [Advanced Features](#field-clearing-utilities) |
| | `keepFieldsWhen()` | Whitelist keep | [Advanced Features](#field-clearing-utilities) |
| **Equality** | `shallowEqual()` | Fast comparison | See README |
| | `fastDeepEqual()` | Deep comparison | See README |
| **Validation** | `validateShape()` | Dev mode shape check | See README |

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

  async onSubmit() {
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

### validationConfig vs validateRootForm: When to Use What

**Two complementary features for cross-field validation:**

| Feature | Purpose | Errors Appear At | Use For |
|---------|---------|------------------|---------|
| **`validationConfig`** | Controls **when** field validations run | **Field level** (`errors.fieldName`) | Field validations that depend on other fields |
| **`validateRootForm`** | Creates **form-level** validations | **Form level** (`errors.rootForm`) | Form-wide business rules |

**Key Insight**: These solve different problems and work together!

> **📖 Complete Guide**: See [ValidationConfig vs ROOT_FORM Validation](../../docs/VALIDATION-CONFIG-VS-ROOT-FORM.md) for detailed comparison, decision trees, and common mistakes.

**Quick Decision Guide:**

Use `validationConfig` when:
- ✅ Error belongs to a **specific field** (e.g., `confirmPassword`)
- ✅ One field's validation **depends on another** (password ↔ confirmPassword)
- ✅ Using `omitWhen` for conditional requirements (age triggers emergencyContact)

Use `validateRootForm` when:
- ✅ Error belongs to the **entire form**, not a specific field
- ✅ Rule validates **multiple fields together** as business constraint
- ✅ Example: "Brecht is not 30 anymore" (firstName + lastName + age)

### Other Use Cases

| Use Case | Solution |
|----------|----------|
| Conditional validation logic | Vest.js `omitWhen()` |
| Default error display | Built-in `sc-control-wrapper` |
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
| `validateRootForm` without mode (v2 behavior) | `validateRootForm [validateRootFormMode]="'live'"` (explicit mode) |

## Best Practices

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
17. Use field path utilities (`parseFieldPath`/`stringifyFieldPath`) for Standard Schema integration
18. Use array conversion utilities (`arrayToObject`/`objectToArray`) for form arrays
19. Use `structuredClone()` instead of deprecated `cloneDeep()` for object cloning
20. **Always use `ChangeDetectionStrategy.OnPush`** for optimal performance with signals
21. Use `inject()` function instead of constructor injection
22. Prefer signal-based APIs (`viewChild()`, `input()`, `output()`) over decorators

## Resources

### Core Documentation
- [Field Path Types Guide](../../docs/FIELD-PATHS.md) - Complete guide to type-safe field references with autocomplete
- [Utility Types & Functions](../../projects/ngx-vest-forms/src/lib/utils/README.md) - Comprehensive API reference
- [Complete Example](../../docs/COMPLETE-EXAMPLE.md) - Full working example from start to finish
- [Migration Guide](../../docs/MIGRATION.md) - Upgrading from previous versions

### External Resources
- [Original Blog](https://blog.simplified.courses/introducing-ngx-vest-forms/) • [Vest.js Docs](https://vestjs.dev/) • [Angular Forms](https://angular.dev/guide/forms/template-driven-forms) • [Form Arrays](https://blog.simplified.courses/template-driven-forms-with-form-arrays/) • [Async Validation](https://blog.simplified.courses/asynchronous-form-validators-in-angular-with-vest/)

