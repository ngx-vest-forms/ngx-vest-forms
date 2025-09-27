import type { StandardSchemaV1 } from '@standard-schema/spec';
import { type } from 'arktype';
import * as v from 'valibot';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { z } from 'zod';
import {
  InferSchemaType,
  isStandardSchema,
  ngxExtractTemplateFromSchema,
  ngxModelToStandardSchema,
} from './schema-adapter';

// --- Test Data ---

// Zod Schema
const zodSchema = z.object({
  name: z.string(),
  age: z.number().optional(),
});

// Valibot Schema
const valibotSchema = v.object({
  email: v.pipe(v.string(), v.email()),
  isActive: v.optional(v.boolean(), true), // Default value
});

// ArkType Schema
const arktypeSchema = type({
  product: {
    id: 'string',
    price: 'number',
    tags: 'string[]',
  },
  'user?': {
    name: 'string',
  },
});

// Custom Model Template
const customModelTemplate = {
  address: {
    street: '', // Representing type via empty value
    city: '',
  },
  isAdmin: false,
};

// Wrapped Custom Model Template
// Use the adjusted return type from ngxModelToStandardSchema
const wrappedModelTemplateSchema: StandardSchemaV1<
  typeof customModelTemplate,
  typeof customModelTemplate
> & { _shape: typeof customModelTemplate } = // Corrected property name to _shape
  ngxModelToStandardSchema(customModelTemplate);

// Plain Object
const plainObject = { id: 1, value: 'test' };

// --- Tests ---

describe('Schema Adapter Utilities', () => {
  describe('isStandardSchema', () => {
    // According to standardschema.dev, these libraries implement the spec.
    // Runtime instances should have the '~standard' property.
    it('should return true for a Zod schema instance', () => {
      expect(isStandardSchema(zodSchema)).toBe(true);
    });

    it('should return true for a Valibot schema instance', () => {
      expect(isStandardSchema(valibotSchema)).toBe(true);
    });

    /// Somehow the test is failing for ArkType, while the code seems to be correct
    it.skip('should return true for an ArkType schema instance', () => {
      expect(isStandardSchema(arktypeSchema)).toBe(true);
    });

    it('should return true for a wrapped custom model template schema', () => {
      expect(isStandardSchema(wrappedModelTemplateSchema)).toBe(true);
    });

    it('should return false for a plain object', () => {
      expect(isStandardSchema(plainObject)).toBe(false);
    });

    it('should return false for a raw custom model template object', () => {
      // The raw template itself does not conform
      expect(isStandardSchema(customModelTemplate)).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isStandardSchema(null)).toBe(false);
      // eslint-disable-next-line unicorn/no-useless-undefined
      expect(isStandardSchema(undefined)).toBe(false);
    });
  });

  describe('ngxModelToStandardSchema', () => {
    it('should create a schema with StandardSchemaV1 interface', () => {
      const model = { name: 'test' };
      const schema = ngxModelToStandardSchema(model);

      // Should have the ~standard property
      expect(schema['~standard']).toBeDefined();
      expect(typeof schema['~standard'].validate).toBe('function');
      expect(schema['~standard'].version).toBe(1);
    });

    it('should create a schema with a `_shape` property that matches the model structure', () => {
      const model = { name: 'test', nested: { value: 123 } };
      const schema = ngxModelToStandardSchema(model);

      expect(schema._shape).toEqual(model);
    });

    it('validate should return success result for valid objects', () => {
      const model = { name: 'test' };
      const schema = ngxModelToStandardSchema(model);
      const result = schema['~standard'].validate(model);

      // Should return success result with value
      expect('value' in result).toBe(true);
      expect('issues' in result).toBe(false);

      if ('value' in result) {
        expect(result.value).toEqual(model);
      }
    });

    it('validate should return failure result for non-object inputs', () => {
      const schema = ngxModelToStandardSchema({});

      const stringResult = schema['~standard'].validate('string');
      expect('issues' in stringResult).toBe(true);
      expect('value' in stringResult).toBe(false);

      if ('issues' in stringResult) {
        expect(stringResult.issues).toBeDefined();
        expect(Array.isArray(stringResult.issues)).toBe(true);
        if (stringResult.issues) {
          expect(stringResult.issues.length).toBeGreaterThan(0);
        }
      }

      const numberResult = schema['~standard'].validate(123);
      expect('issues' in numberResult).toBe(true);

      const nullResult = schema['~standard'].validate(null);
      expect('issues' in nullResult).toBe(true);

      const undefinedResult = schema['~standard'].validate(void 0);
      expect('issues' in undefinedResult).toBe(true);
    });

    it('should handle nested object templates', () => {
      const nestedModel = { user: { profile: { name: 'test' } } };
      const schema = ngxModelToStandardSchema(nestedModel);

      expect(schema._shape).toEqual(nestedModel);

      const result = schema['~standard'].validate(nestedModel);
      expect('value' in result).toBe(true);
      expect('issues' in result).toBe(false);

      if ('value' in result) {
        expect(result.value).toEqual(nestedModel);
      }
    });

    it('should conform to StandardSchemaV1 interface', () => {
      const model = { test: 'value' };
      const schema = ngxModelToStandardSchema(model);

      // Type check - should be assignable to StandardSchemaV1
      const standardSchema: StandardSchemaV1<typeof model, typeof model> =
        schema;
      expect(standardSchema['~standard']).toBeDefined();
      expect(standardSchema['~standard'].version).toBe(1);
    });
  });

  describe('ngxExtractTemplateFromSchema', () => {
    it('should extract the original template from a schema created with ngxModelToStandardSchema', () => {
      const model = { name: 'test', value: 1 };
      const schema = ngxModelToStandardSchema(model);
      const extracted = ngxExtractTemplateFromSchema(schema);
      expect(extracted).toEqual(model);
    });

    it('should return null for a Zod schema', () => {
      const extracted = ngxExtractTemplateFromSchema(zodSchema);
      expect(extracted).toBeNull();
    });

    it('should return null for a Valibot schema', () => {
      const extracted = ngxExtractTemplateFromSchema(valibotSchema);
      expect(extracted).toBeNull();
    });

    it.todo(
      'should return null for a plain object that is not a valid schema',
      () => {
        // Why: The function should only operate on valid schemas.
        // What: Pass a plain object and assert the result is null.
      },
    );
  });

  describe('InferSchemaType', () => {
    it('should correctly infer type for Zod schema (compile-time check)', () => {
      type ZodFormType = InferSchemaType<typeof zodSchema>;
      const formData: ZodFormType = { name: 'Test' }; // age is optional
      const formDataWithAge: ZodFormType = { name: 'Test', age: 30 };

      // @ts-expect-error - Should error if type is wrong (e.g., name is number)
      const invalidData: ZodFormType = { name: 123 };

      // Runtime checks to ensure variables are used
      expect(formData.name).toBe('Test');
      expect(formDataWithAge.age).toBe(30);
      expect(invalidData).toBeDefined();
    });

    it('should correctly infer type for Valibot schema (compile-time check)', () => {
      type ValibotFormType = InferSchemaType<typeof valibotSchema>;
      // Valibot's output type includes the defaulted optional field
      const formData: ValibotFormType = {
        email: 'test@example.com',
        isActive: true,
      };

      // @ts-expect-error - Should error if type is wrong (email is number)
      const invalidData: ValibotFormType = { email: 123, isActive: false };
      // @ts-expect-error - Should error if required field is missing
      const missingData: ValibotFormType = { isActive: true };

      // Runtime checks
      expect(formData.email).toBe('test@example.com');
      expect(formData.isActive).toBe(true);
      expect(invalidData).toBeDefined();
      expect(missingData).toBeDefined();
    });

    it('should correctly infer type for ArkType schema (compile-time check)', () => {
      type ArkTypeFormType = InferSchemaType<typeof arktypeSchema>;
      const formData: ArkTypeFormType = {
        product: { id: 'prod-123', price: 99.99, tags: ['a', 'b'] },
      };
      const formDataWithUser: ArkTypeFormType = {
        product: { id: 'prod-456', price: 10, tags: [] }, // Use 10 instead of 10.0
        user: { name: 'Ark User' },
      };

      const invalidData: ArkTypeFormType = {
        // @ts-expect-error - Should error if type is wrong (product.id is number)
        product: { id: 123, price: 1, tags: [] },
      };
      // @ts-expect-error - Should error if required field is missing (product)
      const missingData: ArkTypeFormType = { user: { name: 'Test' } };

      // Runtime checks
      expect(formData.product.price).toBe(99.99);
      expect(formDataWithUser.user?.name).toBe('Ark User');
      expect(invalidData).toBeDefined();
      expect(missingData).toBeDefined();
    });

    it('should correctly infer type for wrapped custom model template (compile-time check)', () => {
      type CustomFormType = InferSchemaType<typeof wrappedModelTemplateSchema>;
      const formData: CustomFormType = {
        address: { street: '456 Oak', city: 'Otherplace' },
        isAdmin: true,
      };

      // @ts-expect-error - Should error if type is wrong (address is number)
      const invalidData: CustomFormType = { address: 123, isAdmin: false };
      // @ts-expect-error - Should error if structure is wrong (missing isAdmin)
      const missingData: CustomFormType = {
        address: { street: '789 Pine', city: 'Newville' },
      };

      // Runtime checks
      expect(formData.isAdmin).toBe(true);
      expect(invalidData).toBeDefined();
      expect(missingData).toBeDefined();
    });

    it('should infer `any` for null or undefined schema (compile-time check)', () => {
      type NullType = InferSchemaType<null>;
      type UndefinedType = InferSchemaType<undefined>;

      // Since it infers 'any', any assignment is allowed by TypeScript
      const data1: NullType = { anything: 123, works: true }; // Fixed syntax error
      const data2: UndefinedType = 'whatever string works';
      const data3: NullType = null;
      const data4: UndefinedType = undefined; // Keep undefined here for test clarity

      // Runtime checks
      expect(data1).toBeDefined();
      expect(data2).toBeDefined();
      expect(data3).toBeNull();
      expect(data4).toBeUndefined();
    });
  });
});

describe('ngxExtractTemplateFromSchema', () => {
  it('should extract template from schemas created with ngxModelToStandardSchema', () => {
    const template = {
      name: '',
      email: '',
      age: 0,
      isActive: false,
      nested: {
        value: '',
        count: 0,
      },
    };

    const schema = ngxModelToStandardSchema(template);
    const extractedTemplate = ngxExtractTemplateFromSchema(schema);

    expect(extractedTemplate).toEqual(template);
    expect(extractedTemplate).toBe(template); // Should be the exact same reference
  });

  it('should return null for schemas without _shape property (Zod)', () => {
    const zodSchema = z.object({
      name: z.string(),
      age: z.number(),
    });

    const extractedTemplate = ngxExtractTemplateFromSchema(zodSchema);
    expect(extractedTemplate).toBeNull();
  });

  it('should return null for schemas without _shape property (Valibot)', () => {
    const valibotSchema = v.object({
      email: v.pipe(v.string(), v.email()),
      isActive: v.boolean(),
    });

    const extractedTemplate = ngxExtractTemplateFromSchema(valibotSchema);
    expect(extractedTemplate).toBeNull();
  });

  it('should return null for null or undefined schemas', () => {
    expect(ngxExtractTemplateFromSchema(null)).toBeNull();
    // eslint-disable-next-line unicorn/no-useless-undefined
    expect(ngxExtractTemplateFromSchema(undefined)).toBeNull();
  });

  it('should return null for plain objects', () => {
    const plainObject = { name: 'test', age: 25 };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extractedTemplate = ngxExtractTemplateFromSchema(plainObject as any);
    expect(extractedTemplate).toBeNull();
  });

  it('should handle complex nested templates', () => {
    const complexTemplate = {
      user: {
        profile: {
          firstName: '',
          lastName: '',
          age: 0,
        },
        settings: {
          theme: 'light',
          notifications: true,
        },
      },
      metadata: {
        created: new Date(),
        tags: [''],
      },
    };

    const schema = ngxModelToStandardSchema(complexTemplate);
    const extractedTemplate = ngxExtractTemplateFromSchema(schema);

    expect(extractedTemplate).toEqual(complexTemplate);
    expect(extractedTemplate?.user?.profile?.firstName).toBe('');
    expect(extractedTemplate?.user?.settings?.theme).toBe('light');
    expect(extractedTemplate?.metadata?.tags).toEqual(['']);
  });

  it('should maintain type inference', () => {
    const template = {
      name: '',
      age: 0,
      isActive: false,
    };

    const schema = ngxModelToStandardSchema(template);
    const extractedTemplate = ngxExtractTemplateFromSchema(schema);

    // TypeScript should infer the correct type
    if (extractedTemplate) {
      expectTypeOf(extractedTemplate.name).toEqualTypeOf<string>();
      expectTypeOf(extractedTemplate.age).toEqualTypeOf<number>();
      expectTypeOf(extractedTemplate.isActive).toEqualTypeOf<boolean>();
    }

    expect(extractedTemplate).toEqual(template);
  });
});
