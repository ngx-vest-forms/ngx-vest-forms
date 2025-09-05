import { describe, expect, it } from 'vitest';
import {
  getValueAtPath,
  parseFieldPath,
  setValueAtPath,
  stringifyFieldPath,
} from './field-path.utils';

describe('field-path.utils', () => {
  it('parses dot/bracket notation to array', () => {
    expect(parseFieldPath('addresses[0].street')).toEqual([
      'addresses',
      0,
      'street',
    ]);
    expect(parseFieldPath('foo.bar[2].baz')).toEqual(['foo', 'bar', 2, 'baz']);
    expect(parseFieldPath('a')).toEqual(['a']);
    expect(parseFieldPath('a[1]')).toEqual(['a', 1]);
    expect(parseFieldPath('')).toEqual([]);
  });

  it('stringifies array to dot/bracket notation', () => {
    expect(stringifyFieldPath(['addresses', 0, 'street'])).toBe(
      'addresses[0].street',
    );
    expect(stringifyFieldPath(['foo', 'bar', 2, 'baz'])).toBe('foo.bar[2].baz');
    expect(stringifyFieldPath(['a'])).toBe('a');
    expect(stringifyFieldPath(['a', 1])).toBe('a[1]');
    expect(stringifyFieldPath([])).toBe('');
  });

  it('gets value at path', () => {
    const object = { a: [{ b: 42 }], foo: { bar: [null, { baz: 'x' }] } };
    expect(getValueAtPath(object, 'a[0].b')).toBe(42);
    expect(getValueAtPath(object, 'foo.bar[1].baz')).toBe('x');
    expect(getValueAtPath(object, 'foo.bar[0]')).toBe(null);
    expect(getValueAtPath(object, 'missing')).toBeUndefined();
    expect(getValueAtPath(object, 'a[1].b')).toBeUndefined();
  });

  it('sets value at path', () => {
    const object: Record<string, unknown> = {};
    setValueAtPath(object, 'a[0].b', 123);
    expect(object).toEqual({ a: [{ b: 123 }] });
    setValueAtPath(object, 'foo.bar[1].baz', 'y');
    expect(object['foo']).toBeDefined();
    const foo = object['foo'] as { bar: ({ baz?: string } | null)[] };
    expect(foo.bar[1]?.baz).toBe('y');
    setValueAtPath(object, 'foo.bar[0]', null);
    expect(foo.bar[0]).toBeNull();
  });

  it('handles empty/invalid paths gracefully', () => {
    const object: Record<string, unknown> = { a: 1 };
    setValueAtPath(object, '', 2);
    expect(object).toEqual({ a: 1 });
    expect(getValueAtPath(object, '')).toBe(object);
  });
});
