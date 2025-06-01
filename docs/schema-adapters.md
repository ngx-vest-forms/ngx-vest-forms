# Schema Adapters in ngx-vest-forms

## Introduction

Schema adapters provide a powerful way to integrate type-safe schema validation with ngx-vest-forms. They bridge the gap between your data model and validation logic, ensuring consistency and type safety throughout your forms.

The `schema-adapter.ts` module in ngx-vest-forms provides utilities that allow you to:

1. Use schema libraries like Zod, Valibot, or ArkType for runtime validation
2. Generate TypeScript types from your schemas
3. Create simple schema definitions from object templates
4. Provide stricter type checking for your form values and validation suites

## Key Benefits

- **Type Safety:** Catch errors at compile time instead of runtime
- **Consistency:** Ensure your form values match your validation logic
- **IDE Support:** Get better autocomplete and IntelliSense
- **Flexibility:** Choose from different schema libraries or use simple object templates
- **Framework Agnostic:** Reuse validation logic across different technologies

## Core Types

### `SchemaDefinition<T>`

A type that represents a StandardSchemaV1-compatible schema definition. Works with schema libraries that implement the Standard Schema spec, including Zod, Valibot, and ArkType.

```typescript
import { z } from 'zod';
import { SchemaDefinition } from 'ngx-vest-forms';

// Using Zod
const userSchema: SchemaDefinition<User> = z.object({
  name: z.string(),
  email: z.string().email(),
  age: z.number().min(18),
});

// Now userSchema can be used with [formSchema]
```

### `VestSuite<T>`

A type that represents a Vest validation suite compatible with your schema.

```typescript
import { VestSuite } from 'ngx-vest-forms';
import { create, test, enforce } from 'vest';

// Define the suite with proper typing
const userValidation: VestSuite<User> = create((data: User = {}) => {
  test('name', 'Name is required', () => {
    enforce(data.name).isNotBlank();
  });

  test('email', 'Valid email required', () => {
    enforce(data.email).isEmail();
  });

  test('age', 'Must be 18 or older', () => {
    enforce(data.age).greaterThanOrEquals(18);
  });
});
```

### `InferSchemaType<T>`

Extracts the output type from a schema definition, allowing you to use the schema's type in your TypeScript code.

```typescript
import { z } from 'zod';
import { InferSchemaType } from 'ngx-vest-forms';

const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

// Extract the type from the schema
type User = InferSchemaType<typeof userSchema>;
// Equivalent to: type User = { name: string; email: string; }
```

## Utility Functions

### `modelToStandardSchema<T>`

Creates a StandardSchemaV1-compatible schema from a simple object template. This is the simplest way to get schema-like benefits without external dependencies.

```typescript
import { modelToStandardSchema } from 'ngx-vest-forms';
import { Component, signal } from '@angular/core';
import { ngxVestForms } from 'ngx-vest-forms';

// Define a template with the desired structure
const userTemplate = {
  name: '',
  email: '',
  age: 0,
};

// Create a schema from the template
const userSchema = modelToStandardSchema(userTemplate);

// Use with a form
@Component({
  selector: 'app-user-form',
  imports: [ngxVestForms],
  template: `
    <form ngxVestForm [formSchema]="userSchema" [(formValue)]="userData">
      <input name="name" ngModel />
      <input name="email" type="email" ngModel />
      <input name="age" type="number" ngModel />
    </form>
  `,
})
export class UserFormComponent {
  protected readonly userSchema = userSchema;
  protected readonly userData = signal(userTemplate);
}
```

### `isStandardSchema<T>`

A type guard that determines if a value is a valid StandardSchemaV1-compatible schema.

```typescript
import { isStandardSchema } from 'ngx-vest-forms';

function processSchema(schema: unknown) {
  if (isStandardSchema(schema)) {
    // It's a valid schema, you can use it with ngx-vest-forms
    return true;
  }
  return false;
}
```

### `extractTemplateFromSchema<T>`

Extracts a plain object template from a StandardSchemaV1-compatible schema. This function is primarily used internally by the FormDirective for runtime form structure validation, but can also be useful for advanced scenarios where you need to introspect schema templates.

```typescript
import {
  modelToStandardSchema,
  extractTemplateFromSchema,
} from 'ngx-vest-forms';
import { z } from 'zod';

// Create a schema with modelToStandardSchema
const userTemplate = { name: '', email: '', age: 0 };
const userSchema = modelToStandardSchema(userTemplate);

// Extract the template back from the schema
const extractedTemplate = extractTemplateFromSchema(userSchema);
// extractedTemplate = { name: '', email: '', age: 0 }

// For third-party schemas (Zod, Valibot, ArkType), returns null
const zodSchema = z.object({ name: z.string() });
const noTemplate = extractTemplateFromSchema(zodSchema);
// noTemplate = null
```

**Key Features:**

- **Runtime validation support**: Enables the FormDirective to validate form structure against schema templates
- **Development aid**: Helps catch typos in `ngModel` and `ngModelGroup` names during development
- **Schema introspection**: Allows access to the original template from schemas created with `modelToStandardSchema`
- **Selective extraction**: Only works with schemas created via `modelToStandardSchema`; returns `null` for other schema types

**When to use:**

- You need to programmatically access the template structure from a schema
- Building custom form validation utilities that need template introspection
- Advanced debugging scenarios where you need to verify schema structure

**Limitations:**

- Only extracts templates from schemas created with `modelToStandardSchema`
- Returns `null` for third-party schema libraries (Zod, Valibot, ArkType)
- Does not perform validation, only template extraction

## Schema Library Integrations

### Zod Integration

Zod is a TypeScript-first schema validation library that integrates seamlessly with ngx-vest-forms:

```typescript
import { Component, signal } from '@angular/core';
import { ngxVestForms } from 'ngx-vest-forms';
import { z } from 'zod';
import { create, test, enforce } from 'vest';

// Define Zod schema
const userZodSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().min(18),
  profile: z.object({
    bio: z.string().optional(),
    avatar: z.string().url().optional(),
  }),
});

// Extract the TypeScript type
type UserZodType = z.infer<typeof userZodSchema>;

// Create Vest validation suite with proper typing
const userValidation = create((data: UserZodType = {}) => {
  test('name', 'Name is required', () => {
    enforce(data.name).isNotBlank();
  });

  test('email', 'Valid email required', () => {
    enforce(data.email).isEmail();
  });

  test('age', 'Must be 18 or older', () => {
    enforce(data.age).greaterThanOrEquals(18);
  });

  test('profile.bio', 'Bio should be under 500 characters', () => {
    if (data.profile?.bio) {
      enforce(data.profile.bio).shorterThan(500);
    }
  });
});

// Use in component
@Component({
  selector: 'app-user-form-zod',
  imports: [ngxVestForms],
  template: `
    <form
      ngxVestForm
      [formSchema]="userZodSchema"
      [vestSuite]="userValidation"
      [(formValue)]="formValue"
    >
      <input name="name" ngModel />
      <input name="email" type="email" ngModel />
      <input name="age" type="number" ngModel />

      <div ngModelGroup="profile">
        <textarea
          name="bio"
          ngModel
          placeholder="Tell us about yourself"
        ></textarea>
        <input name="avatar" type="url" ngModel placeholder="Avatar URL" />
      </div>
    </form>
  `,
})
export class UserFormZodComponent {
  readonly userZodSchema = userZodSchema;
  readonly userValidation = userValidation;

  readonly formValue = signal<UserZodType>({
    name: '',
    email: '',
    age: 0,
    profile: {},
  });
}
```

### Valibot Integration

Valibot is a modular and type-safe schema library:

```typescript
import { Component, signal } from '@angular/core';
import { ngxVestForms } from 'ngx-vest-forms';
import * as v from 'valibot';
import { create, test, enforce } from 'vest';

// Define Valibot schema
const userValibotSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1)),
  email: v.pipe(v.string(), v.email()),
  age: v.pipe(v.number(), v.minValue(18)),
  preferences: v.object({
    theme: v.union([v.literal('light'), v.literal('dark')]),
    notifications: v.boolean(),
  }),
});

// Extract the TypeScript type
type UserValibotType = v.InferInput<typeof userValibotSchema>;

// Create Vest validation suite
const userValidation = create((data: UserValibotType = {}) => {
  test('name', 'Name is required', () => {
    enforce(data.name).isNotBlank();
  });

  test('email', 'Valid email required', () => {
    enforce(data.email).isEmail();
  });

  test('age', 'Must be 18 or older', () => {
    enforce(data.age).greaterThanOrEquals(18);
  });

  test('preferences.theme', 'Please select a theme', () => {
    enforce(data.preferences?.theme).inside(['light', 'dark']);
  });
});

// Use in component
@Component({
  selector: 'app-user-form-valibot',
  imports: [ngxVestForms],
  template: `
    <form
      ngxVestForm
      [formSchema]="userValibotSchema"
      [vestSuite]="userValidation"
      [(formValue)]="formValue"
    >
      <input name="name" ngModel />
      <input name="email" type="email" ngModel />
      <input name="age" type="number" ngModel />

      <div ngModelGroup="preferences">
        <select name="theme" ngModel>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
        <label>
          <input name="notifications" type="checkbox" ngModel />
          Enable notifications
        </label>
      </div>
    </form>
  `,
})
export class UserFormValibotComponent {
  readonly userValibotSchema = userValibotSchema;
  readonly userValidation = userValidation;

  readonly formValue = signal<UserValibotType>({
    name: '',
    email: '',
    age: 0,
    preferences: {
      theme: 'light',
      notifications: false,
    },
  });
}
```

### ArkType Integration

ArkType provides highly optimized runtime validation:

```typescript
import { Component, signal } from '@angular/core';
import { ngxVestForms } from 'ngx-vest-forms';
import { type } from 'arktype';
import { create, test, enforce } from 'vest';

// Define ArkType schema
const userArkTypeSchema = type({
  name: 'string>0',
  email: 'string.email',
  age: 'number>=18',
  settings: {
    language: '"en" | "es" | "fr"',
    timezone: 'string',
  },
});

// Extract the TypeScript type
type UserArkTypeType = typeof userArkTypeSchema.infer;

// Create Vest validation suite
const userValidation = create((data: UserArkTypeType = {}) => {
  test('name', 'Name is required', () => {
    enforce(data.name).isNotBlank();
  });

  test('email', 'Valid email required', () => {
    enforce(data.email).isEmail();
  });

  test('age', 'Must be 18 or older', () => {
    enforce(data.age).greaterThanOrEquals(18);
  });

  test('settings.language', 'Please select a language', () => {
    enforce(data.settings?.language).inside(['en', 'es', 'fr']);
  });
});

// Use in component
@Component({
  selector: 'app-user-form-arktype',
  imports: [ngxVestForms],
  template: `
    <form
      ngxVestForm
      [formSchema]="userArkTypeSchema"
      [vestSuite]="userValidation"
      [(formValue)]="formValue"
    >
      <input name="name" ngModel />
      <input name="email" type="email" ngModel />
      <input name="age" type="number" ngModel />

      <div ngModelGroup="settings">
        <select name="language" ngModel>
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
        </select>
        <input name="timezone" ngModel placeholder="Your timezone" />
      </div>
    </form>
  `,
})
export class UserFormArkTypeComponent {
  readonly userArkTypeSchema = userArkTypeSchema;
  readonly userValidation = userValidation;

  readonly formValue = signal<UserArkTypeType>({
    name: '',
    email: '',
    age: 0,
    settings: {
      language: 'en',
      timezone: '',
    },
  });
}
```

## Advanced Use Cases

### Complex Nested Forms

When working with complex nested structures, schema adapters help maintain type safety throughout:

```typescript
import { Component, signal } from '@angular/core';
import { ngxVestForms } from 'ngx-vest-forms';
import { z } from 'zod';
import { create, test, enforce, group } from 'vest';

// Complex nested schema
const businessHoursZodSchema = z.object({
  businessHours: z.record(
    z.enum([
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ]),
    z.object({
      isOpen: z.boolean(),
      openTime: z.string().optional(),
      closeTime: z.string().optional(),
    }),
  ),
});

type BusinessHoursZodType = z.infer<typeof businessHoursZodSchema>;

// Validation with nested logic
const businessHoursValidation = create((data: BusinessHoursZodType = {}) => {
  // Validate each day's business hours
  Object.entries(data.businessHours || {}).forEach(([day, hours]) => {
    group(`businessHours.${day}`, () => {
      if (hours.isOpen) {
        test('openTime', `${day} open time is required when open`, () => {
          enforce(hours.openTime).isNotBlank();
        });

        test('closeTime', `${day} close time is required when open`, () => {
          enforce(hours.closeTime).isNotBlank();
        });

        test('timeOrder', `${day} close time must be after open time`, () => {
          if (hours.openTime && hours.closeTime) {
            const open = new Date(`2000-01-01 ${hours.openTime}`);
            const close = new Date(`2000-01-01 ${hours.closeTime}`);
            enforce(close.getTime()).greaterThan(open.getTime());
          }
        });
      }
    });
  });
});

@Component({
  selector: 'app-business-hours-form',
  imports: [ngxVestForms],
  template: `
    <form
      ngxVestForm
      [formSchema]="businessHoursZodSchema"
      [vestSuite]="businessHoursValidation"
      [(formValue)]="formValue"
    >
      <div ngModelGroup="businessHours">
        @for (day of days; track day) {
          <div [ngModelGroup]="day">
            <label>
              <input name="isOpen" type="checkbox" ngModel />
              {{ day | titlecase }}
            </label>

            @if (formValue().businessHours?.[day]?.isOpen) {
              <input name="openTime" type="time" ngModel />
              <input name="closeTime" type="time" ngModel />
            }
          </div>
        }
      </div>
    </form>
  `,
})
export class BusinessHoursFormZodComponent {
  readonly businessHoursZodSchema = businessHoursZodSchema;
  readonly businessHoursValidation = businessHoursValidation;

  readonly days = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ] as const;

  readonly formValue = signal<BusinessHoursZodType>({
    businessHours: {},
  });
}
```

## Accessing Form Values with formState()

The `formState()` signal provided by ngx-vest-forms is fully type-safe when used with schema adapters. This section demonstrates how to access form values using `formState().value` in a type-safe manner.

### Basic Example with modelToStandardSchema

```typescript
import { Component, viewChild, signal } from '@angular/core';
import {
  ngxVestForms,
  FormDirective,
  modelToStandardSchema,
} from 'ngx-vest-forms';

@Component({
  selector: 'app-user-form',
  imports: [ngxVestForms],
  template: `
    <form
      ngxVestForm
      [formSchema]="userSchema"
      [(formValue)]="userData"
      #userForm="ngxVestForm"
    >
      <!-- Access values via formState().value -->
      <div>
        <label for="name">Name</label>
        <input
          id="name"
          name="name"
          [ngModel]="userForm.formState().value?.name"
          type="text"
        />
      </div>

      <div>
        <label for="email">Email</label>
        <input
          id="email"
          name="email"
          [ngModel]="userForm.formState().value?.email"
          type="email"
        />
      </div>

      <!-- Using formState for validation feedback -->
      @if (userForm.formState().errors?.email) {
        <div class="error">{{ userForm.formState().errors.email }}</div>
      }

      <!-- Disable button based on form state -->
      <button
        type="submit"
        [disabled]="userForm.formState().invalid"
        (click)="submit()"
      >
        Submit
      </button>
    </form>
  `,
})
export class UserFormComponent {
  // Define template and create schema
  protected readonly userTemplate = {
    name: '',
    email: '',
  };

  protected readonly userSchema = modelToStandardSchema(this.userTemplate);
  protected readonly userData = signal(this.userTemplate);

  // For programmatic access to form directive
  protected readonly userFormDirective = viewChild.required(FormDirective);

  protected submit(): void {
    // Access the current form value in a type-safe way
    const formValue = this.userFormDirective().formState().value;

    if (formValue && this.userFormDirective().formState().valid) {
      // Type-safe access to form values
      console.log('Submitting:', formValue.name, formValue.email);
    }
  }
}
```

### With Zod Schema

When using Zod or other schema libraries, formState().value maintains proper typing:

```typescript
import { Component, viewChild, signal } from '@angular/core';
import { ngxVestForms, FormDirective } from 'ngx-vest-forms';
import { z } from 'zod';

// Define Zod schema
const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
});

// Infer the type from schema
type User = z.infer<typeof userSchema>;

@Component({
  selector: 'app-user-form',
  imports: [ngxVestForms],
  template: `
    <form
      ngxVestForm
      [formSchema]="userSchema"
      [(formValue)]="userData"
      #userForm="ngxVestForm"
    >
      <!-- Form fields using formState().value -->
      <input name="name" [ngModel]="userForm.formState().value?.name" />
      <input name="email" [ngModel]="userForm.formState().value?.email" />

      <button type="submit" (click)="logFormState()">Submit</button>
    </form>
  `,
})
export class UserFormComponent {
  protected readonly userSchema = userSchema;
  protected readonly userData = signal<User>({
    name: '',
    email: '',
  });

  protected readonly userFormDirective = viewChild.required(
    FormDirective<typeof userSchema, User>,
  );

  // Now formState().value is fully typed as User
  protected logFormState(): void {
    const formValue = this.userFormDirective().formState().value;
    // Type-safe access with autocompletion
    if (formValue) {
      console.log(formValue.name, formValue.email);
    }
  }
}
```

### Benefits of Using formState().value with Schema Adapters

1. **Type Safety**: Get full TypeScript autocompletion and error checking
2. **Unified API**: Access values, errors, and form state from a single source
3. **Reactivity**: The formState signal updates automatically with form changes
4. **Consistency**: UI always reflects the current state of the form

## Combining Schema Validation with Vest

While schema libraries like Zod provide validation rules, Vest excels at business logic validation. You can combine them for the best of both worlds:

```typescript
import { Component, signal } from '@angular/core';
import { ngxVestForms } from 'ngx-vest-forms';
import { z } from 'zod';
import { staticSuite, test, enforce, only } from 'vest';

// Schema for type safety and basic validation
const userSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(8),
  confirmPassword: z.string(),
});

type User = z.infer<typeof userSchema>;

// Vest suite for business logic validation
const userValidation = staticSuite(
  (model: User = {} as User, field?: string) => {
    if (field) {
      only(field);
    }

    // Business logic validation
    test('password', 'Password must contain a number', () => {
      enforce(model.password).matches(/[0-9]/);
    });

    test('confirmPassword', 'Passwords must match', () => {
      enforce(model.confirmPassword).equals(model.password);
    });
  },
);

// Use both in your component:
@Component({
  selector: 'app-user-form',
  imports: [ngxVestForms],
  template: `
    <form
      ngxVestForm
      [formSchema]="userSchema"
      [vestSuite]="userValidation"
      [(formValue)]="userData"
    >
      <input name="username" ngModel />
      <input name="password" type="password" ngModel />
      <input name="confirmPassword" type="password" ngModel />
    </form>
  `,
})
export class UserFormComponent {
  protected readonly userSchema = userSchema;
  protected readonly userValidation = userValidation;
  protected readonly userData = signal<User>({
    username: '',
    password: '',
    confirmPassword: '',
  });
}
```

## Best Practices

1. **Choose the right schema library** for your needs:

   - **Zod**: Full-featured, robust validation with excellent TypeScript support
   - **Valibot**: Lighter alternative to Zod with modular design
   - **ArkType**: Performance-focused validation with TypeScript-first approach
   - **modelToStandardSchema**: Simplest option for basic type safety without external dependencies

2. **Separate concerns**:

   - Use schema libraries for type validation and basic constraints
   - Use Vest for business logic and complex validation rules

3. **Reuse schemas** across your application:

   - Define schemas in separate files
   - Import and use them in multiple components
   - Share validation logic between frontend and backend

4. **Leverage type inference**:

   - Let TypeScript infer types from your schemas
   - Use those types in your signals and validation suites

5. **Use optional chaining** when accessing nested properties:

   ```html
   <input [ngModel]="form.formState().value?.address?.street" />
   ```

6. **Always check formState().valid** before submitting data to ensure data integrity

7. **Use viewChild with proper generic types** for better type inference when accessing FormDirective programmatically

## Migration Guide

### From Basic Forms to Schema Adapters

If you're migrating from basic forms to schema adapters, here's a step-by-step approach:

1. **Start with modelToStandardSchema** for minimal changes:

   ```typescript
   // Before
   userData = signal({ name: '', email: '' });

   // After
   userTemplate = { name: '', email: '' };
   userSchema = modelToStandardSchema(this.userTemplate);
   userData = signal(this.userTemplate);
   ```

2. **Add the formSchema binding**:

   ```html
   <!-- Before -->
   <form ngxVestForm [(formValue)]="userData">
     <!-- After -->
     <form
       ngxVestForm
       [formSchema]="userSchema"
       [(formValue)]="userData"
     ></form>
   </form>
   ```

3. **Gradually move to more powerful schema libraries** as needed:

   ```typescript
   // Upgrade to Zod when you need more validation
   const userSchema = z.object({
     name: z.string().min(1),
     email: z.string().email(),
   });
   ```

## Conclusion

Schema adapters in ngx-vest-forms provide a powerful way to enhance your form development with type safety, validation, and better developer experience. Whether you prefer simple templates or full-featured schema libraries, the schema adapter system gives you flexibility while maintaining a consistent API.

By combining schema validation with Vest's business logic validation, you can build robust, maintainable forms that catch errors early and provide excellent user experiences.
