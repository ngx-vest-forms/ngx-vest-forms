import { NgxDeepPartial, NgxDeepRequired } from 'ngx-vest-forms';
import { AddressModel, addressShape } from './address.model';
import { PhoneNumberModel, phoneNumberShape } from './phonenumber.model';

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
  phonenumbers: PhoneNumberModel;
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
  phonenumbers: phoneNumberShape,
  gender: 'other',
  genderOther: '',
  productId: '',
  quantity: 0,
  justification: '',
};
