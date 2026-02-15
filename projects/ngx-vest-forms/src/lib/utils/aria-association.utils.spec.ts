import {
  mergeAriaDescribedBy,
  parseAriaIdTokens,
  resolveAssociationTargets,
} from './aria-association.utils';

describe('parseAriaIdTokens', () => {
  it('returns empty array for null', () => {
    expect(parseAriaIdTokens(null)).toEqual([]);
  });

  it('returns empty array for blank string', () => {
    expect(parseAriaIdTokens('   ')).toEqual([]);
  });

  it('splits space-separated ids', () => {
    expect(parseAriaIdTokens('hint-id error-id warning-id')).toEqual([
      'hint-id',
      'error-id',
      'warning-id',
    ]);
  });

  it('normalizes tabs/newlines and trims tokens', () => {
    expect(parseAriaIdTokens('  hint-id\n\terror-id   warning-id  ')).toEqual([
      'hint-id',
      'error-id',
      'warning-id',
    ]);
  });
});

describe('mergeAriaDescribedBy', () => {
  it('appends active ids when no existing value is present', () => {
    expect(
      mergeAriaDescribedBy(
        null,
        ['field-error', 'field-warning'],
        ['field-error', 'field-warning']
      )
    ).toBe('field-error field-warning');
  });

  it('preserves non-owned existing ids while removing stale owned ids', () => {
    const result = mergeAriaDescribedBy(
      'help-id field-error custom-id field-warning',
      ['field-error'],
      ['field-error', 'field-warning']
    );

    expect(result).toBe('help-id custom-id field-error');
  });

  it('does not duplicate ids when an active id already exists as non-owned', () => {
    const result = mergeAriaDescribedBy(
      'help-id custom-id',
      ['custom-id', 'field-error'],
      ['field-error', 'field-warning']
    );

    expect(result).toBe('help-id custom-id field-error');
  });

  it('returns null when nothing should remain associated', () => {
    const result = mergeAriaDescribedBy(
      'field-error field-warning',
      [],
      ['field-error', 'field-warning']
    );

    expect(result).toBeNull();
  });
});

describe('resolveAssociationTargets', () => {
  it('returns all controls in all-controls mode', () => {
    const controls = [
      document.createElement('input'),
      document.createElement('textarea'),
    ];

    expect(resolveAssociationTargets(controls, 'all-controls')).toEqual(
      controls
    );
  });

  it('returns the single control in single-control mode when exactly one exists', () => {
    const controls = [document.createElement('input')];

    expect(resolveAssociationTargets(controls, 'single-control')).toEqual(
      controls
    );
  });

  it('returns empty array in single-control mode when multiple controls exist', () => {
    const controls = [
      document.createElement('input'),
      document.createElement('select'),
    ];

    expect(resolveAssociationTargets(controls, 'single-control')).toEqual([]);
  });

  it('returns empty array in none mode', () => {
    const controls = [
      document.createElement('input'),
      document.createElement('select'),
    ];

    expect(resolveAssociationTargets(controls, 'none')).toEqual([]);
  });
});
