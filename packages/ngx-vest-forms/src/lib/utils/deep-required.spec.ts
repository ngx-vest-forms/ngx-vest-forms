import { vi } from 'vitest';
import { NgxDeepRequired } from './deep-required';

describe('NgxDeepRequired', () => {
  it('should make all properties required in flat structure', () => {
    type Model = {
      a?: string;
      b?: number;
      c?: boolean;
    };
    const value: NgxDeepRequired<Model> = {
      a: '',
      b: 1,
      c: false,
    };
    expect(value.a).toBeDefined();
    expect(value.b).toBeDefined();
    expect(value.c).toBeDefined();
  });

  it('should recursively make nested object properties required', () => {
    type Model = {
      a?: string;
      b?: number;
      c?: { d?: boolean; e?: string[] };
    };
    const value: NgxDeepRequired<Model> = {
      a: '',
      b: 1,
      c: { d: false, e: [] },
    };
    expect(value.a).toBeDefined();
    expect(value.c.d).toBeDefined();
    expect(value.c.e).toBeDefined();
  });

  it('should treat Date as a leaf type (not recurse into Date methods)', () => {
    type Model = {
      createdAt?: Date;
      profile?: { updatedAt?: Date };
    };
    const value: NgxDeepRequired<Model> = {
      createdAt: new Date(),
      profile: { updatedAt: new Date() },
    };
    expect(value.createdAt instanceof Date).toBe(true);
    expect(value.profile.updatedAt instanceof Date).toBe(true);
  });

  it('should treat Function as a leaf type (not recurse into Function methods)', () => {
    type Model = {
      callback?: () => void;
      handler?: { onClick?: (e: Event) => void };
    };
    const onClick = vi.fn();
    const callback = vi.fn();
    const value: NgxDeepRequired<Model> = {
      callback,
      handler: { onClick },
    };
    expect(typeof value.callback).toBe('function');
    expect(typeof value.handler.onClick).toBe('function');
  });

  it('should recursively process array element types', () => {
    type Model = {
      items?: Array<{ name?: string; value?: number }>;
    };
    const value: NgxDeepRequired<Model> = {
      items: [
        { name: 'test', value: 1 },
        { name: 'test2', value: 2 },
      ],
    };
    expect(Array.isArray(value.items)).toBe(true);
    expect(value.items[0]?.name).toBeDefined();
    expect(value.items[0]?.value).toBeDefined();
  });

  it('should recursively process readonly array element types', () => {
    type Model = {
      readonly tags?: ReadonlyArray<{ label?: string }>;
    };
    const value: NgxDeepRequired<Model> = {
      tags: [{ label: 'important' }],
    };
    expect(Array.isArray(value.tags)).toBe(true);
    expect(value.tags[0]?.label).toBeDefined();
  });

  it('should handle deeply nested structures with arrays', () => {
    type Model = {
      users?: Array<{
        name?: string;
        tags?: string[];
      }>;
    };
    const value: NgxDeepRequired<Model> = {
      users: [
        {
          name: 'John',
          tags: ['admin', 'user'],
        },
        {
          name: 'Jane',
          tags: ['user'],
        },
      ],
    };
    expect(value.users.length).toBe(2);
    expect(value.users[0]?.name).toBe('John');
    expect(value.users[0]?.tags).toEqual(['admin', 'user']);
    expect(value.users[1]?.name).toBe('Jane');
  });

  it('should handle mixed types correctly', () => {
    type Model = {
      id?: number;
      name?: string;
      isActive?: boolean;
      createdAt?: Date;
      tags?: string[];
      metadata?: { key?: string; value?: any };
      callback?: () => void;
    };
    const callback = vi.fn();
    const value: NgxDeepRequired<Model> = {
      id: 1,
      name: 'test',
      isActive: true,
      createdAt: new Date(),
      tags: ['tag1', 'tag2'],
      metadata: { key: 'test', value: 123 },
      callback,
    };
    expect(value.id).toBe(1);
    expect(value.name).toBe('test');
    expect(value.isActive).toBe(true);
    expect(value.createdAt instanceof Date).toBe(true);
    expect(Array.isArray(value.tags)).toBe(true);
    expect(value.metadata.key).toBeDefined();
    expect(typeof value.callback).toBe('function');
  });

  it('should handle primitive array types', () => {
    type Model = {
      numbers?: number[];
      strings?: string[];
      booleans?: boolean[];
    };
    const value: NgxDeepRequired<Model> = {
      numbers: [1, 2, 3],
      strings: ['a', 'b', 'c'],
      booleans: [true, false],
    };
    expect(value.numbers.length).toBe(3);
    expect(value.strings.length).toBe(3);
    expect(value.booleans.length).toBe(2);
  });
});

