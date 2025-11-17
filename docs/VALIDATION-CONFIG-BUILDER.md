# ValidationConfig Fluent Builder API

The `ValidationConfigBuilder` provides a type-safe, fluent API for creating validation configuration objects. This builder simplifies the process of defining field dependencies and ensures correctness through compile-time type checking.

> **💡 Critical Insight**: `validationConfig` is **essential** when using Vest.js's `omitWhen`/`skipWhen` for conditional validations. It ensures Angular re-validates dependent fields when conditions change, preventing stale validation states in dynamic forms.

## Table of Contents

- [Quick Start](#quick-start)
- [Why ValidationConfig Matters](#why-validationconfig-matters)
- [Core Concepts](#core-concepts)
- [API Reference](#api-reference)
  - [whenChanged()](#whenchanged)
  - [bidirectional()](#bidirectional)
  - [group()](#group)
  - [merge()](#merge)
  - [build()](#build)
- [Common Patterns](#common-patterns)
- [Migration Guide](#migration-guide)
- [Best Practices](#best-practices)

## Quick Start

```typescript
import { createValidationConfig, type NgxDeepPartial } from 'ngx-vest-forms';

type MyFormModel = NgxDeepPartial<{
  password: string;
  confirmPassword: string;
  email: string;
}>;

@Component({
  // ...
})
export class MyFormComponent {
  // ✅ Type-safe with autocomplete
  protected readonly validationConfig = createValidationConfig<MyFormModel>()
    .bidirectional('password', 'confirmPassword')
    .whenChanged('email', 'password')
    .build();
}
```

## Why ValidationConfig Matters

### The Problem: Conditional Validations Need Dependency Tracking

When using Vest.js's `omitWhen` or `skipWhen` for conditional validations, Angular doesn't automatically know which fields should re-validate when conditions change. This can lead to **stale validation states**.

**Example Scenario:**

```typescript
// Vest validation suite with conditional logic
export const suite = staticSuite((model, field?) => {
  only(field);

  test('country', 'Required', () => {
    enforce(model.country).isNotBlank();
  });

  // State field only required when country is 'USA'
  omitWhen(model.country !== 'USA', () => {
    test('state', 'State is required for USA', () => {
      enforce(model.state).isNotBlank();
    });
  });
});
```

**Without ValidationConfig:**

1. User selects country = "Canada" → no state validation (correct)
2. User selects country = "USA" → **state field doesn't re-validate automatically!**
3. Result: Form appears valid even though state is now required

**With ValidationConfig:**

```typescript
protected readonly validationConfig = createValidationConfig<FormModel>()
  .whenChanged('country', 'state')  // When country changes, revalidate state
  .build();
```

Now when country changes to "USA", Angular automatically re-validates the state field, showing the required error.

### Why This Happens

Vest.js validation suites are **declarative** - they describe what should be valid **at the moment they run**. But Angular's change detection doesn't know:

- Which fields have conditional logic
- When conditions change that affect other fields
- Which fields need re-validation when a value changes

**ValidationConfig bridges this gap** by explicitly telling Angular: "When field A changes, re-validate fields B, C, D because their validation rules might depend on A's value."

### When You MUST Use ValidationConfig

Use ValidationConfig whenever you have:

- ✅ **`omitWhen` or `skipWhen`** - Conditional validation based on other field values
- ✅ **Field comparisons** - Password confirmation, min/max ranges, date ranges
- ✅ **Dependent requirements** - "Field B required when Field A = X"
- ✅ **Cascading validations** - Country → State → City dependencies
- ✅ **"At least one" rules** - Email OR Phone OR Address required

### When ValidationConfig is Optional

You may not need it for:

- ❌ **Independent validations** - Each field validates only its own value
- ❌ **Static rules** - Validation logic never changes based on other fields
- ❌ **Simple forms** - Single-field validations with no dependencies

### Real-World Impact

**Without ValidationConfig + omitWhen:**

```typescript
// ❌ Broken: State validation doesn't update when country changes
omitWhen(model.country !== 'USA', () => {
  test('state', 'Required for USA', () => {
    enforce(model.state).isNotBlank();
  });
});

// User flow:
// 1. Select Canada → no state error (correct)
// 2. Change to USA → no state error shown (WRONG! Should show error)
// 3. User submits invalid form → confusing UX
```

**With ValidationConfig + omitWhen:**

```typescript
// ✅ Works correctly: State re-validates when country changes
protected readonly validationConfig = createValidationConfig<FormModel>()
  .whenChanged('country', 'state')
  .build();

omitWhen(model.country !== 'USA', () => {
  test('state', 'Required for USA', () => {
    enforce(model.state).isNotBlank();
  });
});

// User flow:
// 1. Select Canada → no state error (correct)
// 2. Change to USA → state error appears immediately (correct!)
// 3. User sees validation feedback in real-time → better UX
```

### The Golden Rule

> **Always use ValidationConfig with conditional Vest.js validations (`omitWhen`/`skipWhen`/`optional`)**. It's not just an optimization - it's essential for correct validation behavior in dynamic forms.

## Core Concepts

### What is a Validation Configuration?

A validation configuration defines **dependent field validations** - when field A changes, which other fields should be revalidated?

**Without Builder (Manual):**

```typescript
// ❌ Verbose, error-prone, no type safety
protected readonly validationConfig = {
  'password': ['confirmPassword'],
  'confirmPassword': ['password'], // Easy to forget reverse dependency
  'email': ['password'],
};
```

**With Builder:**

```typescript
// ✅ Clean, type-safe, self-documenting
protected readonly validationConfig = createValidationConfig<MyFormModel>()
  .bidirectional('password', 'confirmPassword')
  .whenChanged('email', 'password')
  .build();
```

### Type Safety Benefits

- **IDE Autocomplete**: Get suggestions for all valid field paths
- **Compile-time Errors**: Catch typos before runtime
- **Refactoring Support**: Rename properties and all references update
- **Self-documenting**: Intent is clear from method names

## API Reference

### whenChanged()

Add a one-way dependency: when the trigger field changes, revalidate dependent fields.

**Signature:**

```typescript
whenChanged<K extends FieldPath<T>>(
  trigger: K,
  revalidate: FieldPath<T> | FieldPath<T>[]
): this
```

**Examples:**

```typescript
// Single dependent
createValidationConfig<FormModel>()
  .whenChanged('password', 'confirmPassword')
  .build();
// Result: { password: ['confirmPassword'] }

// Multiple dependents
createValidationConfig<FormModel>()
  .whenChanged('country', ['state', 'zipCode', 'city'])
  .build();
// Result: { country: ['state', 'zipCode', 'city'] }

// Cumulative calls (same trigger)
createValidationConfig<FormModel>()
  .whenChanged('password', 'confirmPassword')
  .whenChanged('password', 'securityScore')
  .build();
// Result: { password: ['confirmPassword', 'securityScore'] }

// Nested field paths
createValidationConfig<FormModel>()
  .whenChanged('addresses.billing.country', 'addresses.billing.state')
  .build();
```

**Use Cases:**

- Conditional validations (country → state/zipCode)
- Dependent calculations (quantity/price → total)
- Security validations (password → strength indicator)

---

### bidirectional()

Add a two-way dependency: when either field changes, revalidate the other.

**Signature:**

```typescript
bidirectional<K1 extends FieldPath<T>, K2 extends FieldPath<T>>(
  field1: K1,
  field2: K2
): this
```

**Examples:**

```typescript
// Password confirmation
createValidationConfig<FormModel>()
  .bidirectional('password', 'confirmPassword')
  .build();
// Result: {
//   password: ['confirmPassword'],
//   confirmPassword: ['password']
// }

// Date ranges
createValidationConfig<FormModel>()
  .bidirectional('startDate', 'endDate')
  .build();

// Price ranges
createValidationConfig<FormModel>()
  .bidirectional('minPrice', 'maxPrice')
  .build();

// Multiple bidirectional relationships
createValidationConfig<FormModel>()
  .bidirectional('password', 'confirmPassword')
  .bidirectional('startDate', 'endDate')
  .bidirectional('minPrice', 'maxPrice')
  .build();
```

**Use Cases:**

- Password/confirmation matching
- Min/max range validations
- Start/end date validations
- Any mutual dependency

---

### group()

Create a validation group where all fields revalidate each other.

**Signature:**

```typescript
group<K extends FieldPath<T>>(fields: K[]): this
```

**Examples:**

```typescript
// Contact information group
createValidationConfig<FormModel>()
  .group(['firstName', 'lastName', 'email'])
  .build();
// Result: {
//   firstName: ['lastName', 'email'],
//   lastName: ['firstName', 'email'],
//   email: ['firstName', 'lastName']
// }

// Address validation group
createValidationConfig<FormModel>()
  .group(['street', 'city', 'state', 'zipCode'])
  .build();

// Nested field paths
createValidationConfig<FormModel>()
  .group([
    'addresses.billing.street',
    'addresses.billing.city',
    'addresses.billing.zipCode',
  ])
  .build();
```

**Use Cases:**

- Fields that collectively form a validation rule
- "At least one required" scenarios
- Interdependent field sets

**Performance Note:** Creates N×(N-1) dependencies. For large groups (>10 fields), consider using `whenChanged()` for more targeted dependencies.

---

### merge()

Merge with an existing validation configuration.

**Signature:**

```typescript
merge(other: ValidationConfigMap<T>): this
```

**Examples:**

```typescript
// Conditional configuration
const internationalConfig = isInternational
  ? { country: ['customsForm', 'taxId'] }
  : {};

createValidationConfig<FormModel>()
  .bidirectional('password', 'confirmPassword')
  .merge(internationalConfig)
  .build();

// Composition from multiple sources
const addressConfig = { street: ['city', 'zipCode'] };
const contactConfig = { email: ['phone'] };

createValidationConfig<FormModel>()
  .merge(addressConfig)
  .merge(contactConfig)
  .build();

// Merge and deduplicate
const baseConfig = { password: ['confirmPassword'] };

createValidationConfig<FormModel>()
  .whenChanged('password', 'email')
  .merge(baseConfig)
  .build();
// Result: { password: ['email', 'confirmPassword'] }
```

**Use Cases:**

- Conditional configurations based on runtime state
- Composing configurations from multiple sources
- Reusing base configurations
- Dynamic configuration building

---

### build()

Build the final validation configuration object.

**Signature:**

```typescript
build(): ValidationConfigMap<T>
```

**Returns:** A deep copy of the configuration (immutable from builder's perspective).

**Examples:**

```typescript
const config = createValidationConfig<FormModel>()
  .bidirectional('password', 'confirmPassword')
  .build();

// Use in component
@Component({
  // ...
})
export class MyComponent {
  protected readonly validationConfig = createValidationConfig<MyFormModel>()
    .bidirectional('password', 'confirmPassword')
    .whenChanged('country', 'state')
    .build();
}
```

**Note:** The builder remains reusable after calling `build()`. You can continue chaining methods and build again.

---

## Common Patterns

### Password Confirmation

```typescript
createValidationConfig<FormModel>()
  .bidirectional('password', 'confirmPassword')
  .build();
```

### Date Range Validation

```typescript
createValidationConfig<FormModel>()
  .bidirectional('startDate', 'endDate')
  .build();
```

### Address with Country Dependencies

```typescript
createValidationConfig<FormModel>()
  .whenChanged('country', ['state', 'zipCode', 'province'])
  .group(['street', 'city', 'zipCode'])
  .build();
```

### Contact Information Group

```typescript
createValidationConfig<FormModel>()
  .group(['email', 'phone', 'alternateEmail'])
  .build();
```

### Complex Form with Multiple Patterns

```typescript
type OrderFormModel = NgxDeepPartial<{
  // Customer info
  firstName: string;
  lastName: string;
  email: string;

  // Authentication
  password: string;
  confirmPassword: string;

  // Date range
  startDate: Date;
  endDate: Date;

  // Price range
  minPrice: number;
  maxPrice: number;

  // Location
  country: string;
  state: string;
  zipCode: string;

  // Order details
  orderType: string;
  deliveryDate: Date;
  priority: string;
}>;

protected readonly validationConfig = createValidationConfig<OrderFormModel>()
  // Customer info group
  .group(['firstName', 'lastName', 'email'])

  // Password confirmation
  .bidirectional('password', 'confirmPassword')

  // Date range
  .bidirectional('startDate', 'endDate')

  // Price range
  .bidirectional('minPrice', 'maxPrice')

  // Location dependencies
  .whenChanged('country', ['state', 'zipCode'])

  // Order type affects delivery
  .whenChanged('orderType', ['deliveryDate', 'priority'])

  .build();
```

### Conditional Configuration

```typescript
@Component({
  // ...
})
export class CheckoutComponent {
  private readonly isInternational = signal(false);

  protected readonly validationConfig = computed(() => {
    const builder = createValidationConfig<CheckoutFormModel>()
      .bidirectional('password', 'confirmPassword')
      .whenChanged('country', 'state');

    // Add international-specific validations
    if (this.isInternational()) {
      builder
        .whenChanged('country', 'customsForm')
        .whenChanged('country', 'taxId');
    }

    return builder.build();
  });
}
```

### Nested Field Paths

```typescript
type FormModel = NgxDeepPartial<{
  addresses: {
    billing: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    shipping: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
  };
}>;

protected readonly validationConfig = createValidationConfig<FormModel>()
  // Billing address group
  .group([
    'addresses.billing.street',
    'addresses.billing.city',
    'addresses.billing.zipCode'
  ])

  // Country affects state for billing
  .whenChanged('addresses.billing.country', 'addresses.billing.state')

  // Shipping address group
  .group([
    'addresses.shipping.street',
    'addresses.shipping.city',
    'addresses.shipping.zipCode'
  ])

  .build();
```

## Migration Guide

### From Manual Configuration

**Before:**

```typescript
protected readonly validationConfig = {
  'password': ['confirmPassword'],
  'confirmPassword': ['password'],
  'startDate': ['endDate'],
  'endDate': ['startDate'],
  'country': ['state', 'zipCode'],
};
```

**After:**

```typescript
protected readonly validationConfig = createValidationConfig<MyFormModel>()
  .bidirectional('password', 'confirmPassword')
  .bidirectional('startDate', 'endDate')
  .whenChanged('country', ['state', 'zipCode'])
  .build();
```

### From Untyped to Typed

**Before:**

```typescript
protected readonly validationConfig = {
  'pasword': ['confirmPassword'], // ❌ Typo not caught
};
```

**After:**

```typescript
protected readonly validationConfig = createValidationConfig<MyFormModel>()
  .bidirectional('pasword', 'confirmPassword') // ✅ TypeScript error!
  .build();
```

## Best Practices

### 1. Always Use Type Parameter

```typescript
// ✅ Good - full type safety
createValidationConfig<MyFormModel>();

// ❌ Bad - no autocomplete or type checking
createValidationConfig();
```

### 2. Use Descriptive Method Names

The builder API is self-documenting. Choose the method that best describes the relationship:

```typescript
// ✅ Clear intent
.bidirectional('password', 'confirmPassword')
.whenChanged('country', 'state')
.group(['firstName', 'lastName', 'email'])

// ❌ Less clear
.whenChanged('password', 'confirmPassword')
.whenChanged('confirmPassword', 'password')
```

### 3. Chain Related Configurations

Group related validation rules together:

```typescript
createValidationConfig<FormModel>()
  // Authentication section
  .bidirectional('password', 'confirmPassword')
  .whenChanged('password', 'securityScore')

  // Date section
  .bidirectional('startDate', 'endDate')

  // Location section
  .whenChanged('country', ['state', 'zipCode'])

  .build();
```

### 4. Extract Complex Configurations

For very large forms, consider extracting configuration builders into separate functions:

```typescript
function createAuthConfig<T>() {
  return createValidationConfig<T>()
    .bidirectional('password', 'confirmPassword')
    .whenChanged('password', 'securityScore');
}

function createAddressConfig<T>() {
  return createValidationConfig<T>()
    .whenChanged('country', ['state', 'zipCode'])
    .group(['street', 'city', 'zipCode']);
}

protected readonly validationConfig = createAuthConfig<FormModel>()
  .merge(createAddressConfig<FormModel>().build())
  .build();
```

### 5. Use Signals for Dynamic Configuration

When validation config depends on runtime state, use computed signals:

```typescript
protected readonly validationConfig = computed(() =>
  createValidationConfig<FormModel>()
    .bidirectional('password', 'confirmPassword')
    .merge(this.isDynamicMode() ? this.extraConfig() : {})
    .build()
);
```

### 6. Avoid Large Groups

For groups larger than 10 fields, consider if all fields truly need to revalidate each other:

```typescript
// ⚠️ Creates 90 dependencies (10×9)
.group(['field1', 'field2', 'field3', 'field4', 'field5',
        'field6', 'field7', 'field8', 'field9', 'field10'])

// ✅ More targeted
.whenChanged('field1', ['field2', 'field3'])
.whenChanged('field2', ['field1', 'field4'])
```

### 7. Test Your Configuration

Validation configurations are critical to form behavior. Test them:

```typescript
describe('MyComponent validation config', () => {
  it('should revalidate confirmPassword when password changes', () => {
    const config = component.validationConfig;
    expect(config.password).toContain('confirmPassword');
  });

  it('should have bidirectional password validation', () => {
    const config = component.validationConfig;
    expect(config.password).toContain('confirmPassword');
    expect(config.confirmPassword).toContain('password');
  });
});
```

## Performance Considerations

### Debouncing

The validation config respects the debounce token configuration:

```typescript
// ngx-level debounce configuration
bootstrapApplication(AppComponent, {
  providers: [
    {
      provide: NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN,
      useValue: 150, // ms
    },
  ],
});
```

### Group Size Impact

Each `group()` call creates N×(N-1) dependencies:

- 3 fields = 6 dependencies
- 5 fields = 20 dependencies
- 10 fields = 90 dependencies

Use groups judiciously for large field sets.

### Builder Reuse

Builders can be reused and are garbage-collected after `build()`:

```typescript
// ✅ Builder is GC'd after build()
protected readonly config = createValidationConfig<T>()
  .bidirectional('a', 'b')
  .build();

// ✅ Reusable builder
const builder = createValidationConfig<T>();
const config1 = builder.whenChanged('a', 'b').build();
const config2 = builder.whenChanged('c', 'd').build();
```

## Troubleshooting

### TypeScript Errors

**Problem:** "Type 'string' is not assignable to type FieldPath<T>"

**Solution:** Ensure your type parameter is correctly defined with `NgxDeepPartial`:

```typescript
// ✅ Correct
type MyFormModel = NgxDeepPartial<{
  password: string;
}>;

// ❌ Wrong
type MyFormModel = {
  password?: string; // Use NgxDeepPartial instead
};
```

### Autocomplete Not Working

**Problem:** No field suggestions in IDE

**Solution:** Ensure you're providing the type parameter:

```typescript
// ✅ Autocomplete works
createValidationConfig<MyFormModel>();

// ❌ No autocomplete
createValidationConfig();
```

### Validation Not Triggering

**Problem:** Dependent field not revalidating

**Solution:** Check that:

1. Field names exactly match model property paths
2. Configuration is passed to `[validationConfig]` input
3. Form is using `ngxVestForm` directive

```typescript
// Template
<form ngxVestForm [validationConfig]="validationConfig">
  <input name="password" [ngModel]="formValue().password" />
  <input name="confirmPassword" [ngModel]="formValue().confirmPassword" />
</form>
```

## See Also

- [Field Path Types](./FIELD-PATHS.md) - Understanding type-safe field paths
- [Complete Example](./COMPLETE-EXAMPLE.md) - Full form implementation
- [Validation Config vs Root Form](./VALIDATION-CONFIG-VS-ROOT-FORM.md) - When to use each pattern
