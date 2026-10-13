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
      const set2 = set1;
      const set3 = new Set([1, 2, 3]);

      expect(fastDeepEqual(set1, set2)).toBe(true);
      expect(fastDeepEqual(set1, set3)).toBe(false);
    });

    it('should handle Map objects correctly', () => {
      const map1 = new Map([
        ['a', 1],
        ['b', 2],
      ]);
      const map2 = map1;
      const map3 = new Map([
        ['a', 1],
        ['b', 2],
      ]);

      expect(fastDeepEqual(map1, map2)).toBe(true);
      expect(fastDeepEqual(map1, map3)).toBe(false);
    });

    it('should compare nested Maps and Sets by reference only', () => {
      const sharedSet = new Set([1, 2, 3]);
      const sharedMap = new Map([['key', sharedSet]]);
      const obj1 = {
        data: sharedMap,
        metadata: { count: 3 },
      };
      const obj2 = {
        data: sharedMap,
        metadata: { count: 3 },
      };
      const obj3 = {
        data: new Map([['key', new Set([1, 2, 3])]]),
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

    it('should treat NaN as equal to NaN (Object.is semantics)', () => {
      expect(fastDeepEqual(NaN, NaN)).toBe(true);
      expect(fastDeepEqual({ x: NaN }, { x: NaN })).toBe(true);
      expect(fastDeepEqual([NaN, 1], [NaN, 1])).toBe(true);
    });

    it('should distinguish +0 from -0 (Object.is semantics)', () => {
      expect(fastDeepEqual(0, -0)).toBe(false);
      expect(fastDeepEqual({ x: 0 }, { x: -0 })).toBe(false);
    });

    it('should compare distinct cyclic objects with the same structure', () => {
      const obj1: any = { a: 1 };
      const obj2: any = { a: 1 };
      obj1.circular = obj1;
      obj2.circular = obj2;

      expect(fastDeepEqual(obj1, obj2)).toBe(true);
    });

    it('should compare self-referential objects equal to themselves', () => {
      const obj: any = { a: 1 };
      obj.circular = obj;

      expect(fastDeepEqual(obj, obj)).toBe(true);
    });

    it('should compare distinct cyclic arrays with the same structure', () => {
      const a: any[] = [1];
      a.push(a);
      const b: any[] = [1];
      b.push(b);

      expect(fastDeepEqual(a, b)).toBe(true);
    });

    it('should compare self-referential arrays equal to themselves', () => {
      const a: any[] = [1];
      a.push(a);

      expect(fastDeepEqual(a, a)).toBe(true);
    });

    it('should detect when cyclic arrays differ in non-cycle elements', () => {
      const a: any[] = [1];
      a.push(a);
      const b: any[] = [2];
      b.push(b);

      expect(fastDeepEqual(a, b)).toBe(false);
    });

    it('should detect when cyclic arrays differ in cycle position', () => {
      // `a` has the cycle at index 1 (after a primitive).
      const a: any[] = [1];
      a.push(a);

      // `b` has the cycle at index 0 (before a primitive).
      const b: any[] = [];
      b.push(b, 1);

      expect(fastDeepEqual(a, b)).toBe(false);
    });

    it('should compare mixed cyclic structures (object containing self-referential array)', () => {
      const a: any = { name: 'root', items: [1, 2] as any[] };
      a.items.push(a.items);
      const b: any = { name: 'root', items: [1, 2] as any[] };
      b.items.push(b.items);

      expect(fastDeepEqual(a, b)).toBe(true);

      const c: any = { name: 'root', items: [1, 2] as any[] };
      c.items.push(c.items);
      const d: any = { name: 'root', items: [1, 3] as any[] };
      d.items.push(d.items);

      expect(fastDeepEqual(c, d)).toBe(false);
    });

    it('should compare functions by reference only', () => {
      const fn = () => 1;
      expect(fastDeepEqual(fn, fn)).toBe(true);

      // Distinct function instances with identical source compare unequal.
      expect(
        fastDeepEqual(
          () => 1,
          () => 1
        )
      ).toBe(false);

      function namedA() {
        return 42;
      }
      function namedB() {
        return 42;
      }
      expect(fastDeepEqual(namedA, namedB)).toBe(false);
      expect(fastDeepEqual(namedA, namedA)).toBe(true);
    });

    it('should compare deep trees beyond 10 levels structurally', () => {
      const createDeepTree = (depth: number, leafValue: string) => {
        const root: Record<string, unknown> = { level: 0 };
        let cursor = root;

        for (let level = 1; level <= depth; level++) {
          cursor.child = { level };
          cursor = cursor.child as Record<string, unknown>;
        }

        cursor.value = leafValue;
        return root;
      };

      expect(
        fastDeepEqual(createDeepTree(20, 'leaf'), createDeepTree(20, 'leaf'))
      ).toBe(true);
      expect(
        fastDeepEqual(
          createDeepTree(20, 'leaf'),
          createDeepTree(20, 'different')
        )
      ).toBe(false);
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
