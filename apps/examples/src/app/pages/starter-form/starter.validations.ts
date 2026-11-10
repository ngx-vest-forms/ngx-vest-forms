import type { NgxDeepPartial, NgxVestSuite } from 'ngx-vest-forms';
import { create, enforce, omitWhen, test, warn } from 'vest';

/**
 * The form model. `NgxDeepPartial` is the recommended shape: every field is
 * optional because the template owns the truth and fields fill in as the user
 * types.
 */
export type StarterFormModel = NgxDeepPartial<{
  name: string;
  email: string;
  subject: string;
  message: string;
}>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The canonical Vest suite for the starter form.
 *
 * Suites are plain Vest specs — they have no Angular dependency and can be
 * unit-tested in isolation by calling `starterFormSuite.run(model)` directly.
 */
export const starterFormSuite: NgxVestSuite<StarterFormModel> = create(
  (model: StarterFormModel) => {
    test('name', 'Name is required', () => {
      enforce(model.name).isNotBlank();
    });

    test('email', 'Email is required', () => {
      enforce(model.email).isNotBlank();
    });

    omitWhen(!model.email, () => {
      test('email', 'Enter a valid email address', () => {
        enforce(model.email ?? '').matches(EMAIL_PATTERN);
      });
    });

    test('subject', 'Subject is required', () => {
      enforce(model.subject).isNotBlank();
    });

    test('message', 'Message is required', () => {
      enforce(model.message).isNotBlank();
    });

    // Advisory, non-blocking guidance: a short message is allowed but nudged.
    omitWhen(!model.message, () => {
      test(
        'message',
        'A little more detail helps us respond faster (aim for 20+ characters)',
        () => {
          warn();
          enforce(model.message).longerThanOrEquals(20);
        }
      );
    });
  }
);
