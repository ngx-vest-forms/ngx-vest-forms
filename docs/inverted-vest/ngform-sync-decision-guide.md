# NgForm Sync Decision Guide

## When to Use NgForm Sync with ngx-vest-forms v3

This guide helps you decide when to opt into NgForm synchronization with ngx-vest-forms v3's Vest-first architecture.

## Quick Decision Tree

```text
Do you need ANY of these?
├─ Angular Material form components? → YES: Use NgForm Sync
├─ Automatic CSS classes (.ng-valid, .ng-dirty, etc.)? → YES: Use NgForm Sync
├─ Migrating from existing Angular forms? → YES: Use NgForm Sync
├─ Complex nested forms with ngModelGroup? → YES: Use NgForm Sync
├─ Third-party Angular form libraries? → YES: Use NgForm Sync
└─ None of the above? → NO: Pure Vest is sufficient
```

## What You Get With Pure Vest (Default)

**Advantages:**

- ✅ **Minimal Bundle Size**: No Angular Forms overhead
- ✅ **Single Source of Truth**: Vest owns all validation state
- ✅ **Better Performance**: No synchronization overhead
- ✅ **Simpler Mental Model**: Direct signal-based reactivity
- ✅ **Framework Agnostic**: Validation logic can be reused outside Angular
- ✅ **Modern Architecture**: Built for Angular's signal-first future

**What You Handle Manually:**

- 🔧 Touch state tracking (when to show errors)
- 🔧 CSS class application for form styling
- 🔧 Submit event handling and prevention
- 🔧 Integration with Angular Material or third-party libraries

## What You Get With NgForm Sync

**Advantages:**

- ✅ **Automatic Touch Tracking**: Fields show errors after blur automatically
- ✅ **CSS Classes**: `.ng-valid`, `.ng-invalid`, `.ng-dirty`, `.ng-touched` applied automatically
- ✅ **Material Integration**: Works seamlessly with Angular Material components
- ✅ **Familiar Patterns**: Standard Angular form submission with `(ngSubmit)`
- ✅ **Ecosystem Compatibility**: Works with existing Angular form libraries
- ✅ **Migration Friendly**: Easier transition from traditional Angular forms

**Trade-offs:**

- ⚠️ **Larger Bundle**: Includes Angular Forms infrastructure
- ⚠️ **State Projection**: NgForm mirrors Vest state (unidirectional)
- ⚠️ **Complexity**: Additional abstraction layer to understand

## Architecture: Unidirectional Data Flow

NgForm sync follows a strict **Vest → NgForm** unidirectional pattern to avoid circular dependencies:

```text
User Types in Input → DOM Event → vestField.set() → NgForm Reflects Value
User Blurs Input   → DOM Event → vestField.markTouched() → NgForm Shows Touched
Vest Validation    → Errors    → FormControl.setErrors() → Material Shows Error
```

**Key Benefits:**

- ✅ No circular dependencies or infinite loops
- ✅ Vest remains single source of truth
- ✅ Predictable state flow
- ✅ Easy to debug and reason about

**Important:** NgForm controls never write back to Vest. All state changes originate from Vest.

## Code Examples

### Pure Vest Approach (Minimal)

```typescript
import { Component, signal } from '@angular/core';
import { createVestForm } from 'ngx-vest-forms';
import { userValidationSuite } from './user.validations';

@Component({
  template: `
    <form (ngSubmit)="handleSubmit()" #form="ngForm">
      <div>
        <label for="email">Email</label>
        <input
          id="email"
          name="email"
          [ngModel]="vestForm.field('email').value()"
          (ngModelChange)="vestForm.field('email').set($event)"
          (blur)="vestForm.field('email').markTouched()"
          [class.error]="vestForm.field('email').showErrors()"
        />

        @if (vestForm.field('email').showErrors()) {
          <div class="error-message">
            @for (error of vestForm.field('email').errors(); track error) {
              <p>{{ error }}</p>
            }
          </div>
        }
      </div>

      <button type="submit" [disabled]="!vestForm.root.valid()">Submit</button>
    </form>
  `,
})
export class UserFormComponent {
  private readonly model = signal({ email: '' });

  protected readonly vestForm = createVestForm(
    userValidationSuite,
    this.model,
    { errorDisplay: 'touched' },
  );

  protected async handleSubmit() {
    const result = await this.vestForm.submit();
    if (result.valid) {
      console.log('Form submitted:', result.value);
    }
  }
}
```

### NgForm Sync Approach (Full Featured)

```typescript
import { Component, signal } from '@angular/core';
import { createVestForm } from 'ngx-vest-forms';
import { vestSync } from '@ngx-vest-forms/ngform-sync';
import { userValidationSuite } from './user.validations';

@Component({
  imports: [vestSync],
  template: `
    <form
      vestSync
      [vestForm]="vestForm"
      (ngSubmit)="handleSubmit()"
      #form="ngForm"
    >
      <div>
        <label for="email">Email</label>
        <input id="email" name="email" ngModel required email />
        <!-- Errors show automatically via Angular's error state -->
      </div>

      <button type="submit" [disabled]="form.invalid">Submit</button>
    </form>
  `,
})
export class UserFormComponent {
  private readonly model = signal({ email: '' });

  protected readonly vestForm = createVestForm(userValidationSuite, this.model);

  protected async handleSubmit() {
    const result = await this.vestForm.submit();
    if (result.valid) {
      console.log('Form submitted:', result.value);
    }
  }
}
```

## Use Case Scenarios

### ✅ Use Pure Vest When:

**New Angular Applications**

- Starting fresh with modern Angular patterns
- Team is comfortable with signal-based architecture
- Custom design system with unique form styling
- Performance is critical (minimal bundle size)

**Simple Forms**

- Login/register forms
- Contact forms
- Settings panels
- Forms with custom validation UI

**Specialized Requirements**

- Server-side rendering with form state
- Forms that need to work outside Angular
- Custom touch/focus behavior
- Advanced validation timing controls

### ✅ Use NgForm Sync When:

**Angular Material Projects**

```typescript
// Material components expect NgForm integration
<mat-form-field>
  <mat-label>Email</mat-label>
  <input matInput name="email" ngModel required>
  <mat-error>Email is required</mat-error>
</mat-form-field>
```

**Legacy Migration Projects**

- Existing forms using template-driven patterns
- Large codebases with established form conventions
- Teams familiar with Angular form patterns
- Gradual migration strategy

**Third-party Integration**

- Forms using PrimeNG, Ng-Bootstrap, or similar libraries
- Components that expect Angular's FormControl interface
- Testing utilities built around NgForm

**Complex Nested Forms**

```typescript
// NgModelGroup provides structure
<div ngModelGroup="address">
  <input name="street" ngModel>
  <input name="city" ngModel>
  <div ngModelGroup="coordinates">
    <input name="lat" ngModel>
    <input name="lng" ngModel>
  </div>
</div>
```

## Migration Strategies

### From v2 ngx-vest-forms

1. **Start with NgForm Sync**: Closest to v2 behavior
2. **Gradually Remove**: Move forms to pure Vest as you refactor
3. **Mixed Approach**: Use both patterns in the same application

### From Angular Reactive Forms

1. **Use NgForm Sync**: Maintain familiar template patterns
2. **Replace FormBuilder**: Use `createVestForm` instead
3. **Keep Form Structure**: Leverage existing template organization

### From Template-driven Forms

1. **Add Vest Validation**: Replace built-in validators with Vest suites
2. **Keep NgForm**: Use NgForm sync for seamless transition
3. **Enhance Gradually**: Add advanced Vest features over time

## Performance Considerations

### Bundle Size Impact

| Approach           | Bundle Addition | Performance Impact                |
| ------------------ | --------------- | --------------------------------- |
| Pure Vest          | ~5KB            | Minimal - direct signal updates   |
| NgForm Sync        | ~15KB           | Low - efficient synchronization   |
| Full Angular Forms | ~25KB           | Medium - full form infrastructure |

### Runtime Performance

**Pure Vest:**

- Direct signal updates
- Single validation pass
- No synchronization overhead
- Optimal for high-frequency changes

**NgForm Sync:**

- Bidirectional synchronization
- Efficient change detection
- Minimal validation overhead
- Good for standard form interactions

## Testing Strategies

### Pure Vest Testing

```typescript
import { createVestForm } from 'ngx-vest-forms';
import { signal } from '@angular/core';

describe('User Form', () => {
  it('should validate email field', async () => {
    const model = signal({ email: '' });
    const form = createVestForm(userValidationSuite, model);

    // Direct field testing
    form.field('email').set('invalid-email');
    await form.validate('email');

    expect(form.field('email').errors()).toContain('Invalid email format');
  });
});
```

### NgForm Sync Testing

```typescript
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-events';

describe('User Form with NgForm', () => {
  it('should show errors after blur', async () => {
    await render(UserFormComponent);

    const emailInput = screen.getByLabelText('Email');
    await userEvent.type(emailInput, 'invalid');
    await userEvent.tab(); // blur

    expect(screen.getByText('Invalid email format')).toBeInTheDocument();
  });
});
```

## Troubleshooting Common Issues

### Value Sync Problems

**Issue**: Values not syncing between Vest and NgForm
**Solution**: Ensure proper field naming and avoid circular updates

### CSS Classes Not Applied

**Issue**: Angular form classes not appearing
**Solution**: Verify NgForm sync directive is properly configured

### Performance Issues

**Issue**: Validation running too frequently
**Solution**: Configure appropriate `validateOn` strategy and debouncing

### Material Integration Issues

**Issue**: Material components not showing Vest errors
**Solution**: Ensure NgForm sync is pushing errors to FormControl

## Best Practices

### For Pure Vest

1. **Manual Touch Tracking**: Always handle blur events for proper UX
2. **Error Display Strategy**: Configure `errorDisplay` option appropriately
3. **Submit Handling**: Implement proper form submission prevention
4. **CSS Classes**: Create utility functions for common class patterns

### For NgForm Sync

1. **Field Naming**: Keep consistent naming between Vest paths and input names
2. **Validation Timing**: Let NgForm handle touch state, Vest handle validation
3. **Error Messages**: Use Vest for validation, Angular templates for display
4. **Performance**: Monitor for sync loops in complex forms

## Conclusion

Choose **Pure Vest** for new applications prioritizing performance and modern patterns.

Choose **NgForm Sync** for existing applications, Material design systems, or when team familiarity with Angular forms is important.

Both approaches are fully supported and can coexist in the same application.
