import type { NgxDeepPartial } from 'ngx-vest-forms';
import { describe, expectTypeOf, it } from 'vitest';

describe('NgxDeepPartial', () => {
  it('makes Form Model properties optional at each depth', () => {
    type Model = {
      title: string;
      active: boolean;
      created: Date;
      contact: { name: string; phone: number };
    };

    expectTypeOf<NgxDeepPartial<Model>>().toEqualTypeOf<{
      title?: string | undefined;
      active?: boolean | undefined;
      created?: Date | undefined;
      contact?:
        | { name?: string | undefined; phone?: number | undefined }
        | undefined;
    }>();
  });

  it('makes array item properties optional and keeps readonly arrays readonly', () => {
    type Model = {
      contacts: { name: string; email: string }[];
      tags: readonly string[];
    };

    expectTypeOf<NgxDeepPartial<Model>>().toEqualTypeOf<{
      contacts?:
        | { name?: string | undefined; email?: string | undefined }[]
        | undefined;
      tags?: readonly string[] | undefined;
    }>();
  });

  it('keeps tuple length, element types and readonly modifiers', () => {
    type Model = NgxDeepPartial<{
      range: [number, number];
      point: readonly [number, string];
    }>;

    expectTypeOf<Model['range']>().toEqualTypeOf<
      [number?, number?] | undefined
    >();
    expectTypeOf<Model['point']>().toEqualTypeOf<
      readonly [number?, string?] | undefined
    >();
  });
});
