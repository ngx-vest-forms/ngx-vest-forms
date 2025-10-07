import { staticSafeSuite } from 'ngx-vest-forms';
import { enforce, include, test } from 'vest';
import { FormModel } from './example-form-simple.model';

export const validationSuite = staticSafeSuite<FormModel>(
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
