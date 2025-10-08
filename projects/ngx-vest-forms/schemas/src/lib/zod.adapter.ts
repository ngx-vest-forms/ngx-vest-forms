/**
 * Zod Standard Schema utilities for ngx-vest-forms
 *
 * **Important**: Zod v3.24.0+ natively implements StandardSchemaV1 via the `~standard` property.
 * You don't need this file for basic validation - just pass your Zod schema directly to `createVestForm`.
 *
 * This file provides **optional** utilities for advanced use cases:
 * - **Type guards**: Runtime vendor detection with TypeScript narrowing
 * - **Type helpers**: Cleaner type inference syntax
 *
 * ## Basic Usage (No adapters needed)
 *
 * ```typescript
 * import { z } from 'zod';
 * import { createVestForm } from 'ngx-vest-forms/core';
 *
 * const UserSchema = z.object({ email: z.string().email() });
 *
 * const form = createVestForm(signal({ email: '' }), suite, {
 *   schema: UserSchema, // ✅ Works directly - no adapter needed!
 * });
 *
 * /// Vendor detection (simple approach):
 * const vendor = UserSchema['~standard'].vendor; // 'zod'
 * ```
 *
 * ## Advanced Usage (With adapters)
 *
 * ```typescript
 * import { z } from 'zod';
 * import { isZodSchema, ZodInfer } from 'ngx-vest-forms/schemas';
 *
 * /// Type guard for library-specific features
 * if (isZodSchema(schema)) {
 *   // Access Zod-specific properties like _def
 *   console.log(schema._def);
 * }
 *
 * /// Cleaner type inference
 * type User = ZodInfer<typeof UserSchema>;
 * /// vs
 * type User = z.infer<typeof UserSchema>;
 * ```
 *
 * @see https://standardschema.dev/ - Official Standard Schema specification
 * @see https://github.com/colinhacks/zod - Zod documentation
 * @packageDocumentation
 */

import type { StandardSchemaV1 } from './standard-schema.types';

/**
 * Type guard to check if a schema is a Zod schema
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import { isZodSchema } from 'ngx-vest-forms/schemas';
 *
 * const UserSchema = z.object({ email: z.string().email() });
 *
 * if (isZodSchema(UserSchema)) {
 *   // TypeScript knows this is a Zod schema
 *   const result = UserSchema.safeParse(data);
 * }
 * ```
 */
export function isZodSchema(
  value: unknown,
): value is StandardSchemaV1<unknown, unknown> & { _def: unknown } {
  return (
    typeof value === 'object' &&
    value !== null &&
    '~standard' in value &&
    typeof (value as StandardSchemaV1)['~standard'] === 'object' &&
    (value as StandardSchemaV1)['~standard'].version === 1 &&
    (value as StandardSchemaV1)['~standard'].vendor === 'zod' &&
    '_def' in value
  );
}

/**
 * Helper to extract Zod schema type
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import type { ZodInfer } from 'ngx-vest-forms/schemas';
 *
 * const UserSchema = z.object({
 *   email: z.string().email(),
 *   age: z.number().min(18),
 * });
 *
 * type User = ZodInfer<typeof UserSchema>;
 * /// { email: string; age: number }
 * ```
 */
export type ZodInfer<T extends StandardSchemaV1> =
  StandardSchemaV1.InferOutput<T>;

/**
 * Helper to extract Zod input type (before transforms)
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import type { ZodInput } from 'ngx-vest-forms/schemas';
 *
 * const UserSchema = z.object({
 *   email: z.string().email(),
 *   age: z.string().transform(Number),
 * });
 *
 * type UserInput = ZodInput<typeof UserSchema>;
 * /// { email: string; age: string }
 *
 * type UserOutput = ZodInfer<typeof UserSchema>;
 * /// { email: string; age: number }
 * ```
 */
export type ZodInput<T extends StandardSchemaV1> =
  StandardSchemaV1.InferInput<T>;
