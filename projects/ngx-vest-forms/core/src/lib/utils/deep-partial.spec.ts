import { describe, expect, it } from 'vitest';
import { NgxDeepPartial } from './deep-partial';

describe('NgxDeepPartial', () => {
  it('should correctly handle nested objects', () => {
    type MyType = {
      a: string;
      b: {
        c: number;
        d: boolean;
      };
    };

    const partial: NgxDeepPartial<MyType> = {
      b: {
        c: 123,
      },
    };

    expect(partial).toBeDefined();
    expect(partial.b).toBeDefined();
    expect(partial.b?.c).toBe(123);
  });

  it('should correctly handle arrays', () => {
    type MyType = {
      a: {
        b: string;
      }[];
    };

    const partial: NgxDeepPartial<MyType> = {
      a: [
        {
          b: 'test',
        },
        {},
      ],
    };

    expect(partial).toBeDefined();
    expect(partial.a).toBeDefined();
    expect(partial.a?.length).toBe(2);
    expect(partial.a?.[0]?.b).toBe('test');
  });

  it('should allow all properties to be optional', () => {
    type MyType = {
      a: string;
      b: number;
      c: boolean;
    };

    const partial: NgxDeepPartial<MyType> = {};

    expect(partial).toBeDefined();
  });
});
