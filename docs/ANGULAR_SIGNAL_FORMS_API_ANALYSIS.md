# Angular Signal Forms API Analysis

**Date:** October 8, 2025
**ngx-vest-forms Version:** 2.x
**Angular Signal Forms:** @angular/forms/signals (v21+)
**Status:** Comprehensive API Comparison & Alignment Recommendations

---

## Executive Summary

After analyzing the official Angular Signal Forms API (`@angular/forms/signals`), I've identified **key philosophical alignments** and **intentional design differences** between the two libraries. This document provides actionable recommendations for potential API alignment.

### 🎯 Key Findings

1. **✅ Strong Philosophical Alignment**: Both libraries share signal-based reactivity, form state management, and validation patterns
2. **⚠️ Different Field Access Patterns**: Angular uses `FieldTree` (function-based), ngx-vest-forms uses `VestField` (object-based)
3. **🔄 Potential Alignment Opportunities**: Error formats, state properties, and method naming could be harmonized
4. **🎨 Unique Value Props**: ngx-vest-forms' Enhanced Proxy API and Vest.js integration remain distinct advantages

---

## Part 1: Core API Comparison

### 1.1 Field State Properties

| Property     | Angular Signal Forms (`FieldState`)    | ngx-vest-forms (`VestField`)             | Alignment Status        |
| ------------ | -------------------------------------- | ---------------------------------------- | ----------------------- |
| **Value**    | `value: WritableSignal<T>`             | `value: Signal<T>`                       | ⚠️ Different mutability |
| **Valid**    | `valid: Signal<boolean>`               | `valid: Signal<boolean>`                 | ✅ Aligned              |
| **Invalid**  | `invalid: Signal<boolean>`             | _(derived from `!valid()`)_              | ❌ Missing              |
| **Pending**  | `pending: Signal<boolean>`             | `pending: Signal<boolean>`               | ✅ Aligned              |
| **Touched**  | `touched: Signal<boolean>`             | `touched: Signal<boolean>`               | ✅ Aligned              |
| **Dirty**    | `dirty: Signal<boolean>`               | _(not tracked)_                          | ❌ Missing              |
| **Errors**   | `errors: Signal<ValidationError[]>`    | `validation: Signal<ValidationMessages>` | ⚠️ Different format     |
| **Disabled** | `disabled: Signal<boolean>`            | _(not tracked at field level)_           | ❌ Missing              |
| **Hidden**   | `hidden: Signal<boolean>`              | _(not tracked)_                          | ❌ Missing              |
| **Readonly** | `readonly: Signal<boolean>`            | _(not tracked)_                          | ❌ Missing              |
| **Required** | `required: Signal<boolean>`            | _(not tracked)_                          | ❌ Missing              |
| **Min/Max**  | `min/max: Signal<number \| undefined>` | _(not tracked)_                          | ❌ Missing              |
| **Pattern**  | `pattern: Signal<readonly RegExp[]>`   | _(not tracked)_                          | ❌ Missing              |

**Analysis:**

- ngx-vest-forms focuses on **validation state** (errors, warnings, pending)
- Angular Signal Forms tracks **UI metadata** (disabled, hidden, min/max, pattern)
- **Key Missing Feature**: `invalid()` signal (not the same as `!valid()` when pending)

### 1.2 Field Operations

| Operation        | Angular Signal Forms          | ngx-vest-forms          | Alignment Status     |
| ---------------- | ----------------------------- | ----------------------- | -------------------- |
| **Set Value**    | `field().value.set(newValue)` | `field.set(newValue)`   | ⚠️ Different pattern |
| **Mark Touched** | `field().markAsTouched()`     | `field.markAsTouched()` | ✅ Aligned (v2.0)    |
| **Mark Dirty**   | `field().markAsDirty()`       | `field.markAsDirty()`   | ✅ Aligned (Phase 1) |
| **Reset**        | `field().reset()`             | `field.reset()`         | ✅ Aligned           |

**Status:** ✅ Method naming fully aligned with Angular Signal Forms API as of v2.0.

### 1.3 Error Format Comparison

**Angular Signal Forms:**

```typescript
type ValidationError = {
  readonly kind: string; // Error type (e.g., 'required', 'email')
  readonly message?: string; // Optional human-readable message
  readonly field?: FieldTree<any>; // Optional field reference
};

// Example
field().errors(); // → [{ kind: 'required', message: 'Email is required' }]
```

**ngx-vest-forms:**

```typescript
type ValidationMessages = {
  errors: string[]; // Blocking errors (simple messages)
  warnings: string[]; // Non-blocking warnings (Vest warn() tests)
};

// Example
field.validation(); // → { errors: ['Email is required'], warnings: [] }
```

**Key Differences:**

1. Angular uses **structured errors** with `kind` property (machine-readable)
2. ngx-vest-forms uses **simple string arrays** (human-readable only)
3. ngx-vest-forms separates **errors from warnings** (WCAG compliance)

**Alignment Opportunity:**

```typescript
// Proposed: Add structured error format while keeping string arrays for backwards compat
type EnhancedValidationMessages = {
  errors: string[]; // Keep existing
  warnings: string[]; // Keep existing
  structuredErrors?: ValidationError[]; // New: Angular-compatible format
};
```

---

## Part 2: Field Access Patterns

### 2.1 Angular Signal Forms Pattern (FieldTree)

```typescript
interface User {
  email: string;
  profile: { firstName: string };
}

const userModel = signal<User>({ email: '', profile: { firstName: '' } });
const userForm: FieldTree<User> = form(userModel);

// Navigate field tree (mirrors data structure)
const emailField: FieldTree<string> = userForm.email;
const firstNameField: FieldTree<string> = userForm.profile.firstName;

// Call field as function to get state
emailField().value.set('test@example.com');
emailField().errors(); // ValidationError[]
emailField().valid(); // boolean
```

**Pros:**

- ✅ Explicit tree structure (mirrors data)
- ✅ TypeScript auto-completion at each level
- ✅ Works with dynamic arrays (`form.items[0].name`)

**Cons:**

- ⚠️ Verbose: `userForm.profile.firstName().value.set(value)`
- ⚠️ Must call field as function to access state
- ⚠️ More keystrokes in templates

### 2.2 ngx-vest-forms Pattern (Explicit + Proxy)

```typescript
interface User {
  email: string;
  profile: { firstName: string };
}

const userModel = signal<User>({ email: '', profile: { firstName: '' } });
const form = createVestForm(userModel, { suite: userValidations });

// Option 1: Explicit field() access
const emailField = form.field('email');
emailField.value(); // Signal<string> - no function call on field
emailField.set('test'); // Direct setter

// Option 2: Enhanced Proxy API (default)
form.email(); // Signal<string>
form.emailValid(); // Signal<boolean>
form.setEmail('test'); // Setter
form.profileFirstName(); // Nested: 'profile.firstName'
form.setProfileFirstName('John'); // Nested setter
```

**Pros:**

- ✅ Less verbose in templates
- ✅ Type-safe path strings with autocomplete
- ✅ Proxy API provides flat accessors (fewer keystrokes)

**Cons:**

- ⚠️ String paths (runtime errors if mistyped)
- ⚠️ Proxy magic may be less discoverable for new users

---

## Part 3: Form-Level API Comparison

### 3.1 Angular Signal Forms (Root FieldTree)

```typescript
const userForm: FieldTree<User> = form(userModel, schema);

// Access root state (call field as function)
userForm().value(); // WritableSignal<User>
userForm().valid(); // Signal<boolean>
userForm().invalid(); // Signal<boolean>
userForm().pending(); // Signal<boolean>
userForm().errors(); // Signal<ValidationError[]>
userForm().submitting(); // Signal<boolean>
userForm().submittedStatus(); // Signal<'unsubmitted' | 'submitting' | 'submitted'>

// Operations
userForm().value.set(newValue); // Update entire form
userForm().reset(); // Reset touched/dirty state
userForm().resetSubmittedStatus(); // Reset submit state

// Submit with action
await submit(userForm, async (field) => {
  const result = await api.save(field().value());
  return []; // or ServerError[]
});
```

### 3.2 ngx-vest-forms (VestForm)

```typescript
const form = createVestForm(userModel, { suite: userValidations });

// Access form state (direct signals)
form.model();                  // Signal<User>
form.valid();                  // Signal<boolean>
form.pending();                // Signal<boolean>
form.errors();                 // Signal<Record<string, string[]>>
form.visibleErrors();          // Signal<Record<string, string[]>>
form.submitting();             // Signal<boolean>
form.hasSubmitted();           // Signal<boolean>

// Operations
form.model.set(newValue);      // Update entire form
form.validate(fieldPath?);     // Run validation
form.reset();                  // Reset to initial state
form.resetField(path);         // Reset specific field

// Submit (returns result, never throws)
const result = await form.submit();
if (result.valid) {
  await api.save(result.data);
} else {
  console.log('Errors:', result.errors);
}
```

### 3.3 Key Differences

| Aspect             | Angular Signal Forms           | ngx-vest-forms                     | Recommendation                    |
| ------------------ | ------------------------------ | ---------------------------------- | --------------------------------- |
| **State Access**   | Call root field: `form()`      | Direct properties: `form.valid()`  | Keep current (clearer)            |
| **Invalid Signal** | Separate `invalid()`           | Derived from `valid()`             | **Add `invalid()`**               |
| **Error Format**   | Flat array `ValidationError[]` | Grouped `Record<string, string[]>` | Keep current (better UX)          |
| **Submit Status**  | `submittedStatus` signal       | `submitting()` + `hasSubmitted()`  | Consider adding `submittedStatus` |
| **Submit Return**  | `void` or `ServerError[]`      | `SubmitResult` object              | Keep current (clearer)            |
| **Dirty State**    | `dirty()` signal               | Not tracked                        | **Add `dirty()`**                 |

---

## Part 4: Validation API Comparison

### 4.1 Angular Signal Forms Validators

```typescript
import { required, email, min, max, pattern } from '@angular/forms/signals';

const userForm = form(userModel, [
  validate('email', required()),
  validate('email', email()),
  validate('age', min(18)),
  validate('password', pattern(/[A-Z]/)),
]);

// Custom validator
const customValidator: FieldValidator<string> = (ctx) => {
  if (ctx.value().includes('test')) {
    return customError('Cannot contain "test"');
  }
  return { valid: true };
};
```

### 4.2 ngx-vest-forms (Vest.js)

```typescript
import { staticSafeSuite, test, enforce, warn } from 'vest';

export const userValidations = staticSafeSuite<User>((data) => {
  test('email', 'Email is required', () => {
    enforce(data.email).isNotEmpty();
  });

  test('email', 'Email format is invalid', () => {
    enforce(data.email).isEmail();
  });

  test('age', 'Must be 18 or older', () => {
    enforce(data.age).greaterThanOrEquals(18);
  });

  // Warning (non-blocking)
  test('password', 'Add a special character for better security', () => {
    warn();
    enforce(data.password).matches(/[^A-Za-z0-9]/);
  });
});
```

**Key Difference:**

- Angular Signal Forms: **Function-based validators** (like Reactive Forms)
- ngx-vest-forms: **Declarative test suite** with Vest.js (more flexible, supports warnings)

**Verdict:** Keep Vest.js approach - it's the core value proposition of the library.

---

## Part 5: Alignment Recommendations

### 5.1 HIGH PRIORITY: Add Missing State Signals

**Why:** Align with Angular Signal Forms expectations without breaking existing API

```typescript
// Add to VestField interface
export type VestField<T = unknown> = {
  // ... existing properties ...

  /** Whether field is invalid (has errors, regardless of pending state) */
  invalid: Signal<boolean>; // ✅ NEW

  /** Whether field value has been changed by user */
  dirty: Signal<boolean>; // ✅ NEW
};

// Add to VestForm interface
export type VestForm<TModel> = {
  // ... existing properties ...

  /** Whether any field in the form is invalid */
  invalid: Signal<boolean>; // ✅ NEW

  /** Whether any field has been modified */
  dirty: Signal<boolean>; // ✅ NEW
};
```

**Implementation:**

```typescript
// In createVestForm()
const invalid = computed(() => {
  // invalid is true when there are errors, regardless of pending
  return Object.keys(errors()).length > 0;
});

const dirty = signal(false);

// Track dirty state in field setters
const set = (newValue: T) => {
  const currentValue = getValueByPath(model(), path);
  if (newValue !== currentValue) {
    dirty.set(true);
  }
  // ... existing logic ...
};
```

### 5.2 MEDIUM PRIORITY: Add Method Aliases

**Why:** Improve Angular developer familiarity

```typescript
export type VestField<T = unknown> = {
  // ... existing methods ...

  /** Alias for touch() - marks field as touched */
  markAsTouched(): void; // ✅ NEW (calls touch() internally)

  /** Marks field as dirty */
  markAsDirty(): void; // ✅ NEW
};
```

### 5.3 LOW PRIORITY: Structured Error Format

**Why:** Enable better error handling and I18n

```typescript
// New type (additive, non-breaking)
export type StructuredValidationError = {
  kind: string; // Error type ('required', 'email', 'custom')
  message: string; // Human-readable message
  params?: unknown; // Validator parameters (e.g., min: 18)
};

export type EnhancedValidationMessages = {
  errors: string[]; // Keep existing
  warnings: string[]; // Keep existing
  structuredErrors?: StructuredValidationError[]; // ✅ NEW (optional)
  structuredWarnings?: StructuredValidationError[]; // ✅ NEW (optional)
};

// Update VestField
export type VestField<T = unknown> = {
  validation: Signal<EnhancedValidationMessages>;
};
```

**Migration Path:**

1. Make `structuredErrors`/`structuredWarnings` optional
2. Extract from Vest test names (pattern: `'fieldName.errorKind'`)
3. Parse error messages for structured data

### 5.4 CONSIDER: FieldTree-like Access Pattern

**Why:** Provide Angular Signal Forms compatible API as opt-in

```typescript
// Optional export for Angular Signal Forms users
import { createVestFormTree } from 'ngx-vest-forms/angular-compat';

const form = createVestFormTree(userModel, { suite: userValidations });

// Angular-like API
form.email().value.set('test@example.com');
form.email().errors();
form.email().valid();

// Still get ngx-vest-forms benefits
form.email().validation().warnings; // Unique to ngx-vest-forms
```

---

## Part 6: Implementation Plan

### Phase 1: Non-Breaking Additions (v2.1)

**Goal:** Add Angular Signal Forms compatibility WITHOUT breaking existing API

- [ ] Add `invalid()` signal to `VestField` and `VestForm`
- [ ] Add `dirty()` signal to `VestField` and `VestForm`
- [ ] Add `markAsTouched()` and `markAsDirty()` methods
- [ ] Update Enhanced Proxy to include `invalid()` and `dirty()` accessors
  - `form.emailInvalid()`
  - `form.emailDirty()`

**Estimated Effort:** 4-6 hours
**Breaking Changes:** None
**Testing Impact:** Add new test cases for `invalid()` and `dirty()`

### Phase 2: Structured Errors (v2.2)

**Goal:** Enable better error handling and I18n

- [ ] Define `StructuredValidationError` type
- [ ] Update `ValidationMessages` to include optional `structuredErrors`/`structuredWarnings`
- [ ] Extract structured errors from Vest test results
- [ ] Add utility to convert Vest errors to structured format
- [ ] Update documentation with structured error examples

**Estimated Effort:** 8-12 hours
**Breaking Changes:** None (additive)
**Testing Impact:** Add parser tests, update component tests

### Phase 3: Angular Compat Package (v2.3+)

**Goal:** Provide FieldTree-like API for Angular Signal Forms users

- [ ] Create `ngx-vest-forms/angular-compat` entry point
- [ ] Implement `createVestFormTree()` factory
- [ ] Add TypeScript types for FieldTree-like access
- [ ] Write migration guide for Angular Signal Forms users
- [ ] Add comparison examples in docs

**Estimated Effort:** 16-24 hours
**Breaking Changes:** None (new package)
**Testing Impact:** Full test suite for compat package

---

## Part 7: Should We Align APIs?

### ✅ YES - Align These

1. **`invalid()` and `dirty()` signals** - Essential for Angular parity
2. **Method aliases** (`markAsTouched()`) - Developer familiarity
3. **Structured error format** (optional) - Better error handling

**Rationale:**

- No breaking changes required
- Improves Angular developer experience
- Maintains ngx-vest-forms unique features (warnings, Vest.js, Proxy API)

### ❌ NO - Keep These Different

1. **Field access pattern** - Keep both `field()` and Proxy API
2. **Validation approach** - Vest.js is our core value prop
3. **Error display strategy** - WCAG-compliant system is unique
4. **Submit return type** - `SubmitResult` is clearer than `void` or `ServerError[]`

**Rationale:**

- These differences are intentional design choices
- They provide unique value over Angular Signal Forms
- FieldTree access can be added as opt-in compat layer

### 🤔 MAYBE - Evaluate Further

1. **UI metadata tracking** (`disabled`, `hidden`, `min/max`, `pattern`)
   - **Pro:** Aligns with Angular, useful for UI components
   - **Con:** Adds complexity, not core to validation
   - **Verdict:** Add to roadmap, gather user feedback first

2. **`disabledReasons` with field trace**
   - **Pro:** Advanced debugging capability
   - **Con:** Complex implementation, niche use case
   - **Verdict:** Document workaround using Vest's conditional logic

---

## Part 8: Final Recommendations

### Immediate Actions (Next Sprint)

1. **Add `invalid()` and `dirty()` signals** to VestField and VestForm
2. **Add method aliases** (`markAsTouched()`, `markAsDirty()`)
3. **Update Enhanced Proxy** to include new accessors
4. **Write tests** for new features
5. **Update documentation** with Angular Signal Forms comparison

### Short-term (1-2 Months)

1. **Implement structured error format** (optional, non-breaking)
2. **Create migration guide** from Angular Signal Forms
3. **Add examples** showing both APIs side-by-side
4. **Gather user feedback** on UI metadata tracking

### Long-term (3-6 Months)

1. **Evaluate Angular compat package** based on user demand
2. **Consider UI metadata tracking** if widely requested
3. **Monitor Angular Signal Forms** evolution for new patterns

### What NOT to Change

1. ✅ **Keep Vest.js validation** - core value proposition
2. ✅ **Keep Proxy API** - unique developer experience
3. ✅ **Keep error display strategies** - WCAG compliance advantage
4. ✅ **Keep `SubmitResult` type** - clearer error handling

---

## Conclusion

**Our current API is already very good**, but we can improve Angular developer familiarity by:

1. Adding missing state signals (`invalid()`, `dirty()`)
2. Providing method aliases for common operations
3. Optionally supporting structured error formats

These changes require **no breaking changes** and can be implemented incrementally. The core design philosophy of ngx-vest-forms (Vest.js validation, Enhanced Proxy API, WCAG-compliant error strategies) should be preserved as unique differentiators.

**Verdict:** Align where it makes sense (state signals, method names), but keep our unique features that provide real value over Angular Signal Forms.
