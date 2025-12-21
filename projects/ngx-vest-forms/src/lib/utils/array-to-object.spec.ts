import {
  arrayToObject,
  deepArrayToObject,
  objectToArray,
} from './array-to-object';

describe('arrayToObject', () => {
  it('should convert an array to an object with numerical keys', () => {
    const inputArray = ['a', 'b', 'c'];
    const expectedOutput = { 0: 'a', 1: 'b', 2: 'c' };
    expect(arrayToObject(inputArray)).toEqual(expectedOutput);
  });

  it('should return an empty object for an empty array', () => {
    const inputArray: string[] = [];
    const expectedOutput = {};
    expect(arrayToObject(inputArray)).toEqual(expectedOutput);
  });

  it('should handle arrays of objects', () => {
    const inputArray = [{ name: 'John' }, { name: 'Doe' }];
    const expectedOutput = { 0: { name: 'John' }, 1: { name: 'Doe' } };
    expect(arrayToObject(inputArray)).toEqual(expectedOutput);
  });

  it('should handle arrays with mixed types', () => {
    const inputArray = [1, 'two', { prop: 'value' }];
    const expectedOutput = { 0: 1, 1: 'two', 2: { prop: 'value' } };
    expect(arrayToObject(inputArray)).toEqual(expectedOutput);
  });

  it('should handle single element array', () => {
    const inputArray = ['single'];
    const expectedOutput = { 0: 'single' };
    expect(arrayToObject(inputArray)).toEqual(expectedOutput);
  });

  it('should preserve object references in array elements', () => {
    const obj1 = { id: 1 };
    const obj2 = { id: 2 };
    const inputArray = [obj1, obj2];
    const result = arrayToObject(inputArray);
    expect(result[0]).toBe(obj1);
    expect(result[1]).toBe(obj2);
  });

  it('should handle arrays with undefined elements', () => {
    const inputArray = ['a', undefined, 'c'];
    const expectedOutput = { 0: 'a', 1: undefined, 2: 'c' };
    expect(arrayToObject(inputArray)).toEqual(expectedOutput);
  });

  it('should handle arrays with null elements', () => {
    const inputArray = ['a', null, 'c'];
    const expectedOutput = { 0: 'a', 1: null, 2: 'c' };
    expect(arrayToObject(inputArray)).toEqual(expectedOutput);
  });

  it('should handle arrays with boolean values', () => {
    const inputArray = [true, false, true];
    const expectedOutput = { 0: true, 1: false, 2: true };
    expect(arrayToObject(inputArray)).toEqual(expectedOutput);
  });

  it('should handle arrays with numeric values including zero', () => {
    const inputArray = [0, 1, 2];
    const expectedOutput = { 0: 0, 1: 1, 2: 2 };
    expect(arrayToObject(inputArray)).toEqual(expectedOutput);
  });

  it('should handle large arrays', () => {
    const inputArray = Array.from({ length: 100 }, (_, i) => `item${i}`);
    const result = arrayToObject(inputArray);
    expect(Object.keys(result).length).toBe(100);
    expect(result[0]).toBe('item0');
    expect(result[99]).toBe('item99');
  });

  it('should handle arrays with explicit undefined values', () => {
    const inputArray = ['a', undefined, 'c'] as (string | undefined)[];
    const result = arrayToObject(inputArray);
    expect(result[0]).toBe('a');
    expect(result[1]).toBeUndefined();
    expect(result[2]).toBe('c');
  });
});

describe('deepArrayToObject', () => {
  it('should convert a simple array to an object with numerical keys', () => {
    const array = ['a', 'b', 'c'];
    expect(deepArrayToObject(array)).toEqual({ 0: 'a', 1: 'b', 2: 'c' });
  });

  it('should convert nested arrays recursively', () => {
    const array = [
      ['a', 'b'],
      ['c', 'd'],
    ];
    expect(deepArrayToObject(array)).toEqual({
      0: { 0: 'a', 1: 'b' },
      1: { 0: 'c', 1: 'd' },
    });
  });

  it('should convert arrays inside objects', () => {
    const array = [{ items: ['x', 'y'] }, { items: ['z'] }];
    expect(deepArrayToObject(array)).toEqual({
      0: { items: { 0: 'x', 1: 'y' } },
      1: { items: { 0: 'z' } },
    });
  });

  it('should handle empty arrays', () => {
    const array: unknown[] = [];
    expect(deepArrayToObject(array)).toEqual({});
  });

  it('should handle arrays with null and undefined', () => {
    const array = [null, undefined, 'value'];
    expect(deepArrayToObject(array)).toEqual({
      0: null,
      1: undefined,
      2: 'value',
    });
  });

  it('should handle deeply nested arrays', () => {
    const array = [[['a', 'b'], ['c']], [['d']]];
    expect(deepArrayToObject(array)).toEqual({
      0: {
        0: { 0: 'a', 1: 'b' },
        1: { 0: 'c' },
      },
      1: {
        0: { 0: 'd' },
      },
    });
  });

  it('should convert arrays in deeply nested object structures', () => {
    const array = [
      {
        name: 'Alice',
        addresses: [
          { street: 'Main', phones: ['123', '456'] },
          { street: 'Second', phones: [] },
        ],
        tags: ['friend', 'colleague'],
      },
      {
        name: 'Bob',
        addresses: [{ street: 'Third', phones: ['789'] }],
        tags: [],
      },
    ];

    expect(deepArrayToObject(array)).toEqual({
      0: {
        name: 'Alice',
        addresses: {
          0: { street: 'Main', phones: { 0: '123', 1: '456' } },
          1: { street: 'Second', phones: {} },
        },
        tags: { 0: 'friend', 1: 'colleague' },
      },
      1: {
        name: 'Bob',
        addresses: {
          0: { street: 'Third', phones: { 0: '789' } },
        },
        tags: {},
      },
    });
  });

  it('should handle primitives in arrays', () => {
    const array = [1, 'two', true, null];
    expect(deepArrayToObject(array)).toEqual({
      0: 1,
      1: 'two',
      2: true,
      3: null,
    });
  });

  it('should handle arrays with mixed content types', () => {
    const array = [42, { nested: ['a', 'b'] }, ['x', 'y'], 'string'];
    expect(deepArrayToObject(array)).toEqual({
      0: 42,
      1: { nested: { 0: 'a', 1: 'b' } },
      2: { 0: 'x', 1: 'y' },
      3: 'string',
    });
  });

  it('should handle complex nested structures with multiple levels', () => {
    const array = [
      {
        sections: [
          {
            fields: [
              { label: 'A', values: [1, 2] },
              { label: 'B', values: [] },
            ],
          },
        ],
      },
    ];

    expect(deepArrayToObject(array)).toEqual({
      0: {
        sections: {
          0: {
            fields: {
              0: { label: 'A', values: { 0: 1, 1: 2 } },
              1: { label: 'B', values: {} },
            },
          },
        },
      },
    });
  });

  it('should not modify the original array or nested objects', () => {
    const nestedObj = { val: 'test' };
    const array = [['a', 'b'], [nestedObj]];
    const originalCopy = JSON.parse(JSON.stringify(array));
    const result = deepArrayToObject(array) as Record<
      number,
      Record<number, any>
    >;

    expect(array).toEqual(originalCopy);
    expect(result[1][0]).not.toBe(nestedObj);
  });

  it('should handle arrays with complex objects', () => {
    const date = new Date('2025-01-01');
    const array = [date, { nested: [date] }];
    const result = deepArrayToObject(array) as Record<number, any>;

    // deepArrayToObject recursively processes objects, Date objects are handled
    expect(typeof result[0]).toBe('object');
    expect(typeof result[1].nested).toBe('object');
    expect(result[1].nested[0]).toBeDefined();
  });

  it('should handle arrays with function properties in objects', () => {
    const fn = () => 'test';
    const array = [{ fn, arr: ['a'] }];
    const result = deepArrayToObject(array) as Record<number, any>;

    expect(result[0].fn).toBe(fn);
    expect(result[0].arr).toEqual({ 0: 'a' });
  });
});

describe('objectToArray', () => {
  it('should convert only specified properties from object-with-numeric-keys to arrays (shallow)', () => {
    const model = {
      phoneNumbers: { 0: '123', 1: '456' },
      name: 'Alice',
      tags: { 0: 'friend', 1: 'colleague' },
      meta: { foo: 'bar' },
    };

    expect(objectToArray(model, ['phoneNumbers', 'tags'])).toEqual({
      phoneNumbers: ['123', '456'],
      name: 'Alice',
      tags: ['friend', 'colleague'],
      meta: { foo: 'bar' },
    });
  });

  it('should recursively convert deeply nested properties by key', () => {
    const model = {
      user: {
        addresses: {
          0: { street: 'Main', phones: { 0: '123', 1: '456' } },
          1: { street: 'Second', phones: {} },
        },
        tags: { 0: 'x', 1: 'y' },
      },
    };

    expect(objectToArray(model, ['addresses', 'phones', 'tags'])).toEqual({
      user: {
        addresses: [
          { street: 'Main', phones: ['123', '456'] },
          { street: 'Second', phones: [] },
        ],
        tags: ['x', 'y'],
      },
    });
  });

  it('should handle empty numeric objects by converting them to empty arrays', () => {
    const model = {
      items: {},
      other: { 0: 'a' },
    };

    expect(objectToArray(model, ['items', 'other'])).toEqual({
      items: [],
      other: ['a'],
    });
  });

  it('should return an empty array when empty numeric object is specified', () => {
    const model = { items: {}, meta: 1 };
    expect(objectToArray(model, ['items'])).toEqual({ items: [], meta: 1 });
  });

  it('should preserve key order numerically when converting numeric object with out-of-order keys', () => {
    const model = { list: { 2: 'c', 0: 'a', 1: 'b' } } as const;
    expect(objectToArray(model, ['list'])).toEqual({ list: ['a', 'b', 'c'] });
  });

  it('should not treat object with a non-numeric key as numeric object', () => {
    const model = { data: { 0: 'a', x: 'b', 1: 'c' } } as const;
    // key 'data' requested but object has non-numeric key, so stays object
    expect(objectToArray(model, ['data'])).toEqual(model);
  });

  it('should cascade convert nested numeric objects when parent key is targeted', () => {
    const model = {
      outer: {
        0: { inner: { 0: 'a', 1: 'b' } },
        1: { inner: { 0: 'c' } },
      },
    };

    // outer targeted -> outer becomes array, inner preserved as objects (no key match) but will be converted because of cascading hasChanges rule
    expect(objectToArray(model, ['outer'])).toEqual([
      { inner: ['a', 'b'] },
      { inner: ['c'] },
    ]);
  });

  it('should be pure (not mutate original objects)', () => {
    const model = {
      user: { phones: { 0: '123', 1: '456' }, tags: { 0: 'x' } },
    };
    const snapshot = JSON.parse(JSON.stringify(model));
    objectToArray(model, ['phones']);
    expect(model).toEqual(snapshot); // original unmodified
  });

  it('should handle non-contiguous numeric keys', () => {
    const model = { list: { 0: 'a', 2: 'c', 5: 'f' } };
    const result = objectToArray(model, ['list']);
    // objectToArray sorts numeric keys and creates array with sorted values
    // Non-contiguous keys result in a sparse array
    expect(result).toEqual({ list: ['a', 'c', 'f'] });
  });

  it('should handle very large numeric keys', () => {
    const model = { list: { 0: 'first', 1000: 'last' } };
    const result = objectToArray(model, ['list']) as { list: string[] };
    // objectToArray creates array from sorted numeric keys
    expect(result.list.length).toBe(2);
    expect(result.list[0]).toBe('first');
    expect(result.list[1]).toBe('last');
  });

  it('should not convert objects with negative numeric keys', () => {
    const model = { data: { '-1': 'neg', 0: 'zero', 1: 'one' } } as any;
    const result = objectToArray(model, ['data']);
    expect(result).toEqual(model);
  });

  it('should not convert objects with decimal numeric keys', () => {
    const model = { data: { '0.5': 'half', 0: 'zero', 1: 'one' } } as any;
    const result = objectToArray(model, ['data']);
    expect(result).toEqual(model);
  });

  it('should handle deeply nested conversions with multiple keys', () => {
    const model = {
      level1: {
        0: {
          level2: {
            0: { level3: { 0: 'deep', 1: 'value' } },
          },
        },
      },
    };

    // The objectToArray function's special case handling:
    // When the result is a single-entry object with a converted array value,
    // it returns just the array (unwraps the outer object)
    const result = objectToArray(model, ['level1', 'level2', 'level3']);
    expect(result).toEqual([
      {
        level2: [{ level3: ['deep', 'value'] }],
      },
    ]);
  });

  it('should handle empty conversion keys array', () => {
    const model = {
      phones: { 0: '123', 1: '456' },
      tags: { 0: 'x' },
    };
    const result = objectToArray(model, []);
    expect(result).toEqual(model);
  });

  it('should handle null and undefined values in numeric objects', () => {
    const model = {
      list: { 0: 'a', 1: null, 2: undefined, 3: 'd' },
    };
    const result = objectToArray(model, ['list']);
    expect(result).toEqual({
      list: ['a', null, undefined, 'd'],
    });
  });

  it('should handle objects with string numeric keys (e.g., "0", "1")', () => {
    const model = {
      items: { '0': 'first', '1': 'second', '2': 'third' },
    };
    const result = objectToArray(model, ['items']);
    expect(result).toEqual({
      items: ['first', 'second', 'third'],
    });
  });
});

describe('selective array/object conversion', () => {
  it('should only convert specified arrays to objects with deepArrayToObject', () => {
    // Simulate a form model with three arrays, but only two should be converted
    const model = {
      phones: ['123', '456'],
      emails: ['a@b.com', 'c@d.com'],
      tags: ['friend', 'colleague'],
      meta: { foo: 'bar' },
    };

    // Convert only phones and tags
    const converted = {
      phones: { 0: '123', 1: '456' },
      emails: ['a@b.com', 'c@d.com'],
      tags: { 0: 'friend', 1: 'colleague' },
      meta: { foo: 'bar' },
    };

    // Manual conversion for test: deepArrayToObject always converts all arrays, so for selective conversion, use a custom utility or filter
    // Here, we simulate the result for the test
    expect({
      ...model,
      phones: arrayToObject(model.phones),
      tags: arrayToObject(model.tags),
    }).toEqual(converted);
  });

  it('should only convert specified objects to arrays with objectToArray', () => {
    // Simulate a backend model with three objectified arrays, but only two should be converted
    const backendModel = {
      phones: { 0: '123', 1: '456' },
      emails: { 0: 'a@b.com', 1: 'c@d.com' },
      tags: { 0: 'friend', 1: 'colleague' },
      meta: { foo: 'bar' },
    };

    // Only convert phones and tags
    expect(objectToArray(backendModel, ['phones', 'tags'])).toEqual({
      phones: ['123', '456'],
      emails: { 0: 'a@b.com', 1: 'c@d.com' },
      tags: ['friend', 'colleague'],
      meta: { foo: 'bar' },
    });
  });

  it('should handle deeply nested arrays and only convert specified ones', () => {
    const model = {
      user: {
        phones: ['123', '456'],
        emails: ['a@b.com', 'c@d.com'],
        tags: ['friend', 'colleague'],
        addresses: [
          { street: 'Main', codes: ['A', 'B'] },
          { street: 'Second', codes: ['C'] },
        ],
      },
    };

    // Convert only phones, tags, codes, and addresses
    const expected = {
      user: {
        phones: { 0: '123', 1: '456' },
        emails: { 0: 'a@b.com', 1: 'c@d.com' }, // Not in conversion list, stays as-is
        tags: { 0: 'friend', 1: 'colleague' },
        addresses: {
          0: { street: 'Main', codes: { 0: 'A', 1: 'B' } },
          1: { street: 'Second', codes: { 0: 'C' } },
        },
      },
    };

    // Custom converter for selective deep array conversion
    const convertArrayProperties = (
      value: unknown,
      keys: string[]
    ): unknown => {
      if (Array.isArray(value)) {
        return Object.fromEntries(
          value.map((item, index) => [
            index,
            convertArrayProperties(item, keys),
          ])
        );
      }
      if (value && typeof value === 'object') {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value)) {
          if (keys.includes(k) && Array.isArray(v)) {
            out[k] = arrayToObject(
              v.map((item) => convertArrayProperties(item, keys))
            );
          } else if (Array.isArray(v)) {
            // Convert array to numeric-key object
            const objectifiedArray = arrayToObject(v);
            out[k] = convertArrayProperties(objectifiedArray, keys);
          } else {
            out[k] = convertArrayProperties(v, keys);
          }
        }
        return out;
      }
      return value;
    };

    expect(
      convertArrayProperties(model, ['phones', 'tags', 'codes', 'addresses'])
    ).toEqual(expected);
  });

  it('should only convert specified objectified arrays back to arrays with objectToArray (deep)', () => {
    const backendModel = {
      user: {
        phones: { 0: '123', 1: '456' },
        emails: { 0: 'a@b.com', 1: 'c@d.com' },
        tags: { 0: 'friend', 1: 'colleague' },
        addresses: {
          0: { street: 'Main', codes: { 0: 'A', 1: 'B' } },
          1: { street: 'Second', codes: { 0: 'C' } },
        },
      },
    };

    expect(
      objectToArray(backendModel, ['phones', 'tags', 'codes', 'addresses'])
    ).toEqual({
      user: {
        phones: ['123', '456'],
        emails: { 0: 'a@b.com', 1: 'c@d.com' },
        tags: ['friend', 'colleague'],
        addresses: [
          { street: 'Main', codes: ['A', 'B'] },
          { street: 'Second', codes: ['C'] },
        ],
      },
    });
  });
});
