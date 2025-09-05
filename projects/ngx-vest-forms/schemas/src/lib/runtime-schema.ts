import { isDevMode } from '@angular/core';
import type { StandardSchemaV1 } from '@standard-schema/spec';

export type NgxSchemaIssue = {
  readonly path: string;
  readonly message: string;
  readonly code?: string;
};

export type NgxParseSuccess<T> = {
  readonly success: true;
  readonly value: T;
  /**
   * Optional metadata. We always include vendor if present on the underlying StandardSchema
   * and may include timing information (dev mode) plus any adapter-provided diagnostics.
   */
  readonly meta?: Record<string, unknown>;
};

export type NgxParseFailure = {
  readonly success: false;
  readonly issues: readonly NgxSchemaIssue[];
  /**
   * Includes vendor + timing + originalIssues (raw issues array prior to normalization)
   * where available so advanced UIs or logging can surface richer diagnostics without
   * the core library depending on specific schema library types.
   */
  readonly meta?: Record<string, unknown>;
};

export type NgxParseResult<T> = NgxParseSuccess<T> | NgxParseFailure;

export type NgxRuntimeSchema<T> = {
  parse(data: unknown): T;
  safeParse(data: unknown): NgxParseResult<T>;
  readonly source: unknown;
};
/**
 * Create an `NgxRuntimeSchema` from a StandardSchemaV1 object.
 *
 * This function normalizes the Standard Schema runtime `validate` result into
 * the `NgxParseResult` shape used across ngx-vest-forms. It preserves vendor
 * metadata and original issues to aid UIs and logging.
 */
export function toRuntimeSchema<T>(
  schema: StandardSchemaV1<unknown, T>,
): NgxRuntimeSchema<T> {
  const standard = schema['~standard'];
  const validate = standard.validate.bind(standard);
  type SuccessResult = { value: unknown };
  type FailureResult = {
    issues: readonly { path?: unknown; message: string; code?: string }[];
  };
  return {
    source: schema,
    parse(data: unknown): T {
      const r = validate(data) as SuccessResult | FailureResult;
      if ('value' in r) return r.value as T;
      const issues = (r.issues ?? []).map<NgxSchemaIssue>((issue) => {
        const path = Array.isArray(issue.path)
          ? (issue.path as string[]).join('.')
          : '';
        return { path, message: issue.message, code: issue.code };
      });
      if (isDevMode() && issues[0]) {
        console.warn(
          '[ngx-vest-forms][schemas] parse() throwing first issue in dev',
          issues[0],
        );
      }
      throw createAggregateError(issues);
    },
    safeParse(data: unknown): NgxParseResult<T> {
      const start = isDevMode() ? performance.now() : 0;
      const r = validate(data) as SuccessResult | FailureResult;
      if ('value' in r) {
        return {
          success: true,
          value: r.value as T,
          meta: {
            vendor: (standard as { vendor?: unknown })?.vendor as
              | string
              | undefined,
            ...(isDevMode() ? { durationMs: performance.now() - start } : null),
          },
        };
      }
      const issues = (r.issues ?? []).map<NgxSchemaIssue>((issue) => {
        const path = Array.isArray(issue.path)
          ? (issue.path as string[]).join('.')
          : '';
        return { path, message: issue.message, code: issue.code };
      });
      return {
        success: false,
        issues,
        meta: {
          vendor: (standard as { vendor?: unknown })?.vendor as
            | string
            | undefined,
          originalIssues: (r as FailureResult).issues,
          ...(isDevMode() ? { durationMs: performance.now() - start } : null),
        },
      };
    },
  };
}

/**
 * Type guard that detects the Standard Schema v1 shape (object with `~standard`).
 * Exported to make docs and code paths clearer where a `standardSchema` is
 * expected versus an arbitrary `schema` value.
 */
export function isStandardSchema(
  value: unknown,
): value is StandardSchemaV1<unknown, unknown> {
  return (
    !!value &&
    typeof value === 'object' &&
    Object.prototype.hasOwnProperty.call(value as object, '~standard')
  );
}

function createAggregateError(issues: readonly NgxSchemaIssue[]): Error {
  const message = issues
    .map((issue) =>
      issue.path ? `${issue.path}: ${issue.message}` : issue.message,
    )
    .join('\n');
  return new Error(message);
}

export function isRuntimeSchema<T = unknown>(
  value: unknown,
): value is NgxRuntimeSchema<T> {
  if (!value || typeof value !== 'object') return false;
  const maybe = value as Record<string, unknown>;
  // Use bracket notation because properties come from an index signature under strict TS config
  return (
    typeof maybe['parse'] === 'function' &&
    typeof maybe['safeParse'] === 'function'
  );
}
