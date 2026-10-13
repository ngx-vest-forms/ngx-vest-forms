import { type NgxVestSuite } from 'ngx-vest-forms';
import { create, enforce, omitWhen, test, warn } from 'vest';
import { CustomControlsModel } from '../../models/custom-controls.model';

/**
 * Vest suite for the Custom Controls demo.
 *
 * The suite is a plain Vest spec with no Angular dependency — the values it
 * validates happen to come from `ControlValueAccessor` controls, but the suite
 * neither knows nor cares. Unit-test it directly: `customControlsSuite(model)`.
 */
export const customControlsSuite: NgxVestSuite<CustomControlsModel> = create(
  (model: CustomControlsModel) => {
    test('rating', 'Pick a rating', () => {
      enforce(model.rating != null && model.rating >= 1).isTruthy();
    });

    omitWhen(!model.rating, () => {
      test('rating', 'Rating must be between 1 and 5', () => {
        enforce(model.rating ?? 0).isBetween(1, 5);
      });
    });

    test('experience', 'Select your experience level', () => {
      enforce(model.experience).isNotBlank();
    });

    test('tags', 'Add at least one tag', () => {
      enforce(model.tags ?? []).longerThanOrEquals(1);
    });

    // Advisory, non-blocking guidance: lots of tags still submits fine.
    omitWhen((model.tags ?? []).length === 0, () => {
      test('tags', 'Five tags is plenty — consider trimming the list', () => {
        warn();
        enforce(model.tags ?? []).shorterThanOrEquals(5);
      });
    });
  }
);
