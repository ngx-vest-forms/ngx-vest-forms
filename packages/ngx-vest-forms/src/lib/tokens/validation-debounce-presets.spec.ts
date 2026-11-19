import {
  NGX_VALIDATION_DEBOUNCE_PRESETS,
  type NgxValidationDebouncePreset,
} from 'ngx-vest-forms';
import { describe, expect, expectTypeOf, it } from 'vitest';

describe('NGX_VALIDATION_DEBOUNCE_PRESETS', () => {
  it('exports the documented delays in milliseconds', () => {
    expect(NGX_VALIDATION_DEBOUNCE_PRESETS).toEqual({
      immediate: 0,
      fast: 100,
      default: 100,
      relaxed: 150,
      typing: 300,
      async: 500,
    });
  });

  it('exports a type that accepts each preset name', () => {
    expectTypeOf<NgxValidationDebouncePreset>().toEqualTypeOf<
      keyof typeof NGX_VALIDATION_DEBOUNCE_PRESETS
    >();
  });
});
