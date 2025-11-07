---
description: Comprehensive guide for using ngx-vest-forms, an Angular adapter for Vest.js validation with template-driven forms.
applyTo: '**/*.ts, **/*.html'
---
# ngx-vest-forms: Angular Template-Driven Forms with Vest.js Validation

Lightweight adapter bridging Angular template-driven forms with Vest.js validation by [Brecht Billiet](https://blog.simplified.courses/introducing-ngx-vest-forms/).

**Core Principles:**
- Use `[ngModel]` NOT `[(ngModel)]` for unidirectional data flow
- `DeepPartial<T>` for form models (forms build incrementally)
- `only(field)` in all validation suites for performance
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

// Error Display
import { FormErrorDisplayDirective, FormControlStateDirective, SC_ERROR_DISPLAY_MODE_TOKEN, ScErrorDisplayMode } from 'ngx-vest-forms';

// Constants & Utilities
import { ROOT_FORM, VALIDATION_CONFIG_DEBOUNCE_TIME } from 'ngx-vest-forms';
import { clearFieldsWhen, clearFields, keepFieldsWhen } from 'ngx-vest-forms';
import { getAllFormErrors, getFormControlField, getFormGroupField, mergeValuesAndRawValues } from 'ngx-vest-forms';
import { parseFieldPath, stringifyFieldPath } from 'ngx-vest-forms';

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
  if (field) { only(field); } // CRITICAL for performance
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
  protected readonly suite = mySuite;
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

### Validation Patterns

```typescript
// Basic suite with performance optimization (using NgxVestSuite type)
export const suite: NgxVestSuite<FormModel> = staticSuite((model, field?) => {
  if (field) { only(field); } // ALWAYS include this

  test('email', 'Required', () => enforce(model.email).isNotBlank());
  test('email', 'Invalid', () => enforce(model.email).isEmail());
});

// With type-safe field parameter (optional - adds autocomplete hints)
export const typedSuite = staticSuite((model: FormModel, field?: NgxFieldKey<FormModel>) => {
  if (field) { only(field); } // Autocomplete for field names!
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

```typescript
// Component: Tell Angular which fields depend on each other
protected readonly validationConfig = {
  'password': ['confirmPassword'],
  'age': ['emergencyContact']
};

// Suite: Define the validation logic
omitWhen(!model.password || !model.confirmPassword, () => {
  test('confirmPassword', 'Passwords must match', () => {
    enforce(model.confirmPassword).equals(model.password);
  });
});
```

### Conditional UI

```typescript
protected readonly showShipping = computed(() =>
  this.formValue().addresses?.differentShipping
);

// Template: @if (showShipping()) { <div ngModelGroup="shipping">...</div> }
```

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

```typescript
// Suite
test(ROOT_FORM, 'Form-level error', () => enforce(condition).isTruthy());

// Component
<form scVestForm [validateRootForm]="true" (errorsChange)="errors.set($event)"></form>
```

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
```

### Field Path Utilities

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

### When to Use What

| Use Case | Solution |
|----------|----------|
| Conditional validation logic | Vest.js `omitWhen()` |
| Trigger dependent field revalidation | `validationConfig` |
| Default error display | Built-in `sc-control-wrapper` |
| Custom error display (Material, etc.) | Custom wrapper with `FormErrorDisplayDirective` as hostDirective |

## Common Gotchas

| ❌ Wrong | ✅ Correct |
|---------|-----------|
| `[(ngModel)]="formValue().firstName"` | `[ngModel]="formValue().firstName"` |
| `[ngModel]="formValue().info.firstName"` | `[ngModel]="formValue().info?.firstName"` |
| `suite((model) => { test(...) })` | `suite((model, field?) => { if(field) only(field); })` |
| `suite: StaticSuite<string, string, ...>` | `suite: NgxVestSuite<MyModel>` (cleaner!) |
| Nested component without `viewProviders` | `viewProviders: [vestFormsViewProviders]` |

## Best Practices

1. Use `NgxDeepPartial<T>` for form models (forms build incrementally, Ngx-prefixed recommended)
2. Always include `if (field) { only(field); }` in validation suites (performance)
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
18. **Always use `ChangeDetectionStrategy.OnPush`** for optimal performance with signals
19. Use `inject()` function instead of constructor injection
20. Prefer signal-based APIs (`viewChild()`, `input()`, `output()`) over decorators

## Resources

- [Original Blog](https://blog.simplified.courses/introducing-ngx-vest-forms/) • [Vest.js Docs](https://vestjs.dev/) • [Angular Forms](https://angular.dev/guide/forms/template-driven-forms) • [Form Arrays](https://blog.simplified.courses/template-driven-forms-with-form-arrays/) • [Async Validation](https://blog.simplified.courses/asynchronous-form-validators-in-angular-with-vest/)

Created by [Brecht Billiet](https://twitter.com/brechtbilliet)
