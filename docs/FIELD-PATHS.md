# Field Path Types - Type-Safe Field References

> **Vest 6 Note:** This guide uses the modern Vest 6 pattern where suite callbacks take only the model parameter, and field focus is handled at the call site via `suite.only(field).run(model)`. See [MIGRATION-v2.x-to-v3.0.0.md](./migration/MIGRATION-v2.x-to-v3.0.0.md) for upgrade details.

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
import { create, test, enforce } from 'vest';

type FormModel = {
  email: string;
  user: {
    name: string;
  };
};

export const suite = create((data: FormModel) => {
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
});
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

**Before (Vest 5 - legacy):**

```typescript
import { NgxVestSuite, NgxFieldKey } from 'ngx-vest-forms';
import { staticSuite, test, enforce, only } from 'vest';

// ⚠️ LEGACY: Vest 5 model with field parameter + only(field)
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

**After (Vest 6 - recommended):**

```typescript
import { NgxVestSuite } from 'ngx-vest-forms';

// ✅ RECOMMENDED: Vest 6 model-only callback with autocomplete
export const suite: NgxVestSuite<UserModel> = create(
  (model: UserModel) => {
    // ✅ Autocomplete for field names!
    test('email', 'Required', () => {
      enforce(model.email).isNotBlank();
    });
  }
);

// Component - field focus via suite.only(field).run(model)
@Component({...})
class MyFormComponent {
  // ✅ Types are compatible - no type assertion needed
  protected readonly suite: NgxVestSuite<UserModel> = suite;

  validate(fieldName?: keyof UserModel) {
    // ✅ Field focus at call site, not in callback
    if (fieldName) {
      return this.suite.only(fieldName).run(this.model);
    }
    return this.suite.run(this.model);
  }
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
export const suite = create((data: FormModel) => {
  validateAddress(data.addresses?.billing, 'addresses.billing');
});
```

---

## Migration Guide

### Step 1: Update Validation Suites

**Before:**

```typescript
import { NgxVestSuite, NgxFieldKey } from 'ngx-vest-forms';

const suite: NgxVestSuite<Model> = create(
  (model: Model, field?: NgxFieldKey<Model>) => {
    // ...
  }
);
```

**After:**

```typescript
import { NgxVestSuite } from 'ngx-vest-forms';

const suite: NgxVestSuite<Model> = create((model: Model) => {
  // ...
});
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

### Security: Dynamic Path Inputs

When receiving path strings from dynamic sources (for example server-driven schemas or custom builders), treat them as untrusted input.

- `setValueAtPath()` now rejects unsafe prototype-related segments by default: `__proto__`, `prototype`, and `constructor`.
- Deep merge utilities used internally also skip those keys.
- Prefer typed paths (`FieldPath<T>`) whenever possible to catch invalid paths at compile time.

This design keeps defaults safe while preserving backward compatibility for valid field paths.

### ✅ DO: Use NgxVestSuite for TypeScript Code

When defining validation suites in TypeScript files, use `NgxVestSuite` in new code. It is the canonical public type in v3.x:

```typescript
export const suite: NgxVestSuite<FormModel> = create((model: FormModel) => {
  // Full autocomplete for field names
});
```

`NgxTypedVestSuite<T>` still works, but it is a deprecated alias of `NgxVestSuite<T>`.

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

### ❌ DON'T: Introduce New Uses of NgxTypedVestSuite

Prefer the canonical `NgxVestSuite<T>` type in new code:

```typescript
// ❌ Avoid in new code (deprecated alias)
suite: NgxTypedVestSuite<FormModel> = create((model: FormModel) => { ... });

// ✅ Preferred
suite: NgxVestSuite<FormModel> = create((model: FormModel) => { ... });
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
  NgxVestSuite,
  FormFieldName,
  ValidationConfigMap,
  ROOT_FORM,
} from 'ngx-vest-forms';
import { create, test, enforce } from 'vest';

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
export const purchaseSuite: NgxVestSuite<PurchaseFormModel> = create(
  (model: PurchaseFormModel) => {
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
class PurchaseForm {
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

// Canonical suite type (recommended)
export type NgxVestSuite<T>;

// Deprecated alias kept for backward compatibility
export type NgxTypedVestSuite<T>;
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

- [Validation Config Builder](./VALIDATION-CONFIG-BUILDER.md) - Fluent API for validation configuration
- [Validation Config vs Root Form](./VALIDATION-CONFIG-VS-ROOT-FORM.md) - When to use each approach
- [Vest.js Instructions](../.github/instructions/vest.instructions.md) - Best practices for Vest.js
- [ngx-vest-forms Instructions](../.github/instructions/ngx-vest-forms.instructions.md) - Complete library guide
- [Migration Guide (v2.x → v3.0.0)](./migration/MIGRATION-v2.x-to-v3.0.0.md) - Upgrading to v3.0.0 (Vest 6)
- [Migration Guide (v1.x → v2.0.0)](./migration/MIGRATION-v1.x-to-v2.0.0.md) - Upgrading to v2.0.0
- [Selector Prefix Migration Guide](./SELECTOR-PREFIX-MIGRATION.md)

---

## Feedback & Contributions

Found an issue or have a suggestion? Please:

1. Check existing [GitHub Issues](https://github.com/ngx-vest-forms/ngx-vest-forms/issues)
2. Create a new issue with the `field-path-types` label
3. Or submit a PR with improvements to this documentation

---

**Version:** 3.0.0
**Last Updated:** March 6, 2026
**Status:** Stable
