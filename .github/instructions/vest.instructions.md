# Vest.js Validation Framework: Best Practices for Angular & ngx-vest-forms

## What is Vest.js?

Vest.js is a declarative validation framework inspired by unit testing libraries. It simplifies form validation with a suite-like syntax, making validation logic maintainable and readable across any UI framework. When combined with ngx-vest-forms in Angular applications, it provides a powerful solution for complex form validation scenarios.

### Core Philosophy
- **Declarative Syntax**: Write validations like unit tests for clarity and maintainability
- **Framework Agnostic**: Works with any frontend or backend framework
- **Performance Optimized**: Selective validation with `only()` function for enhanced performance
- **Asynchronous First**: Built-in support for async validations
- **Composable**: Modular and reusable validation logic across projects

## Prerequisites & Installation

```bash
npm install vest
```

**Note**: For exact version requirements, see main copilot instructions which define workspace-compatible versions.

## Core Concepts

### Creating Validation Suites

#### Basic Suite Structure
```typescript
import { create, test, enforce } from 'vest';

const suite = create((data = {}) => {
  test('username', 'Username is required', () => {
    enforce(data.username).isNotBlank();
  });

  test('username', 'Username must be at least 3 characters long', () => {
    enforce(data.username).longerThan(2);
  });
});

export default suite;
```

#### Performance-Optimized Suite (CRITICAL for ngx-vest-forms)
```typescript
import { create, test, enforce, only } from 'vest';

const suite = create((data = {}, field?: string) => {
  // ALWAYS include this pattern for optimal performance
  if (field) {
    only(field); // Only validate the specific field that changed
  }
  // When field is undefined (e.g., on submit), all validations run

  test('username', 'Username is required', () => {
    enforce(data.username).isNotBlank();
  });

  test('email', 'Email is invalid', () => {
    enforce(data.email).isEmail();
  });
});
```

### TypeScript Support

#### Typed Suites with Generics
```typescript
import { create } from 'vest';

type FieldName = 'username' | 'password' | 'email';
type GroupName = 'SignIn' | 'SignUp';
type Callback = (data: { username: string; password: string; email?: string }) => void;

const suite = create<FieldName, GroupName, Callback>(data => {
  // data is now fully typed
  test('username', 'Username is required', () => {
    enforce(data.username).isNotBlank();
  });
});

// Type-safe result access
const result = suite();
result.getErrors('username'); // ✅ Type-safe
result.getErrors('invalid_field'); // 🚨 Compilation error
```

#### Runtime Function Typing
```typescript
// Extract typed functions from suite for better type safety
const { test, group, only } = suite;

// Now all functions are type-safe
only('username'); // ✅
only('invalid_field'); // 🚨 Compilation error
```

## Validation Patterns for Angular/ngx-vest-forms

### 1. Field-Level Validation Pattern
```typescript
import { staticSuite, test, enforce, only } from 'vest';
import { DeepPartial } from 'ngx-vest-forms';

type FormModel = DeepPartial<{
  generalInfo: {
    firstName: string;
    lastName: string;
    email: string;
  };
}>;

export const generalInfoValidationSuite = staticSuite(
  (model: FormModel, field?: string) => {
    // CRITICAL: Always use this pattern for ngx-vest-forms
    if (field) {
      only(field);
    }

    test('generalInfo.firstName', 'First name is required', () => {
      enforce(model.generalInfo?.firstName).isNotBlank();
    });

    test('generalInfo.lastName', 'Last name is required', () => {
      enforce(model.generalInfo?.lastName).isNotBlank();
    });

    test('generalInfo.email', 'Email is required', () => {
      enforce(model.generalInfo?.email).isNotBlank();
    });

    test('generalInfo.email', 'Email format is invalid', () => {
      enforce(model.generalInfo?.email).isEmail();
    });
  }
);
```

### 2. Nested Object Validation
```typescript
test('addresses.billingAddress.street', 'Street is required', () => {
  enforce(model.addresses?.billingAddress?.street).isNotBlank();
});

test('addresses.billingAddress.zipcode', 'Invalid zipcode format', () => {
  enforce(model.addresses?.billingAddress?.zipcode).matches(/^\d{5}(-\d{4})?$/);
});
```

### 3. Conditional Validations with `omitWhen`
```typescript
import { omitWhen } from 'vest';

// Skip address validation if using existing address
omitWhen(model.useExistingAddress, () => {
  test('addresses.newAddress.street', 'Street is required', () => {
    enforce(model.addresses?.newAddress?.street).isNotBlank();
  });

  test('addresses.newAddress.city', 'City is required', () => {
    enforce(model.addresses?.newAddress?.city).isNotBlank();
  });
});

// Age-based conditional validation
omitWhen((model.age || 0) >= 18, () => {
  test('emergencyContact', 'Emergency contact is required for minors', () => {
    enforce(model.emergencyContact).isNotBlank();
  });
});
```

### 4. Dependent Field Validation
```typescript
// Password confirmation validation
omitWhen(!model.password || !model.confirmPassword, () => {
  test('confirmPassword', 'Passwords do not match', () => {
    enforce(model.confirmPassword).equals(model.password);
  });
});

// Cross-field validation with skipWhen
skipWhen(res => res.hasErrors('password'), () => {
  test('confirmPassword', 'Please confirm password', () => {
    enforce(model.confirmPassword).isNotBlank();
  });
});
```

## Asynchronous Validation Patterns

### Basic Async Validation
```typescript
test('username', 'Username is already taken', async () => {
  return await doesUserExist(userData.username);
});

// Using promises
test('email', 'Email is already registered', () => {
  return checkEmailAvailability(userData.email)
    .then(() => Promise.resolve()) // Available
    .catch(() => Promise.reject()); // Taken
});
```

### Async with AbortSignal (Performance Optimization)
```typescript
import { fromEvent, lastValueFrom, takeUntil } from 'rxjs';

test('username', 'Username is already taken', async ({ signal }) => {
  await lastValueFrom(
    apiService
      .checkUsernameAvailability(userData.username)
      .pipe(takeUntil(fromEvent(signal, 'abort')))
  ).then(
    () => Promise.reject(), // Username exists, validation fails
    () => Promise.resolve()  // Username available, validation passes
  );
});
```

### Factory Pattern for Service Injection
```typescript
export const createAsyncValidationSuite = (apiService: ApiService) => {
  return staticSuite((model: FormModel, field?: string) => {
    if (field) {
      only(field);
    }

    omitWhen(!model.userId, () => {
      test('userId', 'User ID is already taken', async ({ signal }) => {
        await lastValueFrom(
          apiService
            .checkUserId(model.userId as string)
            .pipe(takeUntil(fromEvent(signal, 'abort')))
        ).then(
          () => Promise.reject(),
          () => Promise.resolve()
        );
      });
    });
  });
};
```

## Advanced Validation Patterns

### 1. Warn-Only Tests (Non-blocking)
```typescript
import { warn } from 'vest';

// Password strength indicators
test('password', 'Password strength: WEAK', () => {
  warn(); // This test won't prevent form submission

  enforce(data.password).matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]$/
  );
});

test('password', 'Password strength: MEDIUM', () => {
  warn();

  enforce(data.password).matches(
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]$/
  );
});
```

### 2. Dynamic Tests with `each`
```typescript
import { each } from 'vest';

// Validate array items dynamically
each(model.phoneNumbers, (phoneNumber, index) => {
  test(
    `phoneNumbers.${index}.number`,
    'Phone number is required',
    () => {
      enforce(phoneNumber.number).isNotBlank();
    },
    phoneNumber.id // Unique key for state persistence
  );

  test(
    `phoneNumbers.${index}.number`,
    'Invalid phone number format',
    () => {
      enforce(phoneNumber.number).matches(/^\+?[\d\s\-\(\)]+$/);
    },
    phoneNumber.id
  );
});
```

### 3. Grouped Validations (Multi-step Forms)
```typescript
import { group, only } from 'vest';

const suite = create((data, currentStep) => {
  only.group(currentStep);

  group('personal_info', () => {
    test('firstName', 'First name is required', () => {
      enforce(data.firstName).isNotBlank();
    });

    test('lastName', 'Last name is required', () => {
      enforce(data.lastName).isNotBlank();
    });
  });

  group('contact_info', () => {
    test('email', 'Email is required', () => {
      enforce(data.email).isNotBlank();
    });

    test('phone', 'Phone is required', () => {
      enforce(data.phone).isNotBlank();
    });
  });
});

// Usage
suite(formData, 'personal_info'); // Only validate personal info step
suite(formData, 'contact_info');  // Only validate contact info step
```

### 4. Composable Validation Functions
```typescript
// Reusable validation components
export function emailValidations(value: string | undefined, fieldName: string) {
  test(fieldName, 'Email is required', () => {
    enforce(value).isNotBlank();
  });

  test(fieldName, 'Email format is invalid', () => {
    enforce(value).isEmail();
  });
}

export function phoneValidations(value: string | undefined, fieldName: string) {
  test(fieldName, 'Phone number is required', () => {
    enforce(value).isNotBlank();
  });

  test(fieldName, 'Invalid phone format', () => {
    enforce(value).matches(/^\+?[\d\s\-\(\)]+$/);
  });
}

// Main suite using composable validations
export const contactValidationSuite = staticSuite(
  (model: ContactModel, field?: string) => {
    if (field) {
      only(field);
    }

    emailValidations(model.email, 'email');
    phoneValidations(model.phone, 'phone');
    phoneValidations(model.alternativePhone, 'alternativePhone');
  }
);
```

## State Management Patterns

### 1. Stateful Suite (Client-side)
```typescript
// Regular suite maintains state between runs
const suite = create((data, field) => {
  if (field) {
    only(field);
  }
  // validation logic
});

// State persists between calls
suite(data, 'username');
suite(data, 'email');
```

### 2. Stateless Suite (Server-side)
```typescript
import { staticSuite } from 'vest';

// Creates new result instance each time
const suite = staticSuite((data) => {
  test('username', 'Username is required', () => {
    enforce(data.username).isNotEmpty();
  });
});

// Each call is independent
suite(data); // No state persistence
```

### 3. Manual State Reset
```typescript
// Reset suite state manually
suite.reset(); // Clears all validation state
```

## Integration with ngx-vest-forms

### 1. Basic Integration
```typescript
// Component
@Component({
  template: `
    <form scVestForm
          [suite]="validationSuite"
          (formValueChange)="formValue.set($event)">

      <div sc-control-wrapper>
        <input name="username" [ngModel]="formValue().username"/>
      </div>
    </form>
  `
})
export class MyComponent {
  protected readonly formValue = signal<FormModel>({});
  protected readonly validationSuite = myValidationSuite;
}
```

### 2. Validation Configuration for Dependencies
```typescript
// Component
protected readonly validationConfig = {
  'password': ['confirmPassword'],
  'addresses.billingAddress.country': ['addresses.billingAddress.state']
};

// Template
<form scVestForm
      [suite]="validationSuite"
      [validationConfig]="validationConfig">
```

### 3. Root Form Validation
```typescript
import { ROOT_FORM } from 'ngx-vest-forms';

// In validation suite
test(ROOT_FORM, 'Form-level validation error', () => {
  enforce(someGlobalCondition).isTruthy();
});

// In component
<form scVestForm
      [validateRootForm]="true"
      (errorsChange)="errors.set($event)">
```

## Performance Optimization Strategies

### 1. Always Use `only()` Pattern
```typescript
// ✅ CORRECT: Optimal performance
const suite = staticSuite((model, field?: string) => {
  if (field) {
    only(field); // Only validate changed field
  }
  // validation logic
});

// ❌ WRONG: Validates all fields every time
const suite = staticSuite((model) => {
  // validation logic without only()
});
```

### 2. Memoization for Expensive Operations
```typescript
import { test } from 'vest';

// Cache expensive async operations
test.memo(
  'username',
  'Username already exists',
  () => expensiveUsernameCheck(data.username),
  [data.username] // Dependencies for cache invalidation
);
```

### 3. Conditional Test Execution
```typescript
// Skip expensive tests when basic validation fails
skipWhen(res => res.hasErrors('email'), () => {
  test('email', 'Email domain is blacklisted', async () => {
    return await checkEmailDomainReputation(data.email);
  });
});
```

## Error Handling & Result Processing

### 1. Accessing Validation Results
```typescript
const result = suite(formData);

// Check overall validity
result.isValid(); // boolean

// Field-specific errors
result.hasErrors('username'); // boolean
result.getErrors('username'); // string[]

// All errors
result.getErrors(); // Record<string, string[]>

// Warnings (non-blocking)
result.hasWarnings('password'); // boolean
result.getWarnings('password'); // string[]
```

### 2. Handling Async Results
```typescript
const result = suite(formData)
  .done('username', (res) => {
    if (res.hasErrors('username')) {
      // Handle username validation completion
    }
  })
  .done((res) => {
    // Handle overall validation completion
    if (res.isValid()) {
      // All validations passed
    }
  });

// Check for pending async tests
result.isPending(); // boolean
result.isPending('username'); // boolean for specific field
```

## Common Patterns & Best Practices

### 1. Form Validation Suite Structure
```typescript
import { staticSuite, test, enforce, only, omitWhen, ROOT_FORM } from 'vest';
import { DeepPartial, ROOT_FORM } from 'ngx-vest-forms';

type MyFormModel = DeepPartial<{
  // Define your form structure
}>;

export const myFormValidationSuite = staticSuite(
  (model: MyFormModel, field?: string) => {
    // ALWAYS include for performance
    if (field) {
      only(field);
    }

    // Basic field validations
    test('fieldName', 'Error message', () => {
      enforce(model.fieldName).isNotBlank();
    });

    // Conditional validations
    omitWhen(condition, () => {
      // Optional validations
    });

    // Root form validation
    test(ROOT_FORM, 'Form-level error', () => {
      enforce(someCondition).isTruthy();
    });
  }
);
```

### 2. Async Service Integration
```typescript
export const createValidationSuite = (
  userService: UserService,
  emailService: EmailService
) => {
  return staticSuite((model: FormModel, field?: string) => {
    if (field) {
      only(field);
    }

    // Regular synchronous validations
    test('username', 'Username is required', () => {
      enforce(model.username).isNotBlank();
    });

    // Async validations with service injection
    omitWhen(!model.username, () => {
      test('username', 'Username is taken', async ({ signal }) => {
        await lastValueFrom(
          userService.checkUsername(model.username!)
            .pipe(takeUntil(fromEvent(signal, 'abort')))
        ).then(
          () => Promise.reject(),
          () => Promise.resolve()
        );
      });
    });
  });
};
```

### 3. Multi-Stage Form Validation
```typescript
const multiStageValidation = create((data, currentStage) => {
  only.group(currentStage);

  group('stage1', () => {
    test('firstName', 'First name required', () => {
      enforce(data.firstName).isNotBlank();
    });
  });

  group('stage2', () => {
    test('email', 'Email required', () => {
      enforce(data.email).isNotBlank();
    });
  });

  group('stage3', () => {
    test('terms', 'Please accept terms', () => {
      enforce(data.acceptTerms).isTruthy();
    });
  });
});
```

## Common Pitfalls & Solutions

### ❌ Wrong: Missing `only()` Pattern
```typescript
// Poor performance - validates all fields
const suite = staticSuite((model) => {
  test('field1', 'Error', () => { /* validation */ });
  test('field2', 'Error', () => { /* validation */ });
});
```

### ✅ Correct: Using `only()` Pattern
```typescript
// Optimal performance - validates only changed field
const suite = staticSuite((model, field?: string) => {
  if (field) {
    only(field);
  }
  test('field1', 'Error', () => { /* validation */ });
  test('field2', 'Error', () => { /* validation */ });
});
```

### ❌ Wrong: Incorrect Async Handling
```typescript
// Promise rejection not handled properly
test('username', 'Taken', async () => {
  const exists = await checkUsername();
  return exists; // Wrong: should reject if exists
});
```

### ✅ Correct: Proper Async Handling
```typescript
// Proper promise handling
test('username', 'Username taken', async () => {
  const exists = await checkUsername();
  if (exists) {
    return Promise.reject(); // Explicit rejection
  }
  return Promise.resolve();
});
```

### ❌ Wrong: Improper `warn()` Usage
```typescript
// Won't work - warn() called after async operation
test('password', 'Weak password', async () => {
  await someAsyncCheck();
  warn(); // Too late!
});
```

### ✅ Correct: Proper `warn()` Usage
```typescript
// Correct - warn() called in sync portion
test('password', 'Weak password', async () => {
  warn(); // Call immediately
  return await someAsyncCheck();
});
```

## Server-Side Usage

### Stateless Validation
```typescript
import { staticSuite } from 'vest';

// Perfect for server-side validation
const serverValidation = staticSuite((data) => {
  test('username', 'Username required', () => {
    enforce(data.username).isNotEmpty();
  });
});

// Each request gets fresh validation state
app.post('/validate', (req, res) => {
  const result = serverValidation(req.body);
  res.json({ valid: result.isValid(), errors: result.getErrors() });
});
```

## TypeScript Integration

### Custom Rule Types
```typescript
// global.d.ts
declare global {
  namespace n4s {
    interface EnforceCustomMatchers<R> {
      isValidPhoneNumber(): R;
      isStrongPassword(): R;
    }
  }
}

export {};
```

### Exported Types
```typescript
import {
  Suite,
  SuiteRunResult,
  SuiteResult,
  SuiteSummary
} from 'vest';

type MySuite = Suite<FieldName, GroupName, Callback>;
type MyResult = SuiteResult<FieldName, GroupName>;
```

## Resources & References

- **Vest.js Documentation**: https://vestjs.dev/
- **ngx-vest-forms Integration**: Use `staticSuite` with `only()` pattern
- **Performance**: Always include field-specific validation with `only()`
- **Async Patterns**: Use AbortSignal for cancellable operations
- **TypeScript**: Leverage generics for type safety
- **State Management**: Use `staticSuite` for server-side, regular `create` for client-side

## Best Practices Summary

1. **Always use `staticSuite` with `only()` pattern** for ngx-vest-forms integration
2. **Include field parameter** in suite function signature for performance optimization
3. **Handle async validations properly** with explicit Promise resolution/rejection
4. **Use `warn()` for non-blocking validations** like password strength
5. **Compose validations** for reusability across different forms
6. **Leverage TypeScript generics** for type safety and better developer experience
7. **Use AbortSignal** for cancellable async operations
8. **Apply conditional logic** with `omitWhen` and `skipWhen` for complex scenarios
9. **Group validations** for multi-step forms and wizard-like interfaces
10. **Reset state appropriately** based on client-side vs server-side usage
