import { describe, expect, it } from 'vitest';
import { DeepPartial, NgxDeepPartial } from './deep-partial';

describe('NgxDeepPartial / DeepPartial', () => {
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
      items: string[];
    };

    const partial: NgxDeepPartial<MyType> = {
      items: ['one', 'two'],
    };

    expect(partial).toBeDefined();
    expect(partial.items).toEqual(['one', 'two']);
  });

  it('should correctly handle arrays of objects', () => {
    type MyType = {
      users: {
        name: string;
        email: string;
      }[];
    };

    const partial: NgxDeepPartial<MyType> = {
      users: [
        {
          name: 'Alice',
        },
      ],
    };

    expect(partial).toBeDefined();
    expect(partial.users?.[0]?.name).toBe('Alice');
    expect(partial.users?.[0]?.email).toBeUndefined();
  });

  it('should allow all properties to be optional', () => {
    type MyType = {
      required: string;
      nested: {
        alsoRequired: number;
      };
    };

    // All properties are optional with DeepPartial
    const empty: NgxDeepPartial<MyType> = {};
    const onlyNested: NgxDeepPartial<MyType> = {
      nested: {},
    };

    expect(empty).toBeDefined();
    expect(onlyNested).toBeDefined();
    expect(onlyNested.nested).toEqual({});
  });

  it('should handle deeply nested structures', () => {
    type MyType = {
      level1: {
        level2: {
          level3: {
            value: string;
          };
        };
      };
    };

    const partial: NgxDeepPartial<MyType> = {
      level1: {
        level2: {
          level3: {
            value: 'deep',
          },
        },
      },
    };

    expect(partial.level1?.level2?.level3?.value).toBe('deep');
  });

  it('should handle readonly arrays', () => {
    type MyType = {
      readonlyItems: readonly string[];
    };

    const partial: NgxDeepPartial<MyType> = {
      readonlyItems: ['one', 'two'],
    };

    expect(partial.readonlyItems).toEqual(['one', 'two']);
  });

  it('should preserve primitive types', () => {
    type MyType = {
      str: string;
      num: number;
      bool: boolean;
      date: Date;
    };

    const partial: NgxDeepPartial<MyType> = {
      str: 'test',
      num: 42,
      bool: true,
      date: new Date('2025-01-01'),
    };

    expect(partial.str).toBe('test');
    expect(partial.num).toBe(42);
    expect(partial.bool).toBe(true);
    expect(partial.date).toEqual(new Date('2025-01-01'));
  });

  it('should work with backward compatible alias', () => {
    type MyType = {
      name: string;
      age: number;
    };

    // DeepPartial is backward compatible alias
    const partial1: DeepPartial<MyType> = { name: 'Alice' };
    const partial2: NgxDeepPartial<MyType> = { name: 'Bob' };

    expect(partial1.name).toBe('Alice');
    expect(partial2.name).toBe('Bob');
    expect(partial1.age).toBeUndefined();
    expect(partial2.age).toBeUndefined();
  });

  it('should handle mixed nested structures with arrays and objects', () => {
    type MyType = {
      users: {
        profile: {
          name: string;
          contacts: {
            type: string;
            value: string;
          }[];
        };
      }[];
    };

    const partial: NgxDeepPartial<MyType> = {
      users: [
        {
          profile: {
            contacts: [
              {
                type: 'email',
              },
            ],
          },
        },
      ],
    };

    expect(partial.users?.[0]?.profile?.contacts?.[0]?.type).toBe('email');
    expect(partial.users?.[0]?.profile?.contacts?.[0]?.value).toBeUndefined();
    expect(partial.users?.[0]?.profile?.name).toBeUndefined();
  });

  it('should allow partial properties at any nesting level', () => {
    type FormModel = {
      generalInfo: {
        firstName: string;
        lastName: string;
      };
      addresses: {
        billing: {
          street: string;
          city: string;
        };
        shipping: {
          street: string;
          city: string;
        };
      };
    };

    // This is typical for template-driven forms that build incrementally
    const step1: NgxDeepPartial<FormModel> = {
      generalInfo: {
        firstName: 'John',
      },
    };

    const step2: NgxDeepPartial<FormModel> = {
      ...step1,
      generalInfo: {
        ...step1.generalInfo,
        lastName: 'Doe',
      },
    };

    const step3: NgxDeepPartial<FormModel> = {
      ...step2,
      addresses: {
        billing: {
          street: '123 Main St',
        },
      },
    };

    expect(step1.generalInfo?.firstName).toBe('John');
    expect(step2.generalInfo?.lastName).toBe('Doe');
    expect(step3.addresses?.billing?.street).toBe('123 Main St');
    expect(step3.addresses?.billing?.city).toBeUndefined();
  });
});
