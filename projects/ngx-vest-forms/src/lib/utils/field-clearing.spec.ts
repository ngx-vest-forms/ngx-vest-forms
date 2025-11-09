import { clearFields, clearFieldsWhen, keepFieldsWhen } from './field-clearing';

describe('Field Clearing Utilities', () => {
  describe('clearFieldsWhen', () => {
    interface TestFormModel {
      procedureType: string;
      fieldA?: string;
      fieldB?: string;
      fieldC?: number;
      nestedData?: {
        subField: string;
      };
    }

    it('should clear fields when condition is true', () => {
      const initialState: TestFormModel = {
        procedureType: 'typeA',
        fieldA: 'valueA',
        fieldB: 'valueB',
        fieldC: 123,
      };

      const result = clearFieldsWhen(initialState, {
        fieldA: true,
        fieldB: false,
        fieldC: true,
      });

      expect(result).toEqual({
        procedureType: 'typeA',
        fieldA: undefined,
        fieldB: 'valueB',
        fieldC: undefined,
      });
    });

    it('should not mutate the original state object', () => {
      const initialState: TestFormModel = {
        procedureType: 'typeA',
        fieldA: 'valueA',
      };

      const result = clearFieldsWhen(initialState, {
        fieldA: true,
      });

      expect(initialState.fieldA).toBe('valueA');
      expect(result.fieldA).toBeUndefined();
      expect(result).not.toBe(initialState);
    });

    it('should handle empty conditions object', () => {
      const initialState: TestFormModel = {
        procedureType: 'typeA',
        fieldA: 'valueA',
      };

      const result = clearFieldsWhen(initialState, {});

      expect(result).toEqual(initialState);
      expect(result).not.toBe(initialState);
    });

    it('should handle nested objects', () => {
      const initialState: TestFormModel = {
        procedureType: 'typeA',
        fieldA: 'valueA',
        nestedData: {
          subField: 'nested value',
        },
      };

      const result = clearFieldsWhen(initialState, {
        nestedData: true,
      });

      expect(result).toEqual({
        procedureType: 'typeA',
        fieldA: 'valueA',
        nestedData: undefined,
      });
    });

    it('should work with dynamic conditions based on form state', () => {
      const formState: TestFormModel = {
        procedureType: 'typeC',
        fieldA: 'should be cleared',
        fieldB: 'should be cleared',
      };

      const result = clearFieldsWhen(formState, {
        fieldA: formState.procedureType !== 'typeA',
        fieldB: formState.procedureType !== 'typeB',
      });

      expect(result).toEqual({
        procedureType: 'typeC',
        fieldA: undefined,
        fieldB: undefined,
      });
    });

    it('should preserve fields when condition is false', () => {
      const initialState: TestFormModel = {
        procedureType: 'typeA',
        fieldA: 'keep this',
        fieldB: 'clear this',
      };

      const result = clearFieldsWhen(initialState, {
        fieldA: false,
        fieldB: true,
      });

      expect(result).toEqual({
        procedureType: 'typeA',
        fieldA: 'keep this',
        fieldB: undefined,
      });
    });

    it('should handle undefined and null values', () => {
      const initialState: TestFormModel = {
        procedureType: 'typeA',
        fieldA: undefined,
        fieldB: null as any,
        fieldC: 0,
      };

      const result = clearFieldsWhen(initialState, {
        fieldA: true,
        fieldB: true,
        fieldC: false,
      });

      expect(result).toEqual({
        procedureType: 'typeA',
        fieldA: undefined,
        fieldB: undefined,
        fieldC: 0,
      });
    });
  });

  describe('clearFields', () => {
    interface TestFormModel {
      procedureType: string;
      fieldA?: string;
      fieldB?: string;
      fieldC?: number;
      nestedData?: {
        subField: string;
        deepNested?: {
          value: number;
        };
      };
    }

    it('should clear specified fields unconditionally', () => {
      const initialState: TestFormModel = {
        procedureType: 'typeA',
        fieldA: 'valueA',
        fieldB: 'valueB',
        fieldC: 123,
      };

      const result = clearFields(initialState, ['fieldA', 'fieldC']);

      expect(result).toEqual({
        procedureType: 'typeA',
        fieldA: undefined,
        fieldB: 'valueB',
        fieldC: undefined,
      });
    });

    it('should not mutate the original state object', () => {
      const initialState: TestFormModel = {
        procedureType: 'typeA',
        fieldA: 'valueA',
      };

      const result = clearFields(initialState, ['fieldA']);

      expect(initialState.fieldA).toBe('valueA');
      expect(result.fieldA).toBeUndefined();
      expect(result).not.toBe(initialState);
    });

    it('should handle empty array', () => {
      const initialState: TestFormModel = {
        procedureType: 'typeA',
        fieldA: 'valueA',
      };

      const result = clearFields(initialState, []);

      expect(result).toEqual(initialState);
      expect(result).not.toBe(initialState);
    });

    it('should handle single field clearing', () => {
      const initialState: TestFormModel = {
        procedureType: 'typeA',
        fieldA: 'valueA',
        fieldB: 'valueB',
      };

      const result = clearFields(initialState, ['fieldA']);

      expect(result).toEqual({
        procedureType: 'typeA',
        fieldA: undefined,
        fieldB: 'valueB',
      });
    });

    it('should handle clearing all fields', () => {
      const initialState: TestFormModel = {
        procedureType: 'typeA',
        fieldA: 'valueA',
        fieldB: 'valueB',
      };

      const result = clearFields(initialState, [
        'procedureType',
        'fieldA',
        'fieldB',
      ]);

      expect(result).toEqual({
        procedureType: undefined,
        fieldA: undefined,
        fieldB: undefined,
      } as any);
    });

    it('should work with non-existent fields', () => {
      const initialState: TestFormModel = {
        procedureType: 'typeA',
        fieldA: 'valueA',
      };

      // TypeScript would catch this, but testing runtime behavior
      const result = clearFields(initialState, [
        'fieldA',
        'nonExistentField' as any,
      ]);

      expect(result).toEqual({
        procedureType: 'typeA',
        fieldA: undefined,
        nonExistentField: undefined,
      } as any);
    });

    it('should handle nested object fields', () => {
      const initialState: TestFormModel = {
        procedureType: 'typeA',
        fieldA: 'valueA',
        nestedData: {
          subField: 'nested value',
          deepNested: {
            value: 42,
          },
        },
      };

      const result = clearFields(initialState, ['nestedData']);

      expect(result).toEqual({
        procedureType: 'typeA',
        fieldA: 'valueA',
        nestedData: undefined,
      });
    });

    it('should clear multiple nested fields', () => {
      const initialState: TestFormModel = {
        procedureType: 'typeA',
        fieldA: 'valueA',
        fieldB: 'valueB',
        nestedData: {
          subField: 'nested',
          deepNested: {
            value: 100,
          },
        },
      };

      const result = clearFields(initialState, ['fieldA', 'nestedData']);

      expect(result).toEqual({
        procedureType: 'typeA',
        fieldA: undefined,
        fieldB: 'valueB',
        nestedData: undefined,
      });
    });

    it('should handle deeply nested structures', () => {
      interface DeepModel {
        level1?: {
          level2?: {
            level3?: {
              value: string;
            };
          };
        };
        other?: string;
      }

      const initialState: DeepModel = {
        level1: {
          level2: {
            level3: {
              value: 'deep',
            },
          },
        },
        other: 'preserved',
      };

      const result = clearFields(initialState, ['level1']);

      expect(result).toEqual({
        level1: undefined,
        other: 'preserved',
      });
    });

    it('should handle arrays in nested objects', () => {
      interface ModelWithArrays {
        items?: string[];
        nested?: {
          tags?: string[];
          count: number;
        };
      }

      const initialState: ModelWithArrays = {
        items: ['a', 'b', 'c'],
        nested: {
          tags: ['tag1', 'tag2'],
          count: 5,
        },
      };

      const result = clearFields(initialState, ['nested']);

      expect(result).toEqual({
        items: ['a', 'b', 'c'],
        nested: undefined,
      });
    });

    it('should preserve other nested properties when clearing sibling', () => {
      interface SiblingModel {
        data?: {
          keep: string;
          clear: string;
        };
      }

      const initialState: SiblingModel = {
        data: {
          keep: 'preserved',
          clear: 'removed',
        },
      };

      // Note: clearFields works at top level, can't clear nested properties
      // This test shows that clearing 'data' removes the entire object
      const result = clearFields(initialState, ['data']);

      expect(result).toEqual({
        data: undefined,
      });
    });
  });

  describe('keepFieldsWhen', () => {
    interface TestFormModel {
      procedureType: string;
      fieldA?: string;
      fieldB?: string;
      fieldC?: number;
      nestedData?: {
        subField: string;
      };
    }

    it('should keep only fields where condition is true', () => {
      const initialState: TestFormModel = {
        procedureType: 'typeA',
        fieldA: 'valueA',
        fieldB: 'valueB',
        fieldC: 123,
      };

      const result = keepFieldsWhen(initialState, {
        procedureType: true,
        fieldA: true,
        fieldB: false,
        fieldC: false,
      });

      expect(result).toEqual({
        procedureType: 'typeA',
        fieldA: 'valueA',
      });
    });

    it('should not mutate the original state object', () => {
      const initialState: TestFormModel = {
        procedureType: 'typeA',
        fieldA: 'valueA',
      };

      const result = keepFieldsWhen(initialState, {
        procedureType: true,
      });

      expect(initialState).toEqual({
        procedureType: 'typeA',
        fieldA: 'valueA',
      });
      expect(result).toEqual({
        procedureType: 'typeA',
      });
      expect(result).not.toBe(initialState);
    });

    it('should return empty object when no conditions are true', () => {
      const initialState: TestFormModel = {
        procedureType: 'typeA',
        fieldA: 'valueA',
      };

      const result = keepFieldsWhen(initialState, {
        procedureType: false,
        fieldA: false,
      });

      expect(result).toEqual({});
    });

    it('should handle empty conditions object', () => {
      const initialState: TestFormModel = {
        procedureType: 'typeA',
        fieldA: 'valueA',
      };

      const result = keepFieldsWhen(initialState, {});

      expect(result).toEqual({});
    });

    it('should work with dynamic conditions', () => {
      const formState: TestFormModel = {
        procedureType: 'typeA',
        fieldA: 'valueA',
        fieldB: 'valueB',
      };

      const result = keepFieldsWhen(formState, {
        procedureType: true, // always keep
        fieldA: formState.procedureType === 'typeA',
        fieldB: formState.procedureType === 'typeB',
      });

      expect(result).toEqual({
        procedureType: 'typeA',
        fieldA: 'valueA',
      });
    });

    it('should handle nested objects', () => {
      const initialState: TestFormModel = {
        procedureType: 'typeA',
        fieldA: 'valueA',
        nestedData: {
          subField: 'nested value',
        },
      };

      const result = keepFieldsWhen(initialState, {
        procedureType: true,
        nestedData: true,
      });

      expect(result).toEqual({
        procedureType: 'typeA',
        nestedData: {
          subField: 'nested value',
        },
      });
    });

    it('should ignore conditions for non-existent fields', () => {
      const initialState: TestFormModel = {
        procedureType: 'typeA',
        fieldA: 'valueA',
      };

      const result = keepFieldsWhen(initialState, {
        procedureType: true,
        fieldA: false,
        nonExistentField: true as any,
      } as any);

      expect(result).toEqual({
        procedureType: 'typeA',
      });
    });

    it('should preserve undefined and null values', () => {
      const initialState: TestFormModel = {
        procedureType: 'typeA',
        fieldA: undefined,
        fieldB: null as any,
        fieldC: 0,
      };

      const result = keepFieldsWhen(initialState, {
        procedureType: true,
        fieldA: true,
        fieldB: true,
        fieldC: false,
      });

      expect(result).toEqual({
        procedureType: 'typeA',
        fieldA: undefined,
        fieldB: null,
      } as any);
    });
  });

  describe('Integration scenarios', () => {
    interface ComplexFormModel {
      procedureType: 'typeA' | 'typeB' | 'typeC';
      fieldA?: string;
      fieldB?: string;
      generalInfo?: {
        firstName: string;
        lastName: string;
      };
      addresses?: {
        billing?: { street: string };
        shipping?: { street: string };
      };
    }

    it('should handle complex dynamic form scenario', () => {
      const formState: ComplexFormModel = {
        procedureType: 'typeC',
        fieldA: 'should be cleared',
        fieldB: 'should be cleared',
        generalInfo: {
          firstName: 'John',
          lastName: 'Doe',
        },
        addresses: {
          billing: { street: '123 Main St' },
          shipping: { street: '456 Oak Ave' },
        },
      };

      // Clear type-specific fields when switching to typeC
      const cleaned = clearFieldsWhen(formState, {
        fieldA: formState.procedureType !== 'typeA',
        fieldB: formState.procedureType !== 'typeB',
      });

      expect(cleaned).toEqual({
        procedureType: 'typeC',
        fieldA: undefined,
        fieldB: undefined,
        generalInfo: {
          firstName: 'John',
          lastName: 'Doe',
        },
        addresses: {
          billing: { street: '123 Main St' },
          shipping: { street: '456 Oak Ave' },
        },
      });
    });

    it('should work well with Angular signal update patterns', () => {
      const initialFormValue: ComplexFormModel = {
        procedureType: 'typeA',
        fieldA: 'valueA',
        fieldB: 'valueB',
        generalInfo: {
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      // Simulate Angular signal update pattern
      const updateFormValue = (
        current: ComplexFormModel,
        newProcedureType: 'typeA' | 'typeB' | 'typeC'
      ) => {
        return clearFieldsWhen(
          { ...current, procedureType: newProcedureType },
          {
            fieldA: newProcedureType !== 'typeA',
            fieldB: newProcedureType !== 'typeB',
          }
        );
      };

      const result = updateFormValue(initialFormValue, 'typeC');

      expect(result).toEqual({
        procedureType: 'typeC',
        fieldA: undefined,
        fieldB: undefined,
        generalInfo: {
          firstName: 'John',
          lastName: 'Doe',
        },
      });
    });
  });
});
