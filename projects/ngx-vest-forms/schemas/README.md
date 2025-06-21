# ngx-vest-forms/schemas

**Schema utilities for ngx-vest-forms** - Type-safe schema integration with popular validation libraries.

## Overview

The `ngx-vest-forms/schemas` entry point provides powerful schema utilities that enhance your forms with robust type safety and runtime validation. This secondary entry point keeps the core library lean while offering advanced schema integration capabilities for users who need them.

## When You Need Schemas

- **Type Safety**: Get compile-time checks for form structure and values
- **Runtime Validation**: Validate user input against schema constraints
- **Multiple Schema Libraries**: Works with Zod, Valibot, ArkType, or simple object templates
- **Developer Experience**: Improved IntelliSense and error detection in your IDE
- **Shared Validation**: Use the same validation logic between frontend and backend

## Installation

The schemas utilities are included when you install `ngx-vest-forms`:

```bash
npm install ngx-vest-forms
```

## Usage

Import schema utilities from the dedicated entry point:

```typescript
import {
  ngxModelToStandardSchema,
  InferSchemaType,
  SchemaDefinition,
  ngxExtractTemplateFromSchema,
  isStandardSchema,
} from 'ngx-vest-forms/schemas';
```

## API Reference

### Types

#### `SchemaDefinition<T>`

Represents a StandardSchemaV1-compatible schema definition that works with Zod, Valibot, ArkType, or schemas created with `ngxModelToStandardSchema`.

#### `InferSchemaType<T>`

Infers the output type from a StandardSchemaV1 definition, allowing you to derive TypeScript types from schemas.

### Functions

#### `ngxModelToStandardSchema<T>(template: T)`

Creates a StandardSchemaV1-compatible schema from a plain object template with minimal runtime validation.

```typescript
const userTemplate = {
  name: '',
  email: '',
  age: 0,
  isActive: false,
};

const userSchema = ngxModelToStandardSchema(userTemplate);
// Now userSchema is StandardSchemaV1-compatible with full type inference
```

#### `isStandardSchema(value: any)`

Type guard that determines if a value is a valid StandardSchemaV1-compatible schema.

```typescript
if (isStandardSchema(someValue)) {
  // TypeScript knows someValue is a StandardSchemaV1 schema
}
```

#### `ngxExtractTemplateFromSchema<T>(schema: SchemaDefinition<T>)`

Extracts a plain object template from schemas created with `ngxModelToStandardSchema`. Returns `null` for third-party schemas.

```typescript
const template = ngxExtractTemplateFromSchema(userSchema);
// Returns the original template object or null
```

#### `shapeToSchema<T>(template: T)` ⚠️ Deprecated

Alias for `ngxModelToStandardSchema`. Use `ngxModelToStandardSchema` instead.

## Examples

### Basic Object Template Schema

```typescript
import { Component, signal } from '@angular/core';
import { ngxVestForms } from 'ngx-vest-forms';
import {
  ngxModelToStandardSchema,
  InferSchemaType,
} from 'ngx-vest-forms/schemas';

const userTemplate = {
  name: '',
  email: '',
  age: 0,
};

const userSchema = ngxModelToStandardSchema(userTemplate);
type User = InferSchemaType<typeof userSchema>;

@Component({
  standalone: true,
  imports: [ngxVestForms],
  template: `
    <form ngxVestForm [formSchema]="userSchema" [(formValue)]="userData">
      <input name="name" ngModel placeholder="Name" />
      <input name="email" type="email" ngModel placeholder="Email" />
      <input name="age" type="number" ngModel placeholder="Age" />
    </form>
  `,
})
export class UserFormComponent {
  protected readonly userSchema = userSchema;
  protected readonly userData = signal<User>(userTemplate);
}
```

### Using with Zod

```typescript
import { z } from 'zod';
import { InferSchemaType } from 'ngx-vest-forms/schemas';

const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  age: z.number().min(0).max(120),
});

type User = InferSchemaType<typeof userSchema>;

@Component({
  template: `
    <form ngxVestForm [formSchema]="userSchema" [(formValue)]="userData">
      <!-- form fields -->
    </form>
  `,
})
export class UserFormComponent {
  protected readonly userSchema = userSchema;
  protected readonly userData = signal<User>({ name: '', email: '', age: 0 });
}
```

### Using with Valibot

```typescript
import * as v from 'valibot';
import { InferSchemaType } from 'ngx-vest-forms/schemas';

const userSchema = v.object({
  name: v.pipe(v.string(), v.minLength(2)),
  email: v.pipe(v.string(), v.email()),
  age: v.pipe(v.number(), v.minValue(0), v.maxValue(120)),
});

type User = InferSchemaType<typeof userSchema>;
```

### Using with ArkType

```typescript
import { type } from 'arktype';
import { InferSchemaType } from 'ngx-vest-forms/schemas';

const userSchema = type({
  name: 'string>1',
  email: 'string.email',
  age: 'number>=0',
});

type User = InferSchemaType<typeof userSchema>;
```

## Key Benefits

### Zero Dependencies

- `ngxModelToStandardSchema` requires no external schema libraries
- Works with plain TypeScript objects for simple use cases

### Flexible Integration

- Compatible with any StandardSchemaV1-compliant library
- Easy migration between different schema libraries

### Type Safety

- Full TypeScript type inference from schemas
- Compile-time validation of form structure

### Runtime Validation

- Optional runtime validation capabilities
- Integration with form validation workflows

## Best Practices

1. **Use schemas for complex forms**: For simple forms, plain object models may be sufficient
2. **Prefer established libraries**: Zod, Valibot, and ArkType offer more validation features than `ngxModelToStandardSchema`
3. **Share schemas**: Use the same schemas for frontend forms and backend validation
4. **Type inference**: Leverage `InferSchemaType` to derive types from schemas rather than defining them separately

## Migration from Core

If you were previously importing schema utilities from the core `ngx-vest-forms` package:

```typescript
// Before
import { ngxModelToStandardSchema, InferSchemaType } from 'ngx-vest-forms';

// After
import {
  ngxModelToStandardSchema,
  InferSchemaType,
} from 'ngx-vest-forms/schemas';
```

## Related Documentation

- [Main ngx-vest-forms README](../README.md)
- [Schema Adapters Documentation](../../../docs/schema-adapters.md)
- [Core Library API](../src/public-api.ts)

## Resources

- [Standard Schema Specification](https://github.com/standard-schema/standard-schema)
- [Zod Documentation](https://zod.dev/)
- [Valibot Documentation](https://valibot.dev/)
- [ArkType Documentation](https://arktype.io/)
