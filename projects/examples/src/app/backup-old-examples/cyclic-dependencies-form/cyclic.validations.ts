import { FieldKey } from 'ngx-vest-forms';
import { enforce, omitWhen, only, staticSuite, test } from 'vest';
import { CyclicFormModel } from './cyclic-dependencies-form.model';

/**
 * Default data for the cyclic form model
 */
const defaultCyclicFormData: CyclicFormModel = {
  amount: null,
  description: null,
};

/**
 * Creates a validation suite for the CyclicFormModel
 * Demonstrates handling cyclic dependencies between form fields
 *
 * @returns A NgxVestSuite configured for CyclicFormModel
 */
export const createCyclicDependencyFormValidationSuite = () =>
  staticSuite(
    (data = defaultCyclicFormData, field?: FieldKey<CyclicFormModel>) => {
      console.log('Cyclic validation suite running');
      // Optimize validation to only run for the specified field
      if (field) only(field);

      // Conditional validation for amount field
      omitWhen(!data.description, () => {
        test('amount', 'Amount is required if description is provided.', () => {
          console.log('Validating amount');
          enforce(data.amount).isNotEmpty();
        });
      });

      // Conditional validation for description field
      omitWhen(!data.amount, () => {
        test(
          'description',
          'Description is required if amount is provided.',
          () => {
            console.log('Validating description');
            enforce(data.description).isNotEmpty();
          },
        );
      });
    },
  );
