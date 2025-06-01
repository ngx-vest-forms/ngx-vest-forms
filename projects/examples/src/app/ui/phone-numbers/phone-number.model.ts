import { DeepPartial, DeepRequired } from 'ngx-vest-forms';

/**
 * Defines the complete structure for phone number data.
 * This interface represents the single source of truth for the full data model.
 *
 * Rationale:
 * Serves as the non-optional blueprint for deriving `PhoneNumberModel` (partial type)
 * and defining `initialPhoneNumberState` (default empty structure).
 */
type BasePhoneNumberModel = {
  addValue: string;
  values: Record<string, string>;
};

/**
 * Represents potentially incomplete phone number data.
 * Uses `DeepPartial` to make all properties of `BasePhoneNumberModel` optional.
 *
 * Rationale:
 * This is the primary type used when interacting with phone number data in forms.
 * It provides type safety for potentially incomplete data during form input.
 *
 * @usage
 * - Form Models: `this.form.createControlGroup(validations).setModel(somePhoneNumbers as PhoneNumberModel);`
 * - Nested within other models: `phoneNumbers: PhoneNumberModel;`
 */
export type PhoneNumberModel = DeepPartial<BasePhoneNumberModel>;

/**
 * Provides a default, empty template for phone number data.
 * Ensures all properties defined in `BasePhoneNumberModel` exist.
 *
 * Rationale:
 * Guarantees a safe, fully-structured object for initializing form state,
 * preventing runtime errors related to missing properties.
 *
 * @usage
 * - Initializing Form State: `phoneNumbers: { ...initialPhoneNumberState }`
 * - Default Values in nested structures.
 */
export const initialPhoneNumberState: DeepRequired<BasePhoneNumberModel> = {
  addValue: '',
  values: {
    '0': '',
  },
};
