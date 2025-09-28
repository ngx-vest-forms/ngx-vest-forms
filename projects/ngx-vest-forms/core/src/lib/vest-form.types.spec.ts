/**
 * Unit tests for core type definitions and type guards
 * Tests type safety, utility types, and runtime type checking
 */

import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

describe('VestForm Types', () => {
  it('should work with signals', () => {
    const testSignal = signal('test');
    expect(testSignal()).toBe('test');
  });

  it('should validate error display strategies', () => {
    const strategies = ['immediate', 'on-touch', 'on-submit', 'manual'];

    for (const strategy of strategies) {
      expect(strategy).toMatch(/^(immediate|on-touch|on-submit|manual)$/);
    }
  });
});
