/**
 * Unit tests for Standard Schema helper functions
 */

import { describe, expect, it } from 'vitest';
import {
  type InferInput,
  type InferOutput,
  isFailureResult,
  isSuccessResult,
  type StandardSchema,
  validateStandardSchema,
  validateStandardSchemaSync,
} from './standard-schema.helpers';
import type { StandardSchemaV1 } from './standard-schema.types';

describe('Standard Schema Helpers', () => {
  describe('Type Aliases', () => {
    it('should provide InferInput type alias', () => {
      type TestSchema = StandardSchemaV1<
        { name: string },
        { name: string; id: number }
      >;

      // This is a compile-time test - if it compiles, the type alias works
      type Input = InferInput<TestSchema>;
      const input: Input = { name: 'test' };

      expect(input).toEqual({ name: 'test' });
    });

    it('should provide InferOutput type alias', () => {
      type TestSchema = StandardSchemaV1<
        { name: string },
        { name: string; id: number }
      >;

      // This is a compile-time test
      type Output = InferOutput<TestSchema>;
      const output: Output = { name: 'test', id: 1 };

      expect(output).toEqual({ name: 'test', id: 1 });
    });

    it('should provide StandardSchema type alias', () => {
      // This is a compile-time test
      const schema: StandardSchema<{ input: string }, { output: number }> = {
        '~standard': {
          version: 1,
          vendor: 'test',
          validate: () => ({ value: { output: 42 } }),
        },
      };

      expect(schema['~standard'].version).toBe(1);
    });
  });

  describe('validateStandardSchema', () => {
    it('should validate successfully with synchronous schema', async () => {
      const mockSchema: StandardSchemaV1<string, string> = {
        '~standard': {
          version: 1,
          vendor: 'test',
          validate: (value) => {
            if (typeof value === 'string' && value.length > 0) {
              return { value };
            }
            return { issues: [{ message: 'String must not be empty' }] };
          },
        },
      };

      const result = await validateStandardSchema(mockSchema, 'hello');

      expect(result).toEqual({ value: 'hello' });
      expect('issues' in result).toBe(false);
    });

    it('should return validation errors with synchronous schema', async () => {
      const mockSchema: StandardSchemaV1<string, string> = {
        '~standard': {
          version: 1,
          vendor: 'test',
          validate: (value) => {
            if (typeof value === 'string' && value.length > 0) {
              return { value };
            }
            return {
              issues: [
                { message: 'String must not be empty', path: ['value'] },
              ],
            };
          },
        },
      };

      const result = await validateStandardSchema(mockSchema, '');

      expect(result).toEqual({
        issues: [{ message: 'String must not be empty', path: ['value'] }],
      });
      expect('value' in result).toBe(false);
    });

    it('should handle asynchronous validation', async () => {
      const mockSchema: StandardSchemaV1<string, string> = {
        '~standard': {
          version: 1,
          vendor: 'test',
          validate: async (value) => {
            // Simulate async validation (e.g., API call)
            await new Promise((resolve) => setTimeout(resolve, 10));

            if (typeof value === 'string' && value.includes('@')) {
              return { value };
            }
            return { issues: [{ message: 'Invalid email format' }] };
          },
        },
      };

      const validResult = await validateStandardSchema(
        mockSchema,
        'test@example.com',
      );
      expect(validResult).toEqual({ value: 'test@example.com' });

      const invalidResult = await validateStandardSchema(mockSchema, 'invalid');
      expect(invalidResult).toEqual({
        issues: [{ message: 'Invalid email format' }],
      });
    });

    it('should handle async validation with complex data', async () => {
      type UserInput = {
        email: string;
        age: string;
      };

      type UserOutput = {
        email: string;
        age: number;
      };

      const mockSchema: StandardSchemaV1<UserInput, UserOutput> = {
        '~standard': {
          version: 1,
          vendor: 'test',
          validate: async (value: unknown) => {
            await new Promise((resolve) => setTimeout(resolve, 5));

            const data = value as UserInput;
            const age = Number(data.age);

            if (!data.email.includes('@')) {
              return {
                issues: [{ message: 'Invalid email', path: ['email'] }],
              };
            }

            if (Number.isNaN(age) || age < 18) {
              return {
                issues: [{ message: 'Must be 18 or older', path: ['age'] }],
              };
            }

            return { value: { email: data.email, age } };
          },
        },
      };

      const validResult = await validateStandardSchema(mockSchema, {
        email: 'user@test.com',
        age: '25',
      });

      expect(validResult).toEqual({
        value: { email: 'user@test.com', age: 25 },
      });

      const invalidEmailResult = await validateStandardSchema(mockSchema, {
        email: 'invalid',
        age: '25',
      });

      expect(invalidEmailResult).toEqual({
        issues: [{ message: 'Invalid email', path: ['email'] }],
      });

      const invalidAgeResult = await validateStandardSchema(mockSchema, {
        email: 'user@test.com',
        age: '15',
      });

      expect(invalidAgeResult).toEqual({
        issues: [{ message: 'Must be 18 or older', path: ['age'] }],
      });
    });
  });

  describe('validateStandardSchemaSync', () => {
    it('should validate successfully with synchronous schema', () => {
      const mockSchema: StandardSchemaV1<number, number> = {
        '~standard': {
          version: 1,
          vendor: 'test',
          validate: (value) => {
            if (typeof value === 'number' && value > 0) {
              return { value };
            }
            return { issues: [{ message: 'Number must be positive' }] };
          },
        },
      };

      const result = validateStandardSchemaSync(mockSchema, 42);

      expect(result).toEqual({ value: 42 });
    });

    it('should return validation errors with synchronous schema', () => {
      const mockSchema: StandardSchemaV1<number, number> = {
        '~standard': {
          version: 1,
          vendor: 'test',
          validate: (value) => {
            if (typeof value === 'number' && value > 0) {
              return { value };
            }
            return {
              issues: [{ message: 'Number must be positive', path: ['value'] }],
            };
          },
        },
      };

      const result = validateStandardSchemaSync(mockSchema, -5);

      expect(result).toEqual({
        issues: [{ message: 'Number must be positive', path: ['value'] }],
      });
    });

    it('should throw TypeError when schema uses async validation', () => {
      const asyncSchema: StandardSchemaV1<string, string> = {
        '~standard': {
          version: 1,
          vendor: 'test',
          validate: async (value) => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            return { value: value as string };
          },
        },
      };

      expect(() => validateStandardSchemaSync(asyncSchema, 'test')).toThrow(
        TypeError,
      );

      expect(() => validateStandardSchemaSync(asyncSchema, 'test')).toThrow(
        'Schema validation must be synchronous. Use validateStandardSchema() for async validation.',
      );
    });

    it('should work with complex synchronous transformations', () => {
      type Input = {
        value: string;
      };

      type Output = {
        value: string;
        uppercased: string;
        length: number;
      };

      const mockSchema: StandardSchemaV1<Input, Output> = {
        '~standard': {
          version: 1,
          vendor: 'test',
          validate: (data: unknown) => {
            const input = data as Input;

            if (!input.value || input.value.length === 0) {
              return {
                issues: [{ message: 'Value is required', path: ['value'] }],
              };
            }

            return {
              value: {
                value: input.value,
                uppercased: input.value.toUpperCase(),
                length: input.value.length,
              },
            };
          },
        },
      };

      const result = validateStandardSchemaSync(mockSchema, {
        value: 'hello',
      });

      expect(result).toEqual({
        value: {
          value: 'hello',
          uppercased: 'HELLO',
          length: 5,
        },
      });
    });
  });

  describe('isFailureResult', () => {
    it('should return true for failure results', () => {
      const failureResult: StandardSchemaV1.FailureResult = {
        issues: [{ message: 'Validation failed' }],
      };

      expect(isFailureResult(failureResult)).toBe(true);
    });

    it('should return false for success results', () => {
      const successResult: StandardSchemaV1.SuccessResult<string> = {
        value: 'success',
      };

      expect(isFailureResult(successResult)).toBe(false);
    });

    it('should narrow TypeScript types correctly', () => {
      const result: StandardSchemaV1.Result<string> = {
        issues: [{ message: 'Error' }],
      };

      if (isFailureResult(result)) {
        // TypeScript should know result.issues exists
        expect(result.issues).toBeDefined();
        expect(result.issues.length).toBeGreaterThan(0);
      }
    });

    it('should handle results with path information', () => {
      const failureResult: StandardSchemaV1.FailureResult = {
        issues: [
          {
            message: 'Invalid email',
            path: ['user', 'email'],
          },
          {
            message: 'Too short',
            path: ['user', 'password'],
          },
        ],
      };

      expect(isFailureResult(failureResult)).toBe(true);

      if (isFailureResult(failureResult)) {
        expect(failureResult.issues).toHaveLength(2);
        expect(failureResult.issues[0].path).toEqual(['user', 'email']);
      }
    });
  });

  describe('isSuccessResult', () => {
    it('should return true for success results', () => {
      const successResult: StandardSchemaV1.SuccessResult<{ data: string }> = {
        value: { data: 'test' },
      };

      expect(isSuccessResult(successResult)).toBe(true);
    });

    it('should return false for failure results', () => {
      const failureResult: StandardSchemaV1.FailureResult = {
        issues: [{ message: 'Validation failed' }],
      };

      expect(isSuccessResult(failureResult)).toBe(false);
    });

    it('should narrow TypeScript types correctly', () => {
      const result: StandardSchemaV1.Result<{ email: string }> = {
        value: { email: 'test@example.com' },
      };

      if (isSuccessResult(result)) {
        // TypeScript should know result.value exists
        expect(result.value).toBeDefined();
        expect(result.value.email).toBe('test@example.com');
      }
    });

    it('should handle complex output types', () => {
      type ComplexOutput = {
        id: number;
        user: {
          name: string;
          email: string;
        };
        metadata: Record<string, unknown>;
      };

      const successResult: StandardSchemaV1.SuccessResult<ComplexOutput> = {
        value: {
          id: 1,
          user: {
            name: 'John Doe',
            email: 'john@example.com',
          },
          metadata: { createdAt: new Date().toISOString() },
        },
      };

      expect(isSuccessResult(successResult)).toBe(true);

      if (isSuccessResult(successResult)) {
        expect(successResult.value.id).toBe(1);
        expect(successResult.value.user.name).toBe('John Doe');
        expect(successResult.value.metadata).toBeDefined();
      }
    });
  });

  describe('Type Guards Integration', () => {
    it('should work together for result handling', async () => {
      const mockSchema: StandardSchemaV1<string, number> = {
        '~standard': {
          version: 1,
          vendor: 'test',
          validate: (value) => {
            const parsedNumber = Number(value);
            if (Number.isNaN(parsedNumber)) {
              return { issues: [{ message: 'Not a number' }] };
            }
            return { value: parsedNumber };
          },
        },
      };

      const validResult = await validateStandardSchema(mockSchema, '42');
      const invalidResult = await validateStandardSchema(mockSchema, 'abc');

      if (isSuccessResult(validResult)) {
        expect(validResult.value).toBe(42);
      } else {
        throw new Error('Expected success result');
      }

      if (isFailureResult(invalidResult)) {
        expect(invalidResult.issues[0].message).toBe('Not a number');
      } else {
        throw new Error('Expected failure result');
      }
    });
  });
});
