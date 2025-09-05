import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { SchemaAdapter } from './schema-adapter.interface';

export const arktypeAdapter: SchemaAdapter = {
  vendor: 'arktype',
  isSupported(schema: unknown): boolean {
    return typeof schema === 'function';
  },
  toStandardSchema<T = unknown>(schema: unknown): StandardSchemaV1<unknown, T> {
    const function_ = schema as (
      data: unknown,
    ) => T | { summary?: string } | object;
    const standard = {
      '~standard': {
        version: 1 as const,
        vendor: 'arktype',
        validate: (data: unknown) => {
          const r = function_(data) as T | { summary?: string } | object;
          if (r && typeof r === 'object' && 'summary' in r) {
            const summaryLines = String(
              (r as { summary?: string }).summary || 'Invalid data',
            )
              .split('\n')
              .map((l) => l.trim())
              .filter(Boolean);
            return {
              issues: summaryLines.map((m) => ({ message: m })),
            } as StandardSchemaV1.Result<T>;
          }
          return { value: r as T };
        },
      },
    } as const;
    return standard;
  },
};
