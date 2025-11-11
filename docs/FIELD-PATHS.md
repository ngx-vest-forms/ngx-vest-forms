# Field Path Types - Type-Safe Field References

## Overview

The field path types feature provides compile-time type safety and IDE autocomplete for field names throughout ngx-vest-forms. This eliminates typos, enables refactoring support, and makes your code more maintainable.

## Table of Contents

- [Core Types](#core-types)
- [Basic Usage](#basic-usage)
- [Advanced Usage](#advanced-usage)
- [Migration Guide](#migration-guide)
- [Best Practices](#best-practices)
- [TypeScript Tips](#typescript-tips)

---

## Core Types

### `FieldPath<T>`

Generates all valid field paths for a type as string literals, supporting nested objects with dot notation.

```typescript
import { FieldPath } from 'ngx-vest-forms';

type UserModel = {
  name: string;
  profile: {
    age: number;
    address: {
      city: string;
    };
  };
};

// Type: 'name' | 'profile' | 'profile.age' | 'profile.address' | 'profile.address.city'
type UserPaths = FieldPath<UserModel>;
```

**Features:**

- ✅ Full IDE autocomplete
- ✅ Compile-time validation
- ✅ Refactoring support
- ✅ Supports nested objects up to 10 levels deep
- ✅ Works with optional properties
- ✅ Handles arrays

### `ValidationConfigMap<T>`

Type-safe map for validation configuration, ensuring all field references are valid.

```typescript
import { ValidationConfigMap } from 'ngx-vest-forms';

type FormModel = {
  password: string;
  confirmPassword: string;
  email: string;
};

// ✅ Autocomplete works for keys and values
const config: ValidationConfigMap<FormModel> = {
  password: ['confirmPassword'],
  email: ['password', 'confirmPassword'],
};

// ❌ TypeScript error - invalid field name
const badConfig: ValidationConfigMap<FormModel> = {
  passwordd: ['confirmPassword'], // Typo caught at compile time!
};
```

### `FormFieldName<T>`

Type-safe field names for Vest test() calls, combining field paths with the ROOT_FORM constant.

```typescript
import { FormFieldName, ROOT_FORM } from 'ngx-vest-forms';
import { staticSuite, test, only, enforce } from 'vest';

type FormModel = {
  email: string;
  user: {
    name: string;
  };
};

export const suite = staticSuite(
  (data: FormModel, field?: FormFieldName<FormModel>) => {
    only(field);

    // ✅ Autocomplete suggests: 'email' | 'user' | 'user.name' | typeof ROOT_FORM
    test('email', 'Required', () => {
      enforce(data.email).isNotBlank();
    });

    test('user.name', 'Required', () => {
      enforce(data.user?.name).isNotBlank();
    });

    // Form-level validation
    test(ROOT_FORM, 'At least one field required', () => {
      enforce(data.email || data.user?.name).isTruthy();
    });
  }
);
```

### `FieldPathValue<T, Path>`

Infers the value type at a given field path. Useful for creating type-safe utilities.

```typescript
import { FieldPathValue } from 'ngx-vest-forms';

type Model = {
  user: {
    profile: {
      age: number;
    };
  };
};

// Type: number
type AgeType = FieldPathValue<Model, 'user.profile.age'>;
```

### `LeafFieldPath<T>`

Extracts only the leaf paths (paths to primitive values), excluding intermediate objects.

```typescript
import { LeafFieldPath } from 'ngx-vest-forms';

type Model = {
  user: {
    name: string;
    profile: {
      age: number;
    };
  };
};

// Type: 'user.name' | 'user.profile.age'
// Note: 'user' and 'user.profile' are excluded
type Leaves = LeafFieldPath<Model>;
```

---

## Basic Usage

### 1. Type-Safe Validation Config

**Before (plain strings):**

```typescript
protected validationConfig = {
  'password': ['confirmPassword'],
  'addresess.billingAddress.street': ['addresses.billingAddress.city'], // Typo!
};
```

**After (type-safe):**

```typescript
import { ValidationConfigMap } from 'ngx-vest-forms';

protected validationConfig: ValidationConfigMap<PurchaseFormModel> = {
  'passwords.password': ['passwords.confirmPassword'], // Autocomplete!
  'addresses.billingAddress.street': ['addresses.billingAddress.city'], // Typo caught!
};
```

### 2. Type-Safe Vest Suites

**Before:**

```typescript
import { NgxVestSuite, NgxFieldKey } from 'ngx-vest-forms';

export const suite: NgxVestSuite<UserModel> = staticSuite(
  (model: UserModel, field?: NgxFieldKey<UserModel>) => {
    only(field);

    // Plain strings, no autocomplete
    test('email', 'Required', () => {
      enforce(model.email).isNotBlank();
    });
  }
);
```

**After:**

```typescript
import { NgxVestSuite, NgxTypedVestSuite, FormFieldName } from 'ngx-vest-forms';

// ✅ RECOMMENDED: Define with NgxTypedVestSuite for autocomplete
export const suite: NgxTypedVestSuite<UserModel> = staticSuite(
  (model: UserModel, field?: FormFieldName<UserModel>) => {
    only(field);

    // ✅ Autocomplete for field names!
    test('email', 'Required', () => {
      enforce(model.email).isNotBlank();
    });
  }
);

// Component - use NgxVestSuite type (no type assertion needed)
@Component({...})
class MyFormComponent {
  // ✅ Types are compatible - no type assertion needed
  protected readonly suite: NgxVestSuite<UserModel> = suite;
}
```

### 3. Type-Safe Computed Configs

```typescript
import { computed } from '@angular/core';
import { ValidationConfigMap } from 'ngx-vest-forms';

protected readonly validationConfig = computed<ValidationConfigMap<FormModel>>(() => {
  const config: ValidationConfigMap<FormModel> = {
    age: ['emergencyContact'],
    'passwords.password': ['passwords.confirmPassword'],
  };

  // Conditionally add dependencies with type safety
  if (this.showGenderOther()) {
    config['gender'] = ['genderOther']; // Autocomplete works!
  }

  return config;
});
```

---

## Advanced Usage

### Working with DeepPartial Types

The field path types work seamlessly with `DeepPartial` form models:

```typescript
import { NgxDeepPartial, ValidationConfigMap } from 'ngx-vest-forms';

type FormModel = NgxDeepPartial<{
  user: {
    email: string;
    profile: {
      age: number;
    };
  };
}>;

// All properties are optional, but paths are still type-safe
const config: ValidationConfigMap<FormModel> = {
  'user.email': ['user.profile.age'],
};
```

### Nested Array Support

Field paths work with arrays, generating paths for array element properties:

```typescript
type FormModel = {
  addresses: Array<{
    street: string;
    city: string;
  }>;
};

// Generated paths include array element properties
// Type: 'addresses' | 'addresses.street' | 'addresses.city'
type Paths = FieldPath<FormModel>;

// Use in validation
const config: ValidationConfigMap<FormModel> = {
  'addresses.street': ['addresses.city'],
};
```

### Dynamic Configuration

Combine type safety with dynamic logic:

```typescript
function createDynamicConfig<T>(
  conditions: Record<string, boolean>
): ValidationConfigMap<T> {
  const config: ValidationConfigMap<T> = {};

  if (conditions.validatePassword) {
    config['password'] = ['confirmPassword']; // Type-safe!
  }

  return config;
}
```

### Composable Validation Functions

Create reusable validation functions with type-safe field paths:

```typescript
import { FormFieldName } from 'ngx-vest-forms';

function validateAddress(
  model: AddressModel | undefined,
  prefix: string
): void {
  test(`${prefix}.street`, 'Required', () => {
    enforce(model?.street).isNotBlank();
  });
  test(`${prefix}.city`, 'Required', () => {
    enforce(model?.city).isNotBlank();
  });
}

// Use in main suite with type safety
export const suite = staticSuite(
  (data: FormModel, field?: FormFieldName<FormModel>) => {
    only(field);

    validateAddress(data.addresses?.billing, 'addresses.billing');
  }
);
```

---

## Migration Guide

### Step 1: Update Validation Suites

**Before:**

```typescript
import { NgxVestSuite, NgxFieldKey } from 'ngx-vest-forms';

const suite: NgxVestSuite<Model> = staticSuite(
  (model: Model, field?: NgxFieldKey<Model>) => {
    // ...
  }
);
```

**After:**

```typescript
import { NgxTypedVestSuite, FormFieldName } from 'ngx-vest-forms';

const suite: NgxTypedVestSuite<Model> = staticSuite(
  (model: Model, field?: FormFieldName<Model>) => {
    // ...
  }
);
```

### Step 2: Add Types to Validation Configs

**Before:**

```typescript
protected validationConfig = {
  password: ['confirmPassword'],
};
```

**After:**

```typescript
import { ValidationConfigMap } from 'ngx-vest-forms';

protected validationConfig: ValidationConfigMap<FormModel> = {
  password: ['confirmPassword'],
};
```

### Step 3: Use in Computed Configs

**Before:**

```typescript
protected validationConfig = computed(() => {
  const config: { [key: string]: string[] } = {};
  // ...
  return config;
});
```

**After:**

```typescript
import { ValidationConfigMap } from 'ngx-vest-forms';

protected validationConfig = computed<ValidationConfigMap<FormModel>>(() => {
  const config: ValidationConfigMap<FormModel> = {};
  // ...
  return config;
});
```

---

## Best Practices

### ✅ DO: Use NgxTypedVestSuite for TypeScript Code

When defining validation suites in TypeScript files, use `NgxTypedVestSuite` for better type safety:

```typescript
export const suite: NgxTypedVestSuite<FormModel> = staticSuite(
  (model: FormModel, field?: FormFieldName<FormModel>) => {
    only(field);
    // Full autocomplete for field names
  }
);
```

### ✅ DO: Type Your Validation Configs

Always type your validation configs for compile-time safety:

```typescript
const config: ValidationConfigMap<FormModel> = {
  trigger: ['dependent'],
};
```

### ✅ DO: Use Computed for Dynamic Configs

Combine computed signals with typed configs:

```typescript
protected readonly config = computed<ValidationConfigMap<FormModel>>(() => {
  const base: ValidationConfigMap<FormModel> = {
    password: ['confirmPassword'],
  };

  if (this.condition()) {
    base.field = ['otherField'];
  }

  return base;
});
```

### ❌ DON'T: Mix Typed and Untyped Approaches

Be consistent - either use typed configs everywhere or nowhere:

```typescript
// ❌ Bad - inconsistent
protected config1 = { password: ['confirmPassword'] }; // untyped
protected config2: ValidationConfigMap<FormModel> = { email: ['password'] }; // typed

// ✅ Good - consistent
protected config1: ValidationConfigMap<FormModel> = { password: ['confirmPassword'] };
protected config2: ValidationConfigMap<FormModel> = { email: ['password'] };
```

### ❌ DON'T: Use NgxVestSuite in Templates

While `NgxVestSuite` still works, prefer `NgxTypedVestSuite` for better type safety:

```typescript
// ❌ Less type-safe
suite: NgxVestSuite<FormModel> = staticSuite((model, field?) => { ... });

// ✅ More type-safe
suite: NgxTypedVestSuite<FormModel> = staticSuite((model, field?: FormFieldName<FormModel>) => { ... });
```

---

## TypeScript Tips

### Type Inference

Let TypeScript infer types when possible:

```typescript
// ✅ Good - type inference works
const config: ValidationConfigMap<FormModel> = {
  password: ['confirmPassword'],
};

// ❌ Unnecessary - explicit typing of individual properties
const config: ValidationConfigMap<FormModel> = {
  password: ['confirmPassword'] as FieldPath<FormModel>[],
};
```

### Working with Complex Types

For complex nested types, the field path types handle the complexity:

```typescript
type ComplexModel = NgxDeepPartial<{
  level1: {
    level2: {
      level3: {
        field: string;
      };
    };
  };
}>;

// Works automatically!
const config: ValidationConfigMap<ComplexModel> = {
  'level1.level2.level3.field': ['level1.level2'],
};
```

### Custom Type Guards

Create type guards for runtime validation:

```typescript
import { FieldPath } from 'ngx-vest-forms';

function isValidFieldPath<T>(model: T, path: string): path is FieldPath<T> {
  // Runtime validation logic
  return true; // Simplified
}
```

---

## Troubleshooting

### Issue: Autocomplete Not Working

**Cause:** TypeScript version too old or incorrect tsconfig settings.

**Solution:**

- Ensure TypeScript >= 5.8.0
- Check `tsconfig.json` has `"strict": true`
- Restart your IDE/TypeScript server

### Issue: "Type instantiation is excessively deep"

**Cause:** Model has more than 10 levels of nesting.

**Solution:**

- Flatten your model structure
- Or use plain strings for deeply nested fields

### Issue: Array Index Paths Not Working

**Expected:** Array indices in paths like `'items[0].name'`
**Actual:** Field paths generate `'items.name'` (without index)

**Explanation:** This is by design. Field paths represent the structure, not specific indices. Use the generated paths with array validation functions.

---

## Performance Considerations

### Compile-Time Performance

The field path types use complex TypeScript features. For very large models:

- **Models < 50 fields:** No noticeable impact
- **Models 50-100 fields:** Slight increase in compile time
- **Models > 100 fields:** Consider splitting into smaller models

### Runtime Performance

**Zero runtime overhead** - all types are erased at compile time. The generated JavaScript is identical to using plain strings.

---

## Examples

### Complete Purchase Form Example

```typescript
import {
  NgxTypedVestSuite,
  FormFieldName,
  ValidationConfigMap,
  ROOT_FORM,
} from 'ngx-vest-forms';
import { staticSuite, test, only, enforce } from 'vest';

type PurchaseFormModel = NgxDeepPartial<{
  firstName: string;
  lastName: string;
  email: string;
  addresses: {
    billing: {
      street: string;
      city: string;
    };
    shipping: {
      street: string;
      city: string;
    };
  };
  passwords: {
    password: string;
    confirmPassword: string;
  };
}>;

// Type-safe validation suite
export const purchaseSuite: NgxTypedVestSuite<PurchaseFormModel> = staticSuite(
  (model: PurchaseFormModel, field?: FormFieldName<PurchaseFormModel>) => {
    only(field);

    test('firstName', 'Required', () => {
      enforce(model.firstName).isNotBlank();
    });

    test('lastName', 'Required', () => {
      enforce(model.lastName).isNotBlank();
    });

    test('email', 'Valid email required', () => {
      enforce(model.email).isNotBlank().matches(/@/);
    });

    test('passwords.password', 'Password required', () => {
      enforce(model.passwords?.password).isNotBlank();
    });

    test('passwords.confirmPassword', 'Passwords must match', () => {
      enforce(model.passwords?.confirmPassword).equals(
        model.passwords?.password
      );
    });

    test(ROOT_FORM, 'Billing address required', () => {
      enforce(
        model.addresses?.billing?.street && model.addresses?.billing?.city
      ).isTruthy();
    });
  }
);

// Type-safe validation config
@Component({...})
class PurchaseFormComponent {
  protected readonly validationConfig: ValidationConfigMap<PurchaseFormModel> = {
    'passwords.password': ['passwords.confirmPassword'],
    'addresses.billing.street': ['addresses.billing.city'],
  };
}
```

---

## API Reference

### Exported Types

```typescript
// Core field path type
export type FieldPath<T, Prefix = '', Depth = []>;

// Validation configuration map
export type ValidationConfigMap<T>;

// Field name for Vest suites (includes ROOT_FORM)
export type FormFieldName<T>;

// Value type at a given path
export type FieldPathValue<T, Path>;

// Validate a path at compile time
export type ValidateFieldPath<T, Path>;

// Extract only leaf paths
export type LeafFieldPath<T, Prefix = '', Depth = []>;

// Typed vest suite (recommended for TypeScript)
export type NgxTypedVestSuite<T>;

// Original vest suite (for template compatibility)
export type NgxVestSuite<T>;
```

---

## Related Documentation

### Runtime Utilities

For working with field paths at runtime, see:

- **[Field Path Utilities](../projects/ngx-vest-forms/src/lib/utils/README.md#field-path-utilities)** - `stringifyFieldPath()`
  - Convert array notation to dot notation
  - Useful for dynamic field path manipulation
  - Works with the types defined in this guide

### Other Guides

- [Validation Configuration Guide](./VALIDATION-CONFIG.md)
- [Vest.js Best Practices](./VEST-BEST-PRACTICES.md)
- [ngx-vest-forms Guide](./.github/instructions/ngx-vest-forms.instructions.md)
- [Migration Guide](./MIGRATION.md)

---

## Feedback & Contributions

Found an issue or have a suggestion? Please:

1. Check existing [GitHub Issues](https://github.com/ngx-vest-forms/ngx-vest-forms/issues)
2. Create a new issue with the `field-path-types` label
3. Or submit a PR with improvements to this documentation

---

**Version:** 1.0.0
**Last Updated:** November 8, 2025
**Status:** Stable
