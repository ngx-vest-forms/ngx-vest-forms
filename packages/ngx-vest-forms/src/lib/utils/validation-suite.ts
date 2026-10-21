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

/**
 * The suite shape ngx-vest-forms calls: the Vest 6 suite methods it uses
 * (`only`, `focus`, `run`, `get`, `reset`, ...).
 *
 * This is a structural type rather than an alias of Vest's `Suite`, because
 * Vest's schema generic leaks into its `SuiteResult` and `run` types. Any
 * `create(...)` suite satisfies it, including one built on a Standard Schema
 * provider such as Zod, Valibot or `enforce.shape`.
 *
 * Methods use method syntax, so their parameters are checked bivariantly under
 * `strictFunctionTypes`. `NgxVestSuite<SpecificModel>` is therefore assignable
 * to `NgxVestSuite<unknown>` in Angular templates without `$any()` casts.
 * Return types stay fully typed.
 *
 * @template T The model type the suite runs against (default: unknown)
 *
 * @example
 * ```typescript
 * import { NgxDeepPartial, NgxVestSuite } from 'ngx-vest-forms';
 * import { create, test, enforce } from 'vest';
 *
 * type UserModel = NgxDeepPartial<{ name: string; email: string }>;
 *
 * // The suite callback only receives the model. Field focus is applied at the
 * // call site with `suite.only(field).run(model)`.
 * export const userValidation: NgxVestSuite<UserModel> = create(
 *   (model: UserModel) => {
 *     test('name', 'Name is required', () => {
 *       enforce(model.name).isNotBlank();
 *     });
 *   }
 * );
 * ```
 *
 * @see {@link https://vestjs.dev/docs/writing_your_suite | Vest Documentation}
 */
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
