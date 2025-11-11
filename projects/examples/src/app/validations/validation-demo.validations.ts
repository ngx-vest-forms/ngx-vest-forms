import { enforce, omitWhen, only, staticSuite, test } from 'vest';
import { ValidationDemoModel } from '../models/validation-demo.model';

export const validationDemoSuite = staticSuite(
  (model: ValidationDemoModel, field?: string) => {
    only(field);

    // Password validation
    test('password', 'Password is required', () => {
      enforce(model.password).isNotBlank();
    });

    test('password', 'Password must be at least 8 characters', () => {
      enforce(model.password).longerThanOrEquals(8);
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

    // Justification (conditional)
    omitWhen(!model.requiresJustification, () => {
      test('justification', 'Justification is required when selected', () => {
        enforce(model.justification).isNotBlank();
      });

      test(
        'justification',
        'Justification must be at least 20 characters',
        () => {
          enforce(model.justification).longerThanOrEquals(20);
        }
      );
    });

    // Location validation
    test('country', 'Country is required', () => {
      enforce(model.country).isNotBlank();
    });

    omitWhen(!model.country, () => {
      test('state', 'State/Province is required', () => {
        enforce(model.state).isNotBlank();
      });

      test('zipCode', 'Postal code is required', () => {
        enforce(model.zipCode).isNotBlank();
      });
    });

    // Date range validation
    test('startDate', 'Start date is required', () => {
      enforce(model.startDate).isNotEmpty();
    });

    test('endDate', 'End date is required', () => {
      enforce(model.endDate).isNotEmpty();
    });

    omitWhen(!model.startDate || !model.endDate, () => {
      test('endDate', 'End date must be after start date', () => {
        const start = new Date(model.startDate!);
        const end = new Date(model.endDate!);
        enforce(end.getTime())['isGreaterThan'](start.getTime());
      });
    });
  }
);
