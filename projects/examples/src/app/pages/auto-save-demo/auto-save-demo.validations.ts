import { enforce, omitWhen, only, staticSuite, test, warn } from 'vest';
import { AutoSaveDemoModel } from '../../models/auto-save-demo.model';

export const autoSaveDemoValidationErrorRulesByField: Record<string, string[]> = {
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
};

export const autoSaveDemoValidationWarningRulesByField: Record<
  string,
  string[]
> = {
  notes: ['Add a bit more detail so collaborators understand this draft later'],
};

export const autoSaveDemoSuite = staticSuite(
  (model: AutoSaveDemoModel, field?: string) => {
    only(field);

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

    test('preferredContactMethod', 'Choose how draft updates should reach you', () => {
      enforce(model.preferredContactMethod).isNotBlank();
    });

    omitWhen(model.preferredContactMethod !== 'email', () => {
      test('email', 'Email is required when email updates are selected', () => {
        enforce(model.email).isNotBlank();
      });

      test('email', 'Enter a valid email address', () => {
        enforce(model.email ?? '').matches(
          /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        );
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
