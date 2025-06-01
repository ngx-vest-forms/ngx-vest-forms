
/* eslint-disable @typescript-eslint/no-explicit-any */ /// Allow any for generic validation types
import { StaticSuite } from 'vest';

/**
 * FieldKey<T> gives you autocompletion for known keys of T,
 * but also allows any string (for dynamic/nested/cyclic field names).
 */
export type FieldKey<T> = keyof T | (string & {});

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
 * import { VestSuite } from './validation-suite';
 *
 * const userValidation: VestSuite<UserModel> = create((model, field) => {
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
 */
export type VestSuite<T = any> = StaticSuite<
  string,
  string,
  (model: T, field?: FieldKey<T>) => void
>;
