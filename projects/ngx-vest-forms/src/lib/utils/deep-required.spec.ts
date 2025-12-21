import { vi } from 'vitest';
// Fallback Jest-based type test for DeepRequired and FormCompatibleDeepRequired
import {
  DeepRequired,
  FormCompatibleDeepRequired,
  NgxDeepRequired,
  NgxFormCompatibleDeepRequired,
} from './deep-required';

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
    expect(value.items[0].name).toBeDefined();
    expect(value.items[0].value).toBeDefined();
  });

  it('should recursively process readonly array element types', () => {
    type Model = {
      readonly tags?: ReadonlyArray<{ label?: string }>;
    };
    const value: NgxDeepRequired<Model> = {
      tags: [{ label: 'important' }],
    };
    expect(Array.isArray(value.tags)).toBe(true);
    expect(value.tags[0].label).toBeDefined();
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
    expect(value.users[0].name).toBe('John');
    expect(value.users[0].tags).toEqual(['admin', 'user']);
    expect(value.users[1].name).toBe('Jane');
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

describe('NgxFormCompatibleDeepRequired', () => {
  it('should allow Date | string for all Date fields', () => {
    type Model = {
      id?: number;
      name?: string;
      birthDate?: Date;
      profile?: { createdAt?: Date; isActive?: boolean };
    };
    const value: NgxFormCompatibleDeepRequired<Model> = {
      id: 1,
      name: '',
      birthDate: '',
      profile: { createdAt: new Date(), isActive: true },
    };
    expect(
      typeof value.birthDate === 'string' || value.birthDate instanceof Date
    ).toBe(true);
    expect(
      typeof value.profile.createdAt === 'string' ||
        value.profile.createdAt instanceof Date
    ).toBe(true);
  });

  it('should handle Date arrays with string compatibility', () => {
    type Model = {
      dates?: Date[];
    };
    const value: NgxFormCompatibleDeepRequired<Model> = {
      dates: [new Date(), '2024-01-01'],
    };
    expect(Array.isArray(value.dates)).toBe(true);
  });

  it('should handle arrays with nested objects containing Dates', () => {
    type Model = {
      events?: { date?: Date; title?: string }[];
    };
    const value: NgxFormCompatibleDeepRequired<Model> = {
      events: [
        { date: '', title: 'Event 1' },
        { date: new Date(), title: 'Event 2' },
      ],
    };
    expect(Array.isArray(value.events)).toBe(true);
    expect(
      typeof value.events[0].date === 'string' ||
        value.events[0].date instanceof Date
    ).toBe(true);
    expect(
      typeof value.events[1].date === 'string' ||
        value.events[1].date instanceof Date
    ).toBe(true);
  });

  it('should treat Function as a leaf type', () => {
    type Model = {
      callback?: () => void;
      config?: { onSubmit?: (data: any) => void };
    };
    const onSubmit = vi.fn();
    const callback = vi.fn();
    const value: NgxFormCompatibleDeepRequired<Model> = {
      callback,
      config: { onSubmit },
    };
    expect(typeof value.callback).toBe('function');
    expect(typeof value.config.onSubmit).toBe('function');
  });

  it('should handle readonly arrays with Date elements', () => {
    type Model = {
      readonly timestamps?: ReadonlyArray<Date>;
    };
    const value: NgxFormCompatibleDeepRequired<Model> = {
      timestamps: ['2024-01-01', new Date()],
    };
    expect(Array.isArray(value.timestamps)).toBe(true);
  });

  it('should handle complex nested structures with Dates and arrays', () => {
    type Model = {
      users?: Array<{
        name?: string;
        registeredAt?: Date;
        events?: Array<{ date?: Date; type?: string }>;
      }>;
    };
    const value: NgxFormCompatibleDeepRequired<Model> = {
      users: [
        {
          name: 'John',
          registeredAt: '',
          events: [
            { date: new Date(), type: 'login' },
            { date: '', type: 'logout' },
          ],
        },
      ],
    };
    expect(value.users[0].name).toBe('John');
    expect(
      typeof value.users[0].registeredAt === 'string' ||
        value.users[0].registeredAt instanceof Date
    ).toBe(true);
    expect(
      typeof value.users[0].events[0].date === 'string' ||
        value.users[0].events[0].date instanceof Date
    ).toBe(true);
  });

  it('should preserve non-Date type safety', () => {
    type Model = {
      id?: number;
      name?: string;
      isActive?: boolean;
      count?: number;
    };
    const value: NgxFormCompatibleDeepRequired<Model> = {
      id: 1,
      name: 'test',
      isActive: true,
      count: 42,
    };
    expect(typeof value.id).toBe('number');
    expect(typeof value.name).toBe('string');
    expect(typeof value.isActive).toBe('boolean');
    expect(typeof value.count).toBe('number');
  });
});

// Backward compatibility tests
describe('DeepRequired (legacy alias)', () => {
  it('should work identically to NgxDeepRequired', () => {
    type Model = {
      a?: string;
      b?: number;
      c?: { d?: boolean; e?: string[] };
    };
    const value: DeepRequired<Model> = {
      a: '',
      b: 1,
      c: { d: false, e: [] },
    };
    expect(value.a).toBeDefined();
    expect(value.c.d).toBeDefined();
  });
});

describe('FormCompatibleDeepRequired (legacy alias)', () => {
  it('should work identically to NgxFormCompatibleDeepRequired', () => {
    type Model = {
      id?: number;
      birthDate?: Date;
    };
    const value: FormCompatibleDeepRequired<Model> = {
      id: 1,
      birthDate: '',
    };
    expect(
      typeof value.birthDate === 'string' || value.birthDate instanceof Date
    ).toBe(true);
  });
});
