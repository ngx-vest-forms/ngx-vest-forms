/**
 * Unit tests for path utilities
 * Tests dot-notation path manipulation for nested object access
 */

import { describe, expect, it } from 'vitest';
import type { Path } from '../vest-form.types';
import {
  PathAccessError,
  deleteValueByPath,
  getAllPaths,
  getValueByPath,
  hasPath,
  isValidPath,
  normalizePath,
  setValueByPath,
} from './path-utils';

/**
 * Test data structure with various nested levels
 */
const testData = {
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
  profile: {
    bio: 'Software Developer',
    location: {
      city: 'New York',
      country: 'USA',
      coordinates: {
        lat: 40.7128,
        lng: -74.006,
      },
    },
    skills: ['JavaScript', 'TypeScript', 'React'],
    preferences: {
      theme: 'dark',
      notifications: true,
    },
  },
  contacts: [
    { type: 'email', value: 'work@example.com' },
    { type: 'phone', value: '+1234567890' },
  ],
  metadata: null,
  active: true,
};

describe('Path Utilities', () => {
  describe('getValueByPath', () => {
    it('should get top-level values', () => {
      expect(getValueByPath(testData, 'name')).toBe('John Doe');
      expect(getValueByPath(testData, 'email')).toBe('john@example.com');
      expect(getValueByPath(testData, 'age')).toBe(30);
      expect(getValueByPath(testData, 'active')).toBe(true);
    });

    it('should get nested object values', () => {
      expect(getValueByPath(testData, 'profile.bio')).toBe(
        'Software Developer',
      );
      expect(getValueByPath(testData, 'profile.location.city')).toBe(
        'New York',
      );
      expect(getValueByPath(testData, 'profile.location.country')).toBe('USA');
    });

    it('should get deeply nested values', () => {
      expect(getValueByPath(testData, 'profile.location.coordinates.lat')).toBe(
        40.7128,
      );
      expect(getValueByPath(testData, 'profile.location.coordinates.lng')).toBe(
        -74.006,
      );
    });

    it('should get array values', () => {
      expect(getValueByPath(testData, 'profile.skills')).toEqual([
        'JavaScript',
        'TypeScript',
        'React',
      ]);
      expect(getValueByPath(testData, 'profile.skills.0')).toBe('JavaScript');
      expect(getValueByPath(testData, 'profile.skills.1')).toBe('TypeScript');
      expect(getValueByPath(testData, 'profile.skills.2')).toBe('React');
    });

    it('should get array object values', () => {
      expect(getValueByPath(testData, 'contacts.0.type')).toBe('email');
      expect(getValueByPath(testData, 'contacts.0.value')).toBe(
        'work@example.com',
      );
      expect(getValueByPath(testData, 'contacts.1.type')).toBe('phone');
      expect(getValueByPath(testData, 'contacts.1.value')).toBe('+1234567890');
    });

    it('should handle null and undefined values', () => {
      expect(getValueByPath(testData, 'metadata')).toBeNull();
      expect(getValueByPath(testData, 'nonexistent')).toBeUndefined();
      expect(getValueByPath(testData, 'profile.nonexistent')).toBeUndefined();
    });

    it('should handle invalid paths gracefully', () => {
      expect(
        getValueByPath(testData, 'profile.location.nonexistent.deep'),
      ).toBeUndefined();
      expect(getValueByPath(testData, 'contacts.999.type')).toBeUndefined();
      expect(getValueByPath(testData, 'metadata.property')).toBeUndefined();
    });

    it('should handle empty and invalid path formats', () => {
      expect(getValueByPath(testData, '')).toBe(testData);
      expect(() => getValueByPath(testData, '.')).toThrow(PathAccessError);
      expect(() => getValueByPath(testData, '..')).toThrow(PathAccessError);
      expect(() => getValueByPath(testData, 'name.')).toThrow(PathAccessError);
    });

    it('should handle numeric string paths for arrays', () => {
      expect(getValueByPath(testData, 'profile.skills.0')).toBe('JavaScript');
      expect(getValueByPath(['a', 'b', 'c'], '1')).toBe('b');
    });
  });

  describe('setValueByPath', () => {
    it('should set top-level values immutably', () => {
      const result = setValueByPath(testData, 'name', 'Jane Doe');

      expect(result.name).toBe('Jane Doe');
      expect(result).not.toBe(testData); // Should be a new object
      expect(testData.name).toBe('John Doe'); // Original unchanged
    });

    it('should set nested object values', () => {
      const result = setValueByPath(
        testData,
        'profile.bio',
        'Senior Developer',
      );

      expect(result.profile.bio).toBe('Senior Developer');
      expect(result.profile.location).toBe(testData.profile.location); // Unrelated paths unchanged
      expect(testData.profile.bio).toBe('Software Developer'); // Original unchanged
    });

    it('should set deeply nested values', () => {
      const result = setValueByPath(
        testData,
        'profile.location.coordinates.lat',
        41.8781,
      );

      expect(result.profile.location.coordinates.lat).toBe(41.8781);
      expect(result.profile.location.coordinates.lng).toBe(-74.006); // Sibling unchanged
      expect(testData.profile.location.coordinates.lat).toBe(40.7128); // Original unchanged
    });

    it('should set array values', () => {
      const result = setValueByPath(testData, 'profile.skills.1', 'Python');

      expect(result.profile.skills[1]).toBe('Python');
      expect(result.profile.skills[0]).toBe('JavaScript'); // Other elements unchanged
      expect(testData.profile.skills[1]).toBe('TypeScript'); // Original unchanged
    });

    it('should set array object values', () => {
      const result = setValueByPath(
        testData,
        'contacts.0.value',
        'updated@example.com',
      );

      expect(result.contacts[0].value).toBe('updated@example.com');
      expect(result.contacts[0].type).toBe('email'); // Other properties unchanged
      expect(testData.contacts[0].value).toBe('work@example.com'); // Original unchanged
    });

    it('should create missing intermediate objects', () => {
      const result = setValueByPath({}, 'user.profile.settings.theme', 'dark');

      expect(result).toEqual({
        user: {
          profile: {
            settings: {
              theme: 'dark',
            },
          },
        },
      });
    });

    it('should create missing array indices', () => {
      const result = setValueByPath({ items: [] }, 'items.2', 'third');

      expect(result.items).toHaveLength(3);
      expect(result.items[2]).toBe('third');
      expect(result.items[0]).toBeUndefined();
      expect(result.items[1]).toBeUndefined();
    });

    it('should handle setting values in empty objects', () => {
      const result = setValueByPath({}, 'name', 'John');
      expect(result).toEqual({ name: 'John' });
    });

    it('should preserve other properties when setting', () => {
      const simple = { a: 1, b: 2 };
      const result = setValueByPath(simple, 'a', 10);

      expect(result).toEqual({ a: 10, b: 2 });
      expect(simple).toEqual({ a: 1, b: 2 }); // Original unchanged
    });

    it('should throw when traversing through non-object segments', () => {
      expect(() => setValueByPath({ foo: 'bar' }, 'foo.bar', 'baz')).toThrow(
        PathAccessError,
      );
    });
  });

  describe('deleteValueByPath', () => {
    it('should delete top-level properties', () => {
      const result = deleteValueByPath(testData, 'age');

      expect(result.age).toBeUndefined();
      expect(result.name).toBe('John Doe'); // Other properties preserved
      expect(testData.age).toBe(30); // Original unchanged
    });

    it('should delete nested properties', () => {
      const result = deleteValueByPath(testData, 'profile.bio');

      expect(result.profile.bio).toBeUndefined();
      expect(result.profile.location).toBeDefined(); // Sibling properties preserved
      expect(testData.profile.bio).toBe('Software Developer'); // Original unchanged
    });

    it('should delete array elements', () => {
      const result = deleteValueByPath(testData, 'profile.skills.1');

      expect(result.profile.skills).toEqual(['JavaScript', 'React']); // Element removed
      expect(testData.profile.skills).toEqual([
        'JavaScript',
        'TypeScript',
        'React',
      ]); // Original unchanged
    });

    it('should handle deletion of non-existent paths gracefully', () => {
      const result = deleteValueByPath(
        testData,
        'nonexistent' as unknown as Path<typeof testData>,
      );
      expect(result).toEqual(testData);

      const result2 = deleteValueByPath(
        testData,
        'profile.nonexistent' as unknown as Path<typeof testData>,
      );
      expect(result2.profile).toEqual(testData.profile);
    });

    it('should not mutate original object', () => {
      const original = { a: { b: { c: 1 } } };
      const result = deleteValueByPath(original, 'a.b.c');

      expect(original.a.b.c).toBe(1); // Original unchanged
      expect(result.a.b.c).toBeUndefined(); // Result modified
    });
  });

  describe('hasPath', () => {
    it('should detect existing top-level paths', () => {
      expect(hasPath(testData, 'name')).toBe(true);
      expect(hasPath(testData, 'email')).toBe(true);
      expect(hasPath(testData, 'active')).toBe(true);
    });

    it('should detect existing nested paths', () => {
      expect(hasPath(testData, 'profile.bio')).toBe(true);
      expect(hasPath(testData, 'profile.location.city')).toBe(true);
      expect(hasPath(testData, 'profile.location.coordinates.lat')).toBe(true);
    });

    it('should detect existing array paths', () => {
      expect(hasPath(testData, 'profile.skills.0')).toBe(true);
      expect(hasPath(testData, 'contacts.1.type')).toBe(true);
    });

    it('should return false for non-existent paths', () => {
      expect(
        hasPath(testData, 'nonexistent' as unknown as Path<typeof testData>),
      ).toBe(false);
      expect(
        hasPath(
          testData,
          'profile.nonexistent' as unknown as Path<typeof testData>,
        ),
      ).toBe(false);
      expect(hasPath(testData, 'profile.skills.999')).toBe(false);
    });

    it('should handle null values correctly', () => {
      expect(hasPath(testData, 'metadata')).toBe(true); // null is still a value
      expect(
        hasPath(
          testData,
          'metadata.property' as unknown as Path<typeof testData>,
        ),
      ).toBe(false); // can't access properties of null
    });
  });

  describe('getAllPaths', () => {
    it('should extract all paths from simple object', () => {
      const simple = { a: 1, b: 2, c: 3 };
      const paths = getAllPaths(simple);

      expect(paths).toContain('a');
      expect(paths).toContain('b');
      expect(paths).toContain('c');
      expect(paths).toHaveLength(3);
    });

    it('should extract nested paths', () => {
      const nested = {
        user: {
          name: 'John',
          profile: {
            bio: 'Developer',
          },
        },
      };
      const paths = getAllPaths(nested);

      expect(paths).toContain('user');
      expect(paths).toContain('user.name');
      expect(paths).toContain('user.profile');
      expect(paths).toContain('user.profile.bio');
    });

    it('should handle arrays in paths', () => {
      const withArrays = {
        items: ['a', 'b'],
        users: [{ name: 'John' }, { name: 'Jane' }],
      };
      const paths = getAllPaths(withArrays);

      expect(paths).toContain('items');
      expect(paths).toContain('items.0');
      expect(paths).toContain('items.1');
      expect(paths).toContain('users');
      expect(paths).toContain('users.0');
      expect(paths).toContain('users.0.name');
      expect(paths).toContain('users.1');
      expect(paths).toContain('users.1.name');
    });

    it('should handle empty objects and arrays', () => {
      const empty = { obj: {}, arr: [] };
      const paths = getAllPaths(empty);

      expect(paths).toContain('obj');
      expect(paths).toContain('arr');
      expect(paths).toHaveLength(2);
    });
  });

  describe('isValidPath', () => {
    it('should validate correct path formats', () => {
      expect(isValidPath('name')).toBe(true);
      expect(isValidPath('user.email')).toBe(true);
      expect(isValidPath('profile.location.city')).toBe(true);
      expect(isValidPath('items.0')).toBe(true);
      expect(isValidPath('users.0.name')).toBe(true);
    });

    it('should reject invalid path formats', () => {
      expect(isValidPath('')).toBe(false);
      expect(isValidPath('.')).toBe(false);
      expect(isValidPath('..')).toBe(false);
      expect(isValidPath('name.')).toBe(false);
      expect(isValidPath('.name')).toBe(false);
      expect(isValidPath('name..email')).toBe(false);
    });

    it('should handle special characters appropriately', () => {
      expect(isValidPath('user-name')).toBe(true);
      expect(isValidPath('user_email')).toBe(true);
      expect(isValidPath('user$id')).toBe(true);
      expect(isValidPath('user@domain')).toBe(false); // @ not allowed in property names generally
    });
  });

  describe('normalizePath', () => {
    it('should normalize valid paths', () => {
      expect(normalizePath('name')).toBe('name');
      expect(normalizePath('user.email')).toBe('user.email');
      expect(normalizePath('items.0.value')).toBe('items.0.value');
    });

    it('should handle array notation conversion', () => {
      expect(normalizePath('items[0]')).toBe('items.0');
      expect(normalizePath('users[1].name')).toBe('users.1.name');
      expect(normalizePath('data[0][1].value')).toBe('data.0.1.value');
    });

    it('should clean up malformed paths', () => {
      expect(normalizePath('name.')).toBe('name');
      expect(normalizePath('.name')).toBe('name');
      expect(normalizePath('user..email')).toBe('user.email');
      expect(normalizePath('user...profile')).toBe('user.profile');
    });

    it('should handle empty and invalid inputs', () => {
      expect(normalizePath('')).toBe('');
      expect(normalizePath('.')).toBeNull();
      expect(normalizePath('..')).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle circular references gracefully', () => {
      const circular: Record<string, unknown> = { name: 'test' };
      circular['self'] = circular;

      // These should not cause infinite loops
      expect(() => getValueByPath(circular, 'name')).not.toThrow();
      expect(() => setValueByPath(circular, 'name', 'updated')).not.toThrow();
      expect(() => hasPath(circular, 'name')).not.toThrow();
    });

    it('should handle non-object roots gracefully', () => {
      // The implementation gracefully handles non-object roots for Angular change detection
      // during reset/transition states instead of throwing errors
      expect(
        getValueByPath(
          'not-an-object' as unknown as Record<string, unknown>,
          'a',
        ),
      ).toBeUndefined();

      // setValueByPath returns the original value when root is not an object
      expect(
        setValueByPath(
          'not-an-object' as unknown as Record<string, unknown>,
          'a',
          1,
        ),
      ).toBe('not-an-object');

      // deleteValueByPath returns the original value when root is not an object
      expect(
        deleteValueByPath(
          'not-an-object' as unknown as Record<string, unknown>,
          'a' as unknown as Path<Record<string, unknown>>,
        ),
      ).toBe('not-an-object');
    });

    it('should handle very deep nesting', () => {
      const deep = {
        a: { b: { c: { d: { e: { f: { g: 'deep value' } } } } } },
      };

      expect(getValueByPath(deep, 'a.b.c.d.e.f.g')).toBe('deep value');
      expect(hasPath(deep, 'a.b.c.d.e.f.g')).toBe(true);
    });

    it('should handle large arrays', () => {
      const largeArray = Array.from({ length: 1000 }, (_, index) => ({
        id: index,
      }));
      const data = { items: largeArray };

      expect(getValueByPath(data, 'items.500.id')).toBe(500);
      expect(hasPath(data, 'items.999.id')).toBe(true);
      expect(hasPath(data, 'items.1000.id')).toBe(false);
    });

    it('should preserve object prototypes', () => {
      class TestClass {
        name = 'test';
        getValue() {
          return this.name;
        }
      }

      const instance = new TestClass();
      const result = setValueByPath(instance, 'name', 'updated');

      expect(result.name).toBe('updated');
      expect(result.getValue()).toBe('updated');
      expect(result instanceof TestClass).toBe(true);
    });
  });
});
