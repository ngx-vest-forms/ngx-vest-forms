import { describe, expect, it } from 'vitest';
import { ROOT_FORM } from '../constants';
import type { FormFieldName } from './field-path-types';
import type {
  NgxFieldKey,
  NgxTypedVestSuite,
  NgxVestSuite,
} from './validation-suite';

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

  it('should keep NgxTypedVestSuite assignable to NgxVestSuite', () => {
    // Compile-time contract test: this assignment is the key compatibility guarantee.
    const typedSuite = (() =>
      undefined) as unknown as NgxTypedVestSuite<TestModel>;
    const baseSuite: NgxVestSuite<TestModel> = typedSuite;

    expect(typeof baseSuite).toBe('function');
  });

  it('should keep default NgxVestSuite generic as unknown', () => {
    const suite = (() => undefined) as unknown as NgxVestSuite;

    expect(typeof suite).toBe('function');
  });

  it('should allow suite-parameter style callbacks with typed fields', () => {
    const callWithField = (
      _model: TestModel,
      _field?: FormFieldName<TestModel>
    ): void => {
      // No-op: compile-time type contract test.
    };

    expect(() =>
      callWithField({ firstName: 'Ada' }, 'firstName')
    ).not.toThrow();
    expect(() => callWithField({ firstName: 'Ada' }, ROOT_FORM)).not.toThrow();
    expect(() => callWithField({ firstName: 'Ada' }, undefined)).not.toThrow();
  });
});
