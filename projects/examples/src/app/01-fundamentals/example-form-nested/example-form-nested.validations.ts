import { staticSafeSuite } from 'ngx-vest-forms/core';
import { enforce, test } from 'vest';
import { NestedFormModel } from './example-form-nested.model';

export const nestedValidationSuite = staticSafeSuite<NestedFormModel>(
  (model: Partial<NestedFormModel> = {}) => {
    // ✅ No need for manual only(field) guard - staticSafeSuite handles it automatically!

    // Personal Info validations - use nested field names to match form paths
    test('personalInfo.firstName', 'First name is required', () => {
      enforce(model.personalInfo?.firstName).isNotEmpty();
    });

    test(
      'personalInfo.firstName',
      'First name must be at least 2 characters',
      () => {
        enforce(model.personalInfo?.firstName).longerThanOrEquals(2);
      },
    );

    test('personalInfo.lastName', 'Last name is required', () => {
      enforce(model.personalInfo?.lastName).isNotEmpty();
    });

    test(
      'personalInfo.lastName',
      'Last name must be at least 2 characters',
      () => {
        enforce(model.personalInfo?.lastName).longerThanOrEquals(2);
      },
    );

    test('personalInfo.email', 'Email is required', () => {
      enforce(model.personalInfo?.email).isNotEmpty();
    });

    test('personalInfo.email', 'Email must be a valid email address', () => {
      enforce(model.personalInfo?.email).matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    // New input type validations
    test('personalInfo.age', 'Age must be between 18 and 120', () => {
      if (model.personalInfo?.age !== undefined) {
        enforce(model.personalInfo.age).greaterThanOrEquals(18);
        enforce(model.personalInfo.age).lessThanOrEquals(120);
      }
    });

    test('personalInfo.gender', 'Gender selection is required', () => {
      enforce(model.personalInfo?.gender).isNotEmpty();
    });

    // Experience level (range) validation - tests value extraction from range input
    test(
      'personalInfo.experienceLevel',
      'Experience level must be between 1 and 10',
      () => {
        const level = model.personalInfo?.experienceLevel;

        // Must be a valid number (tests number extraction from range input)
        enforce(level).isNumber();

        // Must be within valid range
        enforce(level).greaterThanOrEquals(1);
        enforce(level).lessThanOrEquals(10);
      },
    );

    // Address Info validations - use nested field names
    test('addressInfo.street', 'Street address is required', () => {
      enforce(model.addressInfo?.street).isNotEmpty();
    });

    test('addressInfo.city', 'City is required', () => {
      enforce(model.addressInfo?.city).isNotEmpty();
    });

    test('addressInfo.zipCode', 'ZIP code is required', () => {
      enforce(model.addressInfo?.zipCode).isNotEmpty();
    });

    test(
      'addressInfo.zipCode',
      'ZIP code must be valid (5 or 5+4 digits)',
      () => {
        enforce(model.addressInfo?.zipCode).matches(/^\d{5}(-\d{4})?$/);
      },
    );

    test('addressInfo.country', 'Country is required', () => {
      enforce(model.addressInfo?.country).isNotEmpty();
    });

    // Cross-field validation: if newsletter is enabled, email must be provided
    test(
      'personalInfo.email',
      'Email is required when newsletter subscription is enabled',
      () => {
        if (model.preferences?.newsletter) {
          enforce(model.personalInfo?.email).isNotEmpty();
        }
      },
    );
  },
);
