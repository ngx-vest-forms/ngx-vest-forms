/**
 * ArkType Standard Schema utilities for ngx-vest-forms
 *
 * **Important**: ArkType v2.0+ natively implements StandardSchemaV1 via the `~standard` property.
 * You don't need this file for basic validation - just pass your ArkType schema directly to `createVestForm`.
 *
 * This file provides **optional** utilities for advanced use cases:
 * - **Type guards**: Runtime vendor detection with TypeScript narrowing
 * - **Type helpers**: Cleaner type inference syntax
 *
 * ## Basic Usage (No adapters needed)
 *
 * ```typescript
 * import { type } from 'arktype';
 * import { createVestForm } from 'ngx-vest-forms/core';
 *
 * const UserSchema = type({ email: 'string.email' });
 *
 * const form = createVestForm(signal({ email: '' }), suite, {
 *   schema: UserSchema, // ✅ Works directly - no adapter needed!
 * });
 *
 * // Vendor detection (simple approach):
 * const vendor = UserSchema['~standard'].vendor; // 'arktype'
 * ```
 *
 * ## Advanced Usage (With adapters)
 *
 * ```typescript
 * import { type } from 'arktype';
 * import { isArkTypeSchema, ArkTypeInfer } from 'ngx-vest-forms/schemas';
 *
 * // Type guard for library-specific features
 * if (isArkTypeSchema(schema)) {
 *   // Access ArkType-specific properties like infer
 *   console.log(schema.infer);
 * }
 *
 * // Cleaner type inference
 * type User = ArkTypeInfer<typeof UserSchema>;
 * // vs
 * type User = typeof UserSchema.infer;
 * ```
 *
 * @see https://standardschema.dev/ - Official Standard Schema specification
 * @see https://arktype.io/ - ArkType documentation
 * @packageDocumentation
 */

import type { StandardSchemaV1 } from './standard-schema.types';

/**
 * Type guard to check if a schema is an ArkType schema
 *
 * @example
 * ```typescript
 * import { type } from 'arktype';
 * import { isArkTypeSchema } from 'ngx-vest-forms/schemas';
 *
 * const UserSchema = type({ email: 'string.email', age: 'number' });
 *
 * if (isArkTypeSchema(UserSchema)) {
 *   /// TypeScript knows this is an ArkType schema
 *   const result = UserSchema(data);
 * }
 * ```
 */
export function isArkTypeSchema(
  value: unknown,
): value is StandardSchemaV1<unknown, unknown> & { infer: unknown } {
  return (
    typeof value === 'object' &&
    value !== null &&
    '~standard' in value &&
    typeof (value as StandardSchemaV1)['~standard'] === 'object' &&
    (value as StandardSchemaV1)['~standard'].version === 1 &&
    (value as StandardSchemaV1)['~standard'].vendor === 'arktype' &&
    'infer' in value
  );
}

/**
 * Helper to extract ArkType schema type
 *
 * @example
 * ```typescript
 * import { type } from 'arktype';
 * import type { ArkTypeInfer } from 'ngx-vest-forms/schemas';
 *
 * const UserSchema = type({
 *   email: 'string.email',
 *   age: 'number>=18',
 * });
 *
 * type User = ArkTypeInfer<typeof UserSchema>;
 * /// { email: string; age: number }
 * ```
 */
export type ArkTypeInfer<T extends StandardSchemaV1> =
  StandardSchemaV1.InferOutput<T>;

/**
 * Helper to extract ArkType input type
 *
 * @example
 * ```typescript
 * import { type } from 'arktype';
 * import type { ArkTypeInput } from 'ngx-vest-forms/schemas';
 *
 * const UserSchema = type({
 *   email: 'string.email',
 *   age: 'number',
 * });
 *
 * type UserInput = ArkTypeInput<typeof UserSchema>;
 * /// { email: string; age: number }
 * ```
 */
export type ArkTypeInput<T extends StandardSchemaV1> =
  StandardSchemaV1.InferInput<T>;
