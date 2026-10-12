import type { StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, it } from 'vitest';
import type { NgxDeepRequired } from './deep-required';
import { toFormContract } from './to-form-contract';

type Model = {
  firstName: string;
  address: {
    street: string;
    zip: string;
  };
};

const shape: NgxDeepRequired<Model> = {
  firstName: '',
  address: {
    street: '',
    zip: '',
  },
};

describe('toFormContract', () => {
  it('should produce a StandardSchemaV1 with the correct ~standard shape', () => {
    const contract = toFormContract<Model>(shape);
    const standard = contract['~standard'];

    expect(standard.version).toBe(1);
    expect(standard.vendor).toBe('ngx-vest-forms');
    expect(typeof standard.validate).toBe('function');
  });

  it('should pass the input through unchanged as a successful value', () => {
    const contract = toFormContract<Model>(shape);
    const input = { firstName: 'Ada', address: { street: 'Main', zip: '1' } };

    const result = contract['~standard'].validate(input);

    expect(result).toEqual({ value: input });
    expect((result as { value: unknown }).value).toBe(input);
  });

  it('should never report issues (never blocks form validity)', () => {
    const contract = toFormContract<Model>(shape);

    const result = contract['~standard'].validate({
      firstName: 'X',
      address: { street: 's', zip: 'z' },
    }) as StandardSchemaV1.Result<unknown>;

    expect('issues' in result).toBe(false);
    expect((result as { value: unknown }).value).toBeDefined();
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['empty object', {}],
    ['empty string', ''],
    ['number', 42],
  ])('should pass %s through without throwing', (_label, input) => {
    const contract = toFormContract<Model>(shape);

    const result = contract['~standard'].validate(input);

    expect(result).toEqual({ value: input });
  });

  it('should pass arrays through without running shape validation', () => {
    const contract = toFormContract<Model>(shape);
    const input = [1, 2, 3];

    const result = contract['~standard'].validate(input);

    expect(result).toEqual({ value: input });
  });

  it('should handle deeply nested partial input', () => {
    const contract = toFormContract<Model>(shape);
    const input = { address: { street: 'only-street' } };

    const result = contract['~standard'].validate(input);

    expect(result).toEqual({ value: input });
  });

  it('should expose validate as a synchronous (non-promise) result', () => {
    const contract = toFormContract<Model>(shape);

    const result = contract['~standard'].validate({ firstName: 'A' });

    expect(result).not.toBeInstanceOf(Promise);
  });
});
