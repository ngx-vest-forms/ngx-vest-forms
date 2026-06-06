import { type NgxVestSuite } from 'ngx-vest-forms';
import { create, enforce, omitWhen, test, warn } from 'vest';
import { StarterFormModel } from '../../models/starter-form.model';

/**
 * The canonical Vest suite for the starter form.
 *
 * Suites are plain Vest specs — they have no Angular dependency and can be
 * unit-tested in isolation by calling `starterFormSuite(model)` directly.
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
        enforce(model.email ?? '').matches(
          /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        );
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
