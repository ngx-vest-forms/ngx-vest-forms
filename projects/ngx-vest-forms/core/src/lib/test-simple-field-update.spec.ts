/**
 * Simple test to verify field updates work correctly
 */

import { signal } from '@angular/core';
import { enforce, test } from 'vest';
import { describe, expect, it } from 'vitest';
import { createVestForm } from './create-vest-form';
import { createSafeSuite } from './utils/safe-suite';

describe('Simple Field Update Test', () => {
  it('should update field value and validation synchronously', () => {
    // Create a simple validation suite
    const suite = createSafeSuite<{ agree: boolean }>((data) => {
      test('agree', 'Must agree', () => {
        enforce(data.agree).isTruthy();
      });
    });

    // Create form
    const form = createVestForm(signal({ agree: false }), { suite });

    // Initial state: invalid
    console.log('Initial state:');
    console.log('  - model:', form.model());
    console.log('  - has errors:', form.errors());
    console.log('  - valid:', form.valid());

    expect(form.model().agree).toBe(false);
    expect(form.valid()).toBe(false);
    expect(form.errors()).toHaveProperty('agree');

    // Update field
    form.field('agree').set(true);

    // After update: should be valid
    console.log('\nAfter setting agree=true:');
    console.log('  - model:', form.model());
    console.log('  - has errors:', form.errors());
    console.log('  - valid:', form.valid());

    expect(form.model().agree).toBe(true);
    expect(form.valid()).toBe(true);
    expect(form.errors()).toEqual({});
  });
});
