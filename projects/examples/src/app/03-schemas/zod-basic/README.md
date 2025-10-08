# Zod Basic Schema Integration Example

This example demonstrates **two-layer validation** with Zod and Vest.js, showing how to combine:

1. **Schema Layer (Zod)**: Runtime type safety and structure validation
2. **Business Layer (Vest.js)**: Domain-specific rules and async validation

## What's Demonstrated

### Layer 1: Zod Schema Validation

- ✅ Email format validation
- ✅ Username minimum length (3 characters)
- ✅ Password strength (minimum 8 characters)
- ✅ Age requirement (18-120 years)
- ✅ Terms acceptance checkbox validation
- ✅ TypeScript type inference from schema

### Layer 2: Vest.js Business Validation

- ✅ Async email domain checking (blocked domains)
- ✅ Async username availability check
- ✅ Cross-field password confirmation
- ✅ Password strength warnings (non-blocking)
- ✅ Conditional validation with `include().when()`
- ✅ Expensive validation skipping with `skipWhen()`

## Key Features

### Two-Layer Architecture

```typescript
const form = createVestForm(
  signal<UserModel>({ ... }),  // Model
  userSuite,                    // Layer 2: Vest business logic
  {
    schema: userSchema,         // Layer 1: Zod type validation
    errorStrategy: 'on-touch',
  }
);
```

### Error Flow

1. **User input** → Schema validates first (Layer 1)
2. **If schema passes** → Vest validates business logic (Layer 2)
3. **If schema fails** → Vest validation is skipped (performance optimization)
4. **Errors merged** → Schema errors shown first, then Vest errors

### Benefits

- 🎯 **Type Safety**: Zod schema provides runtime validation + TypeScript types
- 🚀 **Performance**: Expensive Vest validations skip until schema passes
- 🌐 **Ecosystem**: Zod schemas work with tRPC, TanStack, Hono
- ♻️ **Portability**: Reuse schemas across React, Vue, Svelte
- 💡 **Flexibility**: Vest handles complex, dynamic business rules

## Files Structure

```plaintext
zod-basic/
├── zod-basic.content.ts      # Page content and navigation
├── zod-basic.validations.ts  # Zod schema + Vest suite
├── zod-basic.form.ts         # Form component with two-layer validation
├── zod-basic.html            # Form template
├── zod-basic.page.ts         # Page wrapper with debugger
├── index.ts                  # Public exports
└── README.md                 # This file
```

## How It Works

### 1. Define Zod Schema with Defaults (Type Validation + Initial Values)

```typescript
export const userSchema = z.object({
  email: z.string().min(1).email().default(''),
  username: z.string().min(3).default(''),
  password: z.string().min(8).default(''),
  age: z.number().min(18).default(18),
  // ...
});

export type UserModel = z.infer<typeof userSchema>;

// ✨ Helper to create initial values from schema defaults
export function createInitialUserRegistration(): UserModel {
  return userSchema.parse({});
}
```

**Best Practice**: Using `.default()` in the schema keeps your initial values DRY and type-safe. The schema is the single source of truth for both validation AND initial state!

### 2. Define Vest Suite (Business Logic)

```typescript
export const userSuite = staticSafeSuite<UserModel>((data) => {
  // Async checks only run after schema passes
  skipWhen(
    (result) => result.hasErrors('email'),
    () => {
      test('email', 'Domain blocked', async () => {
        // Check against blocked domains
      });
    },
  );

  // Cross-field validation
  include('confirmPassword').when('password');
  test('confirmPassword', 'Must match', () => {
    enforce(data.confirmPassword).equals(data.password);
  });
});
```

### 3. Create Form with Both Layers

```typescript
// ✨ Use schema-based initial values
const form = createVestForm(
  signal<UserModel>(createInitialUserRegistration()),
  userSuite,
  { schema: userSchema }, // ← Two-layer validation enabled
);
```

## Related Examples

- **[Valibot Advanced](/schemas/valibot-advanced)** - Valibot transforms and pipes
- **[ArkType Conditional](/schemas/arktype-conditional)** - ArkType's conditional validation
- **[Basic Validation](/fundamentals/basic-validation)** - Vest-only validation (no schema)

## Learn More

- [Standard Schema Specification](https://standardschema.dev/)
- [Zod Documentation](https://zod.dev/)
- [Vest.js Documentation](https://vestjs.dev/)
- [ngx-vest-forms Schema Integration](https://github.com/ngx-vest-forms/ngx-vest-forms)
