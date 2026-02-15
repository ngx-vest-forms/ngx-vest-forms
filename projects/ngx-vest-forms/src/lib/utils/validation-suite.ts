import { StaticSuite } from 'vest';
import { FormFieldName } from './field-path-types';

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
 * This type wraps Vest's `StaticSuite` with the specific generic parameters
 * required for form validation in this library.
 *
 * **Why use this type?**
 * - Simplifies the API by hiding complex generic parameters
 * - Ensures type safety for model and field parameters
 * - Accepts both string and FormFieldName<T> field parameters (from NgxTypedVestSuite)
 * - Provides better template compatibility (no `$any()` casts needed)
 * - Makes suite signatures consistent across the codebase
 *
 * **What it wraps:**
 * ```typescript
 * StaticSuite<string, string, (model: T, field?: string) => void>
 * ```
 *
 * **Type parameters explained:**
 * - First `string`: Field names (property paths like 'email' or 'addresses[0].street')
 * - Second `string`: Group names (for organizing tests, e.g., 'step1', 'step2')
 * - Third parameter: The validation function signature with bivariance trick
 *
 * **Field parameter:**
 * The field parameter accepts `string | undefined` for:
 * - Plain string field names like 'email'
 * - Nested paths like 'addresses.billing.street'
 * - undefined to run all tests
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
 * import { staticSuite, test, enforce, only } from 'vest';
 *
 * type UserModel = NgxDeepPartial<{
 *   name: string;
 *   email: string;
 *   age: number;
 * }>;
 *
 * /// Create validation suite
 * export const userValidation: NgxVestSuite<UserModel> = staticSuite((model, field?) => {
 *   only(field); // Always call unconditionally
 *
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
 * @example
 * ```typescript
 * /// For dynamic/untyped scenarios, use unknown
 * const dynamicSuite: NgxVestSuite = create((model, field) => {
 *   only(field);
 *   /// Validation logic for any model structure
 * });
 * ```
 *
 * **Type design notes:**
 * - Default generic is `unknown` (safer than `any`) for opt-in typing
 * - Uses bivariant method parameter trick for better template assignability
 * - Field parameter accepts any string for nested/dynamic paths
 * - Return type is fully typed (void) to catch errors at call sites
 *
 * @see {@link https://vestjs.dev/docs/writing_your_suite | Vest Documentation}
 * @see {@link NgxFieldKey} For typed field name hints with arbitrary string support
 */

// Bivariant function type trick for better assignment compatibility in TypeScript
// Allows NgxVestSuite<SpecificModel> to be assignable to NgxVestSuite<unknown>
// without leaking $any() casts into consumer templates.
//
// Field parameter uses a deliberately *wide* type to preserve assignment compatibility:
// 1. Plain string field names ('email', 'addresses.billing.street')
// 2. FormFieldName<T> from NgxTypedVestSuite (string literal union with autocomplete)
// 3. undefined to run all tests
//
// CRITICAL: This parameter must be as wide as (or wider than) `string | undefined`
// so NgxTypedVestSuite<T> (which uses FormFieldName<T>) stays assignable to
// NgxVestSuite<T>.
//
// This is safe because:
// - The model parameter (T) remains fully typed for type safety
// - Runtime behavior is identical (string is string, regardless of literal type)
// - Allows NgxTypedVestSuite to be used where NgxVestSuite is expected
/** @internal Do not use outside ngx-vest-forms. The `any` is architecturally required. */
type NgxSuiteCallback<T> = {
  // Method syntax yields bivariant parameters under strictFunctionTypes
  // IMPORTANT: this is intentionally `any`.
  // Angular template type-checking (and the bivariant method trick) effectively
  // requires mutual assignability between this callback and the typed variant
  // that uses `FormFieldName<T>`. Using `unknown` (safer) or even `string`
  // breaks production builds because `string` is not assignable to
  // `FormFieldName<T>` (a string-literal union of known paths).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bivarianceHack(model: T, field?: any): void;
}['bivarianceHack'];

export type NgxVestSuite<T = unknown> = StaticSuite<
  string,
  string,
  NgxSuiteCallback<T>
>;

/**
 * Type-safe validation suite with autocomplete for field paths.
 * Use this when defining validation suites to get IDE autocomplete for field names.
 *
 * **Recommended Pattern:**
 * Always define validation suites with `NgxTypedVestSuite<T>` and let TypeScript infer the type in components:
 *
 * ```typescript
 * import { NgxTypedVestSuite, FormFieldName } from 'ngx-vest-forms';
 *
 * /// ✅ RECOMMENDED: Define with NgxTypedVestSuite for autocomplete
 * export const userSuite: NgxTypedVestSuite<UserModel> = staticSuite(
 *   (model: UserModel, field?: FormFieldName<UserModel>) => {
 *     only(field);
 *     /// ✅ IDE autocomplete for: 'email' | 'password' | 'profile.age' | typeof ROOT_FORM
 *     test('email', 'Required', () => enforce(model.email).isNotBlank());
 *   }
 * );
 *
 * /// ✅ In component: Use type inference (no explicit type)
 * @Component({...})
 * class MyFormComponent {
 *   protected readonly suite = userSuite; // ✅ Type inferred automatically
 *   protected readonly formValue = signal<UserModel>({});
 * }
 * ```
 *
 * **Why this pattern?**
 * - **Strong typing at definition**: `FormFieldName<T>` gives autocomplete for all field paths
 * - **Type inference in components**: No need for explicit types, avoids compatibility issues
 * - **Best of both worlds**: Type safety where you write validation logic, convenience in components
 *
 * @template T The model type that the validation suite operates on
 *
 * @see {@link NgxVestSuite} For the base suite type (accepts any string field)
 * @see {@link FormFieldName} For the field name type with autocomplete
 */
/** @internal Do not use outside ngx-vest-forms. */
type NgxTypedSuiteCallback<T> = {
  bivarianceHack(model: T, field?: FormFieldName<T>): void;
}['bivarianceHack'];

export type NgxTypedVestSuite<T> = StaticSuite<
  string,
  string,
  NgxTypedSuiteCallback<T>
>;
