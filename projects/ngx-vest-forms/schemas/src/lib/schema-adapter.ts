/* eslint-disable @typescript-eslint/no-explicit-any */ /// Allow any for schema validation
import type { StandardSchemaV1 } from '@standard-schema/spec';

/// --- Core Types ---

/**
 * Represents a StandardSchemaV1-compatible schema definition.
 *
 * @description
 * This type works with schema libraries that implement the Standard Schema spec,
 * including Zod, Valibot, ArkType, or schemas created with `ngxModelToStandardSchema`.
 *
 * **Why use this type?**
 * - Provides a consistent interface for different schema libraries
 * - Enables flexible schema validation strategies (Zod, Valibot, etc.)
 * - Simplifies code by abstracting implementation details
 *
 * **How to use it:**
 * ```typescript
 * /// With third-party libraries
 * import { z } from 'zod';
 * const mySchema: SchemaDefinition<User> = z.object({...});
 *
 * /// Or with the built-in utility
 * const mySchema: SchemaDefinition<User> = ngxModelToStandardSchema({...});
 * ```
 *
 * @template T The output type that the schema validates to
 */
export type SchemaDefinition<T = any> = StandardSchemaV1<any, T>;

/**
 * Infers the output type from a StandardSchemaV1 definition.
 *
 * @description
 * Extracts the type that a schema validates to, allowing you to use
 * the schema's type in your TypeScript code.
 *
 * **Why use this type?**
 * - Get precise TypeScript types without duplicating type definitions
 * - Maintain DRY principle by deriving types from schemas
 * - Ensure type consistency between schema validation and component code
 *
 * **How to use it:**
 * ```typescript
 * /// Create a schema
 * const userSchema = z.object({ name: z.string() });
 *
 * /// Extract its type
 * type User = InferSchemaType<typeof userSchema>;
 * /// Now User = { name: string }
 * ```
 *
 * @template T The schema to extract the type from
 */
export type InferSchemaType<T extends SchemaDefinition | null | undefined> =
  T extends StandardSchemaV1 ? StandardSchemaV1.InferOutput<T> : any;

/// --- Type Guards ---

/**
 * Checks if a value implements the StandardSchemaV1 interface.
 *
 * @description
 * Type guard that determines if a value is a valid StandardSchemaV1-compatible schema
 * by checking for the presence of the '~standard' property.
 *
 * @param value The value to check
 * @returns True if the value is a StandardSchemaV1-compatible schema
 */
export function isStandardSchema<T = unknown>(
  value: any,
): value is StandardSchemaV1<any, T> {
  /// Standard check for schema libraries (Zod, Valibot, ArkType, etc.)
  /// Compliant libraries should have the '~standard' property.
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value['~standard'] === 'object' &&
    value['~standard'] !== null
  );
}

/// --- Helper for Custom Shapes ---

/**
 * Creates a StandardSchemaV1-compatible schema from a plain object template.
 *
 * @description
 * Transforms a regular TypeScript object into a StandardSchemaV1 schema with minimal
 * runtime validation (basic object type checking). This function bridges the gap between
 * simple object templates and the Standard Schema specification without requiring
 * external schema libraries.
 *
 * **Why use this function?**
 * - Zero dependencies: No need for Zod, Valibot, or other schema libraries
 * - Type inference: Full TypeScript type safety using your object template
 * - Simplified development: Quick prototyping with minimal boilerplate
 * - Lightweight validation: Basic type checking without complex validation rules
 * - Compatibility: Works with any StandardSchemaV1-compatible tools and libraries
 *
 * **How it works:**
 * The function creates a StandardSchemaV1-compatible wrapper around your template object.
 * At runtime, it only validates that inputs are non-null objects. The original template
 * is preserved as `_shape` for reference, while TypeScript uses it for type inference.
 *
 * **Limitations:**
 * - Only validates that the value is an object (not null or primitive)
 * - Does not validate object structure, property types, or nested values
 * - For comprehensive validation, consider using Zod, Valibot, or another schema library
 *
 * @example
 * ```typescript
 * /// Define a template object with default values
 * const userTemplate = {
 *   name: '',
 *   email: '',
 *   age: 0,
 *   isActive: false
 * };
 *
 * /// Create a StandardSchema from the template
 * const userSchema = ngxModelToStandardSchema(userTemplate);
 *
 * /// Use with ngx-vest-forms
 * @Component({
 *   template: `
 *     <form ngxVestForm [formSchema]="userSchema">
 *       <input name="name" ngModel required>
 *       <input name="email" type="email" ngModel required>
 *       <input name="age" type="number" ngModel>
 *       <input name="isActive" type="checkbox" ngModel>
 *     </form>
 *   `
 * })
 * export class UserFormComponent {
 *   userSchema = userSchema;
 * }
 * ```
 *
 * @param modelTemplate - The plain object template representing the data structure
 * @returns A StandardSchemaV1-compatible schema that performs basic validation
 */
export function ngxModelToStandardSchema<T extends Record<string, unknown>>(
  model: T,
): StandardSchemaV1<T, T> & { _shape: T } {
  return {
    ['~standard']: {
      version: 1,
      validate: (data: unknown) => {
        const isObject =
          typeof data === 'object' && data !== null && !Array.isArray(data);
        if (!isObject) {
          return {
            // Minimal failure shape compatible with StandardSchemaV1
            issues: [
              {
                path: '',
                message: 'Expected an object',
              },
            ],
          };
        }

        return { value: data as T };
      },
      vendor: 'ngx-model',
    },
    // Preserve original template for dev-time extraction/migration from v1
    _shape: model,
    // Retain spreading of model keys for backward-compatibility (no runtime reliance)
    ...model,
  } as unknown as StandardSchemaV1<T, T> & { _shape: T };
}

/**
 * @deprecated Use `ngxModelToStandardSchema` instead.
 *
 * Alias for `ngxModelToStandardSchema` - converts a plain object into a StandardSchemaV1-compatible schema.
 */
export const shapeToSchema = ngxModelToStandardSchema;

/**
 * Extracts a plain object template from a StandardSchemaV1-compatible schema.
 *
 * @description
 * This function attempts to extract a template/shape from a schema, primarily
 * for schemas created with `ngxModelToStandardSchema` which store the original
 * template as the `_shape` property. For other schema types (Zod, Valibot, ArkType),
 * this function returns null since they don't contain extractable plain object templates.
 *
 * **Why use this function?**
 * - Runtime validation: Extract templates for form structure validation
 * - Development aid: Enable detection of typos in ngModel/ngModelGroup names
 * - Schema introspection: Access the original template from schema definitions
 *
 * **How it works:**
 * - Checks if the schema has a `_shape` property (from `ngxModelToStandardSchema`)
 * - Returns the extracted template if found, or null otherwise
 * - Used internally by NgxFormDirective for runtime form structure validation
 *
 * **Limitations:**
 * - Only works with schemas created via `ngxModelToStandardSchema`
 * - Returns null for third-party schema libraries (Zod, Valibot, ArkType)
 * - Does not perform any validation, only template extraction
 *
 * @example
 * ```typescript
 * /// Create a schema with ngxModelToStandardSchema
 * const userTemplate = { name: '', email: '', age: 0 };
 * const userSchema = ngxModelToStandardSchema(userTemplate);
 *
 * /// Extract the template back from the schema
 * const extractedTemplate = ngxExtractTemplateFromSchema(userSchema);
 * /// extractedTemplate = { name: '', email: '', age: 0 }
 *
 * /// For third-party schemas, returns null
 * const zodSchema = z.object({ name: z.string() });
 * const noTemplate = ngxExtractTemplateFromSchema(zodSchema);
 * /// noTemplate = null
 * ```
 *
 * @param schema - The StandardSchemaV1-compatible schema to extract the template from
 * @returns The extracted template object, or null if no template can be extracted
 */
export function ngxExtractTemplateFromSchema<T = any>(
  schema: SchemaDefinition<T> | null | undefined,
): T | null {
  if (!schema) return null;

  // Check if this is a schema created with ngxModelToStandardSchema
  // which stores the original template as _shape
  if ('_shape' in schema && typeof schema._shape === 'object') {
    return schema._shape as T;
  }

  // For other schema types (Zod, Valibot, ArkType), no template can be extracted
  return null;
}
