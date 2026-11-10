import { beforeEach, describe, expect, it } from 'vitest';
import { starterFormSuite } from './starter.validations';

const validModel = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  subject: 'Question',
  message: 'I would like to know how the analytical engine works.',
};

describe('Starter Validations', () => {
  beforeEach(() => {
    // The suite is stateful across runs; start every test clean.
    starterFormSuite.reset();
  });

  it('accepts a complete, valid contact message', () => {
    const result = starterFormSuite.run(validModel);

    expect(result.isValid()).toBe(true);
    expect(result.hasErrors()).toBe(false);
  });

  it.each(['name', 'email', 'subject', 'message'] as const)(
    'requires %s',
    (field) => {
      const result = starterFormSuite.run({ ...validModel, [field]: '   ' });

      expect(result.hasErrors(field)).toBe(true);
      expect(result.isValid()).toBe(false);
    }
  );

  it('rejects an email address without a domain', () => {
    const result = starterFormSuite.run({ ...validModel, email: 'ada@' });

    expect(result.getErrors('email')).toContain('Enter a valid email address');
  });

  it('accepts a well-formed email address', () => {
    const result = starterFormSuite.run({
      ...validModel,
      email: 'ada@example.com',
    });

    expect(result.hasErrors('email')).toBe(false);
  });

  it('reports a blank email as required, not as malformed', () => {
    const result = starterFormSuite.run({ ...validModel, email: '' });

    expect(result.getErrors('email')).toEqual(['Email is required']);
  });

  it('nudges a short message with a warning but keeps the form valid', () => {
    const result = starterFormSuite.run({ ...validModel, message: 'Hello' });

    expect(result.hasWarnings('message')).toBe(true);
    expect(result.hasErrors('message')).toBe(false);
    expect(result.isValid()).toBe(true);
  });

  it('shows no warning for a message of at least 20 characters', () => {
    const result = starterFormSuite.run({
      ...validModel,
      message: 'x'.repeat(20),
    });

    expect(result.hasWarnings('message')).toBe(false);
  });

  it('gives an empty message the required error and no length warning', () => {
    const result = starterFormSuite.run({ ...validModel, message: '' });

    expect(result.getErrors('message')).toEqual(['Message is required']);
    expect(result.hasWarnings('message')).toBe(false);
  });

  it('leaves other fields untested in a focused run', () => {
    const result = starterFormSuite.only('email').run({});

    expect(result.getErrors('email')).toEqual(['Email is required']);
    expect(result.isTested('name')).toBe(false);
    expect(result.hasErrors('name')).toBe(false);
  });
});
