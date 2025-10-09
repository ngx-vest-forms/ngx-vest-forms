/**
 * Minimal test to debug submit() hanging issue
 */
import { signal } from '@angular/core';
import { enforce, test } from 'vest';
import { describe, expect, it } from 'vitest';
import { createVestForm } from './create-vest-form';
import { staticSafeSuite } from './utils/safe-suite';

const testSuite = staticSafeSuite((data: { email?: string } = {}) => {
  test('email', 'Email is required', () => {
    enforce(data.email).isNotEmpty();
  });
});

describe('Submit Hang Debug', () => {
  it('should complete submit() without hanging', async () => {
    const form = createVestForm(signal({ email: '' }), {
      suite: testSuite,
    });

    console.log('Before submit');
    const result = await form.submit();
    console.log('After submit:', result);

    expect(result.valid).toBe(false);
    expect(result.errors.email).toBeDefined();
  });

  it('should complete submit() with valid data', async () => {
    const form = createVestForm(signal({ email: 'test@example.com' }), {
      suite: testSuite,
    });

    console.log('Before submit (valid)');
    const result = await form.submit();
    console.log('After submit (valid):', result);

    expect(result.valid).toBe(true);
  });
});
