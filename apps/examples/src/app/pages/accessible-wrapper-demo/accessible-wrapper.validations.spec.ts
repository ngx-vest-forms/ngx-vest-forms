import { beforeEach, describe, expect, it } from 'vitest';
import { accessibleWrapperSuite } from './accessible-wrapper.validations';

describe('Accessible Wrapper Validations', () => {
  beforeEach(() => {
    accessibleWrapperSuite.reset();
  });

  it('accepts a preferred name and a search query', () => {
    const result = accessibleWrapperSuite.run({
      preferredName: 'Ada',
      searchQuery: 'vest',
    });

    expect(result.isValid()).toBe(true);
  });

  it('requires a preferred name and reports only that error for an empty value', () => {
    const result = accessibleWrapperSuite.run({ searchQuery: 'vest' });

    expect(result.getErrors('preferredName')).toEqual([
      'Preferred name is required',
    ]);
  });

  it('requires at least 3 characters once a preferred name is entered', () => {
    const result = accessibleWrapperSuite.run({
      preferredName: 'Al',
      searchQuery: 'vest',
    });

    expect(result.getErrors('preferredName')).toEqual([
      'Preferred name must be at least 3 characters',
    ]);
  });

  it('requires a search query', () => {
    const result = accessibleWrapperSuite.run({ preferredName: 'Ada' });

    expect(result.getErrors('searchQuery')).toContain(
      'Search query is required'
    );
  });

  it('leaves other fields untested in a focused run', () => {
    const result = accessibleWrapperSuite.only('searchQuery').run({});

    expect(result.getErrors('searchQuery')).toContain(
      'Search query is required'
    );
    expect(result.isTested('preferredName')).toBe(false);
  });
});
