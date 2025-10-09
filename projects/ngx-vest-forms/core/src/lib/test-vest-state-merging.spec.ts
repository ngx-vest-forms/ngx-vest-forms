/**
 * Test Vest's state merging behavior with only()
 *
 * Purpose: Verify whether suite(data, 'field') returns fully merged state
 * or just the validated field's state.
 */

import { create, enforce, test } from 'vest';
import { describe, expect, it } from 'vitest';

describe('Vest State Merging with only()', () => {
  it('should return merged state from all previous validations', () => {
    // Create a stateful suite (using create, not staticSuite)
    const suite = create(
      (data: { name: string; email: string; age: number }, field?: string) => {
        if (field) {
          // Use the Vest pattern: always call only(), pass conditional value
          // When field is undefined, Vest runs all tests
          // When field is a string, Vest runs only that field's tests
          // MUST NOT use: if (field) { only(field); } - violates Vest's execution consistency
          const { only } = suite;
          only(field);
        }

        test('name', 'Name is required', () => {
          enforce(data.name).isNotEmpty();
        });

        test('email', 'Email is required', () => {
          enforce(data.email).isNotEmpty();
        });

        test('age', 'Age must be 18 or older', () => {
          enforce(data.age).greaterThanOrEquals(18);
        });
      },
    );

    // Step 1: Validate name field (has error - empty string)
    const result1 = suite({ name: '', email: '', age: 0 }, 'name');
    console.log('After validating name:');
    console.log('  - result1.hasErrors("name"):', result1.hasErrors('name'));
    console.log('  - result1.hasErrors("email"):', result1.hasErrors('email'));
    console.log('  - result1.hasErrors("age"):', result1.hasErrors('age'));
    console.log('  - result1.isTested("name"):', result1.isTested('name'));
    console.log('  - result1.isTested("email"):', result1.isTested('email'));
    console.log('  - result1.isTested("age"):', result1.isTested('age'));

    // Step 2: Validate email field (now valid)
    const result2 = suite(
      { name: '', email: 'test@example.com', age: 0 },
      'email',
    );
    console.log('\nAfter validating email:');
    console.log('  - result2.hasErrors("name"):', result2.hasErrors('name'));
    console.log('  - result2.hasErrors("email"):', result2.hasErrors('email'));
    console.log('  - result2.hasErrors("age"):', result2.hasErrors('age'));
    console.log('  - result2.isTested("name"):', result2.isTested('name'));
    console.log('  - result2.isTested("email"):', result2.isTested('email'));
    console.log('  - result2.isTested("age"):', result2.isTested('age'));

    // Step 3: Validate age field (now valid)
    const result3 = suite(
      { name: '', email: 'test@example.com', age: 21 },
      'age',
    );
    console.log('\nAfter validating age:');
    console.log('  - result3.hasErrors("name"):', result3.hasErrors('name'));
    console.log('  - result3.hasErrors("email"):', result3.hasErrors('email'));
    console.log('  - result3.hasErrors("age"):', result3.hasErrors('age'));
    console.log('  - result3.isTested("name"):', result3.isTested('name'));
    console.log('  - result3.isTested("email"):', result3.isTested('email'));
    console.log('  - result3.isTested("age"):', result3.isTested('age'));

    // The critical question: Does result3 show name has errors?
    // If YES: Vest merges state across only() calls
    // If NO: Each only() call returns isolated state
    console.log('\n=== CRITICAL TEST ===');
    console.log('Does result3 (after age validation) show name errors?');
    console.log('result3.hasErrors("name"):', result3.hasErrors('name'));
    console.log('result3.getErrors("name"):', result3.getErrors('name'));

    // Verify: Result should contain errors from PREVIOUS validations
    expect(result3.hasErrors('name')).toBe(true); // Name was validated in step 1
    expect(result3.hasErrors('email')).toBe(false); // Email was valid in step 2
    expect(result3.hasErrors('age')).toBe(false); // Age is valid now
  });
});
