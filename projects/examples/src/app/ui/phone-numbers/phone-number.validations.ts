import { enforce, only, staticSuite, test } from 'vest';
import { PhoneNumberModel } from './phone-number.model';
import { PHONE_NUMBER_REGEX } from './phone-number.utils';

export const phoneNumberValidations = staticSuite(
  (data: Partial<PhoneNumberModel> = {}, field?: string) => {
    only(field); // Critical for performance

    // Only validate the input field if it's being actively edited
    // Skip validation if the field is empty after a successful add operation
    if (
      field === 'addValue' &&
      data.addValue !== undefined &&
      data.addValue.trim().length > 0
    ) {
      test('addValue', 'Phone number must be valid format', () => {
        enforce(data.addValue).isNotEmpty().matches(PHONE_NUMBER_REGEX);
      });

      // Check for duplicate phone numbers when adding
      test('addValue', 'This phone number already exists', () => {
        const existingNumbers = Object.values(data.values || {});
        const newNumber = data.addValue?.trim();
        if (newNumber && existingNumbers.includes(newNumber)) {
          throw new Error('Phone number already exists');
        }
      });
    }

    // Validate existing phone numbers in the list
    const phoneNumbers = Object.entries(data.values || {});
    for (const [key, phoneNumber] of phoneNumbers) {
      test(`values.${key}`, 'Phone number cannot be empty', () => {
        enforce(phoneNumber).isNotEmpty();
      });

      test(`values.${key}`, 'Phone number must be valid format', () => {
        enforce(phoneNumber).isNotEmpty().matches(PHONE_NUMBER_REGEX);
      });
    }
  },
);
