import { AddressModel, addressShape } from './address.model';
import { PhonenumberModel, phonenumberShape } from './phonenumber.model';
import {
  NgxDeepPartial,
  NgxDeepRequired,
  NgxFormCompatibleDeepRequired,
} from 'ngx-vest-forms';

export type PurchaseFormModel = NgxDeepPartial<{
  userId: string;
  firstName: string;
  lastName: string;
  birthDate: Date;
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
  quantity: number;
  justification: string;
  addresses: {
    shippingAddress: AddressModel;
    billingAddress: AddressModel;
    shippingAddressDifferentFromBillingAddress: boolean;
  };
}>;

// Using NgxDeepRequired for the shape (standard approach)
// Note: birthDate will accept empty string in the form initialization
export const purchaseFormShape: NgxDeepRequired<PurchaseFormModel> = {
  userId: '',
  firstName: '',
  lastName: '',
  birthDate: new Date(), // Initialize with Date object for type safety
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
  quantity: 0,
  justification: '',
};
