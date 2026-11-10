import { beforeEach, describe, expect, it } from 'vitest';
import { submissionPatternsSuite } from './submission-patterns.validations';

const validModel = {
  fullName: 'Ada Lovelace',
  email: 'ada@example.com',
  password: 'twelve-chars!',
  acceptTerms: true,
};

describe('Submission Patterns Validations', () => {
  beforeEach(() => {
    submissionPatternsSuite.reset();
  });

  it('accepts a complete account', () => {
    const result = submissionPatternsSuite.run(validModel);

    expect(result.isValid()).toBe(true);
    expect(result.hasWarnings()).toBe(false);
  });

  it('requires a full name', () => {
    const result = submissionPatternsSuite.run({
      ...validModel,
      fullName: '',
    });

    expect(result.getErrors('fullName')).toContain('Full name is required');
  });

  describe('email', () => {
    it('is required, without a format error for an empty value', () => {
      const result = submissionPatternsSuite.run({ ...validModel, email: '' });

      expect(result.getErrors('email')).toEqual(['Email is required']);
    });

    it('must have a valid format', () => {
      const result = submissionPatternsSuite.run({
        ...validModel,
        email: 'ada@',
      });

      expect(result.getErrors('email')).toContain(
        'Enter a valid email address'
      );
    });
  });

  describe('password', () => {
    it('is required, without a length error for an empty value', () => {
      const result = submissionPatternsSuite.run({
        ...validModel,
        password: '',
      });

      expect(result.getErrors('password')).toEqual(['Password is required']);
      expect(result.hasWarnings('password')).toBe(false);
    });

    it('needs at least 8 characters', () => {
      const result = submissionPatternsSuite.run({
        ...validModel,
        password: 'short',
      });

      expect(result.getErrors('password')).toContain(
        'Password must be at least 8 characters'
      );
    });

    it('nudges an 8 to 11 character password without blocking submission', () => {
      const result = submissionPatternsSuite.run({
        ...validModel,
        password: 'eightchr',
      });

      expect(result.hasErrors('password')).toBe(false);
      expect(result.getWarnings('password')).toContain(
        'Consider using 12+ characters for a stronger password'
      );
      expect(result.isValid()).toBe(true);
    });
  });

  it.each([undefined, false])(
    'requires the terms when the value is %s',
    (accept) => {
      const result = submissionPatternsSuite.run({
        ...validModel,
        acceptTerms: accept,
      });

      expect(result.getErrors('acceptTerms')).toContain(
        'You must accept the terms'
      );
    }
  );

  it('leaves other fields untested in a focused run', () => {
    const result = submissionPatternsSuite.only('email').run({});

    expect(result.getErrors('email')).toEqual(['Email is required']);
    expect(result.isTested('password')).toBe(false);
  });
});
