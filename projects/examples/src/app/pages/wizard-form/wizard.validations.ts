import { enforce, omitWhen, only, staticSuite, test } from 'vest';
import {
  WizardStep1Model,
  WizardStep2Model,
  WizardStep3Model,
} from '../../models/wizard-form.model';

/**
 * Step 1: Account Setup Validation
 * Demonstrates bidirectional validation:
 * - email ↔ confirmEmail
 * - password ↔ confirmPassword
 */
export const wizardStep1Suite = staticSuite(
  (model: WizardStep1Model, field?: string) => {
    only(field);

    // Email validation
    test('email', 'Email is required', () => {
      enforce(model.email).isNotBlank();
    });

    test('email', 'Please enter a valid email address', () => {
      enforce(model.email).matches(
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
      );
    });

    // Confirm email (depends on email)
    omitWhen(!model.email, () => {
      test('confirmEmail', 'Please confirm your email', () => {
        enforce(model.confirmEmail).isNotBlank();
      });

      test('confirmEmail', 'Email addresses must match', () => {
        enforce(model.confirmEmail).equals(model.email);
      });
    });

    // Password validation
    test('password', 'Password is required', () => {
      enforce(model.password).isNotBlank();
    });

    test('password', 'Password must be at least 8 characters', () => {
      enforce(model.password).longerThanOrEquals(8);
    });

    test('password', 'Password must contain at least one number', () => {
      enforce(model.password).matches(/\d/);
    });

    // Confirm password (depends on password)
    omitWhen(!model.password, () => {
      test('confirmPassword', 'Please confirm your password', () => {
        enforce(model.confirmPassword).isNotBlank();
      });

      test('confirmPassword', 'Passwords must match', () => {
        enforce(model.confirmPassword).equals(model.password);
      });
    });
  }
);

/**
 * Step 2: Profile Information Validation
 * Demonstrates conditional validation:
 * - subscribeNewsletter → newsletterFrequency required
 */
export const wizardStep2Suite = staticSuite(
  (model: WizardStep2Model, field?: string) => {
    only(field);

    test('firstName', 'First name is required', () => {
      enforce(model.firstName).isNotBlank();
    });

    test('firstName', 'First name must be at least 2 characters', () => {
      enforce(model.firstName).longerThanOrEquals(2);
    });

    test('lastName', 'Last name is required', () => {
      enforce(model.lastName).isNotBlank();
    });

    test('lastName', 'Last name must be at least 2 characters', () => {
      enforce(model.lastName).longerThanOrEquals(2);
    });

    test('phone', 'Phone number is required', () => {
      enforce(model.phone).isNotBlank();
    });

    test('phone', 'Please enter a valid phone number', () => {
      // Accept formats: +1234567890, (123) 456-7890, 123-456-7890, etc.
      enforce(model.phone).matches(/^[+]?[\d\s()-]{10,}$/);
    });

    test('dateOfBirth', 'Date of birth is required', () => {
      enforce(model.dateOfBirth).isNotEmpty();
    });

    // Conditional: Newsletter frequency only required when subscribed
    omitWhen(!model.subscribeNewsletter, () => {
      test('newsletterFrequency', 'Please select newsletter frequency', () => {
        enforce(model.newsletterFrequency).isNotBlank();
      });
    });
  }
);

/**
 * Step 3: Review & Confirmation Validation
 * Validates terms acceptance
 */
export const wizardStep3Suite = staticSuite(
  (model: WizardStep3Model, field?: string) => {
    only(field);

    test('acceptTerms', 'You must accept the terms of service', () => {
      enforce(model.acceptTerms).isTruthy();
    });

    test('acceptPrivacy', 'You must accept the privacy policy', () => {
      enforce(model.acceptPrivacy).isTruthy();
    });

    // Comments are optional, but if provided, must be meaningful
    omitWhen(!model.comments, () => {
      test('comments', 'Comments must be at least 10 characters', () => {
        enforce(model.comments).longerThanOrEquals(10);
      });
    });
  }
);
