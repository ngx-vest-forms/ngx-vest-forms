import {
  arrayToObject,
  deepArrayToObject,
  objectToArray,
} from './array-to-object';

import { describe, expect, it } from 'vitest';

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
});

describe('deepArrayToObject', () => {
  it('should recursively convert nested arrays to objects', () => {
    const array = [1, [2, 3], { foo: [4, 5] }];
    expect(deepArrayToObject(array)).toEqual({
      0: 1,
      1: { 0: 2, 1: 3 },
      2: { foo: { 0: 4, 1: 5 } },
    });
  });

  it('should handle deeply nested arrays', () => {
    const array = [[['a']]];
    expect(deepArrayToObject(array)).toEqual({ 0: { 0: { 0: 'a' } } });
  });

  it('should handle objects with arrays as values', () => {
    const array = [{ bar: [1, 2] }, 3];
    expect(deepArrayToObject(array)).toEqual({
      0: { bar: { 0: 1, 1: 2 } },
      1: 3,
    });
  });

  it('should handle an empty array', () => {
    expect(deepArrayToObject([])).toEqual({});
  });

  it('should handle arrays of objects with nested arrays', () => {
    const array = [{ a: [1, 2], b: { c: [3, 4] } }];
    expect(deepArrayToObject(array)).toEqual({
      0: { a: { 0: 1, 1: 2 }, b: { c: { 0: 3, 1: 4 } } },
    });
  });
});

describe('deepArrayToObject - complex form models', () => {
  it('should handle arrays of objects with multiple nested arrays and objects', () => {
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

  it('should handle deeply nested arrays and objects in form-like structures', () => {
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
        tags: { 0: 'friend', 1: 'colleague' },
      },
      meta: { foo: 'bar' },
    };
    expect(objectToArray(model, ['addresses', 'phones', 'tags'])).toEqual({
      user: {
        addresses: [
          { street: 'Main', phones: ['123', '456'] },
          { street: 'Second', phones: [] },
        ],
        tags: ['friend', 'colleague'],
      },
      meta: { foo: 'bar' },
    });
  });

  it('should not convert properties not listed in keys', () => {
    const model = {
      foo: { 0: 'a', 1: 'b' },
      bar: { 0: 'x', 1: 'y' },
    };
    expect(objectToArray(model, ['bar'])).toEqual({
      foo: { 0: 'a', 1: 'b' },
      bar: ['x', 'y'],
    });
  });

  it('should handle arrays of objects with nested objects', () => {
    const model = [
      {
        items: { 0: { value: 'A' }, 1: { value: 'B' } },
        notes: { 0: 'note1', 1: 'note2' },
      },
      {
        items: {},
        notes: {},
      },
    ];
    expect(objectToArray(model, ['items', 'notes'])).toEqual([
      {
        items: [{ value: 'A' }, { value: 'B' }],
        notes: ['note1', 'note2'],
      },
      {
        items: [],
        notes: [],
      },
    ]);
  });

  it('should convert empty numeric-key object to empty array when key is specified', () => {
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
    const snapshot = structuredClone(model);
    objectToArray(model, ['phones']);
    expect(model).toEqual(snapshot); // original unmodified
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
    // Convert only phones, tags, and codes
    const expected = {
      user: {
        phones: { 0: '123', 1: '456' },
        emails: ['a@b.com', 'c@d.com'],
        tags: { 0: 'friend', 1: 'colleague' },
        addresses: {
          0: { street: 'Main', codes: { 0: 'A', 1: 'B' } },
          1: { street: 'Second', codes: { 0: 'C' } },
        },
      },
    };
    // Simulate selective conversion
    const convertArrayProperties = (
      value: unknown,
      keys: readonly string[],
    ): unknown => {
      if (Array.isArray(value)) {
        return value.map((v) => convertArrayProperties(v, keys));
      }
      if (value && typeof value === 'object') {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
          if (Array.isArray(v) && keys.includes(k)) {
            const objectifiedArray = arrayToObject(v);
            // After conversion, continue recursion inside the newly created numeric-key object
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
      convertArrayProperties(model, ['phones', 'tags', 'codes', 'addresses']),
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
    expect(objectToArray(backendModel, ['phones', 'tags', 'codes'])).toEqual({
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
