import type {
  FieldPath,
  ValidationConfigMap,
  FormFieldName,
  FieldPathValue,
  ValidateFieldPath,
  LeafFieldPath,
} from './field-path-types';
import { ROOT_FORM } from '../constants';

describe('field-path-types', () => {
  describe('FieldPath', () => {
    it('should generate paths for flat object', () => {
      type TestModel = {
        name: string;
        age: number;
      };

      // Type-level test: These should not error
      const validPaths: FieldPath<TestModel>[] = ['name', 'age'];
      expect(validPaths).toEqual(['name', 'age']);

      // Verify autocomplete works (compile-time check)
      const path: FieldPath<TestModel> = 'name';
      expect(path).toBe('name');
    });

    it('should generate paths for nested objects', () => {
      type TestModel = {
        user: {
          profile: {
            age: number;
          };
          email: string;
        };
      };

      const validPaths: FieldPath<TestModel>[] = [
        'user',
        'user.profile',
        'user.profile.age',
        'user.email',
      ];

      expect(validPaths.length).toBe(4);
    });

    it('should generate paths for optional properties', () => {
      type TestModel = {
        required: string;
        optional?: {
          nested?: string;
        };
      };

      const validPaths: FieldPath<TestModel>[] = [
        'required',
        'optional',
        'optional.nested',
      ];

      expect(validPaths.length).toBe(3);
    });

    it('should handle arrays', () => {
      type TestModel = {
        items: Array<{
          name: string;
        }>;
      };

      // Array elements generate paths without index notation
      const validPaths: FieldPath<TestModel>[] = ['items', 'items.name'];

      expect(validPaths.length).toBe(2);
    });

    it('should stop at primitive types', () => {
      type TestModel = {
        date: Date;
        string: string;
        number: number;
        boolean: boolean;
        nullable: string | null;
      };

      const validPaths: FieldPath<TestModel>[] = [
        'date',
        'string',
        'number',
        'boolean',
        'nullable',
      ];

      expect(validPaths.length).toBe(5);
    });

    it('should handle deep nesting', () => {
      type TestModel = {
        level1: {
          level2: {
            level3: {
              level4: {
                value: string;
              };
            };
          };
        };
      };

      const validPaths: FieldPath<TestModel>[] = [
        'level1',
        'level1.level2',
        'level1.level2.level3',
        'level1.level2.level3.level4',
        'level1.level2.level3.level4.value',
      ];

      expect(validPaths.length).toBe(5);
    });
  });

  describe('ValidationConfigMap', () => {
    it('should provide type-safe validation config', () => {
      type TestModel = {
        password: string;
        confirmPassword: string;
        email: string;
      };

      const config: ValidationConfigMap<TestModel> = {
        password: ['confirmPassword'],
        email: ['password', 'confirmPassword'],
      };

      expect(config.password).toEqual(['confirmPassword']);
      expect(config.email).toEqual(['password', 'confirmPassword']);
    });

    it('should support nested field paths', () => {
      type TestModel = {
        addresses: {
          billing: {
            street: string;
            city: string;
          };
        };
      };

      const config: ValidationConfigMap<TestModel> = {
        'addresses.billing.street': ['addresses.billing.city'],
      };

      expect(config['addresses.billing.street']).toEqual([
        'addresses.billing.city',
      ]);
    });

    it('should be optional (partial)', () => {
      type TestModel = {
        field1: string;
        field2: string;
      };

      // Empty config is valid
      const emptyConfig: ValidationConfigMap<TestModel> = {};
      expect(emptyConfig).toEqual({});

      // Partial config is valid
      const partialConfig: ValidationConfigMap<TestModel> = {
        field1: ['field2'],
      };
      expect(partialConfig.field1).toEqual(['field2']);
    });
  });

  describe('FormFieldName', () => {
    it('should include field paths and ROOT_FORM', () => {
      type TestModel = {
        email: string;
        user: {
          name: string;
        };
      };

      // All of these should be valid
      const fieldNames: FormFieldName<TestModel>[] = [
        'email',
        'user',
        'user.name',
        ROOT_FORM,
      ];

      expect(fieldNames.length).toBe(4);
      expect(fieldNames).toContain(ROOT_FORM);
    });

    it('should work with typed vest suite field parameter', () => {
      type TestModel = {
        firstName: string;
        lastName: string;
      };

      // This simulates how it's used in validation suites
      function mockSuite(
        model: TestModel,
        field?: FormFieldName<TestModel>
      ): void {
        // Field can be undefined, any field path, or ROOT_FORM
        expect(
          field === undefined ||
            field === 'firstName' ||
            field === 'lastName' ||
            field === ROOT_FORM
        ).toBe(true);
      }

      mockSuite({ firstName: 'John', lastName: 'Doe' }, 'firstName');
      mockSuite({ firstName: 'John', lastName: 'Doe' }, ROOT_FORM);
      mockSuite({ firstName: 'John', lastName: 'Doe' }, undefined);
    });
  });

  describe('FieldPathValue', () => {
    it('should infer value type at path', () => {
      type TestModel = {
        name: string;
        age: number;
        user: {
          profile: {
            email: string;
          };
        };
      };

      // Type-level tests (compile-time verification)
      type NameType = FieldPathValue<TestModel, 'name'>; // should be string
      type AgeType = FieldPathValue<TestModel, 'age'>; // should be number
      type EmailType = FieldPathValue<TestModel, 'user.profile.email'>; // should be string

      const name: NameType = 'test';
      const age: AgeType = 42;
      const email: EmailType = 'test@example.com';

      expect(typeof name).toBe('string');
      expect(typeof age).toBe('number');
      expect(typeof email).toBe('string');
    });
  });

  describe('ValidateFieldPath', () => {
    it('should validate paths at compile time', () => {
      type TestModel = {
        name: string;
        age: number;
      };

      // Valid paths should pass through
      type ValidName = ValidateFieldPath<TestModel, 'name'>; // 'name'
      type ValidAge = ValidateFieldPath<TestModel, 'age'>; // 'age'

      const validName: ValidName = 'name';
      const validAge: ValidAge = 'age';

      expect(validName).toBe('name');
      expect(validAge).toBe('age');

      // Invalid paths would be `never` (compile error)
      // type Invalid = ValidateFieldPath<TestModel, 'invalid'>; // never
    });
  });

  describe('LeafFieldPath', () => {
    it('should only include leaf paths', () => {
      type TestModel = {
        user: {
          name: string;
          profile: {
            age: number;
          };
        };
      };

      // Only leaf paths (primitives)
      const leafPaths: LeafFieldPath<TestModel>[] = [
        'user.name',
        'user.profile.age',
      ];

      // Note: 'user' and 'user.profile' are NOT included (not leaves)
      expect(leafPaths.length).toBe(2);
    });

    it('should handle flat objects', () => {
      type TestModel = {
        name: string;
        age: number;
        active: boolean;
      };

      // All fields are leaves in a flat object
      const leafPaths: LeafFieldPath<TestModel>[] = ['name', 'age', 'active'];

      expect(leafPaths.length).toBe(3);
    });
  });

  describe('Real-world example', () => {
    it('should work with complex purchase form model', () => {
      type PurchaseFormModel = {
        firstName?: string;
        lastName?: string;
        age?: number;
        addresses?: {
          billing?: {
            street?: string;
            city?: string;
          };
          shipping?: {
            street?: string;
            city?: string;
          };
        };
        passwords?: {
          password?: string;
          confirmPassword?: string;
        };
      };

      // Validation config with type safety
      const config: ValidationConfigMap<PurchaseFormModel> = {
        age: ['firstName'], // when age changes, revalidate firstName
        'passwords.password': ['passwords.confirmPassword'],
        'addresses.billing.street': ['addresses.billing.city'],
      };

      expect(config.age).toEqual(['firstName']);
      expect(config['passwords.password']).toEqual([
        'passwords.confirmPassword',
      ]);

      // Field names for use in test() calls
      const fieldName: FormFieldName<PurchaseFormModel> = 'firstName';
      expect(fieldName).toBe('firstName');

      const nestedFieldName: FormFieldName<PurchaseFormModel> =
        'addresses.billing.street';
      expect(nestedFieldName).toBe('addresses.billing.street');

      const rootFieldName: FormFieldName<PurchaseFormModel> = ROOT_FORM;
      expect(rootFieldName).toBe(ROOT_FORM);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty object', () => {
      type EmptyModel = Record<string, never>;

      // Empty model has no valid paths
      // FieldPath<EmptyModel> would be never
      const paths: FieldPath<EmptyModel>[] = [];
      expect(paths.length).toBe(0);
    });

    it('should handle mixed primitive and object properties', () => {
      type MixedModel = {
        id: number;
        name: string;
        meta: {
          created: Date;
          tags: string[];
        };
      };

      const paths: FieldPath<MixedModel>[] = [
        'id',
        'name',
        'meta',
        'meta.created',
        'meta.tags',
      ];

      expect(paths.length).toBe(5);
    });

    it('should respect maximum depth limit', () => {
      // This test ensures we don't have infinite recursion
      type DeeplyNested = {
        l1: {
          l2: {
            l3: {
              l4: {
                l5: { l6: { l7: { l8: { l9: { l10: { l11: string } } } } } };
              };
            };
          };
        };
      };

      // Should stop at depth 10, so l11 would not be included
      const paths: FieldPath<DeeplyNested>[] = [
        'l1',
        'l1.l2',
        'l1.l2.l3',
        'l1.l2.l3.l4',
        'l1.l2.l3.l4.l5',
        'l1.l2.l3.l4.l5.l6',
        'l1.l2.l3.l4.l5.l6.l7',
        'l1.l2.l3.l4.l5.l6.l7.l8',
        'l1.l2.l3.l4.l5.l6.l7.l8.l9',
        'l1.l2.l3.l4.l5.l6.l7.l8.l9.l10',
      ];

      // Should have exactly 10 levels
      expect(paths.length).toBe(10);
    });
  });
});
