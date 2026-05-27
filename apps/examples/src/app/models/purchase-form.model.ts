import { NgxDeepPartial, NgxDeepRequired } from 'ngx-vest-forms';
import { AddressModel, addressContract } from './address.model';
import { PhoneNumberModel, phoneNumberContract } from './phonenumber.model';

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

// Low-dependency fallback contract for an example that does not already own a
// schema. If your app already has a Standard Schema contract, prefer passing
// that directly to [formContract].
// Note: birthDate is initialized with a Date object for type safety.
export const purchaseFormContract: NgxDeepRequired<PurchaseFormModel> = {
  userId: '',
  firstName: '',
  lastName: '',
  birthDate: new Date(), // Initialize with Date object for type safety
  age: 0,
  emergencyContact: '',
  addresses: {
    shippingAddress: addressContract,
    billingAddress: addressContract,
    shippingAddressDifferentFromBillingAddress: true,
  },
  passwords: {
    password: '',
    confirmPassword: '',
  },
  phonenumbers: phoneNumberContract,
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
