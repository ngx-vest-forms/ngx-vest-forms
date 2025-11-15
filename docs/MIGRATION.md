# Migration Guide: v1.4.x → v1.5.0

## Breaking Changes

### Root Form Validation Mode

**Change:** The default validation behavior for `validateRootForm` has changed from **live** to **submit mode**.

#### What Changed

**v1.4.x Behavior (old):**

```typescript
<form ngxVestForm validateRootForm>
  <!-- ✅ Validated on EVERY value change (live mode) -->
</form>
```

**v1.5.0 Behavior (new - BREAKING):**

```typescript
<form ngxVestForm validateRootForm>
  <!-- ⚠️ NOW: Only validates AFTER form submission (submit mode) -->
</form>
```

#### Why This Change?

**Root form validations are different from field validations** - they validate relationships between multiple fields that users cannot fix until ALL fields are filled in.

**Real-world example from the codebase:**

```typescript
// purchase.validations.ts
test(ROOT_FORM, 'Brecht is not 30 anymore', () => {
  enforce(
    model.firstName === 'Brecht' &&
      model.lastName === 'Billiet' &&
      model.age === 30
  ).isFalsy();
});
```

**Problem with 'live' mode (old default):**

1. **User types "B"** → ❌ "Brecht is not 30 anymore"
   - _Error appears before user finished typing!_
2. **User types "Brecht"** → ❌ Still showing error
   - _User hasn't even reached lastName field yet_
3. **User types lastName: "Billiet"** → ❌ Still showing error
   - _User hasn't reached age field yet_
4. **User types age: "30"** → ❌ Finally, error makes sense

**This creates a terrible UX**: The user sees an error for a validation they cannot possibly satisfy yet.

**Benefits of 'submit' mode (new default):**

1. ✅ **No premature errors**: User completes the form without distraction
2. ✅ **Validates when actionable**: Error only appears when user attempts to submit (when all fields are filled)
3. ✅ **Clear feedback**: User understands _why_ the form won't submit
4. ✅ **Matches expectations**: Users expect validation on submit for cross-field rules
5. ✅ **Consistency**: Aligns with HTML5 native form validation behavior

**When 'live' mode is still useful:**

- Simple two-field comparisons (password confirmation) where both fields are visible
- Real-time feedback is critical for your use case
- You're migrating from v2 and need identical behavior

**Recommendation:** Use `'submit'` mode (new default) unless you have a specific UX requirement for live validation.

#### Migration Options

##### Option 1: Keep Old Behavior (Recommended for Existing Apps)

Explicitly set `validateRootFormMode` to `'live'`:

```typescript
<form
  ngxVestForm
  validateRootForm
  [validateRootFormMode]="'live'">  <!-- ← Add this to restore v2 behavior -->
  <!-- Validates on every change (old behavior) -->
</form>
```

##### Option 2: Adopt New Default (Recommended for New Forms)

Use the new submit-based validation (no change needed):

```typescript
<form
  ngxVestForm
  validateRootForm>  <!-- Validates after submit (v3 default) -->
  <!-- Or explicitly: [validateRootFormMode]="'submit'" -->
</form>
```

#### Complete Example

**Before (v2):**

```typescript
import { Component, signal } from '@angular/core';
import { ROOT_FORM } from 'ngx-vest-forms';

@Component({
  template: `
    <form
      ngxVestForm
      [suite]="suite"
      [formValue]="formValue()"
      validateRootForm
      (formValueChange)="formValue.set($event)"
      (errorsChange)="errors.set($event)"
    >
      <input name="password" [ngModel]="formValue().password" />
      <input name="confirmPassword" [ngModel]="formValue().confirmPassword" />

      @if (errors()[ROOT_FORM]) {
        <div role="alert">{{ errors()[ROOT_FORM][0] }}</div>
      }

      <button type="submit">Submit</button>
    </form>
  `,
})
export class MyFormComponent {
  // Root form errors showed immediately as user typed
}
```

**After (v1.5.0 - preserving old behavior):**

```typescript
import { Component, signal } from '@angular/core';
import { ROOT_FORM } from 'ngx-vest-forms';

@Component({
  template: `
    <form
      ngxVestForm
      [suite]="suite"
      [formValue]="formValue()"
      validateRootForm
      [validateRootFormMode]="'live'"  <!-- ← ADD THIS LINE -->
      (formValueChange)="formValue.set($event)"
      (errorsChange)="errors.set($event)">

      <input name="password" [ngModel]="formValue().password" />
      <input name="confirmPassword" [ngModel]="formValue().confirmPassword" />

      @if (errors()[ROOT_FORM]) {
        <div role="alert">{{ errors()[ROOT_FORM][0] }}</div>
      }

      <button type="submit">Submit</button>
    </form>
  `,
})
export class MyFormComponent {
  // Root form errors still show immediately (same as v2)
}
```

**After (v1.5.0 - adopting new default):**

```typescript
import { Component, signal } from '@angular/core';
import { ROOT_FORM } from 'ngx-vest-forms';

@Component({
  template: `
    <form
      ngxVestForm
      [suite]="suite"
      [formValue]="formValue()"
      validateRootForm
      [validateRootFormMode]="'submit'"  <!-- ← Optional: explicit submit mode -->
      (formValueChange)="formValue.set($event)"
      (errorsChange)="errors.set($event)">

      <input name="password" [ngModel]="formValue().password" />
      <input name="confirmPassword" [ngModel]="formValue().confirmPassword" />

      @if (errors()[ROOT_FORM]) {
        <div role="alert">{{ errors()[ROOT_FORM][0] }}</div>
      }

      <button type="submit">Submit</button>
    </form>
  `,
})
export class MyFormComponent {
  // Root form errors only show after submit button clicked (better UX!)
}
```

#### Find All Affected Forms

Search your codebase for:

```bash
grep -r "validateRootForm" --include="*.ts" --include="*.html"
```

Look for forms using `validateRootForm` without `validateRootFormMode` and decide whether to:

- Add `[validateRootFormMode]="'live'"` (preserve old behavior)
- Accept new default `'submit'` mode (better UX)

#### When to Use Each Mode

| Mode                 | Use Case                                             | Example                                                                       | UX Impact                                                  |
| -------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `'submit'` (default) | **Most forms**, especially complex cross-field rules | "Brecht Billiet cannot be 30", date range validation, multi-step conditionals | ✅ No premature errors, validates when all fields complete |
| `'live'`             | Simple two-field comparisons, migration from v2      | Password confirmation (both fields visible)                                   | ⚠️ Shows errors while user is still filling form           |

**Real-world guidance:**

```typescript
// ✅ GOOD: Use 'submit' for complex cross-field validation
test(ROOT_FORM, 'Age must be 21+ if purchasing alcohol', () => {
  enforce(!(model.product === 'alcohol' && model.age < 21)).isTruthy();
});
// User needs to fill multiple fields - wait for submit

// ⚠️ ACCEPTABLE: Use 'live' for simple immediate feedback
test(ROOT_FORM, 'Passwords must match', () => {
  enforce(model.confirmPassword).equals(model.password);
});
// Both fields visible, immediate feedback might be helpful (but submit is still better!)

// ❌ BAD: Don't use 'live' for validations depending on many fields
test(ROOT_FORM, 'Full name must match ID', () => {
  enforce(`${model.firstName} ${model.middleName} ${model.lastName}`).equals(
    model.idName
  );
});
// User sees error before filling all name fields - terrible UX!
```

**Recommendation**: Default to `'submit'` mode. Only use `'live'` if you're migrating and need time to test UX changes.

---

## Non-Breaking Enhancements

### New Features in v1.5.0

1. **Validation Mode Control**: New `validateRootFormMode` input for fine-grained control
2. **Submit Event Handling**: Automatic `(ngSubmit)` binding for better integration
3. **Improved Error Collection**: `getAllFormErrors()` now properly captures root form errors

### Example: Taking Advantage of New Features

```typescript
@Component({
  template: `
    <form
      ngxVestForm
      [suite]="suite"
      [formValue]="formValue()"
      validateRootForm
      [validateRootFormMode]="validationMode()"  <!-- ← Dynamic mode control! -->
      (formValueChange)="formValue.set($event)"
      (errorsChange)="errors.set($event)">

      <!-- Form fields -->

      <button type="submit">Submit</button>

      <button type="button" (click)="toggleValidationMode()">
        Toggle: {{ validationMode() }} mode
      </button>
    </form>
  `,
})
export class AdvancedFormComponent {
  protected readonly validationMode = signal<'submit' | 'live'>('submit');

  protected toggleValidationMode(): void {
    this.validationMode.update((mode) =>
      mode === 'submit' ? 'live' : 'submit'
    );
  }
}
```

---

## Testing Considerations

### Unit Tests

If you have unit tests that rely on root form validation, update them:

**Before:**

```typescript
it('should validate root form immediately', () => {
  component.formValue.set({ password: '123', confirmPassword: '456' });
  fixture.detectChanges();
  // Expect errors immediately
  expect(component.errors()[ROOT_FORM]).toBeDefined();
});
```

**After (with submit mode):**

```typescript
it('should validate root form after submit', () => {
  component.formValue.set({ password: '123', confirmPassword: '456' });
  fixture.detectChanges();
  // No errors yet
  expect(component.errors()[ROOT_FORM]).toBeUndefined();

  // Trigger submit
  const form = fixture.nativeElement.querySelector('form');
  form.dispatchEvent(new Event('submit'));
  fixture.detectChanges();

  // Now errors appear
  expect(component.errors()[ROOT_FORM]).toBeDefined();
});
```

### Storybook/Integration Tests

Update test assertions to trigger form submission:

```typescript
// Before
await userEvent.type(input, 'value');
expect(errors).toContain('error message');

// After
await userEvent.type(input, 'value');
await userEvent.click(submitButton); // ← Add this
expect(errors).toContain('error message');
```

---

## Rollback Strategy

If you need to temporarily rollback to v2 behavior globally:

1. **Find all forms**: `grep -r "validateRootForm" --include="*.html"`
2. **Add mode to each**: Add `[validateRootFormMode]="'live'"` to all matches
3. **Or create a wrapper component** with `'live'` as default:

```typescript
@Component({
  selector: 'app-legacy-form',
  template: `
    <form
      ngxVestForm
      [validateRootForm]="validateRootForm()"
      [validateRootFormMode]="'live'"  <!-- Force live mode -->
      [suite]="suite()"
      [formValue]="formValue()">
      <ng-content />
    </form>
  `,
})
export class LegacyFormComponent {
  // Use this wrapper for all legacy forms
}
```

---

## Questions?

- **Q: Why did the default change?**
  - A: Root form validations check relationships between multiple fields. In 'live' mode, users see errors for validations they cannot satisfy yet (e.g., "firstName + lastName + age must match" error appears when they've only typed firstName). Submit mode only validates when all fields are complete, providing much better UX.

- **Q: Which mode should I use?**
  - A: Use `'submit'` (new default) for almost all cases. Root form validations are cross-field rules that users can only fix after filling multiple inputs. Only use `'live'` if you have a specific UX requirement or need time to test the new behavior during migration.

- **Q: What about password confirmation - shouldn't that validate live?**
  - A: Even for password confirmation, `'submit'` mode provides better UX - users can focus on entering their password without being interrupted by "passwords don't match" errors. However, if you prefer immediate feedback, use `'live'` mode for this specific case.

- **Q: Do I have to update all my forms?**
  - A: Only forms using `validateRootForm`. Regular field validation is unchanged.

- **Q: Can I mix modes in different forms?**
  - A: Yes! Each form can have its own `validateRootFormMode` setting.
