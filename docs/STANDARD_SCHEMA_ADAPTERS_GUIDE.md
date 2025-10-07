# Standard Schema Adapters Guide

**Purpose:** Comprehensive explanation of Standard Schema adapters in ngx-vest-forms - what they do, why they're valuable, and how to use them.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [The Problem: Two Types of Validation](#the-problem-two-types-of-validation)
3. [What Standard Schema Adapters Do](#what-standard-schema-adapters-do)
4. [Key Advantages](#key-advantages)
5. [Dual-Layer Validation Architecture](#dual-layer-validation-architecture)
6. [Concrete Examples](#concrete-examples)
7. [Integration Flow](#integration-flow)
8. [Implementation Details](#implementation-details)
9. [Ecosystem Benefits](#ecosystem-benefits)
10. [FAQ](#faq)

---

## Executive Summary

**TL;DR:** Standard Schema adapters add a **type validation layer** before Vest.js business logic validation, giving you:

- ✅ **Separation of concerns** - Structure validation (Zod) separate from business rules (Vest)
- ✅ **Type safety** - Runtime type checking with compile-time type inference
- ✅ **Ecosystem compatibility** - Use same schemas in tRPC, TanStack, Hono, etc.
- ✅ **Better DX** - Catch structural errors immediately, business errors progressively
- ✅ **Framework portability** - Share type schemas across frontend/backend/services

**What they DON'T do:**

- ❌ Replace Vest.js (Vest is still the validation engine)
- ❌ Change your forms (same Enhanced Proxy API)
- ❌ Break existing code (opt-in via `schema` option)

---

## The Problem: Two Types of Validation

Modern applications need **two distinct types of validation**:

### Type 1: Structure/Type Validation

**Question:** "Is this data the correct shape and type?"

**Examples:**

- Is `email` a string?
- Is `age` a number between 0-150?
- Is `role` one of `['user', 'admin']`?
- Is `address.zipCode` exactly 5 digits?

**Characteristics:**

- ✅ Synchronous (immediate feedback)
- ✅ Pure (no side effects, no API calls)
- ✅ Portable (same logic frontend/backend)
- ✅ Type-safe (derives TypeScript types)

**Best Tool:** Standard Schema libraries (Zod, Valibot, ArkType)

```typescript
// Type validation with Zod
const UserSchema = z.object({
  email: z.string().email(),
  age: z.number().min(18).max(120),
  role: z.enum(['user', 'admin']),
});

// ✅ Validates structure
// ✅ Parses/transforms data
// ✅ Infers TypeScript types
type User = z.infer<typeof UserSchema>;
```

### Type 2: Business Logic Validation

**Question:** "Does this data satisfy business rules and constraints?"

**Examples:**

- Is this email address available (not already registered)?
- Is the user old enough for their selected role?
- Do password and confirmPassword match?
- Is the username appropriate (no profanity)?
- Does the user have permission for this action?

**Characteristics:**

- ⚡ Often asynchronous (API calls, database checks)
- 🔄 Context-dependent (cross-field, conditional)
- 🎯 UI/UX focused (progressive disclosure, touch state)
- 📝 Form-specific (not needed for API responses)

**Best Tool:** Vest.js

```typescript
// Business validation with Vest
const userSuite = staticSafeSuite<User>((data) => {
  // Async: Check email availability
  test('email', 'Email already registered', async ({ signal }) => {
    await checkEmailAvailability(data.email, { signal });
  });

  // Cross-field: Password confirmation
  include('confirmPassword').when('password');
  test('confirmPassword', 'Passwords must match', () => {
    enforce(data.confirmPassword).equals(data.password);
  });

  // Conditional: Age requirement for admin role
  skipWhen(data.role !== 'admin', () => {
    test('age', 'Must be 18+ to be admin', () => {
      enforce(data.age).greaterThanOrEquals(18);
    });
  });
});
```

### The Gap: Current ngx-vest-forms

**Right now, ngx-vest-forms only has Vest.js:**

```typescript
// ❌ Current: Everything in Vest (mixing concerns)
const userSuite = staticSafeSuite<User>((data) => {
  // Type validation in Vest (awkward)
  test('email', 'Must be a string', () => {
    enforce(typeof data.email).equals('string');
  });

  test('email', 'Must be valid email format', () => {
    enforce(data.email).matches(/^[^@]+@[^@]+$/);
  });

  // Business validation in Vest (correct place)
  test('email', 'Email already taken', async () => {
    await checkEmailAvailability(data.email);
  });
});
```

**Problems:**

- 🔴 Mixing type checking with business logic
- 🔴 No runtime type safety (data could be wrong shape)
- 🔴 Can't share schemas with backend/tRPC/TanStack
- 🔴 Verbose (replicating type system in validators)

---

## What Standard Schema Adapters Do

Standard Schema adapters provide a **two-layer validation pipeline**:

```
┌─────────────────────────────────────────────────────────────┐
│                    User Input Change                        │
│                   (form.setEmail('...'))                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
         ┌─────────────────────────────┐
         │   LAYER 1: Type Validation  │
         │  (Standard Schema Adapter)  │
         ├─────────────────────────────┤
         │ • Is email a string?        │
         │ • Is email valid format?    │
         │ • Is age a number?          │
         │ • Is role enum value?       │
         └──────────┬──────────────────┘
                    │
         ┌──────────┴──────────┐
         │                     │
         ▼ FAIL                ▼ PASS
  ┌─────────────┐      ┌─────────────────────────┐
  │ Schema      │      │   LAYER 2: Business     │
  │ Errors      │      │   Validation (Vest.js)  │
  │ (immediate) │      ├─────────────────────────┤
  └─────────────┘      │ • Email available?      │
                       │ • Passwords match?      │
                       │ • User has permission?  │
                       └──────────┬──────────────┘
                                  │
                       ┌──────────┴──────────┐
                       │                     │
                       ▼ FAIL                ▼ PASS
                ┌─────────────┐      ┌─────────────┐
                │ Vest Errors │      │   Valid ✅   │
                │ (on-touch)  │      │             │
                └─────────────┘      └─────────────┘
                       │                     │
                       ▼                     ▼
              ┌────────────────────────────────┐
              │     Merged Error State         │
              │  (schema errors + vest errors) │
              └────────────────────────────────┘
```

### Adapter Responsibilities

The `SchemaAdapter` interface (already in ngx-vest-forms types):

```typescript
export type SchemaAdapter<T> = {
  // Validate data structure and types
  validate(data: unknown): SchemaValidationResult<T>;

  // Get underlying schema (for introspection)
  getSchema(): unknown;
};

export type SchemaValidationResult<T> = {
  success: boolean; // Did validation pass?
  data?: T; // Parsed/transformed data
  errors?: {
    // Schema errors
    path: string; // 'email', 'user.profile.name'
    message: string; // 'Invalid email format'
  }[];
};
```

### What Adapters Actually Do

1. **Wrap Standard Schema libraries** (Zod, Valibot, ArkType)
2. **Normalize error format** (different libraries → common format)
3. **Run before Vest.js** (type check first, then business logic)
4. **Provide type inference** (TypeScript types from schemas)
5. **Enable ecosystem integration** (same schema in tRPC, TanStack)

---

## Key Advantages

### 1. Separation of Concerns

**Structure vs Logic:**

```typescript
// ✅ GOOD: Separation of concerns
const UserSchema = z.object({
  email: z.string().email(), // Type: "is valid email format"
  age: z.number().min(18), // Type: "is number, >= 18"
});

const userSuite = staticSafeSuite<z.infer<typeof UserSchema>>((data) => {
  test('email', 'Already taken', async () => {
    await checkEmailAvailability(data.email); // Business: "is available?"
  });
});

const form = createVestForm(userSuite, model, {
  schema: UserSchema, // Layer 1: Structure
  // userSuite         // Layer 2: Business logic
});
```

**Why this matters:**

- 📚 **Clarity:** Type checks in schema, business rules in suite
- 🔧 **Maintainability:** Change structure without touching business logic
- ♻️ **Reusability:** Share schemas across forms, APIs, services
- 🧪 **Testability:** Test type validation and business validation independently

### 2. Runtime Type Safety

**Type-safe at Runtime:**

```typescript
// Define schema with Zod
const ProductSchema = z.object({
  id: z.string().uuid(),
  price: z.number().positive(),
  category: z.enum(['electronics', 'clothing', 'food']),
});

// Form gets RUNTIME type checking
const form = createVestForm(productSuite, model, {
  schema: ProductSchema,
});

// ✅ TypeScript + Runtime validation
form.setPrice(42); // OK: number
form.setPrice('invalid'); // ❌ Schema error: "Expected number, got string"

form.setCategory('cars'); // ❌ Schema error: "Invalid enum value"
```

**Why this matters:**

- 🛡️ **Protection:** Catch type errors users can't create via UI (API data, localStorage)
- 🔍 **Debugging:** Clear error messages ("Expected number, got string")
- 📊 **Data integrity:** Ensure data structure matches expectations
- 🎯 **Fail fast:** Type errors before business logic runs

### 3. Ecosystem Compatibility

**One Schema, Many Uses:**

```typescript
// 1. Define schema ONCE
export const UserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['user', 'admin']),
});

// 2. Use in ngx-vest-forms
const form = createVestForm(userSuite, model, {
  schema: UserSchema, // ✅ Type validation
});

// 3. Use in tRPC backend
const router = t.router({
  createUser: t.procedure
    .input(UserSchema) // ✅ Same schema validates API input
    .mutation(async ({ input }) => {
      return db.users.create(input);
    }),
});

// 4. Use in TanStack Form
const { Field } = useForm({
  defaultValues: {} as z.infer<typeof UserSchema>,
  validators: {
    onChange: UserSchema, // ✅ Same schema validates React form
  },
});

// 5. Use in React Hook Form
const { register } = useForm({
  resolver: zodResolver(UserSchema), // ✅ Same schema validates form
});
```

**Why this matters:**

- 🔗 **Single source of truth:** One schema defines data structure everywhere
- 📦 **Full-stack type safety:** Frontend and backend use identical validation
- 🚀 **Framework portability:** Use ngx-vest-forms in Angular, same schema in React
- 🌐 **Industry standard:** 25+ libraries support Standard Schema

### 4. Better Developer Experience

**Immediate vs Progressive Errors:**

```typescript
// With schema adapter
const form = createVestForm(userSuite, model, {
  schema: UserSchema,
  errorStrategy: 'on-touch', // For business errors
});

// User types invalid email
form.setEmail('not-an-email');
// ⚡ Schema error IMMEDIATELY: "Invalid email format"
// (Structure errors show always - users can't proceed with wrong types)

form.setEmail('test@example.com');
// ✅ Schema passes
// ⏳ Vest runs async check: "Checking availability..."

// User tabs to next field (touched)
// ❌ Vest error NOW: "Email already taken"
// (Business errors show after touch - progressive disclosure)
```

**Error Display Strategy:**

| Error Type        | When Shown               | Why                                               |
| ----------------- | ------------------------ | ------------------------------------------------- |
| **Schema errors** | Immediately              | Structure/type issues block all logic - show ASAP |
| **Vest errors**   | Based on `errorStrategy` | Business logic - respect UX (on-touch, on-submit) |

**Why this matters:**

- 🎨 **UX optimization:** Right errors at the right time
- 🚦 **Clear signals:** Structure errors vs business errors distinguished
- ♿ **WCAG compliance:** Schema errors `aria-live="assertive"`, Vest errors respect strategy
- 💡 **Less confusion:** Users know what to fix first

### 5. Performance Optimization

**Skip Expensive Checks:**

```typescript
const form = createVestForm(userSuite, model, {
  schema: z.object({
    email: z.string().email(), // Fast: regex check
  }),
});

const userSuite = staticSafeSuite<User>((data) => {
  // This ONLY runs if schema passes ✅
  test('email', 'Already taken', async ({ signal }) => {
    await fetch(`/api/check-email/${data.email}`, { signal });
  });
});

// User types "invalid"
form.setEmail('invalid');
// ✅ Schema fails: "Invalid email format"
// 🚫 Vest DOESN'T run (no API call)
// Result: No wasted network request

// User types "test@example.com"
form.setEmail('test@example.com');
// ✅ Schema passes
// ⚡ NOW Vest runs: async email availability check
```

**Why this matters:**

- 🚀 **Fewer API calls:** Don't check availability of invalid emails
- 💰 **Cost reduction:** Less server load, lower cloud bills
- ⚡ **Faster UX:** No waiting for async checks that will fail anyway
- 🔋 **Battery life:** Less network activity on mobile

---

## Dual-Layer Validation Architecture

### Philosophy

**Standard Schema = Type Safety Layer**

- Validates data **structure** and **types**
- Runs **before** business logic
- **Always synchronous** (fast feedback)
- **Portable** (same schema everywhere)

**Vest.js = Business Logic Layer**

- Validates **business rules** and **constraints**
- Runs **after** type validation passes
- **Often asynchronous** (API calls)
- **Form-specific** (UX, touch state, progressive disclosure)

### Integration Points

```typescript
// 1. Create form with BOTH layers
const form = createVestForm(
  userSuite, // Business logic (Vest)
  signal({ email: '', age: 0 }),
  {
    schema: UserSchema, // Type validation (Standard Schema)
    errorStrategy: 'on-touch', // Only affects Vest errors
  },
);

// 2. Field setter runs BOTH validations
form.setEmail('test@example.com');
// ▶ Step 1: Schema validates (structure/type)
// ▶ Step 2: Vest validates (business logic)
// ▶ Step 3: Errors merged (schema errors + vest errors)

// 3. Access merged errors
form.emailErrors();
// Returns: [...schemaErrors, ...vestErrors]

// 4. Access validation state
form.emailValid();
// Returns: !schemaErrors.length && !vestErrors.length
```

### Error Merging Strategy

```typescript
// Example scenario
form.setAge(-5);

// Schema validation:
const schemaResult = UserSchema.safeParse({ age: -5 });
// Errors: [{ path: 'age', message: 'Number must be greater than 0' }]

// Vest validation (runs after schema):
userSuite({ age: -5 }, 'age');
// Errors: { age: ['Must be 18 or older'] }

// MERGED result in form.ageErrors():
[
  'Number must be greater than 0', // Schema error (shown immediately)
  'Must be 18 or older', // Vest error (shown based on errorStrategy)
];
```

**Why merge?**

- Both validations provide useful feedback
- User sees all issues (structure + business)
- Clear which layer caught the error (by message content)

---

## Concrete Examples

### Example 1: User Registration Form

**Scenario:** Registration form with email, password, and age

```typescript
// 1. Type validation (Zod schema)
const RegistrationSchema = z
  .object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    age: z.number().min(0).max(150),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type Registration = z.infer<typeof RegistrationSchema>;

// 2. Business validation (Vest suite)
const registrationSuite = staticSafeSuite<Registration>((data) => {
  // Email availability (async)
  test('email', 'Email already registered', async ({ signal }) => {
    const response = await fetch(`/api/check-email/${data.email}`, { signal });
    if (!response.ok) throw new Error('Email taken');
  });

  // Age requirement for creating account
  test('age', 'Must be 18 or older to register', () => {
    enforce(data.age).greaterThanOrEquals(18);
  });

  // Password strength (warning, not blocking)
  test('password', 'Consider adding special characters', () => {
    warn();
    enforce(data.password).matches(/[!@#$%^&*]/);
  });
});

// 3. Create form with BOTH validations
const form = createVestForm(
  registrationSuite,
  signal<Partial<Registration>>({}),
  {
    schema: RegistrationSchema, // Type + basic structure validation
    errorStrategy: 'on-touch', // Business errors after user interaction
  },
);

// 4. User flow
form.setEmail('invalid');
// ⚡ Schema error (immediate): "Invalid email format"
// 🚫 Vest doesn't run (email invalid)

form.setEmail('test@example.com');
// ✅ Schema passes
// ⏳ Vest runs async: "Checking email availability..."
// ❌ Vest error (on-touch): "Email already registered"

form.setPassword('abc');
// ⚡ Schema error (immediate): "Password must be at least 8 characters"

form.setPassword('ValidP@ss123');
// ✅ Schema passes
// ⚠️ Vest warning: "Consider adding special characters" (already has them, no warning)

form.setAge(15);
// ✅ Schema passes (number, 0-150 range)
// ❌ Vest error (on-touch): "Must be 18 or older to register"
```

**What each layer catches:**

| Field    | Schema Catches               | Vest Catches                         |
| -------- | ---------------------------- | ------------------------------------ |
| Email    | Not a string, invalid format | Already registered (async API check) |
| Password | Too short (<8 chars)         | Weak password (warning only)         |
| Confirm  | Doesn't match password       | N/A (handled by schema refine)       |
| Age      | Not a number, out of range   | Too young (<18)                      |

### Example 2: E-commerce Product Form

**Scenario:** Product management with SKU, price, inventory, category

```typescript
// 1. Type validation (Valibot schema)
import * as v from 'valibot';

const ProductSchema = v.object({
  sku: v.pipe(v.string(), v.regex(/^[A-Z]{3}-\d{6}$/)),
  name: v.pipe(v.string(), v.minLength(3), v.maxLength(100)),
  price: v.pipe(v.number(), v.minValue(0)),
  inventory: v.pipe(v.number(), v.integer(), v.minValue(0)),
  category: v.picklist(['electronics', 'clothing', 'food', 'other']),
  publishedAt: v.optional(v.pipe(v.string(), v.isoDateTime())),
});

type Product = v.InferOutput<typeof ProductSchema>;

// 2. Business validation (Vest suite)
const productSuite = staticSafeSuite<Product>((data) => {
  // SKU uniqueness
  test('sku', 'SKU already exists', async ({ signal }) => {
    await checkSkuAvailability(data.sku, { signal });
  });

  // Price reasonableness
  test('price', 'Price seems unusually high, please verify', () => {
    warn();
    enforce(data.price).lessThan(10000);
  });

  // Inventory warning
  test('inventory', 'Low stock warning', () => {
    warn();
    enforce(data.inventory).greaterThan(10);
  });

  // Publication requirement
  skipWhen(!data.publishedAt, () => {
    test('inventory', 'Published products must have inventory', () => {
      enforce(data.inventory).greaterThan(0);
    });
  });
});

// 3. Create form
const form = createVestForm(productSuite, signal<Partial<Product>>({}), {
  schema: fromValibot(ProductSchema), // fromValibot() helper
});

// 4. User flow
form.setSku('ABC123');
// ⚡ Schema error: "Invalid SKU format (expected: ABC-123456)"

form.setSku('ABC-123456');
// ✅ Schema passes
// ⏳ Vest checks uniqueness: "SKU already exists"

form.setPrice('invalid');
// ⚡ Schema error: "Expected number, received string"

form.setPrice(-10);
// ⚡ Schema error: "Number must be greater than 0"

form.setPrice(99.99);
// ✅ Schema passes
// ✅ Vest passes (< 10000)

form.setPrice(15000);
// ✅ Schema passes
// ⚠️ Vest warning: "Price seems unusually high, please verify"
```

**Advantages:**

- ✅ Schema catches type errors (string price, negative inventory)
- ✅ Schema validates format (SKU pattern, ISO datetime)
- ✅ Vest checks business rules (SKU uniqueness, price reasonableness)
- ✅ Vest provides warnings (high price, low stock)
- ✅ Same ProductSchema used in API routes, tRPC, database models

### Example 3: Address Form with Conditional Fields

**Scenario:** International address form with country-specific requirements

```typescript
// 1. Type validation (ArkType schema)
import { type } from 'arktype';

const AddressSchema = type({
  country: "'US' | 'CA' | 'UK' | 'AU'",
  street: 'string>3',
  city: 'string>2',
  'state?': 'string',
  'province?': 'string',
  'zipCode?': 'string',
  'postcode?': 'string',
});

type Address = typeof AddressSchema.infer;

// 2. Business validation (Vest suite with conditional logic)
const addressSuite = staticSafeSuite<Address>((data) => {
  // US-specific requirements
  skipWhen(data.country !== 'US', () => {
    test('state', 'State is required for US addresses', () => {
      enforce(data.state).isNotEmpty();
    });

    test('zipCode', 'ZIP code is required for US addresses', () => {
      enforce(data.zipCode).isNotEmpty();
    });

    test('zipCode', 'Invalid ZIP code format', () => {
      enforce(data.zipCode).matches(/^\d{5}(-\d{4})?$/);
    });
  });

  // Canada-specific requirements
  skipWhen(data.country !== 'CA', () => {
    test('province', 'Province is required for Canadian addresses', () => {
      enforce(data.province).isNotEmpty();
    });

    test('postcode', 'Postal code is required for Canadian addresses', () => {
      enforce(data.postcode).isNotEmpty();
    });

    test('postcode', 'Invalid postal code format', () => {
      enforce(data.postcode).matches(/^[A-Z]\d[A-Z] \d[A-Z]\d$/);
    });
  });

  // Address validation API (all countries)
  test('street', 'Invalid address', async ({ signal }) => {
    await validateAddress(data, { signal });
  });
});

// 3. Create form
const form = createVestForm(addressSuite, signal<Partial<Address>>({}), {
  schema: fromArkType(AddressSchema), // fromArkType() helper
  errorStrategy: 'on-touch',
});

// 4. User flow
form.setCountry('US');
// ✅ Schema passes (valid enum value)
// ✅ Vest enables US-specific validations

form.setZipCode('invalid');
// ✅ Schema passes (zipCode is optional string)
// ❌ Vest error: "Invalid ZIP code format"

form.setZipCode('12345');
// ✅ Schema passes
// ✅ Vest passes
// ⏳ Vest runs address validation API

form.setCountry('CA');
// ✅ Schema passes
// ✅ Vest switches to Canadian validations
// ❌ Vest error: "Province is required for Canadian addresses"
```

**What each layer does:**

| Layer                | Responsibility                                                   |
| -------------------- | ---------------------------------------------------------------- |
| **Schema (ArkType)** | country enum, string min lengths, optional fields                |
| **Vest**             | Country-specific requirements, format validation, API validation |

**Why this works well:**

- Schema handles basic structure (types, required/optional)
- Vest handles complex conditional logic (per-country rules)
- Same schema used in shipping calculator, checkout flow, admin panel

---

## Integration Flow

### Step-by-Step: What Happens When User Types

```typescript
// Setup
const form = createVestForm(userSuite, model, {
  schema: UserSchema,
  errorStrategy: 'on-touch',
});

// User types in email field
<input
  [value]="form.email()"
  (input)="form.setEmail($event)"  // ← Triggers this
/>
```

**Detailed Flow:**

```
1. User types "test@example.com"
   ↓
2. (input) event fires
   ↓
3. form.setEmail($event) called
   ↓
4. ┌─────────────────────────────────────────┐
   │ PHASE 1: Schema Validation (Layer 1)   │
   ├─────────────────────────────────────────┤
   │ const result = UserSchema.safeParse({   │
   │   email: 'test@example.com'             │
   │ });                                      │
   │                                          │
   │ if (!result.success) {                  │
   │   // Store schema errors                │
   │   schemaErrors.email = result.errors;   │
   │   // SKIP Vest validation (fail fast)   │
   │   return;                                │
   │ }                                        │
   └─────────────────────────────────────────┘
   ↓ Schema passed ✅
   ↓
5. ┌─────────────────────────────────────────┐
   │ PHASE 2: Model Update                  │
   ├─────────────────────────────────────────┤
   │ model.update(current => ({             │
   │   ...current,                           │
   │   email: 'test@example.com'  // ← Safe  │
   │ }));                                    │
   └─────────────────────────────────────────┘
   ↓
   ↓
6. ┌─────────────────────────────────────────┐
   │ PHASE 3: Vest Validation (Layer 2)     │
   ├─────────────────────────────────────────┤
   │ userSuite(model(), 'email');           │
   │                                          │
   │ // Vest runs:                            │
   │ test('email', 'Already taken', async () => {│
   │   await checkEmailAvailability(...);    │
   │ });                                      │
   └─────────────────────────────────────────┘
   ↓
   ↓
7. ┌─────────────────────────────────────────┐
   │ PHASE 4: Error Merging                 │
   ├─────────────────────────────────────────┤
   │ const allErrors = [                     │
   │   ...schemaErrors.email || [],          │
   │   ...vestErrors.email || []             │
   │ ];                                      │
   │                                          │
   │ form.emailErrors.set(allErrors);       │
   └─────────────────────────────────────────┘
   ↓
   ↓
8. ┌─────────────────────────────────────────┐
   │ PHASE 5: UI Update (Signals)           │
   ├─────────────────────────────────────────┤
   │ form.email()        // 'test@example.com'│
   │ form.emailErrors()  // ['Already taken'] │
   │ form.emailValid()   // false             │
   │ form.emailPending() // false (async done)│
   └─────────────────────────────────────────┘
   ↓
   ↓ Template re-renders (OnPush)
```

### Error Flow Example

**Scenario 1: Schema Error (Type Mismatch)**

```typescript
// User types invalid email
form.setEmail('not-an-email');

// PHASE 1: Schema validation
const result = z.string().email().safeParse('not-an-email');
// result.success = false
// result.error.issues = [{ message: 'Invalid email', path: [] }]

// Store schema error
schemaErrors.set({ email: ['Invalid email'] });

// SKIP PHASE 2-3 (don't update model, don't run Vest)

// PHASE 4: Merge (only schema errors)
form.emailErrors() // ['Invalid email']
form.emailValid()  // false

// UI shows immediately (schema errors always visible)
<span role="alert">Invalid email</span>
```

**Scenario 2: Schema Pass, Vest Error (Business Logic)**

```typescript
// User types valid format, but email exists
form.setEmail('existing@example.com');

// PHASE 1: Schema validation
const result = z.string().email().safeParse('existing@example.com');
// result.success = true ✅

// PHASE 2: Model update
model.set({ email: 'existing@example.com' });

// PHASE 3: Vest validation
userSuite({ email: 'existing@example.com' }, 'email');
// Runs async: await checkEmailAvailability(...)
// Returns error: 'Already registered'

// PHASE 4: Merge
form.emailErrors() // ['Already registered']  // Only Vest error
form.emailValid()  // false

// UI shows based on errorStrategy
@if (form.emailTouched() && form.emailShowErrors()) {
  <span role="alert">{{ form.emailErrors()[0] }}</span>
}
```

**Scenario 3: Both Errors**

```typescript
// Edge case: Schema error + Vest error (if schema is lenient)
form.setAge(-5);

// Schema allows negative (hypothetically)
schemaErrors; // []

// Vest catches it
vestErrors; // { age: ['Must be positive'] }

// If user then changes to invalid type
form.setAge('invalid');

// Schema catches it
schemaErrors; // { age: ['Expected number'] }

// Vest doesn't run (schema failed)
vestErrors; // { age: ['Must be positive'] }  // Still has old error

// PHASE 4: Merge (both layers)
form.ageErrors(); // ['Expected number', 'Must be positive']
```

---

## Implementation Details

### SchemaAdapter Interface (Already Exists)

```typescript
// projects/ngx-vest-forms/core/src/lib/vest-form.types.ts

export type SchemaAdapter<T> = {
  /**
   * Validate data against the schema
   * @param data - Unknown data to validate
   * @returns Validation result with success flag, data, and errors
   */
  validate(data: unknown): SchemaValidationResult<T>;

  /**
   * Get the underlying schema object (for introspection)
   * @returns The original schema (ZodSchema, ValibotSchema, etc.)
   */
  getSchema(): unknown;
};

export type SchemaValidationResult<T> = {
  /** Whether validation passed */
  success: boolean;

  /** Validated and potentially transformed data */
  data?: T;

  /** Validation errors if success is false */
  errors?: {
    /** Field path (e.g., 'email', 'user.profile.name') */
    path: string;

    /** Error message */
    message: string;
  }[];
};
```

### Helper Functions (To Be Implemented)

````typescript
// projects/ngx-vest-forms/schemas/src/lib/zod-adapter.ts

import { z } from 'zod';
import type {
  SchemaAdapter,
  SchemaValidationResult,
} from 'ngx-vest-forms/core';

/**
 * Create a Standard Schema adapter from a Zod schema
 *
 * @example
 * ```typescript
 * const UserSchema = z.object({
 *   email: z.string().email(),
 *   age: z.number().min(18),
 * });
 *
 * const form = createVestForm(userSuite, model, {
 *   schema: fromZod(UserSchema),
 * });
 * ```
 */
export function fromZod<T extends z.ZodTypeAny>(
  schema: T,
): SchemaAdapter<z.infer<T>> {
  return {
    validate(data: unknown): SchemaValidationResult<z.infer<T>> {
      const result = schema.safeParse(data);

      if (result.success) {
        return {
          success: true,
          data: result.data,
        };
      }

      return {
        success: false,
        errors: result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      };
    },

    getSchema() {
      return schema;
    },
  };
}

/**
 * Type inference helper for Zod schemas
 */
export type InferZodSchema<T extends SchemaAdapter<any>> =
  T extends SchemaAdapter<infer U> ? U : never;
````

```typescript
// projects/ngx-vest-forms/schemas/src/lib/valibot-adapter.ts

import * as v from 'valibot';
import type {
  SchemaAdapter,
  SchemaValidationResult,
} from 'ngx-vest-forms/core';

/**
 * Create a Standard Schema adapter from a Valibot schema
 */
export function fromValibot<T extends v.BaseSchema<any, any, any>>(
  schema: T,
): SchemaAdapter<v.InferOutput<T>> {
  return {
    validate(data: unknown): SchemaValidationResult<v.InferOutput<T>> {
      const result = v.safeParse(schema, data);

      if (result.success) {
        return {
          success: true,
          data: result.output,
        };
      }

      return {
        success: false,
        errors: result.issues.map((issue) => ({
          path: issue.path?.map((p) => p.key).join('.') ?? '',
          message: issue.message,
        })),
      };
    },

    getSchema() {
      return schema;
    },
  };
}
```

```typescript
// projects/ngx-vest-forms/schemas/src/lib/arktype-adapter.ts

import type { Type } from 'arktype';
import type {
  SchemaAdapter,
  SchemaValidationResult,
} from 'ngx-vest-forms/core';

/**
 * Create a Standard Schema adapter from an ArkType schema
 */
export function fromArkType<T extends Type>(
  schema: T,
): SchemaAdapter<T['infer']> {
  return {
    validate(data: unknown): SchemaValidationResult<T['infer']> {
      const result = schema(data);

      if (result instanceof schema.infer) {
        return {
          success: true,
          data: result as T['infer'],
        };
      }

      return {
        success: false,
        errors: result.errors.map((error) => ({
          path: error.path.join('.'),
          message: error.message,
        })),
      };
    },

    getSchema() {
      return schema;
    },
  };
}
```

### Integration in createVestForm

```typescript
// projects/ngx-vest-forms/core/src/lib/create-vest-form.ts (MODIFIED)

export function createVestForm<TModel extends Record<string, unknown>>(
  suite: VestSuite<TModel>,
  initialModel: WritableSignal<Partial<TModel>> | Partial<TModel>,
  options?: VestFormOptions,
): VestForm<TModel> {
  // ... existing setup ...

  const schemaAdapter = options?.schema;
  const schemaErrors = signal<Record<string, string[]>>({});

  // Modified field setter
  function createFieldSetter<P extends Path<TModel>>(
    path: P,
  ): (value: PathValue<TModel, P> | Event) => void {
    return (value: PathValue<TModel, P> | Event) => {
      const actualValue =
        value instanceof Event ? getValueFromEvent(value) : value;

      // PHASE 1: Schema validation (if adapter provided)
      if (schemaAdapter) {
        const testData = { ...modelSignal(), [path]: actualValue };
        const result = schemaAdapter.validate(testData);

        if (!result.success) {
          // Store schema errors
          schemaErrors.update((current) => ({
            ...current,
            [path]: result.errors?.map((e) => e.message) ?? [],
          }));

          // SKIP Vest validation (fail fast)
          return;
        }

        // Clear schema errors for this field
        schemaErrors.update((current) => {
          const next = { ...current };
          delete next[path];
          return next;
        });
      }

      // PHASE 2: Update model (only if schema passed or no schema)
      modelSignal.update((current) =>
        setNestedValue(current, path, actualValue),
      );

      // PHASE 3: Vest validation
      suite(modelSignal(), path);
    };
  }

  // Modified field accessor (merge errors)
  function createField<P extends Path<TModel>>(
    path: P,
  ): VestField<PathValue<TModel, P>> {
    const vestErrors = computed(() => suiteResult().getErrors(path) ?? []);

    const schemaErrs = computed(() => schemaErrors()[path] ?? []);

    // PHASE 4: Merged errors
    const mergedErrors = computed(() => [...schemaErrs(), ...vestErrors()]);

    return {
      value: computed(() => getNestedValue(modelSignal(), path)),
      valid: computed(() => mergedErrors().length === 0),
      errors: mergedErrors, // Combined schema + vest errors
      // ... other properties ...
    };
  }

  // ... rest of implementation ...
}
```

---

## Ecosystem Benefits

### 1. tRPC Integration

**Share validation between frontend and backend:**

```typescript
// shared/schemas/user.schema.ts (shared between Angular + Node.js)
import { z } from 'zod';

export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['user', 'admin']),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
```

```typescript
// backend/router.ts (tRPC)
import { CreateUserSchema } from '../shared/schemas/user.schema';

export const userRouter = t.router({
  create: t.procedure
    .input(CreateUserSchema) // ✅ Validates API input
    .mutation(async ({ input }) => {
      return await db.users.create(input);
    }),
});
```

```typescript
// frontend/user-form.component.ts (Angular)
import { CreateUserSchema } from '../shared/schemas/user.schema';

const form = createVestForm(userSuite, model, {
  schema: CreateUserSchema, // ✅ Same schema validates form
});
```

**Benefits:**

- ✅ Single source of truth for data structure
- ✅ Type safety across the wire
- ✅ Frontend validation matches backend validation
- ✅ No duplicate validation logic

### 2. TanStack Form/Router Integration

**Use ngx-vest-forms in Angular, share schema with React:**

```typescript
// shared/schemas/product.schema.ts
import * as v from 'valibot';

export const ProductSchema = v.object({
  name: v.pipe(v.string(), v.minLength(3)),
  price: v.pipe(v.number(), v.minValue(0)),
  category: v.picklist(['electronics', 'clothing']),
});
```

```typescript
// angular-app/product-form.component.ts
const form = createVestForm(productSuite, model, {
  schema: fromValibot(ProductSchema), // ✅ Valibot validation
});
```

```typescript
// react-app/ProductForm.tsx
import { useForm } from '@tanstack/react-form';
import { valibotValidator } from '@tanstack/valibot-form-adapter';

function ProductForm() {
  const form = useForm({
    defaultValues: {} as v.InferOutput<typeof ProductSchema>,
    validators: {
      onChange: ProductSchema, // ✅ Same schema in React
    },
  });
}
```

**Benefits:**

- ✅ Migrate from Angular to React (or vice versa) without rewriting validation
- ✅ Share schemas across micro-frontends
- ✅ Consistent validation across tech stacks

### 3. Hono Backend Integration

**API validation with Hono + Standard Schema:**

```typescript
// backend/routes/users.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { CreateUserSchema } from '../shared/schemas/user.schema';

const app = new Hono();

app.post('/users', zValidator('json', CreateUserSchema), async (c) => {
  const data = c.req.valid('json'); // Type-safe!
  return c.json(await db.users.create(data));
});
```

```typescript
// frontend/user-form.component.ts
const form = createVestForm(userSuite, model, {
  schema: CreateUserSchema, // ✅ Same schema as backend
});
```

**Benefits:**

- ✅ Frontend and backend use identical validation
- ✅ API contract enforced at compile-time
- ✅ Automatic 400 Bad Request on invalid data

---

## FAQ

### Q: Do I need to use Standard Schema adapters?

**A:** No, they're **completely optional**. ngx-vest-forms works perfectly with Vest.js alone.

**Use adapters when:**

- ✅ You want runtime type safety
- ✅ You're using tRPC, TanStack, Hono, etc.
- ✅ You want to share schemas across frontend/backend
- ✅ You need strict data structure validation

**Don't use adapters when:**

- ❌ Simple forms with only business logic validation
- ❌ Vest.js already handles all your validation needs
- ❌ You don't need ecosystem integration

### Q: Will this slow down my forms?

**A:** No, it will likely **speed them up**!

**Reasons:**

- ⚡ Schema validation is synchronous (fast regex/type checks)
- ⚡ Skips expensive async Vest checks when schema fails
- ⚡ Fewer API calls (don't check availability of invalid emails)

**Benchmark:**

- Zod validation: ~0.1ms per field
- Vest async check: ~50-200ms (network request)
- **Savings:** Skip async when schema fails = 99.9% faster

### Q: Can I use multiple schema libraries?

**A:** Yes! Each form can use a different schema library:

```typescript
// Form 1: Zod
const userForm = createVestForm(userSuite, userModel, {
  schema: fromZod(UserSchema),
});

// Form 2: Valibot
const productForm = createVestForm(productSuite, productModel, {
  schema: fromValibot(ProductSchema),
});

// Form 3: ArkType
const orderForm = createVestForm(orderSuite, orderModel, {
  schema: fromArkType(OrderSchema),
});
```

**Why this works:**

- All adapt to same `SchemaAdapter<T>` interface
- ngx-vest-forms doesn't care which library you use
- Choose best tool for each use case

### Q: What if schema and Vest have conflicting validation?

**A:** Both errors will show. **This is intentional.**

**Example:**

```typescript
// Schema: Email must be valid format
const schema = z.object({ email: z.string().email() });

// Vest: Email must be @company.com
const suite = staticSafeSuite((data) => {
  test('email', 'Must use company email', () => {
    enforce(data.email).endsWith('@company.com');
  });
});

// User types "test@gmail.com"
form.setEmail('test@gmail.com');

// Errors shown:
// 1. ❌ (Schema passes - valid email format)
// 2. ❌ "Must use company email" (Vest fails)
```

**Best practice:** Don't duplicate validation. Use:

- Schema for structure/types
- Vest for business logic

### Q: Can I use this with Angular Material?

**A:** Yes! Standard Schema adapters are **completely transparent** to UI components.

```typescript
@Component({
  template: `
    <mat-form-field>
      <mat-label>Email</mat-label>
      <input matInput [value]="form.email()" (input)="form.setEmail($event)" />
      <mat-error *ngIf="form.emailShowErrors()">
        {{ form.emailErrors()[0] }}
      </mat-error>
    </mat-form-field>
  `,
})
export class UserFormComponent {
  form = createVestForm(userSuite, model, {
    schema: UserSchema, // ✅ Works with Material
  });
}
```

### Q: What about Vest.js v6 Standard Schema support?

**A:** When Vest v6 ships with Standard Schema support, you'll be able to:

```typescript
// Export Vest suite as Standard Schema
import { getStandardSchema } from 'ngx-vest-forms/schemas';

const userSuite = staticSafeSuite<User>((data) => {
  test('email', 'Required', () => enforce(data.email).isNotEmpty());
});

// Use Vest suite as Standard Schema (Vest v6+)
const standardSchema = getStandardSchema(userSuite);

// Now Vest suite works with tRPC, TanStack, etc.
const router = t.router({
  createUser: t.procedure
    .input(standardSchema) // ✅ Vest suite validates tRPC input
    .mutation(async ({ input }) => {
      return db.users.create(input);
    }),
});
```

**Timeline:** Vest v6 is in development, ETA TBD.

### Q: How do I migrate existing forms to use schemas?

**A:** It's a **non-breaking addition**:

```typescript
// Before (still works)
const form = createVestForm(userSuite, model);

// After (add schema)
const form = createVestForm(userSuite, model, {
  schema: UserSchema, // ✅ Add this line
});
```

**Migration strategy:**

1. Add schema to one form (test)
2. Gradually add to other forms
3. Or don't add at all (optional)

**No breaking changes!**

---

## Summary

**Standard Schema adapters provide:**

1. ✅ **Separation of concerns** - Type validation (schema) vs business logic (Vest)
2. ✅ **Runtime type safety** - Catch structural errors at runtime
3. ✅ **Ecosystem compatibility** - Same schemas in tRPC, TanStack, Hono, etc.
4. ✅ **Better DX** - Immediate errors for types, progressive for business logic
5. ✅ **Performance** - Skip expensive checks when structure is invalid
6. ✅ **Portability** - Share schemas across Angular, React, Node.js, etc.

**They DON'T:**

- ❌ Replace Vest.js (Vest is still the validation engine)
- ❌ Change your template code (same bindings)
- ❌ Break existing forms (opt-in via `schema` option)

**Strategic value:**

- Future-proof validation architecture
- Industry standard compliance (25+ libraries)
- Cross-framework portability
- Full-stack type safety

**Next steps:**

1. Review implementation roadmap in SIGNAL_FORMS_COMPATIBILITY_SUMMARY.md
2. Start with fromZod() helper (most popular library)
3. Add to one form (test benefits)
4. Gradually adopt across codebase

---

**Document Version:** 1.0
**Last Updated:** October 7, 2025
**Related Docs:**

- API_COMPARISON_SIGNAL_FORMS.md
- SIGNAL_FORMS_COMPATIBILITY_SUMMARY.md
- SIGNAL_FORMS_STANDARD_SCHEMA_COMPATIBILITY.md
