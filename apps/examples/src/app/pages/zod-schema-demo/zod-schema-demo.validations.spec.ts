import { beforeEach, describe, expect, it } from 'vitest';
import type { ZodSchemaDemoModel } from './zod-schema-demo.model';
import { zodSchemaDemoSuite } from './zod-schema-demo.validations';

const validModel: ZodSchemaDemoModel = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  age: 36,
  address: { street: '1 Main St', city: 'London', zipCode: '12345' },
};

describe('Zod Schema Demo Validations', () => {
  beforeEach(() => {
    zodSchemaDemoSuite.reset();
  });

  it('accepts a complete model', () => {
    const result = zodSchemaDemoSuite.run(validModel);

    expect(result.isValid()).toBe(true);
  });

  it('requires first and last name', () => {
    const result = zodSchemaDemoSuite.run({
      ...validModel,
      firstName: '',
      lastName: '',
    });

    expect(result.getErrors('firstName')).toContain('First name is required');
    expect(result.getErrors('lastName')).toContain('Last name is required');
  });

  describe('email', () => {
    it('is required', () => {
      const result = zodSchemaDemoSuite.run({ ...validModel, email: '' });

      expect(result.getErrors('email')).toContain('Email is required');
    });

    it('must be well formed', () => {
      const result = zodSchemaDemoSuite.run({ ...validModel, email: 'ada@' });

      expect(result.getErrors('email')).toEqual([
        'Must be a valid email address',
      ]);
    });
  });

  describe('age', () => {
    it('is required', () => {
      const result = zodSchemaDemoSuite.run({ ...validModel, age: undefined });

      expect(result.getErrors('age')).toContain('Age is required');
    });

    it.each([18, 120])('accepts the boundary age %i', (age) => {
      const result = zodSchemaDemoSuite.run({ ...validModel, age });

      expect(result.hasErrors('age')).toBe(false);
    });

    it('rejects an age under 18', () => {
      const result = zodSchemaDemoSuite.run({ ...validModel, age: 17 });

      expect(result.getErrors('age')).toEqual(['Must be at least 18']);
    });

    it('rejects an age over 120', () => {
      const result = zodSchemaDemoSuite.run({ ...validModel, age: 121 });

      expect(result.getErrors('age')).toEqual(['Must be at most 120']);
    });
  });

  describe('nested address', () => {
    it('requires street, city and ZIP code on their dotted paths', () => {
      const result = zodSchemaDemoSuite.run({ ...validModel, address: {} });

      expect(result.getErrors('address.street')).toContain(
        'Street is required'
      );
      expect(result.getErrors('address.city')).toContain('City is required');
      expect(result.getErrors('address.zipCode')).toContain(
        'ZIP code is required'
      );
    });

    it('treats a missing address object like empty fields', () => {
      const result = zodSchemaDemoSuite.run({
        ...validModel,
        address: undefined,
      });

      expect(result.hasErrors('address.street')).toBe(true);
      expect(result.getErrors('address.city')).toContain('City is required');
    });

    it.each(['123', '1234567', 'abcde'])(
      'rejects the ZIP code %j',
      (zipCode) => {
        const result = zodSchemaDemoSuite.run({
          ...validModel,
          address: { ...validModel.address, zipCode },
        });

        expect(result.getErrors('address.zipCode')).toContain(
          'ZIP code must be 4-6 digits'
        );
      }
    );

    it.each(['1234', '123456'])('accepts the ZIP code %j', (zipCode) => {
      const result = zodSchemaDemoSuite.run({
        ...validModel,
        address: { ...validModel.address, zipCode },
      });

      expect(result.hasErrors('address.zipCode')).toBe(false);
    });
  });

  it('leaves other fields untested in a focused run', () => {
    const result = zodSchemaDemoSuite.only('address.city').run({});

    expect(result.getErrors('address.city')).toContain('City is required');
    expect(result.isTested('firstName')).toBe(false);
    expect(result.isTested('address.street')).toBe(false);
  });
});
