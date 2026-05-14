import { NgxDeepPartial, StandardSchemaV1 } from 'ngx-vest-forms';

export type NativeSchemaDemoModel = NgxDeepPartial<{
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  address: {
    street: string;
    city: string;
    zipCode: string;
  };
}>;

/**
 * Hand-rolled Standard Schema (~v1) implementation – no external dependencies.
 *
 * Demonstrates that the `[formContract]` input accepts ANY library (or your own
 * code) that implements the Standard Schema spec via the `~standard` property.
 * @see https://standardschema.dev
 */
export const nativeSchemaDemoContract: StandardSchemaV1<NativeSchemaDemoModel> =
  {
    '~standard': {
      version: 1,
      vendor: 'ngx-vest-forms-examples',
      validate(input) {
        const issues: Array<{ message: string; path: Array<string | number> }> = [];
        const value = (input ?? {}) as NativeSchemaDemoModel;

        const expectString = (key: keyof NativeSchemaDemoModel) => {
          const v = value[key];
          if (v !== undefined && typeof v !== 'string') {
            issues.push({
              message: `Expected string for "${String(key)}"`,
              path: [key as string],
            });
          }
        };
        expectString('firstName');
        expectString('lastName');
        expectString('email');

        if (value.age !== undefined && typeof value.age !== 'number') {
          issues.push({ message: 'Expected number for "age"', path: ['age'] });
        }

        if (value.address !== undefined) {
          if (typeof value.address !== 'object' || value.address === null) {
            issues.push({
              message: 'Expected object for "address"',
              path: ['address'],
            });
          } else {
            const addr = value.address;
            for (const key of ['street', 'city', 'zipCode'] as const) {
              if (addr[key] !== undefined && typeof addr[key] !== 'string') {
                issues.push({
                  message: `Expected string for "address.${key}"`,
                  path: ['address', key],
                });
              }
            }
          }
        }

        return issues.length > 0 ? { issues } : { value };
      },
    },
  };
