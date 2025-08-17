import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { SchemaAdapter } from './schema-adapter.interface';

export const zodAdapter: SchemaAdapter = {
  vendor: 'zod',
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
        vendor: 'zod',
        validate: (data: unknown) => {
          try {
            const rUnknown: unknown = (
              schema as { safeParse?: (x: unknown) => unknown }
            ).safeParse?.(data);
            if (
              rUnknown &&
              typeof rUnknown === 'object' &&
              'success' in rUnknown
            ) {
              const r = rUnknown as {
                success: boolean;
                data?: unknown;
                error?: { issues?: readonly unknown[] };
                issues?: readonly unknown[];
              };
              if (r.success) return { value: r.data as T };
              const rawIssues = (r.error?.issues ??
                r.issues ??
                []) as readonly unknown[];
              const issues = rawIssues.map((issueUnknown) => {
                const issue = issueUnknown as {
                  path?: unknown;
                  message?: unknown;
                  code?: unknown;
                };
                let pathArray: string[] = [];
                if (Array.isArray(issue.path)) {
                  pathArray = (issue.path as unknown[])
                    .filter((p) => p != null)
                    .map(String);
                } else if (typeof issue.path === 'string') {
                  pathArray = [issue.path];
                }
                const message = String(issue.message ?? 'Invalid value');
                const code =
                  typeof issue.code === 'string'
                    ? (issue.code as string)
                    : undefined;
                return { path: pathArray, message, code };
              });
              return { issues } as StandardSchemaV1.Result<T>;
            }
          } catch {
            // ignore and treat as success passthrough below
          }
          return { value: data as T };
        },
      },
    } as const;
    return standard;
  },
};
