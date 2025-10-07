/**
 * Form Array Validity Bug - Unit Tests
 *
 * ## The Bug
 * Forms with array items were showing as invalid (valid: false) even when
 * errors() returned an empty object. This caused UX issues where forms
 * appeared broken despite having no validation errors.
 *
 * ## Root Cause
 * The bug had TWO separate issues:
 *
 * ### Issue 1: Array Validity Check (form-arrays.ts line 50)
 * - Original: Used `currentResult.isValid(itemPath)` to check array item validity
 * - Problem: `isValid()` returns false for UNTESTED fields, not just invalid ones
 * - Fix: Changed to `!currentResult.hasErrors(itemPath)` to check for actual errors
 *
 * ### Issue 2: Partial Validation with only() (form-arrays.ts line 79, create-vest-form.ts line 243)
 * - Original: Called `triggerValidation(path)` which uses Vest's `only(path)` to filter tests
 * - Problem: Vest's `only('interests')` only runs tests for the EXACT field name 'interests',
 *   NOT nested paths like 'interests.0', 'interests.1', etc.
 * - Result: Array item tests never ran, so items stayed untested, causing isValid() to return false
 * - Fix: Changed to `triggerValidation()` (no parameter) to validate the entire form
 *
 * ## The Fix
 * Applied in 3 locations:
 * 1. form-arrays.ts line 50: `valid` computed (array validity check)
 * 2. form-arrays.ts line 79: `updateArray()` method (array mutations)
 * 3. create-vest-form.ts line 243: `field.set()` method (field updates)
 *
 * ## Why This Matters
 * - ✅ Form arrays now correctly show as valid when they have no errors
 * - ✅ Adding/removing array items triggers full validation
 * - ✅ Updating array items via .at(index).set() triggers full validation
 * - ✅ Cross-field validations work correctly with array items
 * - ✅ Better UX: users see accurate validation state
 *
 * ## Vest.js Behavior Reference
 * ```typescript
 * // When using only(), Vest ONLY runs tests for exact field name match:
 * only('items');
 * test('items', ...);      // ✅ Runs
 * test('items.0', ...);    // ❌ Does NOT run (not an exact match)
 * test('items.1', ...);    // ❌ Does NOT run
 *
 * // Without only(), all tests run:
 * // (no only() call)
 * test('items', ...);      // ✅ Runs
 * test('items.0', ...);    // ✅ Runs
 * test('items.1', ...);    // ✅ Runs
 * ```
 *
 * @see https://github.com/ngx-vest-forms/ngx-vest-forms/blob/main/docs/bug-fixes/only-field-validation-bug.md
 */

import { signal } from '@angular/core';
import { enforce, test } from 'vest';
import { describe, expect, it } from 'vitest';
import { createVestForm } from './create-vest-form';
import { staticSafeSuite } from './utils/safe-suite';

describe('Form Array Validity Bug', () => {
  type FormWithArray = {
    interests: string[];
  };

  // Validation suite that validates array items
  const validationSuite = staticSafeSuite<FormWithArray>(
    (model: Partial<FormWithArray> = {}) => {
      const interests = model.interests ?? [];

      // Always run at least one test (prevents "no tests = invalid" issue)
      test('interests', 'Interests array is valid', () => {
        enforce(interests).isArray();
      });

      // Validate each item
      for (const [index, interest] of interests.entries()) {
        const path = `interests.${index}`;

        test(path, 'Interest cannot be empty', () => {
          enforce(interest).isNotEmpty();
        });

        test(path, 'Interest must be at least 2 characters', () => {
          enforce(interest).longerThan(1);
        });
      }
    },
  );

  it('BUG: empty array should result in valid form', () => {
    // Arrange
    const form = createVestForm(
      validationSuite,
      signal<FormWithArray>({ interests: [] }),
    );

    // Act - form is initialized with empty array

    // Assert
    expect(form.errors()).toEqual({}); // ✅ Passes - no errors
    expect(form.valid()).toBe(true); // ❌ FAILS - form shows as invalid!
  });

  it('BUG: array with one valid item should result in valid form', () => {
    // Arrange
    const form = createVestForm(
      validationSuite,
      signal<FormWithArray>({ interests: [] }),
    );
    const interestsArray = form.array('interests');

    // Act - add valid item
    interestsArray.push('Reading'); // 7 characters, passes all validations

    // Assert
    expect(form.errors()).toEqual({}); // ✅ Passes - no errors
    expect(form.valid()).toBe(true); // ❌ FAILS - form shows as invalid!
  });

  it('BUG: array with multiple valid items should result in valid form', () => {
    // Arrange
    const form = createVestForm(
      validationSuite,
      signal<FormWithArray>({ interests: [] }),
    );
    const interestsArray = form.array('interests');

    // Act - add multiple valid items
    const items = ['Reading', 'Programming', 'Gaming'];
    for (const item of items) {
      interestsArray.push(item);
    }

    // Assert
    expect(form.errors()).toEqual({}); // ✅ Passes - no errors
    expect(form.valid()).toBe(true); // ❌ FAILS - form shows as invalid!
  });

  it('WORKING: array with invalid items should result in invalid form', () => {
    // Arrange
    const form = createVestForm(
      validationSuite,
      signal<FormWithArray>({ interests: [] }),
    );
    const interestsArray = form.array('interests');

    // Act - add invalid item (too short)
    interestsArray.push('A'); // 1 character, fails "longerThan(1)" validation

    // Assert
    expect(form.errors()).toMatchObject({
      'interests.0': expect.arrayContaining([
        expect.stringContaining('at least 2 characters'),
      ]),
    }); // ✅ Passes - errors present
    expect(form.valid()).toBe(false); // ✅ Passes - correctly shows invalid
  });

  it('✅ FIXED: array validity should update after fixing invalid items', () => {
    // Arrange
    const form = createVestForm(
      validationSuite,
      signal<FormWithArray>({ interests: [] }),
    );
    const interestsArray = form.array('interests');
    interestsArray.push('A'); // Invalid

    // Act - fix the invalid item
    interestsArray.at(0).set('Reading'); // Now valid

    // Assert
    expect(form.errors()).toEqual({}); // ✅ Passes - no errors after fix
    expect(form.valid()).toBe(true); // ✅ NOW PASSES - form is valid after fix!
  });

  it('✅ FIXED: check raw validation result for empty array', () => {
    // Arrange
    const form = createVestForm(
      validationSuite,
      signal<FormWithArray>({ interests: [] }),
    );

    // Act - get raw validation state
    const errors = form.errors();
    const valid = form.valid();
    const pending = form.pending();

    // Debug output
    console.log('Empty array form state:', {
      errors,
      valid,
      pending,
      // @ts-expect-error - accessing internal state for debugging
      _internalResult: form._validationResult$?.(),
    });

    // Now working correctly!
    expect(errors).toEqual({});
    expect(valid).toBe(true); // ✅ NOW PASSES - empty array is valid!
  });

  it('✅ FIXED: check raw validation result after adding valid item', () => {
    // Arrange
    const form = createVestForm(
      validationSuite,
      signal<FormWithArray>({ interests: [] }),
    );
    const interestsArray = form.array('interests');

    // Act
    interestsArray.push('Reading');

    // Debug output
    const errors = form.errors();
    const valid = form.valid();

    console.log('After adding valid item:', {
      errors,
      valid,
      modelValue: form.model(),
      // @ts-expect-error - accessing internal state for debugging
      _internalResult: form._validationResult$?.(),
    });

    // Now working correctly!
    expect(errors).toEqual({});
    expect(valid).toBe(true); // ✅ NOW PASSES - form is valid after adding item!
  });
});
