import { test } from "vitest";
import { ROOT_FORM } from 'ngx-vest-forms';
import { fromEvent, lastValueFrom, takeUntil } from 'rxjs';
import { enforce, omitWhen, only, staticSuite, test } from 'vest';
import { PurchaseFormModel } from '../models/purchase-form.model';
import { SwapiService } from '../swapi.service';
import { addressValidations } from './address.validations';
import { phonenumberValidations } from './phonenumber.validations';

export const createPurchaseValidationSuite = (swapiService: SwapiService) => {
  return staticSuite((model: PurchaseFormModel, field?: string) => {
    if (field) {
      only(field);
    }
    test(ROOT_FORM, 'Brecht is not 30 anymore', () => {
      enforce(
        model.firstName === 'Brecht' &&
          model.lastName === 'Billiet' &&
          model.age === 30,
      ).isFalsy();
    });

    omitWhen(!model.userId, () => {
      test('userId', 'userId is already taken', async ({ signal }) => {
        await lastValueFrom(
          swapiService
            .searchUserById(model.userId as string)
            .pipe(takeUntil(fromEvent(signal, 'abort'))),
        ).then(() => {
          throw undefined;
        });
      });
    });

    test('firstName', 'First name is required', () => {
      enforce(model.firstName).isNotBlank();
    });
    test('lastName', 'Last name is required', () => {
      enforce(model.lastName).isNotBlank();
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
        },
      );
    });
    test('productId', 'Product is required', () => {
      enforce(model.productId).isNotBlank();
    });
    addressValidations(
      model.addresses?.billingAddress,
      'addresses.billingAddress',
    );
    omitWhen(
      !model.addresses?.shippingAddressDifferentFromBillingAddress,
      () => {
        addressValidations(
          model.addresses?.shippingAddress,
          'addresses.shippingAddress',
        );
        test('addresses', 'The addresses appear to be the same', () => {
          enforce(JSON.stringify(model.addresses?.billingAddress)).notEquals(
            JSON.stringify(model.addresses?.shippingAddress),
          );
        });
      },
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
        },
      );
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
    phonenumberValidations(model?.phonenumbers, 'phonenumbers');
  });
};
