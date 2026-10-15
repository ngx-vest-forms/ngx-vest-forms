import { type NgxVestSuite } from 'ngx-vest-forms';
import { create, enforce, test } from 'vest';
import { ZodSchemaDemoModel } from '../../models/zod-schema-demo.model';
import { EMAIL_PATTERN } from '../../shared/validations/email.validations';

/**
 * Vest suite for the Zod demo.
 *
 * The Zod schema in `models/zod-schema-demo.model.ts` is the form contract:
 * it is bound through `[formContract]` and checks the model's shape. This
 * suite holds the field-level rules the UI shows, and ngx-vest-forms runs it
 * per field with `suite.only(field).run(model)`.
 *
 * For a suite whose schema is written with Vest's own `enforce.shape(...)`,
 * see the native schema demo.
 */
export const zodSchemaDemoSuite: NgxVestSuite<ZodSchemaDemoModel> = create(
  (model: ZodSchemaDemoModel) => {
    // --- Personal info ---
    test('firstName', 'First name is required', () => {
      enforce(model.firstName).isNotBlank();
    });

    test('lastName', 'Last name is required', () => {
      enforce(model.lastName).isNotBlank();
    });

    test('email', 'Email is required', () => {
      enforce(model.email).isNotBlank();
    });

    test('email', 'Must be a valid email address', () => {
      enforce(model.email ?? '').matches(EMAIL_PATTERN);
    });

    // --- Age ---
    test('age', 'Age is required', () => {
      enforce(model.age).isTruthy();
    });

    test('age', 'Must be at least 18', () => {
      enforce(model.age).greaterThanOrEquals(18);
    });

    test('age', 'Must be at most 120', () => {
      enforce(model.age).lessThanOrEquals(120);
    });

    // --- Address ---
    test('address.street', 'Street is required', () => {
      enforce(model.address?.street).isNotBlank();
    });

    test('address.city', 'City is required', () => {
      enforce(model.address?.city).isNotBlank();
    });

    test('address.zipCode', 'ZIP code is required', () => {
      enforce(model.address?.zipCode).isNotBlank();
    });

    test('address.zipCode', 'ZIP code must be 4-6 digits', () => {
      enforce(model.address?.zipCode).matches(/^\d{4,6}$/);
    });
  }
);
