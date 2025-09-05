import type { StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, it } from 'vitest';
import { ngxModelToStandardSchema } from '../schema-adapter';
import { customModelAdapter } from './custom-model.adapter';

type StdShape<T> = {
  ['~standard']: {
    vendor: string;
    validate: (data: unknown) => StandardSchemaV1.Result<T>;
  };
  _shape?: T;
};

describe('customModelAdapter', () => {
  it('passes through existing Standard Schema', () => {
    const std = ngxModelToStandardSchema({ a: 1 });
    const adapted = customModelAdapter.toStandardSchema<typeof std>(std);
    expect(
      (adapted as unknown as StdShape<typeof std>)['~standard'].vendor,
    ).toBe('ngx-model');
  });

  it('wraps plain object templates and exposes _shape', () => {
    const template = { a: 1, b: '' };
    const adapted =
      customModelAdapter.toStandardSchema<typeof template>(template);
    const shape = (adapted as unknown as StdShape<typeof template>)._shape;
    expect(shape).toEqual(template);
    const vendor = (adapted as unknown as StdShape<typeof template>)[
      '~standard'
    ].vendor;
    expect(vendor).toBe('ngx-model');
  });

  it('passes through for primitive schema input (degenerate passthrough)', () => {
    const primitive = 123 as unknown;
    const adapted = customModelAdapter.toStandardSchema<number>(primitive);
    const validate = (adapted as unknown as StdShape<number>)['~standard']
      .validate;
    const r = validate(42);
    expect('value' in r).toBe(true);
    if ('value' in r) expect(r.value).toBe(42);
  });

  it('returns value for valid object input', () => {
    const template = { a: 1 };
    const adapted =
      customModelAdapter.toStandardSchema<typeof template>(template);
    const validate = (adapted as unknown as StdShape<typeof template>)[
      '~standard'
    ].validate;
    const data = { a: 2 };
    const r = validate(data);
    expect('value' in r).toBe(true);
    if ('value' in r) expect(r.value).toEqual(data);
  });
});
