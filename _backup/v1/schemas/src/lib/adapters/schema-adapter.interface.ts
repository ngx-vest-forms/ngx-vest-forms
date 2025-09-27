import type { StandardSchemaV1 } from '@standard-schema/spec';

/**
 * Minimal contract for schema adapters converting third-party schemas into
 * Standard Schema v1. Adapters must be side-effect free and tree-shakeable.
 */
export type SchemaAdapter = {
  readonly vendor: string;
  /** Return true if this adapter can likely handle the provided value. */
  isSupported(schema: unknown): boolean;
  /** Convert provided schema into a Standard Schema v1 object. */
  toStandardSchema<T = unknown>(schema: unknown): StandardSchemaV1<unknown, T>;
};
