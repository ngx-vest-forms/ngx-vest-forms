import { NgxDeepPartial, NgxDeepRequired } from 'ngx-vest-forms';

export type AddressModel = NgxDeepPartial<{
  street: string;
  number: string;
  city: string;
  zipcode: string;
  country: string;
}>;
export const addressShape: NgxDeepRequired<AddressModel> = {
  street: '',
  number: '',
  city: '',
  zipcode: '',
  country: '',
};
