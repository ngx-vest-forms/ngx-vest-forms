import type { StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, it } from 'vitest';
import { arktypeAdapter } from './arktype.adapter';

type StdShape<T> = {
  ['~standard']: {
    validate: (data: unknown) => StandardSchemaV1.Result<T>;
  };
};

describe('arktypeAdapter', () => {
  it('passes through valid value from function result', () => {
    const ark = (d: unknown) => ({ ...(d as object), ok: true });
    const std = arktypeAdapter.toStandardSchema<Record<string, unknown>>(ark);
    const validate = (std as unknown as StdShape<Record<string, unknown>>)[
      '~standard'
    ].validate;
    const r = validate({ foo: 'bar' });
    expect('value' in r).toBe(true);
    if ('value' in r)
      expect((r.value as Record<string, unknown>)['foo']).toBe('bar');
  });

  it('maps summary error lines to issues', () => {
    const ark = () => ({ summary: 'First issue\nSecond issue' });
    const std = arktypeAdapter.toStandardSchema<Record<string, unknown>>(ark);
    const validate = (std as unknown as StdShape<Record<string, unknown>>)[
      '~standard'
    ].validate;
    const r = validate({});
    expect('issues' in r).toBe(true);
    if ('issues' in r) {
      expect(r.issues?.map((issue) => issue.message)).toEqual([
        'First issue',
        'Second issue',
      ]);
    }
  });

  it('trims and filters blank summary lines', () => {
    const ark = () => ({ summary: '  First  \n   \n Second  ' });
    const std = arktypeAdapter.toStandardSchema<Record<string, unknown>>(ark);
    const validate = (std as unknown as StdShape<Record<string, unknown>>)[
      '~standard'
    ].validate;
    const r = validate({});
    if ('issues' in r) {
      const msgs = (r.issues ?? []).map((issue) => issue.message);
      expect(msgs).toEqual(['First', 'Second']);
    }
  });

  it('uses default message when summary is missing', () => {
    const ark = () => ({ summary: undefined as unknown as string });
    const std = arktypeAdapter.toStandardSchema<Record<string, unknown>>(ark);
    const validate = (std as unknown as StdShape<Record<string, unknown>>)[
      '~standard'
    ].validate;
    const r = validate({});
    if ('issues' in r) {
      const msgs = (r.issues ?? []).map((issue) => issue.message);
      expect(msgs).toEqual(['Invalid data']);
    }
  });
});
