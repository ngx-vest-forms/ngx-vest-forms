/**
 * Unit tests for value extraction utilities
 * Tests handling of DOM events, value normalization, and field setters
 */

import { describe, expect, it, vi } from 'vitest';
import {
  createFieldSetter,
  deepClone,
  extractValueFromEventOrValue,
  isEmpty,
  normalizeFieldValue,
} from './value-extraction';

/**
 * Mock event type for testing
 * Represents the minimal structure needed to test event handling
 */
type MockEvent = {
  preventDefault: () => void;
  stopPropagation: () => void;
  target?: {
    type?: string;
    value?: string;
    checked?: boolean;
    files?: File[];
    dataset?: Record<string, string>;
  } | null;
};

describe('Value Extraction Utilities', () => {
  describe('extractValueFromEventOrValue', () => {
    it('should return value directly when not an event', () => {
      expect(extractValueFromEventOrValue('string value')).toBe('string value');
      expect(extractValueFromEventOrValue(42)).toBe(42);
      expect(extractValueFromEventOrValue(true)).toBe(true);
      expect(extractValueFromEventOrValue(null)).toBeNull();
      expect(extractValueFromEventOrValue(void 0)).toBeUndefined();
    });

    it('should extract value from input events', () => {
      const mockInputEvent: MockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        target: { value: 'input value' },
      };

      expect(extractValueFromEventOrValue(mockInputEvent)).toBe('input value');
    });

    it('should extract value from select events', () => {
      const mockSelectEvent: MockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        target: { value: 'selected option' },
      };

      expect(extractValueFromEventOrValue(mockSelectEvent)).toBe(
        'selected option',
      );
    });

    it('should extract checked state from checkbox events', () => {
      const mockCheckboxEvent: MockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        target: {
          type: 'checkbox',
          checked: true,
        },
      };

      expect(extractValueFromEventOrValue(mockCheckboxEvent)).toBe(true);

      const uncheckedEvent: MockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        target: {
          type: 'checkbox',
          checked: false,
        },
      };

      expect(extractValueFromEventOrValue(uncheckedEvent)).toBe(false);
    });

    it('should extract value from checked radio events', () => {
      const mockRadioEvent: MockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        target: {
          type: 'radio',
          checked: true,
          value: 'radio-value',
        },
      };

      expect(extractValueFromEventOrValue(mockRadioEvent)).toBe('radio-value');
    });

    it('should handle events without target', () => {
      const mockEvent: MockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      };
      // Without a target property, isEvent() returns false, so the object is returned as-is
      expect(extractValueFromEventOrValue(mockEvent)).toBe(mockEvent);
    });

    it('should handle events with null target', () => {
      const mockEvent: MockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        target: null,
      };
      expect(extractValueFromEventOrValue(mockEvent)).toBeUndefined();
    });

    it('should distinguish between Event objects and plain objects', () => {
      const plainObject = { target: { value: 'not an event' } };
      expect(extractValueFromEventOrValue(plainObject)).toBe(plainObject);

      const eventLikeObject: MockEvent = {
        target: { value: 'event-like' },
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      };
      expect(extractValueFromEventOrValue(eventLikeObject)).toBe('event-like');
    });
  });

  describe('normalizeFieldValue', () => {
    it('should normalize empty strings', () => {
      expect(normalizeFieldValue('')).toBe('');
      expect(normalizeFieldValue('   ')).toBe('   '); // Preserves whitespace
    });

    it('should normalize numeric strings', () => {
      expect(normalizeFieldValue('123')).toBe('123');
      expect(normalizeFieldValue('0')).toBe('0');
      expect(normalizeFieldValue('-123')).toBe('-123');
      expect(normalizeFieldValue('123.45')).toBe('123.45');
    });

    it('should normalize boolean values', () => {
      expect(normalizeFieldValue(true)).toBe(true);
      expect(normalizeFieldValue(false)).toBe(false);
    });

    it('should normalize null and undefined', () => {
      expect(normalizeFieldValue(null)).toBeNull();
      expect(normalizeFieldValue(void 0)).toBeUndefined();
    });

    it('should normalize objects by preserving them', () => {
      const testObject = { name: 'test', value: 123 };
      expect(normalizeFieldValue(testObject)).toBe(testObject);
    });

    it('should normalize arrays by preserving them', () => {
      const testArray = ['a', 'b', 'c'];
      expect(normalizeFieldValue(testArray)).toBe(testArray);
    });

    it('should handle special string values', () => {
      expect(normalizeFieldValue('null')).toBe('null'); // String, not null
      expect(normalizeFieldValue('undefined')).toBe('undefined'); // String, not undefined
      expect(normalizeFieldValue('true')).toBe('true'); // String, not boolean
      expect(normalizeFieldValue('false')).toBe('false'); // String, not boolean
    });
  });

  describe('createFieldSetter', () => {
    it('should create a setter that calls callback with extracted value', () => {
      const mockCallback = vi.fn();
      const setter = createFieldSetter(mockCallback);

      setter('direct value');

      expect(mockCallback).toHaveBeenCalledWith('direct value');
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should handle events in the setter', () => {
      const mockCallback = vi.fn();
      const setter = createFieldSetter(mockCallback);

      const mockEvent: MockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        target: { value: 'event value' },
      };

      setter(mockEvent);

      expect(mockCallback).toHaveBeenCalledWith('event value');
    });

    it('should handle checkbox events in the setter', () => {
      const mockCallback = vi.fn();
      const setter = createFieldSetter(mockCallback);

      const checkboxEvent: MockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        target: {
          type: 'checkbox',
          checked: true,
        },
      };

      setter(checkboxEvent);

      expect(mockCallback).toHaveBeenCalledWith(true);
    });

    it('should normalize values before calling callback', () => {
      const mockCallback = vi.fn();
      const setter = createFieldSetter(mockCallback);

      // Test various value types
      setter('string');
      setter(123);
      setter(true);
      setter(null);

      expect(mockCallback).toHaveBeenNthCalledWith(1, 'string');
      expect(mockCallback).toHaveBeenNthCalledWith(2, 123);
      expect(mockCallback).toHaveBeenNthCalledWith(3, true);
      expect(mockCallback).toHaveBeenNthCalledWith(4, null);
    });

    it('should handle errors in callback gracefully', () => {
      const mockCallback = vi.fn(() => {
        throw new Error('Callback error');
      });
      const setter = createFieldSetter(mockCallback);

      expect(() => setter('value')).toThrow('Callback error');
      expect(mockCallback).toHaveBeenCalledWith('value');
    });
  });

  describe('isEmpty', () => {
    it('should detect empty values correctly', () => {
      expect(isEmpty('')).toBe(true);
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(void 0)).toBe(true);
    });

    it('should detect non-empty values correctly', () => {
      expect(isEmpty('string')).toBe(false);
      expect(isEmpty(' ')).toBe(false); // Whitespace is not empty
      expect(isEmpty(0)).toBe(false);
      expect(isEmpty(false)).toBe(false);
    });

    it('should handle arrays correctly', () => {
      expect(isEmpty([])).toBe(true);
      expect(isEmpty(['item'])).toBe(false);
      expect(isEmpty([null])).toBe(false); // Array with null is not empty
    });

    it('should handle objects correctly', () => {
      expect(isEmpty({})).toBe(true);
      expect(isEmpty({ key: 'value' })).toBe(false);
      expect(isEmpty({ key: null })).toBe(false); // Object with null property is not empty
    });

    it('should handle special cases', () => {
      expect(isEmpty(new Date())).toBe(false);
      expect(isEmpty(/regex/)).toBe(false);
      expect(isEmpty(() => 'not empty')).toBe(false);
    });
  });

  describe('deepClone', () => {
    it('should clone primitive values', () => {
      expect(deepClone('string')).toBe('string');
      expect(deepClone(123)).toBe(123);
      expect(deepClone(true)).toBe(true);
      expect(deepClone(null)).toBeNull();
      expect(deepClone(void 0)).toBeUndefined();
    });

    it('should clone arrays deeply', () => {
      const original: [number, number, [number, number, number[]]] = [
        1,
        2,
        [3, 4, [5, 6]],
      ];
      const cloned = deepClone(original) as [
        number,
        number,
        [number, number, number[]],
      ];

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned[2]).not.toBe(original[2]);
      expect(cloned[2][2]).not.toBe(original[2][2]);
    });

    it('should clone objects deeply', () => {
      const original = {
        name: 'test',
        nested: {
          value: 123,
          deeper: {
            flag: true,
          },
        },
        array: [1, 2, 3],
      };
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.nested).not.toBe(original.nested);
      expect(cloned.nested.deeper).not.toBe(original.nested.deeper);
      expect(cloned.array).not.toBe(original.array);
    });

    it('should handle complex nested structures', () => {
      type ComplexModel = {
        users: {
          name: string;
          profile: { age: number; skills: string[] };
        }[];
        metadata: {
          created: Date;
          settings: {
            theme: string;
            notifications: {
              email: boolean;
              push: boolean;
            };
          };
        };
      };

      const original: ComplexModel = {
        users: [
          { name: 'John', profile: { age: 30, skills: ['js', 'ts'] } },
          { name: 'Jane', profile: { age: 25, skills: ['python', 'go'] } },
        ],
        metadata: {
          created: new Date('2023-01-01'),
          settings: {
            theme: 'dark',
            notifications: {
              email: true,
              push: false,
            },
          },
        },
      };
      const cloned = deepClone(original) as ComplexModel;

      expect(cloned).toEqual(original);
      expect(cloned.users).not.toBe(original.users);
      expect(cloned.users[0]).not.toBe(original.users[0]);
      expect(cloned.users[0].profile).not.toBe(original.users[0].profile);
      expect(cloned.users[0].profile.skills).not.toBe(
        original.users[0].profile.skills,
      );
    });

    it('should handle Date objects', () => {
      const date = new Date('2023-01-01');
      const cloned = deepClone(date);

      expect(cloned).toEqual(date);
      expect(cloned).not.toBe(date);
      expect(cloned instanceof Date).toBe(true);
    });

    it('should handle RegExp objects', () => {
      const regex = /test/gi;
      const cloned = deepClone(regex);

      expect(cloned.source).toBe(regex.source);
      expect(cloned.flags).toBe(regex.flags);
      expect(cloned).not.toBe(regex);
      expect(cloned instanceof RegExp).toBe(true);
    });

    it('should handle circular references gracefully', () => {
      type Circular = {
        name: string;
        self?: Circular;
      };

      const circular: Circular = { name: 'test' };
      circular.self = circular;

      // Should not cause infinite loop
      expect(() => deepClone(circular)).not.toThrow();

      const cloned = deepClone(circular) as Circular;
      expect(cloned.name).toBe('test');
      expect(cloned.self).toBe(cloned); // Circular reference preserved
    });

    it('should handle null and undefined in nested structures', () => {
      const original = {
        nullValue: null,
        undefinedValue: undefined,
        nested: {
          alsoNull: null,
          alsoUndefined: undefined,
        },
      };
      const cloned = deepClone(original) as typeof original;

      expect(cloned.nullValue).toBeNull();
      expect(cloned.undefinedValue).toBeUndefined();
      expect(cloned.nested.alsoNull).toBeNull();
      expect(cloned.nested.alsoUndefined).toBeUndefined();
    });

    it('should preserve object prototypes', () => {
      class TestClass {
        name = 'test';
        getValue() {
          return this.name;
        }
      }

      const instance = new TestClass();
      const cloned = deepClone(instance) as TestClass;

      expect(cloned.name).toBe('test');
      expect(cloned.getValue()).toBe('test');
      expect(cloned instanceof TestClass).toBe(true);
      expect(cloned).not.toBe(instance);
    });
  });

  describe('Edge Cases and Integration', () => {
    it('should handle file input events', () => {
      const mockFiles = [new File(['content'], 'test.txt')];
      const mockFileEvent: MockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        target: {
          type: 'file',
          files: mockFiles,
        },
      };

      const extracted = extractValueFromEventOrValue(mockFileEvent);
      // The implementation returns target.files, which in the mock is an array
      // In a real browser, this would be a FileList
      expect(extracted).toBe(mockFiles);
      expect(Array.isArray(extracted)).toBe(true);
    });

    it('should handle range input events', () => {
      const mockRangeEvent: MockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        target: {
          type: 'range',
          value: '50',
        },
      };

      expect(extractValueFromEventOrValue(mockRangeEvent)).toBe('50');
    });

    it('should handle custom events with data', () => {
      const customEvent: MockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        target: {
          dataset: { value: 'custom-data' },
          value: 'regular-value',
        },
      };

      expect(extractValueFromEventOrValue(customEvent)).toBe('regular-value');
    });

    it('should work with field setter integration', () => {
      const values: unknown[] = [];
      const setter = createFieldSetter((value) => values.push(value));

      // Test various input scenarios
      setter('direct string');
      setter(42);
      setter(true);

      const inputEvent: MockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        target: { value: 'from input' },
      };
      setter(inputEvent);

      const checkboxEvent: MockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        target: { type: 'checkbox', checked: false },
      };
      setter(checkboxEvent);

      expect(values).toEqual(['direct string', 42, true, 'from input', false]);
    });
  });
});
