# Advanced Form Structure Change Detection

> **Note**: This guide provides advanced techniques and alternatives for handling form structure changes. For basic usage, see the [README.md](../README.md#handling-form-structure-changes) section on "Handling Form Structure Changes".

This document explains advanced techniques for handling form validation updates when form structure changes dynamically in ngx-vest-forms.

## The Problem

When form structure changes from **input fields to non-input content** (like `<p>` tags) without control value changes, the `formValueChange` event is not automatically emitted. This can lead to situations where form validity is not updated correctly.

### Example Scenario

```typescript
// Form with conditional fields based on selection
@if (procedureType() === 'typeA') {
  <input name="fieldA" [ngModel]="formValue().fieldA" />
}
@else if (procedureType() === 'typeB') {
  <input name="fieldB" [ngModel]="formValue().fieldB" />
}
@else if (procedureType() === 'typeC') {
  <p>No additional input required for this procedure type.</p>
}
```

When switching from `typeA` to `typeC`, the input field is removed but no control values change, so validation doesn't update automatically.

### When You DON'T Need This

**Important**: You do **NOT** need `triggerFormValidation()` when switching between different input fields:

```typescript
// ✅ This works automatically - no triggerFormValidation() needed
@if (procedureType() === 'typeA') {
  <input name="fieldA" [ngModel]="formValue().fieldA" />
} @else {
  <input name="fieldB" [ngModel]="formValue().fieldB" />
}
```

Why? Because switching between inputs means control values change, which triggers Angular's `ValueChangeEvent` and validation updates automatically.

**You only need `triggerFormValidation()` when**:

- Switching from input field → non-input content (like `<p>`, `<div>`, etc.)
- The structure changes but no control values change

## Solution: Manual Validation Update

### API

```typescript
public triggerFormValidation(): void
```

### Usage

```typescript
@Component({
  template: `
    <form
      ngxVestForm
      [suite]="validationSuite"
      (formValueChange)="formValue.set($event)"
      #vestForm="ngxVestForm"
    >
      <select
        name="procedureType"
        [ngModel]="formValue().procedureType"
        (ngModelChange)="onProcedureTypeChange($event)"
      >
        <option value="typeA">Type A</option>
        <option value="typeB">Type B</option>
        <option value="typeC">Type C (No input)</option>
      </select>

      @if (formValue().procedureType === 'typeA') {
        <input name="fieldA" [ngModel]="formValue().fieldA" />
      } @else if (formValue().procedureType === 'typeB') {
        <input name="fieldB" [ngModel]="formValue().fieldB" />
      } @else if (formValue().procedureType === 'typeC') {
        <p>No additional input required for this procedure type.</p>
      }
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyFormComponent {
  // Modern Angular 20+: Use viewChild() instead of @ViewChild
  private readonly vestForm =
    viewChild.required<FormDirective<MyFormModel>>('vestForm');

  protected readonly formValue = signal<MyFormModel>({});
  protected readonly validationSuite = myValidationSuite;

  onProcedureTypeChange(newType: string) {
    // Update the form value
    this.formValue.update((current) => ({
      ...current,
      procedureType: newType,
      // Clear fields that are no longer relevant
      ...(newType !== 'typeA' && { fieldA: undefined }),
      ...(newType !== 'typeB' && { fieldB: undefined }),
    }));

    // IMPORTANT: Trigger validation update after structure change
    this.vestForm().triggerFormValidation();
  }
}
```

### When to Use

Call `triggerFormValidation()` in these scenarios:

1. **After changing form structure** - When conditional fields are shown/hidden
2. **After clearing form sections** - When resetting parts of the form
3. **After dynamic field addition/removal** - When programmatically modifying form structure
4. **After switching form modes** - When toggling between different form layouts

### Validation Suite Pattern

```typescript
import { staticSuite, test, enforce, omitWhen, only } from 'vest';

export const myValidationSuite = staticSuite(
  (model: MyFormModel, field?: string) => {
    only(field); // CRITICAL: Always call unconditionally

    // Always validate procedure type
    test('procedureType', 'Procedure type is required', () => {
      enforce(model.procedureType).isNotBlank();
    });

    // Conditional validations
    omitWhen(model.procedureType !== 'typeA', () => {
      test('fieldA', 'Field A is required for Type A', () => {
        enforce(model.fieldA).isNotBlank();
      });
    });

    omitWhen(model.procedureType !== 'typeB', () => {
      test('fieldB', 'Field B is required for Type B', () => {
        enforce(model.fieldB).isNotBlank();
      });
    });

    // Note: No validation needed for typeC as it has no input fields
  }
);
```

## Alternative Approaches (Not Recommended)

### Approach 1: Hidden Input Fields

```typescript
// Less clean approach - add hidden fields
@if (formValue().procedureType === 'typeC') {
  <input type="hidden" name="hiddenTrigger" [ngModel]="formValue().procedureType" />
  <p>No additional input required for this procedure type.</p>
}
```

### Approach 2: Manual Form Control Update

```typescript
// More verbose approach
onProcedureTypeChange(newType: string) {
  this.formValue.update(current => ({ ...current, procedureType: newType }));
  this.ngForm.form.updateValueAndValidity(); // Low-level Angular API
}
```

## Best Practices

1. **Always call after structure changes** - Make it part of your form change handlers
2. **Update form value first** - Ensure the form model reflects the new state before calling
3. **Use in event handlers** - Call from `(ngModelChange)` or similar events
4. **Document usage** - Add comments explaining why the manual update is needed
5. **Test thoroughly** - Verify validation behavior with all form structure combinations

## Performance Considerations

- The manual update method has **zero overhead** when not called
- It only triggers when explicitly invoked
- Much more efficient than polling-based solutions
- Follows the explicit-is-better-than-implicit principle
