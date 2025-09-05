import {
  InferSchemaType,
  ngxModelToStandardSchema,
} from 'ngx-vest-forms/schemas';
import { fromEvent, lastValueFrom, takeUntil } from 'rxjs';
import {
  enforce,
  omitWhen,
  only,
  staticSuite,
  StaticSuite,
  SuiteResult,
  test,
} from 'vest';
import { SwapiService } from '../../services/swapi.service';
import { addressValidations } from '../../ui/address/address.validations';
import { phoneNumberValidations } from '../../ui/phone-numbers/phone-number.validations';
import { initialPurchaseFormData } from './purchase-form.model';

// Define the inferred type directly from the model template, without assigning a runtime variable
type PurchaseFormType = InferSchemaType<
  ReturnType<typeof ngxModelToStandardSchema<typeof initialPurchaseFormData>>
>;

// Define the type for the validation callback function
// Export the type so it can be imported elsewhere
export type PurchaseValidationCallback = (
  model: PurchaseFormType,
  field?: keyof PurchaseFormType | string,
) => SuiteResult<string, string>;

// Revert the return type annotation to the original structure
export const createPurchaseValidationSuite = (
  rootFormKey = 'rootForm',
  swapiService: SwapiService,
): StaticSuite<
  string,
  string,
  (model: PurchaseFormType, field?: keyof PurchaseFormType | string) => void
> => {
  // Revert the type argument for staticSuite
  return staticSuite<
    string,
    string,
    (model: PurchaseFormType, field?: keyof PurchaseFormType | string) => void
  >((model: PurchaseFormType, field?: keyof PurchaseFormType | string) => {
    if (field) {
      only(field as string); // Cast to string as `only` typically expects a flat string path
    }
    test(rootFormKey, 'Brecht is not 30 anymore', () => {
      enforce(
        model.firstName === 'Brecht' &&
          model.lastName === 'Billiet' &&
          model.age === 30,
      ).isFalsy();
    });

    omitWhen(!model.userId, () => {
      test('userId', 'userId is already taken', async ({ signal }) => {
        try {
          await lastValueFrom(
            swapiService
              .searchUserById(model.userId)
              .pipe(takeUntil(fromEvent(signal, 'abort'))),
          );
          // If the request succeeds, the user ID exists, so throw an error
          throw new Error('User ID is already taken');
        } catch (error: unknown) {
          // If lastValueFrom throws (e.g., 404), or if we threw above, handle it.
          // We only want Vest to fail if the ID *is* taken.
          // Check if error is an instance of Error before accessing message
          if (
            error instanceof Error &&
            error.message === 'User ID is already taken'
          ) {
            throw error; // Re-throw the specific error for Vest
          }
          // Otherwise, assume the ID is available (e.g., 404 means not found)
          // Vest considers a test passing if no error is thrown.
        }
      });
    });

    test('firstName', 'First name is required', () => {
      enforce(model.firstName).isNotBlank();
    });
    test('lastName', 'Last name is required', () => {
      enforce(model.lastName).isNotBlank();
    });
    test('age', 'Age is required', () => {
      enforce(model.age).isNotNull().isNumeric();
    });
    omitWhen((model.age ?? 0) >= 18, () => {
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
    // Pass potentially partial address model, addressValidations should handle undefined checks
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
          // Ensure both addresses exist before comparing
          if (
            model.addresses?.billingAddress &&
            model.addresses?.shippingAddress
          ) {
            enforce(JSON.stringify(model.addresses.billingAddress)).notEquals(
              JSON.stringify(model.addresses.shippingAddress),
            );
          }
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
    // Pass potentially partial phoneNumbers model
    phoneNumberValidations(model?.phoneNumbers, 'phoneNumbers');
  });
};
