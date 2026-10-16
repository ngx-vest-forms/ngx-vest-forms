import { create, enforce, group, test } from 'vest';
import { describe, expect, it } from 'vitest';
import { ROOT_FORM } from '../constants';
import type { FormFieldName } from './field-path-types';
import type { NgxFieldKey, NgxVestSuite } from './validation-suite';

describe('validation-suite types', () => {
  interface TestModel {
    firstName?: string;
    contact?: {
      email?: string;
    };
  }

  it('should allow known and dynamic field names via NgxFieldKey', () => {
    const known: NgxFieldKey<TestModel> = 'firstName';
    const nested: NgxFieldKey<TestModel> = 'contact.email';
    const dynamic: NgxFieldKey<TestModel> = 'addresses[0].street';

    expect(known).toBe('firstName');
    expect(nested).toBe('contact.email');
    expect(dynamic).toBe('addresses[0].street');
  });

  it('should support FormFieldName including ROOT_FORM', () => {
    const formField: FormFieldName<TestModel> = 'firstName';
    const rootField: FormFieldName<TestModel> = ROOT_FORM;

    expect(formField).toBe('firstName');
    expect(rootField).toBe(ROOT_FORM);
  });

  it('should keep actual Vest 6 suites assignable to NgxVestSuite', () => {
    const typedSuite = create((_model: TestModel = {}) => {
      // No-op: compile-time contract test against the real Vest 6 suite shape.
    });
    const baseSuite: NgxVestSuite<TestModel> = typedSuite;

    expect(typeof baseSuite.run).toBe('function');
  });

  it('should keep default NgxVestSuite generic as unknown', () => {
    const suite: NgxVestSuite = create((_model: unknown = {}) => {
      // No-op: compile-time contract test for the default generic.
    });

    expect(typeof suite.run).toBe('function');
  });

  it('should keep schema-typed Vest 6 suites assignable to NgxVestSuite', () => {
    // A schema narrows `only()`/`focus()` to the schema's own field names;
    // NgxVestSuite's nullable `only` parameter keeps this assignable.
    const schema = enforce.shape({
      firstName: enforce.optional(enforce.isString()),
    });
    const suite: NgxVestSuite<TestModel> = create((model) => {
      test('firstName', 'First name is required', () => {
        enforce(model.firstName).isNotBlank();
      });
    }, schema);

    expect(suite.only('firstName').run({}).hasErrors('firstName')).toBe(true);
  });

  it('should expose focus() on NgxVestSuite', () => {
    const suite: NgxVestSuite<TestModel> = create((model: TestModel = {}) => {
      test('firstName', 'First name is required', () => {
        enforce(model.firstName).isNotBlank();
      });
      group('contact', () => {
        test('contact.email', 'Email is required', () => {
          enforce(model.contact?.email).isNotBlank();
        });
      });
    });

    if (!suite.focus) {
      throw new Error('Vest 6.3 suites have focus()');
    }
    const skipGroups: readonly string[] = ['contact'];
    const result = suite.focus({ skipGroup: skipGroups }).run({});

    expect(result.hasErrors('firstName')).toBe(true);
    expect(result.isTested('contact.email')).toBe(false);
  });

  it('should keep field- and group-typed Vest 6 suites assignable to NgxVestSuite', () => {
    // `SuiteConfig` narrows only()/focus() to the declared field and group
    // names; they must still fit NgxVestSuite's string-typed methods.
    const suite: NgxVestSuite<TestModel> = create<{
      fields: 'firstName' | 'contact.email';
      groups: 'contact';
    }>((model: TestModel = {}) => {
      test('firstName', 'First name is required', () => {
        enforce(model.firstName).isNotBlank();
      });
    });

    expect(
      suite.focus?.({ onlyGroup: 'contact' }).run({}).isTested('firstName')
    ).toBe(false);
  });
});
