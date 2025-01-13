import { DeepPartial, DeepRequired } from 'ngx-vest-forms';
import { AddressModel, addressShape } from './address.model';
import { PhonenumberModel, phonenumberShape } from './phonenumber.model';

export type PurchaseFormModel = DeepPartial<{
  userId: string;
  firstName: string;
  lastName: string;
  age: number;
  emergencyContact: string;
  passwords: {
    password: string;
    confirmPassword?: string;
  };
  phonenumbers: PhonenumberModel;
  gender: 'male' | 'female' | 'other';
  genderOther: string;
  productId: string;
  addresses: {
    shippingAddress: AddressModel;
    billingAddress: AddressModel;
    shippingAddressDifferentFromBillingAddress: boolean;
  };
}>;

export const purchaseFormShape: DeepRequired<PurchaseFormModel> = {
  userId: '',
  firstName: '',
  lastName: '',
  age: 0,
  emergencyContact: '',
  addresses: {
    shippingAddress: addressShape,
    billingAddress: addressShape,
    shippingAddressDifferentFromBillingAddress: true,
  },
  passwords: {
    password: '',
    confirmPassword: '',
  },
  phonenumbers: phonenumberShape,
  gender: 'other',
  genderOther: '',
  productId: '',
};
