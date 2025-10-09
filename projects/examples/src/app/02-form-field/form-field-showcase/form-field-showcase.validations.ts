import { createSafeSuite } from 'ngx-vest-forms/core';
import { enforce, test } from 'vest';

/**
 * Form model for the form-field showcase example.
 *
 * Demonstrates various field types with NgxVestFormField wrapper:
 * - Text input (name)
 * - Email input (email)
 * - URL input (website)
 * - Number input (age)
 * - Textarea (bio)
 * - Select dropdown (country)
 * - Checkbox (agreeToTerms)
 */
export type FormFieldShowcaseModel = {
  name: string;
  email: string;
  website: string;
  age: number;
  bio: string;
  country: string;
  agreeToTerms: boolean;
};

/**
 * Validation suite for the form-field showcase example.
 *
 * ✅ IMPORTANT: Uses createSafeSuite (stateful) instead of staticSafeSuite (stateless)
 * because this form has multiple fields and we need errors to persist across field navigation.
 * When a user tabs between fields in 'on-touch' mode, all touched field errors must remain
 * visible. createSafeSuite maintains this state, staticSafeSuite doesn't.
 *
 * Demonstrates various validation patterns:
 * - Required fields
 * - Email format validation
 * - URL format validation
 * - Number range validation
 * - Length constraints
 * - Checkbox requirement
 *
 * @example
 * ```typescript
 * const form = createVestForm(signal({
 *   name: '',
 *   email: '',
 *   website: '',
 *   age: 0,
 *   bio: '',
 *   country: '',
 *   agreeToTerms: false
 * }), formFieldShowcaseValidations);
 * ```
 */
export const formFieldShowcaseValidations =
  createSafeSuite<FormFieldShowcaseModel>((data = {}) => {
    // Name validation
    test('name', 'Name is required', () => {
      enforce(data.name).isNotEmpty();
    });

    test('name', 'Name must be at least 2 characters', () => {
      enforce(data.name).longerThan(1);
    });

    // Email validation
    test('email', 'Email is required', () => {
      enforce(data.email).isNotEmpty();
    });

    test('email', 'Email format is invalid', () => {
      enforce(data.email).matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    // Website validation (optional but must be valid URL if provided)
    test('website', 'Website must be a valid URL', () => {
      if (data.website && data.website.trim()) {
        enforce(data.website).matches(/^https?:\/\/.+\..+/i);
      }
    });

    // Age validation
    test('age', 'Age is required', () => {
      enforce(data.age).isNotEmpty();
    });

    test('age', 'Age must be at least 18', () => {
      enforce(data.age).greaterThanOrEquals(18);
    });

    test('age', 'Age must be less than 120', () => {
      enforce(data.age).lessThan(120);
    });

    // Bio validation
    test('bio', 'Bio is required', () => {
      enforce(data.bio).isNotEmpty();
    });

    test('bio', 'Bio must be at least 20 characters', () => {
      enforce(data.bio).longerThan(19);
    });

    test('bio', 'Bio must be less than 500 characters', () => {
      enforce(data.bio).shorterThan(501);
    });

    // Country validation
    test('country', 'Country is required', () => {
      enforce(data.country).isNotEmpty();
    });

    // Terms and conditions validation
    test('agreeToTerms', 'You must agree to the terms and conditions', () => {
      enforce(data.agreeToTerms).isTruthy();
    });
  });
