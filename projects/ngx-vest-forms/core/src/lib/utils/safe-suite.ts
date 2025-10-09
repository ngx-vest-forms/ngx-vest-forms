/**
 * Guard-railed, type-safe wrappers around Vest's `staticSuite` and `create` APIs.
 *
 * @module safe-suite
 * @see https://vestjs.dev/docs/writing_your_suite/including_and_excluding/skip_and_only
 *
 * ## Why these wrappers exist
 *
 * Vest expects consumers to call `only(field)` on every run so it can decide
 * whether to execute the entire suite or just the targeted field. The most
 * common mistakes we see in app code are:
 *
 * - forgetting to call `only()` altogether, which forces every test to run on
 *   each keystroke (hurting performance and async cancellation semantics)
 * - wrapping `only()` in `if (field) { ... }`, which Vest explicitly warns
 *   against because conditional calls break its execution order tracking
 *
 * These helpers remove that sharp edge by invoking `only(field)` for you every
 * time, while still exposing typed data and field generics. That means teams can
 * focus on the actual validation logic instead of boilerplate guards.
 *
 * ## Features at a glance
 *
 * - ✅ **Automatic `only()` discipline** – the wrapper always calls `only(field)`
 *   with the incoming value (or falsy), matching Vest best practices
 * - ✅ **Typed data + fields** – consistent `Partial<TModel>` input and
 *   `TField` hinting across the library
 * - ✅ **No hidden behaviour** – aside from the `only()` guard, the returned
 *   suite behaves exactly like Vest's original helpers
 *
 * @example Basic Usage
 * ```typescript
 * import { createSafeSuite, staticSafeSuite } from 'ngx-vest-forms/core';
 * import { test, enforce } from 'vest';
 *
 * interface UserModel {
 *   email: string;
 *   password: string;
 * }
 *
 * /// With staticSuite (recommended for stateless usage)
 * const userSuite = staticSafeSuite<UserModel>((data) => {
 *   test('email', 'Email is required', () => {
 *     enforce(data.email).isNotEmpty();
 *   });
 *   test('email', 'Email format is invalid', () => {
 *     enforce(data.email).isEmail();
 *   });
 *   test('password', 'Password must be at least 8 characters', () => {
 *     enforce(data.password).longerThan(7);
 *   });
 * });
 *
 * /// With create (stateful + subscribable)
 * const statefulSuite = createSafeSuite<UserModel>((data) => {
 *   test('email', 'Required', () => enforce(data.email).isNotEmpty());
 * });
 * ```
 *
 * @example With Type-Safe Field Names
 * ```typescript
 * type UserFields = 'email' | 'password' | 'confirmPassword';
 *
 * const typedSuite = staticSafeSuite<UserModel, UserFields>((data) => {
 *   test('email', 'Required', () => enforce(data.email).isNotEmpty());
 *   test('password', 'Required', () => enforce(data.password).isNotEmpty());
 *
 *   include('confirmPassword').when('password');
 *   test('confirmPassword', 'Must match', () => {
 *     enforce(data.confirmPassword).equals(data.password);
 *   });
 * });
 *
 * /// TypeScript will error on invalid field names
 * typedSuite(data, 'invalidField'); // ❌ Type error!
 * ```
 */

import { create, only, staticSuite, type SuiteResult } from 'vest';

/**
 * Function signature for a Vest suite body that will be wrapped with safe `only()` guard.
 *
 * The wrapper handles the `only(field)` call internally, so your suite function
 * only needs to accept the data parameter.
 *
 * @template TModel - The data model type being validated
 * @template TField - Union type of valid field names (defaults to string, unused but kept for type compatibility)
 *
 * @param data - The data object to validate (defaults to empty object)
 *
 * @example
 * ```typescript
 * const suiteFn: SafeSuiteFunction<UserModel> = (data) => {
 *   test('email', 'Required', () => enforce(data.email).isNotEmpty());
 *   test('password', 'Required', () => enforce(data.password).isNotEmpty());
 * };
 * ```
 */
export type SafeSuiteFunction<
  TModel extends Record<string, unknown> = Record<string, unknown>,
> = (data?: Partial<TModel>) => void;

/**
 * Return type for safe suite wrappers - a standard Vest suite function.
 *
 * @template TModel - The data model type being validated
 * @template TField - Union type of valid field names (defaults to string)
 */
export type SafeSuite<
  TModel extends Record<string, unknown> = Record<string, unknown>,
  TField extends string = string,
> = {
  /** Run validation with data and optional field */
  (data?: Partial<TModel>, field?: TField): SuiteResult<TField, string>;

  /** Subscribe to validation changes (only for create-based suites) */
  subscribe?: (
    callback: (result: SuiteResult<TField, string>) => void,
  ) => () => void;

  /** Get current result (only for create-based suites) */
  get?: () => SuiteResult<TField, string>;

  /** Reset the suite state (only for create-based suites) */
  reset?: () => void;

  /** Reset a specific field (only for create-based suites) */
  resetField?: (fieldName: TField) => void;
};

/**
 * Creates a **stateless** Vest validation suite with built-in `only()` guard protection.
 *
 * This is the **recommended** approach for most use cases, especially server-side validation
 * and Angular components. It wraps Vest's `staticSuite` and automatically applies the
 * unconditional `only(field)` call so every execution follows Vest best practices without
 * extra boilerplate.
 *
 * ## Why Use This?
 *
 * - ✅ **Consistent field scoping** – guarantees `only(field)` runs on every invocation
 * - ✅ **Type-safe** – generic parameters keep model and field names aligned
 * - ✅ **Server-safe** – stateless by design (uses `staticSuite` internally)
 * - ✅ **Clean API** – less boilerplate, more room for validation logic
 * - ✅ **Drop-in replacement** – behaves like `staticSuite` with added guard rails
 *
 * ## When to Use
 *
 * - ✅ Angular components with forms
 * - ✅ Server-side API validation
 * - ✅ Shared validation logic across contexts
 * - ✅ New projects (default choice)
 *
 * ## When NOT to Use
 *
 * - ❌ Need stateful suite with `.subscribe()` - use {@link createSafeSuite} instead
 * - ❌ Need `.get()` or `.reset()` methods - use {@link createSafeSuite} instead
 *
 * @template TModel - The data model type being validated
 * @template TField - Union type of valid field names for type safety (defaults to string)
 *
 * @param suiteFunction - Validation suite function containing test definitions
 * @returns A stateless Vest suite with automatic `only()` guard
 *
 * @example Basic Usage
 * ```typescript
 * import { staticSafeSuite } from 'ngx-vest-forms/core';
 * import { test, enforce } from 'vest';
 *
 * interface ContactForm {
 *   name: string;
 *   email: string;
 *   message: string;
 * }
 *
 * export const contactValidations = staticSafeSuite<ContactForm>((data) => {
 *   // No need for: if (field) { only(field); }
 *   // The wrapper handles it automatically!
 *
 *   test('name', 'Name is required', () => {
 *     enforce(data.name).isNotEmpty();
 *   });
 *
 *   test('email', 'Email is required', () => {
 *     enforce(data.email).isNotEmpty();
 *   });
 *
 *   test('email', 'Email format is invalid', () => {
 *     enforce(data.email).isEmail();
 *   });
 *
 *   test('message', 'Message is required', () => {
 *     enforce(data.message).isNotEmpty();
 *   });
 *
 *   test('message', 'Message must be at least 10 characters', () => {
 *     enforce(data.message).longerThan(9);
 *   });
 * });
 *
 * /// Usage in component
 * const result = contactValidations({ name: '', email: '', message: '' });
 * console.log(result.getErrors()); // All field errors
 *
 * const emailResult = contactValidations({ email: 'invalid' }, 'email');
 * console.log(emailResult.getErrors('email')); // Only email errors
 * ```
 *
 * @example With Type-Safe Field Names
 * ```typescript
 * import { staticSafeSuite } from 'ngx-vest-forms/core';
 * import { test, enforce, include } from 'vest';
 *
 * interface RegisterForm {
 *   username: string;
 *   email: string;
 *   password: string;
 *   confirmPassword: string;
 * }
 *
 * type RegisterFields = 'username' | 'email' | 'password' | 'confirmPassword';
 *
 * export const registerValidations = staticSafeSuite<RegisterForm, RegisterFields>(
 *   (data) => {
 *     test('username', 'Username is required', () => {
 *       enforce(data.username).isNotEmpty();
 *     });
 *
 *     test('username', 'Username must be at least 3 characters', () => {
 *       enforce(data.username).longerThan(2);
 *     });
 *
 *     test('email', 'Email is required', () => {
 *       enforce(data.email).isNotEmpty();
 *     });
 *
 *     test('email', 'Email format is invalid', () => {
 *       enforce(data.email).isEmail();
 *     });
 *
 *     test('password', 'Password must be at least 8 characters', () => {
 *       enforce(data.password).longerThan(7);
 *     });
 *
 *     // Cross-field validation
 *     include('confirmPassword').when('password');
 *     test('confirmPassword', 'Passwords must match', () => {
 *       enforce(data.confirmPassword).equals(data.password);
 *     });
 *   }
 * );
 *
 * /// TypeScript enforces valid field names
 * registerValidations(data, 'username'); // ✅ Valid
 * registerValidations(data, 'invalidField'); // ❌ Type error!
 * ```
 *
 * @example With Async Validation
 * ```typescript
 * import { staticSafeSuite } from 'ngx-vest-forms/core';
 * import { test, enforce, skipWhen } from 'vest';
 *
 * interface UserForm {
 *   email: string;
 *   username: string;
 * }
 *
 * export const userValidations = staticSafeSuite<UserForm>((data) => {
 *   test('email', 'Email is required', () => {
 *     enforce(data.email).isNotEmpty();
 *   });
 *
 *   test('email', 'Email format is invalid', () => {
 *     enforce(data.email).isEmail();
 *   });
 *
 *   // Skip expensive async check until basic validation passes
 *   skipWhen((result) => result.hasErrors('email'), () => {
 *     test('email', 'Email is already taken', async ({ signal }) => {
 *       const response = await fetch(`/api/check-email/${data.email}`, { signal });
 *       if (!response.ok) throw new Error('Email taken');
 *     });
 *   });
 *
 *   test('username', 'Username is required', () => {
 *     enforce(data.username).isNotEmpty();
 *   });
 *
 *   skipWhen((result) => result.hasErrors('username'), () => {
 *     test('username', 'Username is already taken', async ({ signal }) => {
 *       const response = await fetch(`/api/check-username/${data.username}`, { signal });
 *       if (!response.ok) throw new Error('Username taken');
 *     });
 *   });
 * });
 * ```
 *
 * @see {@link createSafeSuite} - For stateful suites with subscribe/get/reset
 * @see https://vestjs.dev/docs/writing_your_suite/including_and_excluding/skip_and_only - Vest's only() docs
 */
export function staticSafeSuite<
  TModel extends Record<string, unknown> = Record<string, unknown>,
  TField extends string = string,
>(suiteFunction: SafeSuiteFunction<TModel>): SafeSuite<TModel, TField> {
  return staticSuite((data?: Partial<TModel>, field?: TField) => {
    // ✅ CRITICAL: Always invoke only() with the incoming field value
    // MUST NOT use conditional if statement per Vest.js docs:
    // "skip() and only() should not be called conditionally"
    // When field is undefined, Vest runs the whole suite; when it's a string, only that field's tests run
    only(field); // Vest ignores falsy values, so undefined/false validate the full suite

    // Execute user's validation logic (field is handled by wrapper, not passed to user)
    suiteFunction(data);
  }) as SafeSuite<TModel, TField>;
}

/**
 * Creates a **stateful** Vest validation suite with built-in `only()` guard protection.
 *
 * This wraps Vest's `create` function and automatically applies the unconditional
 * `only(field)` call. Unlike {@link staticSafeSuite}, this variant maintains internal state
 * between calls and exposes `.subscribe()`, `.get()`, and `.reset()` helpers.
 *
 * ## Why Use This?
 *
 * - ✅ **Consistent field scoping** – guarantees `only(field)` runs on every invocation
 * - ✅ **Type-safe** – generic parameters keep model and field names aligned
 * - ✅ **Stateful** – maintains validation state across calls
 * - ✅ **Observable** – subscribe to validation changes with `.subscribe()`
 * - ✅ **Resettable** – clear state with `.reset()` or `.resetField()`
 *
 * ## When to Use
 *
 * - ✅ Need to subscribe to validation state changes
 * - ✅ Need to access current state with `.get()`
 * - ✅ Need to reset validation state programmatically
 * - ✅ Building reactive validation UI components
 *
 * ## When NOT to Use
 *
 * - ❌ Server-side validation - use {@link staticSafeSuite} (stateless, no memory leaks)
 * - ❌ Simple validation cases - use {@link staticSafeSuite} (lighter weight)
 * - ❌ Concurrent requests - use {@link staticSafeSuite} (no shared state)
 *
 * ⚠️ **Important:** Always call the returned unsubscribe function in `ngOnDestroy` to prevent memory leaks!
 *
 * @template TModel - The data model type being validated
 * @template TField - Union type of valid field names for type safety (defaults to string)
 *
 * @param suiteFunction - Validation suite function containing test definitions
 * @returns A stateful Vest suite with automatic `only()` guard
 *
 * @example Basic Usage with Subscription
 * ```typescript
 * import { createSafeSuite } from 'ngx-vest-forms/core';
 * import { test, enforce } from 'vest';
 * import { Component, OnDestroy, signal } from '@angular/core';
 *
 * interface LoginForm {
 *   email: string;
 *   password: string;
 * }
 *
 * const loginValidations = createSafeSuite<LoginForm>((data) => {
 *   test('email', 'Email is required', () => {
 *     enforce(data.email).isNotEmpty();
 *   });
 *
 *   test('email', 'Email format is invalid', () => {
 *     enforce(data.email).isEmail();
 *   });
 *
 *   test('password', 'Password is required', () => {
 *     enforce(data.password).isNotEmpty();
 *   });
 * });
 *
 * @Component({
 *   selector: 'app-login',
 *   template: `...`
 * })
 * export class LoginComponent implements OnDestroy {
 *   private readonly result = signal(loginValidations.get());
 *   private readonly unsubscribe = loginValidations.subscribe((res) => {
 *     this.result.set(res);
 *   });
 *
 *   ngOnDestroy() {
 *     this.unsubscribe(); // ✅ Prevent memory leak
 *   }
 * }
 * ```
 *
 * @example With Type-Safe Field Names
 * ```typescript
 * import { createSafeSuite } from 'ngx-vest-forms/core';
 * import { test, enforce } from 'vest';
 *
 * interface ProfileForm {
 *   displayName: string;
 *   bio: string;
 *   website: string;
 * }
 *
 * type ProfileFields = 'displayName' | 'bio' | 'website';
 *
 * const profileValidations = createSafeSuite<ProfileForm, ProfileFields>(
 *   (data) => {
 *     test('displayName', 'Display name is required', () => {
 *       enforce(data.displayName).isNotEmpty();
 *     });
 *
 *     test('bio', 'Bio must be under 500 characters', () => {
 *       enforce(data.bio).shorterThan(501);
 *     });
 *
 *     test('website', 'Website must be a valid URL', () => {
 *       enforce(data.website).isURL();
 *     });
 *   }
 * );
 *
 * /// Subscribe to changes
 * const unsubscribe = profileValidations.subscribe((result) => {
 *   console.log('Valid:', result.isValid());
 *   console.log('Errors:', result.getErrors());
 * });
 *
 * /// Run validations
 * profileValidations({ displayName: '' }); // Triggers subscription
 * profileValidations({ displayName: 'John' }, 'displayName'); // Triggers subscription
 *
 * /// Clean up
 * unsubscribe();
 * ```
 *
 * @example Resetting State
 * ```typescript
 * import { createSafeSuite } from 'ngx-vest-forms/core';
 * import { test, enforce } from 'vest';
 *
 * interface SearchForm {
 *   query: string;
 *   category: string;
 * }
 *
 * const searchValidations = createSafeSuite<SearchForm>((data) => {
 *   test('query', 'Search query is required', () => {
 *     enforce(data.query).isNotEmpty();
 *   });
 *
 *   test('query', 'Search query must be at least 3 characters', () => {
 *     enforce(data.query).longerThan(2);
 *   });
 * });
 *
 * /// Run validations
 * searchValidations({ query: 'ab' }); // Has errors
 * console.log(searchValidations.get().hasErrors('query')); // true
 *
 * /// Reset entire suite
 * searchValidations.reset();
 * console.log(searchValidations.get().hasErrors('query')); // false (untested)
 *
 * /// Run again
 * searchValidations({ query: 'valid query' });
 * console.log(searchValidations.get().hasErrors('query')); // false (valid)
 *
 * /// Reset single field
 * searchValidations.resetField('query');
 * console.log(searchValidations.get().isTested('query')); // false
 * ```
 *
 * @see {@link staticSafeSuite} - For stateless suites (recommended for most cases)
 * @see https://vestjs.dev/docs/understanding_state - Vest's state management docs
 */
export function createSafeSuite<
  TModel extends Record<string, unknown> = Record<string, unknown>,
  TField extends string = string,
>(suiteFunction: SafeSuiteFunction<TModel>): SafeSuite<TModel, TField> {
  return create((data?: Partial<TModel>, field?: TField) => {
    // ✅ CRITICAL: Always invoke only() with the incoming field value
    // MUST NOT use conditional if statement per Vest.js docs:
    // "skip() and only() should not be called conditionally"
    // When field is undefined, Vest runs the whole suite; when it's a string, only that field's tests run
    only(field); // Vest ignores falsy values, so undefined/false validate the full suite

    // Execute user's validation logic (field is handled by wrapper, not passed to user)
    suiteFunction(data);
  }) as SafeSuite<TModel, TField>;
}
