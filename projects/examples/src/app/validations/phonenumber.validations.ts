import { each, enforce, test } from 'vest';
import { PhonenumberModel } from '../models/phonenumber.model';

export function phonenumberValidations(
  model: PhonenumberModel | undefined,
  field: string,
): void {
  const phonenumbers = model?.values ? Object.values(model.values) : [];

  test(`${field}`, 'You should have at least one phonenumber', () => {
    enforce(phonenumbers.length).greaterThan(0);
  });
  each(phonenumbers, (phonenumber, index) => {
    test(`${field}.values.${index}`, 'Should be a valid phonenumber', () => {
      enforce(phonenumber).isNotBlank();
    });
  });
}
