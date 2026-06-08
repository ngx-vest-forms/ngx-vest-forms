/**
 * Primitive types that should not be traversed for nested paths.
 *
 * Aligned with the `_Primitive` definitions used by `equality.ts`,
 * `deep-partial.ts`, and `deep-required.ts` (which include `bigint | symbol`)
 * plus `Date`, so `bigint`/`symbol`/`Date` fields are treated as leaves and
 * do not generate junk traversal paths.
 */
type Primitive =
  | string
  | number
  | boolean
  | bigint
  | symbol
  | Date
  | null
  | undefined;

/**
 * Recursively generates all valid field paths for a type as string literals.
 * This provides full IDE autocomplete and compile-time validation for field names.
 *
 * **Key Features:**
 * - Supports nested objects with dot notation (e.g., 'user.address.city')
 * - Works with optional properties from NgxDeepPartial types
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
 * @example With NgxDeepPartial
 * ```typescript
 * type FormModel = NgxDeepPartial<{
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
/**
 * @internal
 * Single shared generator for {@link FieldPath} and {@link LeafFieldPath}.
 *
 * `Leaves` toggles whether intermediate (object/array) container paths are
 * emitted. Both public types derive from this so their traversal logic can
 * never drift apart.
 *
 * @template T - The model type to extract field paths from
 * @template Leaves - When `true`, only primitive-leaf paths are emitted
 * @template Prefix - Internal recursion prefix (do not use directly)
 * @template Depth - Internal depth counter to prevent infinite recursion
 */
type FieldPathInternal<
  T,
  Leaves extends boolean,
  Prefix extends string = '',
  Depth extends readonly number[] = [],
> = Depth['length'] extends 10
  ? never // Max depth reached, prevent infinite recursion
  : T extends Primitive
    ? never // Don't traverse primitives
    : T extends ReadonlyArray<infer U>
      ? // For arrays, generate paths for the element type
        FieldPathInternal<U, Leaves, Prefix, [...Depth, 1]>
      : {
          [K in keyof T & string]: T[K] extends Primitive
            ? // Primitive property: just the field name (always a leaf)
              `${Prefix}${K}`
            : T[K] extends ReadonlyArray<infer U>
              ? // Array property: optionally the container path, plus element paths
                  | (Leaves extends true ? never : `${Prefix}${K}`)
                  | (U extends Primitive
                      ? never
                      : FieldPathInternal<
                          U,
                          Leaves,
                          `${Prefix}${K}.`,
                          [...Depth, 1]
                        >)
              : // Object property: optionally the container path, plus nested paths
                  | (Leaves extends true ? never : `${Prefix}${K}`)
                  | FieldPathInternal<
                      T[K],
                      Leaves,
                      `${Prefix}${K}.`,
                      [...Depth, 1]
                    >;
        }[keyof T & string];

export type FieldPath<
  T,
  Prefix extends string = '',
  Depth extends readonly number[] = [],
> = FieldPathInternal<T, false, Prefix, Depth>;

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
 * type FormModel = NgxDeepPartial<{
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
  Record<FieldPath<T>, Array<FieldPath<T>>>
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
 * type FormModel = NgxDeepPartial<{
 *   email: string;
 *   user: { name: string; }
 * }>;
 *
 * export const suite = create(
 *   (data: FormModel) => {
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
 *
 * @example Array paths (consistent with {@link FieldPath})
 * ```typescript
 * type Model = { addresses: { street: string }[] };
 *
 * /// Flattened form (as produced by FieldPath):
 * type S1 = FieldPathValue<Model, 'addresses.street'>; // string
 * /// Bracket form (as produced at runtime):
 * type S2 = FieldPathValue<Model, 'addresses[0].street'>; // string
 * ```
 */
export type FieldPathValue<T, Path extends string> = NonNullable<
  FieldPathValueRaw<T, Path>
>;

/**
 * Internal resolver for {@link FieldPathValue}. Walks the path and returns the
 * raw leaf type; the public {@link FieldPathValue} strips the partial-model
 * `| undefined` from the leaf via `NonNullable`.
 *
 * @internal
 */
type FieldPathValueRaw<T, Path extends string> =
  NonNullable<T> extends infer NT
    ? // Bracket index segment at the head: `[0]` / `[0].rest` → array element.
      Path extends `[${number}]${infer Rest}`
      ? NT extends ReadonlyArray<infer U>
        ? Rest extends `.${infer AfterDot}`
          ? FieldPathValueRaw<U, AfterDot>
          : Rest extends ''
            ? U
            : FieldPathValueRaw<U, Rest>
        : never
      : // Exact own-key match.
        Path extends keyof NT
        ? NT[Path]
        : // Split on the first dot.
          Path extends `${infer K}.${infer Rest}`
          ? // `key[0]...` — bracket immediately after a key segment.
            K extends `${infer Base}[${number}]`
            ? Base extends keyof NT
              ? NonNullable<NT[Base]> extends ReadonlyArray<infer U>
                ? FieldPathValueRaw<U, Rest>
                : never
              : never
            : K extends keyof NT
              ? FieldPathValueRaw<NonNullable<NT[K]>, Rest>
              : // Array-traversing flattened path: `arrayKey.rest`.
                NT extends ReadonlyArray<infer U>
                ? FieldPathValueRaw<U, Path>
                : never
          : // No dot left: a bare `key[0]` head segment.
            Path extends `${infer Base}[${number}]`
            ? Base extends keyof NT
              ? NonNullable<NT[Base]> extends ReadonlyArray<infer U>
                ? U
                : never
              : never
            : // Final flattened array hop (e.g. `street` against `Address[]`).
              NT extends ReadonlyArray<infer U>
              ? FieldPathValueRaw<U, Path>
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
> = FieldPathInternal<T, true, Prefix, Depth>;
