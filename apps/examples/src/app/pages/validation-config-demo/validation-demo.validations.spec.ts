import { beforeEach, describe, expect, it } from 'vitest';
import { validationDemoSuite } from './validation-demo.validations';

describe('Validation Demo Validations', () => {
  beforeEach(() => {
    validationDemoSuite.reset();
  });

  describe('password and confirmation', () => {
    it('requires a password of at least 8 characters', () => {
      const empty = validationDemoSuite.only('password').run({});
      expect(empty.getErrors('password')).toContain('Password is required');

      validationDemoSuite.reset();
      const short = validationDemoSuite
        .only('password')
        .run({ password: 'short' });
      expect(short.getErrors('password')).toEqual([
        'Password must be at least 8 characters',
      ]);
    });

    it('warns, without blocking, when the password is shorter than 12', () => {
      const result = validationDemoSuite
        .only('password')
        .run({ password: 'eightchr' });

      expect(result.hasErrors('password')).toBe(false);
      expect(result.getWarnings('password')).toContain(
        'For better security, use 12+ characters'
      );
    });

    it('does not warn for a password of 12 characters or more', () => {
      const result = validationDemoSuite
        .only('password')
        .run({ password: 'twelve-chars' });

      expect(result.hasWarnings('password')).toBe(false);
    });

    it('does not ask for confirmation before a password exists', () => {
      const result = validationDemoSuite.only('confirmPassword').run({});

      expect(result.hasErrors('confirmPassword')).toBe(false);
    });

    it('asks for confirmation once a password exists', () => {
      const result = validationDemoSuite
        .only('confirmPassword')
        .run({ password: 'longenough1' });

      expect(result.getErrors('confirmPassword')).toContain(
        'Please confirm your password'
      );
    });

    it('rejects a confirmation that differs from the password', () => {
      const result = validationDemoSuite
        .only('confirmPassword')
        .run({ password: 'longenough1', confirmPassword: 'different' });

      expect(result.getErrors('confirmPassword')).toContain(
        'Passwords must match'
      );
    });

    it('accepts a matching confirmation', () => {
      const result = validationDemoSuite
        .only('confirmPassword')
        .run({ password: 'longenough1', confirmPassword: 'longenough1' });

      expect(result.hasErrors('confirmPassword')).toBe(false);
    });
  });

  describe('quantity and justification', () => {
    it('requires a justification once a quantity is given', () => {
      const result = validationDemoSuite
        .only('quantityJustification')
        .run({ quantity: '3' });

      expect(result.getErrors('quantityJustification')).toContain(
        'Justification is required when quantity is provided'
      );
    });

    it('requires a quantity once a justification is given', () => {
      const result = validationDemoSuite
        .only('quantity')
        .run({ quantityJustification: 'Event' });

      expect(result.getErrors('quantity')).toContain(
        'Quantity is required when justification is provided'
      );
    });

    it('requires neither when both are empty', () => {
      const result = validationDemoSuite.run({});

      expect(result.hasErrors('quantity')).toBe(false);
      expect(result.hasErrors('quantityJustification')).toBe(false);
    });
  });

  describe('conditional justification', () => {
    it('is not validated unless it is switched on', () => {
      const result = validationDemoSuite
        .only('justification')
        .run({ requiresJustification: false });

      expect(result.hasErrors('justification')).toBe(false);
    });

    it('is required when switched on', () => {
      const result = validationDemoSuite
        .only('justification')
        .run({ requiresJustification: true });

      expect(result.getErrors('justification')).toContain(
        'Justification is required when selected'
      );
    });

    it('needs at least 20 characters when switched on', () => {
      const short = validationDemoSuite
        .only('justification')
        .run({ requiresJustification: true, justification: 'too short' });
      expect(short.getErrors('justification')).toContain(
        'Justification must be at least 20 characters'
      );

      validationDemoSuite.reset();
      const ok = validationDemoSuite.only('justification').run({
        requiresJustification: true,
        justification: 'j'.repeat(20),
      });
      expect(ok.hasErrors('justification')).toBe(false);
    });
  });

  describe('location', () => {
    it('requires a country', () => {
      const result = validationDemoSuite.only('country').run({});

      expect(result.getErrors('country')).toContain('Country is required');
    });

    it('asks for state and postal code only after a country is chosen', () => {
      const without = validationDemoSuite.run({});
      expect(without.hasErrors('state')).toBe(false);
      expect(without.hasErrors('zipCode')).toBe(false);

      validationDemoSuite.reset();
      const withCountry = validationDemoSuite.run({ country: 'NL' });
      expect(withCountry.getErrors('state')).toContain(
        'State/Province is required'
      );
      expect(withCountry.getErrors('zipCode')).toContain(
        'Postal code is required'
      );
    });
  });

  describe('date range', () => {
    it('requires both dates', () => {
      const result = validationDemoSuite.run({});

      expect(result.getErrors('startDate')).toContain('Start date is required');
      expect(result.getErrors('endDate')).toContain('End date is required');
      expect(result.getErrors('endDate')).not.toContain(
        'End date must be after start date'
      );
    });

    it('rejects an end date on or before the start date', () => {
      const before = validationDemoSuite.run({
        startDate: '2026-03-10',
        endDate: '2026-03-01',
      });
      expect(before.getErrors('endDate')).toContain(
        'End date must be after start date'
      );

      validationDemoSuite.reset();
      const same = validationDemoSuite.run({
        startDate: '2026-03-10',
        endDate: '2026-03-10',
      });
      expect(same.getErrors('endDate')).toContain(
        'End date must be after start date'
      );
    });

    it('accepts an end date after the start date', () => {
      const result = validationDemoSuite.run({
        startDate: '2026-03-10',
        endDate: '2026-03-11',
      });

      expect(result.hasErrors('startDate')).toBe(false);
      expect(result.hasErrors('endDate')).toBe(false);
    });
  });

  it('leaves other fields untested in a focused run', () => {
    const result = validationDemoSuite.only('country').run({});

    expect(result.isTested('startDate')).toBe(false);
    expect(result.hasErrors('startDate')).toBe(false);
  });
});
