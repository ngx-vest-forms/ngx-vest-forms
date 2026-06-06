import { create } from 'vest';
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
});
