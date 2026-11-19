import type { NgxDeepPartial, NgxDeepRequired } from 'ngx-vest-forms';
import { describe, expectTypeOf, it } from 'vitest';

describe('NgxDeepRequired', () => {
  it('requires Form Contract properties at each depth and preserves leaf types', () => {
    type Model = {
      title?: string;
      date?: Date;
      nested?: {
        active?: boolean;
        onChange?: (event: Event) => void;
        tags?: string[];
      };
    };

    expectTypeOf<NgxDeepRequired<Model>>().toEqualTypeOf<{
      title: string;
      date: Date;
      nested: {
        active: boolean;
        onChange: (event: Event) => void;
        tags: string[];
      };
    }>();
  });

  it('requires array item properties and keeps readonly arrays readonly', () => {
    type Model = {
      items?: { name?: string; value?: number }[];
      readonly tags?: readonly { label?: string }[];
    };

    expectTypeOf<NgxDeepRequired<Model>>().toEqualTypeOf<{
      items: { name: string; value: number }[];
      readonly tags: readonly { label: string }[];
    }>();
  });

  it('removes the explicit undefined that NgxDeepPartial adds to optional properties', () => {
    type Model = { name: string; address: { street: string } };

    expectTypeOf<
      NgxDeepRequired<NgxDeepPartial<Model>>
    >().toEqualTypeOf<Model>();
  });

  it('keeps undefined on a required property that declares it', () => {
    type Model = { value: number | undefined };

    expectTypeOf<NgxDeepRequired<Model>>().toEqualTypeOf<Model>();
  });
});
