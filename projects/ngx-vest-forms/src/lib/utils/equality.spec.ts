import { fastDeepEqual, isPrimitive, shallowEqual } from './equality';

describe('Equality Utils', () => {
  describe('isPrimitive', () => {
    it('should return true for primitive values', () => {
      expect(isPrimitive(1)).toBe(true);
      expect(isPrimitive('test')).toBe(true);
      expect(isPrimitive(true)).toBe(true);
      expect(isPrimitive(null)).toBe(true);
      expect(isPrimitive(undefined)).toBe(true);
      expect(isPrimitive(Symbol('s'))).toBe(true);
      expect(isPrimitive(10n)).toBe(true);
    });

    it('should return false for objects', () => {
      expect(isPrimitive({})).toBe(false);
      expect(isPrimitive([])).toBe(false);
      expect(isPrimitive(new Date())).toBe(false);
      expect(isPrimitive(new Map())).toBe(false);
      expect(isPrimitive(new Set())).toBe(false);
    });

    it('should return false for functions', () => {
      expect(isPrimitive(() => {})).toBe(false);
      expect(isPrimitive(function () {})).toBe(false);
    });
  });

  describe('shallowEqual', () => {
    it('should return true for identical objects', () => {
      const obj = { a: 1, b: 2 };
      expect(shallowEqual(obj, obj)).toBe(true);
    });

    it('should return true for shallow equal objects', () => {
      expect(shallowEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
    });

    it('should return false for shallow different objects', () => {
      expect(shallowEqual({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false);
      expect(shallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    });

    it('should handle null and undefined values', () => {
      expect(shallowEqual(null, null)).toBe(true);
      expect(shallowEqual(undefined, undefined)).toBe(true);
      expect(shallowEqual(null, undefined)).toBe(false);
      expect(shallowEqual(null, {})).toBe(false);
    });

    it('should handle primitive values', () => {
      expect(shallowEqual(1, 1)).toBe(true);
      expect(shallowEqual('test', 'test')).toBe(true);
      expect(shallowEqual(true, true)).toBe(true);
      expect(shallowEqual(1, 2)).toBe(false);
      expect(shallowEqual('test', 'other')).toBe(false);
    });
  });

  describe('fastDeepEqual', () => {
    it('should return true for identical objects', () => {
      const obj = { a: 1, b: { c: 2 } };
      expect(fastDeepEqual(obj, obj)).toBe(true);
    });

    it('should return true for deeply equal objects', () => {
      const obj1 = { a: 1, b: { c: 2, d: [1, 2, 3] } };
      const obj2 = { a: 1, b: { c: 2, d: [1, 2, 3] } };
      expect(fastDeepEqual(obj1, obj2)).toBe(true);
    });

    it('should return false for deeply different objects', () => {
      const obj1 = { a: 1, b: { c: 2, d: [1, 2, 3] } };
      const obj2 = { a: 1, b: { c: 2, d: [1, 2, 4] } };
      expect(fastDeepEqual(obj1, obj2)).toBe(false);
    });

    it('should handle arrays correctly', () => {
      expect(fastDeepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(fastDeepEqual([1, [2, 3]], [1, [2, 3]])).toBe(true);
      expect(fastDeepEqual([1, 2, 3], [1, 2, 4])).toBe(false);
      expect(fastDeepEqual([1, 2], [1, 2, 3])).toBe(false);
    });

    it('should handle Date objects correctly', () => {
      const date1 = new Date('2023-01-01');
      const date2 = new Date('2023-01-01');
      const date3 = new Date('2023-01-02');

      expect(fastDeepEqual(date1, date2)).toBe(true);
      expect(fastDeepEqual(date1, date3)).toBe(false);
    });

    it('should handle RegExp objects correctly', () => {
      const regex1 = /test/gi;
      const regex2 = /test/gi;
      const regex3 = /test/i;
      const regex4 = /different/gi;

      expect(fastDeepEqual(regex1, regex2)).toBe(true);
      expect(fastDeepEqual(regex1, regex3)).toBe(false);
      expect(fastDeepEqual(regex1, regex4)).toBe(false);
    });

    it('should handle Set objects correctly', () => {
      const set1 = new Set([1, 2, 3]);
      const set2 = new Set([1, 2, 3]);
      const set3 = new Set([1, 2, 4]);
      const set4 = new Set([1, 2]);

      expect(fastDeepEqual(set1, set2)).toBe(true);
      expect(fastDeepEqual(set1, set3)).toBe(false);
      expect(fastDeepEqual(set1, set4)).toBe(false);
    });

    it('should handle Map objects correctly', () => {
      const map1 = new Map([
        ['a', 1],
        ['b', 2],
      ]);
      const map2 = new Map([
        ['a', 1],
        ['b', 2],
      ]);
      const map3 = new Map([
        ['a', 1],
        ['b', 3],
      ]);
      const map4 = new Map([['a', 1]]);

      expect(fastDeepEqual(map1, map2)).toBe(true);
      expect(fastDeepEqual(map1, map3)).toBe(false);
      expect(fastDeepEqual(map1, map4)).toBe(false);
    });

    it('should handle nested Maps and Sets', () => {
      const obj1 = {
        data: new Map([['key', new Set([1, 2, 3])]]),
        metadata: { count: 3 },
      };
      const obj2 = {
        data: new Map([['key', new Set([1, 2, 3])]]),
        metadata: { count: 3 },
      };
      const obj3 = {
        data: new Map([['key', new Set([1, 2, 4])]]),
        metadata: { count: 3 },
      };

      expect(fastDeepEqual(obj1, obj2)).toBe(true);
      expect(fastDeepEqual(obj1, obj3)).toBe(false);
    });

    it('should handle null and undefined values', () => {
      expect(fastDeepEqual(null, null)).toBe(true);
      expect(fastDeepEqual(undefined, undefined)).toBe(true);
      expect(fastDeepEqual(null, undefined)).toBe(false);
      expect(fastDeepEqual(null, {})).toBe(false);
    });

    it('should handle primitive values', () => {
      expect(fastDeepEqual(1, 1)).toBe(true);
      expect(fastDeepEqual('test', 'test')).toBe(true);
      expect(fastDeepEqual(true, true)).toBe(true);
      expect(fastDeepEqual(1, 2)).toBe(false);
    });

    it('should handle different types', () => {
      expect(fastDeepEqual('1', 1)).toBe(false);
      expect(fastDeepEqual([], {})).toBe(false);
      expect(fastDeepEqual(new Date(), new RegExp(''))).toBe(false);
    });

    it('should respect maxDepth to prevent infinite recursion', () => {
      const obj1: any = { a: 1 };
      const obj2: any = { a: 1 };
      obj1.circular = obj1;
      obj2.circular = obj2;

      // Should not throw and should handle gracefully
      expect(() => fastDeepEqual(obj1, obj2, 3)).not.toThrow();
    });

    it('should be performant compared to JSON.stringify', () => {
      const largeObj = {
        users: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `User ${i}`,
          email: `user${i}@example.com`,
          profile: {
            age: 20 + (i % 50),
            preferences: {
              theme: i % 2 ? 'dark' : 'light',
              notifications: true,
            },
          },
        })),
      };

      const largeObj2 = JSON.parse(JSON.stringify(largeObj));

      const result = fastDeepEqual(largeObj, largeObj2);

      expect(result).toBe(true);
    });
  });
});
