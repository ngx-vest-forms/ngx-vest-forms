import { createSafeSuite } from 'ngx-vest-forms';
import { enforce, include, test } from 'vest';
import { FormModel } from './example-form-simple.model';

/**
 * ✅ IMPORTANT: Uses createSafeSuite (stateful) instead of staticSafeSuite (stateless)
 * because this form has multiple fields (email and verifyEmail) and we need errors to persist
 * across field navigation. When a user tabs between fields in 'on-touch' mode, all touched
 * field errors must remain visible. createSafeSuite maintains this state, staticSafeSuite doesn't.
 */
export const validationSuite = createSafeSuite<FormModel>(
  (model: Partial<FormModel> = {}) => {
    include('verifyEmail').when('email');
    include('email').when('verifyEmail');

    test('email', 'Email is required', () => {
      enforce(model.email).isNotEmpty();
    });

    test('email', 'Email must be a valid email address', () => {
      enforce(model.email).matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    test('verifyEmail', 'Email verification is required', () => {
      enforce(model.verifyEmail).isNotEmpty();
    });

    test(
      'verifyEmail',
      'Email verification must be a valid email address',
      () => {
        enforce(model.verifyEmail).matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      },
    );

    test('verifyEmail', 'Email addresses must match', () => {
      enforce(model.verifyEmail).equals(model.email);
    });
  },
);
