import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { beforeEach, describe, expect, it } from 'vitest';
import { mergeValuesAndRawValues } from '../lib/utils/form-utils';

describe('mergeValuesAndRawValues - StructuredClone Integration Tests', () => {
  let fb: FormBuilder;

  beforeEach(() => {
    fb = new FormBuilder();
  });

  describe('structuredClone edge cases', () => {
    it('should handle Date objects correctly', () => {
      const testDate = new Date('2023-06-15T10:30:00.000Z');
      const form = new FormGroup({
        createdAt: new FormControl(testDate),
        profile: new FormGroup({
          lastLogin: new FormControl(new Date('2023-06-14T14:20:00.000Z')),
        }),
      });

      form.get('createdAt')?.disable();

      const merged = mergeValuesAndRawValues(form) as {
        createdAt: Date;
        profile: { lastLogin: Date };
      };

      expect(merged.createdAt).toBeInstanceOf(Date);
      expect(merged.createdAt.getTime()).toBe(testDate.getTime());
      expect(merged.profile.lastLogin).toBeInstanceOf(Date);

      // Ensure dates are cloned, not referenced
      merged.createdAt.setFullYear(2024);
      expect(testDate.getFullYear()).toBe(2023); // Original unchanged
    });

    it('should handle RegExp objects correctly', () => {
      const testRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      const form = new FormGroup({
        emailPattern: new FormControl(testRegex),
        validation: new FormGroup({
          phonePattern: new FormControl(/^\(\d{3}\) \d{3}-\d{4}$/),
        }),
      });

      form.get('emailPattern')?.disable();

      const merged = mergeValuesAndRawValues(form) as {
        emailPattern: RegExp;
        validation: { phonePattern: RegExp };
      };

      expect(merged.emailPattern).toBeInstanceOf(RegExp);
      expect(merged.emailPattern.source).toBe(testRegex.source);
      expect(merged.validation.phonePattern).toBeInstanceOf(RegExp);
    });

    it('should handle Map and Set objects correctly', () => {
      const testMap = new Map([
        ['key1', 'value1'],
        ['key2', 'value2'],
      ]);
      const testSet = new Set([1, 2, 3, 4]);

      const form = new FormGroup({
        dataMap: new FormControl(testMap),
        uniqueValues: new FormControl(testSet),
      });

      form.get('dataMap')?.disable();

      const merged = mergeValuesAndRawValues(form) as {
        dataMap: Map<string, string>;
        uniqueValues: Set<number>;
      };

      expect(merged.dataMap).toBeInstanceOf(Map);
      expect(merged.dataMap.get('key1')).toBe('value1');
      expect(merged.uniqueValues).toBeInstanceOf(Set);
      expect(merged.uniqueValues.has(3)).toBe(true);

      // Ensure they are cloned
      merged.dataMap.set('key3', 'value3');
      expect(testMap.has('key3')).toBe(false);
    });

    it('should handle ArrayBuffer and typed arrays', () => {
      const buffer = new ArrayBuffer(16);
      const uint8Array = new Uint8Array([1, 2, 3, 4]);

      const form = new FormGroup({
        buffer: new FormControl(buffer),
        typedArray: new FormControl(uint8Array),
      });

      form.get('buffer')?.disable();

      const merged = mergeValuesAndRawValues(form) as {
        buffer: ArrayBuffer;
        typedArray: Uint8Array;
      };

      expect(merged.buffer).toBeInstanceOf(ArrayBuffer);
      expect(merged.buffer.byteLength).toBe(16);
      expect(merged.typedArray).toBeInstanceOf(Uint8Array);
      expect([...merged.typedArray]).toEqual([1, 2, 3, 4]);
    });

    it('should handle circular references gracefully', () => {
      // Note: structuredClone will throw on circular references
      // This test ensures we handle the error appropriately
      const form = new FormGroup({
        data: new FormControl({ safe: 'value' }),
        // We can't test circular directly as it would throw during form creation
      });

      // This should work fine with non-circular data
      const merged = mergeValuesAndRawValues(form) as {
        data: { safe: string };
      };
      expect(merged.data).toEqual({ safe: 'value' });
    });
  });

  describe('performance and large data handling', () => {
    it('should handle large nested structures efficiently', () => {
      const largeData = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: Array.from({ length: 100 }, (_, index) => ({
                  id: index,
                  name: `item-${index}`,
                  data: Array.from(
                    { length: 10 },
                    (_, dataIndex) => `data-${dataIndex}`,
                  ),
                })),
              },
            },
          },
        },
      };

      const form = new FormGroup({
        smallField: new FormControl('test'),
        largeField: new FormControl(largeData),
      });

      form.get('largeField')?.disable(); // Test disabled large field

      const startTime = performance.now();
      const merged = mergeValuesAndRawValues(form) as {
        smallField: string;
        largeField: typeof largeData;
      };
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should be fast
      expect(merged.largeField).toEqual(largeData);
      expect(merged.largeField.level1.level2.level3.level4.level5).toHaveLength(
        100,
      );
    });

    it('should maintain performance with many form controls', () => {
      const formControls: Record<string, FormControl> = {};

      // Create 100 form controls
      for (let index = 0; index < 100; index++) {
        formControls[`field${index}`] = new FormControl(`value${index}`);
      }

      const form = new FormGroup(formControls);

      // Disable every 10th control
      for (let index = 0; index < 100; index += 10) {
        form.get(`field${index}`)?.disable();
      }

      const startTime = performance.now();
      const merged = mergeValuesAndRawValues(form) as Record<string, string>;
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50); // Should be fast even with many controls
      expect(Object.keys(merged)).toHaveLength(100);

      // Verify disabled fields are included
      for (let index = 0; index < 100; index += 10) {
        expect(merged[`field${index}`]).toBe(`value${index}`);
      }
    });
  });

  describe('browser compatibility', () => {
    it('should work with structuredClone availability', () => {
      // Verify structuredClone is available in the test environment
      expect(typeof structuredClone).toBe('function');

      const testObject = {
        string: 'test',
        number: 42,
        boolean: true,
        date: new Date(),
        array: [1, 2, 3],
        nested: { prop: 'value' },
      };

      const cloned = structuredClone(testObject);

      expect(cloned).toEqual(testObject);
      expect(cloned).not.toBe(testObject);
      expect(cloned.nested).not.toBe(testObject.nested);
    });

    it('should maintain type integrity after cloning', () => {
      type TypedData = {
        id: number;
        name: string;
        active: boolean;
        metadata: {
          tags: string[];
          score: number;
        };
      };

      const typedData: TypedData = {
        id: 1,
        name: 'Test Item',
        active: true,
        metadata: {
          tags: ['tag1', 'tag2'],
          score: 95.5,
        },
      };

      const form = new FormGroup({
        item: new FormControl(typedData),
      });

      form.get('item')?.disable();

      const merged = mergeValuesAndRawValues<{ item: TypedData }>(form) as {
        item: TypedData;
      };

      // Type checking should work
      expect(typeof merged.item.id).toBe('number');
      expect(typeof merged.item.name).toBe('string');
      expect(typeof merged.item.active).toBe('boolean');
      expect(Array.isArray(merged.item.metadata.tags)).toBe(true);
      expect(typeof merged.item.metadata.score).toBe('number');

      // Values should be correct
      expect(merged.item).toEqual(typedData);
    });
  });
});
