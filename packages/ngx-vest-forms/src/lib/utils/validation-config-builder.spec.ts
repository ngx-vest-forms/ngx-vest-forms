import {
  createValidationConfig,
  type NgxDeepPartial,
  type ValidationConfigMap,
} from 'ngx-vest-forms';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
} from 'vitest';

type TestFormModel = NgxDeepPartial<{
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
  describe('indexed array paths', () => {
    type ListModel = NgxDeepPartial<{
      title: string;
      contacts: Array<{ email: string; confirmEmail: string }>;
    }>;

    it('should accept runtime array indices in every method', () => {
      const index = 1;
      const config = createValidationConfig<ListModel>()
        .whenChanged('contacts.0.email', 'contacts.0.confirmEmail')
        .bidirectional(
          `contacts.${index}.email`,
          `contacts.${index}.confirmEmail`
        )
        .group(['title', 'contacts.2.email'])
        .build();

      expect(config).toEqual({
        'contacts.0.email': ['contacts.0.confirmEmail'],
        'contacts.1.email': ['contacts.1.confirmEmail'],
        'contacts.1.confirmEmail': ['contacts.1.email'],
        title: ['contacts.2.email'],
        'contacts.2.email': ['title'],
      });
    });

    it('rejects an unknown Trigger Field below an index', () => {
      type Builder = ReturnType<typeof createValidationConfig<ListModel>>;
      type Trigger = Parameters<Builder['whenChanged']>[0];

      expectTypeOf<'contacts.0.phone'>().not.toExtend<Trigger>();
    });
  });

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

    it('should work with nested field paths', () => {
      const config = createValidationConfig<TestFormModel>()
        .whenChanged('addresses.billing.street', 'addresses.billing.city')
        .build();

      expect(config).toEqual({
        'addresses.billing.street': ['addresses.billing.city'],
      });
    });

    describe('duplicate detection warnings', () => {
      let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

      beforeEach(() => {
        vi.stubGlobal('ngDevMode', true);
        consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      });

      afterEach(() => {
        consoleWarnSpy.mockRestore();
        vi.unstubAllGlobals();
      });

      it('reports duplicate Dependent Fields and keeps one entry per field', () => {
        const config = createValidationConfig<TestFormModel>()
          .whenChanged('password', ['confirmPassword', 'email', 'firstName'])
          .whenChanged('password', ['email', 'firstName', 'lastName'])
          .build();

        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('[NGX-110]')
        );
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringMatching(
            /Duplicate dependencies detected\.[\s\S]*Trigger: 'password'[\s\S]*Duplicates: 'email', 'firstName'/
          )
        );
        expect(config).toEqual({
          password: ['confirmPassword', 'email', 'firstName', 'lastName'],
        });
      });

      it('should not warn when adding unique dependents', () => {
        createValidationConfig<TestFormModel>()
          .whenChanged('password', ['confirmPassword'])
          .whenChanged('password', ['email']) // No duplicates
          .build();

        expect(consoleWarnSpy).not.toHaveBeenCalled();
      });

      it('should not warn in production mode', () => {
        vi.stubGlobal('ngDevMode', false);

        createValidationConfig<TestFormModel>()
          .whenChanged('password', ['confirmPassword', 'email'])
          .whenChanged('password', ['email', 'firstName']) // Duplicate
          .build();

        expect(consoleWarnSpy).not.toHaveBeenCalled();
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
      let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

      beforeEach(() => {
        vi.stubGlobal('ngDevMode', true);
        consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      });

      afterEach(() => {
        consoleWarnSpy.mockRestore();
        vi.unstubAllGlobals();
      });

      it.each([
        ['password', 'confirmPassword'],
        ['confirmPassword', 'password'],
      ] as const)(
        'reports a duplicate pair entered as %s and %s',
        (first, second) => {
          const config = createValidationConfig<TestFormModel>()
            .bidirectional('password', 'confirmPassword')
            .bidirectional(first, second)
            .build();

          expect(consoleWarnSpy).toHaveBeenCalledWith(
            expect.stringContaining('[NGX-111]')
          );
          expect(consoleWarnSpy).toHaveBeenCalledWith(
            expect.stringContaining(
              'Duplicate bidirectional relationship detected'
            )
          );
          expect(consoleWarnSpy).toHaveBeenCalledWith(
            expect.stringContaining(`Fields: '${first}' ↔ '${second}'`)
          );
          expect(config).toEqual({
            password: ['confirmPassword'],
            confirmPassword: ['password'],
          });
        }
      );

      it('should not warn when adding different bidirectional relationships', () => {
        createValidationConfig<TestFormModel>()
          .bidirectional('password', 'confirmPassword')
          .bidirectional('startDate', 'endDate') // Different fields
          .build();

        expect(consoleWarnSpy).not.toHaveBeenCalled();
      });

      it('should not warn in production mode', () => {
        vi.stubGlobal('ngDevMode', false);

        createValidationConfig<TestFormModel>()
          .bidirectional('password', 'confirmPassword')
          .bidirectional('password', 'confirmPassword') // Duplicate
          .build();

        expect(consoleWarnSpy).not.toHaveBeenCalled();
      });

      it('should not warn when bidirectional is combined with whenChanged for same fields', () => {
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

    it('merges and deduplicates Dependent Fields for the same Trigger Field', () => {
      const existingConfig: ValidationConfigMap<TestFormModel> = {
        password: ['email', 'confirmPassword'],
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

    it('should not allow external mutations to affect builder', () => {
      const builder = createValidationConfig<TestFormModel>().whenChanged(
        'password',
        'confirmPassword'
      );

      const config1 = builder.build();
      config1.password?.push('email');
      expect(config1.password).toEqual(['confirmPassword', 'email']);

      const config2 = builder.build();

      expect(config2).toEqual({
        password: ['confirmPassword'],
      });
    });
  });

  describe('edge cases', () => {
    it('keeps a single Trigger Field with no Dependent Fields', () => {
      const config = createValidationConfig<TestFormModel>()
        .group(['password'])
        .build();

      expect(config).toEqual({
        password: [],
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
