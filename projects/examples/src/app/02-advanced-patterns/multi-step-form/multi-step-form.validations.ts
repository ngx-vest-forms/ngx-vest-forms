import { enforce, group, only, skipWhen, staticSuite, test } from 'vest';

/**
 * 🧪 VALIDATION TEST SCENARIOS
 *
 * Try these test cases to understand the validation behavior:
 *
 * 📋 STEP 1 - PERSONAL INFORMATION:
 * ✅ Valid: firstName: "John", lastName: "Doe", dateOfBirth: "1990-01-01", email: "john@example.com"
 * ❌ Test required fields: Leave any field empty
 * ❌ Test length limits: firstName: "J" (too short), firstName: "J".repeat(60) (too long)
 * ❌ Test age requirement: dateOfBirth: "2015-01-01" (too young)
 * ❌ Test email format: email: "invalid-email-format"
 *
 * 📋 STEP 2 - ACCOUNT SETUP:
 * ✅ Valid: username: "john_doe123", password: "MyPassword123", confirmPassword: "MyPassword123"
 * ❌ Test taken usernames: "admin", "user", "test", "demo", "john_doe", "jane_smith"
 * ❌ Test username format: "user@123" (special chars), "ab" (too short)
 * ❌ Test password rules: "weak" (missing requirements), "password" (no uppercase/number)
 * ❌ Test password confirmation: password: "Pass123", confirmPassword: "Different123"
 * ⏳ Test async validation: Watch loading indicator for username check
 *
 * 📋 STEP 3 - PROFILE & PREFERENCES:
 * ✅ Valid: bio: "I love coding!", website: "https://example.com", preferredLanguage: "en", agreeToTerms: true
 * ❌ Test optional bio: "Short" (too short if provided), "x".repeat(600) (too long)
 * ❌ Test optional website: "invalid-url" vs "https://valid.com"
 * ❌ Test required language: Leave dropdown empty
 * ❌ Test terms agreement: Try submitting without checking terms
 *
 * 🎯 ADVANCED TESTING:
 * - Try navigating between steps with incomplete data
 * - Test cross-step validation (password confirmation across steps)
 * - Test performance: Only current step should validate (check browser dev tools)
 * - Test group isolation: Errors in Step 1 don't prevent editing Step 3
 * - Test final submission: All steps must be valid before submission succeeds
 */

/**
 * Multi-step Registration Form Model
 *
 * Comprehensive form model for a multi-step user registration process
 */
export type MultiStepFormModel = {
  // Step 1: Personal Information
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;

  // Step 2: Account Setup
  username: string;
  password: string;
  confirmPassword: string;

  // Step 3: Profile & Preferences
  bio: string;
  website: string;
  preferredLanguage: string;
  receiveNewsletter: boolean;
  agreeToTerms: boolean;
};

/**
 * Step names for group-based validation
 */
export type FormSteps = 'personal' | 'account' | 'profile';

/**
 * Field names for type-safe validation
 */

/**
 * Mock async service for username availability
 *
 * 🧪 TEST THESE USERNAMES:
 * ❌ TAKEN: 'admin', 'user', 'test', 'demo', 'john_doe', 'jane_smith'
 * ✅ AVAILABLE: 'unique_user', 'my_username', 'developer123', etc.
 *
 * Features demonstrated:
 * - Async validation with 1.2s delay (simulates API call)
 * - AbortSignal support for cancelling requests
 * - Case-insensitive username checking
 */
const checkUsernameAvailability = async (
  username: string,
  signal?: AbortSignal,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      if (signal?.aborted) {
        reject(new Error('Validation cancelled'));
        return;
      }

      // List of taken usernames for testing
      const takenUsernames = [
        'admin',
        'user',
        'test',
        'demo',
        'john_doe',
        'jane_smith',
      ];

      if (takenUsernames.includes(username.toLowerCase())) {
        reject(new Error('Username is already taken'));
      } else {
        resolve();
      }
    }, 1200); // 1.2 second delay to simulate real API call

    // Handle request cancellation
    signal?.addEventListener('abort', () => {
      clearTimeout(timeoutId);
      reject(new Error('Validation cancelled'));
    });
  });
};

/**
 * Multi-Step Form Validation Suite
 *
 * Advanced validation suite demonstrating Vest.js group functionality:
 *
 * 🚀 Advanced Features Demonstrated:
 * - TypeScript generics with group names for compile-time safety
 * - Group-based validation for multi-step forms
 * - Selective group validation with only.group()
 * - Cross-step dependencies and validation
 * - Performance optimization with skipWhen for expensive operations
 * - Memoized async validations
 *
 * 📋 Form Steps:
 * - Step 1 (personal): Personal information collection
 * - Step 2 (account): Account setup and security
 * - Step 3 (profile): Profile customization and preferences
 *
 * 🎯 Usage Patterns:
 * - Validate single step: suite(data, field, 'personal')
 * - Validate all steps: suite(data, field)
 * - Real-time validation: suite(data, changedField, currentStep)
 *
 * 🧪 Quick Test Commands:
 * ```javascript
 * // Test Step 1 validation
 * validateStep({ firstName: '', email: 'invalid' }, 'personal');
 *
 * // Test async username (try 'admin' vs 'unique_user')
 * validateStep({ username: 'admin' }, 'account');
 *
 * // Test final form validation
 * validateAllSteps(completeFormData);
 * ```
 */
export const multiStepFormValidationSuite = staticSuite(
  (
    data: Partial<MultiStepFormModel> = {},
    field?: string,
    currentStep?: FormSteps,
  ) => {
    // Performance optimization: validate only specific field or step
    if (field) {
      only(field);
    } else if (currentStep) {
      // For step-based validation, we'll use group logic below
      // Each group will check if it should validate based on currentStep
    }

    // Step 1: Personal Information
    group('personal', () => {
      // Skip this group if we're validating a different step
      if (currentStep && currentStep !== 'personal') {
        return;
      }
      test('firstName', 'First name is required', () => {
        enforce(data.firstName).isNotEmpty();
      });

      test('firstName', 'First name must be 2-50 characters', () => {
        enforce(data.firstName).longerThanOrEquals(2).shorterThanOrEquals(50);
      });

      test('lastName', 'Last name is required', () => {
        enforce(data.lastName).isNotEmpty();
      });

      test('lastName', 'Last name must be 2-50 characters', () => {
        enforce(data.lastName).longerThanOrEquals(2).shorterThanOrEquals(50);
      });

      test('dateOfBirth', 'Date of birth is required', () => {
        enforce(data.dateOfBirth).isNotEmpty();
      });

      test('dateOfBirth', 'You must be at least 13 years old', () => {
        if (data.dateOfBirth) {
          const birthDate = new Date(data.dateOfBirth);
          const today = new Date();
          const age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();

          if (
            monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < birthDate.getDate())
          ) {
            enforce(age - 1).greaterThanOrEquals(13);
          } else {
            enforce(age).greaterThanOrEquals(13);
          }
        }
      });

      test('email', 'Email is required', () => {
        enforce(data.email).isNotEmpty();
      });

      test('email', 'Please enter a valid email address', () => {
        enforce(data.email).matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      });
    });

    // Step 2: Account Setup
    group('account', () => {
      // Skip this group if we're validating a different step
      if (currentStep && currentStep !== 'account') {
        return;
      }
      test('username', 'Username is required', () => {
        enforce(data.username).isNotEmpty();
      });

      test('username', 'Username must be 3-20 characters', () => {
        enforce(data.username).longerThanOrEquals(3).shorterThanOrEquals(20);
      });

      test(
        'username',
        'Username can only contain letters, numbers, and underscores',
        () => {
          enforce(data.username).matches(/^[a-zA-Z0-9_]+$/);
        },
      );

      // Advanced: Skip expensive async check if basic validation fails
      skipWhen(
        (result) => result.hasErrors('username'),
        () => {
          test.memo(
            'username',
            'Username is already taken',
            async ({ signal }) => {
              if (data.username && data.username.length >= 3) {
                await checkUsernameAvailability(data.username, signal);
              }
            },
            [data.username],
          );
        },
      );

      test('password', 'Password is required', () => {
        enforce(data.password).isNotEmpty();
      });

      test('password', 'Password must be at least 8 characters', () => {
        enforce(data.password).longerThanOrEquals(8);
      });

      test('password', 'Password must contain uppercase letter', () => {
        enforce(data.password).matches(/[A-Z]/);
      });

      test('password', 'Password must contain lowercase letter', () => {
        enforce(data.password).matches(/[a-z]/);
      });

      test('password', 'Password must contain a number', () => {
        enforce(data.password).matches(/[0-9]/);
      });

      test('confirmPassword', 'Password confirmation is required', () => {
        enforce(data.confirmPassword).isNotEmpty();
      });

      test('confirmPassword', 'Passwords must match', () => {
        enforce(data.confirmPassword).equals(data.password);
      });
    });

    // Step 3: Profile & Preferences
    group('profile', () => {
      // Skip this group if we're validating a different step
      if (currentStep && currentStep !== 'profile') {
        return;
      }

      // Bio is optional but if provided, must meet certain criteria
      if (data.bio && data.bio.length > 0) {
        test('bio', 'Bio must be at least 10 characters', () => {
          enforce(data.bio).longerThanOrEquals(10);
        });

        test('bio', 'Bio must not exceed 500 characters', () => {
          enforce(data.bio).shorterThanOrEquals(500);
        });
      }

      // Website is optional, but if provided must be valid
      if (data.website && data.website.length > 0) {
        test(
          'website',
          'Please enter a valid URL (starting with http:// or https://)',
          () => {
            enforce(data.website).matches(/^https?:\/\/.+\..+/);
          },
        );
      }

      test('preferredLanguage', 'Please select your preferred language', () => {
        enforce(data.preferredLanguage).isNotEmpty();
      });

      test('receiveNewsletter', 'Please indicate newsletter preference', () => {
        enforce(data.receiveNewsletter).isBoolean();
      });

      test('agreeToTerms', 'You must accept the terms and conditions', () => {
        enforce(data.agreeToTerms).isTruthy();
      });
    });
  },
);

/**
 * Helper function to validate a specific step
 * Useful for step-by-step validation in multi-step forms
 */
export const validateStep = (
  data: Partial<MultiStepFormModel>,
  step: FormSteps,
) => {
  return multiStepFormValidationSuite(data, undefined, step);
};

/**
 * Helper function to validate all completed steps
 * Useful for final form submission
 */
export const validateAllSteps = (data: Partial<MultiStepFormModel>) => {
  return multiStepFormValidationSuite(data);
};
