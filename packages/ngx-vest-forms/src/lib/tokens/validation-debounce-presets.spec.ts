import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  NGX_VALIDATION_DEBOUNCE_PRESETS,
  type NgxValidationDebouncePreset,
} from './validation-debounce-presets';

describe('NGX_VALIDATION_DEBOUNCE_PRESETS', () => {
  it('should lock the public default preset values', () => {
    expect(NGX_VALIDATION_DEBOUNCE_PRESETS).toEqual({
      immediate: 0,
      fast: 100,
      default: 100,
      relaxed: 150,
      typing: 300,
      async: 500,
    });
  });

  it('should expose exactly the documented preset keys', () => {
    expect(Object.keys(NGX_VALIDATION_DEBOUNCE_PRESETS).sort()).toEqual(
      ['async', 'default', 'fast', 'immediate', 'relaxed', 'typing'].sort()
    );
  });

  it('should keep default aligned with fast (100ms)', () => {
    expect(NGX_VALIDATION_DEBOUNCE_PRESETS.default).toBe(
      NGX_VALIDATION_DEBOUNCE_PRESETS.fast
    );
  });

  it('should keep presets in non-decreasing order from immediate to async', () => {
    const ordered = [
      NGX_VALIDATION_DEBOUNCE_PRESETS.immediate,
      NGX_VALIDATION_DEBOUNCE_PRESETS.fast,
      NGX_VALIDATION_DEBOUNCE_PRESETS.relaxed,
      NGX_VALIDATION_DEBOUNCE_PRESETS.typing,
      NGX_VALIDATION_DEBOUNCE_PRESETS.async,
    ];

    const sorted = [...ordered].sort((a, b) => a - b);
    expect(ordered).toEqual(sorted);
  });

  it('should expose all preset values as numbers', () => {
    for (const value of Object.values(NGX_VALIDATION_DEBOUNCE_PRESETS)) {
      expect(typeof value).toBe('number');
    }
  });

  it('should type NgxValidationDebouncePreset as the union of preset keys', () => {
    expectTypeOf<NgxValidationDebouncePreset>().toEqualTypeOf<
      'immediate' | 'fast' | 'default' | 'relaxed' | 'typing' | 'async'
    >();

    // Runtime anchor so the type assertion also carries a recognized
    // runtime assertion: the union must match the actual preset keys.
    expect(Object.keys(NGX_VALIDATION_DEBOUNCE_PRESETS).sort()).toEqual(
      ['async', 'default', 'fast', 'immediate', 'relaxed', 'typing'].sort()
    );
  });
});
