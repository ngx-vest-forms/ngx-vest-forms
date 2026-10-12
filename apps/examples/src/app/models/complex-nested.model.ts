import { NgxDeepPartial, NgxDeepRequired } from 'ngx-vest-forms';
import { AddressModel, addressContract } from './address.model';

/** A single team member entry inside the keyed `teamMembers` record. */
export type TeamMemberModel = {
  fullName: string;
  email: string;
  role: string;
};

/**
 * Team registration form.
 *
 * - `company` is a nested `ngModelGroup` containing a name plus a deeply
 *   nested `address` group rendered by the reusable `ngx-address`.
 * - `teamMembers` is a dynamic, repeatable collection stored as a record
 *   keyed by a stable id (mirrors the purchase form's keyed-record pattern
 *   so Vest field paths stay stable across add/remove).
 */
export type ComplexNestedModel = NgxDeepPartial<{
  company: {
    name: string;
    address: AddressModel;
  };
  teamMembers: Record<string, TeamMemberModel>;
}>;

/**
 * Form contract (NgxDeepRequired) mirroring the model shape. The record uses a
 * single representative key so the directive can validate `name` attributes
 * against the expected nested structure (same approach as
 * `phoneNumberContract` in purchase-form.model.ts).
 */
export const complexNestedContract: NgxDeepRequired<ComplexNestedModel> = {
  company: {
    name: '',
    address: addressContract,
  },
  teamMembers: {
    '0': {
      fullName: '',
      email: '',
      role: '',
    },
  },
};

export const initialComplexNestedValue: ComplexNestedModel = {
  company: {
    name: '',
    address: {
      street: '',
      number: '',
      city: '',
      zipcode: '',
      country: '',
    },
  },
  teamMembers: {
    '0': {
      fullName: '',
      email: '',
      role: '',
    },
  },
};
