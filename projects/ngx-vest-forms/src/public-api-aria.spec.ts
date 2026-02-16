/**
 * Tests for ARIA association utilities exported via public API.
 * These tests verify that the utilities are properly exported and accessible.
 */
import {
  AriaAssociationMode,
  parseAriaIdTokens,
  mergeAriaDescribedBy,
  resolveAssociationTargets,
} from 'ngx-vest-forms';

describe('Public API: ARIA association utilities', () => {
  describe('parseAriaIdTokens', () => {
    it('should be exported and callable', () => {
      expect(typeof parseAriaIdTokens).toBe('function');
    });

    it('should parse aria-describedby tokens correctly', () => {
      const result = parseAriaIdTokens('id-1 id-2 id-3');
      expect(result).toEqual(['id-1', 'id-2', 'id-3']);
    });

    it('should handle null input', () => {
      const result = parseAriaIdTokens(null);
      expect(result).toEqual([]);
    });
  });

  describe('mergeAriaDescribedBy', () => {
    it('should be exported and callable', () => {
      expect(typeof mergeAriaDescribedBy).toBe('function');
    });

    it('should merge aria-describedby values correctly', () => {
      const result = mergeAriaDescribedBy(
        'existing-id',
        ['new-id'],
        ['owned-id']
      );
      expect(result).toBe('existing-id new-id');
    });

    it('should remove owned IDs before adding active IDs', () => {
      const result = mergeAriaDescribedBy(
        'existing-id owned-id',
        ['new-id'],
        ['owned-id']
      );
      expect(result).toBe('existing-id new-id');
    });
  });

  describe('resolveAssociationTargets', () => {
    it('should be exported and callable', () => {
      expect(typeof resolveAssociationTargets).toBe('function');
    });

    it('should return all controls in all-controls mode', () => {
      const controls = [
        document.createElement('input'),
        document.createElement('textarea'),
      ];
      const result = resolveAssociationTargets(controls, 'all-controls');
      expect(result.length).toBe(2);
    });

    it('should return single control in single-control mode', () => {
      const controls = [document.createElement('input')];
      const result = resolveAssociationTargets(controls, 'single-control');
      expect(result.length).toBe(1);
    });

    it('should return empty array in none mode', () => {
      const controls = [document.createElement('input')];
      const result = resolveAssociationTargets(controls, 'none');
      expect(result.length).toBe(0);
    });
  });

  describe('AriaAssociationMode type', () => {
    it('should allow valid mode values', () => {
      const modes: AriaAssociationMode[] = [
        'all-controls',
        'single-control',
        'none',
      ];
      expect(modes).toHaveLength(3);
    });
  });
});
