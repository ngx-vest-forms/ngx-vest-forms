import type { NgxFieldKey, NgxVestSuite } from 'ngx-vest-forms';
import { enforce, only, staticSuite, test } from 'vest';

/**
 * Survey form data structure with conditional fields
 */
type SurveyFormData = {
  name: string;
  email: string;
  age: number | null;
  usesProduct: boolean;
  productRating?: number;
  productFeatures?: string[];
  overallRating: number | null;
  recommendationLikelihood: number | null;
  hasComplaint: boolean;
  complaintDescription?: string;
  complaintUrgency?: 'low' | 'medium' | 'high';
  preferredContact: 'email' | 'phone' | 'none' | '';
  phoneNumber?: string;
  suggestions: string;
  allowFollowUp: boolean;
};

const defaultSurveyFormData: SurveyFormData = {
  name: '',
  email: '',
  age: null,
  usesProduct: false,
  overallRating: null,
  recommendationLikelihood: null,
  hasComplaint: false,
  preferredContact: '',
  suggestions: '',
  allowFollowUp: false,
};

/**
 * Creates a validation suite for the survey form.
 * Demonstrates conditional validation, warnings, and complex business logic.
 *
 * @returns A Vest validation suite for the survey form
 */
export const createSurveyValidationSuite = (): NgxVestSuite<SurveyFormData> =>
  staticSuite(
    (
      data: SurveyFormData = defaultSurveyFormData,
      field?: NgxFieldKey<SurveyFormData>,
    ) => {
      only(field);

      // Basic Information
      test('name', 'Name is required', () => {
        enforce(data.name).isNotEmpty();
      });
      test('name', 'Name must be at least 2 characters', () => {
        enforce(data.name).longerThanOrEquals(2);
      });

      test('email', 'Email is required', () => {
        enforce(data.email).isNotEmpty();
      });
      test('email', 'Email must be a valid email address', () => {
        enforce(data.email).matches(/^[^@]+@[^@]+\.[^@]+$/);
      });

      test('age', 'Age is required', () => {
        enforce(data.age).isNotNull();
      });
      test('age', 'Age must be between 13 and 120', () => {
        if (data.age !== null) {
          enforce(data.age).greaterThanOrEquals(13).lessThanOrEquals(120);
        }
      });

      // Note: Users under 18 may have different survey experiences
      if (data.age !== null && data.age < 18) {
        // Could add a warning here in a real application
      }

      // Overall Experience Rating
      test('overallRating', 'Please rate your overall experience', () => {
        enforce(data.overallRating).isNotNull();
      });
      test('overallRating', 'Rating must be between 1 and 10', () => {
        if (data.overallRating !== null) {
          enforce(data.overallRating)
            .greaterThanOrEquals(1)
            .lessThanOrEquals(10);
        }
      });

      // Recommendation Likelihood
      test(
        'recommendationLikelihood',
        'Please rate how likely you are to recommend us',
        () => {
          enforce(data.recommendationLikelihood).isNotNull();
        },
      );
      test(
        'recommendationLikelihood',
        'Rating must be between 0 and 10',
        () => {
          if (data.recommendationLikelihood !== null) {
            enforce(data.recommendationLikelihood)
              .greaterThanOrEquals(0)
              .lessThanOrEquals(10);
          }
        },
      );

      // Conditional validation for product users
      if (data.usesProduct) {
        test(
          'productRating',
          'Please rate the product since you use it',
          () => {
            enforce(data.productRating).isNotUndefined();
          },
        );
        test('productRating', 'Product rating must be between 1 and 10', () => {
          if (data.productRating !== undefined) {
            enforce(data.productRating)
              .greaterThanOrEquals(1)
              .lessThanOrEquals(10);
          }
        });

        test(
          'productFeatures',
          'Please select at least one feature you value',
          () => {
            enforce(data.productFeatures).isArray().lengthNotEquals(0);
          },
        );
      }

      // Complaint section validation
      if (data.hasComplaint) {
        test('complaintDescription', 'Please describe your complaint', () => {
          enforce(data.complaintDescription).isNotEmpty();
        });
        test(
          'complaintDescription',
          'Complaint description must be at least 10 characters',
          () => {
            if (data.complaintDescription) {
              enforce(data.complaintDescription).longerThanOrEquals(10);
            }
          },
        );

        test(
          'complaintUrgency',
          'Please specify the urgency of your complaint',
          () => {
            enforce(data.complaintUrgency).isNotUndefined();
          },
        );
      }

      // Contact preferences validation
      test('preferredContact', 'Please specify your contact preference', () => {
        enforce(data.preferredContact).isNotEmpty();
      });

      // Phone number validation when phone contact is preferred
      if (data.preferredContact === 'phone') {
        test(
          'phoneNumber',
          'Phone number is required when phone contact is preferred',
          () => {
            enforce(data.phoneNumber).isNotEmpty();
          },
        );
        test('phoneNumber', 'Phone number must be valid', () => {
          if (data.phoneNumber) {
            enforce(data.phoneNumber).matches(/^[+]?[1-9][\d]{0,15}$/);
          }
        });
      }

      // Suggestions validation
      test('suggestions', 'Please provide your suggestions or feedback', () => {
        enforce(data.suggestions).isNotEmpty();
      });
      test('suggestions', 'Suggestions must be at least 5 characters', () => {
        enforce(data.suggestions).longerThanOrEquals(5);
      });

      // Note: Low ratings and recommendations help identify improvement areas
      // In a real application, you might want to trigger follow-up workflows
      if (data.overallRating !== null && data.overallRating < 6) {
        // Could trigger additional feedback collection
      }

      if (
        data.recommendationLikelihood !== null &&
        data.recommendationLikelihood < 7
      ) {
        // Could trigger retention workflow
      }
    },
  );
