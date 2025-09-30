# Validation Suite Checklist

A quick reference guide to avoid common mistakes when creating Vest.js validation suites.

## ✅ Essential Pattern Checklist

When creating a new validation suite, verify these items:

### 1. ✅ Guard `only(field)` with `if (field)` check

```typescript
// ✅ CORRECT
export const suite = staticSuite((data, field) => {
  if (field) {
    only(field);
  }
  // ... tests
});

// ❌ WRONG - Breaks when field is undefined
export const suite = staticSuite((data, field) => {
  only(field); // BUG!
  // ... tests
});
```

**Why:** `only(undefined)` tells Vest to run ZERO tests, breaking validation.

### 2. ✅ Use `staticSuite` for form validation

```typescript
// ✅ CORRECT - Stateless, no manual reset needed
export const suite = staticSuite((data, field) => {
  /* ... */
});

// ⚠️ Use `create` only when you need shared mutable state
export const suite = create((data, field) => {
  /* ... */
});
```

**Why:** `staticSuite` is simpler and server-side safe.

### 3. ✅ Make `field` parameter optional with `?`

```typescript
// ✅ CORRECT
export const suite = staticSuite((data, field?: string) => {
  if (field) {
    only(field);
  }
});

// ❌ WRONG - Field should be optional
export const suite = staticSuite((data, field: string) => {
  only(field);
});
```

**Why:** Form-level validation calls the suite without a field parameter.

### 4. ✅ Use `skipWhen` for expensive async validations

```typescript
// ✅ CORRECT
skipWhen(
  (result) => result.hasErrors('email'),
  () => {
    test('email', 'Email taken', async ({ signal }) => {
      await checkEmail(data.email, { signal });
    });
  },
);

// ❌ WRONG - Always runs, even when email format is invalid
test('email', 'Email taken', async () => {
  await checkEmail(data.email);
});
```

**Why:** Don't waste network requests on invalid input.

### 5. ✅ Respect `AbortSignal` in async tests

```typescript
// ✅ CORRECT
test('username', 'Taken', async ({ signal }) => {
  await fetch('/check', { signal });
});

// ❌ WRONG - Request not cancelled when field changes
test('username', 'Taken', async () => {
  await fetch('/check');
});
```

**Why:** Cancel in-flight requests when user changes field value.

### 6. ✅ Use `result.isTested(field)` for touch detection

```typescript
// ✅ CORRECT
const showError = computed(
  () => result().isTested('email') && result().hasErrors('email'),
);

// ❌ WRONG - Duplicate state management
const [touched, setTouched] = useState({});
const showError = touched.email && result.hasErrors('email');
```

**Why:** Vest already tracks which fields have been tested.

### 7. ✅ Use TypeScript types for the model

```typescript
// ✅ CORRECT
export interface UserModel {
  email: string;
  password: string;
}

export const suite = staticSuite((data: UserModel = {}, field?: string) => {
  // TypeScript autocomplete and type checking work
});

// ❌ WRONG - No type safety
export const suite = staticSuite((data: any, field?: string) => {
  // No autocomplete, typos not caught
});
```

**Why:** Catch typos at compile time, get better IDE support.

## 🚨 Critical Symptoms of Common Bugs

### Symptom: Only 1 error shows at a time

**Cause:** Missing `if (field)` guard around `only(field)`

**Fix:**

```typescript
// Change this:
only(field);

// To this:
if (field) {
  only(field);
}
```

### Symptom: Initial form load shows no errors

**Cause:** Same as above - `only(undefined)` runs no tests

**Fix:** Add the `if (field)` guard

### Symptom: Errors don't clear when field becomes valid

**Cause:** Not running validation after field changes

**Fix:** Ensure your form library calls `suite(data, field)` on input

### Symptom: Multiple network requests for same validation

**Cause:** Not using `test.memo()` or `skipWhen`

**Fix:**

```typescript
skipWhen(
  (result) => result.hasErrors('field'),
  () => {
    test('field', 'Error', async ({ signal }) => {
      // Expensive check
    });
  },
);
```

### Symptom: Async validation never completes

**Cause:** Not handling `AbortSignal` in async tests

**Fix:** Add `{ signal }` parameter and pass to fetch/axios

## 📋 Quick Copy-Paste Templates

### Basic validation suite

```typescript
import { staticSuite, enforce, only, test } from 'vest';

export interface MyFormModel {
  email: string;
  password: string;
}

export const myFormValidations = staticSuite(
  (data: MyFormModel = {}, field?: string) => {
    if (field) {
      only(field);
    }

    test('email', 'Email is required', () => {
      enforce(data.email).isNotEmpty();
    });

    test('email', 'Email format is invalid', () => {
      enforce(data.email).isEmail();
    });

    test('password', 'Password must be at least 8 characters', () => {
      enforce(data.password).longerThan(7);
    });
  },
);
```

### With async validation

```typescript
import { staticSuite, enforce, only, test, skipWhen } from 'vest';

export const myFormValidations = staticSuite((data = {}, field?: string) => {
  if (field) {
    only(field);
  }

  test('username', 'Username is required', () => {
    enforce(data.username).isNotEmpty();
  });

  test('username', 'Username must be at least 3 characters', () => {
    enforce(data.username).longerThan(2);
  });

  // Only check availability if username format is valid
  skipWhen(
    (result) => result.hasErrors('username'),
    () => {
      test('username', 'Username is already taken', async ({ signal }) => {
        const response = await fetch(`/api/check-username/${data.username}`, {
          signal,
        });
        if (!response.ok) throw new Error('Username taken');
      });
    },
  );
});
```

### With cross-field validation

```typescript
import { staticSuite, enforce, only, test, include } from 'vest';

export const myFormValidations = staticSuite((data = {}, field?: string) => {
  if (field) {
    only(field);
  }

  test('password', 'Password is required', () => {
    enforce(data.password).isNotEmpty();
  });

  // Re-validate confirmPassword whenever password changes
  include('confirmPassword').when('password');

  test('confirmPassword', 'Please confirm your password', () => {
    enforce(data.confirmPassword).isNotEmpty();
  });

  test('confirmPassword', 'Passwords must match', () => {
    enforce(data.confirmPassword).equals(data.password);
  });
});
```

### With conditional validation

```typescript
import { staticSuite, enforce, only, test, omitWhen } from 'vest';

export const myFormValidations = staticSuite((data = {}, field?: string) => {
  if (field) {
    only(field);
  }

  test('accountType', 'Please select account type', () => {
    enforce(data.accountType).isNotEmpty();
  });

  // Only validate business fields for business accounts
  omitWhen(data.accountType !== 'business', () => {
    test('companyName', 'Company name is required', () => {
      enforce(data.companyName).isNotEmpty();
    });

    test('taxId', 'Tax ID is required', () => {
      enforce(data.taxId).isNotEmpty();
    });
  });
});
```

## 🔍 Code Review Checklist

When reviewing validation suite code, check for:

- [ ] `if (field) { only(field); }` pattern is used (not bare `only(field)`)
- [ ] `field` parameter is optional (`field?: string`)
- [ ] Using `staticSuite` (unless `create` is specifically needed)
- [ ] Async tests respect `AbortSignal` (`async ({ signal }) => ...`)
- [ ] Expensive async validations wrapped in `skipWhen`
- [ ] Cross-field validations use `include().when()`
- [ ] Model has TypeScript interface/type
- [ ] No manual "dirty" or "touched" state management

## 🛠️ VS Code Snippet

Add this to your VS Code snippets for quick validation suite creation:

```json
{
  "Vest Validation Suite": {
    "prefix": "vest-suite",
    "body": [
      "import { staticSuite, enforce, only, test } from 'vest';",
      "",
      "export interface ${1:FormModel} {",
      "  ${2:field}: string;",
      "}",
      "",
      "export const ${3:formValidations} = staticSuite((data: ${1:FormModel} = {}, field?: string) => {",
      "  if (field) {",
      "    only(field);",
      "  }",
      "",
      "  test('${2:field}', '${4:Error message}', () => {",
      "    enforce(data.${2:field}).isNotEmpty();",
      "  });",
      "});",
      ""
    ],
    "description": "Create a Vest.js validation suite with correct pattern"
  }
}
```

## 📚 Additional Resources

- [Vest.js Official Documentation](https://vestjs.dev/docs/)
- [Vest Best Practices (ngx-vest-forms)](../../.github/instructions/vest.instructions.md)
- [Bug Fix Documentation: only() Field Guard](./bug-fixes/only-field-validation-bug.md)
- [ngx-vest-forms V2 Instructions](../../.github/instructions/ngx-vest-forms.instructions.md)

## 🎯 TL;DR - The One Rule to Remember

```typescript
// ALWAYS do this:
if (field) {
  only(field);
}

// NEVER do this:
only(field); // ❌ BUG!
```

This single pattern prevents 90% of validation bugs. Make it muscle memory!
