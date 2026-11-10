import { beforeEach, describe, expect, it } from 'vitest';
import { displayModesDemoSuite } from './display-modes-demo.validations';

const errorFields = [
  'tokenDefaultError',
  'alwaysError',
  'dirtyError',
  'submitError',
] as const;

const warningFields = [
  'tokenDefaultWarning',
  'alwaysWarning',
  'dirtyWarning',
  'touchWarning',
] as const;

describe('Display Modes Demo Validations', () => {
  beforeEach(() => {
    displayModesDemoSuite.reset();
  });

  it.each(errorFields)(
    '%s is a required field that blocks the form',
    (field) => {
      const empty = displayModesDemoSuite.only(field).run({});
      expect(empty.getErrors(field)).toEqual(['This field is required']);
      expect(empty.isValid()).toBe(false);

      displayModesDemoSuite.reset();
      const filled = displayModesDemoSuite.only(field).run({ [field]: 'x' });
      expect(filled.hasErrors(field)).toBe(false);
    }
  );

  it.each(warningFields)(
    '%s only warns about values under 5 characters',
    (field) => {
      const short = displayModesDemoSuite.only(field).run({ [field]: 'abcd' });
      expect(short.getWarnings(field)).toEqual([
        'Username should be at least 5 characters',
      ]);
      expect(short.hasErrors(field)).toBe(false);

      displayModesDemoSuite.reset();
      const long = displayModesDemoSuite.only(field).run({ [field]: 'abcde' });
      expect(long.hasWarnings(field)).toBe(false);
    }
  );

  it('keeps the form valid when only the warning fields are short', () => {
    const model = {
      tokenDefaultError: 'x',
      alwaysError: 'x',
      dirtyError: 'x',
      submitError: 'x',
      tokenDefaultWarning: 'a',
      alwaysWarning: 'a',
      dirtyWarning: 'a',
      touchWarning: 'a',
    };
    const result = displayModesDemoSuite.run(model);

    expect(result.isValid()).toBe(true);
    expect(result.hasWarnings()).toBe(true);
  });

  it('leaves other fields untested in a focused run', () => {
    const result = displayModesDemoSuite.only('alwaysError').run({});

    expect(result.getErrors('alwaysError')).toEqual(['This field is required']);
    expect(result.isTested('dirtyError')).toBe(false);
    expect(result.hasErrors('dirtyError')).toBe(false);
  });
});
