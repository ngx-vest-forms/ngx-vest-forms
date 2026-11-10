import { enforce, test } from 'vest';
import type { AddressModel } from '../models/address.model';

export function addressValidations(
  model: AddressModel | undefined,
  // Plain string: the prefix is a path in each caller's own model, and a
  // FieldPath<T> here would make every caller spell out T.
  field: string
): void {
  test(`${field}.street`, 'Street is required', () => {
    enforce(model?.street).isNotBlank();
  });
  test(`${field}.city`, 'City is required', () => {
    enforce(model?.city).isNotBlank();
  });
  test(`${field}.zipcode`, 'Zipcode is required', () => {
    enforce(model?.zipcode).isNotBlank();
  });
  test(`${field}.number`, 'Number is required', () => {
    enforce(model?.number).isNotBlank();
  });
  test(`${field}.country`, 'Country is required', () => {
    enforce(model?.country).isNotBlank();
  });
}
