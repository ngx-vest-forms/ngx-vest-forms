# ngx-vest-forms: Standard Schema Integration Strategy

**Date:** October 7, 2025
**Version:** 2.x (feat/v2-inverted-vest-forms branch)
**Status:** Strategic Enhancement Plan

## Executive Summary

This document outlines the strategy for integrating **Standard Schema** (standardschema.dev) into **ngx-vest-forms v2** to provide a **dual-layer validation approach**:

1. **Standard Schema** → Type/Structure Validation (parse layer)
2. **Vest.js** → Business Logic Validation (form layer)

**Key Finding:** Standard Schema and Vest.js are **complementary, not competitive**. Standard Schema validates data structure (API boundaries), Vest.js validates business rules (user input). Together they provide comprehensive validation.

### TL;DR Recommendations

✅ **Add Standard Schema Adapter** - Optional type validation layer (Zod, Valibot, ArkType)
✅ **Keep Vest.js Primary** - Business logic validation (form-specific rules)
✅ **Merge Errors** - Schema errors first, then Vest errors (clear hierarchy)
✅ **Wait for Vest v6** - Export Vest suites as Standard Schema (tRPC, TanStack compatibility)

---

## Table of Contents

- [Standard Schema Overview](#standard-schema-overview)
- [Why Standard Schema + Vest.js?](#why-standard-schema--vestjs)
- [Integration Strategy](#integration-strategy)
- [Implementation Roadmap](#implementation-roadmap)

---

## Current Architecture Analysis

### What ngx-vest-forms v2 Already Does Right ✅

#### 1. Developer-Owned Signal Model (100% Aligned)

```typescript
// ngx-vest-forms v2 (CURRENT - Already correct!)
const model = signal({ email: '', password: '' });
const form = createVestForm(userSuite, model);

// Angular Signal Forms (prototype)
const model = signal({ email: '', password: '' });
const f = form(model, (path) => {
  /* validation */
});
```

**Status:** ✅ **Perfect alignment** - Both use developer-owned `signal()` as single source of truth

#### 2. Modern Angular APIs (100% Aligned)

**Current Implementation:**

- ✅ Uses `input()` for directive inputs (not `@Input()` decorators)
- ✅ Uses `output()` for directive outputs (not `@Output()` decorators)
- ✅ Uses `inject()` for DI (not constructor injection)
- ✅ Uses `viewChild()` for view queries (not `@ViewChild()` decorators)
- ✅ Standalone components/directives (no NgModules)
- ✅ `OnPush` change detection by default
- ✅ Signal-based reactivity throughout

**Example from ngx-vest-form.directive.ts:**

```typescript
@Directive({
  selector: 'form[ngxVestForm]',
  hostDirectives: [
    /* ... */
  ],
})
export class NgxVestFormDirective {
  // ✅ Uses input() - Angular 20+ recommended API
  readonly ngxVestForm = input.required<VestForm<Record<string, unknown>>>();
}
```

**Status:** ✅ **Fully modernized** - Already using Angular 20+ best practices

#### 3. Bidirectional Model-Form Sync (100% Aligned)

```typescript
// Model changes update form ✅
model.set({ email: 'new@email.com' }); // Form automatically reflects change

// Form changes update model ✅
form.setEmail('user@example.com'); // Model automatically updates
```

**Status:** ✅ **Perfect alignment** - No framework-internal state duplication

#### 4. Signal-First Reactivity (100% Aligned)

```typescript
// All derived state is computed signals
const canSubmit = computed(() => form.valid() && !form.pending());
const hasErrors = computed(() => Object.keys(form.errors()).length > 0);

// Template signals (no observables needed)
<button [disabled]="form.pending()">Submit</button>
```

**Status:** ✅ **Perfect alignment** - Pure signal-based reactivity

#### 5. Zoneless & OnPush Ready (100% Aligned)

- ✅ No ZoneJS dependency
- ✅ Signal-based change detection
- ✅ `ChangeDetectionStrategy.OnPush` default in examples
- ✅ Fine-grained reactivity

**Status:** ✅ **Perfect alignment** - Ready for Angular's zoneless future

### What Makes ngx-vest-forms Different (Unique Value) 🎯

#### 1. Enhanced Field Signals API (Proxy-based accessors)

```typescript
// ngx-vest-forms v2 - Ergonomic proxy-based API
form.email(); // Signal<string>
form.emailValid(); // Signal<boolean>
form.emailErrors(); // Signal<string[]>
form.emailTouched(); // Signal<boolean>
form.setEmail(value); // Setter
form.touchEmail(); // Mark touched

// Angular Signal Forms - Path-based Field API
const emailField: Field<string> = f.email;
emailField().value(); // Current value
emailField().valid(); // Validity
emailField().errors(); // Errors array
```

**Why it matters:**

- ✅ More ergonomic developer experience (fewer characters to type)
- ✅ Better IDE autocomplete (proxy generates accessors dynamically)
- ✅ Nested paths work seamlessly: `form.userProfileEmail()` vs `f.user.profile.email`

**Status:** ✅ **Keep as differentiator** - Not in Signal Forms, unique selling point

#### 2. Vest.js Validation Engine (Framework-agnostic)

```typescript
// ngx-vest-forms v2 - Vest.js suite (reusable across frameworks)
export const userSuite = staticSafeSuite<UserModel>((data) => {
  test('email', 'Required', () => enforce(data.email).isNotEmpty());
  test('email', 'Invalid format', () => enforce(data.email).isEmail());

  // Cross-field validation
  include('confirmPassword').when('password');
  test('confirmPassword', 'Must match', () => {
    enforce(data.confirmPassword).equals(data.password);
  });

  // Async validation with smart caching
  skipWhen(
    (res) => res.hasErrors('email'),
    () => {
      test.memo(
        'email',
        'Email taken',
        async ({ signal }) => {
          await checkEmailAvailability(data.email, { signal });
        },
        [data.email],
      );
    },
  );
});

// Can be used in: Angular, React, Vue, Node.js, Svelte, etc.
```

**Why it matters:**

- ✅ Framework-agnostic validation (portable across projects)
- ✅ Rich ecosystem: Zod, Valibot, ArkType adapters
- ✅ Advanced features: `test.memo()` caching, `skipWhen()`, `include().when()`
- ✅ Declarative cross-field validation
- ✅ Built-in async validation with AbortSignal

**Status:** ✅ **Keep as core value** - Angular Forms can't match this portability

#### 3. Error Display Strategies (WCAG-focused)

```typescript
// ngx-vest-forms v2 - Accessibility-first error strategies
const form = createVestForm(suite, model, {
  errorStrategy: 'on-touch', // immediate | on-touch | on-submit | manual
});

// Automatic ARIA live regions (via NgxFormErrorComponent)
// - Errors: role="alert" + aria-live="assertive" (blocking)
// - Warnings: role="status" + aria-live="polite" (non-blocking)
```

**Why it matters:**

- ✅ WCAG 2.2 compliant error display out-of-the-box
- ✅ Separates blocking errors from non-blocking warnings
- ✅ Progressive error disclosure (show errors after touch/blur)

**Status:** ✅ **Keep as differentiator** - Signal Forms doesn't have this

---

## Angular Signal Forms Compatibility

### Angular Signal Forms Architecture (Prototype)

Based on the official documentation from the Angular team's prototype, here's how Signal Forms actually works:

#### Core Concepts

**1. Developer-Owned Data Model** ✅

```typescript
// You own the signal, Signal Forms just uses it
const userModel = signal({ username: '', name: '' });
const userForm = form(userModel, schemaFn);
```

**2. Field Tree Navigation**

```typescript
// Field structure mirrors data structure
interface Order {
  orderId: string;
  items: Array<{ description: string; quantity: number }>;
}

const orderForm: Field<Order> = form(orderModel);
orderForm.items[0].quantity; // Field<number>
```

**3. FieldState Access**

```typescript
// Call Field as function to get FieldState
const emailField: Field<string> = userForm.username;
const emailState: FieldState<string> = emailField();

// FieldState properties
emailState.value(); // WritableSignal<string>
emailState.valid(); // Signal<boolean>
emailState.errors(); // Signal<FormError[]>
emailState.disabled(); // Signal<boolean>
emailState.touched(); // Signal<boolean>
```

**4. Schema-Based Logic**

```typescript
const userSchema = schema<User>((path: FieldPath<User>) => {
  // Static definition, reactive execution
  required(path.username);
  validate(path.email, ({ value }) => {
    return /\w+@\w+\.\w+/.test(value()) ? [] : [{ kind: 'invalid-email' }];
  });

  // Cross-field validation
  validate(path.confirm, ({ value, valueOf }) => {
    return value() === valueOf(path.password) ? [] : [{ kind: 'no-match' }];
  });
});
```

**5. UI Binding with [control] Directive**

```typescript
<input [control]="userForm.username" />
// Handles: value sync, disabled state, touched state, validation
```

### What the Documentation Got Wrong ❌

The INTEGRATION_FEASIBILITY_ANALYSIS.md document contains **outdated/incorrect** information:

#### Myth #1: "ngx-vest-forms needs to adopt input()/output()/model()"

**Reality:** ✅ **Already done!**

- All directives use `input()` for inputs
- Components use `input()` where appropriate
- No `@Input()` or `@Output()` decorators exist in codebase
- Modern Angular APIs adopted since v2 inception

**Evidence:**

```typescript
// From ngx-vest-form.directive.ts (line 86)
readonly ngxVestForm = input.required<VestForm<Record<string, unknown>>>();
```

#### Myth #2: "Need to align template binding with [control] directive"

**Reality:** ✅ **Current approach is better for Vest.js!**

```typescript
// ngx-vest-forms v2 (CURRENT - Works perfectly with Vest)
<input [value]="form.email()" (input)="form.setEmail($event)" />

// Angular Signal Forms (prototype)
<input [control]="userForm.email" />
```

**Why current approach is superior for ngx-vest-forms:**

- ✅ Works with Vest's `only(field)` selective validation (Angular schemas don't have this)
- ✅ Explicit control flow (easier to debug)
- ✅ No dependency on Angular Forms package (lighter bundle)
- ✅ Compatible with any UI framework (Vest.js is framework-agnostic)
- ✅ Fine-grained control over when validation runs

**Why `[control]` makes sense for Angular Signal Forms:**

- ✅ Automatic two-way binding (value + disabled + touched)
- ✅ Integrated with Angular Forms ecosystem
- ✅ Works with ControlValueAccessor (Angular Material, etc.)
- ✅ Less boilerplate for pure Angular apps

**Status:** ✅ **Keep current approach** - Both patterns are valid for their respective use cases

#### Myth #3: "Compatibility is only 40%"

**Reality:** ✅ **Signal principles: 100% aligned, implementation: intentionally different**

**Shared Principles (100% aligned):**

- ✅ Developer-owned signal model (no framework-internal state)
- ✅ Bidirectional sync (model ↔ form automatic)
- ✅ Signal-first reactivity (computed derived state)
- ✅ Zoneless + OnPush ready
- ✅ Field tree mirrors data structure

**Intentional Differences (by design, not lack of compatibility):**

- **Validation engine**: Vest.js (framework-agnostic, portable) vs Angular schemas (Angular-only)
- **Template binding**: Explicit `[value]`/`(input)` vs `[control]` directive
- **Field access**: Proxy-based (`form.emailValid()`) vs Function-based (`form.email().valid()`)
- **Error format**: Simple `string[]` (WCAG-friendly) vs `{ kind, message }[]` (structured)
- **Logic definition**: Vest suite (external file) vs Schema function (inline or external)
- **Async validation**: Vest `test.memo()` + AbortSignal vs `validateHttp()` + HttpResource
- **Cross-field**: Vest `include().when()` vs Schema `valueOf()` helper

**Correct assessment:** ngx-vest-forms is **philosophically aligned** with Signal Forms while maintaining **intentional architectural differences** for Vest.js integration.

### Actual Compatibility Matrix

| Aspect                | ngx-vest-forms v2                            | Angular Signal Forms                            | Alignment                  |
| --------------------- | -------------------------------------------- | ----------------------------------------------- | -------------------------- |
| **Core Philosophy**   | ✅                                           | ✅                                              | 100%                       |
| State Management      | Developer-owned `signal()`                   | Developer-owned `signal()`                      | ✅ Identical               |
| Reactivity            | Signal-based                                 | Signal-based                                    | ✅ Identical               |
| Bidirectional Sync    | Automatic                                    | Automatic                                       | ✅ Identical               |
| Field Tree Structure  | Proxy-based navigation                       | Property-based navigation                       | ✅ Same concept            |
| Zoneless Support      | ✅                                           | ✅                                              | ✅ Identical               |
| OnPush Strategy       | ✅ Default                                   | ✅ Works                                        | ✅ Identical               |
| Modern Angular APIs   | `input()`, `output()`, `inject()`            | Same                                            | ✅ Identical               |
| **Field Access**      |                                              |                                                 |                            |
| Value Access          | `form.email()` → `Signal<string>`            | `form.email().value()` → `Signal<string>`       | ⚠️ Different syntax        |
| Validity Check        | `form.emailValid()` → `Signal<boolean>`      | `form.email().valid()` → `Signal<boolean>`      | ⚠️ Different syntax        |
| Errors                | `form.emailErrors()` → `Signal<string[]>`    | `form.email().errors()` → `Signal<FormError[]>` | ⚠️ Different format        |
| Touched State         | `form.emailTouched()` → `Signal<boolean>`    | `form.email().touched()` → `Signal<boolean>`    | ⚠️ Different syntax        |
| **Validation**        |                                              |                                                 |                            |
| Validation Engine     | Vest.js (external library)                   | Schema functions (built-in)                     | ⚠️ Different (intentional) |
| Validation Definition | Vest suite in `.validations.ts`              | Schema in component or external                 | ⚠️ Different location      |
| Validation Syntax     | `test('email', msg, () => enforce(...))`     | `validate(path.email, ({ value }) => ...)`      | ⚠️ Different syntax        |
| Cross-Field           | `include('confirm').when('password')`        | `validate(path, ({ valueOf }) => ...)`          | ⚠️ Different approach      |
| Async Validation      | `test.memo()` with AbortSignal               | `validateHttp()` with HttpResource              | ⚠️ Different mechanism     |
| Selective Validation  | `only(field)` runs specific tests            | All schema rules always run                     | ⚠️ Vest advantage          |
| Conditional Logic     | `skipWhen()`, `omitWhen()`                   | `applyWhen()`, `hidden()`                       | ⚠️ Different approach      |
| **Template Binding**  |                                              |                                                 |                            |
| Binding Strategy      | `[value]`/`(input)` explicit                 | `[control]` directive                           | ⚠️ Different (intentional) |
| Two-Way Sync          | Manual via setters                           | Automatic via directive                         | ⚠️ Different mechanism     |
| Disabled State        | Manual `[disabled]="..."`                    | Auto via `[control]`                            | ⚠️ Different mechanism     |
| Touched State         | Manual `(blur)="touch..."` or auto directive | Auto via `[control]`                            | ⚠️ Different mechanism     |
| **Implementation**    |                                              |                                                 |                            |
| Bundle Size           | Small (Vest ~5KB + directives)               | Medium (Angular Forms signals)                  | ✅ Both small              |
| Framework Dependency  | Zero (Vest is pure JS)                       | Angular only                                    | ⚠️ Vest advantage          |
| Ecosystem             | Vest + Zod/Valibot adapters                  | Angular Forms validators                        | ⚠️ Different ecosystems    |
| Learning Curve        | Learn Vest.js (external)                     | Learn Signal Forms (Angular native)             | ⚠️ Trade-off               |
| Migration from v1     | Vest suite migration (straightforward)       | Full rewrite (class → signal)                   | N/A                        |
| Portability           | Vest suites work in React, Vue, Node.js      | Angular-only                                    | ⚠️ Vest advantage          |

**Verdict:** ✅ **100% aligned on signal philosophy, intentionally different on implementation** (not incompatible!)

### Key Architectural Insights

#### What They Share (100% Compatible)

1. **Developer-Owned Model Signal**
   - Both: You create the signal, framework uses it as source of truth
   - Both: Model changes → form updates automatically
   - Both: Form changes → model updates automatically
   - Both: No framework-internal state duplication

2. **Signal-First Reactivity**
   - Both: All derived state is computed signals
   - Both: Field state reactive to model changes
   - Both: Validation reactive to value changes
   - Both: Zoneless and OnPush compatible

3. **Field Tree Mirrors Data**
   - Both: Navigate fields like you navigate data
   - ngx-vest-forms: `form.userProfileEmail()` (proxy flattens path)
   - Angular: `form.user.profile.email` (explicit tree navigation)

#### What Makes Them Different (Intentional Design Choices)

1. **Validation Philosophy**

   **Vest.js (ngx-vest-forms):**
   - ✅ Framework-agnostic (works in React, Vue, Node.js)
   - ✅ Validation suite in separate file (reusable)
   - ✅ Selective validation via `only(field)` (performance optimization)
   - ✅ Rich async features: `test.memo()` caching, AbortSignal, `skipWhen()`
   - ✅ Declarative cross-field: `include().when()`
   - ✅ Can be used for API validation, not just forms

   **Angular Schemas (Signal Forms):**
   - ✅ Angular-native (no external library)
   - ✅ Schema function co-located with component or external
   - ✅ All validation rules always run (simpler mental model)
   - ✅ Built-in `validateHttp()` with HttpResource
   - ✅ Cross-field via `valueOf()` helper function
   - ✅ Designed specifically for forms

2. **Field Access Pattern**

   **ngx-vest-forms Enhanced Proxy API:**

   ```typescript
   // Proxy generates flat accessors (fewer keystrokes)
   form.email(); // Signal<string>
   form.emailValid(); // Signal<boolean>
   form.emailErrors(); // Signal<string[]>
   form.setEmail(value); // Setter
   form.touchEmail(); // Mark touched

   // Nested paths flattened
   form.userProfileEmail(); // user.profile.email
   ```

   **Angular Signal Forms Field/FieldState API:**

   ```typescript
   // Field tree navigation (explicit structure)
   const emailField: Field<string> = form.email;

   // Call field to get state
   emailField().value(); // Signal<string>
   emailField().valid(); // Signal<boolean>
   emailField().errors(); // Signal<FormError[]>

   // Nested paths explicit
   form.user.profile.email().value();
   ```

3. **Template Binding Strategy**

   **ngx-vest-forms Explicit Binding:**

   ```typescript
   // Manual control (works with Vest's selective validation)
   <input
     [value]="form.email()"
     (input)="form.setEmail($event)"
     (blur)="form.touchEmail()"
   />
   ```

   **Angular Signal Forms [control] Directive:**

   ```typescript
   // Automatic two-way binding
   <input [control]="form.email" />
   // Handles: value, disabled, touched, validation
   ```

4. **Error Display**

   **ngx-vest-forms:**
   - Simple `string[]` for accessibility
   - WCAG-focused strategies: `on-touch`, `on-submit`, `immediate`, `manual`
   - Separates errors from warnings (ARIA live regions)

   **Angular Signal Forms:**
   - Structured `{ kind: string, message?: string }[]`
   - No built-in error display strategy
   - Developer implements their own error display logic

### Why Both Approaches Are Valid

**Use ngx-vest-forms when:**

- ✅ Need framework-agnostic validation (share between Angular/React/Node.js)
- ✅ Want Vest.js ecosystem (Zod, Valibot adapters)
- ✅ Need selective validation (`only(field)` performance)
- ✅ Prefer explicit template binding (easier debugging)
- ✅ Want WCAG-focused error strategies out-of-the-box
- ✅ Building forms with complex async validation
- ✅ Need validation for non-form use cases (API validation)

**Use Angular Signal Forms when:**

- ✅ Pure Angular application (no cross-framework needs)
- ✅ Prefer Angular-native solution (no external library)
- ✅ Want automatic `[control]` directive binding
- ✅ Like co-located validation schemas
- ✅ Prefer Angular's validation ecosystem
- ✅ Building simple to medium complexity forms
- ✅ Want tighter Angular Forms integration (Material, etc.)

**Both are excellent choices!** The "compatibility" isn't about one being better—it's about serving different use cases and developer preferences.

---

## Standard Schema Integration

### What is Standard Schema?

**Standard Schema** (standardschema.dev) is a universal validation interface designed by the creators of Zod, Valibot, and ArkType. It provides a **common contract** for schema validation libraries to implement.

**Key Characteristics:**

- 🎯 **Single Interface:** `StandardSchemaV1<Input, Output>`
- 🎯 **Library Agnostic:** Zod, Valibot, ArkType, Effect Schema, Yup, etc.
- 🎯 **Type Inference:** Extract types via `InferInput<Schema>`, `InferOutput<Schema>`
- 🎯 **Runtime Validation:** `validate(value)` returns `SuccessResult | FailureResult`
- 🎯 **Minimal:** Tilde-prefixed `~standard` property avoids API conflicts
- 🎯 **Ecosystem:** tRPC, TanStack Form/Router, Hono, React Hook Form, etc.

### Standard Schema Interface

```typescript
export interface StandardSchemaV1<Input = unknown, Output = Input> {
  readonly '~standard': {
    readonly version: 1;
    readonly vendor: string; // 'zod' | 'valibot' | 'arktype' | etc.
    readonly validate: (
      value: unknown,
    ) => Result<Output> | Promise<Result<Output>>;
    readonly types?: { input: Input; output: Output };
  };
}

export type Result<Output> =
  | { value: Output; issues?: undefined } // Success
  | { issues: Issue[]; value?: undefined }; // Failure

export interface Issue {
  message: string;
  path?: (PropertyKey | PathSegment)[];
}
```

### Vest.js v6 + Standard Schema

**Upcoming:** Vest.js v6 will implement Standard Schema interface 🎉

```typescript
// Future: Vest.js v6 with Standard Schema support
import { create } from 'vest';

const userSchema = create<{ email: string }>((data) => {
  test('email', 'Required', () => enforce(data.email).isNotEmpty());
});

// Standard Schema validation
const result = userSchema['~standard'].validate({ email: 'test@example.com' });
if (result.issues) {
  console.log('Validation failed:', result.issues);
} else {
  console.log('Valid data:', result.value);
}

// Type inference
type Input = StandardSchemaV1.InferInput<typeof userSchema>;
type Output = StandardSchemaV1.InferOutput<typeof userSchema>;
```

**Impact on ngx-vest-forms:**

- ✅ Vest suites will be Standard Schema compatible
- ✅ Can be used with tRPC, TanStack, React Hook Form, etc.
- ✅ Type inference standardized across ecosystem
- ✅ Interop with Zod, Valibot, ArkType validators

### Type Validation vs Form Validation (Critical Distinction)

**Standard Schema is for TYPE VALIDATION (data structure):**

```typescript
// Type validation: Is this a valid user object?
const userSchema = z.object({
  email: z.string().email(),
  age: z.number().min(18),
});

// Validates structure, types, basic constraints
const result = userSchema.safeParse(data);
```

**Vest.js is for FORM VALIDATION (business logic):**

```typescript
// Form validation: Can this user submit this form?
const userSuite = staticSafeSuite<User>((data) => {
  // Business rules
  test('email', 'Email already registered', async () => {
    await checkEmailAvailability(data.email);
  });

  // Cross-field logic
  include('confirmEmail').when('email');
  test('confirmEmail', 'Emails must match', () => {
    enforce(data.confirmEmail).equals(data.email);
  });

  // Conditional requirements
  skipWhen(!data.isCompany, () => {
    test('vatNumber', 'VAT required for companies', () => {
      enforce(data.vatNumber).isNotEmpty();
    });
  });
});
```

**Key Differences:**

| Aspect          | Type Validation (Standard Schema)        | Form Validation (Vest.js)                    |
| --------------- | ---------------------------------------- | -------------------------------------------- |
| **Purpose**     | Data structure correctness               | Business logic enforcement                   |
| **When**        | API boundaries, parsing, deserialization | User input, form submission                  |
| **Examples**    | "Is email a string?", "Is age a number?" | "Is email available?", "Is user old enough?" |
| **Cross-field** | Limited (dependent schemas)              | Native (`include().when()`)                  |
| **Async**       | Supported but not primary use case       | Primary use case (API checks)                |
| **Selective**   | All or nothing                           | Selective (`only(field)`)                    |
| **Ecosystem**   | Data flow (tRPC, TanStack)               | UI/UX (forms, validation feedback)           |

**Complementary, Not Competitive:**

- Use Standard Schema for **parsing/type-checking** API responses
- Use Vest.js for **validating/enforcing** business rules in forms
- Both can coexist in the same application!

---

## Compatibility Enhancements

### Enhancement 1: Standard Schema Adapter (Type Validation Layer)

**Goal:** Enable ngx-vest-forms to accept Standard Schema validators for **runtime type checking** while keeping Vest.js for **business logic validation**.

#### Use Case

```typescript
// 1. Define data structure with Zod (type validation)
const UserStructure = z.object({
  email: z.string().email(),
  age: z.number().min(0).max(150),
  role: z.enum(['user', 'admin']),
});

// 2. Define business rules with Vest (form validation)
const userSuite = staticSafeSuite<z.infer<typeof UserStructure>>((data) => {
  test('email', 'Email already taken', async ({ signal }) => {
    await checkEmailAvailability(data.email, { signal });
  });

  test('age', 'Must be 18+ for admin role', () => {
    skipWhen(data.role !== 'admin', () => {
      enforce(data.age).greaterThanOrEquals(18);
    });
  });
});

// 3. Create form with BOTH validations
const form = createVestForm(userSuite, signal({}), {
  schema: UserStructure, // ✅ Type validation (parse)
  // Vest suite handles business logic validation
});

// 4. Usage
form.setEmail('invalid');
// Schema error: "Invalid email format" (immediate - structure)

form.setEmail('test@example.com');
// Schema passes, Vest runs: "Email already taken" (async - business logic)
```

#### Implementation Strategy

```typescript
// core/src/lib/schema-adapter.ts

import type { StandardSchemaV1 } from '@standard-schema/spec';

/**
 * Standard Schema adapter for runtime type validation
 */
export interface SchemaAdapter<TModel> {
  /** Validate data structure against schema */
  validate(data: unknown): SchemaValidationResult<TModel>;

  /** Get the underlying Standard Schema instance */
  getSchema(): StandardSchemaV1<TModel>;

  /** Extract TypeScript types */
  types?: {
    input: unknown;
    output: TModel;
  };
}

export interface SchemaValidationResult<TModel> {
  success: boolean;
  data?: TModel;
  errors?: SchemaValidationError[];
}

export interface SchemaValidationError {
  path: string[];
  message: string;
  kind?: string; // 'required' | 'invalid_type' | 'custom'
}

/**
 * Create a Standard Schema adapter from any spec-compliant schema
 */
export function createStandardSchemaAdapter<TModel>(
  schema: StandardSchemaV1<unknown, TModel>,
): SchemaAdapter<TModel> {
  return {
    validate(data: unknown): SchemaValidationResult<TModel> {
      const result = schema['~standard'].validate(data);

      // Handle Promise (async validation)
      if (result instanceof Promise) {
        throw new Error(
          'Async schema validation not supported. Use Vest.js for async validation.',
        );
      }

      // Success case
      if (!result.issues) {
        return {
          success: true,
          data: result.value,
        };
      }

      // Failure case
      return {
        success: false,
        errors: result.issues.map((issue) => ({
          path:
            (issue.path?.map((p) =>
              typeof p === 'object' && 'key' in p ? p.key : p,
            ) as string[]) ?? [],
          message: issue.message,
        })),
      };
    },

    getSchema() {
      return schema;
    },

    types: schema['~standard'].types,
  };
}

/**
 * Convenience adapters for popular libraries
 */

// Zod adapter
export function fromZod<T>(schema: z.ZodType<T>): SchemaAdapter<T> {
  // Zod 3.24.0+ implements Standard Schema
  return createStandardSchemaAdapter(schema as StandardSchemaV1<unknown, T>);
}

// Valibot adapter
export function fromValibot<T>(
  schema: v.BaseSchema<unknown, T>,
): SchemaAdapter<T> {
  // Valibot v1.0+ implements Standard Schema
  return createStandardSchemaAdapter(schema as StandardSchemaV1<unknown, T>);
}

// ArkType adapter
export function fromArkType<T>(schema: type<T>): SchemaAdapter<T> {
  // ArkType v2.0+ implements Standard Schema
  return createStandardSchemaAdapter(schema as StandardSchemaV1<unknown, T>);
}
```

#### Integration with createVestForm

```typescript
// core/src/lib/create-vest-form.ts

export function createVestForm<TModel extends Record<string, unknown>>(
  suite: VestSuite<TModel>,
  initialModel: TModel | WritableSignal<TModel>,
  options: VestFormOptions = {},
): EnhancedVestForm<TModel> {
  // ... existing setup ...

  const { schema } = options;

  // Field setter with schema validation
  const set = <P extends Path<TModel>>(
    path: P,
    value: PathValue<TModel, P> | Event | InputEvent,
  ) => {
    const newValue = createFieldSetter(path, value);

    // 1. Schema validation (type checking - synchronous)
    if (schema) {
      const partialData = { ...model(), [path]: newValue };
      const schemaResult = schema.validate(partialData);

      if (!schemaResult.success) {
        // Store schema errors separately (don't block Vest)
        schemaErrors.update((errors) => ({
          ...errors,
          [path]: schemaResult.errors?.map((e) => e.message) ?? [],
        }));
        // Still update the model (allow user to type)
        const updatedModel = setValueByPath(model(), path, newValue);
        model.set(updatedModel);
        return; // Skip Vest validation if schema fails
      } else {
        // Clear schema errors for this field
        schemaErrors.update((errors) => {
          const next = { ...errors };
          delete next[path];
          return next;
        });
      }
    }

    // 2. Update model
    const updatedModel = setValueByPath(model(), path, newValue);
    model.set(updatedModel);

    // 3. Vest validation (business logic)
    const asyncRunToken = Symbol();
    lastAsyncRunToken = asyncRunToken;
    const result = suite(updatedModel, path);

    // ... existing async handling ...
  };

  // Merge schema errors with Vest errors
  const schemaErrors = signal<Record<string, string[]>>({});

  const allErrors = computed(() => {
    const vestErrors = errors();
    const typeErrors = schemaErrors();

    // Merge: schema errors take precedence (shown first)
    const merged: Record<string, string[]> = { ...vestErrors };
    Object.entries(typeErrors).forEach(([field, msgs]) => {
      merged[field] = [...msgs, ...(merged[field] ?? [])];
    });
    return merged;
  });

  // ... rest of implementation ...
}
```

#### Benefits of This Approach

✅ **Separation of Concerns:**

- Standard Schema: Type structure validation (parse layer)
- Vest.js: Business logic validation (domain layer)

✅ **Best of Both Worlds:**

- Immediate type errors (before async Vest runs)
- Rich business validation (cross-field, async, conditional)

✅ **Ecosystem Interop:**

- Use Zod schemas in both tRPC and ngx-vest-forms
- Share validation logic between frontend and backend

✅ **Type Safety:**

- `z.infer<typeof schema>` gives you TypeScript types
- Vest suite uses same types for validation

✅ **No Breaking Changes:**

- Schema is optional (existing code unaffected)
- Vest.js remains primary validation engine

### Enhancement 2: Vest.js v6 Standard Schema Export (Future)

**When Vest v6 adds Standard Schema support**, expose it:

````typescript
// core/src/lib/vest-to-standard-schema.ts

import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { VestSuite } from './vest-form.types';

/**
 * Get the Standard Schema interface from a Vest suite (Vest v6+)
 *
 * @example
 * ```typescript
 * const vestSuite = staticSafeSuite<User>((data) => {
 *   test('email', 'Required', () => enforce(data.email).isNotEmpty());
 * });
 *
 * // Use with tRPC
 * const schema = getStandardSchema(vestSuite);
 * const router = t.router({
 *   createUser: t.procedure
 *     .input(schema)
 *     .mutation(({ input }) => {
 *       // input is typed as User
 *     }),
 * });
 * ```
 */
export function getStandardSchema<TModel>(
  suite: VestSuite<TModel>,
): StandardSchemaV1<TModel, TModel> {
  // Vest v6+ will add '~standard' property
  if ('~standard' in suite) {
    return suite as unknown as StandardSchemaV1<TModel, TModel>;
  }

  throw new Error(
    'Vest suite does not implement Standard Schema. ' +
      'Upgrade to Vest v6+ or use a Standard Schema adapter.',
  );
}

/**
 * Check if a Vest suite implements Standard Schema
 */
export function isStandardSchema<TModel>(
  suite: VestSuite<TModel>,
): suite is VestSuite<TModel> & StandardSchemaV1<TModel, TModel> {
  return '~standard' in suite;
}
````

**Use Case:**

```typescript
// Share Vest suite with tRPC backend
export const userSuite = staticSafeSuite<UserInput>((data) => {
  test('email', 'Invalid email', () => enforce(data.email).isEmail());
});

// Frontend: ngx-vest-forms
const form = createVestForm(userSuite, signal({}));

// Backend: tRPC
const schema = getStandardSchema(userSuite);
const router = t.router({
  createUser: t.procedure
    .input(schema) // ✅ Same validation on backend!
    .mutation(async ({ input }) => {
      return db.users.create(input);
    }),
});
```

### Enhancement 3: Improved Field Access Pattern (Optional)

**Current:** Proxy-based field accessors (already excellent)

```typescript
form.email(); // Value
form.emailValid(); // Validity
form.emailErrors(); // Errors
form.setEmail(value); // Setter
```

**Optional Enhancement:** Support Angular Signal Forms-style path access for users who prefer it:

```typescript
// Add to EnhancedVestForm type
export interface EnhancedVestForm<TModel> extends VestForm<TModel> {
  // ... existing proxy accessors ...

  /**
   * Get a Field object for Angular Signal Forms-compatible access
   * @experimental
   */
  getField<P extends Path<TModel>>(path: P): VestField<PathValue<TModel, P>>;
}

// Implementation
function getField<P extends Path<TModel>>(
  path: P,
): VestField<PathValue<TModel, P>> {
  return {
    // Signal Forms-compatible API
    value: field(path),
    valid: () => computed(() => !suiteResult().hasErrors(path))(),
    errors: () => computed(() => suiteResult().getErrors(path))(),
    touched: () => computed(() => suiteResult().isTested(path))(),
    pending: () => computed(() => suiteResult().isPending())(),

    // Setters
    set: (value: PathValue<TModel, P>) => set(path, value),
    touch: () => touch(path),
    reset: () => reset(path),
  };
}

// Usage (opt-in for users who prefer Signal Forms style)
const emailField = form.getField('email');
emailField.value(); // Signal<string>
emailField.valid(); // boolean
emailField.errors(); // string[]
emailField.set('new@email.com');
```

**Status:** ⚠️ **Optional enhancement** - Don't force this, proxy API is superior

---

## Implementation Roadmap

### Phase 1: Standard Schema Adapter (2-3 weeks)

**Goal:** Add optional Standard Schema support for type validation

**Tasks:**

1. ✅ Add `@standard-schema/spec` as optional peer dependency
2. ✅ Implement `createStandardSchemaAdapter()` function
3. ✅ Add convenience adapters (`fromZod`, `fromValibot`, `fromArkType`)
4. ✅ Integrate schema validation into `createVestForm` field setters
5. ✅ Merge schema errors with Vest errors (schema errors first)
6. ✅ Add tests for schema + Vest validation combinations
7. ✅ Document type validation vs form validation distinction
8. ✅ Update examples to show Zod + Vest usage

**Deliverable:**

```typescript
const form = createVestForm(vestSuite, model, {
  schema: fromZod(zodSchema), // Optional type validation
});
```

### Phase 2: Documentation & Migration (1 week)

**Goal:** Correct misinformation in existing docs and add Standard Schema guides

**Tasks:**

1. ✅ Update INTEGRATION_FEASIBILITY_ANALYSIS.md
   - Correct "not using input()" myth
   - Correct "40% compatible" assessment
   - Add Standard Schema section
2. ✅ Create new guide: "Type Validation vs Form Validation"
3. ✅ Create new example: "Zod + Vest.js Integration"
4. ✅ Add Standard Schema to package documentation
5. ✅ Blog post: "ngx-vest-forms + Standard Schema: Best of Both Worlds"

### Phase 3: Vest.js v6 Integration (When Available)

**Goal:** Expose Vest's Standard Schema interface when v6 is released

**Tasks:**

1. ✅ Monitor Vest.js v6 release (check for `~standard` property)
2. ✅ Implement `getStandardSchema()` utility
3. ✅ Add `isStandardSchema()` type guard
4. ✅ Update tRPC integration examples
5. ✅ Test interop with TanStack Form, React Hook Form
6. ✅ Document Vest suite sharing between frontend/backend

**Deliverable:**

```typescript
// Share validation between Angular and tRPC
const schema = getStandardSchema(vestSuite);
```

### Phase 4: Optional Enhancements (Future/As Needed)

**Goal:** Add Signal Forms-style field access pattern (opt-in)

**Tasks:**

1. ✅ Implement `getField(path)` method
2. ✅ Add VestField interface with Signal Forms-compatible API
3. ✅ Document when to use proxy vs field access
4. ✅ Add performance comparison

**Status:** ⚠️ **Low priority** - Proxy API is already excellent

---

## Strategic Recommendations

### ✅ DO These Things

1. **Adopt Standard Schema for Type Validation**
   - Use Zod/Valibot/ArkType for data structure validation
   - Keep Vest.js for business logic validation
   - Show the ecosystem we're standards-compliant

2. **Maintain Vest.js as Core Validation**
   - Don't replace Vest with Angular schemas
   - Vest's framework-agnostic nature is our USP
   - Cross-field, async, and selective validation are superior

3. **Correct Documentation Myths**
   - Update INTEGRATION_FEASIBILITY_ANALYSIS.md
   - Clarify that ngx-vest-forms is ALREADY modernized
   - Explain intentional differences (not incompatibility)

4. **Embrace Standard Schema Ecosystem**
   - When Vest v6 adds Standard Schema, expose it
   - Show interop with tRPC, TanStack, React Hook Form
   - Position as "universal validation" solution

5. **Keep Enhanced Field Signals API**
   - Proxy-based accessors are unique value
   - More ergonomic than Signal Forms path access
   - Don't dilute for false compatibility

### ❌ DON'T Do These Things

1. **Don't Replace Vest.js with Angular Schemas**
   - Angular schemas are Angular-only (kills portability)
   - Vest.js ecosystem (Zod adapters) would be lost
   - Cross-field validation is inferior

2. **Don't Adopt `[control]` Directive Blindly**
   - Current `[value]`/`(input)` works better with Vest
   - Explicit control flow is clearer
   - No dependency on @angular/forms

3. **Don't Copy Signal Forms API Exactly**
   - We have different (better) field access pattern
   - Error strategies are more WCAG-compliant
   - Intentional differences are features, not bugs

4. **Don't Force Signal Forms Field Access**
   - `form.getField(path)` can be optional utility
   - Proxy API (`form.emailValid()`) is superior UX
   - Don't break existing users for false alignment

5. **Don't Deprecate Enhanced Proxy**
   - It's our unique selling point
   - More ergonomic than Angular's approach
   - Community loves it (based on feedback)

---

## Conclusion

### Current Status: Already Excellent ✅

**ngx-vest-forms v2 is ALREADY:**

- ✅ 100% aligned with Signal Forms **philosophy** (developer-owned signals, reactive state)
- ✅ Using modern Angular APIs (`input()`, `output()`, `inject()`)
- ✅ Zoneless and OnPush ready
- ✅ Implementing best practices (no `@Input()` decorators, standalone components)

**The documentation was WRONG about:**

- ❌ "Need to adopt input()/output()" - Already done!
- ❌ "Only 40% compatible" - 100% philosophy alignment, intentional implementation differences
- ❌ "Need to align with [control] directive" - Current approach is better for Vest.js

### Future Enhancements: Standard Schema Integration 🎯

**What we SHOULD do:**

- ✅ Add Standard Schema adapter for **type validation** (data structure)
- ✅ Keep Vest.js for **form validation** (business logic)
- ✅ Expose Vest's Standard Schema interface when v6 is released
- ✅ Show ecosystem interop (tRPC, TanStack, etc.)

**What we should NOT do:**

- ❌ Replace Vest.js with Angular schemas (kills portability)
- ❌ Blindly copy Signal Forms API (our patterns are better)
- ❌ Deprecate Enhanced Field Signals API (unique value prop)

### Key Insight: Complementary, Not Competitive

**Type Validation (Standard Schema):**

- Purpose: Data structure correctness
- When: API boundaries, parsing, deserialization
- Examples: Zod, Valibot, ArkType

**Form Validation (Vest.js):**

- Purpose: Business logic enforcement
- When: User input, form submission
- Examples: Cross-field rules, async checks, conditional validation

**Both can coexist!** Use Standard Schema for parsing, Vest.js for validation. Best of both worlds! 🎉

---

## FAQ

### Q: Should ngx-vest-forms replace Vest.js with Angular schemas?

**A:** ❌ **No!** Vest.js is framework-agnostic (works in React, Vue, Node.js). Angular schemas are Angular-only. Vest's portability is our unique selling point. Standard Schema gives us type validation without losing Vest's business validation capabilities.

### Q: Is ngx-vest-forms incompatible with Signal Forms?

**A:** ❌ **No!** We're 100% aligned on signal philosophy (developer-owned model, reactive state). The implementation differences are **intentional** (Vest.js validation, proxy API, explicit binding). Compatibility ≠ identical implementation.

### Q: Do we need to adopt the `[control]` directive?

**A:** ❌ **No!** Current `[value]`/`(input)` binding works better with Vest.js selective validation (`only(field)`). The `[control]` directive is designed for Angular's schema system, not Vest suites.

### Q: Should we deprecate Enhanced Field Signals API?

**A:** ❌ **Absolutely not!** The proxy-based API (`form.emailValid()`) is MORE ergonomic than Signal Forms' path-based API (`f.email().valid()`). It's our differentiator, not a compatibility issue.

### Q: What's the relationship between Standard Schema and Vest.js?

**A:** ✅ **Complementary!**

- Standard Schema: Type validation (structure, types)
- Vest.js: Form validation (business logic, cross-field, async)
- Vest v6 will implement Standard Schema (best of both worlds!)

### Q: Can we use Zod with ngx-vest-forms?

**A:** ✅ **Yes! (Phase 1)** Add Zod schema for type validation, use Vest suite for business validation:

```typescript
const form = createVestForm(vestSuite, model, {
  schema: fromZod(zodSchema), // Type checking
  // Vest handles business logic
});
```

### Q: Is ngx-vest-forms already using modern Angular APIs?

**A:** ✅ **Yes!** All directives use `input()`, no `@Input()` decorators exist, using `inject()` for DI, standalone components. The documentation claiming otherwise was incorrect.

---

**Document Version:** 1.0
**Last Updated:** October 7, 2025
**Next Review:** After Vest.js v6 release
