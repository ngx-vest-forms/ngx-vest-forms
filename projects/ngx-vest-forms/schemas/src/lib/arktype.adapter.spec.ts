/**
 * Unit tests for ArkType Standard Schema adapter
 */

import { describe, expect, it } from 'vitest';
import { isArkTypeSchema, type ArkTypeInfer } from './arktype.adapter';
import type { StandardSchemaV1 } from './standard-schema.types';

describe('ArkType Adapter', () => {
  describe('isArkTypeSchema', () => {
    it('returns true for valid ArkType schema with Standard Schema V1', () => {
      const mockArkTypeSchema: StandardSchemaV1<
        { email: string },
        { email: string }
      > & { infer: unknown } = {
        '~standard': {
          version: 1,
          vendor: 'arktype',
          validate: () => ({ value: { email: 'test@example.com' } }),
        },
        infer: {},
      };

      expect(isArkTypeSchema(mockArkTypeSchema)).toBe(true);
    });

    it('returns false for null', () => {
      expect(isArkTypeSchema(null)).toBe(false);
    });

    it('returns false for primitive values', () => {
      expect(isArkTypeSchema('string')).toBe(false);
      expect(isArkTypeSchema(42)).toBe(false);
      expect(isArkTypeSchema(true)).toBe(false);
    });

    it('returns false for objects without ~standard property', () => {
      expect(isArkTypeSchema({ infer: {} })).toBe(false);
    });

    it('returns false for objects with invalid ~standard version', () => {
      const invalidSchema = {
        '~standard': {
          version: 2, // Invalid version
          vendor: 'arktype',
          validate: () => ({}),
        },
        infer: {},
      };

      expect(isArkTypeSchema(invalidSchema)).toBe(false);
    });

    it('returns false for objects with wrong vendor', () => {
      const zodSchema = {
        '~standard': {
          version: 1,
          vendor: 'zod', // Wrong vendor
          validate: () => ({}),
        },
        infer: {},
      };

      expect(isArkTypeSchema(zodSchema)).toBe(false);
    });

    it('returns false for Standard Schema without infer property', () => {
      const schemaWithoutArkTypeInfer = {
        '~standard': {
          version: 1,
          vendor: 'arktype',
          validate: () => ({}),
        },
        // Missing infer
      };

      expect(isArkTypeSchema(schemaWithoutArkTypeInfer)).toBe(false);
    });

    it('returns false for objects with non-object ~standard', () => {
      const invalidSchema = {
        '~standard': 'invalid',
        infer: {},
      };

      expect(isArkTypeSchema(invalidSchema)).toBe(false);
    });

    it('works with real vendor string from Standard Schema V1', () => {
      const mockArkTypeSchema = {
        '~standard': {
          version: 1,
          vendor: 'arktype' as const,
          validate: () => ({ value: {} }),
        },
        infer: { email: 'string' },
      };

      expect(isArkTypeSchema(mockArkTypeSchema)).toBe(true);

      // Verify vendor detection
      if (isArkTypeSchema(mockArkTypeSchema)) {
        expect(mockArkTypeSchema['~standard'].vendor).toBe('arktype');
      }
    });
  });

  describe('ArkTypeInfer type helper', () => {
    it('should infer types from Standard Schema V1', () => {
      // Type-only test - verifies TypeScript compilation
      type MockSchema = StandardSchemaV1<{ email: string }, { email: string }>;
      type Inferred = ArkTypeInfer<MockSchema>;

      // Runtime assertion that the types match
      const value: Inferred = { email: 'test@example.com' };
      expect(value).toEqual({ email: 'test@example.com' });
    });

    it('should work with complex nested types', () => {
      // Type-only test
      type ComplexSchema = StandardSchemaV1<
        { user: { name: string; age: number } },
        { user: { name: string; age: number } }
      >;
      type Inferred = ArkTypeInfer<ComplexSchema>;

      // Runtime assertion
      const value: Inferred = { user: { name: 'John', age: 30 } };
      expect(value.user.name).toBe('John');
      expect(value.user.age).toBe(30);
    });
  });

  describe('Vendor detection pattern', () => {
    it('demonstrates simple vendor detection without type guard', () => {
      const mockSchema: StandardSchemaV1 = {
        '~standard': {
          version: 1,
          vendor: 'arktype',
          validate: () => ({ value: {} }),
        },
      };

      // Simple approach - no type guard needed
      const vendor = mockSchema['~standard'].vendor;
      expect(vendor).toBe('arktype');
    });

    it('demonstrates type guard for library-specific features', () => {
      const mockArkTypeSchema = {
        '~standard': {
          version: 1,
          vendor: 'arktype' as const,
          validate: () => ({ value: {} }),
        },
        infer: { email: 'string' },
      };

      // With type guard - enables TypeScript narrowing
      if (isArkTypeSchema(mockArkTypeSchema)) {
        // Can safely access ArkType-specific properties
        expect(mockArkTypeSchema.infer).toBeDefined();
        expect(mockArkTypeSchema['~standard'].vendor).toBe('arktype');
      }
    });
  });
});
