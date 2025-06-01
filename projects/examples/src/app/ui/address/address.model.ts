import { DeepPartial, DeepRequired } from 'ngx-vest-forms';

/**
 * Defines the complete structure of an address with all properties required.
 * This interface represents the single source of truth for the full data model.
 *
 * Rationale:
 * While not directly exported or used in most component logic, defining this base
 * interface provides a clear, non-optional blueprint. It serves as the foundation
 * for deriving the `AddressModel` (partial type) and defining the
 * `addressModelTemplate` (default empty structure), ensuring consistency.
 */
type BaseAddressModel = {
  street: string;
  number: string;
  city: string;
  zipcode: string;
  country: string;
};

/**
 * Represents a potentially incomplete address object.
 * Uses `DeepPartial` to make all properties of `BaseAddressModel` optional.
 *
 * Rationale:
 * This is the primary type used when interacting with address data in components
 * and forms. Real-world data (e.g., from API responses, user input) is often
 * incomplete. Using `DeepPartial` provides type safety, allowing the compiler
 * to catch potential errors if you try to use a property that might not exist,
 * without needing excessive null/undefined checks in your component logic.
 *
 * @usage
 * - Component Inputs: `@Input() address?: AddressModel;`
 * - Form Models: `this.form.createControlGroup(validations).setModel(someAddress as AddressModel);`
 * - Validation Arguments: `function validations(model: AddressModel | undefined): void { ... }`
 */
export type AddressModel = DeepPartial<BaseAddressModel>;

/**
 * Provides a default, empty template for an address object.
 * Ensures all properties defined in `BaseAddressModel` exist, initialized with empty strings.
 *
 * Rationale:
 * While defining three related types/constants might seem like boilerplate, this template
 * solves a common problem: safe initialization. When creating a new form or providing
 * a default input, using `{ ...addressModelTemplate }` guarantees that the object
 * has the complete structure expected, preventing runtime errors like "cannot read
 * property 'street' of undefined" if you were to initialize with an incomplete object.
 * It centralizes the creation of a safe, empty default.
 *
 * @usage
 * - Initializing Form State: `this.form.createControlGroup(validations).setModel({ ...addressModelTemplate });`
 * - Default Values: `@Input() address: AddressModel = { ...addressModelTemplate };`
 */
export const initialAddressForm: DeepRequired<BaseAddressModel> = {
  street: '',
  number: '',
  city: '',
  zipcode: '',
  country: '',
};
