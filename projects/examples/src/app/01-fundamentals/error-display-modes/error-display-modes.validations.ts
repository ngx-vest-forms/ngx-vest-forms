import { enforce, omitWhen, only, staticSuite, test } from 'vest';

export type ProductFeedbackModel = {
  // Personal Information
  name: string;
  email: string;
  company: string;

  // Feedback
  productUsed: string;
  overallRating: number;
  improvementSuggestions: string;
  detailedFeedback: string;

  // Preferences
  allowFollowUp: boolean;
  newsletter: boolean;
};

export const productFeedbackValidationSuite = staticSuite(
  (data: Partial<ProductFeedbackModel> = {}, field?: string) => {
    only(field); // Performance optimization

    // Personal Information Section
    test('name', 'Name is required', () => {
      enforce(data.name).isNotEmpty();
    });

    test('name', 'Name must be between 2-50 characters', () => {
      enforce(data.name).longerThanOrEquals(2).shorterThanOrEquals(50);
    });

    test('email', 'Email is required', () => {
      enforce(data.email).isNotEmpty();
    });

    test('email', 'Please enter a valid email address', () => {
      enforce(data.email)
        .isNotEmpty()
        .matches(/^[^@]+@[^@]+\.[^@]+$/);
    });

    test('company', 'Company name cannot exceed 100 characters', () => {
      if (data.company) {
        enforce(data.company).shorterThanOrEquals(100);
      }
    });

    // Feedback Section
    test('productUsed', 'Please select which product you used', () => {
      enforce(data.productUsed).isNotEmpty();
    });

    test('overallRating', 'Please rate your experience', () => {
      enforce(data.overallRating).isNotEmpty();
    });

    test('overallRating', 'Rating must be between 1 and 5', () => {
      if (data.overallRating) {
        enforce(data.overallRating).greaterThanOrEquals(1).lessThanOrEquals(5);
      }
    });

    // Conditional validation: improvement suggestions required for low ratings
    omitWhen(!data.overallRating || data.overallRating > 3, () => {
      test(
        'improvementSuggestions',
        'Please help us understand what could be improved',
        () => {
          enforce(data.improvementSuggestions).isNotEmpty();
        },
      );

      test(
        'improvementSuggestions',
        'Please provide at least 10 characters of feedback',
        () => {
          if (data.improvementSuggestions) {
            enforce(data.improvementSuggestions).longerThanOrEquals(10);
          }
        },
      );
    });

    test(
      'improvementSuggestions',
      'Feedback cannot exceed 500 characters',
      () => {
        if (data.improvementSuggestions) {
          enforce(data.improvementSuggestions).shorterThanOrEquals(500);
        }
      },
    );

    test(
      'detailedFeedback',
      'Detailed feedback cannot exceed 1000 characters',
      () => {
        if (data.detailedFeedback) {
          enforce(data.detailedFeedback).shorterThanOrEquals(1000);
        }
      },
    );
  },
);
