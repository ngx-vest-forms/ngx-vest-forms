import type { NgxVestSuite } from 'ngx-vest-forms';
import type { NativeSchemaDemoModel } from './native-schema-demo.model';
import { nativeSchemaDemoSuite } from './native-schema-demo.validations';

describe('nativeSchemaDemoSuite (schema-typed)', () => {
  beforeEach(() => {
    nativeSchemaDemoSuite.reset();
  });

  it('assigns to NgxVestSuite<T>, so it binds to [suite]', () => {
    const suite: NgxVestSuite<NativeSchemaDemoModel> = nativeSchemaDemoSuite;

    expect(suite.only('firstName').run({}).hasErrors('firstName')).toBe(true);
  });

  it('types focused runs and lookups by the schema keys', () => {
    const result = nativeSchemaDemoSuite.only('email').run({ email: 'nope' });

    expect(result.getErrors('email')).toEqual([
      'Must be a valid email address',
    ]);
    expect(result.isTested('firstName')).toBe(false);

    // @ts-expect-error 'emial' is not a field of the schema.
    nativeSchemaDemoSuite.only('emial');
    // @ts-expect-error 'nickname' is not a field of the schema.
    result.hasErrors('nickname');
    nativeSchemaDemoSuite.focus({
      // @ts-expect-error focus() takes the same field names.
      skip: 'phone',
    });
  });

  it('types the run payload by the schema input', () => {
    expect(nativeSchemaDemoSuite.runStatic({ age: 42 }).hasErrors('age')).toBe(
      false
    );

    // @ts-expect-error age must be a number in the schema.
    nativeSchemaDemoSuite.runStatic({ age: '42' });
  });

  it('reads nested paths, which are outside the key union, from getErrors()', () => {
    const result = nativeSchemaDemoSuite.runStatic({ address: {} });

    expect(result.getErrors()['address.city']).toEqual(['City is required']);
  });
});
