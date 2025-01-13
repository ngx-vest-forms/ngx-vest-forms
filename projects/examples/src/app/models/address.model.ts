import { DeepPartial, DeepRequired } from 'ngx-vest-forms';

export type AddressModel = DeepPartial<{
  street: string;
  number: string;
  city: string;
  zipcode: string;
  country: string;
}>;
export const addressShape: DeepRequired<AddressModel> = {
  street: '',
  number: '',
  city: '',
  zipcode: '',
  country: '',
};
