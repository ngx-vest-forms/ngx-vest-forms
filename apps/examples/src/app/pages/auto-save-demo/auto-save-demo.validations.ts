import type { FormFieldName, NgxVestSuite } from 'ngx-vest-forms';
import { create, enforce, omitWhen, test, warn } from 'vest';
import { EMAIL_PATTERN } from '../../shared/validations/email.validations';
import type { AutoSaveDemoModel } from './auto-save-demo.model';

type RulesByField = Partial<Record<FormFieldName<AutoSaveDemoModel>, string[]>>;

export const autoSaveDemoValidationErrorRulesByField = {
  projectName: [
    'Project name is required',
    'Project name must be at least 3 characters',
  ],
  quantity: ['Quantity is required when a justification is provided'],
  quantityJustification: [
    'Justification is required when quantity is provided',
  ],
  preferredContactMethod: ['Choose how draft updates should reach you'],
  email: [
    'Email is required when email updates are selected',
    'Enter a valid email address',
  ],
} satisfies RulesByField;

export const autoSaveDemoValidationWarningRulesByField = {
  notes: ['Add a bit more detail so collaborators understand this draft later'],
} satisfies RulesByField;

export const autoSaveDemoSuite: NgxVestSuite<AutoSaveDemoModel> = create(
  (model: AutoSaveDemoModel) => {
    test('projectName', 'Project name is required', () => {
      enforce(model.projectName).isNotBlank();
    });

    test('projectName', 'Project name must be at least 3 characters', () => {
      enforce(model.projectName).longerThanOrEquals(3);
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
        'Quantity is required when a justification is provided',
        () => {
          enforce(model.quantity).isNotBlank();
        }
      );
    });

    test(
      'preferredContactMethod',
      'Choose how draft updates should reach you',
      () => {
        enforce(model.preferredContactMethod).isNotBlank();
      }
    );

    omitWhen(model.preferredContactMethod !== 'email', () => {
      test('email', 'Email is required when email updates are selected', () => {
        enforce(model.email).isNotBlank();
      });

      test('email', 'Enter a valid email address', () => {
        enforce(model.email ?? '').matches(EMAIL_PATTERN);
      });
    });

    omitWhen(!model.notes, () => {
      test(
        'notes',
        'Add a bit more detail so collaborators understand this draft later',
        () => {
          warn();
          enforce(model.notes).longerThanOrEquals(20);
        }
      );
    });
  }
);
