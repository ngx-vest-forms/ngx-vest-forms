/**
 * FieldKey<T> gives you autocompletion for known string keys of T,
 * but also allows any string (for dynamic/nested/cyclic field names).
 *
 * **Why use this?**
 * - Provides IDE autocomplete for known model properties
 * - Still accepts arbitrary strings for nested paths like `'addresses.0.street'`
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
 * /// but also accepts 'addresses.0.street'
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
 * - First `string`: Field names (property paths like 'email' or 'addresses.0.street')
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
// - Allows strongly typed suites to be used where NgxVestSuite is expected

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

/**
 * Structural type for the result returned by Vest 6's `suite.run()`.
 *
 * Vest 6.3's SuiteResult exposes sync selectors (`isPending`, `getErrors`,
 * etc.) immediately after `run()`, AND is always thenable at runtime: `run()`
 * returns a promise merged with the result object. `then` is kept *optional*
 * on this structural type only for static assignability with Vest's exported
 * `SuiteResult` (which does not declare `then`); the runner adopts the runtime
 * thenable via RxJS `from(...)`. The promise resolves once the run's
 * async tests settle; since Vest 6.3.4 an older run that is still pending when
 * a newer run of the same suite starts resolves to the newer run's result.
 * Per-field verdicts stay correct because Vest keeps each field's state across
 * runs.
 *
 * This structural interface avoids direct coupling to Vest's internal
 * `SuiteResult<F, G, S>` generics while preserving the methods used by ngx-vest-forms.
 *
 * @see {@link https://vestjs.dev/docs/writing_your_suite/handling_completion}
 * @publicApi
 */
export type NgxSuiteRunResult = {
  isPending(field?: string): boolean;
  isValid(field?: string): boolean;
  hasErrors(field?: string): boolean;
  hasWarnings(field?: string): boolean;
  isTested(field: string): boolean;
  getErrors(): Record<string, string[]>;
  getErrors(field: string): string[];
  getWarnings(): Record<string, string[]>;
  getWarnings(field: string): string[];
  /**
   * Vest 6.3 `run()` ALWAYS returns a thenable at runtime (the result is a
   * promise produced by `withResolvers()` merged with the synchronous
   * selectors via `assign(promise, suiteResult)`). The promise resolves once
   * the run settles — to the latest run's result when a newer run of the same
   * suite superseded it (Vest >= 6.3.4). The runner emits that resolved value
   * and falls back to `get()` only when resolution yields nothing.
   *
   * NOTE: this stays *optional* purely for static structural assignability:
   * Vest's exported `SuiteResult<F, G, S>` type does not statically declare
   * `then` (it is attached at runtime by `bindSuiteResultMethods`). Marking it
   * required here would break assigning a real `create(...)` suite to
   * `NgxVestSuite<T>`. The runner therefore checks for `then` at runtime and
   * subscribes to the thenable once via RxJS `from(...)`.
   */
  then?<TResult1 = NgxSuiteRunResult, TResult2 = never>(
    onfulfilled?:
      ((value: NgxSuiteRunResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2>;
};

export type NgxVestSuite<T = unknown> = {
  /**
   * Runs only the given field(s). The `null | undefined` in the parameter is
   * not an invitation to pass them: it mirrors Vest's own `only()` parameter
   * so a suite created with a schema, whose `only()` accepts just its own
   * field names, stays assignable to `NgxVestSuite` through method
   * bivariance. The same holds for `focus()`'s `only` and `skip`.
   */
  only(match: string | string[] | null | undefined): {
    run(model: T): NgxSuiteRunResult;
  };
  /**
   * Runs a subset of the suite. `suite.only(field)` is shorthand for
   * `suite.focus({ only: field })`; `focus` also takes `skip`, `onlyGroup`
   * and `skipGroup`. Every Vest 6.3 suite has it; it is optional here so a
   * hand-written suite fake does not need it.
   *
   * @see {@link https://vestjs.dev/docs/writing_your_suite/including_and_excluding/skip_and_only}
   */
  focus?(config: {
    only?: string | string[] | null;
    skip?: string | string[] | null;
    onlyGroup?: string | readonly string[];
    skipGroup?: string | readonly string[];
  }): {
    run(model: T): NgxSuiteRunResult;
  };
  run(model: T): NgxSuiteRunResult;
  get(): NgxSuiteRunResult;
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
