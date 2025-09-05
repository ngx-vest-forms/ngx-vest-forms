import { isDevMode } from '@angular/core';

export type SchemaIssue = { path?: string; message: string };

export type SchemaParseResult = {
  success: boolean;
  issues: SchemaIssue[];
  meta?: Record<string, unknown>;
};

/**
 * Extracts a model template from a schema-like object created by ngxModelToStandardSchema.
 * Returns null for schemas that do not expose a `_shape` property.
 */
export function extractTemplateFromSchema<T = unknown>(
  schema: unknown,
): T | null {
  const candidate = schema as { _shape?: unknown } | null;
  if (schema && typeof schema === 'object' && candidate?._shape) {
    return candidate._shape as T;
  }
  return null;
}

/**
 * Safely parse data using either a runtime schema with safeParse or a StandardSchemaV1 via ~standard.validate.
 * Falls back to success when schema type is not recognized.
 */
export function safeParseWithAnySchema(
  schema: unknown,
  data: unknown,
): SchemaParseResult {
  // Runtime schema with safeParse
  if (
    schema &&
    typeof schema === 'object' &&
    typeof (schema as { safeParse?: (d: unknown) => unknown }).safeParse ===
      'function'
  ) {
    try {
      const result = (
        schema as { safeParse: (d: unknown) => unknown }
      ).safeParse(data) as
        | {
            success: boolean;
            issues?: { path?: string; message?: string }[];
            meta?: Record<string, unknown>;
          }
        | undefined;
      const issues = (result?.issues ?? []).map((issue) => ({
        path: issue?.path,
        message: issue?.message ?? 'Invalid',
      }));
      return { success: !!result?.success, issues, meta: result?.meta };
    } catch (error) {
      if (isDevMode()) {
        console.error('[ngx-vest-forms] Schema safeParse error:', error);
      }
      return { success: false, issues: [{ message: 'Schema error' }] };
    }
  }

  // StandardSchemaV1: use ~standard.validate
  if (
    schema &&
    typeof schema === 'object' &&
    (
      schema as {
        ['~standard']?: { vendor?: string; validate?: (d: unknown) => unknown };
      }
    )['~standard'] &&
    typeof (
      schema as { ['~standard']: { validate?: (d: unknown) => unknown } }
    )['~standard'].validate === 'function'
  ) {
    try {
      const std = (
        schema as {
          ['~standard']: { vendor?: string; validate: (d: unknown) => unknown };
        }
      )['~standard'];
      const out = std.validate(data) as
        | { value?: unknown }
        | { issues?: { path?: string; message?: string }[] }
        | undefined;
      if (out && 'value' in out) {
        return { success: true, issues: [], meta: { vendor: std.vendor } };
      }
      const issues = (
        out && 'issues' in out
          ? ((out as { issues?: { path?: string; message?: string }[] })
              .issues ?? [])
          : []
      ).map((issue) => ({
        path: issue?.path,
        message: issue?.message ?? 'Invalid',
      }));
      return { success: false, issues, meta: { vendor: std.vendor } };
    } catch (error) {
      if (isDevMode()) {
        console.error('[ngx-vest-forms] StandardSchema validate error:', error);
      }
      return { success: false, issues: [{ message: 'Schema error' }] };
    }
  }

  // Unknown/unsupported schema type
  return { success: true, issues: [] };
}
