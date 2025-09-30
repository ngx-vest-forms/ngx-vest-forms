import { enforce, only, staticSuite, test } from 'vest';
import { FormArrayModel } from './example-form-array.model';

export const validationSuite = staticSuite(
  (model: Partial<FormArrayModel> | undefined, field?: string) => {
    if (field) {
      only(field); // For performance - only validate the active field
    }

    // Note: addInterest field is NOT validated here.
    // It's a transient input field validated by component logic.
    // Vest focuses on validating the actual data (interests array items).

    const currentModel = model ?? { interests: [] };
    const interests = currentModel.interests ?? [];
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
