# ngx-vest-forms/schemas

**Schema utilities for ngx-vest-forms** - Type-safe schema integration with popular validation libraries that follow the [Standard Schema](https://standardschema.dev/) specification.

## 🎯 Dual Validation Strategy: How Schema Validation Complements Vest.js

**TL;DR**: Use **both** schema validation AND Vest.js validation for the best user experience:

| Validation Type | When           | Purpose                    | Performance | State Location       |
| --------------- | -------------- | -------------------------- | ----------- | -------------------- |
| **Vest.js**     | As user types  | Interactive field feedback | Incremental | `formState().errors` |
| **Schema**      | On form submit | Complete data validation   | Single pass | `formState().schema` |

### **Why Both?**

- **🔄 Vest.js**: Immediate field-level feedback as users type (optimal UX)
- **🛡️ Schema**: Comprehensive data structure validation on submit (data integrity)
- **⚡ Performance**: Incremental validation + final validation pass
- **🎯 Separation**: No duplicate logic, clear responsibilities

### **Complete Example: Vest.js + Schema Working Together**

````typescript
import { z } from 'zod';
import { staticSuite, test, enforce, only } from 'vest';
import { Component, signal } from '@angular/core';
import { ngxVestForms } from 'ngx-vest-forms/core';
import { NgxVestFormWithSchemaDirective } from 'ngx-vest-forms/schemas';

// Schema for type safety and submit validation
const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  age: z.number().min(0).max(120),
});
type User = z.infer<typeof userSchema>;

// Vest suite for interactive field validation
const userSuite = staticSuite((data: Partial<User> = {}, field?: string) => {
  only(field); // Optimize: only validate the changed field

  test('name', 'Name is required', () => {
    enforce(data.name).isNotEmpty();
  });
  test('email', 'Please enter a valid email', () => {
    enforce(data.email).matches(/^[^@]+@[^@]+\.[^@]+$/);
  });
  test('age', 'Age must be a positive number', () => {
    enforce(data.age).isNumeric().greaterThanOrEquals(0);
  });
});

@Component({
  imports: [ngxVestForms, NgxVestFormWithSchemaDirective],
  template: `
    <form ngxVestFormWithSchema
          [vestSuite]="userSuite"     <!-- Interactive validation (Vest) -->
          [formSchema]="userSchema"   <!-- Submit validation (Schema) -->
          [(formValue)]="userData"
          (ngSubmit)="save()"
          #vestForm="ngxVestForm">

      <!-- Immediate feedback as user types (Vest.js) -->
      <div>
        <input name="name" [ngModel]="userData().name" placeholder="Name">
        @if (vestForm.formState().errors.name) {
          <span class="field-error">{{ vestForm.formState().errors.name[0] }}</span>
        }
      </div>

      <div>
        <input name="email" type="email" [ngModel]="userData().email" placeholder="Email">
        @if (vestForm.formState().errors.email) {
          <span class="field-error">{{ vestForm.formState().errors.email[0] }}</span>
        }
      </div>

      <div>
        <input name="age" type="number" [ngModel]="userData().age" placeholder="Age">
        @if (vestForm.formState().errors.age) {
          <span class="field-error">{{ vestForm.formState().errors.age[0] }}</span>
        }
      </div>

      <button type="submit" [disabled]="!vestForm.formState().valid">Submit</button>

      <!-- Complete validation on submit (Schema) -->
      @if (vestForm.formState().schema?.success === false) {
        <div class="submit-errors">
          <h4>Please fix the following issues:</h4>
          @for (issue of vestForm.formState().schema.issues; track issue.message) {
            <p class="error">{{ issue.message }}</p>
          }
        </div>
      }
    </form>
  `,
})
export class UserFormComponent {
  protected readonly userSchema = userSchema;
  protected readonly userSuite = userSuite;
  protected readonly userData = signal<User>({ name: '', email: '', age: 0 });

  protected save() {
    const state = vestForm.formState();
    if (state.schema?.success && state.valid) {
      console.log('✅ Valid data:', state.value);
      // Process form data...
    } else {
      console.log('❌ Validation failed');
    }
  }
}
### Alternative: Compose Manually

If you prefer to keep explicit control, you can attach `ngxVestForm` (or `ngxVestFormCore`) and the schema directive directly:

```html
<form ngxVestForm [vestSuite]="suite" [(formValue)]="model" ngxSchemaValidation [formSchema]="schema">
  ...
</form>
````

Import in your component:

```ts
import { ngxVestForms } from 'ngx-vest-forms/core';
import { NgxSchemaValidationDirective } from 'ngx-vest-forms/schemas';

@Component({
  imports: [ngxVestForms, NgxSchemaValidationDirective],
  template: `...`,
})
export class MyCmp {}
```

**Key Benefits:**

- ✅ **Best UX**: Immediate field feedback + comprehensive submit validation
- ✅ **Performance**: Incremental validation + single final check
- ✅ **Type Safety**: Full TypeScript inference from schemas
- ✅ **Separation**: No duplicate validation logic or conflicting state

## Wrapper vs. Manual Composition

You can attach schema validation in two ways:

- Wrapper: `<form ngxVestFormWithSchema ...>`
  - Pros: One import, exportAs `ngxVestForm`, exposes `formState().schema` along with the usual state.
  - Use when you want schema submit validation plus core features without wiring multiple directives.

- Manual: `<form ngxVestForm ... ngxSchemaValidation [formSchema]="...">`
  - Pros: Explicit composition; use when you already import `ngxVestForms` and just want to add schema validation.
  - Export: read schema state via the main export (`#vestForm="ngxVestForm"`), under `vestForm.formState().schema`.

Both approaches are equivalent at runtime; choose based on DX preference.

## What is Standard Schema?

[Standard Schema](https://standardschema.dev/) is a common interface designed by the creators of Zod, Valibot, and ArkType to enable interoperability between different validation libraries. It provides a unified way for tools and frameworks to accept user-defined validators without writing custom adapters for each library.

## Core Benefits

- **🔒 Type Safety**: Full TypeScript type inference from your schemas
- **⚡ Runtime Validation**: Validate form data against schema constraints on submit
- **🔄 Library Agnostic**: Works with any Standard Schema-compatible library
- **🎯 Separation of Concerns**: Schema validation is separate from Vest field validation
- **🛠️ Developer Experience**: Rich error information and debugging support

## Schema Libraries Supported

Choose any library that implements the Standard Schema specification:

- **[Zod](https://zod.dev/)** (3.24.0+): Popular, expressive, TypeScript-first
- **[Valibot](https://valibot.dev/)** (v1.0+): Lightweight, fast, modular
- **[ArkType](https://arktype.io/)** (v2.0+): Advanced type-level validation
- **[Effect Schema](https://effect.website/docs/schema/introduction)** (3.13.0+): Functional programming approach
- **[Yup](https://github.com/jquense/yup)** (1.7.0+): Object schema validation

## How Schema Validation Works

### Submit-time Validation Lifecycle

When a schema is provided via `[formSchema]` (either with the wrapper or the schema directive), schema validation runs **on form submit**. The result is exposed separately from Vest field validation under `formState().schema`:

```typescript
const state = vestForm.formState();
if (state.schema?.hasRun && state.schema.success === false) {
  // Handle schema validation errors
  console.log('Schema issues:', state.schema.issues);
}
```

### Why Separate from Vest Validation?

Schema validation and Vest validation serve different purposes:

- **Schema validation**: Structural/shape/domain validation (runs on submit)
- **Vest validation**: Interactive field-level UX validation (runs as user types)

This separation:

- ✅ Preserves rich issue data (path/message)
- ✅ Avoids accidental double counting in `errorCount`
- ✅ Keeps your UI logic explicit and predictable
- ✅ Allows different validation strategies for different concerns

## Installation

The schemas utilities are included when you install `ngx-vest-forms`:

```bash
npm install ngx-vest-forms
```

Then import from the dedicated entry point:

```typescript
import {
  ngxModelToStandardSchema,
  InferSchemaType,
} from 'ngx-vest-forms/schemas';
```

## API Reference

### Types

#### `SchemaDefinition<T>`

Represents a StandardSchemaV1-compatible schema that works with Zod, Valibot, ArkType, or schemas created with `ngxModelToStandardSchema`.

#### `InferSchemaType<T>`

Infers the output type from a StandardSchemaV1 definition, enabling type-safe form development.

### Functions

#### `ngxModelToStandardSchema<T>(template: T)`

Creates a StandardSchemaV1-compatible schema from a plain object template with minimal runtime validation.

Behavior and purpose:

- Returns a Standard Schema v1-compatible object (has `~standard.validate`).
- Performs basic runtime validation: succeeds for non-null objects, fails for primitives/null.
- Preserves the original template under a private `_shape` property.

Why `_shape` exists:

- Dev-time safety net: `NgxFormDirective` can extract `_shape` to run a lightweight template check that catches typos in `ngModel`/`ngModelGroup` keys during development.
- Migration from v1: If you previously used `[formShape]`, wrap that object with `ngxModelToStandardSchema` and pass it to `[formSchema]` to retain the same defensive checks without changing your form code.

Scope of `_shape`:

- Only present on schemas created via `ngxModelToStandardSchema`.
- Not required or expected for third-party schemas (Zod, Valibot, ArkType); those remain pure Standard Schema providers without `_shape`.

#### `isStandardSchema(value: any)`

Type guard that determines if a value is a valid StandardSchemaV1-compatible schema (object with a `~standard` property).

#### `toAnyRuntimeSchema<T>(schema: unknown)` / `normalizeToRuntimeSchema<T>(schema: unknown)`

Converts any schema-like value into a unified `NgxRuntimeSchema` interface used by the form directive for submit-time validation. The repository exports both `toAnyRuntimeSchema` (backwards compatible) and the clearer alias `normalizeToRuntimeSchema` — prefer the latter in new code and docs.

Detection & normalization order (what the function does):

1. Already an `NgxRuntimeSchema` (has `parse` + `safeParse`) → returned as-is.
2. Standard Schema v1 (`~standard`) → adapted via `toRuntimeSchema`.
3. Has `safeParse` method → treated as Zod/Valibot-like and adapted.
4. Is a function → treated as ArkType-like and adapted.
5. Fallback → identity schema that always succeeds.

Why this exists:

- Centralizes schema detection & normalization so the rest of the library can call a single contract (`NgxRuntimeSchema`).
- Avoids importing optional peer dependencies; adapters use structural typing to remain lightweight.
- Preserves metadata and original issues for richer UI and logging.
- Works regardless of `_shape`; submit-time validation does not rely on `_shape` at all.

Naming guidance (docs & API):

- Use the phrase `standardSchema` (or `StandardSchemaV1`) when you mean the Standard Schema shape specifically. This disambiguates from other schema types (Zod, JSON Schema, etc.).
- Use `schema` in function names only when the API accepts any schema-like value (for example `toAnyRuntimeSchema(schema: unknown)`).
- Prefer the exported alias `normalizeToRuntimeSchema` in new code for readability; `toAnyRuntimeSchema` remains available for compatibility.

## Complete Examples

### Using with Zod

```typescript
import { Component, signal } from '@angular/core';
import { z } from 'zod';
import { ngxVestForms } from 'ngx-vest-forms';

const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  age: z.number().min(0).max(120),
  email: z.string().email(),
});
type User = z.infer<typeof userSchema>;

@Component({
  imports: [ngxVestForms],
  template: `
    <form
      ngxVestForm
      [formSchema]="userSchema"
      [(formValue)]="userData"
      (ngSubmit)="save()"
      #vestForm="ngxVestForm"
    >
      <input name="name" [ngModel]="userData().name" placeholder="Name" />
      <input
        name="age"
        type="number"
        [ngModel]="userData().age"
        placeholder="Age"
      />
      <input
        name="email"
        type="email"
        [ngModel]="userData().email"
        placeholder="Email"
      />

      <button type="submit">Submit</button>

      @if (vestForm.formState().schema?.success === false) {
        <div class="error-summary">
          @for (
            issue of vestForm.formState().schema.issues;
            track issue.message
          ) {
            <p class="error">{{ issue.message }}</p>
          }
        </div>
      }
    </form>
  `,
})
export class UserFormComponent {
  protected readonly userSchema = userSchema;
  protected readonly userData = signal<User>({
    name: '',
    email: '',
    age: 0,
  });

  protected save() {
    const state = this.vestForm.formState();
    if (state.schema?.success && state.valid) {
      console.log('Valid data:', state.value);
      // Process form data...
    }
  }
}
```

### Using with Valibot

```typescript
import * as v from 'valibot';
import { Component, signal } from '@angular/core';
import { ngxVestForms } from 'ngx-vest-forms';
import { InferSchemaType } from 'ngx-vest-forms/schemas';

const userSchema = v.object({
  name: v.pipe(v.string(), v.minLength(2)),
  age: v.pipe(v.number(), v.minValue(0), v.maxValue(120)),
});
type User = InferSchemaType<typeof userSchema>;

@Component({
  imports: [ngxVestForms],
  template: `
    <form
      ngxVestForm
      [formSchema]="userSchema"
      [(formValue)]="userData"
      (ngSubmit)="save()"
      #vestForm="ngxVestForm"
    >
      <input name="name" [ngModel]="userData().name" />
      <input name="age" type="number" [ngModel]="userData().age" />
      <button type="submit">Submit</button>
    </form>
  `,
})
export class ValibotFormComponent {
  protected readonly userSchema = userSchema;
  protected readonly userData = signal<User>({ name: '', age: 0 });

  protected save() {
    // Handle form submission
  }
}
```

### Built-in Fallback: ngxModelToStandardSchema

For legacy projects or when you don't need complex validation rules, use our built-in utility to create Standard Schema-compatible validators from plain objects:

```typescript
import { Component, signal } from '@angular/core';
import { ngxVestForms } from 'ngx-vest-forms';
import {
  ngxModelToStandardSchema,
  InferSchemaType,
} from 'ngx-vest-forms/schemas';

const userTemplate = {
  name: '',
  age: 0,
  isActive: false,
};

const userSchema = ngxModelToStandardSchema(userTemplate);
type User = InferSchemaType<typeof userSchema>;

@Component({
  imports: [ngxVestForms],
  template: `
    <form
      ngxVestForm
      [formSchema]="userSchema"
      [(formValue)]="userData"
      (ngSubmit)="save()"
      #vestForm="ngxVestForm"
    >
      <input name="name" [ngModel]="userData().name" />
      <input name="age" type="number" [ngModel]="userData().age" />
      <input name="isActive" type="checkbox" [ngModel]="userData().isActive" />
      <button type="submit">Submit</button>
    </form>
  `,
})
export class CustomSchemaFormComponent {
  protected readonly userSchema = userSchema;
  protected readonly userData = signal<User>(userTemplate);

  protected save() {
    // Handle form submission with type safety
  }
}
```

## When You Need Schemas

- **🔒 Type Safety**: Get compile-time checks for form structure and values
- **⚡ Runtime Validation**: Validate user input against schema constraints on submit
- **🔄 Multiple Schema Libraries**: Works with any Standard Schema-compatible library
- **🛠️ Developer Experience**: Rich IntelliSense and error detection in your IDE
- **🔗 Shared Validation**: Use the same validation logic between frontend and backend
- **🎯 Separation of Concerns**: Keep structural validation separate from interactive field validation

## Best Practices

1. **Use schemas for complex forms**: For simple forms, plain object models may be sufficient
2. **Prefer established libraries**: Zod, Valibot, and ArkType offer more validation features than `ngxModelToStandardSchema`
3. **Share schemas**: Use the same schemas for frontend forms and backend validation
4. **Type inference**: Leverage `InferSchemaType` to derive types from schemas rather than defining them separately
5. **Combine with Vest.js**: Use both for optimal user experience and data integrity

## Migration from v1

If you were previously using `[formShape]` and `validateShape` in v1:

```typescript
// Before (v1)
import { vestForms, validateShape } from 'ngx-vest-forms';
export const myFormModelShape: DeepRequired<MyFormModel> = { ... };

@Component({
  imports: [vestForms],
  template: `
    <form scVestForm [formShape]="shape" ...>
      <!-- ... -->
    </form>
  `
})
export class MyComponent {
  protected readonly formValue = signal<MyFormModel>({});
  protected readonly shape = myFormModelShape;
  // validateShape(this.formValue(), this.shape) in dev mode
}

// After (v2)
import { ngxVestForms } from 'ngx-vest-forms/core';
import { ngxModelToStandardSchema } from 'ngx-vest-forms/schemas';
const schema = ngxModelToStandardSchema(myFormModelShape); // attaches _shape for dev-time checks

@Component({
  imports: [ngxVestForms],
  template: `
    <form ngxVestForm [formSchema]="schema" ...>
      <!-- ... -->
    </form>
  `
})
export class MyComponent {
  protected readonly formValue = signal<MyFormModel>({});
  protected readonly schema = schema; // pass to [formSchema] to keep v1 formShape safety
}
```

## Common Pitfalls & Troubleshooting

- **Type Inference Issues:** Ensure your schema is StandardSchemaV1-compatible for best type inference. Use `InferSchemaType` for derived types.
- **Runtime Validation Errors:** If you see unexpected validation failures, check that your schema matches your form model structure.
- **Import Errors:** Always import schema utilities from `ngx-vest-forms/schemas`, not the core package.
- **Deprecated API:** Do not use `shapeToSchema`; use `ngxModelToStandardSchema` instead.

## Related Documentation

- [Main ngx-vest-forms README](../README.md)
- [Core Library API](../src/public-api.ts)

## Resources

- [Standard Schema Specification](https://github.com/standard-schema/standard-schema)
- [Zod Documentation](https://zod.dev/)
- [Valibot Documentation](https://valibot.dev/)
- [ArkType Documentation](https://arktype.io/)
- [Vest vs. the Rest](https://vestjs.dev/docs/vest_vs_the_rest)
