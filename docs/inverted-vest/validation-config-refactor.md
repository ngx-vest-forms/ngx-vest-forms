# Validation Config Refactor Plan

## Executive Summary

The `validationConfig` feature should be **deprecated and removed** in favor of native Vest.js patterns that are cleaner, more maintainable, and better aligned with Vest v5 best practices.

## Current State Analysis

### What `validationConfig` Does

- Triggers revalidation of dependent fields when a source field changes
- Example: When `password` changes, also revalidate `confirmPassword`
- Implemented via RxJS streams that watch field changes and call `updateValueAndValidity()`

### Problems with Current Approach

1. **Split concerns**: Validation logic is split between component (config) and suite (tests)
2. **Complexity**: Adds RxJS stream management overhead
3. **Redundancy**: Vest.js already provides better patterns for this
4. **Maintenance burden**: Extra code paths to test and maintain
5. **Learning curve**: Users need to learn a library-specific pattern instead of Vest patterns

## Recommended Vest.js Alternatives

### Option 1: Smart `only()` Usage (Recommended)

```typescript
import { staticSuite, test, enforce, only } from 'vest';

export const userValidations = staticSuite(
  (data: Partial<UserModel> = {}, field?: string) => {
    // Bidirectional dependency for password fields (recommended for better UX)
    if (field === 'password' || field === 'confirmPassword') {
      only('password', 'confirmPassword');
    } else if (field) {
      only(field);
    }

    test('password', 'Password is required', () => {
      enforce(data.password).isNotEmpty().longerThan(8);
    });

    test('confirmPassword', 'Passwords must match', () => {
      enforce(data.confirmPassword).equals(data.password);
    });
  },
);
```

**Why bidirectional?** Better UX - if user changes password after typing confirmPassword, the confirm field error clears immediately instead of requiring the user to touch it again.

#### Bidirectional vs Unidirectional Dependencies

**Use bidirectional (recommended):**

- When both fields validate against each other (e.g., password/confirmPassword)
- When you want immediate feedback regardless of which field the user edits
- Better user experience in most cases

**Use unidirectional:**

- When validation flows in one direction only
- When the dependent field should only validate after the primary field is valid
- For performance-critical scenarios with many fields

### Option 2: Form-Level Validation (Recommended for Cross-Field)

```typescript
import { NGX_ROOT_FORM } from 'ngx-vest-forms/core';
import { staticSuite, test, enforce, only } from 'vest';

// Field-level validations (single field rules)
const fieldValidations = staticSuite(
  (data: Partial<UserModel> = {}, field?: string) => {
    only(field);

    test('password', 'Password is required', () => {
      enforce(data.password).isNotEmpty().longerThan(8);
    });

    test('confirmPassword', 'Confirm password is required', () => {
      enforce(data.confirmPassword).isNotEmpty();
    });
  },
);

// Cross-field validations (multi-field rules)
const crossFieldValidations = staticSuite((data: Partial<UserModel> = {}) => {
  test(NGX_ROOT_FORM, 'Passwords must match', () => {
    enforce(data.confirmPassword).equals(data.password);
  });
});

@Component({
  template: `
    <form
      ngxVestForm
      [vestSuite]="fieldSuite"
      formLevelValidation
      [formLevelSuite]="crossFieldSuite"
      [(formValue)]="model"
    >
      <!-- form fields -->
    </form>
  `,
})
export class UserFormComponent {
  protected readonly fieldSuite = fieldValidations;
  protected readonly crossFieldSuite = crossFieldValidations;
}
```

### Option 3: Using `omitWhen()` for Conditional Logic

```typescript
import { staticSuite, test, enforce, only, omitWhen } from 'vest';

export const passwordValidations = staticSuite(
  (data: Partial<UserModel> = {}, field?: string) => {
    only(field);

    test('password', 'Password is required', () => {
      enforce(data.password).isNotEmpty();
    });

    // Only validate confirmPassword when password exists
    omitWhen(!data.password, () => {
      test('confirmPassword', 'Confirm password is required', () => {
        enforce(data.confirmPassword).isNotEmpty();
      });

      test('confirmPassword', 'Passwords must match', () => {
        enforce(data.confirmPassword).equals(data.password);
      });
    });
  },
);
```

## Migration Path

### For Users

**Before (with validationConfig):**

```typescript
@Component({
  template: `
    <form
      ngxVestForm
      [vestSuite]="suite"
      [validationConfig]="validationConfig"
      [(formValue)]="model"
    ></form>
  `,
})
export class FormComponent {
  protected validationConfig = {
    password: ['confirmPassword'],
  };
}
```

**After (using Vest patterns):**

```typescript
// Bidirectional dependency - when either field changes, validate both
if (field === 'password' || field === 'confirmPassword') {
  only('password', 'confirmPassword');
}
```

## Code Changes Required

### 1. Remove from `form.directive.ts`

Remove the following code sections:

```typescript
// REMOVE: validationConfig input
readonly validationConfig = input<Record<string, string[]> | null>(null);

// REMOVE: constructor call
this.#setupValidationConfigStreams();

// REMOVE: entire method
#setupValidationConfigStreams(): void {
  toObservable(this.validationConfig)
    .pipe(
      filter((config): config is Record<string, string[]> => !!config),
      switchMap((config: Record<string, string[]>) =>
        this.#createDependencyStreams(config),
      ),
      takeUntilDestroyed(this.#destroyRef),
    )
    .subscribe();
}

// REMOVE: entire method
#createDependencyStreams(
  config: Record<string, string[]>,
): Observable<unknown> {
  // ... entire implementation
}

// REMOVE: entire method
#validateDependentFields(
  dependentFields: string[],
  sourceField: string,
): void {
  // ... entire implementation
}
```

### 2. Remove RxJS imports (if no longer needed)

Check if these imports are still used elsewhere:

```typescript
import {
  catchError,
  filter,
  map,
  Observable,
  of,
  retry,
  switchMap,
  tap,
  zip,
} from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
```

### 3. Update Documentation

Remove all references to `validationConfig` from:

- README files
- `.github/instructions/ngx-vest-forms.instructions.md`
- Blog posts/examples
- API documentation

Add new section on "Dependent Field Validation":

````markdown
## Dependent Field Validation

When one field's validation depends on another field's value, use Vest's built-in patterns:

### Using `only()` for Dependencies

```typescript
export const validations = staticSuite((data, field) => {
  // Bidirectional dependency for better UX
  if (field === 'password' || field === 'confirmPassword') {
    only('password', 'confirmPassword');
  } else if (field) {
    only(field);
  }

  // Your tests here
});
```
````

**Explanation:** Using bidirectional dependencies ensures that changing either field validates both, providing immediate feedback regardless of which field the user edits.

### Using Form-Level Validation

For true cross-field rules, use the form-level validation pattern...

````

### 4. Update Tests

Remove any tests related to `validationConfig` functionality and add tests for the recommended patterns.

### 5. Example Component Updates

Update example components to use the new patterns:

```typescript
// Before
@Component({
  template: `
    <form ngxVestForm [validationConfig]="validationConfig">
  `
})
export class ExampleComponent {
  protected validationConfig = { password: ['confirmPassword'] };
}

// After
export const validations = staticSuite((data, field) => {
  // Use bidirectional dependency for better UX
  if (field === 'password' || field === 'confirmPassword') {
    only('password', 'confirmPassword');
  } else if (field) {
    only(field);
  }
  // ... tests
});

@Component({
  template: `<form ngxVestForm [vestSuite]="suite">`
})
export class ExampleComponent {
  protected readonly suite = validations;
}
````

## Backwards Compatibility Option (Not Recommended)

If backwards compatibility is absolutely required, we could:

1. **Mark as deprecated** with console warning:

```typescript
constructor() {
  if (this.validationConfig() && isDevMode()) {
    console.warn(
      '[ngx-vest-forms] validationConfig is deprecated. ' +
      'Use Vest\'s only() function or form-level validation instead. ' +
      'See migration guide: https://...'
    );
  }
}
```

1. **Keep minimal implementation** but document as deprecated
1. **Remove in next major version**

However, I **strongly recommend immediate removal** because:

- The feature is not widely adopted (based on codebase analysis)
- Native Vest patterns are superior
- Reduces maintenance burden
- Simplifies the library API

## Benefits of Removal

1. **Simpler API**: One less concept for users to learn
2. **Better alignment**: Uses Vest.js idioms instead of custom patterns
3. **Less code**: Removes ~100 lines of complex RxJS stream management
4. **Clearer validation logic**: All validation rules in one place (the suite)
5. **Better performance**: No extra watchers/streams for field dependencies
6. **Easier testing**: Validation logic is pure functions in the suite

## Implementation Checklist

### Phase 1: Code Removal

- [ ] Remove `validationConfig` input from `NgxFormDirective`
- [ ] Remove `#setupValidationConfigStreams()` method
- [ ] Remove `#createDependencyStreams()` method
- [ ] Remove `#validateDependentFields()` method
- [ ] Remove constructor call to setup streams
- [ ] Clean up unused RxJS imports
- [ ] Remove related test files

### Phase 2: Documentation Updates

- [ ] Update `.github/instructions/ngx-vest-forms.instructions.md`
- [ ] Add "Dependent Field Validation" section with Vest patterns
- [ ] Update README files
- [ ] Update any example projects
- [ ] Create migration guide

### Phase 3: Testing

- [ ] Add tests for recommended Vest patterns
- [ ] Verify all existing functionality still works
- [ ] Test example applications

## Migration Examples

### Simple Password Confirmation

**Old approach:**

```typescript
// Component
protected validationConfig = { password: ['confirmPassword'] };

// Suite
test('confirmPassword', 'Passwords must match', () => {
  enforce(data.confirmPassword).equals(data.password);
});
```

**New approach:**

```typescript
// Suite only - Note: This shows the old unidirectional approach for comparison
export const validations = staticSuite((data, field) => {
  if (field === 'password') {
    only('password', 'confirmPassword');
  } else if (field) {
    only(field);
  }

  test('password', 'Password is required', () => {
    enforce(data.password).isNotEmpty();
  });

  test('confirmPassword', 'Passwords must match', () => {
    enforce(data.confirmPassword).equals(data.password);
  });
});
```

**Better approach (bidirectional):**

```typescript
// Suite only - Recommended bidirectional approach
export const validations = staticSuite((data, field) => {
  // Bidirectional dependency for better UX
  if (field === 'password' || field === 'confirmPassword') {
    only('password', 'confirmPassword');
  } else if (field) {
    only(field);
  }

  test('password', 'Password is required', () => {
    enforce(data.password).isNotEmpty();
  });

  test('confirmPassword', 'Passwords must match', () => {
    enforce(data.confirmPassword).equals(data.password);
  });
});
```

### Complex Dependencies

**Old approach:**

```typescript
protected validationConfig = {
  startDate: ['endDate'],
  endDate: ['startDate'],
  type: ['category', 'subcategory']
};
```

**New approach:**

```typescript
export const validations = staticSuite((data, field) => {
  // Handle date dependencies
  if (field === 'startDate' || field === 'endDate') {
    only('startDate', 'endDate');
  }
  // Handle type dependencies
  else if (field === 'type') {
    only('type', 'category', 'subcategory');
  } else if (field) {
    only(field);
  }

  // Tests here...
});
```

## Timeline

1. **Phase 1 (Immediate)**: Remove code and update core documentation
2. **Phase 2 (1-2 days)**: Add migration examples and update instructions
3. **Phase 3 (1 week)**: Update any example projects/demos

## Decision Rationale

**Recommendation: Remove `validationConfig` completely** without backwards compatibility. The native Vest.js patterns are:

- ✅ Easier to understand
- ✅ More performant
- ✅ Better documented in Vest.js docs
- ✅ More flexible
- ✅ Require zero library-specific knowledge
- ✅ Align with Vest v5 best practices

The migration path is straightforward, and the resulting code is cleaner and more maintainable. Users benefit from learning standard Vest patterns that work across all Vest.js applications, not just Angular ones.

## Files to Modify

1. `/projects/ngx-vest-forms/core/src/lib/directives/form.directive.ts` - Remove validationConfig code
2. `/.github/instructions/ngx-vest-forms.instructions.md` - Update documentation
3. Any example components using validationConfig
4. Test files related to validationConfig functionality
5. README files mentioning validationConfig

This refactor will result in a cleaner, more maintainable library that better aligns with Vest.js best practices while reducing the learning curve for users.
