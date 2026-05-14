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
// Note: birthDate is initialized with a Date object for type safety
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

export const initialPurchaseFormValue: PurchaseFormModel = {
  userId: '',
  firstName: '',
  lastName: '',
  birthDate: undefined,
  age: undefined,
  emergencyContact: '',
  passwords: {
    password: '',
    confirmPassword: '',
  },
  phonenumbers: {
    addValue: '',
    values: {},
  },
  gender: undefined,
  genderOther: '',
  productId: '',
  quantity: undefined,
  justification: '',
  addresses: {
    shippingAddress: {
      street: '',
      number: '',
      city: '',
      zipcode: '',
      country: '',
    },
    billingAddress: {
      street: '',
      number: '',
      city: '',
      zipcode: '',
      country: '',
    },
    shippingAddressDifferentFromBillingAddress: true,
  },
};
