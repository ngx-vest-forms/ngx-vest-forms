/**
 * Valibot Standard Schema utilities for ngx-vest-forms
 *
 * **Important**: Valibot v1.0+ natively implements StandardSchemaV1 via the `~standard` property.
 * You don't need this file for basic validation - just pass your Valibot schema directly to `createVestForm`.
 *
 * This file provides **optional** utilities for advanced use cases:
 * - **Type guards**: Runtime vendor detection with TypeScript narrowing
 * - **Type helpers**: Cleaner type inference syntax
 *
 * ## Basic Usage (No adapters needed)
 *
 * ```typescript
 * import * as v from 'valibot';
 * import { createVestForm } from 'ngx-vest-forms/core';
 *
 * const UserSchema = v.object({ email: v.pipe(v.string(), v.email()) });
 *
 * const form = createVestForm(signal({ email: '' }), suite, {
 *   schema: UserSchema, // ✅ Works directly - no adapter needed!
 * });
 *
 * // Vendor detection (simple approach):
 * const vendor = UserSchema['~standard'].vendor; // 'valibot'
 * ```
 *
 * ## Advanced Usage (With adapters)
 *
 * ```typescript
 * import * as v from 'valibot';
 * import { isValibotSchema, ValibotInfer } from 'ngx-vest-forms/schemas';
 *
 * // Type guard for library-specific features
 * if (isValibotSchema(schema)) {
 *   // Access Valibot-specific properties like _run
 *   console.log(schema._run);
 * }
 *
 * // Cleaner type inference
 * type User = ValibotInfer<typeof UserSchema>;
 * // vs
 * type User = v.InferOutput<typeof UserSchema>;
 * ```
 *
 * @see https://standardschema.dev/ - Official Standard Schema specification
 * @see https://valibot.dev/ - Valibot documentation
 * @packageDocumentation
 */

import type { StandardSchemaV1 } from './standard-schema.types';

/**
 * Type guard to check if a schema is a Valibot schema
 *
 * @example
 * ```typescript
 * import * as v from 'valibot';
 * import { isValibotSchema } from 'ngx-vest-forms/schemas';
 *
 * const UserSchema = v.object({ email: v.pipe(v.string(), v.email()) });
 *
 * if (isValibotSchema(UserSchema)) {
 *   // TypeScript knows this is a Valibot schema
 *   const result = v.safeParse(UserSchema, data);
 * }
 * ```
 */
export function isValibotSchema(
  value: unknown,
): value is StandardSchemaV1<unknown, unknown> & { _run: unknown } {
  return (
    typeof value === 'object' &&
    value !== null &&
    '~standard' in value &&
    typeof (value as StandardSchemaV1)['~standard'] === 'object' &&
    (value as StandardSchemaV1)['~standard'].version === 1 &&
    (value as StandardSchemaV1)['~standard'].vendor === 'valibot' &&
    '_run' in value
  );
}

/**
 * Helper to extract Valibot schema type
 *
 * @example
 * ```typescript
 * import * as v from 'valibot';
 * import type { ValibotInfer } from 'ngx-vest-forms/schemas';
 *
 * const UserSchema = v.object({
 *   email: v.pipe(v.string(), v.email()),
 *   age: v.pipe(v.number(), v.minValue(18)),
 * });
 *
 * type User = ValibotInfer<typeof UserSchema>;
 * // { email: string; age: number }
 * ```
 */
export type ValibotInfer<T extends StandardSchemaV1> =
  StandardSchemaV1.InferOutput<T>;

/**
 * Helper to extract Valibot input type (before transforms)
 *
 * @example
 * ```typescript
 * import * as v from 'valibot';
 * import type { ValibotInput } from 'ngx-vest-forms/schemas';
 *
 * const UserSchema = v.object({
 *   email: v.pipe(v.string(), v.email()),
 *   age: v.pipe(v.string(), v.transform(Number)),
 * });
 *
 * type UserInput = ValibotInput<typeof UserSchema>;
 * // { email: string; age: string }
 *
 * type UserOutput = ValibotInfer<typeof UserSchema>;
 * // { email: string; age: number }
 * ```
 */
export type ValibotInput<T extends StandardSchemaV1> =
  StandardSchemaV1.InferInput<T>;
