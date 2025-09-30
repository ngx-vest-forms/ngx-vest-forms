// Fallback Jest-based type test for DeepRequired and FormCompatibleDeepRequired
import { DeepRequired, FormCompatibleDeepRequired } from './deep-required';

describe('DeepRequired', () => {
  it('should allow assignment to required deeply nested structure', () => {
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

describe('FormCompatibleDeepRequired', () => {
  it('should allow Date | string for all Date fields', () => {
    type Model = {
      id?: number;
      name?: string;
      birthDate?: Date;
      profile?: { createdAt?: Date; isActive?: boolean };
    };
    const value: FormCompatibleDeepRequired<Model> = {
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
  it('should handle arrays and nested objects', () => {
    type Model = {
      dates?: Date[];
      events?: { date?: Date; title?: string }[];
    };
    const value: FormCompatibleDeepRequired<Model> = {
      dates: [new Date()],
      events: [{ date: '', title: '' }],
    };
    expect(Array.isArray(value.dates)).toBe(true);
    expect(
      typeof value.events[0].date === 'string' ||
        value.events[0].date instanceof Date
    ).toBe(true);
  });
});
