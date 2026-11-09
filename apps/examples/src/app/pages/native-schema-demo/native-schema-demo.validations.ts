import type { NgxVestSuite } from 'ngx-vest-forms';
import { create, enforce, test } from 'vest';
import type { NativeSchemaDemoModel } from '../../models/native-schema-demo.model';
import { EMAIL_PATTERN } from '../../shared/validations/email.validations';

/**
 * Native Vest schema used directly by `create(..., schema)`.
 *
 * The schema keeps the model structurally safe and typed while still allowing
 * ngx-vest-forms to validate focused fields against partial payloads via
 * `suite.only(field).run(model)`.
 *
 * Field-level `test()` callbacks below still provide the user-facing business
 * rules and messages shown in the form UI.
 */
export const nativeVestSchema = enforce.shape({
  firstName: enforce.optional(enforce.isString()),
  lastName: enforce.optional(enforce.isString()),
  email: enforce.optional(enforce.isString()),
  age: enforce.optional(enforce.isNumber()),
  address: enforce.optional(
    enforce.shape({
      street: enforce.optional(enforce.isString()),
      city: enforce.optional(enforce.isString()),
      zipCode: enforce.optional(enforce.isString()),
    })
  ),
});

/**
 * A schema-typed suite. It is deliberately NOT annotated as
 * `NgxVestSuite<NativeSchemaDemoModel>`: that annotation would widen every
 * field name to `string`. Left inferred, Vest 6 types the suite from the
 * schema:
 *
 * - `run()` takes the schema's input type, and the callback's `model` is the
 *   schema's output type.
 * - `only()`, `focus()`, `afterField()` and result lookups such as
 *   `getErrors()`, `hasErrors()` and `isValid()` accept only the schema's
 *   top-level keys (`'firstName' | 'lastName' | 'email' | 'age' | 'address'`),
 *   so a typo is a compile error.
 *
 * Nested paths such as `'address.city'` are not in that union. `test()`
 * still takes them; read their messages from `getErrors()`, a record keyed by
 * any field path.
 *
 * `satisfies` checks that the suite still fits the `[suite]` input of
 * `ngxVestForm` without widening its type.
 */
export const nativeSchemaDemoSuite = create((model) => {
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

  test('age', 'Age is required', () => {
    enforce(model.age).isTruthy();
  });

  test('age', 'Must be at least 18', () => {
    enforce(model.age).greaterThanOrEquals(18);
  });

  test('age', 'Must be at most 120', () => {
    enforce(model.age).lessThanOrEquals(120);
  });

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
}, nativeVestSchema) satisfies NgxVestSuite<NativeSchemaDemoModel>;
