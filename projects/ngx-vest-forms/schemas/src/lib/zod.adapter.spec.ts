/**
 * Unit tests for Zod Standard Schema adapter
 */

import { describe, expect, it } from 'vitest';
import type { StandardSchemaV1 } from './standard-schema.types';
import { isZodSchema, type ZodInfer } from './zod.adapter';

describe('Zod Adapter', () => {
  describe('isZodSchema', () => {
    it('returns true for valid Zod schema with Standard Schema V1', () => {
      const mockZodSchema: StandardSchemaV1<
        { email: string },
        { email: string }
      > & { _def: unknown } = {
        '~standard': {
          version: 1,
          vendor: 'zod',
          validate: () => ({ value: { email: 'test@example.com' } }),
        },
        _def: {},
      };

      expect(isZodSchema(mockZodSchema)).toBe(true);
    });

    it('returns false for null', () => {
      expect(isZodSchema(null)).toBe(false);
    });

    it('returns false for primitive values', () => {
      expect(isZodSchema('string')).toBe(false);
      expect(isZodSchema(42)).toBe(false);
      expect(isZodSchema(true)).toBe(false);
    });

    it('returns false for objects without ~standard property', () => {
      expect(isZodSchema({ _def: {} })).toBe(false);
    });

    it('returns false for objects with invalid ~standard version', () => {
      const invalidSchema = {
        '~standard': {
          version: 2, // Invalid version
          vendor: 'zod',
          validate: () => ({}),
        },
        _def: {},
      };

      expect(isZodSchema(invalidSchema)).toBe(false);
    });

    it('returns false for objects with wrong vendor', () => {
      const valibotSchema = {
        '~standard': {
          version: 1,
          vendor: 'valibot', // Wrong vendor
          validate: () => ({}),
        },
        _def: {},
      };

      expect(isZodSchema(valibotSchema)).toBe(false);
    });

    it('returns false for Standard Schema without _def property', () => {
      const schemaWithoutZodDefinition = {
        '~standard': {
          version: 1,
          vendor: 'zod',
          validate: () => ({}),
        },
        // Missing _def
      };

      expect(isZodSchema(schemaWithoutZodDefinition)).toBe(false);
    });

    it('returns false for objects with non-object ~standard', () => {
      const invalidSchema = {
        '~standard': 'invalid',
        _def: {},
      };

      expect(isZodSchema(invalidSchema)).toBe(false);
    });

    it('works with real vendor string from Standard Schema V1', () => {
      const mockZodSchema = {
        '~standard': {
          version: 1,
          vendor: 'zod' as const,
          validate: () => ({ value: {} }),
        },
        _def: { typeName: 'ZodObject' },
      };

      expect(isZodSchema(mockZodSchema)).toBe(true);

      // Verify vendor detection
      if (isZodSchema(mockZodSchema)) {
        expect(mockZodSchema['~standard'].vendor).toBe('zod');
      }
    });
  });

  describe('ZodInfer type helper', () => {
    it('should infer types from Standard Schema V1', () => {
      // Type-only test - verifies TypeScript compilation
      type MockSchema = StandardSchemaV1<{ email: string }, { email: string }>;
      type Inferred = ZodInfer<MockSchema>;

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
      type Inferred = ZodInfer<ComplexSchema>;

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
          vendor: 'zod',
          validate: () => ({ value: {} }),
        },
      };

      // Simple approach - no type guard needed
      const vendor = mockSchema['~standard'].vendor;
      expect(vendor).toBe('zod');
    });

    it('demonstrates type guard for library-specific features', () => {
      const mockZodSchema = {
        '~standard': {
          version: 1,
          vendor: 'zod' as const,
          validate: () => ({ value: {} }),
        },
        _def: { typeName: 'ZodObject' },
      };

      // With type guard - enables TypeScript narrowing
      if (isZodSchema(mockZodSchema)) {
        // Can safely access Zod-specific properties
        expect(mockZodSchema._def).toBeDefined();
        expect(mockZodSchema['~standard'].vendor).toBe('zod');
      }
    });
  });
});
