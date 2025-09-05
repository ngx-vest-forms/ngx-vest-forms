# ngx-vest-forms Development Guide

## Project Overview
This is an Angular library that provides a lightweight adapter between Angular template-driven forms and Vest.js validation. The library enables unidirectional data flow in forms with sophisticated async validations and conditional logic.

**Key Architecture:**
- **Library Project**: `projects/ngx-vest-forms/` - The exportable Angular library
- **Examples Project**: `projects/examples/` - Demo application showcasing usage patterns
- **Monorepo Structure**: Uses Angular CLI workspace with separate build targets

## Core Concepts

### Form Models & Typing
Always use `DeepPartial<T>` for form models since Angular template-driven forms build incrementally:
```typescript
type MyFormModel = DeepPartial<{
  generalInfo: { firstName: string; lastName: string; }
}>
```

Create corresponding shapes using `DeepRequired<T>` for runtime validation:
```typescript
export const myFormShape: DeepRequired<MyFormModel> = {
  generalInfo: { firstName: '', lastName: '' }
};
```

### Unidirectional Data Flow Pattern
Use `[ngModel]` (NOT `[(ngModel)]`) with signals for unidirectional updates:
```typescript
// Component
protected readonly formValue = signal<MyFormModel>({});

// Template
<input [ngModel]="formValue().generalInfo?.firstName" name="firstName"/>
<form scVestForm (formValueChange)="formValue.set($event)">
```

### Validation Architecture
- **Vest Suites**: Reusable validation functions using `staticSuite()` from vest.js
- **Field-based**: Use dot notation (`addresses.billingAddress.street`) for nested validation
- **Conditional**: Use `omitWhen()` for conditional validations
- **Async Support**: Built-in support for async validations with AbortController

## Key Development Patterns

### Creating Composable Validations
Break validations into reusable functions:
```typescript
// address.validations.ts
export function addressValidations(model: AddressModel | undefined, field: string): void {
  test(`${field}.street`, 'Street is required', () => {
    enforce(model?.street).isNotBlank();
  });
}

// Main suite
addressValidations(model.addresses?.billingAddress, 'addresses.billingAddress');
```

### Validation Configuration Dependencies
Use `validationConfig` to trigger dependent field validations:
```typescript
protected readonly validationConfig = {
  'passwords.password': ['passwords.confirmPassword'],
  age: ['emergencyContact']
};
```

### Conditional UI with Computed Signals
Use computed signals for showing/hiding form sections:
```typescript
protected readonly showShippingAddress = computed(() =>
  this.formValue().addresses?.shippingAddressDifferentFromBillingAddress
);
```

## Development Workflow

### Build Commands
- `npm run build:lib` - Build the library package
- `npm run build:app` - Build the examples application
- `npm start` - Serve examples app (port 4200)
- `npm run api` - Start JSON server backend for examples

### Testing
- `npm test` or `npm run test:lib` - Run Jest unit tests
- `npm run test:storybook` - Run Storybook interaction tests
- Tests use Jest with `jest-preset-angular`

### Library Development
When adding new features to the library:
1. Add implementation in `projects/ngx-vest-forms/src/lib/`
2. Export in `projects/ngx-vest-forms/src/public-api.ts`
3. Add usage examples in `projects/examples/`
4. Update Storybook stories in `projects/ngx-vest-forms/src/lib/testing/`

## Critical File Locations

### Library Core
- `projects/ngx-vest-forms/src/lib/directives/form.directive.ts` - Main `scVestForm` directive
- `projects/ngx-vest-forms/src/lib/components/control-wrapper/` - Error display component
- `projects/ngx-vest-forms/src/lib/utils/form-utils.ts` - Form manipulation utilities
- `projects/ngx-vest-forms/src/lib/exports.ts` - Library exports and module definition

### Examples & Patterns
- `projects/examples/src/app/validations/` - Example validation suites
- `projects/examples/src/app/models/` - Form model patterns
- `projects/examples/src/app/components/smart/purchase-form/` - Complex form example

## Integration Points

### Angular Forms Integration
The library hooks into Angular's template-driven forms via:
- `FormDirective` extends `NgForm` functionality
- `FormModelDirective` and `FormModelGroupDirective` implement `AsyncValidator`
- Automatic validator creation from Vest suites

### Vest.js Integration
- Uses `staticSuite()` for performance optimization
- Supports `only()` for field-specific validation
- Built-in async validation with signal support
- Error mapping from Vest results to Angular form errors

## Common Gotchas
- Always use `?` operator in templates due to `DeepPartial` typing
- Shape validation only runs in development mode
- Form controls are created dynamically - avoid direct form control references
- Use `ROOT_FORM` constant for form-level validations
- Validation options can be set at form, group, or control level for debouncing
https://blog.simplified.courses/introducing-ngx-vest-forms/
