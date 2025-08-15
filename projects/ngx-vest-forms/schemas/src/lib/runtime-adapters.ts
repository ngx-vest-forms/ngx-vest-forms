/**
 * Lightweight adapter helpers turning common third-party schema objects into
 * NgxRuntimeSchema instances (via StandardSchemaV1 wrapper + toRuntimeSchema).
 *
 * We purposefully avoid importing the actual libraries (zod/valibot/arktype)
 * to keep them as optional peer dependencies for the host application. The
 * functions rely purely on structural typing so any object matching the
 * expected shape will work. This keeps the core library slim.
 */
import type { StandardSchemaV1 } from '@standard-schema/spec';
import { toRuntimeSchema, type NgxRuntimeSchema } from './runtime-schema';

/**
 * Convenience alias for the Standard Schema v1 type used in public APIs/docs.
 * Use `StandardSchema<TInput, TOutput>` in docs or param names to make intent
 * explicit (see README guidance on `standardSchema` vs `schema`).
 */
export type StandardSchema<
  TInput = unknown,
  TOutput = unknown,
> = StandardSchemaV1<TInput, TOutput>;

// ---------------------------------------------------------------------------
// Zod
// ---------------------------------------------------------------------------
/** Minimal structural type for a Zod schema (we only need safeParse). */
export type ZodLikeSchema = { safeParse: (data: unknown) => unknown };

/**
 * Wrap a Zod schema into a NgxRuntimeSchema.
 *
 * We intentionally accept `schema: any` to avoid tight structural coupling with
 * Zod's internal types (which include symbols in paths causing TS2345 errors).
 * Callers should supply a generic type parameter for the inferred output.
 */
export function fromZod<T = unknown>(schema: unknown): NgxRuntimeSchema<T> {
  const standard = {
    '~standard': {
      version: 1 as const,
      vendor: 'zod',
      validate: (data: unknown): StandardSchemaV1.Result<T> => {
        try {
          const r: unknown = (schema as ZodLikeSchema | undefined)?.safeParse?.(
            data,
          );
          if (r && typeof r === 'object' && 'success' in r) {
            const result = r as {
              success: boolean;
              data?: unknown;
              error?: { issues?: readonly unknown[] };
              // Some wrappers may return issues at the top level instead of under error
              issues?: readonly unknown[];
            };
            if (result.success) return { value: result.data as T };
            const issuesRaw: readonly unknown[] =
              result.error?.issues ?? result.issues ?? [];
            return {
              issues: issuesRaw.map((issue) => ({
                path: ((): string[] => {
                  if (!issue || typeof issue !== 'object') return [];
                  const pathValue = (issue as { path?: unknown }).path;
                  if (Array.isArray(pathValue)) {
                    return (pathValue as unknown[])
                      .filter((p) => p != null)
                      .map(String);
                  }
                  if (typeof pathValue === 'string') {
                    return [pathValue];
                  }
                  return [];
                })(),
                message: ((): string => {
                  if (
                    issue &&
                    typeof issue === 'object' &&
                    'message' in issue
                  ) {
                    return String(
                      (issue as { message?: unknown }).message ??
                        'Invalid value',
                    );
                  }
                  return 'Invalid value';
                })(),
                code: ((): string | undefined => {
                  if (issue && typeof issue === 'object' && 'code' in issue) {
                    return (issue as { code?: unknown }).code as
                      | string
                      | undefined;
                  }
                  return undefined;
                })(),
              })),
            };
          }
        } catch {
          // Fall through to generic success return below; dev console already shows error via caller if needed.
        }
        return { value: data as T };
      },
    },
  } as const;
  return toRuntimeSchema(standard);
}

// ---------------------------------------------------------------------------
// Valibot
// ---------------------------------------------------------------------------
/** Minimal structural type for a Valibot schema (safeParse -> {success, output|issues}). */
export type ValibotLikeSchema = { safeParse: (data: unknown) => unknown };

/**
 * Wrap a Valibot schema (or wrapper exposing safeParse) into a NgxRuntimeSchema.
 * Accepts `any` to stay decoupled from Valibot internal typings.
 */
export function fromValibot<T = unknown>(schema: unknown): NgxRuntimeSchema<T> {
  const standard = {
    '~standard': {
      version: 1 as const,
      vendor: 'valibot',
      validate: (data: unknown): StandardSchemaV1.Result<T> => {
        try {
          const r: unknown = (
            schema as ValibotLikeSchema | undefined
          )?.safeParse?.(data);
          if (r && typeof r === 'object' && 'success' in r) {
            const result = r as {
              success: boolean;
              output?: unknown;
              data?: unknown;
              issues?: readonly unknown[];
            };
            if (result.success)
              return { value: (result.output ?? result.data) as T };
            const issuesRaw: readonly unknown[] = result.issues ?? [];
            return {
              issues: issuesRaw.map((issue) => {
                return {
                  path: ((): string[] => {
                    if (!issue || typeof issue !== 'object') return [];
                    const pathValue = (issue as { path?: unknown }).path;
                    if (Array.isArray(pathValue)) {
                      return (pathValue as unknown[])
                        .filter((p) => p != null)
                        .map(String);
                    }
                    if (typeof pathValue === 'string') {
                      return [pathValue];
                    }
                    return [];
                  })(),
                  message: ((): string => {
                    if (
                      issue &&
                      typeof issue === 'object' &&
                      'message' in issue
                    ) {
                      return String(
                        (issue as { message?: unknown }).message ??
                          'Invalid value',
                      );
                    }
                    return 'Invalid value';
                  })(),
                  code: ((): string | undefined => {
                    if (issue && typeof issue === 'object') {
                      const issueKey = (issue as { issue?: unknown }).issue;
                      const typeKey = (issue as { type?: unknown }).type;
                      return (issueKey ?? typeKey) as string | undefined;
                    }
                    return undefined;
                  })(),
                };
              }),
            };
          }
        } catch {
          // Ignore and treat as pass-through success.
        }
        return { value: data as T };
      },
    },
  } as const;
  return toRuntimeSchema(standard);
}

// ---------------------------------------------------------------------------
// ArkType 2.x
// ---------------------------------------------------------------------------
/** Minimal structural type for an ArkType type function which returns either value or ArkErrors instance. */
export type ArkTypeLike<T> = (
  data: unknown,
) => T | { readonly summary?: string } | object; // duck-type errors

/**
 * ArkType does not expose a universal structural discriminator without types.
 * We heuristically treat returned object possessing a `summary` string AND
 * lacking the expected data shape as an error container (ArkErrors).
 */
export function fromArkType<T>(ark: ArkTypeLike<T>): NgxRuntimeSchema<T> {
  const standard = {
    '~standard': {
      version: 1 as const,
      vendor: 'arktype',
      validate: (data: unknown): StandardSchemaV1.Result<T> => {
        const r = ark(data) as T | { summary?: string } | object;
        if (r && typeof r === 'object' && 'summary' in r) {
          const summaryLines = String(
            (r as { summary?: string }).summary || 'Invalid data',
          )
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean);
          return { issues: summaryLines.map((m) => ({ message: m })) };
        }
        return { value: r as T };
      },
    },
  } as const;
  return toRuntimeSchema(standard);
}

export type ThirdPartyRuntimeAdapters =
  | typeof fromZod
  | typeof fromValibot
  | typeof fromArkType;

/**
 * Heuristic adapter that attempts to wrap an arbitrary schema-like value into a NgxRuntimeSchema.
 * Order of detection:
 * 1. Already a NgxRuntimeSchema (duck-typed parse+safeParse)
 * 2. StandardSchemaV1 shape ("~standard" with validate fn)
 * 3. Has safeParse method -> treat as Zod/Valibot (we attempt both semantics but they share shape we use)
 * 4. Function (assume ArkType style) -> fromArkType
 * 5. Fallback: identity schema that always succeeds.
 */
export function toAnyRuntimeSchema<T = unknown>(
  schema: unknown,
): NgxRuntimeSchema<T> {
  // 1. Already runtime schema
  if (
    schema &&
    typeof schema === 'object' &&
    'parse' in schema &&
    'safeParse' in schema
  ) {
    return schema as NgxRuntimeSchema<T>;
  }
  // 2. StandardSchemaV1 shape
  if (schema && typeof schema === 'object' && '~standard' in schema) {
    return toRuntimeSchema(schema as StandardSchemaV1<unknown, T>);
  }
  // 3. safeParse based (Zod/Valibot)
  if (
    schema &&
    typeof schema === 'object' &&
    'safeParse' in schema &&
    typeof (schema as { safeParse?: unknown }).safeParse === 'function'
  ) {
    // We cannot easily differentiate Zod vs Valibot using only structure here; their normalization logic is symmetric enough for our purposes.
    return fromZod<T>(schema);
  }
  // 4. Function (ArkType style)
  if (typeof schema === 'function') {
    const arkWrapped = fromArkType(schema as (data: unknown) => unknown);
    return arkWrapped as NgxRuntimeSchema<T>; // safe: caller controls generic expectation
  }
  // 5. Fallback identity schema
  const identityStandard = {
    '~standard': {
      version: 1 as const,
      vendor: 'identity',
      validate: (value: unknown) => ({ value }) as StandardSchemaV1.Result<T>,
    },
  } as const;
  return toRuntimeSchema(identityStandard);
}

/**
 * Type guard to check for the Standard Schema v1 "~standard" shape. Exported
 * so callers can explicitly test for a Standard Schema prior to adapting or
 * for improved doc clarity when implementing custom adapters.
 */
export function isStandardSchema(value: unknown): value is StandardSchema {
  return (
    !!value &&
    typeof value === 'object' &&
    Object.prototype.hasOwnProperty.call(value as object, '~standard')
  );
}

/**
 * Non-breaking alias with a slightly more explicit name. `toAnyRuntimeSchema`
 * is retained for backward compatibility; prefer `normalizeToRuntimeSchema`
 * in new code and documentation when you mean "convert/normalize any
 * schema-like value into an NgxRuntimeSchema".
 */
export const normalizeToRuntimeSchema = toAnyRuntimeSchema;
