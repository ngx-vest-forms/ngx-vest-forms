import { enforce, only, staticSuite, test } from 'vest';
import { NestedFormModel } from './example-form-nested.model';

export const nestedValidationSuite = staticSuite(
  (model: Partial<NestedFormModel> = {}, field?: string) => {
    if (field) {
      only(field); // For performance - only validate the active field
    }

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
