import { describe, expect, it } from 'vitest';
import { fromArkType, toAnyRuntimeSchema } from './runtime-adapters';
import { toRuntimeSchema } from './runtime-schema';

describe('toAnyRuntimeSchema', () => {
  it('should return existing NgxRuntimeSchema unchanged', () => {
    const existing = fromArkType<string>(() => 'ok');
    const wrapped = toAnyRuntimeSchema(existing);
    expect(wrapped).toBe(existing);
  });

  it('should wrap StandardSchemaV1 object', () => {
    const standard = {
      '~standard': {
        version: 1 as const,
        vendor: 'test',
        validate: (d: unknown) => ({ value: d }),
      },
    } as const;
    const runtime = toRuntimeSchema(standard);
    const wrapped = toAnyRuntimeSchema(standard);
    expect(wrapped.parse('x')).toEqual(runtime.parse('x'));
  });

  it('should detect safeParse schema (zod/valibot like)', () => {
    const fakeZod = { safeParse: (d: unknown) => ({ success: true, data: d }) };
    const wrapped = toAnyRuntimeSchema(fakeZod);
    expect(wrapped.safeParse(1).success).toBe(true);
  });

  it('should detect function schema (arktype like)', () => {
    const functionSchema = (d: unknown) =>
      typeof d === 'string' ? d : { summary: 'not string' };
    const wrapped = toAnyRuntimeSchema<string>(functionSchema);
    expect(wrapped.safeParse('hi').success).toBe(true);
    expect(wrapped.safeParse(1).success).toBe(false);
  });

  it('should fallback to identity schema', () => {
    const wrapped = toAnyRuntimeSchema<number>({});
    const r = wrapped.safeParse(42);
    expect(r.success).toBe(true);
    expect(r).toHaveProperty('meta.vendor', 'identity');
  });
});
