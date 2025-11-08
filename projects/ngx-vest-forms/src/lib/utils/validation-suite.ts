import { StaticSuite } from 'vest';
import type { FormFieldName } from './field-path-types';

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
 * // Type: 'name' | 'email' | 'age' | string
 * type UserField = NgxFieldKey<User>;
 *
 * // IDE suggests 'name', 'email', 'age'
 * // but also accepts 'addresses[0].street'
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
 * StaticSuite<string, string, (model: T, field?: any) => void>
 * ```
 *
 * **Type parameters explained:**
 * - First `string`: Field names (property paths like 'email' or 'addresses[0].street')
 * - Second `string`: Group names (for organizing tests, e.g., 'step1', 'step2')
 * - Third parameter: The validation function signature with bivariance trick
 *
 * **Field parameter flexibility:**
 * The field parameter uses `any` strategically to accept both:
 * - Plain `string` field names
 * - `FormFieldName<T>` from NgxTypedVestSuite (provides autocomplete)
 *
 * This is safe because:
 * 1. The model parameter `T` remains fully typed
 * 2. Field validation happens at the validation suite definition site
 * 3. Runtime behavior is identical - only TypeScript signatures differ
 * 4. Type safety is enforced where it matters most (validation suite creation)
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
 * // Define your model
 * import { NgxDeepPartial, NgxVestSuite } from 'ngx-vest-forms';
 * import { staticSuite, test, enforce, only } from 'vest';
 *
 * type UserModel = NgxDeepPartial<{
 *   name: string;
 *   email: string;
 *   age: number;
 * }>;
 *
 * // Create validation suite - works with both string and FormFieldName<T> field parameters
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
 * // Use in component - no type assertions needed
 * @Component({...})
 * class UserFormComponent {
 *   protected readonly suite: NgxVestSuite<UserModel> = userValidation;
 *   protected readonly formValue = signal<UserModel>({});
 * }
 * ```
 *
 * @example
 * ```typescript
 * // For dynamic/untyped scenarios, use unknown
 * const dynamicSuite: NgxVestSuite = create((model, field) => {
 *   only(field);
 *   // Validation logic for any model structure
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
// IMPORTANT: The field parameter uses `any` to accept both string and FormFieldName<T>
// from NgxTypedVestSuite. This is safe because:
// 1. The model parameter (T) remains fully typed
// 2. Field validation happens at the validation suite definition site
// 3. Runtime behavior is identical - only TypeScript signatures differ
type NgxSuiteCallback<T> = {
  // Method syntax yields bivariant parameters under strictFunctionTypes
  // Use `any` for field to accept both string and FormFieldName<T> from typed suites
  bivarianceHack(model: T, field?: any): void;
}['bivarianceHack'];

export type NgxVestSuite<T = unknown> = StaticSuite<
  string,
  string,
  NgxSuiteCallback<T>
>;

/**
 * Type-safe validation suite with autocomplete for field paths.
 * Use this when defining validation suites to get IDE autocomplete and compile-time validation.
 *
 * **Recommended Pattern:**
 * 1. Define validation suite with `NgxTypedVestSuite<T>` for autocomplete
 * 2. Assign to component property typed as `NgxVestSuite<T>` for template compatibility
 *
 * **Why this pattern works:**
 * - `NgxTypedVestSuite` provides `FormFieldName<T>` autocomplete at definition site
 * - `NgxVestSuite` accepts both `string` and `FormFieldName<T>` through strategic `any`
 * - No type assertions needed - types are compatible by design
 * - Type safety preserved where it matters (validation suite definition)
 *
 * **Use NgxTypedVestSuite for:**
 * - Validation suite definitions (get autocomplete for field names)
 * - Development-time type safety and IDE hints
 *
 * **Use NgxVestSuite for:**
 * - Component properties (template compatibility)
 * - Function parameters accepting any validation suite
 * - Public APIs that need flexibility
 *
 * @template T The model type that the validation suite operates on
 *
 * @example Recommended Pattern - Autocomplete at Definition, Compatibility at Usage
 * ```typescript
 * import { staticSuite, test, enforce, only } from 'vest';
 * import { NgxTypedVestSuite, NgxVestSuite, FormFieldName, NgxDeepPartial } from 'ngx-vest-forms';
 *
 * type UserModel = NgxDeepPartial<{
 *   email: string;
 *   profile: {
 *     age: number;
 *   }
 * }>;
 *
 * // Step 1: Define suite with NgxTypedVestSuite for autocomplete
 * export const userSuite: NgxTypedVestSuite<UserModel> = staticSuite(
 *   (model: UserModel, field?: FormFieldName<UserModel>) => {
 *     only(field); // Always call unconditionally
 *
 *     // ✅ IDE autocomplete for: 'email' | 'profile' | 'profile.age' | typeof ROOT_FORM
 *     test('email', 'Email is required', () => {
 *       enforce(model.email).isNotBlank();
 *     });
 *
 *     test('profile.age', 'Must be 18+', () => {
 *       enforce(model.profile?.age).greaterThanOrEquals(18);
 *     });
 *   }
 * );
 *
 * // Step 2: Use in component with NgxVestSuite type (no assertion needed)
 * @Component({...})
 * class UserFormComponent {
 *   // ✅ Types are compatible - no assertion needed
 *   protected readonly suite: NgxVestSuite<UserModel> = userSuite;
 *   protected readonly formValue = signal<UserModel>({});
 * }
 * ```
 */
type NgxTypedSuiteCallback<T> = {
  bivarianceHack(model: T, field?: FormFieldName<T>): void;
}['bivarianceHack'];

export type NgxTypedVestSuite<T> = StaticSuite<
  string,
  string,
  NgxTypedSuiteCallback<T>
>;
