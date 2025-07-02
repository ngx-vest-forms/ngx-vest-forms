import { enforce, only, staticSuite, test } from 'vest';

/**
 * Address type for nested validation
 */
type Address = {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
};

/**
 * Complete profile form data structure
 */
type ProfileFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: Address;
  gender: 'male' | 'female' | 'other' | '';
  genderOther?: string;
  newsletter: boolean;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  bio: string;
  website?: string;
  profilePicture?: File;
};

const defaultProfileFormData: ProfileFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  address: {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
  },
  gender: '',
  newsletter: false,
  notifications: {
    email: true,
    sms: false,
    push: false,
  },
  bio: '',
};

/**
 * Creates a validation suite for the profile form.
 * Demonstrates nested object validation, conditional validation, and various input types.
 *
 * @returns A Vest validation suite for the profile form
 */
export const createProfileValidationSuite = () =>
  staticSuite(
    (data: ProfileFormData = defaultProfileFormData, currentField?: string) => {
      only(currentField);

      // Personal Information
      test('firstName', 'First name is required', () => {
        enforce(data.firstName).isNotEmpty();
      });
      test('firstName', 'First name must be at least 2 characters', () => {
        enforce(data.firstName).longerThanOrEquals(2);
      });

      test('lastName', 'Last name is required', () => {
        enforce(data.lastName).isNotEmpty();
      });
      test('lastName', 'Last name must be at least 2 characters', () => {
        enforce(data.lastName).longerThanOrEquals(2);
      });

      test('email', 'Email is required', () => {
        enforce(data.email).isNotEmpty();
      });
      test('email', 'Email must be a valid email address', () => {
        enforce(data.email).matches(/^[^@]+@[^@]+\.[^@]+$/);
      });

      test('phone', 'Phone number is required', () => {
        enforce(data.phone).isNotEmpty();
      });
      test('phone', 'Phone number must be valid', () => {
        enforce(data.phone).matches(/^[+]?[1-9][\d]{0,15}$/);
      });

      test('dateOfBirth', 'Date of birth is required', () => {
        enforce(data.dateOfBirth).isNotEmpty();
      });
      test('dateOfBirth', 'You must be at least 13 years old', () => {
        const birthDate = new Date(data.dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        enforce(age).greaterThanOrEquals(13);
      });

      // Address validation (nested object)
      test('address.street', 'Street address is required', () => {
        enforce(data.address?.street).isNotEmpty();
      });

      test('address.city', 'City is required', () => {
        enforce(data.address?.city).isNotEmpty();
      });

      test('address.state', 'State is required', () => {
        enforce(data.address?.state).isNotEmpty();
      });

      test('address.zipCode', 'ZIP code is required', () => {
        enforce(data.address?.zipCode).isNotEmpty();
      });
      test('address.zipCode', 'ZIP code must be valid', () => {
        if (data.address?.country === 'US') {
          enforce(data.address.zipCode).matches(/^\d{5}(-\d{4})?$/);
        }
      });

      test('address.country', 'Country is required', () => {
        enforce(data.address?.country).isNotEmpty();
      });

      // Gender validation (conditional)
      test('gender', 'Gender selection is required', () => {
        enforce(data.gender).isNotEmpty();
      });

      // Conditional validation for "Other" gender
      test('genderOther', 'Please specify your gender', () => {
        if (data.gender === 'other') {
          enforce(data.genderOther).isNotEmpty();
        }
      });

      // Bio validation
      test('bio', 'Bio is required', () => {
        enforce(data.bio).isNotEmpty();
      });
      test('bio', 'Bio must be at least 10 characters', () => {
        enforce(data.bio).longerThanOrEquals(10);
      });
      test('bio', 'Bio must be less than 500 characters', () => {
        enforce(data.bio).shorterThan(500);
      });

      // Website validation (optional)
      test('website', 'Website must be a valid URL', () => {
        if (data.website && data.website.length > 0) {
          enforce(data.website).matches(/^https?:\/\/.+/);
        }
      });
    },
  );
