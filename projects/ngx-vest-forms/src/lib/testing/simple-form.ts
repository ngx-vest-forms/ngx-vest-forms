import { create, enforce, omitWhen, test } from 'vest';
import type { NgxDeepPartial, NgxDeepRequired } from '../../public-api';
import { ROOT_FORM } from '../constants';

export type FormModel = NgxDeepPartial<{
  firstName: string;
  lastName: string;
  passwords: {
    password: string;
    confirmPassword?: string;
  };
}>;

export const formShape: NgxDeepRequired<FormModel> = {
  firstName: '',
  lastName: '',
  passwords: {
    password: '',
    confirmPassword: '',
  },
};

export const formValidationSuite = create((model: FormModel) => {
  test(ROOT_FORM, 'Brecht his pass is not 1234', () => {
    enforce(
      model.firstName === 'Brecht' &&
        model.lastName === 'Billiet' &&
        model.passwords?.password === '1234'
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
          model.passwords?.password
        );
      });
    }
  );
});

export const selectors = {
  scControlWrapperFirstName: 'ngx-control-wrapper__first-name',
  ngxControlWrapperFirstName: 'ngx-control-wrapper__first-name',
  inputFirstName: 'input__first-name',
  scControlWrapperLastName: 'ngx-control-wrapper__last-name',
  ngxControlWrapperLastName: 'ngx-control-wrapper__last-name',
  inputLastName: 'input__last-name',
  scControlWrapperPasswords: 'ngx-control-wrapper__passwords',
  ngxControlWrapperPasswords: 'ngx-control-wrapper__passwords',
  scControlWrapperPassword: 'ngx-control-wrapper__password',
  ngxControlWrapperPassword: 'ngx-control-wrapper__password',
  inputPassword: 'input__password',
  scControlWrapperConfirmPassword: 'ngx-control-wrapper__confirm-password',
  ngxControlWrapperConfirmPassword: 'ngx-control-wrapper__confirm-password',
  inputConfirmPassword: 'input__confirm-password',
  btnSubmit: 'btn__submit',
  btnToggleValidationConfig: 'btn__toggle-validation-config',
  preFormValue: 'pre__form-value',
  preFormErrors: 'pre__form-errors',
  preFormValid: 'pre__form-valid',
  preFormDirty: 'pre__form-dirty',
};
