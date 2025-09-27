import type { StandardSchemaV1 } from '@standard-schema/spec';
import { ngxModelToStandardSchema } from '../schema-adapter';
import type { SchemaAdapter } from './schema-adapter.interface';

export const customModelAdapter: SchemaAdapter = {
  vendor: 'ngx-model',
  isSupported(schema: unknown): boolean {
    return (
      !!schema &&
      typeof schema === 'object' &&
      Object.prototype.hasOwnProperty.call(schema as object, '_shape')
    );
  },
  toStandardSchema<T = unknown>(schema: unknown): StandardSchemaV1<unknown, T> {
    // Already in our custom standard schema shape if it has ~standard
    if (
      schema &&
      typeof schema === 'object' &&
      Object.prototype.hasOwnProperty.call(schema as object, '~standard')
    ) {
      return schema as StandardSchemaV1<unknown, T>;
    }
    // Fallback: if someone passed a plain object as a template, wrap it.
    if (schema && typeof schema === 'object' && !Array.isArray(schema)) {
      return ngxModelToStandardSchema(
        schema as Record<string, unknown>,
      ) as unknown as StandardSchemaV1<unknown, T>;
    }
    // Degenerate case: create minimal standard schema that passes value through
    return {
      '~standard': {
        version: 1 as const,
        vendor: 'ngx-model',
        validate: (data: unknown) => ({ value: data as T }),
      },
    } as const;
  },
};
