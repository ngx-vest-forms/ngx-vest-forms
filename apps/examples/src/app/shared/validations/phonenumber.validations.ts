import { each, enforce, test } from 'vest';
import type { PhoneNumberModel } from '../../models/phonenumber.model';

export function phonenumberValidations(
  model: PhoneNumberModel | undefined,
  field: string
): void {
  const phonenumbers = model?.values ? Object.values(model.values) : [];

  test(field, 'You should have at least one phonenumber', () => {
    enforce(phonenumbers.length).greaterThan(0);
  });
  // No key: rows are an index-keyed map with no stable id, and the form
  // directive revalidates every row whose value changes, so a removed row's
  // result does not reach the page.
  each(phonenumbers, (phonenumber, index) => {
    test(`${field}.values.${index}`, 'Should be a valid phonenumber', () => {
      enforce(phonenumber).isNotBlank();
    });
  });
}
