/**
 * Primitive types that should not be traversed for nested paths
 */
type Primitive = string | number | boolean | Date | null | undefined;

/**
 * Helper type to extract the element type from an array.
 * Used internally for type inference with array paths.
 *
 * @template T - The array type to extract from
 * @example
 * ```typescript
 * type Element = ArrayElement<string[]>; // Result: string
 * type Element2 = ArrayElement<NotArray>; // Result: never
 * ```
 */

/**
 * Recursively generates all valid field paths for a type as string literals.
 * This provides full IDE autocomplete and compile-time validation for field names.
 *
 * **Key Features:**
 * - Supports nested objects with dot notation (e.g., 'user.address.city')
 * - Works with optional properties from DeepPartial types
 * - Handles arrays and readonly arrays
 * - Stops recursion at primitive types
 * - Maximum depth of 10 levels to prevent infinite recursion
 *
 * **Type Safety Benefits:**
 * - IDE autocomplete for all valid field paths
 * - Compile-time errors for typos in field names
 * - Refactoring support (rename property → all usages update)
 * - Self-documenting code through type inference
 *
 * @template T - The model type to extract field paths from
 * @template Prefix - Internal recursion prefix (do not use directly)
 * @template Depth - Internal depth counter to prevent infinite recursion
 *
 * @example
 * ```typescript
 * type Model = {
 *   name: string;
 *   profile: {
 *     age: number;
 *     address: {
 *       city: string;
 *     }
 *   }
 * };
 *
 * type Paths = FieldPath<Model>;
 * /// Result: 'name' | 'profile' | 'profile.age' | 'profile.address' | 'profile.address.city'
 * ```
 *
 * @example With DeepPartial
 * ```typescript
 * type FormModel = DeepPartial<{
 *   user: {
 *     email: string;
 *     phone: string;
 *   }
 * }>;
 *
 * type Paths = FieldPath<FormModel>;
 * /// Result: 'user' | 'user.email' | 'user.phone'
 * ```
 */
export type FieldPath<
  T,
  Prefix extends string = '',
  Depth extends readonly number[] = [],
> = Depth['length'] extends 10
  ? never // Max depth reached, prevent infinite recursion
  : T extends Primitive
    ? never // Don't traverse primitives
    : T extends readonly (infer U)[]
      ? // For arrays, generate paths for the element type
        FieldPath<U, Prefix, [...Depth, 1]>
      : {
          [K in keyof T & string]: T[K] extends Primitive
            ? // Primitive property: just the field name
              `${Prefix}${K}`
            : T[K] extends readonly (infer U)[]
              ? // Array property: field name plus element paths
                | `${Prefix}${K}`
                  | (U extends Primitive
                      ? never
                      : FieldPath<U, `${Prefix}${K}.`, [...Depth, 1]>)
              : // Object property: field name plus nested paths
                | `${Prefix}${K}`
                  | FieldPath<T[K], `${Prefix}${K}.`, [...Depth, 1]>;
        }[keyof T & string];

/**
 * Type-safe validation configuration map.
 * Maps trigger field paths to arrays of dependent field paths that should be revalidated.
 *
 * **Use Case:**
 * Define which fields should trigger validation of other fields when they change.
 * For example, when password changes, confirmPassword should be revalidated.
 *
 * **Type Safety:**
 * - All keys must be valid field paths from the model
 * - All dependent field paths must be valid
 * - IDE autocomplete works for both keys and values
 * - Compile-time errors for invalid field references
 *
 * @template T - The form model type
 *
 * @example
 * ```typescript
 * type FormModel = DeepPartial<{
 *   password: string;
 *   confirmPassword: string;
 *   addresses: {
 *     billing: { city: string; }
 *   }
 * }>;
 *
 * /// ✅ Type-safe configuration with autocomplete
 * const config: ValidationConfigMap<FormModel> = {
 *   password: ['confirmPassword'],
 *   'addresses.billing.city': ['password'],
 * };
 *
 * /// ❌ TypeScript error - invalid field name
 * const badConfig: ValidationConfigMap<FormModel> = {
 *   passwordd: ['confirmPassword'], // Typo caught at compile time
 * };
 * ```
 */
export type ValidationConfigMap<T> = Partial<
  Record<FieldPath<T>, FieldPath<T>[]>
>;

/**
 * Type-safe field name for use in Vest test() calls and form APIs.
 * Combines valid field paths with the special ROOT_FORM constant.
 *
 * **Use Case:**
 * When defining Vest test() calls, use this type for the field parameter
 * to get autocomplete and type safety.
 *
 * **Special Values:**
 * - Any valid FieldPath from the model
 * - ROOT_FORM constant for form-level validations
 *
 * @template T - The form model type
 *
 * @example
 * ```typescript
 * import { ROOT_FORM } from 'ngx-vest-forms';
 *
 * type FormModel = DeepPartial<{
 *   email: string;
 *   user: { name: string; }
 * }>;
 *
 * export const suite = staticSuite(
 *   (data: FormModel, field?: FormFieldName<FormModel>) => {
 *     only(field);
 *
 *     /// ✅ Autocomplete works
 *     test('email', 'Required', () => {
 *       enforce(data.email).isNotBlank();
 *     });
 *
 *     test('user.name', 'Required', () => {
 *       enforce(data.user?.name).isNotBlank();
 *     });
 *
 *     /// Form-level validation
 *     test(ROOT_FORM, 'At least one contact method', () => {
 *       enforce(data.email || data.user?.name).isTruthy();
 *     });
 *   }
 * );
 * ```
 */
export type FormFieldName<T> = FieldPath<T> | typeof ROOT_FORM;

// Re-export ROOT_FORM for convenience
import { ROOT_FORM } from '../constants';
export { ROOT_FORM };

/**
 * Helper type to infer the value type at a given field path.
 * Useful for creating type-safe utilities that work with field paths.
 *
 * @template T - The model type
 * @template Path - The field path string
 *
 * @example
 * ```typescript
 * type Model = {
 *   user: {
 *     profile: {
 *       age: number;
 *     }
 *   }
 * };
 *
 * type AgeType = FieldPathValue<Model, 'user.profile.age'>;
 * /// Result: number
 * ```
 */
export type FieldPathValue<T, Path extends string> = Path extends keyof T
  ? T[Path]
  : Path extends `${infer K}.${infer Rest}`
    ? K extends keyof T
      ? FieldPathValue<NonNullable<T[K]>, Rest>
      : never
    : never;

/**
 * Utility type to check if a path is valid for a given model.
 * Returns the path if valid, never otherwise.
 *
 * @template T - The model type
 * @template Path - The path to validate
 *
 * @example
 * ```typescript
 * type Model = { name: string; age: number; };
 *
 * type Valid = ValidateFieldPath<Model, 'name'>; // 'name'
 * type Invalid = ValidateFieldPath<Model, 'invalid'>; // never
 * ```
 */
export type ValidateFieldPath<T, Path extends string> =
  Path extends FieldPath<T> ? Path : never;

/**
 * Extract all leaf field paths (paths that point to primitive values).
 * Useful when you only want paths to actual values, not intermediate objects.
 *
 * @template T - The model type
 *
 * @example
 * ```typescript
 * type Model = {
 *   user: {
 *     name: string;
 *     profile: {
 *       age: number;
 *     }
 *   }
 * };
 *
 * type Leaves = LeafFieldPath<Model>;
 * /// Result: 'user.name' | 'user.profile.age'
 * /// Note: 'user' and 'user.profile' are excluded (not leaves)
 * ```
 */
export type LeafFieldPath<
  T,
  Prefix extends string = '',
  Depth extends readonly number[] = [],
> = Depth['length'] extends 10
  ? never
  : T extends Primitive
    ? never
    : T extends readonly (infer U)[]
      ? LeafFieldPath<U, Prefix, [...Depth, 1]>
      : {
          [K in keyof T & string]: T[K] extends Primitive
            ? `${Prefix}${K}`
            : T[K] extends readonly (infer U)[]
              ? U extends Primitive
                ? never
                : LeafFieldPath<U, `${Prefix}${K}.`, [...Depth, 1]>
              : LeafFieldPath<T[K], `${Prefix}${K}.`, [...Depth, 1]>;
        }[keyof T & string];
