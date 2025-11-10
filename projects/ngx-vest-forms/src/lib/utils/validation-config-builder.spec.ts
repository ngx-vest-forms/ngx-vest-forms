import type { DeepPartial } from './deep-partial';
import type { ValidationConfigMap } from './field-path-types';
import {
  createValidationConfig,
  ValidationConfigBuilder,
} from './validation-config-builder';

/**
 * Test form model for validation config builder tests
 */
type TestFormModel = DeepPartial<{
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  startDate: Date;
  endDate: Date;
  minPrice: number;
  maxPrice: number;
  country: string;
  state: string;
  zipCode: string;
  addresses: {
    billing: {
      street: string;
      city: string;
      zipCode: string;
    };
    shipping: {
      street: string;
      city: string;
    };
  };
}>;

describe('ValidationConfigBuilder', () => {
  describe('whenChanged()', () => {
    it('should add single dependent field', () => {
      const config = createValidationConfig<TestFormModel>()
        .whenChanged('password', 'confirmPassword')
        .build();

      expect(config).toEqual({
        password: ['confirmPassword'],
      });
    });

    it('should add multiple dependent fields', () => {
      const config = createValidationConfig<TestFormModel>()
        .whenChanged('country', ['state', 'zipCode'])
        .build();

      expect(config).toEqual({
        country: ['state', 'zipCode'],
      });
    });

    it('should accumulate dependents when called multiple times with same trigger', () => {
      const config = createValidationConfig<TestFormModel>()
        .whenChanged('password', 'confirmPassword')
        .whenChanged('password', 'email')
        .build();

      expect(config).toEqual({
        password: ['confirmPassword', 'email'],
      });
    });

    it('should deduplicate dependents', () => {
      const config = createValidationConfig<TestFormModel>()
        .whenChanged('password', ['confirmPassword', 'email'])
        .whenChanged('password', ['email', 'firstName'])
        .build();

      expect(config).toEqual({
        password: ['confirmPassword', 'email', 'firstName'],
      });
    });

    it('should work with nested field paths', () => {
      const config = createValidationConfig<TestFormModel>()
        .whenChanged('addresses.billing.street', 'addresses.billing.city')
        .build();

      expect(config).toEqual({
        'addresses.billing.street': ['addresses.billing.city'],
      });
    });

    it('should support method chaining', () => {
      const config = createValidationConfig<TestFormModel>()
        .whenChanged('firstName', 'lastName')
        .whenChanged('email', 'password')
        .build();

      expect(config).toEqual({
        firstName: ['lastName'],
        email: ['password'],
      });
    });

    describe('duplicate detection warnings', () => {
      let consoleWarnSpy: jest.SpyInstance;

      beforeEach(() => {
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      });

      afterEach(() => {
        consoleWarnSpy.mockRestore();
      });

      it('should warn when adding duplicate dependents in development mode', () => {
        // Mock ngDevMode to be true
        (global as any).ngDevMode = true;

        createValidationConfig<TestFormModel>()
          .whenChanged('password', ['confirmPassword', 'email'])
          .whenChanged('password', ['email', 'firstName']) // email is duplicate
          .build();

        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining(
            '[ngx-vest-forms] ValidationConfigBuilder: Duplicate dependencies detected'
          )
        );
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining("Trigger: 'password'")
        );
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining("Duplicates: 'email'")
        );
      });

      it('should not warn when adding unique dependents', () => {
        (global as any).ngDevMode = true;

        createValidationConfig<TestFormModel>()
          .whenChanged('password', ['confirmPassword'])
          .whenChanged('password', ['email']) // No duplicates
          .build();

        expect(consoleWarnSpy).not.toHaveBeenCalled();
      });

      it('should not warn in production mode', () => {
        (global as any).ngDevMode = false;

        createValidationConfig<TestFormModel>()
          .whenChanged('password', ['confirmPassword', 'email'])
          .whenChanged('password', ['email', 'firstName']) // Duplicate
          .build();

        expect(consoleWarnSpy).not.toHaveBeenCalled();
      });

      it('should warn about multiple duplicates', () => {
        (global as any).ngDevMode = true;

        createValidationConfig<TestFormModel>()
          .whenChanged('password', ['confirmPassword', 'email', 'firstName'])
          .whenChanged('password', ['email', 'firstName', 'lastName']) // Two duplicates
          .build();

        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining("Duplicates: 'email', 'firstName'")
        );
      });

      it('should deduplicate despite warning', () => {
        (global as any).ngDevMode = true;

        const config = createValidationConfig<TestFormModel>()
          .whenChanged('password', ['confirmPassword', 'email'])
          .whenChanged('password', ['email', 'firstName'])
          .build();

        // Should still deduplicate correctly
        expect(config).toEqual({
          password: ['confirmPassword', 'email', 'firstName'],
        });
      });
    });
  });

  describe('bidirectional()', () => {
    it('should create two-way dependency between fields', () => {
      const config = createValidationConfig<TestFormModel>()
        .bidirectional('password', 'confirmPassword')
        .build();

      expect(config).toEqual({
        password: ['confirmPassword'],
        confirmPassword: ['password'],
      });
    });

    it('should work with nested field paths', () => {
      const config = createValidationConfig<TestFormModel>()
        .bidirectional('addresses.billing.street', 'addresses.shipping.street')
        .build();

      expect(config).toEqual({
        'addresses.billing.street': ['addresses.shipping.street'],
        'addresses.shipping.street': ['addresses.billing.street'],
      });
    });

    it('should support multiple bidirectional relationships', () => {
      const config = createValidationConfig<TestFormModel>()
        .bidirectional('password', 'confirmPassword')
        .bidirectional('startDate', 'endDate')
        .bidirectional('minPrice', 'maxPrice')
        .build();

      expect(config).toEqual({
        password: ['confirmPassword'],
        confirmPassword: ['password'],
        startDate: ['endDate'],
        endDate: ['startDate'],
        minPrice: ['maxPrice'],
        maxPrice: ['minPrice'],
      });
    });

    it('should combine with whenChanged() calls', () => {
      const config = createValidationConfig<TestFormModel>()
        .bidirectional('password', 'confirmPassword')
        .whenChanged('password', 'email')
        .build();

      expect(config).toEqual({
        password: ['confirmPassword', 'email'],
        confirmPassword: ['password'],
      });
    });

    describe('duplicate detection warnings', () => {
      let consoleWarnSpy: jest.SpyInstance;

      beforeEach(() => {
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      });

      afterEach(() => {
        consoleWarnSpy.mockRestore();
      });

      it('should warn when calling bidirectional with same fields twice in development mode', () => {
        (global as any).ngDevMode = true;

        createValidationConfig<TestFormModel>()
          .bidirectional('password', 'confirmPassword')
          .bidirectional('password', 'confirmPassword') // Exact duplicate
          .build();

        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining(
            '[ngx-vest-forms] ValidationConfigBuilder: Duplicate bidirectional relationship detected'
          )
        );
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining("Fields: 'password' ↔ 'confirmPassword'")
        );
      });

      it('should warn when calling bidirectional with reversed fields in development mode', () => {
        (global as any).ngDevMode = true;

        createValidationConfig<TestFormModel>()
          .bidirectional('password', 'confirmPassword')
          .bidirectional('confirmPassword', 'password') // Reversed duplicate
          .build();

        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining(
            'Duplicate bidirectional relationship detected'
          )
        );
      });

      it('should not warn when adding different bidirectional relationships', () => {
        (global as any).ngDevMode = true;

        createValidationConfig<TestFormModel>()
          .bidirectional('password', 'confirmPassword')
          .bidirectional('startDate', 'endDate') // Different fields
          .build();

        expect(consoleWarnSpy).not.toHaveBeenCalled();
      });

      it('should not warn in production mode', () => {
        (global as any).ngDevMode = false;

        createValidationConfig<TestFormModel>()
          .bidirectional('password', 'confirmPassword')
          .bidirectional('password', 'confirmPassword') // Duplicate
          .build();

        expect(consoleWarnSpy).not.toHaveBeenCalled();
      });

      it('should still create correct config despite warning', () => {
        (global as any).ngDevMode = true;

        const config = createValidationConfig<TestFormModel>()
          .bidirectional('password', 'confirmPassword')
          .bidirectional('password', 'confirmPassword')
          .build();

        expect(config).toEqual({
          password: ['confirmPassword'],
          confirmPassword: ['password'],
        });
      });

      it('should not warn when bidirectional is combined with whenChanged for same fields', () => {
        (global as any).ngDevMode = true;

        createValidationConfig<TestFormModel>()
          .bidirectional('password', 'confirmPassword')
          .whenChanged('password', 'email') // Adding additional dependency is fine
          .build();

        expect(consoleWarnSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('group()', () => {
    it('should create mutual dependencies for all fields in group', () => {
      const config = createValidationConfig<TestFormModel>()
        .group(['firstName', 'lastName', 'email'])
        .build();

      expect(config).toEqual({
        firstName: ['lastName', 'email'],
        lastName: ['firstName', 'email'],
        email: ['firstName', 'lastName'],
      });
    });

    it('should handle group of two fields', () => {
      const config = createValidationConfig<TestFormModel>()
        .group(['password', 'confirmPassword'])
        .build();

      expect(config).toEqual({
        password: ['confirmPassword'],
        confirmPassword: ['password'],
      });
    });

    it('should handle group of four fields', () => {
      const config = createValidationConfig<TestFormModel>()
        .group(['firstName', 'lastName', 'email', 'password'])
        .build();

      expect(config).toEqual({
        firstName: ['lastName', 'email', 'password'],
        lastName: ['firstName', 'email', 'password'],
        email: ['firstName', 'lastName', 'password'],
        password: ['firstName', 'lastName', 'email'],
      });
    });

    it('should work with nested field paths', () => {
      const config = createValidationConfig<TestFormModel>()
        .group([
          'addresses.billing.street',
          'addresses.billing.city',
          'addresses.billing.zipCode',
        ])
        .build();

      expect(config).toEqual({
        'addresses.billing.street': [
          'addresses.billing.city',
          'addresses.billing.zipCode',
        ],
        'addresses.billing.city': [
          'addresses.billing.street',
          'addresses.billing.zipCode',
        ],
        'addresses.billing.zipCode': [
          'addresses.billing.street',
          'addresses.billing.city',
        ],
      });
    });

    it('should combine with other builder methods', () => {
      const config = createValidationConfig<TestFormModel>()
        .group(['firstName', 'lastName'])
        .whenChanged('country', 'state')
        .build();

      expect(config).toEqual({
        firstName: ['lastName'],
        lastName: ['firstName'],
        country: ['state'],
      });
    });
  });

  describe('merge()', () => {
    it('should merge with existing configuration', () => {
      const existingConfig: ValidationConfigMap<TestFormModel> = {
        password: ['confirmPassword'],
      };

      const config = createValidationConfig<TestFormModel>()
        .whenChanged('email', 'firstName')
        .merge(existingConfig)
        .build();

      expect(config).toEqual({
        email: ['firstName'],
        password: ['confirmPassword'],
      });
    });

    it('should merge and deduplicate dependents for same trigger', () => {
      const existingConfig: ValidationConfigMap<TestFormModel> = {
        password: ['confirmPassword'],
      };

      const config = createValidationConfig<TestFormModel>()
        .whenChanged('password', 'email')
        .merge(existingConfig)
        .build();

      expect(config).toEqual({
        password: ['email', 'confirmPassword'],
      });
    });

    it('should merge multiple configurations', () => {
      const addressConfig: ValidationConfigMap<TestFormModel> = {
        'addresses.billing.street': ['addresses.billing.city'],
      };

      const contactConfig: ValidationConfigMap<TestFormModel> = {
        email: ['password'],
      };

      const config = createValidationConfig<TestFormModel>()
        .merge(addressConfig)
        .merge(contactConfig)
        .build();

      expect(config).toEqual({
        'addresses.billing.street': ['addresses.billing.city'],
        email: ['password'],
      });
    });

    it('should handle empty configuration', () => {
      const config = createValidationConfig<TestFormModel>()
        .whenChanged('password', 'confirmPassword')
        .merge({})
        .build();

      expect(config).toEqual({
        password: ['confirmPassword'],
      });
    });

    it('should combine with all other methods', () => {
      const baseConfig: ValidationConfigMap<TestFormModel> = {
        country: ['state'],
      };

      const config = createValidationConfig<TestFormModel>()
        .bidirectional('password', 'confirmPassword')
        .group(['firstName', 'lastName'])
        .whenChanged('email', 'password')
        .merge(baseConfig)
        .build();

      expect(config).toEqual({
        password: ['confirmPassword'],
        confirmPassword: ['password'],
        firstName: ['lastName'],
        lastName: ['firstName'],
        email: ['password'],
        country: ['state'],
      });
    });
  });

  describe('build()', () => {
    it('should return empty object for empty builder', () => {
      const config = createValidationConfig<TestFormModel>().build();

      expect(config).toEqual({});
    });

    it('should return a copy of the configuration', () => {
      const builder = createValidationConfig<TestFormModel>().whenChanged(
        'password',
        'confirmPassword'
      );

      const config1 = builder.build();
      const config2 = builder.build();

      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2); // Different object instances
    });

    it('should not allow external mutations to affect builder', () => {
      const builder = createValidationConfig<TestFormModel>().whenChanged(
        'password',
        'confirmPassword'
      );

      const config1 = builder.build();
      (config1 as any).password.push('email'); // Mutate returned config

      const config2 = builder.build();

      expect(config2).toEqual({
        password: ['confirmPassword'],
      });
    });
  });

  describe('complex scenarios', () => {
    it('should handle real-world password validation config', () => {
      const config = createValidationConfig<TestFormModel>()
        .bidirectional('password', 'confirmPassword')
        .whenChanged('password', 'email') // Update email validation when password changes
        .build();

      expect(config).toEqual({
        password: ['confirmPassword', 'email'],
        confirmPassword: ['password'],
      });
    });

    it('should handle real-world date range validation', () => {
      const config = createValidationConfig<TestFormModel>()
        .bidirectional('startDate', 'endDate')
        .build();

      expect(config).toEqual({
        startDate: ['endDate'],
        endDate: ['startDate'],
      });
    });

    it('should handle real-world address validation', () => {
      const config = createValidationConfig<TestFormModel>()
        .whenChanged('country', ['state', 'zipCode'])
        .group([
          'addresses.billing.street',
          'addresses.billing.city',
          'addresses.billing.zipCode',
        ])
        .build();

      expect(config).toEqual({
        country: ['state', 'zipCode'],
        'addresses.billing.street': [
          'addresses.billing.city',
          'addresses.billing.zipCode',
        ],
        'addresses.billing.city': [
          'addresses.billing.street',
          'addresses.billing.zipCode',
        ],
        'addresses.billing.zipCode': [
          'addresses.billing.street',
          'addresses.billing.city',
        ],
      });
    });

    it('should handle conditional configuration merge', () => {
      const isInternational = true;
      const internationalConfig: ValidationConfigMap<TestFormModel> =
        isInternational ? { country: ['state'] } : {};

      const config = createValidationConfig<TestFormModel>()
        .bidirectional('password', 'confirmPassword')
        .merge(internationalConfig)
        .build();

      expect(config).toEqual({
        password: ['confirmPassword'],
        confirmPassword: ['password'],
        country: ['state'],
      });
    });

    it('should handle price range validation', () => {
      const config = createValidationConfig<TestFormModel>()
        .bidirectional('minPrice', 'maxPrice')
        .build();

      expect(config).toEqual({
        minPrice: ['maxPrice'],
        maxPrice: ['minPrice'],
      });
    });
  });

  describe('type safety', () => {
    it('should be type-safe at compile time', () => {
      // This test verifies that TypeScript compilation succeeds
      // The actual type checking happens at compile time

      const config = createValidationConfig<TestFormModel>()
        .whenChanged('password', 'confirmPassword')
        .bidirectional('startDate', 'endDate')
        .group(['firstName', 'lastName', 'email'])
        .whenChanged('addresses.billing.street', 'addresses.billing.city')
        .build();

      // Type assertion to verify the config matches expected type
      const _typeCheck: typeof config extends Record<string, string[]>
        ? true
        : never = true;

      expect(_typeCheck).toBe(true);
      expect(config).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle single field in group (no-op)', () => {
      const config = createValidationConfig<TestFormModel>()
        .group(['password'])
        .build();

      expect(config).toEqual({
        password: [],
      });
    });

    it('should handle repeated bidirectional calls on same fields', () => {
      const config = createValidationConfig<TestFormModel>()
        .bidirectional('password', 'confirmPassword')
        .bidirectional('password', 'confirmPassword')
        .build();

      expect(config).toEqual({
        password: ['confirmPassword'],
        confirmPassword: ['password'],
      });
    });

    it('should handle empty array in whenChanged', () => {
      const config = createValidationConfig<TestFormModel>()
        .whenChanged('password', [])
        .build();

      expect(config).toEqual({
        password: [],
      });
    });

    it('should handle chaining after build (builder remains reusable)', () => {
      const builder = createValidationConfig<TestFormModel>().whenChanged(
        'password',
        'confirmPassword'
      );

      const config1 = builder.build();

      // Continue using builder
      const config2 = builder.whenChanged('email', 'firstName').build();

      expect(config1).toEqual({
        password: ['confirmPassword'],
      });

      expect(config2).toEqual({
        password: ['confirmPassword'],
        email: ['firstName'],
      });
    });
  });

  describe('createValidationConfig factory', () => {
    it('should return a new builder instance', () => {
      const builder = createValidationConfig<TestFormModel>();

      expect(builder).toBeInstanceOf(ValidationConfigBuilder);
    });

    it('should create independent builder instances', () => {
      const builder1 = createValidationConfig<TestFormModel>().whenChanged(
        'password',
        'confirmPassword'
      );

      const builder2 = createValidationConfig<TestFormModel>().whenChanged(
        'email',
        'firstName'
      );

      const config1 = builder1.build();
      const config2 = builder2.build();

      expect(config1).toEqual({
        password: ['confirmPassword'],
      });

      expect(config2).toEqual({
        email: ['firstName'],
      });
    });
  });
});
