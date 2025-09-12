# GitHub Copilot Instructions

## Priority Guidelines

When generating code for this repository:

1. **Version Compatibility**: Always detect and respect the exact versions of languages, frameworks, and libraries used in this project
2. **Specialized Instructions**: For detailed guidance, reference these comprehensive instruction files:
   - **`.github/instructions/ngx-vest-forms.instructions.md`** - Complete guide for using ngx-vest-forms library
   - **`.github/instructions/vest.instructions.md`** - Comprehensive Vest.js validation patterns and best practices
3. **Context Files**: Prioritize patterns and standards defined in the .github/copilot directory
4. **Codebase Patterns**: When context files don't provide specific guidance, scan the codebase for established patterns
5. **Architectural Consistency**: Maintain our Layered architectural style and established boundaries
6. **Code Quality**: Prioritize maintainability, performance, security, and testability in all generated code

## Technology Version Detection

Before generating code, scan the codebase to identify:

1. **Language Versions**: Detect the exact versions of programming languages in use
   - **Angular**: >=18.0.0 (Signals support required)
   - **TypeScript**: >=5.8.0 (for modern Angular features)
   - **Node.js**: >=22.0.0 (required for Angular 18+)
   - Never use language features beyond the detected version

2. **Framework Versions**: Identify the exact versions of all frameworks
   - **Angular**: >=18.0.0 with standalone components and signals
   - **RxJS**: >=7.8.0 for reactive programming
   - **Vest.js**: >=5.4.6 for validation (critical: use `staticSuite` and `only()` pattern)
   - Respect version constraints when generating code

3. **Library Versions**: Note the exact versions of key libraries and dependencies
   - **Jest**: For unit testing with `jest-preset-angular`
   - **Storybook**: For component testing and documentation
   - Generate code compatible with these specific versions

## Project Overview
This is an Angular library that provides a lightweight adapter between Angular template-driven forms and Vest.js validation. The library enables unidirectional data flow in forms with sophisticated async validations and conditional logic.

**Key Architecture:**
- **Library Project**: `projects/ngx-vest-forms/` - The exportable Angular library
- **Examples Project**: `projects/examples/` - Demo application showcasing usage patterns
- **Monorepo Structure**: Uses Angular CLI workspace with separate build targets

## Workspace Structure

This workspace follows Angular CLI monorepo patterns with:
- **Root Configuration**: Angular workspace configuration and shared tooling
- **Library Development**: Core ngx-vest-forms implementation in `projects/ngx-vest-forms/`
- **Example Applications**: Demonstration and testing in `projects/examples/`
- **Documentation**: Comprehensive guides in `.github/instructions/`
- **Testing Infrastructure**: Jest for unit tests, Storybook for component testing

## Codebase Scanning Instructions

When context files don't provide specific guidance:

1. Identify similar files to the one being modified or created
2. Analyze patterns for:
   - Naming conventions (camelCase for properties, kebab-case for component selectors)
   - Code organization (barrel exports in public-api.ts, feature-based organization)
   - Error handling (signal-based error state management)
   - Validation patterns (staticSuite with only() optimization)
   - Testing patterns (Jest with interaction tests in Storybook)

3. Follow the most consistent patterns found in the codebase
4. When conflicting patterns exist, prioritize patterns in newer files or files with higher test coverage
5. Never introduce patterns not found in the existing codebase

## Workspace-Specific Guidelines

### Library Development Workflow
When working on the ngx-vest-forms library:
1. **Implementation**: Add features in `projects/ngx-vest-forms/src/lib/`
2. **Public API**: Export new functionality in `projects/ngx-vest-forms/src/public-api.ts`
3. **Examples**: Create usage examples in `projects/examples/src/app/`
4. **Testing**: Add Storybook stories in `projects/ngx-vest-forms/src/lib/testing/`
5. **Documentation**: Update instruction files in `.github/instructions/`

### Example Application Development
When working on the examples project:
1. **Component Structure**: Follow established smart/ui component patterns
2. **Validation Patterns**: Reference `.github/instructions/vest.instructions.md`
3. **Form Implementation**: Reference `.github/instructions/ngx-vest-forms.instructions.md`
4. **Model Definitions**: Place in `projects/examples/src/app/models/`
5. **Validation Suites**: Place in `projects/examples/src/app/validations/`

## Core Concepts

### CRITICAL: Name Attribute Matching
**The `name` attribute MUST exactly match the property path used in `[ngModel]` bindings.**

For comprehensive examples and patterns, see `.github/instructions/ngx-vest-forms.instructions.md`

```typescript
// ✅ CORRECT: name matches the property path
<input name="firstName" [ngModel]="formValue().firstName" />
<input name="addresses.billingAddress.street" [ngModel]="formValue().addresses?.billingAddress?.street" />

// ❌ WRONG: name doesn't match property path
<input name="first_name" [ngModel]="formValue().firstName" />
```

This is essential for:
- Form control creation and binding
- Validation error mapping
- Shape validation in development mode
- Proper unidirectional data flow### Form Models & Typing
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
- **Performance Optimization**: Always use `only(field)` pattern for field-level validation

## Key Development Patterns

### Validation Suite Pattern
Always structure validation suites with the `only()` pattern for optimal performance.

> **Complete Validation Patterns**: See `.github/instructions/vest.instructions.md` for comprehensive validation patterns and performance optimization.

```typescript
export const validationSuite = staticSuite(
  (model: FormModel, field?: string) => {
    if (field) { only(field); } // Critical for performance

    test('firstName', 'First name is required', () => {
      enforce(model.firstName).isNotBlank();
    });
  }
);
```

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

## Code Quality Standards

### Maintainability
- Write self-documenting code with clear naming following existing patterns
- Follow the naming and organization conventions evident in the codebase
- Keep functions focused on single responsibilities matching existing patterns
- Limit function complexity and length to match existing patterns

### Performance
- Always use `only(field)` pattern in validation suites for optimal performance
- Follow existing patterns for memory and resource management
- Apply signal-based state management consistently with existing patterns
- Use computed signals for derived state matching existing code

### Security
- Follow existing patterns for input validation
- Apply the same sanitization techniques used in the codebase
- Handle sensitive data according to existing patterns

### Testability
- Follow established patterns for testable code using Jest
- Match dependency injection approaches used in the codebase
- Apply the same patterns for managing dependencies
- Follow established mocking and test double patterns in Storybook

## Documentation Requirements

- Match the level and style of comments found in existing code
- Document according to patterns observed in the codebase
- Follow existing patterns for documenting non-obvious behavior
- Use the same format for parameter descriptions as existing code

## Angular Guidelines

- Detect and adhere to the specific Angular version in use (>=18.0.0)
- Match component structure patterns from existing components
- Follow the same signal and lifecycle patterns found in the codebase
- Apply the same state management approach used in existing components
- Use standalone components consistently with existing patterns
- Follow template-driven forms patterns exactly as implemented

## Common Gotchas
- Always use `?` operator in templates due to `DeepPartial` typing
- Shape validation only runs in development mode
- Form controls are created dynamically - avoid direct form control references
- Use `ROOT_FORM` constant for form-level validations
- Validation options can be set at form, group, or control level for debouncing
- Always include `field?: string` parameter and `only(field)` pattern in validation suites
- Never call `only()` or `skip()` conditionally - use conditional arguments instead
- **CRITICAL**: The `name` attribute must exactly match the property path in `[ngModel]`

## References
- Original library concept: https://blog.simplified.courses/introducing-ngx-vest-forms/
- Created by Brecht Billiet, evolved for Angular 18+ with signals

## Chat Guidelines
- Do not use emojis in the chat responses, except for checking off tasks
- Always verify version compatibility before suggesting code changes
- Prioritize consistency with existing codebase patterns over external best practices
