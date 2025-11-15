# Field Clearing Utilities

Utilities for managing form state when conditionally switching between **form inputs** and **non-form elements** (like informational text or static content).

## When to Use Field Clearing

These utilities are **specifically needed** when conditional logic switches between:

- **Form inputs** (`<input>`, `<select>`, `<textarea>`) ↔ **NON-form elements** (`<p>`, `<div>`, informational content)

### The Problem: State Inconsistency

```typescript
// Template with form input → non-form content switch
@if (procedureType() === 'typeA') {
  <input name="fieldA" [ngModel]="formValue().fieldA" />  // Form input
} @else if (procedureType() === 'typeB') {
  <input name="fieldB" [ngModel]="formValue().fieldB" />  // Form input
} @else if (procedureType() === 'typeC') {
  <p>No additional input required for this procedure.</p>   // NON-form element!
}
```

**What happens:**

1. **Switching FROM form input TO non-form content**: Angular removes FormControl, but component signal retains old value
2. **Result**: `ngForm.form.value` becomes clean, but `formValue()` signal remains stale
3. **Problem**: State inconsistency between Angular's form state and your component state

```typescript
// Before switching from typeA to typeC:
formValue() = { procedureType: 'typeA', fieldA: 'some-value' };
ngForm.form.value = { procedureType: 'typeA', fieldA: 'some-value' };

// After switching (WITHOUT manual clearing):
formValue() = { procedureType: 'typeC', fieldA: 'some-value' }; // ❌ Stale fieldA!
ngForm.form.value = { procedureType: 'typeC' }; // ✅ Clean

// After switching (WITH manual clearing):
formValue() = { procedureType: 'typeC' }; // ✅ Consistent
ngForm.form.value = { procedureType: 'typeC' }; // ✅ Consistent
```

### When Field Clearing is NOT Required

Pure form-to-form conditionals usually don't need manual field clearing:

```typescript
// This template structure DOES NOT require manual field clearing:
@if (inputType() === 'text') {
  <input name="field" [ngModel]="formValue().field" type="text" />
} @else if (inputType() === 'number') {
  <input name="field" [ngModel]="formValue().field" type="number" />
} @else if (inputType() === 'email') {
  <input name="field" [ngModel]="formValue().field" type="email" />
}
```

**Why:** All branches contain form inputs with the **same `name` attribute**, so Angular maintains the FormControl and your component state naturally stays consistent.

## Available Utilities

### `clearFieldsWhen` - Conditional Clearing

Conditionally clears fields based on boolean conditions. Use when switching to non-form content.

```typescript
import { clearFieldsWhen } from 'ngx-vest-forms';

// Example: Clear fields when switching to non-form content
const updatedState = clearFieldsWhen(currentFormValue, {
  fieldA: procedureType !== 'typeA', // Clear when NOT showing fieldA input
  fieldB: procedureType !== 'typeB', // Clear when NOT showing fieldB input
  shippingAddress: !useShippingAddress, // Clear when showing "No shipping needed" message
});
```

**Type signature:**

```typescript
function clearFieldsWhen<T extends Record<string, any>>(
  state: T,
  conditions: Record<keyof T, boolean>
): T;
```

### `clearFields` - Unconditional Clearing

Unconditionally clears specific fields. Useful for form reset operations or cleanup tasks.

```typescript
import { clearFields } from 'ngx-vest-forms';

// Clear specific fields unconditionally
const cleanedState = clearFields(currentFormValue, [
  'temporaryData',
  'draftSaved',
  'cachedResults',
]);
```

**Type signature:**

```typescript
function clearFields<T extends Record<string, any>>(
  state: T,
  fields: (keyof T)[]
): T;
```

### `keepFieldsWhen` - Whitelist Approach

Creates a new state containing only fields that meet specified conditions. Takes a "whitelist" approach instead of clearing unwanted fields.

```typescript
import { keepFieldsWhen } from 'ngx-vest-forms';

// Keep only relevant fields
const filteredState = keepFieldsWhen(currentFormValue, {
  basicInfo: true, // always keep
  addressInfo: needsAddress,
  paymentInfo: requiresPayment,
});
```

**Type signature:**

```typescript
function keepFieldsWhen<T extends Record<string, any>>(
  state: T,
  conditions: Record<keyof T, boolean>
): T;
```

## Complete Example

### Component with Conditional Form Structure

```typescript
import {
  Component,
  signal,
  viewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import {
  vestForms,
  NgxDeepPartial,
  clearFieldsWhen,
  FormDirective,
} from 'ngx-vest-forms';

type ProcedureFormModel = NgxDeepPartial<{
  procedureType: 'typeA' | 'typeB' | 'typeC';
  fieldA?: string;
  fieldB?: string;
}>;

@Component({
  selector: 'app-procedure-form',
  imports: [vestForms],
  template: `
    <form ngxVestForm (formValueChange)="formValue.set($event)" #vestForm>
      <label>Procedure Type</label>
      <select
        name="procedureType"
        [ngModel]="formValue().procedureType"
        (ngModelChange)="onProcedureTypeChange($event)"
      >
        <option value="typeA">Type A</option>
        <option value="typeB">Type B</option>
        <option value="typeC">Type C</option>
      </select>

      @if (formValue().procedureType === 'typeA') {
        <div>
          <label>Field A</label>
          <input name="fieldA" [ngModel]="formValue().fieldA" />
        </div>
      }

      @if (formValue().procedureType === 'typeB') {
        <div>
          <label>Field B</label>
          <input name="fieldB" [ngModel]="formValue().fieldB" />
        </div>
      }

      @if (formValue().procedureType === 'typeC') {
        <p>No additional input required for Type C procedures.</p>
      }

      <button type="submit">Submit</button>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProcedureFormComponent {
  readonly vestFormRef = viewChild.required<FormDirective>('vestForm');
  protected readonly formValue = signal<ProcedureFormModel>({});

  protected onProcedureTypeChange(newType: string): void {
    // Clear fields that are no longer relevant
    this.formValue.update((current) =>
      clearFieldsWhen(current, {
        fieldA: newType !== 'typeA',
        fieldB: newType !== 'typeB',
      })
    );

    // Trigger validation update after structure change
    this.vestFormRef().triggerFormValidation();
  }
}
```

### Alternative: Manual Clearing Pattern

Without utilities, you can manually clear fields:

```typescript
protected onProcedureTypeChange(newType: string): void {
  this.formValue.update(current => ({
    ...current,
    procedureType: newType,
    // Clear fields that are no longer relevant
    ...(newType !== 'typeA' && { fieldA: undefined }),
    ...(newType !== 'typeB' && { fieldB: undefined }),
  }));

  this.vestFormRef().triggerFormValidation();
}
```

## Common Use Cases

### Use Case 1: Conditional Shipping Address

```typescript
type CheckoutModel = NgxDeepPartial<{
  useDifferentShipping: boolean;
  shippingAddress?: AddressModel;
}>;

protected onShippingToggle(useDifferentShipping: boolean): void {
  this.formValue.update(current =>
    clearFieldsWhen(current, {
      shippingAddress: !useDifferentShipping,
    })
  );
  this.vestFormRef().triggerFormValidation();
}
```

### Use Case 2: Multi-Step Form with Navigation

```typescript
protected goToStep(step: number): void {
  this.currentStep.set(step);

  // Clear fields from steps that are no longer visible
  this.formValue.update(current =>
    clearFieldsWhen(current, {
      step2Data: step !== 2,
      step3Data: step !== 3,
      step4Data: step !== 4,
    })
  );

  this.vestFormRef().triggerFormValidation();
}
```

### Use Case 3: Form Reset with Partial Preservation

```typescript
protected resetForm(): void {
  // Keep basic info, clear everything else
  this.formValue.update(current =>
    keepFieldsWhen(current, {
      userId: true, // always keep
      userName: true, // always keep
      email: false, // clear
      address: false, // clear
      preferences: false, // clear
    })
  );
}
```

### Use Case 4: Dependent Field Groups

```typescript
type ApplicationModel = NgxDeepPartial<{
  applicantType: 'individual' | 'business';
  personalInfo?: PersonalInfoModel;
  businessInfo?: BusinessInfoModel;
}>;

protected onApplicantTypeChange(type: string): void {
  this.formValue.update(current =>
    clearFieldsWhen(current, {
      personalInfo: type !== 'individual',
      businessInfo: type !== 'business',
    })
  );
  this.vestFormRef().triggerFormValidation();
}
```

## Working with Nested Objects

All utilities work with nested object properties:

```typescript
const state = {
  user: {
    profile: { name: 'John', age: 30 },
    settings: { theme: 'dark' },
  },
  temp: { cache: 'data' },
};

// Clear nested properties
const cleaned = clearFieldsWhen(state, {
  'user.profile': !showProfile,
  temp: true, // always clear temp data
});
```

## Combining with `triggerFormValidation()`

Always call `triggerFormValidation()` after clearing fields to update validation state:

```typescript
protected onStructureChange(newValue: string): void {
  // 1. Clear relevant fields
  this.formValue.update(current =>
    clearFieldsWhen(current, {
      conditionalField: newValue !== 'showField',
    })
  );

  // 2. Trigger validation update
  this.vestFormRef().triggerFormValidation();
}
```

## Validation Pattern for Cleared Fields

Use `omitWhen` in your validation suite to skip validation for cleared fields:

```typescript
import { staticSuite, test, enforce, omitWhen, only } from 'vest';

export const procedureSuite: NgxVestSuite<ProcedureFormModel> = staticSuite(
  (model, field?) => {
    only(field);

    test('procedureType', 'Procedure type is required', () => {
      enforce(model.procedureType).isNotBlank();
    });

    // Only validate fieldA when procedureType is 'typeA'
    omitWhen(model.procedureType !== 'typeA', () => {
      test('fieldA', 'Field A is required for Type A', () => {
        enforce(model.fieldA).isNotBlank();
      });
    });

    // Only validate fieldB when procedureType is 'typeB'
    omitWhen(model.procedureType !== 'typeB', () => {
      test('fieldB', 'Field B is required for Type B', () => {
        enforce(model.fieldB).isNotBlank();
      });
    });

    // Note: No validation needed for typeC as it has no input fields
  }
);
```

## Best Practices

1. **Use with non-form content switches** - Only needed when switching between form inputs and non-form elements
2. **Always call `triggerFormValidation()`** - Update validation state after clearing fields
3. **Match validation logic** - Use `omitWhen` in validation suites for fields that can be cleared
4. **Prefer utilities over manual** - Use `clearFieldsWhen`, `clearFields`, or `keepFieldsWhen` for cleaner code
5. **Document clearing logic** - Comment why fields need clearing for future maintainers
6. **Test edge cases** - Verify state consistency when navigating through all conditional branches

## Comparison: When to Use Each Utility

| Utility           | Use When                                                           | Example                                                        |
| ----------------- | ------------------------------------------------------------------ | -------------------------------------------------------------- |
| `clearFieldsWhen` | Conditionally clearing multiple fields based on boolean conditions | Clearing shipping address when checkbox unchecked              |
| `clearFields`     | Unconditionally clearing specific fields                           | Resetting temporary/cached data                                |
| `keepFieldsWhen`  | Whitelist approach - keeping only specific fields                  | Multi-step form where you want to preserve only certain fields |

## Related Topics

- [Structure Change Detection Guide](./STRUCTURE_CHANGE_DETECTION.md) - Understanding `triggerFormValidation()`
- [Conditional Validations](../README.md#conditional-validations) - Using `omitWhen` for conditional validation logic
- [Vest.js Guide](../.github/instructions/vest.instructions.md) - Complete Vest.js patterns
