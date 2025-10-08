/**
 * Public API for ngx-vest-forms/schemas
 *
 * Standard Schema adapters for popular validation libraries.
 * All major libraries (Zod, Valibot, ArkType) already implement StandardSchemaV1
 * natively, so these are just type-safe helpers.
 *
 * @packageDocumentation
 */

// Standard Schema specification (verbatim copy from standardschema.dev)
export * from './lib/standard-schema.types';

// Standard Schema helpers (convenience utilities)
export * from './lib/standard-schema.helpers';

// Adapters (type helpers and guards for specific libraries)
export * from './lib/arktype.adapter';
export * from './lib/valibot.adapter';
export * from './lib/zod.adapter';
