/**
 * FieldKey<T> gives you autocompletion for known string keys of T,
 * but also allows any string (for dynamic/nested/cyclic field names).
 *
 * **Why use this?**
 * - Provides IDE autocomplete for known model properties
 * - Still accepts arbitrary strings for nested paths like `'addresses[0].street'`
 * - Useful for cyclic dependencies and dynamic field names
 *
 * **How it works:**
 * - Extracts string keys from T: `Extract<keyof T, string>`
 * - Unions with open-ended string: `string & {}` (branding trick)
 * - Result: autocomplete hints + accepts any string
 *
 * @template T The model type whose string keys should be suggested
 *
 * @example
 * ```typescript
 * interface User {
 *   name: string;
 *   email: string;
 *   age: number;
 * }
 *
 * /// Type: 'name' | 'email' | 'age' | string
 * type UserField = NgxFieldKey<User>;
 *
 * /// IDE suggests 'name', 'email', 'age'
 * /// but also accepts 'addresses[0].street'
 * const field: UserField = 'email'; // ✅ autocomplete
 * const nested: UserField = 'profile.settings.theme'; // ✅ also valid
 * ```
 *
 * Note: Use only string keys to avoid widening to number/symbol when T=any.
 */
export type NgxFieldKey<T> = Extract<keyof T, string> | (string & {});

/**
 * Represents a Vest validation suite for use with ngx-vest-forms.
 *
 * @description
 * This type wraps Vest 6's `Suite` with the specific generic parameters
 * required for form validation in this library.
 *
 * **Why use this type?**
 * - Simplifies the API by hiding complex generic parameters
 * - Ensures type safety for model parameter
 * - Provides better template compatibility (no `$any()` casts needed)
 * - Makes suite signatures consistent across the codebase
 *
 * **What it wraps:**
 * ```typescript
 * Suite<string, string, (model: T) => void>
 * ```
 *
 * **Type parameters explained:**
 * - First `string`: Field names (property paths like 'email' or 'addresses[0].street')
 * - Second `string`: Group names (for organizing tests, e.g., 'step1', 'step2')
 * - Third parameter: The validation function signature with bivariance trick
 *
 * **Vest 6 field focus:**
 * Field-specific validation is handled externally via `suite.only(field).run(model)`.
 * The suite callback only receives the model — no `field` parameter needed.
 * This is the Vest 6 recommended pattern for cleaner separation of concerns.
 *
 * **Bivariance for template compatibility:**
 * The callback type uses a bivariant method parameter trick to make
 * `NgxVestSuite<SpecificModel>` assignable to `NgxVestSuite<unknown>` in
 * Angular templates without requiring `$any()` casts. This preserves template
 * ergonomics while keeping implementation sites strictly typed.
 *
 * **Safety:**
 * The bivariant callback is only used for the suite's parameter type. The return
 * type remains fully typed. The model parameter remains strictly typed.
 *
 * @template T The model type that the validation suite operates on (default: unknown)
 *
 * @example
 * ```typescript
 * import { NgxDeepPartial, NgxVestSuite } from 'ngx-vest-forms';
 * import { create, test, enforce } from 'vest';
 *
 * type UserModel = NgxDeepPartial<{
 *   name: string;
 *   email: string;
 *   age: number;
 * }>;
 *
 * /// Vest 6: suite callback only receives the model.
 * /// Field focus is handled via suite.only(field).run(model) at the call site.
 * export const userValidation: NgxVestSuite<UserModel> = create((model: UserModel) => {
 *   test('name', 'Name is required', () => {
 *     enforce(model.name).isNotBlank();
 *   });
 *
 *   test('email', 'Valid email is required', () => {
 *     enforce(model.email).isNotBlank().isEmail();
 *   });
 *
 *   test('age', 'Must be 18 or older', () => {
 *     enforce(model.age).greaterThanOrEquals(18);
 *   });
 * });
 *
 * /// Use in component
 * @Component({...})
 * class UserFormComponent {
 *   protected readonly suite = userValidation;
 *   protected readonly formValue = signal<UserModel>({});
 * }
 * ```
 *
 * **Type design notes:**
 * - Default generic is `unknown` (safer than `any`) for opt-in typing
 * - Uses bivariant method parameter trick for better template assignability
 * - Return type is fully typed (void) to catch errors at call sites
 *
 * @see {@link https://vestjs.dev/docs/writing_your_suite | Vest Documentation}
 * @see {@link NgxFieldKey} For typed field name hints with arbitrary string support
 */

// Bivariant function type trick for better assignment compatibility in TypeScript
// Allows NgxVestSuite<SpecificModel> to be assignable to NgxVestSuite<unknown>
// without leaking $any() casts into consumer templates.
//
// This is safe because:
// - The model parameter (T) remains fully typed for type safety
// - Runtime behavior is identical (string is string, regardless of literal type)
// - Allows NgxTypedVestSuite to be used where NgxVestSuite is expected

/**
 * Minimal structural type that any Vest suite (with or without a Standard
 * Schema provider like Zod, Valibot, or n4s enforce.shape) satisfies.
 *
 * Uses a structural interface rather than a direct alias for Vest's
 * {@code Suite<F, G, CB, S>} to avoid type incompatibilities caused by
 * the schema generic parameter ({@code S}) flowing through Vest's
 * conditional {@code SuiteResult} and {@code run} parameter types.
 *
 * Method syntax in this type provides bivariant parameter checking under
 * {@code strictFunctionTypes}, so {@code NgxVestSuite<SpecificModel>}
 * remains assignable to {@code NgxVestSuite<unknown>} in Angular templates
 * without requiring {@code $any()} casts.
 */

export type NgxVestSuite<T = unknown> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  only(match: string | string[] | null | undefined): { run(model: T): any };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  run(model: T): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(): any;
  reset(): void;
  resetField(field: string): void;
  remove(field: string): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscribe: (...args: any[]) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dump(): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resume(state: any): void;
};

/**
 * Type-safe validation suite with autocomplete for field paths.
 *
 * @deprecated Use {@link NgxVestSuite}<T> instead — both types are structurally
 * identical. This alias will be removed in a future major version.
 *
 * @template T The model type that the validation suite operates on
 */
export type NgxTypedVestSuite<T> = NgxVestSuite<T>;
