import { StaticSuite } from 'vest';

/**
 * FieldKey<T> gives you autocompletion for known string keys of T,
 * but also allows any string (for dynamic/nested/cyclic field names).
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
 * - Ensures type safety between your form model and validation suite
 * - Makes autocomplete and type checking more accurate in your IDE
 *
 * The `string & {}` technique is used to allow both model property keys and arbitrary strings,
 * which is useful for handling cyclic dependencies and nested field paths.
 *
 * @example
 * ```typescript
 * /// Create a validation suite using Vest
 * import { create, test, enforce } from 'vest';
 * import { NgxVestSuite } from './validation-suite';
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
 * });
 * ```
 *
 * @template T The model type that the validation suite operates on
 *
 * Type design notes:
 * - Default generic is `unknown` (safer than `any`) to enforce explicit typing at the edges.
 * - Uses a “bivariant method parameter” trick to make NgxVestSuite<Specific> assignable
 *   to NgxVestSuite<unknown> in Angular templates without `$any()` casts. This preserves
 *   template ergonomics while keeping implementation sites strictly typed.
 * - Field parameter is a plain `string` (not `keyof T`) to avoid variance and union-widening
 *   issues in template type checking. IDEs still provide property-name hints via context.
 *
 * Safety:
 * - The bivariant callback is only used for the suite’s parameter type. Return type remains
 *   fully typed. Internally, we cast at invocation sites where we control `T`, ensuring safety.
 */
// Bivariant function type trick for better assignment compatibility in TS
// Allows NgxVestSuite<Specific> to be assignable to NgxVestSuite<any>
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
