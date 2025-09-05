import type { StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, it } from 'vitest';
import { zodAdapter } from './zod.adapter';

type StdShape<T> = {
  ['~standard']: {
    validate: (data: unknown) => StandardSchemaV1.Result<T>;
  };
};

function readCode(u: unknown): string | undefined {
  const maybe = u as { code?: unknown };
  return typeof maybe.code === 'string' ? maybe.code : undefined;
}

function toRuntime<T>(schema: StandardSchemaV1<unknown, T>) {
  const std = schema as unknown as StdShape<T>;
  const validate = std['~standard'].validate;
  return {
    safeParse: (d: unknown) => {
      const r = validate(d);
      if ('value' in r) return { success: true as const, value: r.value };
      const issues = (r.issues ?? []).map((issueEntry) => ({
        path: Array.isArray(issueEntry.path)
          ? issueEntry.path.join('.')
          : String(issueEntry.path ?? ''),
        message: issueEntry.message,
        code: readCode(issueEntry),
      }));
      return { success: false as const, issues };
    },
  };
}

describe('zodAdapter', () => {
  it('maps success via data', () => {
    const zodLike = { safeParse: () => ({ success: true, data: { a: 1 } }) };
    const std = zodAdapter.toStandardSchema<{ a: number }>(zodLike);
    const runtime = toRuntime<{ a: number }>(std);
    const r = runtime.safeParse({});
    expect(r.success).toBe(true);
    if (r.success) expect(r.value).toEqual({ a: 1 });
  });

  it('maps failure issues with path/message/code', () => {
    const zodLike = {
      safeParse: () => ({
        success: false,
        error: {
          issues: [{ path: ['a', 'b'], message: 'Bad', code: 'too_small' }],
        },
      }),
    };
    const std = zodAdapter.toStandardSchema(zodLike);
    const runtime = toRuntime(std);
    const r = runtime.safeParse({});
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.issues[0].path).toBe('a.b');
      expect(r.issues[0].message).toBe('Bad');
      expect(r.issues[0].code).toBe('too_small');
    }
  });

  it('treats unexpected shape as success passthrough', () => {
    const zodLike = { safeParse: () => ({}) };
    const std = zodAdapter.toStandardSchema(zodLike);
    const runtime = toRuntime(std);
    const r = runtime.safeParse({ raw: true });
    expect(r.success).toBe(true);
  });

  it('uses top-level issues when error.issues is missing', () => {
    const zodLike = {
      safeParse: () => ({
        success: false,
        issues: [{ path: ['root'], message: 'Invalid' }],
      }),
    };
    const std = zodAdapter.toStandardSchema(zodLike);
    const runtime = toRuntime(std);
    const r = runtime.safeParse({});
    expect(r.success).toBe(false);
    if (!r.success) expect(r.issues[0].path).toBe('root');
  });

  it('handles string and null path values', () => {
    const zodLike = {
      safeParse: () => ({
        success: false,
        error: {
          issues: [
            { path: 'a', message: 'm1' },
            { path: null, message: 'm2' },
          ],
        },
      }),
    } as unknown as { safeParse: (d: unknown) => unknown };
    const std = zodAdapter.toStandardSchema(zodLike);
    const runtime = toRuntime(std);
    const r = runtime.safeParse({});
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.issues[0].path).toBe('a');
      expect(r.issues[1].path).toBe('');
    }
  });

  it('ignores non-string code values', () => {
    const zodLike = {
      safeParse: () => ({
        success: false,
        error: { issues: [{ path: [], message: 'm', code: 123 }] },
      }),
    };
    const std = zodAdapter.toStandardSchema(zodLike);
    const runtime = toRuntime(std);
    const r = runtime.safeParse({});
    expect(r.success).toBe(false);
    if (!r.success) expect(r.issues[0].code).toBeUndefined();
  });

  it('treats thrown safeParse as passthrough success', () => {
    const zodLike = {
      safeParse: () => {
        throw new Error('boom');
      },
    };
    const std = zodAdapter.toStandardSchema<{ t: number }>(zodLike);
    const runtime = toRuntime<{ t: number }>(std);
    const r = runtime.safeParse({ t: 1 });
    expect(r.success).toBe(true);
    if (r.success) expect(r.value).toEqual({ t: 1 });
  });
});
