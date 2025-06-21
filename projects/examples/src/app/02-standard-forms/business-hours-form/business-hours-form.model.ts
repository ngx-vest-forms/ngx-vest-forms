import { NgxDeepPartial, NgxDeepRequired } from 'ngx-vest-forms';
import {
  InferSchemaType,
  ngxModelToStandardSchema,
} from 'ngx-vest-forms/schemas';

// --- Business Hour (Nested Model) ---

/**
 * Defines the complete structure for a single business hour entry.
 * Serves as the non-optional blueprint.
 */
type BaseBusinessHourFormModel = {
  from: string;
  to: string;
};

/**
 * Represents a potentially incomplete business hour entry.
 * Uses `NgxDeepPartial` for flexibility in forms.
 *
 * @usage Primarily nested within `BaseBusinessHoursFormModel` and `PartialBusinessHoursForm`.
 */
export type PartialBusinessHour = NgxDeepPartial<BaseBusinessHourFormModel>;

/**
 * Provides a default, empty template for a single business hour entry.
 * Ensures `from` and `to` properties exist for safe initialization.
 *
 * @usage Used to initialize entries within `initialBusinessHoursFormData`.
 */
export const initialBusinessHourEntry: NgxDeepRequired<BaseBusinessHourFormModel> =
  {
    from: '00:00',
    to: '00:00',
  };

// --- Business Hours Form (Main Model) ---

/**
 * Defines the complete structure for the business hours form data.
 * Serves as the non-optional blueprint.
 */
type BaseBusinessHoursFormModel = {
  businessHours: {
    addValue: PartialBusinessHour;
    values: Record<string, PartialBusinessHour>;
  };
};

/**
 * Represents the data structure for managing business hours entries (addValue and values).
 */
export type BusinessHoursData = BaseBusinessHoursFormModel['businessHours'];

/**
 * Represents potentially incomplete business hours form data.
 * Uses `NgxDeepPartial` for flexibility in the main form model.
 *
 * @usage
 * - Form Models: `this.form.setModel(someData as PartialBusinessHoursForm);`
 * - Validation Arguments: `function validations(model: PartialBusinessHoursForm | undefined): void { ... }`
 */
export type PartialBusinessHoursForm =
  NgxDeepPartial<BaseBusinessHoursFormModel>;

/**
 * Provides a default, empty template for the business hours form data.
 * Ensures the nested structure exists with initial empty entries.
 *
 * Rationale:
 * Guarantees a safe, fully-structured object for initializing the form state.
 *
 * @usage
 * - Initializing Form State: `this.form.setModel({ ...initialBusinessHoursFormData });`
 */
export const initialBusinessHoursFormData: NgxDeepRequired<BaseBusinessHoursFormModel> =
  {
    businessHours: {
      addValue: { ...initialBusinessHourEntry }, // Use renamed nested initial state constant
      values: {
        '0': { ...initialBusinessHourEntry }, // Use renamed nested initial state constant
      },
    },
  };

// --- Schema and Form Type ---

/**
 * Defines the Vest schema based on the initial form data structure.
 */
export const businessHoursSchema = ngxModelToStandardSchema(
  initialBusinessHoursFormData,
);

/**
 * Infers the TypeScript type for the form based on the schema.
 * This type represents the structure that the form will work with.
 */
export type BusinessHoursFormType = InferSchemaType<typeof businessHoursSchema>;
