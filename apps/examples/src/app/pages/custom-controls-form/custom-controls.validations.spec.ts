import { beforeEach, describe, expect, it } from 'vitest';
import { customControlsSuite } from './custom-controls.validations';

const validModel = { rating: 4, experience: 'senior', tags: ['angular'] };

describe('Custom Controls Validations', () => {
  beforeEach(() => {
    customControlsSuite.reset();
  });

  it('accepts a complete model', () => {
    const result = customControlsSuite.run(validModel);

    expect(result.isValid()).toBe(true);
  });

  describe('rating', () => {
    it.each([undefined, 0])(
      'asks for a rating when the value is %s',
      (rating) => {
        const result = customControlsSuite.run({ ...validModel, rating });

        expect(result.getErrors('rating')).toEqual(['Pick a rating']);
      }
    );

    it.each([1, 5])('accepts the boundary rating %i', (rating) => {
      const result = customControlsSuite.run({ ...validModel, rating });

      expect(result.hasErrors('rating')).toBe(false);
    });

    it('rejects a rating above 5', () => {
      const result = customControlsSuite.run({ ...validModel, rating: 6 });

      expect(result.getErrors('rating')).toContain(
        'Rating must be between 1 and 5'
      );
    });
  });

  it('requires an experience level', () => {
    const result = customControlsSuite.run({ ...validModel, experience: '' });

    expect(result.getErrors('experience')).toContain(
      'Select your experience level'
    );
  });

  describe('tags', () => {
    it('requires at least one tag', () => {
      const result = customControlsSuite.run({ ...validModel, tags: [] });

      expect(result.getErrors('tags')).toContain('Add at least one tag');
    });

    it('accepts five tags without a warning', () => {
      const result = customControlsSuite.run({
        ...validModel,
        tags: ['a', 'b', 'c', 'd', 'e'],
      });

      expect(result.hasWarnings('tags')).toBe(false);
    });

    it('warns about more than five tags but stays valid', () => {
      const result = customControlsSuite.run({
        ...validModel,
        tags: ['a', 'b', 'c', 'd', 'e', 'f'],
      });

      expect(result.hasWarnings('tags')).toBe(true);
      expect(result.hasErrors('tags')).toBe(false);
      expect(result.isValid()).toBe(true);
    });

    it('does not warn when the list is empty', () => {
      const result = customControlsSuite.run({ ...validModel, tags: [] });

      expect(result.hasWarnings('tags')).toBe(false);
    });
  });

  it('leaves other fields untested in a focused run', () => {
    const result = customControlsSuite.only('rating').run({});

    expect(result.hasErrors('rating')).toBe(true);
    expect(result.isTested('tags')).toBe(false);
  });
});
