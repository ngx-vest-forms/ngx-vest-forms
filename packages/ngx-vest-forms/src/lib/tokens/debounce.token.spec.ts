import { TestBed } from '@angular/core/testing';
import {
  NGX_VALIDATION_CONFIG_DEBOUNCE_DEFAULT,
  NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN,
  NGX_VALIDATION_DEBOUNCE_PRESETS,
} from 'ngx-vest-forms';
import { describe, expect, it } from 'vitest';

describe('NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN', () => {
  it('uses the documented default preset when there is no override', () => {
    expect(NGX_VALIDATION_CONFIG_DEBOUNCE_DEFAULT).toBe(
      NGX_VALIDATION_DEBOUNCE_PRESETS.default
    );
    expect(TestBed.inject(NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN)).toBe(
      NGX_VALIDATION_DEBOUNCE_PRESETS.default
    );
  });
});
