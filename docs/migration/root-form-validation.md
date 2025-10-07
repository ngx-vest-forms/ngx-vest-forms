# Root Form Validation Migration Guide

> **V1 → V2 Breaking Change**: The `validateRootForm` directive and `ROOT_FORM` constant have been removed.

## What Was `validateRootForm` in V1?

In ngx-vest-forms V1, root form validation was a special feature for validating the entire form as a single unit, typically used for cross-field validation rules that didn't belong to any specific field.

### V1 Pattern

```typescript
import { ROOT_FORM } from 'ngx-vest-forms';

// V1 validation suite
const userSuite = create((data, field) => {
  if (field) {
    only(field);
  }

  test('firstName', 'First name is required', () => {
    enforce(data.firstName).isNotEmpty();
  });

  test('lastName', 'Last name is required', () => {
    enforce(data.lastName).isNotEmpty();
  });

  test('age', 'Age is required', () => {
    enforce(data.age).isNotEmpty();
  });

  // Root form validation
  test(ROOT_FORM, 'Brecht is not 30 anymore', () => {
    enforce(
      data.firstName === 'Brecht' &&
        data.lastName === 'Billiet' &&
        data.age === 30,
    ).isFalsy();
  });
});

// V1 component
@Component({
  template: `
    <form
      scVestForm
      [vestSuite]="suite"
      [validateRootForm]="true"
      (errorsChange)="errors.set($event)"
    >
      <!-- Form fields -->

      <!-- Display root form error -->
      @if (errors()?.['rootForm']) {
        <p class="error">{{ errors()['rootForm'] }}</p>
      }
    </form>
  `,
})
export class UserFormComponent {
  errors = signal<Record<string, string>>({});
}
```

### Problems with V1 Approach

1. **Special constant required** (`ROOT_FORM`) - Magic string with no semantic meaning
2. **Manual error state management** - Required `(errorsChange)` output binding
3. **Extra directive configuration** - `[validateRootForm]="true"` toggle
4. **Disconnect from fields** - Errors appeared in special `'rootForm'` key, not on actual fields
5. **Poor accessibility** - Root errors weren't associated with form controls

## Why It Was Removed in V2

V2's **Vest-first architecture** makes root form validation obsolete by design:

### 1. **Vest Runs All Tests Automatically**

In V2, `createVestForm()` runs the entire Vest suite on every validation call. There's no need for a special "root form" concept - **all validation is form-level by default**.

```typescript
// V2: Form always validates everything
const form = createVestForm(suite, signal({ ... }));

// When you call submit, ALL tests run
const result = await form.submit();
console.log(result.errors); // All field errors, including cross-field
```

### 2. **Cross-Field Errors Belong to Fields**

V2 encourages **attaching cross-field errors to the most relevant field** instead of a separate "root" bucket:

```typescript
import { staticSafeSuite } from 'ngx-vest-forms';
import { test, enforce } from 'vest';

// V2: Attach cross-field error to the relevant field
const userSuite = staticSafeSuite<UserModel>((data) => {
  test('firstName', 'First name is required', () => {
    enforce(data.firstName).isNotEmpty();
  });

  test('lastName', 'Last name is required', () => {
    enforce(data.lastName).isNotEmpty();
  });

  test('age', 'Age is required', () => {
    enforce(data.age).isNotEmpty();
  });

  // Attach error to 'age' field (the field being validated)
  test('age', 'Brecht is not 30 anymore', () => {
    enforce(
      data.firstName === 'Brecht' &&
        data.lastName === 'Billiet' &&
        data.age === 30,
    ).isFalsy();
  });
});
```

**Benefits:**

- ✅ Error appears next to the relevant field in UI
- ✅ Works with existing `NgxFormErrorComponent`
- ✅ Accessible via `form.ageField()` API
- ✅ No special handling needed
- ✅ Screen readers associate error with the field

### 3. **Global Form Validity is Built-In**

V2 provides form-level state through signals:

```typescript
// V2 component
@Component({
  imports: [NgxVestForms],
  template: `
    <form [ngxVestForm]="form" (submit)="save($event)">
      <!-- Form fields -->

      <!-- Display all errors at form level (if needed) -->
      @if (!form.valid() && form.hasSubmitted()) {
        <div role="alert" class="form-errors">
          <h3>Please fix the following errors:</h3>
          @for (entry of Object.entries(form.errors()); track entry[0]) {
            <p>
              <strong>{{ entry[0] }}:</strong> {{ entry[1][0] }}
            </p>
          }
        </div>
      }

      <button type="submit" [disabled]="form.pending()">Submit</button>
    </form>
  `,
})
export class UserFormComponent {
  form = createVestForm(
    userSuite,
    signal({
      firstName: '',
      lastName: '',
      age: 0,
    }),
  );

  async save(event: Event) {
    event.preventDefault();
    const result = await form.submit();

    if (result.valid) {
      console.log('Valid data:', result.data);
    } else {
      console.log('All errors:', result.errors);
    }
  }
}
```

**Available form-level signals:**

- `form.valid()` - Overall form validity
- `form.errors()` - All field errors in one object
- `form.pending()` - Async validation in progress
- `form.hasSubmitted()` - User attempted submission

## Migration Strategies

### Strategy 1: Attach to Relevant Field (Recommended)

**Best for:** Most cross-field validation cases

```typescript
// V1: Using ROOT_FORM
test(ROOT_FORM, 'End date must be after start date', () => {
  enforce(data.endDate > data.startDate).isTruthy();
});

// V2: Attach to endDate (the field being validated)
test('endDate', 'End date must be after start date', () => {
  enforce(data.endDate > data.startDate).isTruthy();
});
```

**Display:**

```html
<!-- V2: Error appears on endDate field -->
<label for="endDate">End Date</label>
<input
  id="endDate"
  [value]="form.endDate()"
  (input)="form.setEndDate($event)"
/>
<ngx-form-error [field]="form.endDateField()" />
<!-- Shows: "End date must be after start date" -->
```

### Strategy 2: Show All Errors at Form Level

**Best for:** Summary error lists, accessibility enhancements

```typescript
// V2 component
@Component({
  template: `
    <form [ngxVestForm]="form" (submit)="save($event)">
      <!-- Error summary at top (WCAG best practice) -->
      @if (!form.valid() && form.hasSubmitted()) {
        <div role="alert" aria-live="assertive" class="error-summary">
          <h2>Form Errors</h2>
          <ul>
            @for (entry of errorList(); track entry.field) {
              <li>
                <a [href]="'#' + entry.field">
                  {{ entry.field }}: {{ entry.message }}
                </a>
              </li>
            }
          </ul>
        </div>
      }

      <!-- Individual field errors -->
      <label for="email">Email</label>
      <input id="email" [value]="form.email()" (input)="form.setEmail($event)" />
      <ngx-form-error [field]="form.emailField()" />

      <button type="submit">Submit</button>
    </form>
  `
})
export class FormComponent {
  form = createVestForm(suite, signal({ ... }));

  // Computed signal for error summary
  errorList = computed(() => {
    const errors = this.form.errors();
    return Object.entries(errors).map(([field, messages]) => ({
      field,
      message: messages[0]
    }));
  });
}
```

### Strategy 3: Multiple Field Validation with `include()`

**Best for:** Conditional cross-field validation

```typescript
import { include } from 'vest';

const suite = staticSafeSuite<FormModel>((data) => {
  test('password', 'Password is required', () => {
    enforce(data.password).isNotEmpty();
  });

  // Revalidate confirmPassword whenever password changes
  include('confirmPassword').when('password');

  test('confirmPassword', 'Please confirm your password', () => {
    enforce(data.confirmPassword).isNotEmpty();
  });

  test('confirmPassword', 'Passwords must match', () => {
    enforce(data.confirmPassword).equals(data.password);
  });
});
```

**Display:**

```html
<!-- Errors automatically appear on confirmPassword -->
<label for="password">Password</label>
<input
  id="password"
  [value]="form.password()"
  (input)="form.setPassword($event)"
/>
<ngx-form-error [field]="form.passwordField()" />

<label for="confirmPassword">Confirm Password</label>
<input
  id="confirmPassword"
  [value]="form.confirmPassword()"
  (input)="form.setConfirmPassword($event)"
/>
<ngx-form-error [field]="form.confirmPasswordField()" />
<!-- Shows: "Passwords must match" when they differ -->
```

## Common Patterns

### Pattern 1: Date Range Validation

```typescript
// V1
test(ROOT_FORM, 'Invalid date range', () => { ... });

// V2: Attach to end date
test('endDate', 'End date must be after start date', () => {
  enforce(data.endDate).greaterThan(data.startDate);
});
```

### Pattern 2: Conditional Required Fields

```typescript
// V1
test(ROOT_FORM, 'Shipping address required for physical products', () => { ... });

// V2: Use omitWhen for conditional validation
import { omitWhen } from 'vest';

omitWhen(data.productType !== 'physical', () => {
  test('shippingAddress', 'Shipping address is required', () => {
    enforce(data.shippingAddress).isNotEmpty();
  });
});
```

### Pattern 3: Password Confirmation

```typescript
// V1
test(ROOT_FORM, 'Passwords must match', () => { ... });

// V2: Attach to confirmPassword
include('confirmPassword').when('password');

test('confirmPassword', 'Passwords must match', () => {
  enforce(data.confirmPassword).equals(data.password);
});
```

## Benefits of V2 Approach

| Aspect                 | V1 (ROOT_FORM)                       | V2 (Field-Attached)                         |
| ---------------------- | ------------------------------------ | ------------------------------------------- |
| **Accessibility**      | Poor - errors not linked to controls | ✅ Excellent - `aria-describedby` automatic |
| **User Experience**    | Confusing - where is the error?      | ✅ Clear - error next to relevant field     |
| **Code Complexity**    | High - special handling needed       | ✅ Low - works like any other error         |
| **Maintainability**    | Hard - magic strings                 | ✅ Easy - semantic field names              |
| **Framework Coupling** | High - Angular-specific directive    | ✅ Low - pure Vest.js                       |

## Summary

**V1 `validateRootForm` was removed because:**

1. ✅ **No longer needed** - V2 validates entire form by default
2. ✅ **Better UX** - Errors attach to relevant fields (accessibility)
3. ✅ **Simpler API** - No special directives or constants
4. ✅ **Vest-first** - Uses Vest's native features (`include()`, `omitWhen()`)
5. ✅ **More maintainable** - Semantic field names instead of magic `ROOT_FORM` constant

**Migration is straightforward:**

- Attach cross-field errors to the most relevant field
- Use `form.errors()` signal for form-level error display
- Leverage Vest's `include().when()` for dependent validation
- Use `omitWhen()` for conditional validation

**Questions?** Check the [V2 Migration Guide](./V1_TO_V2_MIGRATION.md) for more patterns.
