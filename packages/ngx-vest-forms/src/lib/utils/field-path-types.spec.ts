import type {
  FieldPath,
  FieldPathValue,
  FormFieldName,
  LeafFieldPath,
  NgxDeepPartial,
  NgxValidationConfig,
  ROOT_FORM,
  ValidateFieldPath,
  ValidationConfigMap,
} from 'ngx-vest-forms';
import { describe, expectTypeOf, it } from 'vitest';

type Address = { street: string; geo: { lat: number } };
type AddressModel = {
  name: string;
  addresses: readonly Address[];
  tags: string[];
};

describe('FieldPath and LeafFieldPath', () => {
  it('includes nested containers in FieldPath and only leaves in LeafFieldPath', () => {
    type Model = {
      title: string;
      user?: { profile: { age: number }; email?: string };
    };

    expectTypeOf<FieldPath<Model>>().toEqualTypeOf<
      'title' | 'user' | 'user.profile' | 'user.profile.age' | 'user.email'
    >();
    expectTypeOf<LeafFieldPath<Model>>().toEqualTypeOf<
      'title' | 'user.profile.age' | 'user.email'
    >();
  });

  it('stops at scalar values and dates', () => {
    type Model = {
      title: string;
      total: number;
      active: boolean;
      id: bigint;
      token: symbol;
      date: Date;
      note: string | null;
    };
    type Paths =
      | 'title'
      | 'total'
      | 'active'
      | 'id'
      | 'token'
      | 'date'
      | 'note';

    expectTypeOf<FieldPath<Model>>().toEqualTypeOf<Paths>();
    expectTypeOf<LeafFieldPath<Model>>().toEqualTypeOf<Paths>();
  });

  it('uses numeric dot segments for array items and includes scalar items as leaves', () => {
    expectTypeOf<FieldPath<AddressModel>>().toEqualTypeOf<
      | 'name'
      | 'addresses'
      | `addresses.${number}`
      | `addresses.${number}.street`
      | `addresses.${number}.geo`
      | `addresses.${number}.geo.lat`
      | 'tags'
      | `tags.${number}`
    >();
    expectTypeOf<LeafFieldPath<AddressModel>>().toEqualTypeOf<
      | 'name'
      | `addresses.${number}.street`
      | `addresses.${number}.geo.lat`
      | `tags.${number}`
    >();
  });

  it('keeps indices in optional arrays in a Form Model', () => {
    type Model = NgxDeepPartial<{
      contacts: { email: string }[];
      notes: string[];
    }>;

    expectTypeOf<FieldPath<Model>>().toEqualTypeOf<
      | 'contacts'
      | `contacts.${number}`
      | `contacts.${number}.email`
      | 'notes'
      | `notes.${number}`
    >();
  });

  it('uses an index at each level of nested arrays', () => {
    type Model = {
      orders: { lines: { sku: string }[] }[];
      matrix: number[][];
    };

    expectTypeOf<FieldPath<Model>>().toEqualTypeOf<
      | 'orders'
      | `orders.${number}`
      | `orders.${number}.lines`
      | `orders.${number}.lines.${number}`
      | `orders.${number}.lines.${number}.sku`
      | 'matrix'
      | `matrix.${number}`
      | `matrix.${number}.${number}`
    >();
  });

  it('includes an array item as a leaf when its type includes a scalar', () => {
    type Model = { items: (string | { label: string })[] };

    expectTypeOf<FieldPath<Model>>().toEqualTypeOf<
      'items' | `items.${number}` | `items.${number}.label`
    >();
    expectTypeOf<LeafFieldPath<Model>>().toEqualTypeOf<
      `items.${number}` | `items.${number}.label`
    >();
  });

  it('keeps only the item properties as leaves for optional object items', () => {
    type Model = { slots: ({ id: string } | undefined)[] };

    expectTypeOf<LeafFieldPath<Model>>().toEqualTypeOf<`slots.${number}.id`>();
  });

  it('accepts any subpath after the index of an any or unknown item', () => {
    type Model = { items: any[]; extras: unknown[] };
    type ItemPaths =
      | `items.${number}`
      | `items.${number}.${string}`
      | `extras.${number}`
      | `extras.${number}.${string}`;

    expectTypeOf<FieldPath<Model>>().toEqualTypeOf<
      'items' | 'extras' | ItemPaths
    >();
    expectTypeOf<LeafFieldPath<Model>>().toEqualTypeOf<ItemPaths>();
  });

  it('accepts numeric interpolation inline and when stored as a literal', () => {
    const index: number = 2;
    const stored = `addresses.${index}.street` as const;
    const widened = `addresses.${index}.street`;

    expectTypeOf(
      `addresses.${index}.street` satisfies FieldPath<AddressModel>
    ).toEqualTypeOf<`addresses.${number}.street`>();
    expectTypeOf(stored).toExtend<FieldPath<AddressModel>>();
    expectTypeOf(widened).not.toExtend<FieldPath<AddressModel>>();
  });

  it('has no paths for a model with no fields', () => {
    type EmptyModel = Record<never, never>;

    expectTypeOf<FieldPath<EmptyModel>>().toBeNever();
    expectTypeOf<LeafFieldPath<EmptyModel>>().toBeNever();
  });

  it('limits object traversal to ten levels', () => {
    type Branch = { next: Branch; value: string };

    expectTypeOf<'next.next.next.next.next.next.next.next.next.value'>().toExtend<
      LeafFieldPath<Branch>
    >();
    expectTypeOf<'next.next.next.next.next.next.next.next.next.next.value'>().not.toExtend<
      FieldPath<Branch>
    >();
  });
});

describe('FieldPathValue', () => {
  it('resolves top-level and nested fields', () => {
    type Model = { name: string; profile: { address: { zipCode: number } } };

    expectTypeOf<FieldPathValue<Model, 'name'>>().toEqualTypeOf<string>();
    expectTypeOf<
      FieldPathValue<Model, 'profile.address.zipCode'>
    >().toEqualTypeOf<number>();
  });

  it('resolves dot-indexed items and their properties', () => {
    type Model = AddressModel & { matrix: number[][] };

    expectTypeOf<
      FieldPathValue<Model, 'addresses.1'>
    >().toEqualTypeOf<Address>();
    expectTypeOf<
      FieldPathValue<Model, 'addresses.0.street'>
    >().toEqualTypeOf<string>();
    expectTypeOf<
      FieldPathValue<Model, `addresses.${number}.geo.lat`>
    >().toEqualTypeOf<number>();
    expectTypeOf<FieldPathValue<Model, 'tags.2'>>().toEqualTypeOf<string>();
    expectTypeOf<FieldPathValue<Model, 'matrix.1.2'>>().toEqualTypeOf<number>();
  });

  it('resolves bracket indices for items and their properties', () => {
    expectTypeOf<
      FieldPathValue<AddressModel, 'addresses[0]'>
    >().toEqualTypeOf<Address>();
    expectTypeOf<
      FieldPathValue<AddressModel, 'addresses[0].street'>
    >().toEqualTypeOf<string>();
    expectTypeOf<
      FieldPathValue<AddressModel, 'tags[3]'>
    >().toEqualTypeOf<string>();
  });

  it('resolves array properties without an index and preserves the array type at its own path', () => {
    expectTypeOf<
      FieldPathValue<AddressModel, 'addresses.street'>
    >().toEqualTypeOf<string>();
    expectTypeOf<
      FieldPathValue<AddressModel, 'addresses.geo.lat'>
    >().toEqualTypeOf<number>();
    expectTypeOf<FieldPathValue<AddressModel, 'addresses'>>().toEqualTypeOf<
      readonly Address[]
    >();
  });

  it('removes undefined from optional fields and preserves null', () => {
    type Model = NgxDeepPartial<{
      nickname: string | null;
      profile: { age: number; nickname: string | null };
      addresses: Address[];
    }>;

    expectTypeOf<
      FieldPathValue<Model, 'profile.age'>
    >().toEqualTypeOf<number>();
    expectTypeOf<
      FieldPathValue<Model, 'addresses.street'>
    >().toEqualTypeOf<string>();
    expectTypeOf<FieldPathValue<Model, 'nickname'>>().toEqualTypeOf<
      string | null
    >();
    expectTypeOf<FieldPathValue<Model, 'profile.nickname'>>().toEqualTypeOf<
      string | null
    >();
  });

  it('preserves bigint and unique symbol value types', () => {
    type Model = { id: bigint; readonly token: unique symbol };

    expectTypeOf<FieldPathValue<Model, 'id'>>().toEqualTypeOf<bigint>();
    expectTypeOf<FieldPathValue<Model, 'token'>>().toEqualTypeOf<
      Model['token']
    >();
  });
});

describe('ValidateFieldPath', () => {
  it('preserves a valid Field Path and rejects an invalid one', () => {
    expectTypeOf<
      ValidateFieldPath<AddressModel, 'addresses.0.street'>
    >().toEqualTypeOf<'addresses.0.street'>();
    expectTypeOf<
      ValidateFieldPath<AddressModel, 'addresses.street'>
    >().toBeNever();
  });
});

describe('FormFieldName', () => {
  it('includes Field Paths and ROOT_FORM', () => {
    type Model = { email: string; user: { name: string } };

    expectTypeOf<FormFieldName<Model>>().toEqualTypeOf<
      'email' | 'user' | 'user.name' | typeof ROOT_FORM
    >();
  });
});

describe('Validation Config types', () => {
  it('makes Trigger Fields optional and limits Dependent Fields to valid Field Paths', () => {
    type Model = NgxDeepPartial<{
      password: string;
      contact: { email: string };
    }>;
    type Path = 'password' | 'contact' | 'contact.email';
    type Config = {
      password?: Path[];
      contact?: Path[];
      'contact.email'?: Path[];
    };

    expectTypeOf<ValidationConfigMap<Model>>().toEqualTypeOf<Config>();
    expectTypeOf<NgxValidationConfig<Model>>().toEqualTypeOf<Config | null>();
  });

  it('checks indexed Trigger and Dependent Fields', () => {
    type Config = {
      'addresses.0.street': ['addresses.0.geo.lat', 'name'];
      name: ['addresses.1.street'];
    };

    expectTypeOf<Config>().toExtend<ValidationConfigMap<AddressModel>>();
    expectTypeOf<Config>().toExtend<NgxValidationConfig<AddressModel>>();
    expectTypeOf<'addresses.0.nope'>().not.toExtend<
      keyof ValidationConfigMap<AddressModel>
    >();
  });

  it('accepts a Validation Config for a recursive array model', () => {
    type Tree = { name: string; children: Tree[] };
    type Config = { name: ['children.0.name', 'children.0.children.1.name'] };

    expectTypeOf<Config>().toExtend<ValidationConfigMap<Tree>>();
    expectTypeOf<'children.0.children.0.children.0.name'>().toExtend<
      FieldPath<Tree>
    >();
  });

  it('accepts a Validation Config for a wide model with three array levels', () => {
    type FieldNumber =
      | 1
      | 2
      | 3
      | 4
      | 5
      | 6
      | 7
      | 8
      | 9
      | 10
      | 11
      | 12
      | 13
      | 14;
    type Fields = Record<`f${FieldNumber}`, string>;
    type Line = Fields & { f15: string };
    type Section = Fields & { items: Line[] };
    type Page = Fields & { items: Section[] };
    type Model = Fields & { items: Page[] };
    type Config = { f1: ['f2', 'items.0.items.1.items.2.f15'] };

    expectTypeOf<Config>().toExtend<ValidationConfigMap<Model>>();
  });
});
