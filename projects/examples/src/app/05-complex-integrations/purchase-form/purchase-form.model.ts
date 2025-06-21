import { NgxDeepPartial, NgxDeepRequired } from 'ngx-vest-forms';
import { AddressModel, initialAddressForm } from '../ui/address/address.model';
import {
  PhoneNumberModel,
  initialPhoneNumberState,
} from '../ui/phone-numbers/phone-number.model';

/**
 * Defines the complete structure for the purchase form data.
 * This interface represents the single source of truth for the full data model.
 *
 * Rationale:
 * Serves as the non-optional blueprint for deriving `PurchaseFormModel` (partial type)
 * and defining `initialPurchaseFormData` (default empty structure).
 * Note that nested models (`AddressModel`, `PhoneNumberModel`) remain their respective
 * (potentially partial) types within this base structure.
 */
type BasePurchaseFormModel = {
  userId: string;
  firstName: string;
  lastName: string;
  age: number;
  emergencyContact: string;
  passwords: {
    password: string;
    confirmPassword: string;
  };
  phoneNumbers: PhoneNumberModel;
  gender: 'male' | 'female' | 'other';
  genderOther: string;
  productId: string;
  addresses: {
    shippingAddress: AddressModel;
    billingAddress: AddressModel;
    shippingAddressDifferentFromBillingAddress: boolean;
  };
};

/**
 * Represents potentially incomplete purchase form data.
 * Uses `NgxDeepPartial` to make all properties of `BasePurchaseFormModel` optional.
 *
 * Rationale:
 * This is the primary type used when interacting with the purchase form data.
 * It provides type safety for potentially incomplete data during form input or API interactions.
 *
 * @usage
 * - Form Models: `this.form.setModel(somePurchaseData as PurchaseFormModel);`
 * - Validation Arguments: `function validations(model: PurchaseFormModel | undefined): void { ... }`
 */
export type PurchaseFormModel = NgxDeepPartial<BasePurchaseFormModel>;

/**
 * Provides a default, empty template for the purchase form data.
 * Ensures all properties defined in `BasePurchaseFormModel` exist, using nested initial states.
 *
 * Rationale:
 * Guarantees a safe, fully-structured object for initializing the form state,
 * preventing runtime errors related to missing properties, especially in nested objects.
 *
 * @usage
 * - Initializing Form State: `this.form.setModel({ ...initialPurchaseFormData });`
 */
export const initialPurchaseFormData: NgxDeepRequired<BasePurchaseFormModel> = {
  userId: '',
  firstName: '',
  lastName: '',
  age: 0,
  emergencyContact: '',
  addresses: {
    // Use the initial states from the nested models
    shippingAddress: { ...initialAddressForm },
    billingAddress: { ...initialAddressForm },
    shippingAddressDifferentFromBillingAddress: true,
  },
  passwords: {
    password: '',
    confirmPassword: '',
  },
  // Use the initial state from the nested model
  phoneNumbers: { ...initialPhoneNumberState },
  gender: 'other', // Default selection
  genderOther: '',
  productId: '',
};
