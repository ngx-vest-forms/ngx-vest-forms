import { FormFieldName, NgxTypedVestSuite, ROOT_FORM } from 'ngx-vest-forms';
import { fromEvent, lastValueFrom, takeUntil } from 'rxjs';
import { enforce, omitWhen, only, staticSuite, test } from 'vest';
import { PurchaseFormModel } from '../models/purchase-form.model';
import { SwapiService } from '../swapi.service';
import { addressValidations } from './address.validations';
import { phonenumberValidations } from './phonenumber.validations';

export const createPurchaseValidationSuite = (
  swapiService: SwapiService
): NgxTypedVestSuite<PurchaseFormModel> => {
  return staticSuite(
    (model: PurchaseFormModel, field?: FormFieldName<PurchaseFormModel>) => {
      only(field);

      test(ROOT_FORM, 'Brecht is not 30 anymore', () => {
        enforce(
          model.firstName === 'Brecht' &&
            model.lastName === 'Billiet' &&
            model.age === 30
        ).isFalsy();
      });

      omitWhen(!model.userId, () => {
        test('userId', 'userId is already taken', async ({ signal }) => {
          const exists = await lastValueFrom(
            swapiService
              .userIdExists(model.userId as string)
              .pipe(takeUntil(fromEvent(signal, 'abort')))
          );
          if (exists) {
            return Promise.reject();
          }
        });
      });

      test('firstName', 'First name is required', () => {
        enforce(model.firstName).isNotBlank();
      });
      test('lastName', 'Last name is required', () => {
        enforce(model.lastName).isNotBlank();
      });
      test('birthDate', 'Birth date is required', () => {
        enforce(model.birthDate).isNotEmpty();
      });
      test('age', 'Age is required', () => {
        enforce(model.age).isNotBlank();
      });
      omitWhen((model.age || 0) >= 18, () => {
        test('emergencyContact', 'Emergency contact is required', () => {
          enforce(model.emergencyContact).isNotBlank();
        });
      });
      test('gender', 'Gender is required', () => {
        enforce(model.gender).isNotBlank();
      });
      omitWhen(model.gender !== 'other', () => {
        test(
          'genderOther',
          'If gender is other, you have to specify the gender',
          () => {
            enforce(model.genderOther).isNotBlank();
          }
        );
      });
      test('productId', 'Product is required', () => {
        enforce(model.productId).isNotBlank();
      });
      test('quantity', 'Quantity is required', () => {
        enforce(model.quantity).isNotBlank();
      });
      test('quantity', 'Quantity must be at least 1', () => {
        enforce(model.quantity).greaterThan(0);
      });
      omitWhen((model.quantity || 0) <= 5, () => {
        test(
          'justification',
          'Justification is required when quantity exceeds 5',
          () => {
            enforce(model.justification).isNotBlank();
          }
        );
      });
      addressValidations(
        model.addresses?.billingAddress,
        'addresses.billingAddress'
      );
      omitWhen(
        !model.addresses?.shippingAddressDifferentFromBillingAddress,
        () => {
          addressValidations(
            model.addresses?.shippingAddress,
            'addresses.shippingAddress'
          );
          test('addresses', 'The addresses appear to be the same', () => {
            enforce(JSON.stringify(model.addresses?.billingAddress)).notEquals(
              JSON.stringify(model.addresses?.shippingAddress)
            );
          });
        }
      );
      test('passwords.password', 'Password is not filled in', () => {
        enforce(model.passwords?.password).isNotBlank();
      });
      omitWhen(!model.passwords?.password, () => {
        test(
          'passwords.confirmPassword',
          'Confirm password is not filled in',
          () => {
            enforce(model.passwords?.confirmPassword).isNotBlank();
          }
        );
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
      phonenumberValidations(model?.phonenumbers, 'phonenumbers');
    }
  );
};
