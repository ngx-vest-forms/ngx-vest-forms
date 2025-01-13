import { enforce, omitWhen, only, staticSuite, test } from 'vest';
import { ROOT_FORM } from '../constants';
import { DeepPartial } from '../utils/deep-partial';
import { DeepRequired } from '../utils/deep-required';

export type FormModel = DeepPartial<{
  firstName: string;
  lastName: string;
  passwords: {
    password: string;
    confirmPassword?: string;
  };
}>;

export const formShape: DeepRequired<FormModel> = {
  firstName: '',
  lastName: '',
  passwords: {
    password: '',
    confirmPassword: '',
  },
};

export const formValidationSuite = staticSuite(
  (model: FormModel, field?: string) => {
    if (field) {
      only(field);
    }
    test(ROOT_FORM, 'Brecht his pass is not 1234', () => {
      enforce(
        model.firstName === 'Brecht' &&
          model.lastName === 'Billiet' &&
          model.passwords?.password === '1234',
      ).isFalsy();
    });

    test('firstName', 'First name is required', () => {
      enforce(model.firstName).isNotBlank();
    });
    test('lastName', 'Last name is required', () => {
      enforce(model.lastName).isNotBlank();
    });
    test('passwords.password', 'Password is required', () => {
      enforce(model.passwords?.password).isNotBlank();
    });
    omitWhen(!model.passwords?.password, () => {
      test('passwords.confirmPassword', 'Confirm password is required', () => {
        enforce(model.passwords?.confirmPassword).isNotBlank();
      });
    });
    omitWhen(
      !model.passwords?.password || !model.passwords?.confirmPassword,
      () => {
        test('passwords', 'Passwords do not match', () => {
          enforce(model.passwords?.confirmPassword).equals(
            model.passwords?.password,
          );
        });
      },
    );
  },
);

export const selectors = {
  scControlWrapperFirstName: 'sc-control-wrapper__first-name',
  inputFirstName: 'input__first-name',
  scControlWrapperLastName: 'sc-control-wrapper__last-name',
  inputLastName: 'input__last-name',
  scControlWrapperPasswords: 'sc-control-wrapper__passwords',
  scControlWrapperPassword: 'sc-control-wrapper__password',
  inputPassword: 'input__password',
  scControlWrapperConfirmPassword: 'sc-control-wrapper__confirm-password',
  inputConfirmPassword: 'input__confirm-password',
  btnSubmit: 'btn__submit',
  btnToggleValidationConfig: 'btn__toggle-validation-config',
  preFormValue: 'pre__form-value',
  preFormErrors: 'pre__form-errors',
  preFormValid: 'pre__form-valid',
  preFormDirty: 'pre__form-dirty',
};
