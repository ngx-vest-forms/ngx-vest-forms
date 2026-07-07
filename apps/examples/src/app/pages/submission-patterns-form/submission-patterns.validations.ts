import { type NgxVestSuite } from 'ngx-vest-forms';
import { create, enforce, omitWhen, test, warn } from 'vest';
import { SubmissionPatternsModel } from '../../models/submission-patterns.model';

/**
 * Plain Vest suite for the account-creation form. It has no Angular
 * dependency and is unit-testable in isolation:
 * `submissionPatternsSuite({ email: 'x' })`.
 *
 * This is concern (a): pure FIELD validation. It is deliberately unaware of
 * the server — submit-time invalid handling, server failure messaging, and
 * the success state all live in the page, not here.
 */
export const submissionPatternsSuite: NgxVestSuite<SubmissionPatternsModel> =
  create((model: SubmissionPatternsModel) => {
    test('fullName', 'Full name is required', () => {
      enforce(model.fullName).isNotBlank();
    });

    test('email', 'Email is required', () => {
      enforce(model.email).isNotBlank();
    });

    omitWhen(!model.email, () => {
      test('email', 'Enter a valid email address', () => {
        enforce(model.email ?? '').matches(
          /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        );
      });
    });

    test('password', 'Password is required', () => {
      enforce(model.password).isNotBlank();
    });

    omitWhen(!model.password, () => {
      test('password', 'Password must be at least 8 characters', () => {
        enforce(model.password ?? '').longerThanOrEquals(8);
      });

      // Advisory, non-blocking guidance: an 8–11 char password is allowed
      // but nudged toward something stronger.
      test(
        'password',
        'Consider using 12+ characters for a stronger password',
        () => {
          warn();
          enforce(model.password ?? '').longerThanOrEquals(12);
        }
      );
    });

    test('acceptTerms', 'You must accept the terms', () => {
      enforce(model.acceptTerms).isTruthy();
    });
  });
