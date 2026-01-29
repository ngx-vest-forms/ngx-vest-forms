import { enforce, only, staticSuite, test, warn } from 'vest';
import { DisplayModesDemoModel } from '../models/display-modes-demo.model';

export const displayModesDemoSuite = staticSuite(
  (model: DisplayModesDemoModel, field?: string) => {
    // CRITICAL: Must call unconditionally to prevent Vest execution tracking corruption
    only(field);

    // Error validations
    test('alwaysError', 'This field is required', () => {
      enforce(model.alwaysError).isNotBlank();
    });

    test('dirtyError', 'This field is required', () => {
      enforce(model.dirtyError).isNotBlank();
    });

    // Warning validations
    test('alwaysWarning', 'Username should be at least 5 characters', () => {
      warn();
      enforce(model.alwaysWarning).longerThanOrEquals(5);
    });

    test('dirtyWarning', 'Username should be at least 5 characters', () => {
      warn();
      enforce(model.dirtyWarning).longerThanOrEquals(5);
    });

    test('touchWarning', 'Username should be at least 5 characters', () => {
      warn();
      enforce(model.touchWarning).longerThanOrEquals(5);
    });
  }
);
