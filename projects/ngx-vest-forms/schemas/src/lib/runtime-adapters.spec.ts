import { describe, expect, it } from 'vitest';
import { fromArkType, fromValibot, fromZod } from './runtime-adapters';

// We mock minimal safeParse behavior; we don't import actual libs to keep peer optional.

describe('runtime-adapters fromZod', () => {
  it('maps success result', () => {
    const mockSchema = { safeParse: () => ({ success: true, data: { x: 1 } }) };
    const runtime = fromZod<{ x: number }>(mockSchema);
    const r = runtime.safeParse({});
    expect(r.success).toBe(true);
    if (r.success) expect(r.value).toEqual({ x: 1 });
  });

  it('maps failure issues with path array -> joined path via runtime layer', () => {
    const mockSchema = {
      safeParse: () => ({
        success: false,
        error: { issues: [{ path: ['a', 'b'], message: 'Bad', code: 'x' }] },
      }),
    };
    const runtime = fromZod<Record<string, unknown>>(mockSchema);
    const r = runtime.safeParse({});
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.issues[0].path).toBe('a.b');
      expect(r.issues[0].message).toBe('Bad');
      expect(r.issues[0].code).toBe('x');
    }
  });

  it('gracefully treats unexpected shape as success passthrough', () => {
    const mockSchema = { safeParse: () => ({}) }; // missing success flag
    const runtime = fromZod<Record<string, unknown>>(mockSchema);
    const r = runtime.safeParse({ raw: true });
    expect(r.success).toBe(true);
  });
});

describe('runtime-adapters fromValibot', () => {
  it('maps success result (output)', () => {
    const mockSchema = {
      safeParse: () => ({ success: true, output: { y: 2 } }),
    };
    const runtime = fromValibot<{ y: number }>(mockSchema);
    const r = runtime.safeParse({});
    expect(r.success).toBe(true);
    if (r.success) expect(r.value).toEqual({ y: 2 });
  });

  it('maps failure issues with issue + type codes', () => {
    const mockSchema = {
      safeParse: () => ({
        success: false,
        issues: [{ path: ['p'], message: 'Problem', issue: 'too_small' }],
      }),
    };
    const runtime = fromValibot<Record<string, unknown>>(mockSchema);
    const r = runtime.safeParse({});
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.issues[0].path).toBe('p');
      expect(r.issues[0].code).toBe('too_small');
    }
  });

  it('fallback to data when no output field present', () => {
    const mockSchema = { safeParse: () => ({ success: true, data: { z: 3 } }) };
    const runtime = fromValibot<{ z: number }>(mockSchema);
    const r = runtime.safeParse({});
    expect(r.success).toBe(true);
    if (r.success) expect(r.value).toEqual({ z: 3 });
  });
});

describe('runtime-adapters fromArkType', () => {
  it('passes through valid value', () => {
    const ark = (d: unknown) => ({ ok: true, ...(d as object) });
    const runtime = fromArkType<Record<string, unknown>>(ark);
    const r = runtime.safeParse({ foo: 'bar' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.value.foo).toBe('bar');
  });

  it('maps summary error lines to issues', () => {
    const ark = () => ({ summary: 'First issue\nSecond issue' });
    const runtime = fromArkType<Record<string, unknown>>(ark);
    const r = runtime.safeParse({});
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.issues.map((issue) => issue.message)).toEqual([
        'First issue',
        'Second issue',
      ]);
    }
  });
});
