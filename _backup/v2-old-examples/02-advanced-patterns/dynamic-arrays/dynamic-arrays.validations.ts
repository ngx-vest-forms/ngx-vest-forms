import { each, enforce, only, skipWhen, staticSuite, test, warn } from 'vest';

/**
 * Contact Information Model
 */
export type ContactInfo = {
  id: string;
  type: 'phone' | 'email' | 'address';
  value: string;
  label: string;
  isPrimary: boolean;
};

/**
 * Address Model for detailed address entries
 */
export type Address = {
  id: string;
  type: 'home' | 'work' | 'billing' | 'shipping';
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
};

/**
 * Dynamic Contact Form Model
 *
 * Demonstrates dynamic form arrays with complex validation patterns
 */
export type DynamicContactFormModel = {
  // Basic information
  firstName: string;
  lastName: string;
  company?: string;

  // Dynamic arrays - the core of this example
  contactInfo: ContactInfo[];
  addresses: Address[];

  // Preferences
  preferredContactMethod: 'phone' | 'email';
  allowMarketing: boolean;
};

/**
 * Mock async service for validating phone numbers
 */
const validatePhoneNumber = async (
  phone: string,
  signal?: AbortSignal,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      if (signal?.aborted) {
        reject(new Error('Validation cancelled'));
        return;
      }

      // Simulate some invalid phone numbers
      const invalidNumbers = ['123-456-7890', '000-000-0000', '111-111-1111'];

      if (invalidNumbers.includes(phone)) {
        reject(new Error('This phone number is not valid'));
      } else {
        resolve();
      }
    }, 600);

    signal?.addEventListener('abort', () => {
      clearTimeout(timeoutId);
      reject(new Error('Validation cancelled'));
    });
  });
};

/**
 * Mock async service for validating addresses
 */
const validateAddress = async (
  zipCode: string,
  signal?: AbortSignal,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      if (signal?.aborted) {
        reject(new Error('Validation cancelled'));
        return;
      }

      // Simulate some invalid zip codes
      const invalidZipCodes = ['00000', '99999', '12345'];

      if (invalidZipCodes.includes(zipCode)) {
        reject(new Error('This ZIP code is not serviceable'));
      } else {
        resolve();
      }
    }, 800);

    signal?.addEventListener('abort', () => {
      clearTimeout(timeoutId);
      reject(new Error('Validation cancelled'));
    });
  });
};

/**
 * Dynamic Contact Form Validation Suite
 *
 * Advanced validation suite demonstrating Vest.js `each()` functionality:
 *
 * 🚀 Advanced Features Demonstrated:
 * - Dynamic array validation with `each()`
 * - Unique key management for array items
 * - Complex nested object validation within arrays
 * - Async validation for array items with proper cancellation
 * - Performance optimization with `skipWhen()` for expensive operations
 * - Warning system for array validation feedback
 * - Conditional validation based on array item properties
 *
 * 📋 Array Validation Patterns:
 * - Contact info validation (phone, email, address types)
 * - Address validation with async ZIP code verification
 * - Cross-array validation (ensuring at least one primary contact)
 * - Dynamic field naming for error association
 *
 * 🎯 Key Performance Features:
 * - Stable key usage prevents validation re-runs on reorder
 * - Memoized async validations for expensive operations
 * - Conditional skipping of validation based on item state
 */
export const dynamicContactFormValidationSuite = staticSuite(
  (data: Partial<DynamicContactFormModel> = {}, field?: string) => {
    // Performance optimization: validate only changed field
    only(field);

    // Basic field validation
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

    // Company is optional but has validation if provided
    if (data.company && data.company.length > 0) {
      test('company', 'Company name must be less than 100 characters', () => {
        enforce(data.company).shorterThanOrEquals(100);
      });
    }

    // Dynamic Contact Info Array Validation
    if (data.contactInfo && data.contactInfo.length > 0) {
      each(data.contactInfo, (contact, index) => {
        const fieldPrefix = `contactInfo[${index}]`;

        // Basic contact validation
        test(
          `${fieldPrefix}.type`,
          'Contact type is required',
          () => {
            enforce(contact.type).isNotEmpty();
          },
          contact.id, // Stable key for performance
        );

        test(
          `${fieldPrefix}.value`,
          'Contact value is required',
          () => {
            enforce(contact.value).isNotEmpty();
          },
          contact.id,
        );

        test(
          `${fieldPrefix}.label`,
          'Contact label is required',
          () => {
            enforce(contact.label).isNotEmpty();
          },
          contact.id,
        );

        // Type-specific validation
        if (contact.type === 'email') {
          test(
            `${fieldPrefix}.value`,
            'Please enter a valid email address',
            () => {
              enforce(contact.value).matches(/^[^@]+@[^@]+\.[^@]+$/);
            },
            contact.id,
          );
        }

        if (contact.type === 'phone') {
          test(
            `${fieldPrefix}.value`,
            'Phone number must be in format: 123-456-7890',
            () => {
              enforce(contact.value).matches(/^\\d{3}-\\d{3}-\\d{4}$/);
            },
            contact.id,
          );

          // Advanced: Skip expensive async validation if basic format is wrong
          skipWhen(
            (res) => res.hasErrors(`${fieldPrefix}.value`),
            () => {
              test.memo(
                `${fieldPrefix}.value`,
                'Phone number could not be verified',
                async ({ signal }) => {
                  if (
                    contact.value &&
                    /^\\d{3}-\\d{3}-\\d{4}$/.test(contact.value)
                  ) {
                    await validatePhoneNumber(contact.value, signal);
                  }
                },
                [contact.value],
              );
            },
          );
        }

        // Warning for missing primary contact
        if (data.contactInfo && !data.contactInfo.some((c) => c.isPrimary)) {
          test(
            `${fieldPrefix}.isPrimary`,
            'Consider marking one contact as primary',
            () => {
              warn();
              // This will always "fail" to show the warning
              throw new Error('No primary contact selected');
            },
            contact.id,
          );
        }
      });
    }

    // Dynamic Address Array Validation
    if (data.addresses && data.addresses.length > 0) {
      each(data.addresses, (address, index) => {
        const fieldPrefix = `addresses[${index}]`;

        // Address type validation
        test(
          `${fieldPrefix}.type`,
          'Address type is required',
          () => {
            enforce(address.type).isNotEmpty();
          },
          address.id,
        );

        // Street address validation
        test(
          `${fieldPrefix}.street`,
          'Street address is required',
          () => {
            enforce(address.street).isNotEmpty();
          },
          address.id,
        );

        test(
          `${fieldPrefix}.street`,
          'Street address must be less than 100 characters',
          () => {
            enforce(address.street).shorterThanOrEquals(100);
          },
          address.id,
        );

        // City validation
        test(
          `${fieldPrefix}.city`,
          'City is required',
          () => {
            enforce(address.city).isNotEmpty();
          },
          address.id,
        );

        test(
          `${fieldPrefix}.city`,
          'City must be less than 50 characters',
          () => {
            enforce(address.city).shorterThanOrEquals(50);
          },
          address.id,
        );

        // State validation
        test(
          `${fieldPrefix}.state`,
          'State is required',
          () => {
            enforce(address.state).isNotEmpty();
          },
          address.id,
        );

        // ZIP code validation with async verification
        test(
          `${fieldPrefix}.zipCode`,
          'ZIP code is required',
          () => {
            enforce(address.zipCode).isNotEmpty();
          },
          address.id,
        );

        test(
          `${fieldPrefix}.zipCode`,
          'ZIP code must be 5 digits',
          () => {
            enforce(address.zipCode).matches(/^\\d{5}$/);
          },
          address.id,
        );

        // Skip expensive ZIP validation if format is wrong
        skipWhen(
          (res) => res.hasErrors(`${fieldPrefix}.zipCode`),
          () => {
            test.memo(
              `${fieldPrefix}.zipCode`,
              'ZIP code area is not serviceable',
              async ({ signal }) => {
                if (address.zipCode && /^\\d{5}$/.test(address.zipCode)) {
                  await validateAddress(address.zipCode, signal);
                }
              },
              [address.zipCode],
            );
          },
        );

        // Country validation
        test(
          `${fieldPrefix}.country`,
          'Country is required',
          () => {
            enforce(address.country).isNotEmpty();
          },
          address.id,
        );
      });
    }

    // Preferred contact method validation
    test(
      'preferredContactMethod',
      'Please select preferred contact method',
      () => {
        enforce(data.preferredContactMethod).isNotEmpty();
      },
    );

    test(
      'preferredContactMethod',
      'Please select a valid contact method',
      () => {
        enforce(data.preferredContactMethod).inside(['phone', 'email']);
      },
    );

    // Marketing preference validation
    test('allowMarketing', 'Please indicate marketing preference', () => {
      enforce(data.allowMarketing).isBoolean();
    });

    // Cross-validation: Ensure preferred method has corresponding contact info
    if (data.preferredContactMethod && data.contactInfo) {
      const hasPreferredContact = data.contactInfo.some(
        (contact) => contact.type === data.preferredContactMethod,
      );

      if (!hasPreferredContact) {
        test(
          'preferredContactMethod',
          `Please add at least one ${data.preferredContactMethod} contact to use as preferred method`,
          () => {
            throw new Error('No matching contact info found');
          },
        );
      }
    }
  },
);

/**
 * Helper functions for array management
 */

/**
 * Generate a unique ID for array items
 */
export const generateId = (): string => {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
};

/**
 * Create a new contact info item with defaults
 */
export const createContactInfo = (type: ContactInfo['type']): ContactInfo => ({
  id: generateId(),
  type,
  value: '',
  label: '',
  isPrimary: false,
});

/**
 * Create a new address item with defaults
 */
export const createAddress = (type: Address['type']): Address => ({
  id: generateId(),
  type,
  street: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'US',
});

/**
 * Validate array for minimum requirements
 */
export const validateArrayRequirements = (
  data: Partial<DynamicContactFormModel>,
) => {
  const errors: string[] = [];

  if (!data.contactInfo || data.contactInfo.length === 0) {
    errors.push('At least one contact method is required');
  }

  if (!data.addresses || data.addresses.length === 0) {
    errors.push('At least one address is required');
  }

  const hasPrimaryContact = data.contactInfo?.some((c) => c.isPrimary);
  if (!hasPrimaryContact) {
    errors.push('Please mark one contact as primary');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
