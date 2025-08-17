import { describe, expect, it } from 'vitest';
import {
  clearCustomAdapters,
  registerSchemaAdapter,
  toStandardSchemaViaRegistry,
} from './adapter-registry';
import { toRuntimeSchema } from './runtime-schema';
import { ngxModelToStandardSchema } from './schema-adapter';

describe('Schema Adapter Registry', () => {
  it('adapts safeParse-based schema via registry (zod/valibot-like)', () => {
    const fake = {
      safeParse: (d: unknown) => ({ success: true, data: { ok: d } }),
    };
    const standard = toStandardSchemaViaRegistry<{ ok: unknown }>(fake);
    expect(standard).not.toBeNull();
    const runtime = toRuntimeSchema(standard as NonNullable<typeof standard>);
    const result = runtime.safeParse(1);
    expect(result.success).toBe(true);
    if (result.success) expect(result.value.ok).toBe(1);
  });

  it('adapts function-based schema via registry (arktype-like)', () => {
    const function_ = (d: unknown) =>
      typeof d === 'string' ? d : { summary: 'not string' };
    const standard = toStandardSchemaViaRegistry<string>(function_);
    expect(standard).not.toBeNull();
    const runtime = toRuntimeSchema(standard as NonNullable<typeof standard>);
    expect(runtime.safeParse('hi').success).toBe(true);
    expect(runtime.safeParse(123).success).toBe(false);
  });

  it('applies custom adapter precedence (first match wins)', () => {
    const custom = {
      vendor: 'custom-vendor',
      isSupported: () => true,
      toStandardSchema: <T>() => ({
        ['~standard']: {
          version: 1 as const,
          vendor: 'custom-vendor',
          validate: (d: unknown) => ({ value: d as T }),
        },
      }),
    };
    registerSchemaAdapter(custom);

    const anySchema = {
      safeParse: (d: unknown) => ({ success: true, data: d }),
    };
    const standard = toStandardSchemaViaRegistry<unknown>(anySchema);
    expect(standard?.['~standard'].vendor).toBe('custom-vendor');

    clearCustomAdapters();
  });

  it('clearCustomAdapters resets to defaults', () => {
    const custom = {
      vendor: 'custom-vendor',
      isSupported: () => true,
      toStandardSchema: <T>() => ({
        ['~standard']: {
          version: 1 as const,
          vendor: 'custom-vendor',
          validate: (d: unknown) => ({ value: d as T }),
        },
      }),
    };
    registerSchemaAdapter(custom);
    clearCustomAdapters();

    const zodLike = { safeParse: (d: unknown) => ({ success: true, data: d }) };
    const standard = toStandardSchemaViaRegistry<unknown>(zodLike);
    expect(standard?.['~standard'].vendor).toBe('zod');
  });

  it('returns the same object for already Standard Schema input', () => {
    const original = ngxModelToStandardSchema({ a: 1 });
    const via = toStandardSchemaViaRegistry<typeof original>(original);
    expect(via).toBe(original);
  });
});
