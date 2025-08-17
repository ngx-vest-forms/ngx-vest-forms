import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { SchemaAdapter } from './schema-adapter.interface';

export const valibotAdapter: SchemaAdapter = {
  vendor: 'valibot',
  isSupported(schema: unknown): boolean {
    return (
      !!schema &&
      typeof schema === 'object' &&
      'safeParse' in (schema as object)
    );
  },
  toStandardSchema<T = unknown>(schema: unknown): StandardSchemaV1<unknown, T> {
    const standard = {
      '~standard': {
        version: 1 as const,
        vendor: 'valibot',
        validate: (data: unknown) => {
          try {
            const r: unknown = (
              schema as { safeParse?: (x: unknown) => unknown }
            ).safeParse?.(data);
            if (r && typeof r === 'object' && 'success' in r) {
              const result = r as {
                success: boolean;
                output?: unknown;
                data?: unknown;
                issues?: readonly unknown[];
              };
              if (result.success)
                return { value: (result.output ?? result.data) as T };
              const issuesRaw = (result.issues ?? []) as readonly unknown[];
              const issues = issuesRaw.map((issueUnknown) => {
                const iss = issueUnknown as {
                  path?: unknown;
                  message?: unknown;
                  issue?: unknown;
                  type?: unknown;
                };
                const pathArray: string[] = Array.isArray(iss.path)
                  ? (iss.path as unknown[]).filter((p) => p != null).map(String)
                  : typeof iss.path === 'string'
                    ? [String(iss.path)]
                    : [];
                const message = String(iss.message ?? 'Invalid value');
                const code = (iss.issue ?? iss.type) as string | undefined;
                return { path: pathArray, message, code };
              });
              return { issues } as StandardSchemaV1.Result<T>;
            }
          } catch {
            // ignore and treat as success passthrough
          }
          return { value: data as T };
        },
      },
    } as const;
    return standard;
  },
};
