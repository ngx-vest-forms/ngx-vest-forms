import { enforce, only, staticSuite, test } from 'vest';
import type { UserProfile } from './user-profile.model';

/**
 * Vest Validation Suite for User Profile
 *
 * This suite provides interactive field-level validation that complements
 * the schema validation. Vest handles real-time user feedback while schemas
 * handle submit-time data integrity.
 *
 * Key Benefits:
 * - Real-time validation feedback as users type
 * - Optimized performance with only() for single field updates
 * - Seamless integration with ngx-vest-forms
 * - Accessibility-compliant error messaging
 */
export const userProfileValidations = staticSuite(
  (data: Partial<UserProfile> = {}, field?: string) => {
    // Performance optimization: only validate the changed field
    only(field);

    test('name', 'Name is required', () => {
      enforce(data.name).isNotEmpty();
    });

    test('name', 'Name must be at least 2 characters', () => {
      enforce(data.name).longerThan(1);
    });

    test('name', 'Name must not exceed 50 characters', () => {
      enforce(data.name).shorterThan(51);
    });

    test('email', 'Email is required', () => {
      enforce(data.email).isNotEmpty();
    });

    test('email', 'Please enter a valid email address', () => {
      enforce(data.email).matches(/^[^@]+@[^@]+\.[^@]+$/);
    });

    test('age', 'Age is required', () => {
      enforce(data.age).isNotEmpty();
    });

    test('age', 'Age must be a number', () => {
      enforce(data.age).isNumeric();
    });

    test('age', 'Must be at least 13 years old', () => {
      enforce(data.age).greaterThanOrEquals(13);
    });

    test('age', 'Age must be realistic (under 120)', () => {
      enforce(data.age).lessThanOrEquals(120);
    });

    // Website is optional, but if provided, must be valid
    if (data.website && data.website.length > 0) {
      test('website', 'Please enter a valid URL', () => {
        enforce(data.website).matches(/^https?:\/\/.+\..+/);
      });
    }

    test('bio', 'Bio is required', () => {
      enforce(data.bio).isNotEmpty();
    });

    test('bio', 'Bio must be at least 10 characters', () => {
      enforce(data.bio).longerThan(9);
    });

    test('bio', 'Bio must not exceed 500 characters', () => {
      enforce(data.bio).shorterThan(501);
    });

    // Preferences validation
    test('preferences.newsletter', 'Newsletter preference is required', () => {
      enforce(data.preferences?.newsletter).isNotUndefined();
    });

    test(
      'preferences.notifications',
      'Notification preference is required',
      () => {
        enforce(data.preferences?.notifications).isNotUndefined();
      },
    );
  },
);
