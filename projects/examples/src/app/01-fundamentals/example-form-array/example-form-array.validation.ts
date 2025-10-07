import { staticSafeSuite } from 'ngx-vest-forms';
import { enforce, test } from 'vest';
import { FormArrayModel } from './example-form-array.model';

export const validationSuite = staticSafeSuite<FormArrayModel>(
  (model: Partial<FormArrayModel> = {}) => {
    // NOTE: addInterest is NOT validated in the main suite
    // It's validated separately in the component when user clicks Add

    // Validate interests array items
    const interests = model.interests ?? [];

    // CRITICAL: Always run at least one test to prevent Vest from considering
    // the form invalid when no field-level tests are registered.
    // This test validates the array itself exists and is valid.
    test('interests', 'Interests array is valid', () => {
      enforce(interests).isArray();
    });

    for (const [index, interest] of interests.entries()) {
      const path = `interests.${index}`;

      test(path, 'Interest cannot be empty', () => {
        enforce(interest).isNotEmpty();
      });

      test(path, 'Interest must be at least 2 characters', () => {
        enforce(interest).longerThan(1);
      });
    }
  },
);

// Separate validation for the addInterest field (used in component logic)
export function validateAddInterest(value: string | undefined): string[] {
  const errors: string[] = [];

  if (!value || value.trim() === '') {
    errors.push('Interest cannot be empty');
  } else if (value.trim().length < 2) {
    errors.push('Interest must be at least 2 characters');
  }

  return errors;
}
