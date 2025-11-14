# Validation Features: Complete Guide

## Overview

ngx-vest-forms provides three complementary features for handling validation in complex, dynamic forms:

- **`validationConfig`**: Triggers **re-validation** of dependent fields (when field X changes, also validate field Y)
- **`validateRootForm`**: Enables **form-level** validation (cross-field rules at the form level)
- **`triggerFormValidation()`**: Manually triggers validation when form **structure** changes

**Key Insight**: These are **not alternatives** - they solve different problems and often work together!

## Quick Comparison

| Feature                 | `validationConfig`                            | `validateRootForm`                               | `triggerFormValidation()`                                     |
| ----------------------- | --------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------- |
| **Purpose**             | Re-validation trigger                         | Create form-level validations                    | Manual validation trigger                                     |
| **What it does**        | When field X changes, re-validate field Y     | Runs ROOT_FORM tests from Vest suite             | Forces validation update when form structure changes          |
| **Where errors appear** | At **field level** (`errors.fieldName`)       | At **form level** (`errors.rootForm`)            | N/A (triggers existing validations)                           |
| **Use for**             | Field validations that depend on other fields | Form-wide business rules                         | Structure changes without value changes                       |
| **When to call**        | Automatic (via config)                        | Automatic (on blur/submit)                       | Manual (after structure change)                               |
| **Directive/Method**    | `FormDirective` (`scVestForm`)                | `ValidateRootFormDirective` (`validateRootForm`) | `FormDirective.triggerFormValidation()` (public method)       |
| **Works with**          | Field-level tests (`test()`)                  | ROOT_FORM tests (`test(ROOT_FORM, ...)`)         | All validations (validationConfig + validateRootForm + tests) |

## Understanding validationConfig

### Purpose

**Triggers re-validation of dependent fields.** When field X changes, `validationConfig` tells Angular to also re-validate field Y.

> **Critical Distinction**: `validationConfig` does **NOT** define validation logic - it only controls WHEN validations run.
>
> - ❌ It does NOT create validation rules
> - ✅ It DOES trigger re-validation of existing rules
> - 📝 Validation logic is always defined in your Vest suite with `test()`

> **⚠️ IMPORTANT: Works with `omitWhen`/`skipWhen`**
>
> `validationConfig` is **essential** when using Vest.js's `omitWhen` or `skipWhen` for conditional validations.
> When the condition changes (e.g., password gets filled), Angular needs to know to re-validate dependent fields.
> Without `validationConfig`, conditional validations won't update properly!

### How It Works

```typescript
// Step 1: Define validation logic in Vest suite
test('confirmPassword', 'Passwords must match', () => {
  enforce(model.confirmPassword).equals(model.password);
});

// Step 2: Configure re-validation trigger
protected validationConfig = {
  'password': ['confirmPassword'],  // When password changes, re-validate confirmPassword
};
```

**Flow:**

1. User changes the `password` field
2. `validationConfig` sees `password` in the map
3. Angular calls `updateValueAndValidity()` on `confirmPassword` control
4. Vest suite runs with `only('confirmPassword')`
5. Validation result appears at **field level**: `errors['confirmPassword']`

### Use Cases

✅ **Password confirmation** - When password changes, revalidate confirmPassword

```typescript
validationConfig = {
  password: ['confirmPassword'],
  confirmPassword: ['password'], // Bidirectional
};

// Vest suite (field-level test)
test('confirmPassword', 'Passwords must match', () => {
  enforce(model.confirmPassword).equals(model.password);
});
```

✅ **Bidirectional dependencies** - Quantity ↔ Justification

```typescript
validationConfig = {
  quantity: ['justification'],
  justification: ['quantity'],
};

// Vest suite (field-level tests with omitWhen)
omitWhen(!model.quantity, () => {
  test('justification', 'Required when quantity is filled', () => {
    enforce(model.justification).isNotBlank();
  });
});
```

✅ **Conditional field requirements** - Age triggers emergency contact

```typescript
// Step 1: Vest suite with omitWhen (conditional validation logic)
omitWhen((model.age || 0) >= 18, () => {
  test('emergencyContact', 'Required for minors', () => {
    enforce(model.emergencyContact).isNotBlank();
  });
});

// Step 2: validationConfig ensures re-validation when age changes
// WITHOUT this, emergencyContact won't re-validate when age changes!
validationConfig = {
  age: ['emergencyContact'],
};
```

### Key Characteristics

- **Field-level validation**: Errors belong to specific fields
- **Validation timing**: Controls when Angular runs validators
- **Works with omitWhen**: Ensures conditional validations update properly
- **Template display**: Show errors next to the field
  ```html
  <input name="confirmPassword" [ngModel]="..." />
  @if (errors()['confirmPassword']) {
  <div>{{ errors()['confirmPassword'][0] }}</div>
  }
  ```

## Understanding validateRootForm

### Purpose

Enables **form-level** validation for cross-field business rules that don't belong to any single field.

### How It Works

```typescript
// Vest suite
import { ROOT_FORM } from 'ngx-vest-forms';

test(ROOT_FORM, 'Brecht is not 30 anymore', () => {
  enforce(
    model.firstName === 'Brecht' &&
      model.lastName === 'Billiet' &&
      model.age === 30
  ).isFalsy();
});
```

```html
<!-- Template -->
<form
  scVestForm
  validateRootForm
  [validateRootFormMode]="'submit'"
  (errorsChange)="errors.set($event)"
>
  <!-- Fields... -->

  <!-- Display form-level error -->
  @if (errors()['rootForm']) {
  <div role="alert">{{ errors()['rootForm'][0] }}</div>
  }
</form>
```

**Flow:**

1. Form value changes or submit button clicked (depending on mode)
2. `ValidateRootFormDirective` runs Vest suite with `only(ROOT_FORM)`
3. Only tests defined with `test(ROOT_FORM, ...)` execute
4. Validation result appears at **form level**: `errors[ROOT_FORM]`

### Use Cases

✅ **Form-wide business rules** - Rules spanning multiple fields

```typescript
test(ROOT_FORM, 'Brecht is not 30 anymore', () => {
  enforce(
    model.firstName === 'Brecht' &&
      model.lastName === 'Billiet' &&
      model.age === 30
  ).isFalsy();
});
```

✅ **At least one required** - Form needs at least one contact method

```typescript
test(ROOT_FORM, 'At least one contact method required', () => {
  enforce(model.email || model.phone || model.address).isTruthy();
});
```

✅ **Date range validation** - Start date before end date (form-level constraint)

```typescript
test(ROOT_FORM, 'Start date must be before end date', () => {
  if (model.startDate && model.endDate) {
    enforce(new Date(model.startDate) < new Date(model.endDate)).isTruthy();
  }
});
```

✅ **Address comparison** - Billing and shipping addresses must differ

```typescript
test(ROOT_FORM, 'Addresses cannot be the same', () => {
  if (model.useDifferentShipping) {
    enforce(JSON.stringify(model.billingAddress)).notEquals(
      JSON.stringify(model.shippingAddress)
    );
  }
});
```

### Key Characteristics

- **Form-level validation**: Errors belong to the entire form
- **ROOT_FORM constant**: Special field name for form-wide rules
- **Validation modes**:
  - `'submit'` (default): Validates only after form submission
  - `'live'`: Validates on every value change
- **Template display**: Show errors at form level (typically at top or bottom)
  ```html
  @if (errors()['rootForm']) {
  <div role="alert" class="form-error">{{ errors()['rootForm'][0] }}</div>
  }
  ```

## Understanding triggerFormValidation()

### Purpose

Manually triggers validation update when form **structure** changes without triggering value changes (e.g., switching between inputs and non-form content).

### How It Works

```typescript
// Component method
this.vestFormRef().triggerFormValidation();
```

**Flow:**

1. Form structure changes (e.g., `@if` switches from `<input>` to `<p>`)
2. No control values changed → No `ValueChangeEvent` → No automatic validation
3. Call `triggerFormValidation()` manually
4. Calls `updateValueAndValidity({ emitEvent: true })` on root form
5. All validations re-run (field-level + form-level)

### Use Cases

✅ **Switching between input and non-input content**

```typescript
@Component({
  template: `
    <form scVestForm #vestForm="scVestForm">
      <select
        name="type"
        [ngModel]="formValue().type"
        (ngModelChange)="onTypeChange($event)"
      >
        <option value="typeA">Type A</option>
        <option value="typeC">Type C (no input)</option>
      </select>

      @if (formValue().type === 'typeA') {
        <input name="fieldA" [ngModel]="formValue().fieldA" />
      } @else {
        <p>No additional input required.</p>
      }
    </form>
  `,
})
class MyComponent {
  protected readonly vestFormRef = viewChild.required('vestForm', {
    read: FormDirective,
  });

  onTypeChange(type: string) {
    this.formValue.update((v) => ({ ...v, type, fieldA: undefined }));
    this.vestFormRef().triggerFormValidation(); // ✅ CRITICAL
  }
}
```

✅ **After clearing fields programmatically** - Using field clearing utilities

✅ **Dynamic form modes** - Switching between different layouts

### Key Characteristics

- **Manual**: Must be called explicitly (not automatic)
- **Form-wide**: Triggers ALL validations (fields + root form)
- **Structure changes**: Needed when controls added/removed without value changes
- **Zero overhead**: Only runs when explicitly called

### Common Pattern with Field Clearing

```typescript
import { clearFieldsWhen } from 'ngx-vest-forms';

onTypeChange(type: string) {
  this.formValue.update(v => {
    const cleared = clearFieldsWhen(v, { fieldA: type !== 'typeA' });
    return { ...cleared, type };
  });
  this.vestFormRef().triggerFormValidation(); // Always call after clearing
}
```

> **📖 See Also**: [Field Clearing Utilities](./FIELD-CLEARING-UTILITIES.md) and [Structure Change Detection](./STRUCTURE_CHANGE_DETECTION.md) for detailed examples.

## Working Together: All Three Features

These features complement each other in complex, dynamic forms:

```typescript
// Component
@Component({
  template: `
    <form
      scVestForm
      [validationConfig]="validationConfig()"
      validateRootForm
      [validateRootFormMode]="'submit'"
      (errorsChange)="errors.set($event)"
      #vestForm="scVestForm"
    >
      <select
        name="type"
        [ngModel]="formValue().type"
        (ngModelChange)="onTypeChange($event)"
      >
        <option value="typeA">Type A</option>
        <option value="typeB">Type B</option>
      </select>

      @if (formValue().type === 'typeA') {
        <!-- Field-level errors with validationConfig -->
        <input name="password" [ngModel]="formValue().password" />
        @if (errors()['password']) {
          <div>{{ errors()['password'][0] }}</div>
        }

        <input name="confirmPassword" [ngModel]="formValue().confirmPassword" />
        @if (errors()['confirmPassword']) {
          <div>{{ errors()['confirmPassword'][0] }}</div>
        }
      } @else {
        <p>Type B requires no password.</p>
      }

      <!-- Form-level errors from ROOT_FORM -->
      @if (errors()['rootForm']) {
        <div role="alert" class="form-error">
          {{ errors()['rootForm'][0] }}
        </div>
      }

      <button type="submit">Submit</button>
    </form>
  `,
})
export class MyFormComponent {
  protected readonly vestFormRef = viewChild.required('vestForm', {
    read: FormDirective,
  });
  protected readonly formValue = signal<MyFormModel>({});
  protected readonly errors = signal<Record<string, string[]>>({});

  // validationConfig: Field dependency timing
  protected readonly validationConfig = computed(() => {
    const config: Record<string, string[]> = {};
    if (this.formValue().type === 'typeA') {
      config['password'] = ['confirmPassword']; // When password changes, revalidate confirm
    }
    return config;
  });

  protected readonly suite = staticSuite(
    (model: MyFormModel, field?: string) => {
      only(field);

      // Field-level validations
      omitWhen(model.type !== 'typeA', () => {
        test('password', 'Password required', () => {
          enforce(model.password).isNotBlank();
        });
        test('confirmPassword', 'Passwords must match', () => {
          enforce(model.confirmPassword).equals(model.password);
        });
      });

      // Form-level validation using ROOT_FORM
      test(ROOT_FORM, 'At least one contact method required', () => {
        enforce(model.email || model.phone).isTruthy();
      });
    }
  );

  // triggerFormValidation(): After structure changes
  onTypeChange(type: string) {
    this.formValue.update((v) => ({
      ...v,
      type,
      // Clear fields when switching types
      ...(type !== 'typeA' && {
        password: undefined,
        confirmPassword: undefined,
      }),
    }));
    this.vestFormRef().triggerFormValidation(); // ✅ CRITICAL: Update validation after structure change
  }
}
```

**This example demonstrates:**

1. **`validationConfig`**: When `password` changes, automatically revalidate `confirmPassword`
2. **`validateRootForm`**: Form-level rule ("at least one contact method") appears at form level
3. **`triggerFormValidation()`**: Called after type change to update validation when structure changes

## Decision Tree: Which Features to Use?

### Use `validationConfig` when:

- ✅ Field Y's **validation logic** checks field X's value
- ✅ When field X **changes**, field Y needs to be **re-validated**
- ✅ You need **bidirectional re-validation** (when A changes → validate B, when B changes → validate A)
- ✅ Using `omitWhen` for **conditional field requirements**
- ✅ Error belongs to a **specific field** (not form-level)

**Examples:**

- Password confirmation
- Quantity requires justification
- Age triggers emergency contact requirement
- End date must be after start date (error on end date field)

### Use `validateRootForm` when:

- ✅ Error belongs to the **entire form**, not a specific field
- ✅ Rule validates **multiple fields together** as a business constraint
- ✅ No single field "owns" the error
- ✅ Error should display **at form level** (top/bottom)
- ✅ Want to control **when** validation runs (submit vs live)

**Examples:**

- "Brecht is not 30 anymore" (firstName + lastName + age)
- "At least one contact method required" (email OR phone OR address)
- "Addresses cannot be identical" (comparing two address groups)
- Form-wide business rules

### Use `triggerFormValidation()` when:

- ✅ Form **structure changes** without value changes
- ✅ Switching between **input fields and non-form content** (e.g., `<p>` tags)
- ✅ Clearing fields programmatically with utilities
- ✅ Dynamic form modes or layouts
- ✅ Need to **force validation update** after structural change

**Examples:**

- Switching from form inputs to informational text
- After using `clearFieldsWhen()` or similar utilities
- Dynamic conditional form layouts
- After programmatic form value manipulation

### Use ALL THREE when:

- ✅ Complex **dynamic forms** with multiple concerns:
  - Field-level dependencies (`validationConfig`)
  - Form-level business rules (`validateRootForm`)
  - Dynamic structure changes (`triggerFormValidation()`)
- ✅ Forms with **conditional layouts** and **cross-field validation**
- ✅ Need **comprehensive validation** at all levels

**Example:** Purchase form with:

- Field-level: Password confirmation (`validationConfig`)
- Form-level: "Brecht is not 30 anymore" (`validateRootForm`)
- Structure changes: Switching between form types (`triggerFormValidation()`)

## Common Mistakes

### ❌ Using ROOT_FORM for field-level validation

```typescript
// ❌ WRONG: Password mismatch belongs to confirmPassword field
test(ROOT_FORM, 'Passwords must match', () => {
  enforce(model.confirmPassword).equals(model.password);
});
```

```typescript
// ✅ CORRECT: Field-level validation with validationConfig
test('confirmPassword', 'Passwords must match', () => {
  enforce(model.confirmPassword).equals(model.password);
});

// In component:
validationConfig = { password: ['confirmPassword'] };
```

### ❌ Using validationConfig for form-level rules

```typescript
// ❌ WRONG: Can't use validationConfig for form-wide constraints
// Where would the error show? firstName? lastName? age?
validationConfig = {
  firstName: ['lastName', 'age'], // Doesn't make semantic sense
};
```

```typescript
// ✅ CORRECT: Form-level validation with ROOT_FORM
test(ROOT_FORM, 'Brecht is not 30 anymore', () => {
  enforce(
    model.firstName === 'Brecht' &&
      model.lastName === 'Billiet' &&
      model.age === 30
  ).isFalsy();
});
```

### ❌ Forgetting validationConfig with omitWhen

```typescript
// ❌ WRONG: confirmPassword won't revalidate when password changes
omitWhen(!model.password, () => {
  test('confirmPassword', 'Required', () => {
    enforce(model.confirmPassword).isNotBlank();
  });
});
// Missing: validationConfig = { 'password': ['confirmPassword'] }
```

```typescript
// ✅ CORRECT: Include validationConfig for proper timing
omitWhen(!model.password, () => {
  test('confirmPassword', 'Required', () => {
    enforce(model.confirmPassword).isNotBlank();
  });
});

// In component:
validationConfig = { password: ['confirmPassword'] };
```

## Summary Table

| Scenario                           | Solution                     | Why                                                         |
| ---------------------------------- | ---------------------------- | ----------------------------------------------------------- |
| Password confirmation              | `validationConfig`           | Field-level validation - error belongs to `confirmPassword` |
| "Brecht is not 30"                 | `validateRootForm`           | Form-level rule - doesn't belong to any single field        |
| Switching form type (input → text) | `triggerFormValidation()`    | Structure change without value change                       |
| Quantity ↔ Justification          | `validationConfig`           | Bidirectional field-level validations                       |
| At least one contact method        | `validateRootForm`           | Form-level constraint across multiple fields                |
| Clearing fields programmatically   | `triggerFormValidation()`    | After using field clearing utilities                        |
| Age triggers emergency contact     | `validationConfig`           | Conditional field requirement                               |
| Addresses must differ              | `validateRootForm`           | Form-wide business rule                                     |
| Dynamic conditional layout         | `triggerFormValidation()`    | Controls added/removed based on conditions                  |
| End date after start date          | `validationConfig` (usually) | Field-level validation on `endDate` field                   |
| Complex dynamic purchase form      | **ALL THREE**                | Field dependencies + form-level rules + structure changes   |

## Additional Resources

- **[README: Validation](../README.md#validation)** - Core validation concepts
- **[README: Dependent Field Validation](../README.md#dependent-field-validation-with-conditional-rendering)** - validationConfig patterns
- **[README: Root Form Validation](../README.md#validations-on-the-root-form)** - validateRootForm usage
- **[Complete Example](./COMPLETE-EXAMPLE.md)** - Full working example
- **[Migration Guide](./MIGRATION.md)** - Upgrading to v3 (validateRootFormMode change)
- **[Vest.js Documentation](https://vestjs.dev)** - Validation framework docs
