import { describe, expectTypeOf, test } from 'vitest';
import { NgxDeepRequired } from './deep-required';

describe('NgxDeepRequired', () => {
  test('should make all properties required', () => {
    type TestType = {
      a?: string;
      b?: number;
      c?: {
        d?: boolean;
        e?: string[];
      };
    };

    type Result = NgxDeepRequired<TestType>;

    expectTypeOf<Result>().toEqualTypeOf<{
      a: string;
      b: number;
      c: {
        d: boolean;
        e: string[];
      };
    }>();
  });

  test('should work with nested objects recursively', () => {
    type TestType = {
      level1?: {
        level2?: {
          level3?: {
            value?: string;
          };
        };
      };
    };

    type Result = NgxDeepRequired<TestType>;

    expectTypeOf<Result>().toEqualTypeOf<{
      level1: {
        level2: {
          level3: {
            value: string;
          };
        };
      };
    }>();
  });
});

describe('NgxFormCompatibleDeepRequired', () => {
  test('should make all properties required like NgxDeepRequired', () => {
    type TestType = {
      a?: string;
      b?: number;
      c?: boolean;
    };

    type Result = FormCompatibleDeepRequired<TestType>;

    expectTypeOf<Result>().toEqualTypeOf<{
      a: string;
      b: number;
      c: boolean;
    }>();
  });

  test('should add string union only to Date properties', () => {
    type TestType = {
      id?: number;
      name?: string;
      birthDate?: Date;
      isActive?: boolean;
      tags?: string[];
    };

    type Result = FormCompatibleDeepRequired<TestType>;

    expectTypeOf<Result>().toEqualTypeOf<{
      id: number;
      name: string;
      birthDate: Date | string; // Only Date gets the union treatment
      isActive: boolean;
      tags: string[];
    }>();
  });

  test('should work recursively with nested objects containing Dates', () => {
    type TestType = {
      user?: {
        id?: number;
        profile?: {
          createdAt?: Date;
          updatedAt?: Date;
          name?: string;
          settings?: {
            lastLogin?: Date;
            theme?: string;
          };
        };
      };
    };

    type Result = FormCompatibleDeepRequired<TestType>;

    expectTypeOf<Result>().toEqualTypeOf<{
      user: {
        id: number;
        profile: {
          createdAt: Date | string; // Date gets union treatment
          updatedAt: Date | string; // Date gets union treatment
          name: string;
          settings: {
            lastLogin: Date | string; // Date gets union treatment even in deep nesting
            theme: string;
          };
        };
      };
    }>();
  });

  test('should handle arrays properly', () => {
    type TestType = {
      dates?: Date[];
      strings?: string[];
      events?: {
        date?: Date;
        title?: string;
      }[];
    };

    type Result = FormCompatibleDeepRequired<TestType>;

    expectTypeOf<Result>().toEqualTypeOf<{
      dates: Date[];
      strings: string[];
      events: {
        date: Date | string; // Date in array element gets union treatment
        title: string;
      }[];
    }>();
  });

  test('should handle complex real-world form model', () => {
    type UserRegistrationForm = {
      personalInfo?: {
        firstName?: string;
        lastName?: string;
        birthDate?: Date;
        email?: string;
      };
      preferences?: {
        newsletter?: boolean;
        theme?: 'light' | 'dark';
        notifications?: {
          email?: boolean;
          sms?: boolean;
          lastUpdated?: Date;
        };
      };
      history?: {
        loginDate?: Date;
        ip?: string;
      }[];
    };

    type Result = FormCompatibleDeepRequired<UserRegistrationForm>;

    expectTypeOf<Result>().toEqualTypeOf<{
      personalInfo: {
        firstName: string;
        lastName: string;
        birthDate: Date | string; // Date gets union
        email: string;
      };
      preferences: {
        newsletter: boolean;
        theme: 'light' | 'dark';
        notifications: {
          email: boolean;
          sms: boolean;
          lastUpdated: Date | string; // Date gets union
        };
      };
      history: {
        loginDate: Date | string; // Date in array element gets union
        ip: string;
      }[];
    }>();
  });

  test('should allow proper form initialization with empty strings for dates', () => {
    type TestModel = {
      id?: number;
      name?: string;
      startDate?: Date;
      profile?: {
        createdAt?: Date;
        isActive?: boolean;
      };
    };

    type FormCompatible = FormCompatibleDeepRequired<TestModel>;

    // This should compile without errors
    const formData: FormCompatible = {
      id: 0,
      name: '',
      startDate: '', // ✅ string allowed for Date property
      profile: {
        createdAt: '', // ✅ string allowed for Date property
        isActive: false,
      },
    };

    // Should also allow actual Date objects
    const formDataWithDates: FormCompatible = {
      id: 1,
      name: 'John',
      startDate: new Date(), // ✅ Date still allowed
      profile: {
        createdAt: new Date(), // ✅ Date still allowed
        isActive: true,
      },
    };

    // Verify the assignments work
    expectTypeOf(formData).toMatchTypeOf<FormCompatible>();
    expectTypeOf(formDataWithDates).toMatchTypeOf<FormCompatible>();
  });

  test('should not affect non-Date object types', () => {
    type TestType = {
      config?: {
        theme?: string;
        settings?: {
          autoSave?: boolean;
          timeout?: number;
        };
      };
      metadata?: Record<string, unknown>;
    };

    type Result = FormCompatibleDeepRequired<TestType>;

    expectTypeOf<Result>().toEqualTypeOf<{
      config: {
        theme: string;
        settings: {
          autoSave: boolean;
          timeout: number;
        };
      };
      metadata: Record<string, unknown>;
    }>();
  });

  test('should preserve function types', () => {
    type TestType = {
      callback?: () => void;
      handler?: (date: Date) => string;
      dateValue?: Date;
    };

    type Result = FormCompatibleDeepRequired<TestType>;

    expectTypeOf<Result>().toEqualTypeOf<{
      callback: () => void;
      handler: (date: Date) => string;
      dateValue: Date | string; // Only Date gets union treatment
    }>();
  });

  test('should handle edge cases', () => {
    type TestType = {
      nullableDate?: Date | null;
      undefinedDate?: Date | undefined;
      mixedDate?: Date | string | null;
    };

    type Result = FormCompatibleDeepRequired<TestType>;

    // The exact behavior with union types may vary, but the important thing
    // is that it compiles and Date properties get string compatibility
    expectTypeOf<Result['nullableDate']>().toMatchTypeOf<
      Date | string | null
    >();
    expectTypeOf<Result['undefinedDate']>().toMatchTypeOf<Date | string>();
    expectTypeOf<Result['mixedDate']>().toMatchTypeOf<Date | string | null>();
  });

  test('should handle EventFormModel structure from integration tests', () => {
    // This matches the exact structure used in form.directive.spec.ts
    type EventFormModel = {
      title?: string;
      startDate?: Date;
      endDate?: Date;
      details?: {
        createdAt?: Date;
        category?: string;
        metadata?: {
          lastUpdated?: Date;
          version?: number;
        };
      };
    };

    type Result = FormCompatibleDeepRequired<EventFormModel>;

    expectTypeOf<Result>().toEqualTypeOf<{
      title: string;
      startDate: Date | string; // Date gets union treatment
      endDate: Date | string; // Date gets union treatment
      details: {
        createdAt: Date | string; // Date gets union treatment in nested object
        category: string;
        metadata: {
          lastUpdated: Date | string; // Date gets union treatment in deeply nested object
          version: number;
        };
      };
    }>();

    // Test that the exact initialization pattern from the integration test works
    const formData: Result = {
      title: '',
      startDate: '', // ✅ Should work
      endDate: '',
      details: {
        createdAt: '', // ✅ Should work in nested object
        category: '',
        metadata: {
          lastUpdated: '', // ✅ Should work in deeply nested object
          version: 0,
        },
      },
    };

    // Test that Date objects still work
    const formDataWithDates: Result = {
      title: 'Event',
      startDate: new Date(), // ✅ Should work
      endDate: new Date(),
      details: {
        createdAt: new Date(), // ✅ Should work in nested object
        category: 'Conference',
        metadata: {
          lastUpdated: new Date(), // ✅ Should work in deeply nested object
          version: 1,
        },
      },
    };

    // Verify the assignments work
    expectTypeOf(formData).toMatchTypeOf<Result>();
    expectTypeOf(formDataWithDates).toMatchTypeOf<Result>();

    // Additional verification: simulate signal initialization pattern
    const signalValue: Result = {
      title: '',
      startDate: '', // This was failing before the fix
      endDate: '',
      details: {
        createdAt: '', // This was failing before the fix
        category: '',
        metadata: {
          lastUpdated: '', // This was failing before the fix
          version: 0,
        },
      },
    };

    expectTypeOf(signalValue).toMatchTypeOf<Result>();
  });
});
