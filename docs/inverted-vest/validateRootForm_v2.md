# Form-Level Validation (v2) - NgxFormLevelValidationDirective

## Overview

The **Form-Level Validation** feature in ngx-vest-forms v2 provides opt-in root form validation using Vest.js. This directive enables validation that spans across multiple form fields or validates the entire form as a unit.

## Key Improvements from v1

### 1. **Clearer Naming Convention**

- **v1**: `validateRootForm`, `ROOT_FORM`, `NgxValidateRootFormDirective`
- **v2**: `formLevelValidation`, `formLevelValidationMode`, `formLevelSuite`, `NgxFormLevelValidationDirective`

### 2. **Simplified Error Shape**

- **v1**: `{ error?: string; errors?: string[]; warnings?: string[] }`
- **v2**: `{ errors?: string[]; warnings?: string[] }` (arrays only)

### 3. **Signal-Based State Management**

- Uses Angular signals for submit state tracking
- Better performance with OnPush change detection
- Cleaner internal state management

### 4. **No Dependency Injection Cycles**

- Resolves Vest suite locally within the directive
- Eliminates potential circular dependency issues

## API Reference

### Directive Selector

```typescript
form[ngxVestForm][formLevelValidation];
```

### Inputs

#### `formLevelValidation: boolean`

- **Default**: `false` (disabled by default)
- **Purpose**: Enables form-level validation
- **Usage**: Set to `true` to activate the feature

```html
<form ngxVestForm formLevelValidation="true">
  <!-- form fields -->
</form>
```

#### `formLevelValidationMode: 'submit' | 'live'`

- **Default**: `'submit'`
- **Purpose**: Controls when validation runs
- **Options**:
  - `'submit'`: Validates only after first form submission
  - `'live'`: Validates in real-time as users interact with the form

```html
<!-- Submit mode (default) -->
<form ngxVestForm formLevelValidation="true">
  <!-- form fields -->
</form>

<!-- Live mode -->
<form ngxVestForm formLevelValidation="true" [formLevelValidationMode]="'live'">
  <!-- form fields -->
</form>
```

#### `formLevelSuite: NgxVestSuite<Record<string, unknown>> | null`

- **Default**: `null`
- **Purpose**: Provides the Vest validation suite for form-level validation
- **Type**: `NgxVestSuite<Record<string, unknown>>`

```typescript
// Define your form-level validation suite
const formLevelSuite = staticSuite((data = {}, field) => {
  // Cross-field validation
  test('passwordConfirm', 'Passwords must match', () => {
    enforce(data.password).equals(data.passwordConfirm);
  });

  // Form-level business rules
  test('terms', 'You must accept the terms', () => {
    enforce(data.acceptTerms).isTruthy();
  });
});
```

```html
<form ngxVestForm formLevelValidation="true" [formLevelSuite]="formLevelSuite">
  <!-- form fields -->
</form>
```

#### `validationOptions: NgxValidationOptions`

- **Purpose**: Controls debounce timing for live validation
- **Default**: `{ debounceTime: 300 }`

```html
<form
  ngxVestForm
  formLevelValidation="true"
  [formLevelValidationMode]="'live'"
  [validationOptions]="{ debounceTime: 500 }"
>
  <!-- form fields -->
</form>
```

## Implementation Details

### Error Handling

Form-level validation errors are mapped to a specific root key using `injectNgxRootFormKey()`. The error shape is simplified to use arrays only:

```typescript
// v2 Error Shape
{
  errors?: string[];
  warnings?: string[];
}
```

### Submit State Management

The directive uses Angular signals to track form submission state:

- `#hasSubmitted` signal tracks whether the form has been submitted
- In submit mode, validation only runs after the first submission
- In live mode, validation runs immediately on form changes

### Validation Flow

1. **Setup**: Directive implements `AsyncValidator` interface
2. **State Tracking**: Uses signals to manage submit state
3. **Validation Trigger**:
   - Submit mode: `onSubmit()` handler sets submit state and retriggers validation
   - Live mode: Validates on every form change with debouncing
4. **Error Mapping**: Maps Vest results to simplified error arrays
5. **Form Integration**: Updates Angular form validity state

## Usage Examples

### Basic Cross-Field Validation

```typescript
// user-form.validations.ts
import { staticSuite, test, enforce } from 'vest';

export const userFormValidations = staticSuite((data = {}, field) => {
  test('passwordConfirm', 'Passwords must match', () => {
    enforce(data.password).equals(data.passwordConfirm);
  });
});

// user-form.component.ts
@Component({
  selector: 'app-user-form',
  imports: [ngxVestForms, NgxControlWrapper],
  template: `
    <form
      ngxVestForm
      formLevelValidation="true"
      [formLevelSuite]="validationSuite"
      [(formValue)]="model"
    >
      <ngx-control-wrapper>
        <label for="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          [ngModel]="model().password"
        />
      </ngx-control-wrapper>

      <ngx-control-wrapper>
        <label for="passwordConfirm">Confirm Password</label>
        <input
          id="passwordConfirm"
          name="passwordConfirm"
          type="password"
          [ngModel]="model().passwordConfirm"
        />
      </ngx-control-wrapper>

      <!-- Display form-level errors -->
      <div class="form-errors" *ngIf="formErrors().length > 0">
        <p *ngFor="let error of formErrors()">{{ error }}</p>
      </div>

      <button type="submit">Register</button>
    </form>
  `,
})
export class UserFormComponent {
  protected readonly model = signal({
    password: '',
    passwordConfirm: '',
  });

  protected readonly validationSuite = userFormValidations;

  // Access form-level errors
  protected readonly formErrors = computed(() => {
    const errors = this.vestResult()?.getErrors();
    return errors?.[injectNgxRootFormKey()] || [];
  });
}
```

### Live Validation Mode

```typescript
@Component({
  template: `
    <form
      ngxVestForm
      formLevelValidation="true"
      [formLevelValidationMode]="'live'"
      [formLevelSuite]="validationSuite"
      [(formValue)]="model"
    >
      <!-- form fields -->

      <!-- Form-level errors show immediately -->
      <div class="live-errors" *ngIf="formErrors().length > 0">
        <p *ngFor="let error of formErrors()">{{ error }}</p>
      </div>
    </form>
  `,
})
export class LiveValidationFormComponent {
  // ... component implementation
}
```

### Business Rule Validation

```typescript
// order-form.validations.ts
export const orderFormValidations = staticSuite((data = {}, field) => {
  // Business rule: minimum order amount
  test('minimumOrder', 'Minimum order amount is $20', () => {
    const total =
      data.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) ||
      0;
    enforce(total).greaterThanOrEquals(20);
  });

  // Business rule: shipping address required for physical items
  test(
    'shippingAddress',
    'Shipping address required for physical items',
    () => {
      const hasPhysicalItems = data.items?.some(
        (item) => item.type === 'physical',
      );
      if (hasPhysicalItems) {
        enforce(data.shippingAddress).isNotEmpty();
      }
    },
  );
});
```

## Migration from v1

### Directive Name Change

```typescript
// v1
import { NgxValidateRootFormDirective } from 'ngx-vest-forms/core';

// v2
import { NgxFormLevelValidationDirective } from 'ngx-vest-forms/core';
```

### Template Updates

```html
<!-- v1 -->
<form ngxVestForm validateRootForm="true" [validateRootMode]="'live'">
  <!-- v2 -->
  <form
    ngxVestForm
    formLevelValidation="true"
    [formLevelValidationMode]="'live'"
  ></form>
</form>
```

### Input Property Changes

- `validateRootForm` → `formLevelValidation`
- `validateRootMode` → `formLevelValidationMode`
- `crossFieldVestSuite` → `formLevelSuite`

### Error Shape Updates

```typescript
// v1 - Mixed error shape
{
  error?: string;
  errors?: string[];
  warnings?: string[];
}

// v2 - Arrays only
{
  errors?: string[];
  warnings?: string[];
}
```

## Testing

### Unit Testing

```typescript
import { NgxFormLevelValidationDirective } from 'ngx-vest-forms/core';

describe('NgxFormLevelValidationDirective', () => {
  it('should be disabled by default', async () => {
    await render(TestComponent);
    // Directive not active without formLevelValidation="true"
  });

  it('should validate on submit in submit mode', async () => {
    await render(TestComponentWithValidation);
    // Submit form and check for validation errors
  });

  it('should validate live in live mode', async () => {
    await render(TestComponentWithLiveValidation);
    // Change form values and check immediate validation
  });
});
```

## Best Practices

### 1. **Use Submit Mode by Default**

- Less intrusive user experience
- Better performance for complex validations
- Switch to live mode only when immediate feedback is needed

### 2. **Keep Form-Level Validations Simple**

- Focus on cross-field relationships and business rules
- Use field-level validation for individual field constraints
- Avoid complex computations in live mode

### 3. **Provide Clear Error Messages**

- Make form-level errors easily distinguishable from field errors
- Use specific, actionable error messages
- Consider error placement and styling

### 4. **Test Both Modes**

- Ensure validation works correctly in both submit and live modes
- Test edge cases like rapid form changes in live mode
- Verify error clearing behavior

## Technical Implementation

### Signal-Based Architecture

The v2 implementation leverages Angular signals for better performance and cleaner state management:

```typescript
export class NgxFormLevelValidationDirective implements AsyncValidator {
  // Internal submit state tracking
  #hasSubmitted = signal(false);

  // Submit handler updates signal state
  @HostListener('submit', ['$event'])
  protected onSubmit(event: Event): void {
    if (!this.#hasSubmitted()) {
      this.#hasSubmitted.set(true);
      // Retrigger validation after submit
    }
  }

  // Validation respects submit state
  validate(control: AbstractControl): Observable<ValidationErrors | null> {
    if (this.formLevelValidationMode === 'submit' && !this.#hasSubmitted()) {
      return of(null); // Skip validation before submit
    }
    // ... validation logic
  }
}
```

### Error Mapping

Simplified error mapping focuses on arrays only:

```typescript
private mapVestResultToValidationErrors(vestResult: SuiteResult): ValidationErrors | null {
  const rootKey = injectNgxRootFormKey();
  const errors = vestResult.getErrors()[rootKey];
  const warnings = vestResult.getWarnings()[rootKey];

  if (!errors?.length && !warnings?.length) {
    return null;
  }

  return {
    ...(errors?.length && { errors }),
    ...(warnings?.length && { warnings })
  };
}
```

## Conclusion

The v2 Form-Level Validation directive provides a robust, performant, and developer-friendly approach to root form validation. The clearer naming, simplified error shape, and signal-based architecture make it easier to understand, implement, and maintain.
