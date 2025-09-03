import type { NgxFieldKey, NgxVestSuite } from 'ngx-vest-forms';
import { enforce, only, staticSuite, test } from 'vest';

// Generic Vest validation suite for all schema forms
// Accepts any user profile model (Zod, Valibot, ArkType, Custom)
export type SchemaFormModel = {
  firstName?: string;
  lastName?: string;
  email?: string;
  dateOfBirth?: string;
  bio?: string;
};

export const schemaFormSuite: NgxVestSuite<SchemaFormModel> = staticSuite(
  (data: SchemaFormModel = {}, currentField?: NgxFieldKey<SchemaFormModel>) => {
    only(currentField);

    test('firstName', 'First name is required', () => {
      enforce(data.firstName).isNotEmpty();
    });
    test('firstName', 'First name must be at least 2 characters', () => {
      enforce(data.firstName).longerThanOrEquals(2);
    });

    test('lastName', 'Last name is required', () => {
      enforce(data.lastName).isNotEmpty();
    });
    test('lastName', 'Last name must be at least 2 characters', () => {
      enforce(data.lastName).longerThanOrEquals(2);
    });

    test('email', 'Email is required', () => {
      enforce(data.email).isNotEmpty();
    });
    test('email', 'Please enter a valid email address', () => {
      enforce(data.email).matches(/^[^@]+@[^@]+\.[^@]+$/);
    });

    test('dateOfBirth', 'Date of birth is required', () => {
      enforce(data.dateOfBirth).isNotEmpty();
    });

    test('bio', 'Bio is required', () => {
      enforce(data.bio).isNotEmpty();
    });
    test('bio', 'Bio must be at least 10 characters', () => {
      enforce(data.bio).longerThanOrEquals(10);
    });
    test('bio', 'Bio must not exceed 500 characters', () => {
      enforce(data.bio).shorterThanOrEquals(500);
    });
  },
);
