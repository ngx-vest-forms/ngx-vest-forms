import { type NgxVestSuite } from 'ngx-vest-forms';
import { create, enforce, test } from 'vest';
import { z } from 'zod';
import { ZodSchemaDemoModel } from '../../models/zod-schema-demo.model';

/**
 * Zod schema for structural/type validation.
 *
 * Vest 6.3.x supports schema-aware `create(..., schema)` suites when the schema
 * is defined with Vest's native `n4s/enforce` schema primitives.
 *
 * This example intentionally keeps a Zod schema alongside the Vest suite to show
 * how an external schema library can still act as a shared structural contract
 * while Vest powers the form's field-level UI validation.
 *
 * The Vest suite below still provides the field-level business rules that
 * ngx-vest-forms runs through `suite.only(field).run(model)`.
 */
export const zodFormSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  age: z.number().int().min(18).max(120),
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    zipCode: z.string().regex(/^\d{4,6}$/, 'ZIP code must be 4-6 digits'),
  }),
});

/**
 * Vest validation suite that complements the exported Zod schema.
 *
 * **How it works:**
 * 1. The Zod schema documents and can validate the structural model separately
 * 2. The `test()` callbacks provide per-field business rule validation for the UI
 * 3. During field-level validation (`suite.only(field).run(model)`), ngx-vest-forms
 *    runs the Vest rules that back the form UI
 * 4. If you want native Vest schema integration in 6.3.x, prefer
 *    `create((model) => { ... }, enforce.shape(...))` in a dedicated example
 *
 * **Per-field rules** use `enforce` for the same validations that
 * the Zod schema covers at the structural level, plus additional
 * business rules that go beyond type/shape validation.
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
    enforce(model.email).matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
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
