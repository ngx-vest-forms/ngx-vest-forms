import { describe, expect, it } from "vitest";
import { arrayToObject } from './array-to-object';

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
