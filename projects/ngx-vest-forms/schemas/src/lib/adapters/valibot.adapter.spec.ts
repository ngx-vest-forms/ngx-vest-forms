import type { StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, it } from 'vitest';
import { valibotAdapter } from './valibot.adapter';

type StdShape<T> = {
  ['~standard']: {
    validate: (data: unknown) => StandardSchemaV1.Result<T>;
  };
};

function toRuntime<T>(schema: StandardSchemaV1<unknown, T>) {
  const std = schema as unknown as StdShape<T>;
  const validate = std['~standard'].validate;
  return {
    safeParse: (d: unknown) => {
      const r = validate(d);
      if ('value' in r) return { success: true as const, value: r.value };
      const issues = (r.issues ?? []).map((issue) => ({
        path: Array.isArray(issue.path)
          ? issue.path.join('.')
          : String(issue.path ?? ''),
        message: issue.message,
        // valibot adapter places code via issue or type
        code: undefined as string | undefined,
      }));
      return { success: false as const, issues };
    },
  };
}

describe('valibotAdapter', () => {
  it('maps success via output', () => {
    const valibotLike = {
      safeParse: () => ({ success: true, output: { y: 2 } }),
    };
    const std = valibotAdapter.toStandardSchema<{ y: number }>(valibotLike);
    const runtime = toRuntime<{ y: number }>(std);
    const r = runtime.safeParse({});
    expect(r.success).toBe(true);
    if (r.success) expect(r.value).toEqual({ y: 2 });
  });

  it('maps success via data when output missing', () => {
    const valibotLike = {
      safeParse: () => ({ success: true, data: { z: 3 } }),
    };
    const std = valibotAdapter.toStandardSchema<{ z: number }>(valibotLike);
    const runtime = toRuntime<{ z: number }>(std);
    const r = runtime.safeParse({});
    expect(r.success).toBe(true);
    if (r.success) expect(r.value).toEqual({ z: 3 });
  });

  it('maps failure issues from issue/type and path array', () => {
    const valibotLike = {
      safeParse: () => ({
        success: false,
        issues: [
          { path: ['p'], message: 'Problem', issue: 'too_small' },
          { path: ['q'], message: 'Type', type: 'invalid_type' },
        ],
      }),
    };
    const std =
      valibotAdapter.toStandardSchema<Record<string, unknown>>(valibotLike);
    const stdShape = std as unknown as StdShape<Record<string, unknown>>;
    const r = stdShape['~standard'].validate({});
    expect('issues' in r && Array.isArray(r.issues)).toBe(true);
    if ('issues' in r) {
      expect(r.issues?.[0].message).toBe('Problem');
      expect(
        Array.isArray(r.issues?.[0].path)
          ? (r.issues?.[0].path as string[]).join('.')
          : '',
      ).toBe('p');
      type IssueWithCode = { code?: string } & {
        message: string;
        path?: readonly string[];
      };
      const firstIssue = r.issues?.[0] as IssueWithCode | undefined;
      const secondIssue = r.issues?.[1] as IssueWithCode | undefined;
      expect(firstIssue?.code).toBe('too_small');
      expect(secondIssue?.code).toBe('invalid_type');
    }
  });

  it('prefers issue over type when both present', () => {
    const valibotLike = {
      safeParse: () => ({
        success: false,
        issues: [
          { path: ['p'], message: 'x', issue: 'primary', type: 'secondary' },
        ],
      }),
    };
    const std =
      valibotAdapter.toStandardSchema<Record<string, unknown>>(valibotLike);
    const stdShape = std as unknown as StdShape<Record<string, unknown>>;
    const r = stdShape['~standard'].validate({});
    if ('issues' in r) {
      const firstIssue = r.issues?.[0] as { code?: string } | undefined;
      expect(firstIssue?.code).toBe('primary');
    }
  });

  it('handles non-array/non-string paths by producing empty path', () => {
    const valibotLike = {
      safeParse: () => ({
        success: false,
        issues: [{ path: 123, message: 'weird' }],
      }),
    } as const;
    const std = valibotAdapter.toStandardSchema(valibotLike);
    const stdShape = std as unknown as StdShape<Record<string, unknown>>;
    const r = stdShape['~standard'].validate({});
    if ('issues' in r) {
      const only = r.issues?.[0];
      const path = Array.isArray(only?.path) ? (only?.path as string[]) : [];
      expect(path.length).toBe(0);
    }
  });

  it('treats thrown safeParse as passthrough success', () => {
    const valibotLike = {
      safeParse: () => {
        throw new Error('boom');
      },
    };
    const std = valibotAdapter.toStandardSchema<{ ok: boolean }>(valibotLike);
    const stdShape = std as unknown as StdShape<{ ok: boolean }>;
    const r = stdShape['~standard'].validate({ ok: true });
    expect('value' in r).toBe(true);
  });

  it('handles empty or missing issues by returning empty list', () => {
    const valibotLike = {
      safeParse: () => ({ success: false, issues: [] as unknown[] }),
    };
    const std = valibotAdapter.toStandardSchema(valibotLike);
    const stdShape = std as unknown as StdShape<Record<string, unknown>>;
    const r = stdShape['~standard'].validate({});
    if ('issues' in r) expect((r.issues ?? []).length).toBe(0);
  });
});
