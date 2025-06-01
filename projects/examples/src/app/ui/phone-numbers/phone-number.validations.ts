import { each, enforce, test } from 'vest';
import { PhoneNumberModel } from './phone-number.model';

export function phoneNumberValidations(
  model: PhoneNumberModel | undefined,
  field: string,
): void {
  const phoneNumbers = model?.values ? Object.values(model.values) : [];

  test(`${field}`, 'You should have at least one phonenumber', () => {
    enforce(phoneNumbers.length).greaterThan(0);
  });
  each(phoneNumbers, (phoneNumber, index) => {
    test(`${field}.values.${index}`, 'Should be a valid phonenumber', () => {
      enforce(phoneNumber).isNotBlank();
    });
  });
}
