/**
 * Sometimes we want to make every property of a type
 * required, but also child properties recursively
 *
 * @template T The type to make deeply required
 * @example
 * ```typescript
 * interface User {
 *   name?: string;
 *   profile?: {
 *     age?: number;
 *   };
 * }
 *
 * type RequiredUser = NgxDeepRequired<User>;
 * /// Result: { name: string; profile: { age: number; } }
 * ```
 */
export type NgxDeepRequired<T> = {
  [K in keyof T]-?: T[K] extends object ? NgxDeepRequired<T[K]> : T[K];
};

/**
 * A specialized version of NgxDeepRequired that handles form compatibility issues,
 * specifically the Date/string type mismatch that occurs in form initialization.
 *
 * **Problem this solves:**
 * - Model interfaces often use `Date` types for semantic correctness
 * - UI libraries (like PrimeNG p-calendar) require empty string `''` for placeholder display
 * - This creates a `Date !== string` type mismatch during form initialization
 *
 * **Solution:**
 * - Makes all properties required (removes optional `?` modifiers)
 * - Recursively processes nested objects
 * - **Only** adds `string` as an allowed type for `Date` properties
 * - All other types remain unchanged to maintain type safety
 *
 * **Usage Example:**
 * ```typescript
 * interface UserModel {
 *   id?: number;
 *   name?: string;
 *   birthDate?: Date;
 *   profile?: {
 *     createdAt?: Date;
 *     isActive?: boolean;
 *   };
 * }
 *
 * /// Result type:
 * type FormCompatibleUser = NgxFormCompatibleDeepRequired<UserModel>;
 * /// {
 * ///   id: number;
 * ///   name: string;
 * ///   birthDate: Date | string;  /// <-- Only Date gets union treatment
 * ///   profile: {
 * ///     createdAt: Date | string; /// <-- Date properties at all levels
 * ///     isActive: boolean;        /// <-- Other types unchanged
 * ///   };
 * /// }
 *
 * /// Usage in component:
 * const formShape: FormCompatibleUser = {
 *   id: 0,
 *   name: '',
 *   birthDate: '',  // ✅ Valid! Can use empty string for placeholder
 *   profile: {
 *     createdAt: '', // ✅ Valid! Empty string for date inputs
 *     isActive: false
 *   }
 * };
 * ```
 *
 * **Why not just make everything `T | string`?**
 * - That would sacrifice type safety for non-Date fields
 * - This approach only relaxes types where the form-compatibility issue exists
 * - Maintains strict typing for booleans, numbers, strings, etc.
 *
 * **When to use:**
 * - Creating form shapes for `formShape` validation
 * - Initializing form models that may have empty date inputs
 * - Working with date picker components that accept empty strings
 *
 * **When NOT to use:**
 * - For API response types (use the original model interface)
 * - For non-form data structures
 * - When you don't have Date fields that need empty string support
 *
 * @template T The type to make form-compatible with required properties
 * @see {@link NgxDeepRequired} For the base deep required functionality without form compatibility
 * @see {@link https://github.com/ngx-vest-forms/ngx-vest-forms/issues/12 | Issue #12}
 */
export type NgxFormCompatibleDeepRequired<T> = {
  [K in keyof T]-?: T[K] extends Date | undefined
    ? Date | string // Date properties (including optional ones) get the union treatment
      : T[K] extends object | undefined
        ? NgxFormCompatibleDeepRequired<NonNullable<T[K]>> // Recursively apply to nested objects, removing undefined
        : T[K]; // All other types remain unchanged
};

// Legacy aliases for backward compatibility
/** @deprecated Use NgxDeepRequired instead */
export type DeepRequired<T> = NgxDeepRequired<T>;

/** @deprecated Use NgxFormCompatibleDeepRequired instead */
export type FormCompatibleDeepRequired<T> = NgxFormCompatibleDeepRequired<T>;
