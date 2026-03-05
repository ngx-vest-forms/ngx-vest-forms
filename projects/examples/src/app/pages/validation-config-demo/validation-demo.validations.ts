import { create, enforce, include, omitWhen, test, warn } from 'vest';
import { ValidationDemoModel } from '../../models/validation-demo.model';

export const validationDemoSuite = create((model: ValidationDemoModel) => {
  // Password validation
  test('password', 'Password is required', () => {
    enforce(model.password).isNotBlank();
  });

  test('password', 'Password must be at least 8 characters', () => {
    enforce(model.password).longerThanOrEquals(8);
  });

  // Non-blocking password strength warning
  omitWhen(!model.password, () => {
    test('password', 'For better security, use 12+ characters', () => {
      warn(); // Non-blocking warning
      enforce(model.password).longerThanOrEquals(12);
    });
  });

  // Confirm password (depends on password)
  // Use include() to ensure confirmPassword revalidates when password changes
  include('confirmPassword').when('password');

  omitWhen(!model.password, () => {
    test('confirmPassword', 'Please confirm your password', () => {
      enforce(model.confirmPassword).isNotBlank();
    });

    test('confirmPassword', 'Passwords must match', () => {
      enforce(model.confirmPassword).equals(model.password);
    });
  });

  // Cross-field requirement (quantity <-> justification)
  // Use include() to link bidirectional cross-field deps
  include('quantityJustification').when('quantity');
  include('quantity').when('quantityJustification');

  omitWhen(!model.quantity, () => {
    test(
      'quantityJustification',
      'Justification is required when quantity is provided',
      () => {
        enforce(model.quantityJustification).isNotBlank();
      }
    );
  });

  omitWhen(!model.quantityJustification, () => {
    test(
      'quantity',
      'Quantity is required when justification is provided',
      () => {
        enforce(model.quantity).isNotBlank();
      }
    );
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
  // Use include() so endDate revalidates when startDate changes
  include('endDate').when('startDate');

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
      enforce(end.getTime()).greaterThan(start.getTime());
    });
  });
});
