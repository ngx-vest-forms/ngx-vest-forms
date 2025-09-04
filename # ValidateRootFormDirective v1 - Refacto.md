# ValidateRootFormDirective v1 - Refactoring Requirements

## Overview

The `ValidateRootFormDirective` in ngx-vest-forms v1 provides root-level form validation capabilities, allowing validation of the entire form as a single unit rather than individual fields. While functional, several improvements can make it more intuitive and maintainable.

## Current Implementation Issues

### 1. Confusing Directive Name

**Problem:**

- The name `validateRootForm` is ambiguous and not self-documenting
- "Root" could mean root component, root element, or root of a tree structure
- Doesn't clearly indicate the validation happens across the entire form
- Not a common term in form validation terminology

**Required Change:**
Rename the directive to `validateFormGlobally` to better reflect its purpose:

- Clearly indicates this validates the entire form as a whole unit
- "Globally" implies cross-field, form-wide validation
- More intuitive for developers to understand this is for form-level validation rules
- Covers all use cases: cross-field validations, business rules, and global constraints

### 2. Confusing Selector and Input Binding Conflict

**Problem:**

- The directive selector requires `validateRootForm` attribute to be present: `form[validateRootForm][formValue][suite]`
- However, there's also an input `validateRootForm` with default value `false`
- This creates confusion: the directive is active when the attribute is present, but the input defaults to disabling validation

**Current Code:**

```typescript
@Directive({
  selector: 'form[validateRootForm][formValue][suite]', // Requires attribute
})
export class ValidateRootFormDirective<T> {
  public readonly validateRootForm = input(false); // Conflicting input with default false
}
```

**Required Change:**
Remove the `validateRootForm` input entirely. The presence of the attribute should be sufficient to enable root form validation.

### 3. Hardcoded String Instead of Constant

**Problem:**

- The field name `'rootForm'` is hardcoded in the validate method
- The library already has a `ROOT_FORM` constant that should be used for consistency

**Current Code:**

```typescript
public validate(control: AbstractControl): Observable<ValidationErrors | null> {
  return this.createAsyncValidator('rootForm', this.validationOptions())(
    control.getRawValue()
  );
}
```

**Required Change:**
Import and use the `ROOT_FORM` constant from `'../constants'`.

### 4. Unnecessary Data Manipulation

**Problem:**

- The code clones the entire form value and then sets a field that already exists
- For root form validation, this cloning and setting operation is redundant

**Current Code:**

```typescript
const mod = cloneDeep(value as T);
set(mod as object, field, value); // Setting the same value back
```

**Required Change:**
Remove the cloning and setting operations for root form validation. Use the raw form value directly.

### 5. Overly Complex Caching Mechanism

**Problem:**

- The caching mechanism with `formValueCache` is overly complex for a single root form validation
- Since there's only one root form, we don't need a dictionary of caches

**Current Code:**

```typescript
private readonly formValueCache: {
  [field: string]: Partial<{
    sub$$: ReplaySubject<unknown>;
    debounced: Observable<any>;
  }>;
} = {};
```

**Required Change:**
Simplify to a single Subject and debounced Observable since we're only validating the root form.

### 6. Missing Documentation

**Problem:**

- No JSDoc comments explaining the directive's purpose and usage
- Developers need to refer to external documentation to understand how to use it

**Required Change:**
Add comprehensive JSDoc comments with examples.

## Proposed Refactored Implementation

````typescript
import { Directive, input, OnDestroy } from '@angular/core';
import {
  AbstractControl,
  AsyncValidator,
  NG_ASYNC_VALIDATORS,
  ValidationErrors,
} from '@angular/forms';
import {
  debounceTime,
  Observable,
  of,
  Subject,
  switchMap,
  takeUntil,
} from 'rxjs';
import { StaticSuite } from 'vest';
import { ROOT_FORM } from '../constants';
import { ValidationOptions } from './validation-options';

/**
 * Validates the entire form as a single unit using the ROOT_FORM field in vest suites.
 *
 * This directive is useful for:
 * - Cross-field validations (e.g., at least one contact method required)
 * - Business rules that depend on multiple fields
 * - Global form constraints
 * - Form-wide business logic that requires the entire form context
 *
 * @example
 * ```html
 * <form scVestForm
 *       validateFormGlobally
 *       [formValue]="formValue()"
 *       [suite]="suite"
 *       [validationOptions]="{ debounceTime: 300 }"
 *       (errorsChange)="errors.set($event)">
 * </form>
 * ```
 *
 * @example
 * ```typescript
 * // In your vest suite:
 * import { ROOT_FORM } from 'ngx-vest-forms';
 * import { enforce } from 'vest';
 *
 * test(ROOT_FORM, 'At least one phone number is required', () => {
 *   enforce(model.phones?.length).greaterThan(0);
 * });
 *
 * test(ROOT_FORM, 'Cannot submit during maintenance hours', () => {
 *   const hour = new Date().getHours();
 *   enforce(hour).not.equals(2); // 2 AM maintenance
 * });
 * ```
 */
@Directive({
  selector: 'form[validateFormGlobally][formValue][suite]',
  providers: [
    {
      provide: NG_ASYNC_VALIDATORS,
      useExisting: ValidateFormGloballyDirective,
      multi: true,
    },
  ],
})
export class ValidateFormGloballyDirective<T>
  implements AsyncValidator, OnDestroy
{
  /**
   * Validation options for debouncing
   */
  public readonly validationOptions = input<ValidationOptions>({
    debounceTime: 0,
  });

  /**
   * The current form value to validate
   */
  public readonly formValue = input<T | null>(null);

  /**
   * The vest suite to use for validation
   */
  public readonly suite = input<StaticSuite<
    string,
    string,
    (model: T, field: string) => void
  > | null>(null);

  private readonly destroy$ = new Subject<void>();
  private readonly valueSubject$ = new Subject<T>();
  private readonly debouncedValue$ = this.valueSubject$.pipe(
    debounceTime(this.validationOptions().debounceTime),
    takeUntil(this.destroy$)
  );

  /**
   * Validates the entire form using the ROOT_FORM field in the vest suite
   */
  public validate(
    control: AbstractControl<any, any>
  ): Observable<ValidationErrors | null> {
    const suite = this.suite();
    const formValue = this.formValue();

    if (!suite || !formValue) {
      return of(null);
    }

    const rawValue = control.getRawValue() as T;
    this.valueSubject$.next(rawValue);

    return this.debouncedValue$.pipe(
      switchMap((value) => {
        return new Observable<ValidationErrors | null>((observer) => {
          suite(value, ROOT_FORM).done((result) => {
            const errors = result.getErrors()[ROOT_FORM];
            observer.next(errors ? { error: errors[0], errors } : null);
            observer.complete();
          });
        });
      })
    );
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
````

## Benefits of Refactoring

1. **Clearer Intent**: The new name `validateFormGlobally` immediately indicates form-level validation
2. **Better Documentation**: The directive purpose is self-documenting through its name
3. **Consistency**: Using the `ROOT_FORM` constant aligns with the rest of the library
4. **Performance**: Removing unnecessary cloning and complex caching improves performance
5. **Simplicity**: Cleaner, more maintainable code that's easier to understand
6. **Comprehensive Coverage**: The name covers all use cases (cross-field, business rules, global constraints)

## Migration Guide

For users upgrading from v1:

1. **Rename the directive**: Change `validateRootForm` to `validateFormGlobally` in templates

   ```html
   <!-- Before -->
   <form scVestForm validateRootForm [formValue]="formValue()" [suite]="suite">
     <!-- After -->
     <form
       scVestForm
       validateFormGlobally
       [formValue]="formValue()"
       [suite]="suite"
     ></form>
   </form>
   ```

2. **Remove binding syntax**: Remove any `[validateRootForm]="true"` bindings - just use the attribute
3. **Update imports**: Change import from `ValidateRootFormDirective` to `ValidateFormGloballyDirective`
4. **Vest suite remains the same**: Continue using the `ROOT_FORM` constant in your vest suites
5. **Validation behavior**: The validation behavior remains identical, but performance should be improved

## Testing Considerations

- Verify that existing forms with the new `validateFormGlobally` attribute work correctly
- Test debouncing behavior with different `validationOptions`
- Ensure proper cleanup on component destruction
- Validate that errors are properly propagated to the form
- Test migration path to ensure smooth upgrade from v1

## Alternative Names Considered

- `validateCrossFields`: Too narrow, excludes business rules and global constraints
- `validateFormLevel`: Shorter but less descriptive than `validateFormGlobally`
- `crossFieldValidation`: Misleading for non-cross-field global validations

The chosen name `validateFormGlobally` best represents the full scope of this directive's capabilities.
