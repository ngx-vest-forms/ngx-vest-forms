import { FormControl, FormGroup } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import {
  cloneDeep,
  getFormControlField,
  getFormGroupField,
  mergeValuesAndRawValues,
  setValueAtPath,
} from './form-utils';

describe('getFormControlField function', () => {
  it('should return correct field name for FormControl in root FormGroup', () => {
    const form = new FormGroup({
      name: new FormControl('John'),
    });
    expect(getFormControlField(form, form.controls.name)).toBe('name');
  });

  it('should return correct field name for FormControl in nested FormGroup', () => {
    const form = new FormGroup({
      personal: new FormGroup({
        name: new FormControl('John'),
      }),
    });
    const personalGroup = form.get('personal');
    expect(personalGroup).not.toBeNull();
    if (personalGroup) {
      const nameControl = personalGroup.get('name');
      expect(nameControl).not.toBeNull();
      if (nameControl) {
        expect(getFormControlField(form, nameControl)).toBe('personal.name');
      }
    }
  });
});

describe('getFormGroupField function', () => {
  it('should return correct field name for FormGroup in root FormGroup', () => {
    const form = new FormGroup({
      personal: new FormGroup({
        name: new FormControl('John'),
      }),
    });
    expect(getFormGroupField(form, form.controls.personal)).toBe('personal');
  });

  it('should return correct field name for FormGroup in nested FormGroup', () => {
    const form = new FormGroup({
      personal: new FormGroup({
        contact: new FormGroup({
          email: new FormControl('john@example.com'),
        }),
      }),
    });
    const personalGroup = form.get('personal');
    expect(personalGroup).not.toBeNull();
    if (personalGroup) {
      const contactGroup = personalGroup.get('contact');
      expect(contactGroup).not.toBeNull();
      if (contactGroup) {
        expect(getFormGroupField(form, contactGroup)).toBe('personal.contact');
      }
    }
  });
});

describe('mergeValuesAndRawValues function', () => {
  describe('basic functionality', () => {
    it('should merge values and raw values correctly with disabled fields', () => {
      const form = new FormGroup({
        name: new FormControl('John'),
        age: new FormControl(30),
        address: new FormGroup({
          city: new FormControl('New York'),
          zip: new FormControl(12_345),
        }),
      });

      const nameControl = form.get('name');
      expect(nameControl).not.toBeNull();
      if (nameControl) {
        nameControl.disable(); // Simulate a disabled field
      }

      const mergedValues = mergeValuesAndRawValues(form);
      expect(mergedValues).toEqual({
        name: 'John', // Should include disabled field value
        age: 30,
        address: {
          city: 'New York',
          zip: 12_345,
        },
      });
    });

    it('should handle empty forms', () => {
      const form = new FormGroup({});
      const merged = mergeValuesAndRawValues(form);
      expect(merged).toEqual({});
    });

    it('should handle forms with only disabled fields', () => {
      const form = new FormGroup({
        disabled1: new FormControl('value1'),
        disabled2: new FormControl('value2'),
      });

      form.get('disabled1')?.disable();
      form.get('disabled2')?.disable();

      const merged = mergeValuesAndRawValues(form);
      expect(merged).toEqual({
        disabled1: 'value1',
        disabled2: 'value2',
      });
    });
  });

  describe('nested structures', () => {
    it('should handle deeply nested form groups', () => {
      const form = new FormGroup({
        user: new FormGroup({
          profile: new FormGroup({
            personal: new FormGroup({
              name: new FormControl('John'),
              age: new FormControl(30),
            }),
            contact: new FormGroup({
              email: new FormControl('john@example.com'),
              phone: new FormControl('123-456-7890'),
            }),
          }),
          preferences: new FormGroup({
            newsletter: new FormControl(true),
            notifications: new FormControl(false),
          }),
        }),
      });

      // Disable some nested fields
      form.get('user.profile.personal.name')?.disable();
      form.get('user.preferences.newsletter')?.disable();

      const merged = mergeValuesAndRawValues(form);
      expect(merged).toEqual({
        user: {
          profile: {
            personal: {
              name: 'John', // Should be included despite being disabled
              age: 30,
            },
            contact: {
              email: 'john@example.com',
              phone: '123-456-7890',
            },
          },
          preferences: {
            newsletter: true, // Should be included despite being disabled
            notifications: false,
          },
        },
      });
    });

    it('should handle mixed enabled and disabled fields in nested structures', () => {
      const form = new FormGroup({
        address: new FormGroup({
          street: new FormControl('123 Main St'),
          city: new FormControl('New York'),
          state: new FormControl('NY'),
          zip: new FormControl('10001'),
        }),
        contact: new FormGroup({
          email: new FormControl('user@example.com'),
          phone: new FormControl('555-0123'),
        }),
      });

      // Disable some fields
      form.get('address.state')?.disable();
      form.get('contact.phone')?.disable();

      const merged = mergeValuesAndRawValues(form);
      expect(merged).toEqual({
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY', // Should be included despite being disabled
          zip: '10001',
        },
        contact: {
          email: 'user@example.com',
          phone: '555-0123', // Should be included despite being disabled
        },
      });
    });

    it('should handle completely disabled nested groups', () => {
      const form = new FormGroup({
        enabled: new FormControl('enabled-value'),
        disabledGroup: new FormGroup({
          field1: new FormControl('value1'),
          field2: new FormControl('value2'),
          nested: new FormGroup({
            field3: new FormControl('value3'),
          }),
        }),
      });

      // Disable entire group
      form.get('disabledGroup')?.disable();

      const merged = mergeValuesAndRawValues(form);
      expect(merged).toEqual({
        enabled: 'enabled-value',
        disabledGroup: {
          field1: 'value1',
          field2: 'value2',
          nested: {
            field3: 'value3',
          },
        },
      });
    });
  });

  describe('data types and edge cases', () => {
    it('should handle various data types', () => {
      const testDate = new Date('2023-01-01');
      const form = new FormGroup({
        string: new FormControl('text'),
        number: new FormControl(42),
        boolean: new FormControl(true),
        nullValue: new FormControl(null),
        undefinedValue: new FormControl(undefined),
        date: new FormControl(testDate),
        array: new FormControl(['item1', 'item2']),
        object: new FormControl({ key: 'value' }),
      });

      // Disable some fields to test merging
      form.get('number')?.disable();
      form.get('date')?.disable();

      const merged = mergeValuesAndRawValues(form);
      expect(merged).toEqual({
        string: 'text',
        number: 42, // Should be included despite being disabled
        boolean: true,
        nullValue: null,
        undefinedValue: null, // Angular forms convert undefined to null
        date: testDate, // Should be included despite being disabled
        array: ['item1', 'item2'],
        object: { key: 'value' },
      });
    });

    it('should handle empty strings and zero values', () => {
      const form = new FormGroup({
        emptyString: new FormControl(''),
        zero: new FormControl(0),
        falseValue: new FormControl(false),
        nested: new FormGroup({
          emptyNested: new FormControl(''),
          zeroNested: new FormControl(0),
        }),
      });

      // Disable fields with "falsy" values
      form.get('emptyString')?.disable();
      form.get('zero')?.disable();
      form.get('nested.emptyNested')?.disable();

      const merged = mergeValuesAndRawValues(form);
      expect(merged).toEqual({
        emptyString: '', // Should be included
        zero: 0, // Should be included
        falseValue: false,
        nested: {
          emptyNested: '', // Should be included
          zeroNested: 0,
        },
      });
    });

    it('should handle arrays within form groups', () => {
      const form = new FormGroup({
        tags: new FormControl(['tag1', 'tag2', 'tag3']),
        metadata: new FormGroup({
          categories: new FormControl(['cat1', 'cat2']),
          settings: new FormControl([{ key: 'value1' }, { key: 'value2' }]),
        }),
      });

      form.get('tags')?.disable();
      form.get('metadata.settings')?.disable();

      const merged = mergeValuesAndRawValues(form);
      expect(merged).toEqual({
        tags: ['tag1', 'tag2', 'tag3'], // Should be included
        metadata: {
          categories: ['cat1', 'cat2'],
          settings: [{ key: 'value1' }, { key: 'value2' }], // Should be included
        },
      });
    });
  });

  describe('reference isolation (structuredClone behavior)', () => {
    it('should not share references between original and merged values', () => {
      const originalObject = {
        shared: 'value',
        nested: { prop: 'nested-value' },
      };
      const form = new FormGroup({
        data: new FormControl(originalObject),
        other: new FormGroup({
          nested: new FormControl({ another: 'prop' }),
        }),
      });

      const merged = mergeValuesAndRawValues(form);

      // Modify the merged result
      if (merged.data && typeof merged.data === 'object') {
        (merged.data as { shared: string; nested: { prop: string } }).shared =
          'modified';
        (
          merged.data as { shared: string; nested: { prop: string } }
        ).nested.prop = 'modified-nested';
      }
      if (merged.other && typeof merged.other === 'object') {
        (merged.other as { nested: { another: string } }).nested.another =
          'modified-another';
      }

      // Original form value should not be affected
      const formValue = form.value;
      expect(formValue.data.shared).toBe('value');
      expect(formValue.data.nested.prop).toBe('nested-value');
      expect(formValue.other.nested.another).toBe('prop');
    });

    it('should create independent copies of nested objects', () => {
      const form = new FormGroup({
        level1: new FormGroup({
          level2: new FormGroup({
            level3: new FormControl({ deep: 'value' }),
          }),
        }),
      });

      const merged1 = mergeValuesAndRawValues(form);
      const merged2 = mergeValuesAndRawValues(form);

      // Modify one merged result
      if (
        merged1.level1?.level2?.level3 &&
        typeof merged1.level1.level2.level3 === 'object'
      ) {
        (merged1.level1.level2.level3 as { deep: string }).deep = 'modified';
      }

      // Other merged result should not be affected
      expect((merged2.level1.level2.level3 as { deep: string }).deep).toBe(
        'value',
      );
    });

    it('should handle Date objects correctly without reference sharing', () => {
      const originalDate = new Date('2023-01-01');
      const form = new FormGroup({
        date: new FormControl(originalDate),
        nested: new FormGroup({
          anotherDate: new FormControl(new Date('2023-12-31')),
        }),
      });

      form.get('date')?.disable(); // Test disabled date field

      const merged = mergeValuesAndRawValues(form);

      // Modify the date in merged result
      if (merged.date instanceof Date) {
        merged.date.setFullYear(2024);
      }

      // Original should not be affected
      expect(originalDate.getFullYear()).toBe(2023);
      expect(form.getRawValue().date.getFullYear()).toBe(2023);
    });
  });

  describe('real-world scenarios', () => {
    it('should handle a complex user profile form like the schema comparison', () => {
      type UserProfile = {
        name: string;
        email: string;
        age: number;
        website: string;
        bio: string;
        preferences: {
          newsletter: boolean;
          notifications: boolean;
        };
        address: {
          street: string;
          city: string;
          state: string;
          zip: string;
        };
        settings: {
          privacy: {
            public: boolean;
            searchable: boolean;
          };
        };
      };

      const form = new FormGroup({
        name: new FormControl('John Doe'),
        email: new FormControl('john@example.com'),
        age: new FormControl(25),
        website: new FormControl('https://johndoe.com'),
        bio: new FormControl('Software developer'),
        preferences: new FormGroup({
          newsletter: new FormControl(true),
          notifications: new FormControl(false),
        }),
        address: new FormGroup({
          street: new FormControl('123 Main St'),
          city: new FormControl('New York'),
          state: new FormControl('NY'),
          zip: new FormControl('10001'),
        }),
        settings: new FormGroup({
          privacy: new FormGroup({
            public: new FormControl(false),
            searchable: new FormControl(true),
          }),
        }),
      });

      // Disable various fields to simulate real-world scenarios
      form.get('age')?.disable(); // User can't edit age
      form.get('preferences.newsletter')?.disable(); // Admin controlled
      form.get('address.state')?.disable(); // Auto-detected
      form.get('settings.privacy.searchable')?.disable(); // Policy controlled

      const merged = mergeValuesAndRawValues<UserProfile>(form);

      expect(merged).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
        age: 25, // Should be included despite being disabled
        website: 'https://johndoe.com',
        bio: 'Software developer',
        preferences: {
          newsletter: true, // Should be included despite being disabled
          notifications: false,
        },
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY', // Should be included despite being disabled
          zip: '10001',
        },
        settings: {
          privacy: {
            public: false,
            searchable: true, // Should be included despite being disabled
          },
        },
      });

      // Verify type safety
      expect(typeof merged.name).toBe('string');
      expect(typeof merged.age).toBe('number');
      expect(typeof merged.preferences.newsletter).toBe('boolean');
      expect(merged.address).toBeDefined();
      expect(merged.settings.privacy).toBeDefined();
    });

    it('should handle form arrays within form groups', () => {
      const form = new FormGroup({
        user: new FormControl('john'),
        hobbies: new FormControl(['reading', 'coding', 'gaming']),
        skills: new FormGroup({
          technical: new FormControl(['JavaScript', 'TypeScript', 'Angular']),
          soft: new FormControl(['Communication', 'Leadership']),
        }),
        projects: new FormControl([
          { name: 'Project A', status: 'completed' },
          { name: 'Project B', status: 'in-progress' },
        ]),
      });

      // Disable array fields
      form.get('hobbies')?.disable();
      form.get('skills.technical')?.disable();

      const merged = mergeValuesAndRawValues(form);

      expect(merged).toEqual({
        user: 'john',
        hobbies: ['reading', 'coding', 'gaming'], // Should be included
        skills: {
          technical: ['JavaScript', 'TypeScript', 'Angular'], // Should be included
          soft: ['Communication', 'Leadership'],
        },
        projects: [
          { name: 'Project A', status: 'completed' },
          { name: 'Project B', status: 'in-progress' },
        ],
      });
    });
  });
});

describe('cloneDeep function', () => {
  it('should deep clone an object', () => {
    const original = {
      name: 'John',
      age: 30,
      address: {
        city: 'New York',
        zip: 12_345,
      },
    };
    const cloned = cloneDeep(original);
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original); // Ensure it's a deep clone, not a reference
  });
});

describe('set function', () => {
  it('should set a value in an object at the correct path', () => {
    const object = {};
    setValueAtPath(object, 'address.city', 'New York');
    expect(object).toEqual({
      address: {
        city: 'New York',
      },
    });
  });
});
