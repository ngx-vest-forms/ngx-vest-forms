/**
 * Minimal test to understand Vest's only() behavior with stateful suites
 */
import { create, enforce, only, test } from 'vest';
import { describe, expect, it } from 'vitest';

describe('Vest only() behavior', () => {
  it('should understand how only() works with create() suite', () => {
    type TestModel = { name: string; email: string };

    const results: unknown[] = [];

    // Create stateful suite
    const suite = create(
      (data: TestModel = { name: '', email: '' }, field?: string) => {
        only(field); // Should ignore when field is undefined

        test('name', 'Name is required', () => {
          enforce(data.name).isNotEmpty();
        });

        test('email', 'Email is required', () => {
          enforce(data.email).isNotEmpty();
        });
      },
    );

    // Subscribe to changes
    suite.subscribe((result) => {
      console.log('Subscription received:', result);
      results.push(result);
    });

    // Test 1: Run without field parameter (should validate all)
    console.log('--- Test 1: No field parameter ---');
    const result1 = suite({ name: '', email: '' });
    console.log('Result 1 isValid:', result1?.isValid?.());
    console.log('Result 1 hasErrors:', result1?.hasErrors?.());

    // Test 2: Run with field='name' (should validate only name)
    console.log('--- Test 2: Field=name ---');
    const result2 = suite({ name: '', email: '' }, 'name');
    console.log('Result 2 isValid:', result2?.isValid?.());
    console.log('Result 2 hasErrors:', result2?.hasErrors?.());

    // Test 3: Run with field='email' (should validate only email)
    console.log('--- Test 3: Field=email ---');
    const result3 = suite({ name: '', email: '' }, 'email');
    console.log('Result 3 isValid:', result3?.isValid?.());
    console.log('Result 3 hasErrors:', result3?.hasErrors?.());

    console.log('Total subscription calls:', results.length);
    console.log(
      'Subscription results:',
      results.map((r: any) => (r ? 'defined' : 'undefined')),
    );

    // Basic assertions
    expect(result1).toBeDefined();
    expect(result2).toBeDefined();
    expect(result3).toBeDefined();
    expect(results.length).toBeGreaterThan(0);
  });
});
