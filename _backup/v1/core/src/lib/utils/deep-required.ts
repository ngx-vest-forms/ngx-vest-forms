/**
 * Sometimes we want to make every property of a type
 * required, but also child properties recursively
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
 * type FormCompatibleUser = FormCompatibleDeepRequired<UserModel>;
 * /// {
 * ///   id: number;
 * ///   name: string;
 * ///   birthDate: Date | string;  // <-- Only Date gets union treatment
 * ///   profile: {
 * ///     createdAt: Date | string;  // <-- Recursive application
 * ///     isActive: boolean;         // <-- Other types unchanged
 * ///   };
 * /// }
 *
 * /// Now you can safely initialize with empty strings for dates:
 * const formData: FormCompatibleUser = {
 *   id: 0,
 *   name: '',
 *   birthDate: '',  // ✅ Valid: string allowed for Date properties
 *   profile: {
 *     createdAt: '',  // ✅ Valid: works recursively
 *     isActive: false
 *   }
 * };
 * ```
 *
 * **Why this targeted approach:**
 * - String fields naturally use `''` (empty string) - no type conflict
 * - Number fields use `0` - type compatible with numeric inputs
 * - Boolean fields use `false` - type compatible with checkboxes/radios
 * - Complex objects use `{}` or `[]` - type compatible
 * - **Only Date fields** create the `Date !== string` mismatch requiring special handling
 *
 * @template T The type to make form-compatible with required properties
 * @since 18.1.0
 * @see {@link NgxDeepRequired} For the base deep required functionality without form compatibility
 * @see {@link https://github.com/simplifiedcourses/ngx-vest-forms/issues/12 | Issue #12}
 */
export type NgxFormCompatibleDeepRequired<T> = {
  [K in keyof T]-?: T[K] extends Date | undefined
    ? Date | string // Date properties (including optional ones) get the union treatment
    : T[K] extends Date
      ? Date | string // Non-optional Date properties also get the union treatment
      : T[K] extends object | undefined
        ? NgxFormCompatibleDeepRequired<NonNullable<T[K]>> // Recursively apply to nested objects, removing undefined
        : T[K]; // All other types remain unchanged
};
