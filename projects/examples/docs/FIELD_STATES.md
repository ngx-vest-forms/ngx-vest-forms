# Field State Management in ngx-vest-forms v2.0

> Complete guide to understanding and using field states: `dirty`, `touched`, `invalid`, `valid`, and `submittedStatus`

## 📚 Table of Contents

- [State Types](#state-types)
- [Field-Level vs Form-Level](#field-level-vs-form-level)
- [Critical Distinctions](#critical-distinctions)
- [Programmatic Control](#programmatic-control)
- [Decision Matrix](#decision-matrix)
- [Real-World Patterns](#real-world-patterns)

---

## State Types

### 1. **dirty()** - Value Changed from Initial

Tracks whether a field's value has been modified from its initial value.

#### When it triggers

- ✅ User types in field
- ✅ Programmatic `set()` call (e.g., `form.setEmail()`)
- ✅ `markAsDirty()` called explicitly
- ❌ **NOT** triggered by field blur (use `touched()` instead)

#### Use cases

```typescript
// Unsaved changes warning
@if (form.dirty()) {
  <div role="alert">⚠️ You have unsaved changes</div>
}

// Enable save button when form has changes
<button [disabled]="!form.dirty() || !form.valid()">
  Save Changes
</button>

// Show indicator for modified fields
@if (form.emailDirty()) {
  <span class="text-amber-600">● Modified</span>
}
```

---

### 2. **touched()** - User Interacted (Blur Event)

Tracks whether the user has interacted with a field (typically by focusing then blurring).

#### When touched triggers

- ✅ User tabs out of field (blur event)
- ✅ User clicks outside field after having focus
- ✅ `markAsTouched()` called explicitly
- ❌ **NOT** triggered by just typing (use `dirty()` instead)

#### Touched use cases

```typescript
// Progressive error disclosure (WCAG recommended)
@if (form.emailTouched() && form.emailInvalid()) {
  <span role="alert">{{ form.emailValidation().errors[0] }}</span>
}

// Alternative: Use showErrors() which combines touch + error strategy
@if (form.emailShowErrors()) {
  <span role="alert">{{ form.emailValidation().errors[0] }}</span>
}

// Form wizard: validate step when moving to next
function goToNextStep() {
  // Mark all current step fields as touched
  form.markAsTouchedEmail();
  form.markAsTouchedPassword();

  if (form.emailValid() && form.passwordValid()) {
    navigateToNextStep();
  }
}
```

---

### 3. **invalid()** - Has Validation Errors

Returns `true` when field/form has validation errors, **regardless of pending async validators**.

#### When it has errors

- Field has errors from Vest validation
- Field has errors from schema validation (Zod/Valibot)
- **Ignores** whether async validators are still running

#### Usage patterns

```typescript
// Error message display - show errors even during pending async
@if (form.emailInvalid() && form.emailTouched()) {
  <span role="alert">{{ form.emailValidation().errors[0] }}</span>
}

// Conditional styling
<input
  [value]="form.email()"
  (input)="form.setEmail($event)"
  [class.border-red-500]="form.emailInvalid() && form.emailTouched()"
/>

// Form-level error count
<div>{{ form.invalid() ? 'Form has errors' : 'Form is clean' }}</div>
```

---

### 4. **valid()** - No Errors AND No Pending

Returns `true` **only when** there are no errors **AND** no pending async validators.

#### When it returns true

- No validation errors
- No pending async validators
- **Both conditions must be met**

#### Valid field usage patterns

```typescript
// Submit button - MUST wait for async validation
<button
  type="submit"
  [disabled]="!form.valid() || form.pending()">
  Submit
</button>

// Alternatively (more explicit)
<button
  type="submit"
  [disabled]="form.invalid() || form.pending()">
  Submit
</button>

// Success indicator
@if (form.emailValid() && !form.emailPending()) {
  <span class="text-green-600">✓ Valid</span>
}
```

---

### 5. **submittedStatus()** - Form Submission State

Returns the current submission status: `'unsubmitted' | 'submitting' | 'submitted'`

Replaces the deprecated `hasSubmitted()` with a more comprehensive state.

#### Submission states

- `'unsubmitted'` - Form hasn't been submitted yet
- `'submitting'` - Form submission in progress
- `'submitted'` - Form was submitted successfully

#### Submission status usage patterns

```typescript
// Smart submit button
<button [disabled]="form.submittedStatus() === 'submitting'">
  @if (form.submittedStatus() === 'submitting') {
    <span>Submitting...</span>
  } @else if (form.submittedStatus() === 'submitted') {
    <span>✓ Submitted!</span>
  } @else {
    <span>Submit Form</span>
  }
</button>

// Show errors after submit attempt
@if (form.submittedStatus() !== 'unsubmitted' && form.emailInvalid()) {
  <span role="alert">{{ form.emailValidation().errors[0] }}</span>
}

// Disable form after successful submission
<form [attr.aria-disabled]="form.submittedStatus() === 'submitted'">
  <!-- form fields -->
</form>
```

---

## Field-Level vs Form-Level

Most states are available at **both** field and form levels:

### Field-Level (via Enhanced Proxy)

```typescript
// Via Enhanced Field Signals (Proxy magic)
form.emailDirty(); // Is email field dirty?
form.emailTouched(); // Did user interact with email?
form.emailInvalid(); // Does email have errors?
form.emailValid(); // Is email valid (no errors + no pending)?

// Explicit API (alternative)
form.field('email').dirty();
form.field('email').touched();
form.field('email').invalid();
form.field('email').valid();
```

### Form-Level (aggregate of all fields)

```typescript
form.dirty(); // Is ANY field dirty?
form.invalid(); // Does ANY field have errors?
form.valid(); // Are ALL fields valid?
form.pending(); // Is ANY async validator running?
```

**Note:** `touched()` is **field-level only** - there's no `form.touched()` aggregate.

---

## Critical Distinctions

### ⚠️ invalid() vs !valid()

**This is the most important distinction to understand:**

| State       | Meaning                            | Use Case            |
| ----------- | ---------------------------------- | ------------------- |
| `invalid()` | Has errors (**ignores** pending)   | Error UI display    |
| `!valid()`  | **Not** (no errors AND no pending) | Submit button state |

#### Example

```typescript
// ❌ WRONG - Allows submit while async validation runs!
<button [disabled]="form.invalid()">Submit</button>

// ✅ CORRECT - Waits for async validation to complete
<button [disabled]="!form.valid() || form.pending()">Submit</button>

// Alternatively (more explicit)
<button [disabled]="form.invalid() || form.pending()">Submit</button>
```

#### Why this matters

```typescript
// During async email validation:
form.emailInvalid(); // false (no errors YET)
form.emailValid(); // false (pending validator running)
!form.emailValid(); // true (correct: not fully valid yet)

// After async validation fails:
form.emailInvalid(); // true (errors exist)
form.emailValid(); // false (has errors)
!form.emailValid(); // true (correct: not valid)
```

**Rule of thumb:**

- Use `invalid()` for **showing** errors
- Use `!valid()` for **preventing** submission

---

### dirty() vs touched()

| State       | Triggers On        | Use Case                  |
| ----------- | ------------------ | ------------------------- |
| `dirty()`   | Value changed      | Unsaved changes, warnings |
| `touched()` | User blurred field | Error display timing      |

```typescript
// Unsaved changes - use dirty()
@if (form.dirty()) {
  <div>⚠️ Unsaved changes will be lost</div>
}

// Error display - use touched() + invalid()
@if (form.emailTouched() && form.emailInvalid()) {
  <span role="alert">{{ form.emailValidation().errors[0] }}</span>
}

// Warning display - use dirty() + warnings()
@if (form.passwordDirty() && form.passwordValidation().warnings.length) {
  <div class="text-amber-600" role="status">
    💡 {{ form.passwordValidation().warnings[0] }}
  </div>
}
```

**Why this distinction matters:**

- **Errors** (`touched() + invalid()`): Block submission, show after user interaction (progressive disclosure)
- **Warnings** (`dirty() + warnings()`): Non-blocking suggestions, show when value changes (immediate feedback)
- **Unsaved changes** (`dirty()`): Alert about modified state

---

## Programmatic Control

### markAsTouched() - Trigger Error Display

Mark a field as touched **without changing its value**.

**When to use:**

```typescript
// 1. Show all errors on submit
async save(event: Event) {
  event.preventDefault();

  // Mark all fields as touched to show errors
  form.markAsTouchedEmail();
  form.markAsTouchedPassword();
  form.markAsTouchedUsername();

  const result = await form.submit();
  if (result.valid) {
    await api.save(result.data);
  }
}

// 2. Form wizard - validate current step
function validateCurrentStep() {
  // Mark current step fields as touched
  currentStepFields.forEach(field => {
    form.field(field).markAsTouched();
  });

  // Check if step is valid
  return allFieldsValid();
}

// 3. Programmatic focus navigation
function focusFirstInvalidField() {
  const firstInvalid = findFirstInvalidField();
  if (firstInvalid) {
    firstInvalid.focus();
    // Mark as touched to show error immediately
    form.field(firstInvalid.name).markAsTouched();
  }
}
```

---

### markAsDirty() - Mark as Modified

Mark a field as dirty **without user interaction**.

**When to use:**

```typescript
// 1. Pre-fill form from server (edit mode)
async loadUserData(userId: string) {
  const user = await api.fetchUser(userId);

  // Update form values
  form.model.update(() => user);
  form.validate();

  // Mark all fields as dirty since they're pre-filled
  form.markAsDirtyEmail();
  form.markAsDirtyUsername();
  form.markAsDirtyPassword();
}

// 2. Bulk field updates
function applyTemplate(template: Template) {
  // Apply template values
  Object.entries(template).forEach(([key, value]) => {
    form.field(key).set(value);
    form.field(key).markAsDirty();
  });
}

// 3. Undo/Redo functionality
function redo() {
  const nextState = redoStack.pop();
  if (nextState) {
    form.model.set(nextState);
    // Mark as dirty since state changed
    markAllFieldsDirty();
  }
}
```

---

## Decision Matrix

### Common Scenarios

| Scenario                           | Use This                        |
| ---------------------------------- | ------------------------------- |
| Show unsaved changes warning       | `dirty()`                       |
| Show non-blocking warnings         | `dirty() && warnings.length`    |
| Enable save button                 | `dirty() && valid()`            |
| Show error after user interaction  | `invalid() && touched()`        |
| Disable submit button              | `!valid() \|\| pending()`       |
| Show error during async validation | `invalid()` (ignores pending)   |
| Wait for async before submit       | `valid()` (requires no pending) |
| Pre-fill edit form                 | Update model + `markAsDirty()`  |
| Show all errors (validate all)     | `markAsTouched()` all fields    |
| Form submission status             | `submittedStatus()`             |

---

## Real-World Patterns

### Pattern 1: Smart Submit Button

```typescript
<button
  type="submit"
  [disabled]="!form.valid() || form.pending()"
  [class.opacity-50]="form.dirty() && form.invalid()">

  @if (form.submittedStatus() === 'submitting') {
    <span>Saving...</span>
  } @else if (form.submittedStatus() === 'submitted') {
    <span>✓ Saved!</span>
  } @else {
    <span>Save Changes</span>
  }
</button>
```

### Pattern 2: Unsaved Changes Guard

```typescript
export const unsavedChangesGuard: CanDeactivateFn<ComponentWithForm> = (
  component,
) => {
  if (component.form.dirty()) {
    return confirm('You have unsaved changes. Discard them?');
  }
  return true;
};
```

### Pattern 3: Progressive Error Disclosure

```typescript
// Option 1: Manual control
@if (form.emailInvalid() && form.emailTouched()) {
  <span role="alert">{{ form.emailValidation().errors[0] }}</span>
}

// Option 2: Use built-in showErrors() (respects error strategy)
@if (form.emailShowErrors()) {
  <span role="alert">{{ form.emailValidation().errors[0] }}</span>
}
```

### Pattern 4: Warning Display (Non-Blocking Feedback)

```typescript
// Vest suite with warnings
const passwordSuite = staticSafeSuite((data) => {
  test('password', 'Password must be at least 8 characters', () => {
    enforce(data.password).longerThan(7);
  });

  test('password', 'Consider adding special characters for better security', () => {
    warn(); // Makes this a warning, not an error
    enforce(data.password).matches(/[!@#$%^&*]/);
  });

  test('password', 'Consider mixing uppercase and lowercase', () => {
    warn();
    enforce(data.password).matches(/[a-z]/) && enforce(data.password).matches(/[A-Z]/);
  });
});

// Component template - show warnings when field is dirty
@Component({
  template: `
    <!-- Errors (blocking) - show after touch -->
    @if (form.passwordTouched() && form.passwordInvalid()) {
      <span class="text-red-600" role="alert">
        {{ form.passwordValidation().errors[0] }}
      </span>
    }

    <!-- Warnings (non-blocking) - show when dirty -->
    @if (form.passwordDirty() && form.passwordValidation().warnings.length) {
      <div class="text-amber-600" role="status">
        💡 {{ form.passwordValidation().warnings[0] }}
      </div>
    }
  `
})
```

**Why this works:**

- **Errors** block submission → Show after `touched()` (user interaction)
- **Warnings** suggest improvements → Show when `dirty()` (value changes)
- Different ARIA roles: `role="alert"` (errors) vs `role="status"` (warnings)

#### Debouncing Warnings to Reduce UI Chatter

Use Vest's `test.debounce()` to delay warning display until the user pauses typing:

```typescript
import { test, warn } from 'vest';
import debounce from 'vest/debounce';

const passwordSuite = staticSafeSuite((data) => {
  // Regular error (immediate)
  test('password', 'Password is required', () => {
    enforce(data.password).isNotEmpty();
  });

  // Debounced warning (500ms delay after user stops typing)
  test(
    'password',
    'Consider adding special characters (!@#$%^&*)',
    debounce(() => {
      warn(); // MUST be called synchronously at the top
      enforce(data.password).matches(/[!@#$%^&*]/);
    }, 500), // Wait 500ms after last keystroke
  );

  test(
    'password',
    'Consider adding uppercase letters',
    debounce(() => {
      warn();
      enforce(data.password).matches(/[A-Z]/);
    }, 500),
  );
});
```

**Benefits:**

- ✅ Reduces visual noise during fast typing
- ✅ Shows warnings after user pauses (better UX)
- ✅ Prevents rapid warning flickering
- ✅ Uses Vest's built-in feature (no custom debounce logic)

**Important:** `warn()` must be called **synchronously at the top** of the debounced function, not after any async/await.

### Pattern 5: Edit Form with Pre-filled Data

```typescript
async ngOnInit() {
  const userId = this.route.snapshot.params['id'];
  const user = await this.api.getUser(userId);

  // Load data into form
  this.form.model.set(user);
  this.form.validate();

  // Mark as dirty so save button enables
  this.markAllFieldsDirty();
}

private markAllFieldsDirty() {
  Object.keys(this.form.model()).forEach(field => {
    this.form.field(field).markAsDirty();
  });
}
```

### Pattern 5: Form Wizard Validation

```typescript
async goToNextStep() {
  // Mark current step fields as touched
  this.currentStepFields.forEach(fieldName => {
    this.form.field(fieldName).markAsTouched();
  });

  // Validate current step
  this.form.validate();

  // Check if all current step fields are valid
  const allValid = this.currentStepFields.every(fieldName =>
    this.form.field(fieldName).valid()
  );

  if (allValid) {
    this.currentStep++;
  }
}
```

---

## API Reference

### Field-Level Signals (via Enhanced Proxy)

```typescript
// Read-only state signals
form.email(); // Signal<string> - current value
form.emailValid(); // Signal<boolean> - no errors AND no pending
form.emailInvalid(); // Signal<boolean> - has errors
form.emailDirty(); // Signal<boolean> - changed from initial
form.emailTouched(); // Signal<boolean> - user interacted
form.emailPending(); // Signal<boolean> - async validator running
form.emailValidation(); // Signal<{ errors: string[], warnings: string[] }>

// Write methods
form.setEmail(event); // Set value + validate
form.markAsTouchedEmail(); // Mark touched + validate
form.markAsDirtyEmail(); // Mark dirty (no validation)
form.resetEmail(); // Reset to initial value
```

### Form-Level Signals

```typescript
form.valid(); // Signal<boolean> - all valid + no pending
form.invalid(); // Signal<boolean> - has any errors
form.dirty(); // Signal<boolean> - any field changed
form.pending(); // Signal<boolean> - any async running
form.submittedStatus(); // Signal<'unsubmitted' | 'submitting' | 'submitted'>
form.errors(); // Signal<Record<string, string[]>>
```

### Explicit Field API

```typescript
const field = form.field('email');

// Signals (same as proxy)
field.value();
field.valid();
field.invalid();
field.dirty();
field.touched();
field.pending();
field.validation();

// Methods
field.set(value);
field.markAsTouched();
field.markAsDirty();
field.reset();
```

---

## Migration from v1.x

| v1.x API              | v2.0 Replacement                         |
| --------------------- | ---------------------------------------- |
| `field.touch()`       | `field.markAsTouched()` ❌ REMOVED       |
| `form.touchEmail()`   | `form.markAsTouchedEmail()`              |
| `form.hasSubmitted()` | `form.submittedStatus() === 'submitted'` |
| `field.errors()`      | `field.validation().errors`              |
| `field.warnings()`    | `field.validation().warnings`            |

**New in v2.0:**

- ✅ `dirty()` - Track value changes
- ✅ `invalid()` - Check for errors (ignores pending)
- ✅ `markAsDirty()` - Programmatic dirty state
- ✅ `submittedStatus()` - Unified submission state
- ✅ `validation()` - Combined errors + warnings

---

## Best Practices

1. **Always use `!valid()` or check `pending()` for submit button disable**

   ```typescript
   // ✅ CORRECT
   [disabled] = // ❌ WRONG (allows submit during async)
     '!form.valid() || form.pending()'[disabled] = 'form.invalid()';
   ```

2. **Use `dirty()` for unsaved changes, `touched()` for error timing**

   ```typescript
   // Unsaved changes
   @if (form.dirty()) { /* warning */ }

   // Error display
   @if (field.touched() && field.invalid()) { /* error */ }
   ```

3. **Mark pre-filled forms as dirty, not touched**

   ```typescript
   // ✅ CORRECT - Pre-filled data
   form.model.set(serverData);
   form.markAsDirtyEmail();

   // ❌ WRONG - Touched is for user interaction
   form.markAsTouchedEmail();
   ```

4. **Use `submittedStatus()` for comprehensive submission UI**

   ```typescript
   // ✅ Modern pattern
   @if (form.submittedStatus() === 'submitting') { /* loading */ }
   @else if (form.submittedStatus() === 'submitted') { /* success */ }

   // ❌ Old pattern
   @if (form.hasSubmitted()) { /* deprecated */ }
   ```

---

## Troubleshooting

### Q: Why is my submit button disabled even though there are no errors?

**A:** You're probably checking `invalid()` instead of `!valid()`. During async validation:

- `invalid()` = false (no errors yet)
- `valid()` = false (async running)

**Solution:**

```typescript
// Use this
[disabled] = // NOT this
  '!form.valid() || form.pending()'[disabled] = 'form.invalid()';
```

---

### Q: When should I use `markAsTouched()` vs `markAsDirty()`?

**A:**

- `markAsTouched()` → Trigger **error display** (user interacted)
- `markAsDirty()` → Mark as **modified** (value changed)

**Examples:**

```typescript
// Show all errors on submit → markAsTouched()
form.markAsTouchedEmail();

// Pre-fill from server → markAsDirty()
form.model.set(serverData);
form.markAsDirtyEmail();
```

---

### Q: How do I show errors only after the user stops typing?

**A:** Combine `touched()` with your error display:

```typescript
@if (form.emailTouched() && form.emailInvalid()) {
  <span role="alert">{{ form.emailValidation().errors[0] }}</span>
}
```

Or use the built-in `showErrors()` which respects the error strategy:

```typescript
@if (form.emailShowErrors()) {
  <span role="alert">{{ form.emailValidation().errors[0] }}</span>
}
```

---

## Reusable UI Components

The examples app provides ready-to-use components for visualizing form and field state. You can use these in your own examples or applications.

### FieldStatesTableComponent

Displays individual field states in a tabular format with color-coded T/F badges.

**When to use:** Educational content, field state visualization, debugging field-level state changes

```typescript
import { FieldStatesTableComponent } from '../../ui/field-states-table/public-api';

@Component({
  imports: [FieldStatesTableComponent],
  template: `
    <ngx-field-states-table
      [form]="form"
      [fields]="['email', 'username', 'password']"
    />
  `
})
```

**Features:**

- Shows field value (masks passwords)
- Color-coded badges: dirty (amber), touched (blue), invalid (red), valid (green)
- Responsive table with overflow handling
- Works with Enhanced Field Signals API

---

### FormStateDisplayComponent

Displays complete form state as formatted JSON with syntax highlighting.

**When to use:** Debugging form-level state, showing schema errors, development tools

```typescript
import { FormStateDisplayComponent } from '../../ui/form-state-display/public-api';

@Component({
  imports: [FormStateDisplayComponent],
  template: `
    <ngx-form-state-display
      title="Form State"
      [formState]="form.state()"
      [schema]="userSchema"
    />
  `
})
```

**Features:**

- Syntax-highlighted JSON output
- Status badges (Valid/Validating/Invalid)
- Schema error display (Layer 1 validation)
- Detects schema vendor (Zod, Valibot, ArkType)

---

### Debugger Component

Real-time form state debugger with collapsible panels (used in most examples).

**When to use:** Development, example pages, live state monitoring

```typescript
import { Debugger, asDebuggerForm } from '../../ui/debugger/debugger';

@Component({
  imports: [Debugger],
  template: `<ngx-debugger [form]="debugForm" [schema]="userSchema" />`
})
export class MyComponent {
  readonly form = createVestForm(...);
  readonly debugForm = asDebuggerForm(this.form);
}
```

**Features:**

- Form-level state (valid, pending, dirty)
- Field-level errors (with schema layer detection)
- Submit status tracking
- Model JSON snapshot

---

## See Also

- [Vest.js Best Practices](./vest.instructions.md)
- [Error Display Strategies](./ERROR_DISPLAY_MODES.md)
- [Form Arrays](./FORM_ARRAYS.md)
- [Schema Validation](./SCHEMA_VALIDATION.md)
