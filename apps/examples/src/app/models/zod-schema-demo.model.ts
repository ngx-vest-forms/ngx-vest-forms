import { NgxDeepPartial, NgxDeepRequired } from 'ngx-vest-forms';

export type ZodSchemaDemoModel = NgxDeepPartial<{
  // Personal info (schema-validated structure)
  firstName: string;
  lastName: string;
  email: string;

  // Numeric with schema constraints
  age: number;

  // Nested object (schema-validated shape)
  address: {
    street: string;
    city: string;
    zipCode: string;
  };
}>;

export const zodSchemaDemoShape: NgxDeepRequired<ZodSchemaDemoModel> = {
  firstName: '',
  lastName: '',
  email: '',
  age: 0,
  address: {
    street: '',
    city: '',
    zipCode: '',
  },
};
