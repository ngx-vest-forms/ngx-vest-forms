import { enforce, only, staticSuite, test } from 'vest';

/**
 * Defines the shape of the data for the phone numbers form.
 * Now using a Record<string, string> for phoneNumbers to match the component.
 */
export type PhoneNumbersFormData = {
  phoneNumbers?: Record<string, string>;
};

const defaultPhoneNumbersFormData: PhoneNumbersFormData = { phoneNumbers: {} };

/**
 * Creates a validation suite for phone numbers form
 *
 * @param rootFormKey - The key used for root form validations, provided by the component
 * @returns A Vest validation suite for the phone numbers form
 */
export const createPhoneNumbersValidationSuite = (rootFormKey = 'rootForm') =>
  staticSuite(
    (
      data: PhoneNumbersFormData = defaultPhoneNumbersFormData,
      field?: keyof PhoneNumbersFormData | string, // Allow string for indexed access like 'phoneNumbers.0'
    ) => {
      only(field as string); // Cast field to string for `only`

      const numbers = Object.values(data.phoneNumbers ?? {});

      // Root form validation: Checks if at least one phone number is provided.
      test(rootFormKey, 'At least one phone number is required.', () => {
        enforce(numbers.length).greaterThan(0);
      });

      let index = 0;
      for (const phoneNumber of numbers) {
        test(`phoneNumbers.${index}`, 'Phone number cannot be empty', () => {
          enforce(phoneNumber).isNotEmpty();
        });
        // Add more specific phone number validations here if needed, e.g., format
        // test(`phoneNumbers.${index}`, 'Phone number must be a valid format', () => {
        //   enforce(phoneNumber).matches(/^?[0-9]{10,14}$/); // Example regex
        // });
        index++;
      }
    },
  );
