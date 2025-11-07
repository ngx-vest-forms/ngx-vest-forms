import { StaticSuite } from 'vest';

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
 * **Bivariance for template compatibility:**
 * The callback type uses a bivariant method parameter trick to make
 * `NgxVestSuite<SpecificModel>` assignable to `NgxVestSuite<unknown>` in
 * Angular templates without requiring `$any()` casts. This preserves template
 * ergonomics while keeping implementation sites strictly typed.
 *
 * The field parameter is a plain `string` (not `keyof T`) to:
 * - Avoid variance and union-widening issues in template type checking
 * - Support nested paths like 'user.addresses[0].street'
 * - Support cyclic dependencies between fields
 * - IDEs still provide property-name hints via context
 *
 * **Safety:**
 * The bivariant callback is only used for the suite's parameter type. The return
 * type remains fully typed. Internally, we cast at invocation sites where we
 * control `T`, ensuring safety.
 *
 * @template T The model type that the validation suite operates on (default: unknown)
 *
 * @example
 * ```typescript
 * // Define your model
 * interface UserModel {
 *   name?: string;
 *   email?: string;
 *   age?: number;
 * }
 *
 * // Create a typed validation suite
 * import { create, test, enforce, only } from 'vest';
 *
 * const userValidation: NgxVestSuite<UserModel> = create((model, field) => {
 *   only(field);
 *
 *   test('name', 'Name is required', () => {
 *     enforce(model.name).isNotEmpty();
 *   });
 *
 *   test('email', 'Valid email is required', () => {
 *     enforce(model.email).isNotEmpty().matches(/^[^@]+@[^@]+\.[^@]+$/);
 *   });
 *
 *   test('age', 'Must be 18 or older', () => {
 *     enforce(model.age).greaterThanOrEquals(18);
 *   });
 * });
 *
 * // Use in component
 * @Component({...})
 * class UserFormComponent {
 *   readonly suite = signal<NgxVestSuite<UserModel>>(userValidation);
 *   readonly formValue = signal<Partial<UserModel>>({});
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
// Allows NgxVestSuite<SpecificModel> to be assignable to NgxVestSuite<any>
// without leaking $any() casts into consumer templates.
type NgxSuiteCallback<T> = {
  // Method syntax yields bivariant parameters under strictFunctionTypes
  // Use plain string for field to avoid keyof variance issues in templates
  bivarianceHack(model: T, field?: string): void;
}['bivarianceHack'];

export type NgxVestSuite<T = unknown> = StaticSuite<
  string,
  string,
  NgxSuiteCallback<T>
>;
