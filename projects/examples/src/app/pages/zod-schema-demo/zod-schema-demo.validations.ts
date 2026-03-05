import { create, enforce, test } from 'vest';
import { z } from 'zod';
import { ZodSchemaDemoModel } from '../../models/zod-schema-demo.model';

/**
 * Zod schema for structural/type validation.
 *
 * This schema is passed as the second argument to `create()`.
 * It validates the overall shape of the data model and runs only
 * during **full** suite execution (`suite.run(model)`).
 *
 * **Important:** `suite.only(field).run()` (used by ngx-vest-forms
 * for per-field validation) intentionally skips schema execution.
 * This is Vest's design — schema validates the whole model, while
 * `test()` callbacks handle per-field business rules.
 *
 * @see https://vestjs.dev/docs/community_resources/standard_schema
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
 * Vest validation suite with Zod schema integration.
 *
 * **How it works:**
 * 1. The Zod schema (2nd argument) validates model structure on full runs
 * 2. The `test()` callbacks provide per-field business rule validation
 * 3. During per-field validation (`suite.only(field).run()`), only
 *    the `test()` callbacks run — the Zod schema is skipped
 *
 * **Per-field rules** use `enforce` for the same validations that
 * the Zod schema covers at the structural level, plus additional
 * business rules that go beyond type/shape validation.
 */
export const zodSchemaDemoSuite = create((model: ZodSchemaDemoModel) => {
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
}, zodFormSchema);
