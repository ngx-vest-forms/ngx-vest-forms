import type { StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, it } from 'vitest';
import { isRuntimeSchema, toRuntimeSchema } from './runtime-schema';

// Minimal helper to build a StandardSchemaV1 object inline for tests
function makeStandardSchema<T>(
  impl: (data: unknown) => StandardSchemaV1.Result<T>,
): StandardSchemaV1<unknown, T> {
  return {
    '~standard': {
      version: 1,
      vendor: 'test',
      validate: impl,
    },
  } as const;
}

describe('runtime-schema', () => {
  it('safeParse success returns success result', () => {
    const schema = makeStandardSchema<string>(() => ({ value: 'ok' }));
    const runtime = toRuntimeSchema(schema);
    const r = runtime.safeParse('ignored');
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.value).toBe('ok');
    }
  });

  it('safeParse failure maps issues with joined path', () => {
    const schema = makeStandardSchema<string>(() => ({
      issues: [{ path: ['user', 'name'], message: 'Required' }],
    }));
    const runtime = toRuntimeSchema(schema);
    const r = runtime.safeParse({});
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.issues[0]).toEqual({
        path: 'user.name',
        message: 'Required',
        code: undefined,
      });
    }
  });

  it('parse success returns value', () => {
    const schema = makeStandardSchema<number>(() => ({ value: 42 }));
    const runtime = toRuntimeSchema(schema);
    expect(runtime.parse(null)).toBe(42);
  });

  it('parse failure throws AggregateError with combined message lines', () => {
    const schema = makeStandardSchema<number>(() => ({
      issues: [{ path: ['a'], message: 'Bad' }, { message: 'Other' }],
    }));
    const runtime = toRuntimeSchema(schema);
    try {
      runtime.parse({});
      expect.fail('Expected parse to throw');
    } catch (error) {
      expect(String(error)).toContain('a: Bad');
      expect(String(error)).toContain('Other');
    }
  });

  it('isRuntimeSchema identifies valid runtime schema object', () => {
    const schema = makeStandardSchema<number>(() => ({ value: 1 }));
    const runtime = toRuntimeSchema(schema);
    expect(isRuntimeSchema(runtime)).toBe(true);
    expect(isRuntimeSchema({})).toBe(false);
    expect(isRuntimeSchema(null)).toBe(false);
  });

  it('runtime schema source property is present', () => {
    const schema = makeStandardSchema<number>(() => ({ value: 7 }));
    const runtime = toRuntimeSchema(schema);
    expect(runtime.source).toBe(schema);
  });
});
