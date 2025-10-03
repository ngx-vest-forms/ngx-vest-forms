/**
 * Unit tests for signal utility helpers
 */

import { signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';
import { unwrapSignal } from './type-helpers';

describe('unwrapSignal', () => {
  it('returns primitive values unchanged', () => {
    expect(unwrapSignal('on-touch')).toBe('on-touch');
    expect(unwrapSignal(42)).toBe(42);
  });

  it('unwraps signal values', () => {
    const strategy = signal('immediate');
    expect(unwrapSignal(strategy)).toBe('immediate');
  });

  it('does not invoke arbitrary functions', () => {
    const callback = vi.fn(() => 'manual');
    const value = unwrapSignal(callback);

    expect(callback).not.toHaveBeenCalled();
    expect(value).toBe(callback);
  });
});
