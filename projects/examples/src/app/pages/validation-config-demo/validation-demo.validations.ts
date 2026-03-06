import { create, enforce, omitWhen, test, warn } from 'vest';
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

  omitWhen(!model.password, () => {
    test('confirmPassword', 'Please confirm your password', () => {
      enforce(model.confirmPassword).isNotBlank();
    });

    test('confirmPassword', 'Passwords must match', () => {
      enforce(model.confirmPassword).equals(model.password);
    });
  });

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

  test('startDate', 'Start date is required', () => {
    enforce(model.startDate).isNotEmpty();
  });

  test('endDate', 'End date is required', () => {
    enforce(model.endDate).isNotEmpty();
  });

  omitWhen(!model.startDate || !model.endDate, () => {
    test('endDate', 'End date must be after start date', () => {
      const { startDate, endDate } = model;

      if (!startDate || !endDate) {
        return;
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      enforce(end.getTime()).greaterThan(start.getTime());
    });
  });
});
