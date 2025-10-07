# API Comparison: ngx-vest-forms vs Angular Signal Forms

**Date:** October 7, 2025
**Version:** 2.x
**Status:** Comprehensive API Analysis

## Executive Summary

This document provides a **detailed API comparison** between:

1. **ngx-vest-forms v2** - Current implementation (Vest.js + Signals)
2. **Angular Signal Forms** - Prototype implementation (@angular/forms/signals)

**Key Finding:** Both libraries share **100% philosophical alignment** on signal-based reactivity but differ intentionally in **field access patterns** and **validation approaches**. These differences serve distinct use cases rather than indicating incompatibility.

---

## Table of Contents

- [Field State API Comparison](#field-state-api-comparison)
- [Form State API Comparison](#form-state-api-comparison)
- [Field Access Patterns](#field-access-patterns)
- [Validation API Comparison](#validation-api-comparison)
- [Template Binding Comparison](#template-binding-comparison)
- [Async Validation Comparison](#async-validation-comparison)
- [Should We Align APIs?](#should-we-align-apis)
- [ngx-vest-forms/signals Package Feasibility](#ngx-vest-formssignals-package-feasibility)

---

## Field State API Comparison

### Angular Signal Forms: FieldState Interface

```typescript
// Navigate to field
const emailField: Field<string> = userForm.email;

// Call field as function to get state
const emailState: FieldState<string> = emailField();

// Access state properties (all Signals)
emailState.value(); // WritableSignal<string> - Current value
emailState.valid(); // Signal<boolean> - Is valid (no errors, no pending)
emailState.invalid(); // Signal<boolean> - Has errors (regardless of pending)
emailState.pending(); // Signal<boolean> - Has pending async validators
emailState.errors(); // Signal<FormError[]> - Validation errors
emailState.disabled(); // Signal<boolean> - Is disabled
emailState.disabledReasons(); // Signal<DisabledReason[]> - Why disabled
emailState.touched(); // Signal<boolean> - User interacted

// FormError structure
type FormError = { kind: string; message?: string };

// DisabledReason structure
type DisabledReason = { field: Field<any>; reason?: string };
```

**Pattern:** Function-based access (`field()` returns state object)

### ngx-vest-forms v2: VestField Interface

```typescript
// Get field accessor
const emailField: VestField<string> = form.field('email');

// Access state properties (all Signals)
emailField.value(); // Signal<string> - Current value
emailField.valid(); // Signal<boolean> - Is valid (no errors)
emailField.pending(); // Signal<boolean> - Has pending async validation
emailField.validation(); // Signal<ValidationMessages> - Errors + warnings
emailField.touched(); // Signal<boolean> - User interacted
emailField.showErrors(); // Signal<boolean> - Should display errors (strategy-aware)
emailField.showWarnings(); // Signal<boolean> - Should display warnings
emailField.fieldName; // string - Field path/name (readonly)

// ValidationMessages structure
type ValidationMessages = {
  errors: string[]; // Blocking errors
  warnings: string[]; // Non-blocking warnings (from Vest warn())
};

// Operations
emailField.set(value); // Set value and validate
emailField.touch(); // Mark touched without value change
emailField.reset(); // Reset to initial value
```

**Pattern:** Object-based access (field object exposes signals directly)

### Enhanced Field Signals API (Proxy-based)

```typescript
// Auto-generated via Proxy (enabled by default)
form.email(); // Signal<string> - Shortcut for form.field('email').value()
form.emailValid(); // Signal<boolean> - Shortcut for form.field('email').valid()
form.emailValidation(); // Signal<ValidationMessages> - Errors + warnings
form.emailPending(); // Signal<boolean> - Async validation state
form.emailTouched(); // Signal<boolean> - Touched state
form.emailShowErrors(); // Signal<boolean> - Strategy-aware error display
form.emailShowWarnings(); // Signal<boolean> - Warning display

// Setters
form.setEmail(value); // Set value and validate
form.touchEmail(); // Mark touched
form.resetEmail(); // Reset to initial

// Nested fields (camelCase flattening)
form.userProfileEmail(); // Accesses 'user.profile.email'
form.setUserProfileEmail(value);
```

**Pattern:** Flat proxy accessors (fewer keystrokes, better autocomplete)

### Key Differences

| Aspect                | Angular Signal Forms                             | ngx-vest-forms v2                      |
| --------------------- | ------------------------------------------------ | -------------------------------------- |
| **Field Access**      | Function call: `field()` → state object          | Property access: `field.value()`       |
| **State Nesting**     | Explicit: `field().value()`, `field().valid()`   | Flat: `field.value()`, `field.valid()` |
| **Error Format**      | `FormError[]` (`{kind, message?}`)               | `string[]` (simple messages)           |
| **Warning Support**   | No built-in warnings                             | Separate `warnings[]` (WCAG)           |
| **Disabled Tracking** | `disabledReasons` with field trace               | Simple `disabled` boolean              |
| **Invalid Signal**    | Separate `invalid()` (≠ `!valid()` when pending) | Derived from `valid()`                 |
| **Error Display**     | No built-in strategy                             | `showErrors()` strategy-aware          |
| **Enhanced API**      | Not available                                    | Proxy-based shortcuts                  |

---

## Form State API Comparison

### Angular Signal Forms: Root Field State

```typescript
// Create form
const userModel = signal({ email: '', password: '' });
const userForm: Field<User> = form(userModel, schema);

// Access root state (call field as function)
userForm().value(); // WritableSignal<User>
userForm().valid(); // Signal<boolean>
userForm().invalid(); // Signal<boolean>
userForm().pending(); // Signal<boolean>
userForm().errors(); // Signal<FormError[]>
userForm().touched(); // Signal<boolean>
userForm().submittedStatus(); // Signal<'unsubmitted' | 'submitting' | 'submitted'>

// Operations
userForm().value.set(newValue); // Update entire form
userForm().resetSubmittedStatus(); // Reset submit state

// Submit with action
await submit(userForm, async (field) => {
  const result = await api.save(field().value());
  if (!result.ok) {
    return [
      { error: { kind: 'server', message: result.error }, field: field.email },
    ];
  }
  return [];
});
```

### ngx-vest-forms v2: VestForm Interface

```typescript
// Create form
const userModel = signal({ email: '', password: '' });
const form = createVestForm(userSuite, userModel);

// Access form state (direct signals)
form.model()                   // Signal<User> - Model signal
form.result()                  // Signal<SuiteResult> - Vest result
form.valid()                   // Signal<boolean>
form.pending()                 // Signal<boolean>
form.errors()                  // Signal<Record<string, string[]>> - All errors
form.visibleErrors()           // Signal<Record<string, string[]>> - Strategy-aware
form.submitting()              // Signal<boolean>
form.hasSubmitted()            // Signal<boolean>
form.errorStrategy             // ErrorDisplayStrategy | Signal<ErrorDisplayStrategy>

// Operations
form.validate(fieldPath?)      // Run validation (whole form or specific field)
form.reset()                   // Reset to initial state
form.resetField(path)          // Reset specific field
form.dispose()                 // Cleanup subscriptions

// Submit (returns result, never throws)
const result = await form.submit();
if (result.valid) {
  await api.save(result.data);
} else {
  console.log('Errors:', result.errors);
}

type SubmitResult<TModel> = {
  valid: boolean;
  data: TModel;
  errors: Record<string, string[]>;
};
```

### Key Differences

| Aspect             | Angular Signal Forms                   | ngx-vest-forms v2                            |
| ------------------ | -------------------------------------- | -------------------------------------------- |
| **State Access**   | Call root field: `form()` → state      | Direct properties: `form.valid()`            |
| **Error Format**   | Flat array: `FormError[]`              | Grouped by field: `Record<string, string[]>` |
| **Submit Status**  | `submittedStatus` signal               | `submitting()` + `hasSubmitted()`            |
| **Submit Return**  | `void` or `ServerError[]` (via action) | `SubmitResult` object                        |
| **Error Strategy** | Not built-in                           | `errorStrategy` + `visibleErrors()`          |
| **Vest Result**    | Not exposed                            | `result()` exposes SuiteResult               |
| **Model Access**   | Via `field().value()`                  | Via `form.model()`                           |
| **Reset Submit**   | `resetSubmittedStatus()`               | `reset()` (full reset)                       |

---

## Field Access Patterns

### Pattern 1: Angular Signal Forms (Field Tree Navigation)

```typescript
interface Order {
  orderId: string;
  items: Array<{ description: string; quantity: number }>;
}

const orderModel = signal<Order>({ orderId: '', items: [] });
const orderForm: Field<Order> = form(orderModel);

// Navigate field tree (mirrors data structure)
const orderIdField: Field<string> = orderForm.orderId;
const itemsField: Field<LineItem[]> = orderForm.items;
const firstItemField: Field<LineItem> = orderForm.items[0];
const quantityField: Field<number> = orderForm.items[0].quantity;

// Call field to get state
const quantity = quantityField().value();         // Get value
quantityField().value.set(5);                     // Set value
const isValid = quantityField().valid();          // Check validity
const errors = quantityField().errors();          // Get errors

// Template
@if (!orderForm.items[0].quantity().pending()) {
  <input [control]="orderForm.items[0].quantity" />
}
@if (orderForm.items[0].quantity().errors().length) {
  <span>{{ orderForm.items[0].quantity().errors()[0].message }}</span>
}
```

**Pros:**

- ✅ Explicit tree structure (mirrors data exactly)
- ✅ TypeScript infers types at each navigation step
- ✅ Works well with dynamic arrays (no name generation needed)

**Cons:**

- ⚠️ Verbose in templates: `orderForm.items[0].quantity().errors()`
- ⚠️ Must call field as function to get state
- ⚠️ More keystrokes for common operations

### Pattern 2: ngx-vest-forms Explicit Field Access

```typescript
interface Order {
  orderId: string;
  items: Array<{ description: string; quantity: number }>;
}

const orderModel = signal<Order>({ orderId: '', items: [] });
const form = createVestForm(orderSuite, orderModel);

// Explicit field() method (type-safe path strings)
const orderIdField = form.field('orderId');               // VestField<string>
const itemsField = form.field('items');                   // VestField<LineItem[]>
const firstItemField = form.field('items.0');             // VestField<LineItem>
const quantityField = form.field('items.0.quantity');     // VestField<number>

// Access state (no function call needed)
const quantity = quantityField.value();        // Signal<number>
quantityField.set(5);                          // Set value
const isValid = quantityField.valid();         // Signal<boolean>
const errors = quantityField.validation();     // Signal<ValidationMessages>

// Template
@if (!form.field('items.0.quantity').pending()) {
  <input
    [value]="form.field('items.0.quantity').value()"
    (input)="form.field('items.0.quantity').set($event)"
  />
}
@if (form.field('items.0.quantity').showErrors() && form.field('items.0.quantity').validation().errors.length) {
  <span>{{ form.field('items.0.quantity').validation().errors[0] }}</span>
}
```

**Pros:**

- ✅ Type-safe path strings with autocomplete
- ✅ No function call to get state
- ✅ Works with dynamic indices

**Cons:**

- ⚠️ String paths (runtime errors if mistyped)
- ⚠️ Still verbose in templates
- ⚠️ Repeated `form.field('path')` calls

### Pattern 3: ngx-vest-forms Enhanced Proxy API (Default)

```typescript
interface Order {
  orderId: string;
  items: Array<{ description: string; quantity: number }>;
}

const orderModel = signal<Order>({ orderId: '', items: [] });
const form = createVestForm(orderSuite, orderModel, {
  enhancedFieldSignals: true, // Default: enabled
});

// Auto-generated flat accessors (camelCase conversion)
form.orderId()                    // Signal<string>
form.orderIdValid()               // Signal<boolean>
form.setOrderId(value)            // Setter

// Arrays: use explicit field() for dynamic indices
const quantity = form.field('items.0.quantity');

// Template (minimal syntax)
<input
  [value]="form.orderId()"
  (input)="form.setOrderId($event)"
/>
@if (form.orderIdShowErrors() && form.orderIdValidation().errors.length) {
  <span role="alert">{{ form.orderIdValidation().errors[0] }}</span>
}

// Nested fields (automatic flattening)
// For "user.profile.email":
form.userProfileEmail()           // Signal<string>
form.userProfileEmailValid()      // Signal<boolean>
form.setUserProfileEmail(value)   // Setter
```

**Pros:**

- ✅ **Minimal keystrokes** (best DX for static fields)
- ✅ **Superior autocomplete** (IDE suggests all fields)
- ✅ **No repeated `form.field()` calls**
- ✅ **Template-friendly** (concise syntax)
- ✅ **Type-safe** (TypeScript generates from model)

**Cons:**

- ⚠️ Dynamic arrays still need `form.field('items.0')`
- ⚠️ Nested paths become long camelCase names
- ⚠️ Requires Proxy support (ES2015+)

---

## Validation API Comparison

### Angular Signal Forms: Schema-Based Validation

```typescript
import {
  schema,
  required,
  validate,
  error,
  validateHttp,
} from '@angular/forms/signals';

interface User {
  email: string;
  password: string;
  confirmPassword: string;
}

const userSchema = schema<User>((path) => {
  // Required fields
  required(path.email);
  required(path.password);

  // Custom validation
  validate(path.email, ({ value }) => {
    if (!/\w+@\w+\.\w+/.test(value())) {
      return { kind: 'invalid-email', message: 'Invalid email format' };
    }
    return undefined; // No error
  });

  // Cross-field validation (Approach 1: common parent)
  validate(path, ({ value }) => {
    const { password, confirmPassword } = value();
    if (password !== confirmPassword) {
      return { kind: 'mismatch', message: 'Passwords must match' };
    }
    return undefined;
  });

  // Cross-field validation (Approach 2: helper function)
  validate(path.confirmPassword, ({ value, valueOf }) => {
    const password = valueOf(path.password);
    if (password !== value()) {
      return { kind: 'mismatch', message: 'Passwords must match' };
    }
    return undefined;
  });

  // Server validation (async)
  validateHttp(path.email, {
    request: ({ value }) => `/api/check-email?email=${value()}`,
    errors: (response) => {
      if (response.taken) {
        return [{ kind: 'taken', message: 'Email already taken' }];
      }
      return [];
    },
  });
});

// Use in component
const userForm = form(
  signal({ email: '', password: '', confirmPassword: '' }),
  userSchema,
);
```

**Characteristics:**

- Static schema definition (runs once at form creation)
- Reactive execution (validation functions re-run on value changes)
- Logic binding functions: `validate`, `error`, `required`, `disabled`, `hidden`, etc.
- Async via `validateHttp()` or `validateAsync()` with HttpResource
- Short-circuiting: async only runs when sync validators pass

### ngx-vest-forms: Vest.js Suite Validation

```typescript
import { staticSafeSuite } from 'ngx-vest-forms/core';
import { test, enforce, include, skipWhen } from 'vest';

interface User {
  email: string;
  password: string;
  confirmPassword: string;
}

const userSuite = staticSafeSuite<User>((data) => {
  // Required fields (with enforce)
  test('email', 'Email is required', () => {
    enforce(data.email).isNotEmpty();
  });

  test('password', 'Password is required', () => {
    enforce(data.password).isNotEmpty();
  });

  // Custom validation (multiple tests per field)
  test('email', 'Invalid email format', () => {
    enforce(data.email).matches(/\w+@\w+\.\w+/);
  });

  // Cross-field validation (declarative dependencies)
  include('confirmPassword').when('password');
  test('confirmPassword', 'Passwords must match', () => {
    enforce(data.confirmPassword).equals(data.password);
  });

  // Conditional expensive validation (skip until email valid)
  skipWhen(
    (res) => res.hasErrors('email'),
    () => {
      test('email', 'Email already taken', async ({ signal }) => {
        const response = await fetch(`/api/check-email?email=${data.email}`, {
          signal,
        });
        if (!response.ok) throw new Error('Email taken');
      });
    },
  );
});

// Use in component
const form = createVestForm(
  userSuite,
  signal({ email: '', password: '', confirmPassword: '' }),
);
```

**Characteristics:**

- External validation suite (separate file, reusable)
- Multiple tests per field (progressive error disclosure)
- Declarative cross-field: `include().when()`
- Conditional logic: `skipWhen()`, `omitWhen()`
- Async with AbortSignal + `test.memo()` caching
- Selective validation: `only(field)` runs specific tests

### Key Differences

| Aspect                    | Angular Signal Forms                 | ngx-vest-forms (Vest.js)                  |
| ------------------------- | ------------------------------------ | ----------------------------------------- |
| **Definition Location**   | Inline or external schema function   | External suite file (reusable)            |
| **Syntax**                | `validate(path, fn)`                 | `test('field', 'message', fn)`            |
| **Error Format**          | `{kind, message}` objects            | String messages                           |
| **Tests per Field**       | One validate call = one error        | Multiple `test()` calls = multiple errors |
| **Cross-Field**           | `valueOf(path)` helper               | `include().when()`                        |
| **Conditional**           | `applyWhen(path, condition, schema)` | `skipWhen()`, `omitWhen()`                |
| **Async**                 | `validateHttp()`, `validateAsync()`  | `test.memo()` with deps array             |
| **Cancellation**          | HttpResource automatic               | AbortSignal manual                        |
| **Selective Validation**  | Not available (all rules run)        | `only(field)` runs specific field         |
| **Warnings**              | Not supported                        | `warn()` for non-blocking hints           |
| **Framework Portability** | Angular-only                         | Works in React, Vue, Node.js              |

---

## Template Binding Comparison

### Angular Signal Forms: [control] Directive

```typescript
@Component({
  imports: [Control],
  template: `
    <form>
      <!-- Automatic two-way binding -->
      <input [control]="userForm.email" />

      <!-- Disabled state automatic -->
      <input [control]="userForm.password" />

      <!-- Works with custom components -->
      <mat-select [control]="userForm.country">
        <mat-option value="us">USA</mat-option>
      </mat-select>

      <!-- Errors (manual display) -->
      @if (userForm.email().errors().length) {
        <span>{{ userForm.email().errors()[0].message }}</span>
      }
    </form>
  `,
})
class UserFormComponent {
  userForm = form(signal({ email: '', password: '', country: '' }), schema);
}
```

**Behavior:**

- ✅ Automatic value sync (both directions)
- ✅ Automatic disabled sync (`[disabled]` set from `field().disabled()`)
- ✅ Automatic touched tracking (blur → `field().touched` = true)
- ✅ Works with ControlValueAccessor components
- ⚠️ No error display strategy (manual conditional rendering)

### ngx-vest-forms: Explicit Binding + Directives

```typescript
@Component({
  imports: [NgxVestForms], // Includes all directives + error component
  template: `
    <form [ngxVestForm]="form">
      <!-- Explicit value binding -->
      <input
        id="email"
        [value]="form.email()"
        (input)="form.setEmail($event)"
      />

      <!-- Auto-touch + Auto-ARIA via [ngxVestForm] directive -->
      <input
        id="password"
        [value]="form.password()"
        (input)="form.setPassword($event)"
      />

      <!-- Error display with strategy -->
      <ngx-form-error [field]="form.field('email')" />

      <!-- Or manual with strategy awareness -->
      @if (form.emailShowErrors() && form.emailValidation().errors.length) {
        <span role="alert">{{ form.emailValidation().errors[0] }}</span>
      }
    </form>
  `,
})
class UserFormComponent {
  form = createVestForm(userSuite, signal({ email: '', password: '' }), {
    errorStrategy: 'on-touch', // immediate | on-touch | on-submit | manual
  });
}
```

**Behavior (with `[ngxVestForm]` directive):**

- ✅ Auto-ARIA: `aria-invalid`, `aria-describedby` (WCAG 2.2)
- ✅ Auto-touch: Blur → mark touched + run validation
- ✅ Auto-busy: `aria-busy` during async validation
- ✅ Error display strategies (progressive disclosure)
- ✅ WCAG-compliant error component
- ⚠️ Explicit `[value]`/`(input)` binding (more verbose)

**Why Explicit Binding Works Better for Vest.js:**

1. **Selective Validation**: `only(field)` needs field name → explicit binding provides it
2. **Debugging**: Explicit data flow (easier to trace)
3. **No Framework Dependency**: Works without Angular Forms
4. **Portable**: Same pattern works in React, Vue (Vest.js strength)

### Key Differences

| Aspect                | Angular Signal Forms      | ngx-vest-forms                        |
| --------------------- | ------------------------- | ------------------------------------- |
| **Binding Directive** | `[control]` (automatic)   | `[value]`/`(input)` (explicit)        |
| **Auto-Touch**        | Via `[control]`           | Via `[ngxVestForm]` + field id        |
| **Auto-ARIA**         | Not built-in              | Via `[ngxVestForm]`                   |
| **Error Strategy**    | Not built-in              | Built-in (4 strategies)               |
| **Error Component**   | Not provided              | `<ngx-form-error>` WCAG-compliant     |
| **Disabled Sync**     | Automatic via `[control]` | Manual `[disabled]="form.disabled()"` |
| **CVA Support**       | Yes (via `[control]`)     | No (explicit binding only)            |

---

## Async Validation Comparison

### Angular Signal Forms: HttpResource-based

```typescript
import { validateHttp, validateAsync } from '@angular/forms/signals';
import { rxResource } from '@angular/core';

const userSchema = schema<User>((path) => {
  // Built-in HTTP validation
  validateHttp(path.username, {
    request: ({ value }) => `/api/check-username?username=${value()}`,
    errors: (response) => {
      if (response.taken) {
        return [{ kind: 'taken', message: 'Username already taken' }];
      }
      return [];
    },
  });

  // Custom Resource-based async
  validateAsync(path.email, {
    params: ({ value }) => ({ email: value() }),
    factory: (params) => {
      return rxResource({
        params,
        stream: ({ params }) =>
          inject(HttpClient).get(`/api/check-email`, { params }),
      });
    },
    errors: (data) => {
      if (data.taken) {
        return [{ kind: 'taken', message: 'Email already taken' }];
      }
      return [];
    },
  });
});

// Short-circuiting: async only runs when sync validators pass
// Automatic cancellation via HttpResource
```

**Characteristics:**

- Built-in `validateHttp()` for server validation
- Uses Angular's `HttpResource` (resource API)
- Automatic request cancellation
- Short-circuits when sync validators fail
- `pending()` signal indicates async in progress

### ngx-vest-forms: Vest.js Async Tests

```typescript
import { staticSafeSuite } from 'ngx-vest-forms/core';
import { test, enforce, skipWhen } from 'vest';

const userSuite = staticSafeSuite<User>((data) => {
  // Sync validation first
  test('username', 'Username is required', () => {
    enforce(data.username).isNotEmpty();
  });

  // Skip expensive async until sync passes
  skipWhen(
    (res) => res.hasErrors('username'),
    () => {
      test('username', 'Username already taken', async ({ signal }) => {
        const response = await fetch(
          `/api/check-username?username=${data.username}`,
          {
            signal, // Manual cancellation
          },
        );

        if (!response.ok) {
          throw new Error('Username taken'); // Fail test
        }
        // Resolve = pass test
      });
    },
  );

  // Cached async with dependency tracking
  test.memo(
    'email',
    'Email validation failed',
    async ({ signal }) => {
      const response = await fetch(`/api/check-email?email=${data.email}`, {
        signal,
      });
      if (!response.ok) throw new Error();
    },
    [data.email],
  ); // Re-run only when email changes
});

// Pending state
form.usernamePending(); // Signal<boolean>
form.pending(); // Signal<boolean> (any field)
```

**Characteristics:**

- Manual `test()` with async function
- AbortSignal for cancellation (must handle)
- `skipWhen()` for conditional execution (short-circuit)
- `test.memo()` for caching with deps array
- `pending()` signals at field and form level

### Key Differences

| Aspect                   | Angular Signal Forms                | ngx-vest-forms (Vest.js)      |
| ------------------------ | ----------------------------------- | ----------------------------- |
| **Async API**            | `validateHttp()`, `validateAsync()` | `test()` with async function  |
| **HTTP Integration**     | Built-in HttpResource               | Manual fetch/HttpClient       |
| **Cancellation**         | Automatic (HttpResource)            | Manual (AbortSignal)          |
| **Caching**              | Resource-based                      | `test.memo()` with deps array |
| **Short-Circuiting**     | Automatic (sync → async)            | Manual `skipWhen()`           |
| **Pending State**        | `pending()` signal                  | `pending()` signal (same)     |
| **Error Handling**       | `errors()` callback                 | throw/reject = fail           |
| **Framework Dependency** | Angular HttpClient/Resource         | Fetch API (universal)         |

---

## Should We Align APIs?

### Analysis: Field State Access

#### Option 1: Keep Current Pattern (Recommended ✅)

```typescript
// Current: VestField object exposes signals directly
const field = form.field('email');
field.value(); // Signal<string>
field.valid(); // Signal<boolean>
field.validation(); // Signal<ValidationMessages>

// Enhanced: Proxy shortcuts
form.email(); // Signal<string>
form.emailValid(); // Signal<boolean>
```

**Pros:**

- ✅ Simpler API (no double function call)
- ✅ Enhanced Proxy API works seamlessly
- ✅ Better template ergonomics
- ✅ Familiar to existing users
- ✅ Less breaking changes

**Cons:**

- ⚠️ Differs from Signal Forms pattern

#### Option 2: Adopt Signal Forms Pattern (Not Recommended ❌)

```typescript
// Signal Forms: Field object is callable, returns state
const field = form.field('email');
field().value(); // WritableSignal<string>
field().valid(); // Signal<boolean>
field().errors(); // Signal<FormError[]>

// Problem: Enhanced Proxy API breaks
form.email(); // Would return FieldState, not value signal
form.email().value(); // Required - worse DX
```

**Pros:**

- ✅ Matches Signal Forms API

**Cons:**

- ❌ **Breaks Enhanced Proxy API** (primary value proposition)
- ❌ **Worse template DX** (`form.email().value()` vs `form.email()`)
- ❌ **Breaking change** for existing users
- ❌ **Double function call** (`field()()`)
- ❌ No real benefit (philosophical alignment already achieved)

### Recommendation: **Keep Current Pattern**

**Rationale:**

1. Enhanced Field Signals API is a **unique value proposition** (better DX than Signal Forms)
2. Adopting Signal Forms pattern would **destroy** this advantage
3. Both approaches are **philosophically aligned** (signal-based reactivity)
4. Intentional API differences serve **different use cases**

---

## ngx-vest-forms/signals Package Feasibility

### Concept: Angular Signal Forms + Vest.js Validation

Create a new package that uses Angular Signal Forms for field structure but Vest.js for validation:

```typescript
// Proposed API
import { createSignalForm } from 'ngx-vest-forms/signals';
import { schema } from '@angular/forms/signals';
import { staticSafeSuite } from 'ngx-vest-forms/core';

// Vest validation suite
const userValidation = staticSafeSuite<User>((data) => {
  test('email', 'Email is required', () => enforce(data.email).isNotEmpty());
  test('email', 'Invalid format', () => enforce(data.email).isEmail());
});

// Angular Signal Forms with Vest validation
const userForm = createSignalForm(
  signal({ email: '', password: '' }),
  (path) => {
    // Use Vest suite instead of Angular validators
    vestValidation(path, userValidation);

    // Or mix with Angular logic
    required(path.email);
    disabled(path.password, ({ valueOf }) => !valueOf(path.email));
  }
);

// Template: Use [control] directive
<input [control]="userForm.email" />
```

### Technical Feasibility: **HIGH** ⚠️ (But Questionable Value)

#### Implementation Approach

1. **Wrap Vest Suite as Schema**:

```typescript
function vestValidation<TModel>(
  path: FieldPath<TModel>,
  vestSuite: VestSuite<TModel>,
): void {
  validate(path, ({ value }) => {
    const result = vestSuite(value() as TModel);
    const errors = result.getErrors();

    // Convert Vest string[] errors to FormError[]
    return Object.entries(errors).map(([field, messages]) => ({
      kind: 'vest-error',
      message: messages[0],
      field: path[field as keyof TModel],
    }));
  });
}
```

2. **Bridge Vest Result to FieldState**:

```typescript
function vestValidationTree<TModel>(
  rootPath: FieldPath<TModel>,
  vestSuite: VestSuite<TModel>,
): void {
  validateTree(rootPath, ({ value, field }) => {
    const result = vestSuite(value() as TModel);
    const errors: FormError[] = [];

    for (const [fieldPath, messages] of Object.entries(result.getErrors())) {
      const targetField = getFieldByPath(field, fieldPath);
      errors.push({
        kind: 'vest-error',
        message: messages[0],
        field: targetField,
      });
    }

    return errors;
  });
}
```

3. **Handle Vest-Specific Features**:

```typescript
// Problem: only(field) requires field name
// Signal Forms doesn't support selective validation

// Workaround: Run full suite but filter errors
function vestValidation<TModel>(
  path: FieldPath<TModel>,
  vestSuite: VestSuite<TModel>,
  options?: { selective?: boolean },
): void {
  validate(path, ({ value }) => {
    const fieldName = getFieldName(path); // Extract field name
    const result = options?.selective
      ? vestSuite(value() as TModel, fieldName) // Vest's only(field)
      : vestSuite(value() as TModel);

    // ... convert errors
  });
}
```

### Challenges

| Challenge                 | Impact                                                  | Mitigation                    |
| ------------------------- | ------------------------------------------------------- | ----------------------------- |
| **Error Format Mismatch** | `string[]` vs `FormError[]`                             | Convert in adapter            |
| **Selective Validation**  | `only(field)` not supported                             | Run full suite, filter errors |
| **Warning Support**       | Signal Forms has no warnings                            | Map to errors with kind       |
| **Touched State**         | Vest uses `isTested()`, Signal Forms uses `touched()`   | Separate tracking             |
| **Enhanced API Lost**     | Signal Forms uses `[control]`                           | No proxy shortcuts            |
| **AbortSignal**           | Vest uses manual signal, Signal Forms uses HttpResource | Bridge in adapter             |

### Value Proposition Analysis

#### Pros

- ✅ Vest.js validation with Angular Signal Forms field structure
- ✅ Use `[control]` directive (less template code)
- ✅ Reuse Vest suites from ngx-vest-forms v2
- ✅ Future-proof with Angular's direction

#### Cons

- ❌ **Loses Enhanced Proxy API** (form.email() → form.email().value())
- ❌ **Loses Selective Validation** (only(field) not supported)
- ❌ **Loses Error Strategies** (Signal Forms has no built-in strategies)
- ❌ **Complex Integration** (impedance mismatch)
- ❌ **Signal Forms Still Prototype** (APIs may change)
- ❌ **Maintenance Burden** (two API surfaces)

### Recommendation: **Not Worth It** ❌

**Rationale:**

1. **Loses Key Advantages**: Enhanced Proxy API, selective validation, error strategies
2. **Signal Forms Still Experimental**: APIs may change (maintenance risk)
3. **ngx-vest-forms Already Signal-Native**: No migration needed
4. **Complexity > Value**: Integration challenges outweigh benefits
5. **Better Alternative**: Wait for Signal Forms stable release, then evaluate

### Alternative: Vest.js v6 + Standard Schema

**Better Strategy:**

1. Add **Standard Schema adapter** to ngx-vest-forms (type validation)
2. Keep **Vest.js** for form validation (business rules)
3. **Wait** for Angular Signal Forms stable release
4. **Re-evaluate** integration when APIs are finalized

```typescript
// Better approach: Standard Schema + Vest
import { fromZod } from 'ngx-vest-forms/schemas';
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const form = createVestForm(userSuite, signal({ email: '', password: '' }), {
  schema: fromZod(userSchema), // Type validation (structure)
  // Vest suite handles business validation
});

// Schema errors + Vest errors merged
// Best of both worlds!
```

---

## Conclusion

### Key Findings

1. **API Alignment Status**: ✅ **Already aligned** on core principles (signals, reactivity, developer-owned model)

2. **Intentional Differences**: ⚠️ **Different by design**, not incompatible:
   - **Field Access**: Proxy shortcuts (ngx-vest-forms) vs function-based (Signal Forms)
   - **Validation**: Vest.js suites (portable) vs Angular schemas (native)
   - **Template Binding**: Explicit (better for Vest) vs `[control]` (better for Angular)

3. **Should We Align?**: ❌ **No** - Current APIs better serve Vest.js integration

4. **ngx-vest-forms/signals**: ❌ **Not recommended** - Loses key advantages, Signal Forms still prototype

### Strategic Recommendations

#### ✅ DO These Things:

1. **Keep Enhanced Proxy API** - Unique value proposition, superior DX
2. **Keep Explicit Binding** - Works better with `only(field)` selective validation
3. **Add Standard Schema Support** - Complement Vest.js with type validation
4. **Maintain Vest.js Focus** - Framework-agnostic validation (React, Vue, Node.js)
5. **Monitor Signal Forms Progress** - Re-evaluate when stable

#### ❌ DON'T Do These Things:

1. **Don't Adopt Signal Forms Field Pattern** - Breaks Enhanced Proxy API
2. **Don't Create /signals Package** - Too early, loses advantages
3. **Don't Abandon Vest.js** - Core value proposition
4. **Don't Copy Angular APIs Blindly** - Intentional differences serve purpose
5. **Don't Chase Compatibility** - Already aligned on principles

### Final Verdict

**ngx-vest-forms v2 is NOT incompatible with Angular Signal Forms** - it's **intentionally different** to serve Vest.js validation better. Both approaches are **philosophically aligned** on signal-based reactivity. The differences are **strengths, not weaknesses**.

**Focus on:** Standard Schema integration (type validation) + maintain Vest.js excellence (business validation) = **best of both worlds**! 🎯
