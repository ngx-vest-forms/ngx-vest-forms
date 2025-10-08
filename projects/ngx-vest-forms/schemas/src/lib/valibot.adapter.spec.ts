/**
 * Unit tests for Valibot Standard Schema adapter
 */

import { describe, expect, it } from 'vitest';
import type { StandardSchemaV1 } from './standard-schema.types';
import { isValibotSchema, type ValibotInfer } from './valibot.adapter';

describe('Valibot Adapter', () => {
  describe('isValibotSchema', () => {
    it('returns true for valid Valibot schema with Standard Schema V1', () => {
      const mockValibotSchema: StandardSchemaV1<
        { email: string },
        { email: string }
      > & { _run: unknown } = {
        '~standard': {
          version: 1,
          vendor: 'valibot',
          validate: () => ({ value: { email: 'test@example.com' } }),
        },
        _run: {},
      };

      expect(isValibotSchema(mockValibotSchema)).toBe(true);
    });

    it('returns false for null', () => {
      expect(isValibotSchema(null)).toBe(false);
    });

    it('returns false for primitive values', () => {
      expect(isValibotSchema('string')).toBe(false);
      expect(isValibotSchema(42)).toBe(false);
      expect(isValibotSchema(true)).toBe(false);
    });

    it('returns false for objects without ~standard property', () => {
      expect(isValibotSchema({ _run: {} })).toBe(false);
    });

    it('returns false for objects with invalid ~standard version', () => {
      const invalidSchema = {
        '~standard': {
          version: 2, // Invalid version
          vendor: 'valibot',
          validate: () => ({}),
        },
        _run: {},
      };

      expect(isValibotSchema(invalidSchema)).toBe(false);
    });

    it('returns false for objects with wrong vendor', () => {
      const zodSchema = {
        '~standard': {
          version: 1,
          vendor: 'zod', // Wrong vendor
          validate: () => ({}),
        },
        _run: {},
      };

      expect(isValibotSchema(zodSchema)).toBe(false);
    });

    it('returns false for Standard Schema without _run property', () => {
      const schemaWithoutValibotRun = {
        '~standard': {
          version: 1,
          vendor: 'valibot',
          validate: () => ({}),
        },
        // Missing _run
      };

      expect(isValibotSchema(schemaWithoutValibotRun)).toBe(false);
    });

    it('returns false for objects with non-object ~standard', () => {
      const invalidSchema = {
        '~standard': 'invalid',
        _run: {},
      };

      expect(isValibotSchema(invalidSchema)).toBe(false);
    });

    it('works with real vendor string from Standard Schema V1', () => {
      const mockValibotSchema = {
        '~standard': {
          version: 1,
          vendor: 'valibot' as const,
          validate: () => ({ value: {} }),
        },
        _run: { kind: 'schema' },
      };

      expect(isValibotSchema(mockValibotSchema)).toBe(true);

      // Verify vendor detection
      if (isValibotSchema(mockValibotSchema)) {
        expect(mockValibotSchema['~standard'].vendor).toBe('valibot');
      }
    });
  });

  describe('ValibotInfer type helper', () => {
    it('should infer types from Standard Schema V1', () => {
      // Type-only test - verifies TypeScript compilation
      type MockSchema = StandardSchemaV1<{ email: string }, { email: string }>;
      type Inferred = ValibotInfer<MockSchema>;

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
      type Inferred = ValibotInfer<ComplexSchema>;

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
          vendor: 'valibot',
          validate: () => ({ value: {} }),
        },
      };

      // Simple approach - no type guard needed
      const vendor = mockSchema['~standard'].vendor;
      expect(vendor).toBe('valibot');
    });

    it('demonstrates type guard for library-specific features', () => {
      const mockValibotSchema = {
        '~standard': {
          version: 1,
          vendor: 'valibot' as const,
          validate: () => ({ value: {} }),
        },
        _run: { kind: 'schema' },
      };

      // With type guard - enables TypeScript narrowing
      if (isValibotSchema(mockValibotSchema)) {
        // Can safely access Valibot-specific properties
        expect(mockValibotSchema._run).toBeDefined();
        expect(mockValibotSchema['~standard'].vendor).toBe('valibot');
      }
    });
  });
});
