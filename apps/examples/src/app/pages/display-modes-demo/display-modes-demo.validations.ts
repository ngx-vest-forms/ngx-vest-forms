import { type NgxVestSuite } from 'ngx-vest-forms';
import { create, enforce, test, warn } from 'vest';
import { DisplayModesDemoModel } from '../../models/display-modes-demo.model';

export const displayModesDemoSuite: NgxVestSuite<DisplayModesDemoModel> =
  create((model: DisplayModesDemoModel) => {
    // Error validations
    test('alwaysError', 'This field is required', () => {
      enforce(model.alwaysError).isNotBlank();
    });

    test('dirtyError', 'This field is required', () => {
      enforce(model.dirtyError).isNotBlank();
    });

    test('submitError', 'This field is required', () => {
      enforce(model.submitError).isNotBlank();
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
  });
