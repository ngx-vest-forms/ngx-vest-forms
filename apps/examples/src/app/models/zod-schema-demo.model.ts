import { z } from 'zod';
import { NgxDeepPartial, StandardSchemaV1 } from 'ngx-vest-forms';

/**
 * Zod schema demo using Zod v4's built-in Standard Schema (~v1) support.
 *
 * Zod v4+ implements the Standard Schema spec natively, so any Zod schema can
 * be passed directly to the `[formContract]` input on FormDirective.
 * Fields are `.optional()` to mirror template-driven forms' deep-partial model
 * (the DOM builds values incrementally as the user types).
 * @see https://zod.dev
 * @see https://standardschema.dev
 */
export const zodSchemaDemoContract = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
  age: z.number().optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      zipCode: z.string().optional(),
    })
    .optional(),
});

export type ZodSchemaDemoModel = NgxDeepPartial<z.infer<typeof zodSchemaDemoContract>>;

// Compile-time assertion that the Zod schema satisfies StandardSchemaV1.
// Compile-time check: Zod v4 schemas implement StandardSchemaV1 natively.
const _typecheck: StandardSchemaV1<ZodSchemaDemoModel> = zodSchemaDemoContract;
void _typecheck;
