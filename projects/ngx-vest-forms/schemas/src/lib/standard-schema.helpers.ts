/**
 * Standard Schema helper functions and convenience type exports
 *
 * This file provides ergonomic utilities for working with StandardSchemaV1:
 * - Validation helpers for standalone use cases (outside of forms)
 * - Convenience type aliases for cleaner code
 *
 * @packageDocumentation
 */

import type { StandardSchemaV1 } from './standard-schema.types';

/**
 * Convenience alias for StandardSchemaV1.InferInput<T>
 *
 * Infers the input type of a Standard Schema (before transformation/validation).
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import type { InferInput } from 'ngx-vest-forms/schemas';
 *
 * const UserSchema = z.object({
 *   email: z.string().email(),
 *   age: z.string().transform(Number),
 * });
 *
 * type UserInput = InferInput<typeof UserSchema>;
 * /// { email: string; age: string }
 * ```
 */
export type InferInput<T extends StandardSchemaV1> =
  StandardSchemaV1.InferInput<T>;

/**
 * Convenience alias for StandardSchemaV1.InferOutput<T>
 *
 * Infers the output type of a Standard Schema (after transformation/validation).
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import type { InferOutput } from 'ngx-vest-forms/schemas';
 *
 * const UserSchema = z.object({
 *   email: z.string().email(),
 *   age: z.string().transform(Number),
 * });
 *
 * type UserOutput = InferOutput<typeof UserSchema>;
 * /// { email: string; age: number }
 * ```
 */
export type InferOutput<T extends StandardSchemaV1> =
  StandardSchemaV1.InferOutput<T>;

/**
 * Convenience alias for the entire StandardSchemaV1 interface.
 *
 * Use this for shorter, more readable type annotations.
 *
 * @example
 * ```typescript
 * import type { StandardSchema } from 'ngx-vest-forms/schemas';
 *
 * function validateData<T extends StandardSchema>(schema: T, data: unknown) {
 *   /// ...
 * }
 * ```
 */
export type StandardSchema<Input = unknown, Output = Input> = StandardSchemaV1<
  Input,
  Output
>;

/**
 * Validates data against a StandardSchemaV1-compatible schema.
 *
 * Handles both synchronous and asynchronous validation automatically.
 * Returns the validation result in Standard Schema format.
 *
 * **Note**: For form validation, use `createVestForm` instead. This helper
 * is intended for standalone validation use cases outside of forms.
 *
 * @template T - The Standard Schema type
 * @param schema - A StandardSchemaV1-compatible schema (Zod, Valibot, ArkType, etc.)
 * @param value - The value to validate
 * @returns A promise resolving to the validation result
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import { validateStandardSchema } from 'ngx-vest-forms/schemas';
 *
 * const UserSchema = z.object({ email: z.string().email() });
 *
 * const result = await validateStandardSchema(UserSchema, {
 *   email: 'invalid-email',
 * });
 *
 * if (result.issues) {
 *   console.error('Validation failed:', result.issues);
 *   /// [{ message: 'Invalid email', path: ['email'] }]
 * } else {
 *   console.log('Valid data:', result.value);
 * }
 * ```
 *
 * @example Async validation
 * ```typescript
 * import * as v from 'valibot';
 * import { validateStandardSchema } from 'ngx-vest-forms/schemas';
 *
 * const EmailSchema = v.pipeAsync(
 *   v.string(),
 *   v.email(),
 *   v.checkAsync(async (email) => {
 *     const exists = await checkEmailExists(email);
 *     return !exists;
 *   }, 'Email already taken')
 * );
 *
 * const result = await validateStandardSchema(EmailSchema, 'test@example.com');
 * ```
 *
 * @see https://standardschema.dev/ - Standard Schema specification
 */
export async function validateStandardSchema<T extends StandardSchemaV1>(
  schema: T,
  value: unknown,
): Promise<StandardSchemaV1.Result<InferOutput<T>>> {
  const result = schema['~standard'].validate(value);
  return result instanceof Promise ? await result : result;
}

/**
 * Validates data synchronously against a StandardSchemaV1-compatible schema.
 *
 * **Throws an error** if the schema uses asynchronous validation.
 * Use this when you need guaranteed synchronous validation (e.g., in constructors,
 * synchronous event handlers, or performance-critical paths).
 *
 * **Note**: For form validation, use `createVestForm` instead. This helper
 * is intended for standalone validation use cases outside of forms.
 *
 * @template T - The Standard Schema type
 * @param schema - A StandardSchemaV1-compatible schema with synchronous validation only
 * @param value - The value to validate
 * @returns The validation result
 * @throws {TypeError} If the schema performs asynchronous validation
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import { validateStandardSchemaSync } from 'ngx-vest-forms/schemas';
 *
 * const UserSchema = z.object({
 *   email: z.string().email(),
 *   age: z.number().min(18),
 * });
 *
 * try {
 *   const result = validateStandardSchemaSync(UserSchema, {
 *     email: 'test@example.com',
 *     age: 25,
 *   });
 *
 *   if (result.issues) {
 *     console.error('Validation failed:', result.issues);
 *   } else {
 *     console.log('Valid data:', result.value);
 *   }
 * } catch (error) {
 *   /// TypeError: Schema validation must be synchronous
 *   console.error(error);
 * }
 * ```
 *
 * @example Error when async schema is used
 * ```typescript
 * import * as v from 'valibot';
 * import { validateStandardSchemaSync } from 'ngx-vest-forms/schemas';
 *
 * const AsyncSchema = v.pipeAsync(
 *   v.string(),
 *   v.checkAsync(async (val) => true, 'Async check')
 * );
 *
 * /// ❌ Throws TypeError
 * validateStandardSchemaSync(AsyncSchema, 'test');
 * /// TypeError: Schema validation must be synchronous.
 * ///            Use validateStandardSchema() for async validation.
 * ```
 *
 * @see https://standardschema.dev/ - Standard Schema specification
 */
export function validateStandardSchemaSync<T extends StandardSchemaV1>(
  schema: T,
  value: unknown,
): StandardSchemaV1.Result<InferOutput<T>> {
  const result = schema['~standard'].validate(value);

  if (result instanceof Promise) {
    throw new TypeError(
      'Schema validation must be synchronous. Use validateStandardSchema() for async validation.',
    );
  }

  return result;
}

/**
 * Type guard to check if a validation result represents a failure.
 *
 * Narrows the result type to `FailureResult` for TypeScript type safety.
 *
 * @param result - A Standard Schema validation result
 * @returns True if the result has validation issues (failure)
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import { validateStandardSchema, isFailureResult } from 'ngx-vest-forms/schemas';
 *
 * const result = await validateStandardSchema(schema, data);
 *
 * if (isFailureResult(result)) {
 *   /// TypeScript knows result.issues exists
 *   console.error('Errors:', result.issues);
 * } else {
 *   /// TypeScript knows result.value exists
 *   console.log('Data:', result.value);
 * }
 * ```
 */
export function isFailureResult<Output>(
  result: StandardSchemaV1.Result<Output>,
): result is StandardSchemaV1.FailureResult {
  return 'issues' in result && result.issues !== undefined;
}

/**
 * Type guard to check if a validation result represents a success.
 *
 * Narrows the result type to `SuccessResult<Output>` for TypeScript type safety.
 *
 * @param result - A Standard Schema validation result
 * @returns True if the result has no validation issues (success)
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import { validateStandardSchema, isSuccessResult } from 'ngx-vest-forms/schemas';
 *
 * const result = await validateStandardSchema(schema, data);
 *
 * if (isSuccessResult(result)) {
 *   /// TypeScript knows result.value exists and issues is undefined
 *   console.log('Valid data:', result.value);
 * } else {
 *   /// TypeScript knows result.issues exists
 *   console.error('Validation errors:', result.issues);
 * }
 * ```
 */
export function isSuccessResult<Output>(
  result: StandardSchemaV1.Result<Output>,
): result is StandardSchemaV1.SuccessResult<Output> {
  return !('issues' in result) || result.issues === undefined;
}
