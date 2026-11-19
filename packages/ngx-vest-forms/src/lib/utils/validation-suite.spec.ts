import type { NgxFieldKey, NgxVestSuite } from 'ngx-vest-forms';
import { create, enforce } from 'vest';
import { describe, expectTypeOf, it } from 'vitest';

type FormModel = {
  firstName?: string;
  contact?: { email?: string };
};

describe('NgxVestSuite', () => {
  it('accepts both declared fields and dynamic Field Paths as keys', () => {
    expectTypeOf<
      'firstName' | 'contact.email' | 'addresses[0].street'
    >().toExtend<NgxFieldKey<FormModel>>();
  });

  it('uses unknown as the default Form Model type', () => {
    expectTypeOf<NgxVestSuite['run']>().parameter(0).toBeUnknown();
  });

  it('accepts a Vest Suite with a required Form Model parameter', () => {
    const suite = create((_model: FormModel) => {});

    expectTypeOf(suite).toExtend<NgxVestSuite<FormModel>>();
  });

  it('accepts Vest Suites with optional and required schema fields', () => {
    const optional = create(
      () => {},
      enforce.shape({ firstName: enforce.optional(enforce.isString()) })
    );
    const required = create(
      () => {},
      enforce.shape({ firstName: enforce.isString() })
    );

    expectTypeOf(optional).toExtend<NgxVestSuite<FormModel>>();
    expectTypeOf(required).toExtend<NgxVestSuite<{ firstName: string }>>();
  });

  it('accepts a Vest Suite with specific field and group names', () => {
    const suite = create<{
      fields: 'firstName' | 'contact.email';
      groups: 'contact';
    }>((_model: FormModel = {}) => {});

    expectTypeOf(suite).toExtend<NgxVestSuite<FormModel>>();
  });

  it('accepts readonly group lists in a Focused Run', () => {
    type Focus = NonNullable<NgxVestSuite<FormModel>['focus']>;
    const groups: readonly string[] = ['contact'];

    expectTypeOf<Focus>().toBeCallableWith({ skipGroup: groups });
  });

  it('keeps event payloads and saved state unknown and returns an unsubscribe function', () => {
    type Suite = NgxVestSuite<FormModel>;
    type Subscribe = {
      (callback: () => void): () => void;
      (event: string, callback: (payload: unknown) => void): () => void;
    };

    expectTypeOf<Suite['subscribe']>().toEqualTypeOf<Subscribe>();
    expectTypeOf<Suite['dump']>().returns.toBeUnknown();
    expectTypeOf<Suite['resume']>().parameter(0).toBeUnknown();
  });
});
