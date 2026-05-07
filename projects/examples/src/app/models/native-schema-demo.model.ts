import { NgxDeepPartial, NgxDeepRequired } from 'ngx-vest-forms';

export type NativeSchemaDemoModel = NgxDeepPartial<{
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  address: {
    street: string;
    city: string;
    zipCode: string;
  };
}>;

export const nativeSchemaDemoShape: NgxDeepRequired<NativeSchemaDemoModel> = {
  firstName: '',
  lastName: '',
  email: '',
  age: 0,
  address: {
    street: '',
    city: '',
    zipCode: '',
  },
};
