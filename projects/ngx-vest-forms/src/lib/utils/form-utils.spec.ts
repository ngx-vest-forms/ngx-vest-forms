import { FormControl, FormGroup } from '@angular/forms';
import { ROOT_FORM } from '../constants';
import {
  cloneDeep,
  getAllFormErrors,
  getFormControlField,
  getFormGroupField,
  mergeValuesAndRawValues,
  set,
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
          zip: new FormControl(12345),
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
          zip: 12345,
        },
      });
    });

    it('should handle empty forms', () => {
      const form = new FormGroup({});
      const merged = mergeValuesAndRawValues(form);
      expect(merged).toEqual({});
    });

    it('should handle nested disabled fields', () => {
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

      const merged = mergeValuesAndRawValues<any>(form);

      // Modify the merged result
      if (merged.data && typeof merged.data === 'object') {
        (merged.data as { shared: string; nested: { prop: string } }).shared =
          'modified';
        (
          merged.data as { shared: string; nested: { prop: string } }
        ).nested.prop = 'modified-nested';
      }

      if (merged.other && typeof merged.other === 'object') {
        const otherObj = merged.other as {
          nested: { another: string };
        };
        otherObj.nested.another = 'modified-other';
      }

      // Original should remain unchanged
      expect(originalObject.shared).toBe('value');
      expect(originalObject.nested.prop).toBe('nested-value');
      expect(form.value.data?.shared).toBe('value');
    });

    it('should handle complex nested structures with multiple disabled fields', () => {
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
          city: new FormControl('Springfield'),
          state: new FormControl('IL'),
          zip: new FormControl('62701'),
        }),
        settings: new FormGroup({
          privacy: new FormGroup({
            public: new FormControl(false),
            searchable: new FormControl(true),
          }),
        }),
      });

      // Disable several fields
      form.get('age')?.disable();
      form.get('bio')?.disable();
      form.get('preferences.notifications')?.disable();
      form.get('address.state')?.disable();
      form.get('settings.privacy.searchable')?.disable();

      const merged = mergeValuesAndRawValues<UserProfile>(form);

      expect(merged).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
        age: 25, // Should be included
        website: 'https://johndoe.com',
        bio: 'Software developer', // Should be included
        preferences: {
          newsletter: true,
          notifications: false, // Should be included
        },
        address: {
          street: '123 Main St',
          city: 'Springfield',
          state: 'IL', // Should be included
          zip: '62701',
        },
        settings: {
          privacy: {
            public: false,
            searchable: true, // Should be included
          },
        },
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
        zip: 12345,
      },
    };
    const cloned = cloneDeep(original);
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original); // Ensure it's a deep clone, not a reference
  });
});

describe('setValueAtPath function', () => {
  it('should set a value in an object at the correct path', () => {
    const object = {};
    setValueAtPath(object, 'address.city', 'New York');
    expect(object).toEqual({
      address: {
        city: 'New York',
      },
    });
  });

  it('should set a value at root level', () => {
    const object = {};
    setValueAtPath(object, 'name', 'John Doe');
    expect(object).toEqual({
      name: 'John Doe',
    });
  });

  it('should create nested objects for deep paths', () => {
    const object = {};
    setValueAtPath(object, 'user.profile.settings.theme', 'dark');
    expect(object).toEqual({
      user: {
        profile: {
          settings: {
            theme: 'dark',
          },
        },
      },
    });
  });

  it('should overwrite existing values at the path', () => {
    const object = {
      address: {
        city: 'Boston',
        state: 'MA',
      },
    };
    setValueAtPath(object, 'address.city', 'New York');
    expect(object).toEqual({
      address: {
        city: 'New York',
        state: 'MA',
      },
    });
  });

  it('should preserve existing nested properties', () => {
    const object = {
      user: {
        name: 'John',
        email: 'john@example.com',
      },
    };
    setValueAtPath(object, 'user.age', 30);
    expect(object).toEqual({
      user: {
        name: 'John',
        email: 'john@example.com',
        age: 30,
      },
    });
  });

  it('should handle setting undefined values', () => {
    const object = {};
    setValueAtPath(object, 'address.city', undefined);
    expect(object).toEqual({
      address: {
        city: undefined,
      },
    });
  });

  it('should handle setting null values', () => {
    const object = {};
    setValueAtPath(object, 'address.city', null);
    expect(object).toEqual({
      address: {
        city: null,
      },
    });
  });

  it('should handle setting object values', () => {
    const object = {};
    const addressValue = { street: '123 Main St', city: 'New York' };
    setValueAtPath(object, 'address', addressValue);
    expect(object).toEqual({
      address: addressValue,
    });
  });

  it('should handle setting array values', () => {
    const object = {};
    const tags = ['javascript', 'typescript', 'angular'];
    setValueAtPath(object, 'user.tags', tags);
    expect(object).toEqual({
      user: {
        tags: tags,
      },
    });
  });

  it('should handle paths with single segment', () => {
    const object = {};
    setValueAtPath(object, 'email', 'test@example.com');
    expect(object).toEqual({
      email: 'test@example.com',
    });
  });

  it('should create intermediate objects when they do not exist', () => {
    const object = {
      user: {
        name: 'John',
      },
    };
    setValueAtPath(object, 'user.profile.bio', 'Developer');
    expect(object).toEqual({
      user: {
        name: 'John',
        profile: {
          bio: 'Developer',
        },
      },
    });
  });

  it('should handle numeric values', () => {
    const object = {};
    setValueAtPath(object, 'user.age', 25);
    expect(object).toEqual({
      user: {
        age: 25,
      },
    });
  });

  it('should handle boolean values', () => {
    const object = {};
    setValueAtPath(object, 'user.active', true);
    expect(object).toEqual({
      user: {
        active: true,
      },
    });
  });

  it('should handle zero as a value', () => {
    const object = {};
    setValueAtPath(object, 'count', 0);
    expect(object).toEqual({
      count: 0,
    });
  });

  it('should handle empty string as a value', () => {
    const object = {};
    setValueAtPath(object, 'user.middleName', '');
    expect(object).toEqual({
      user: {
        middleName: '',
      },
    });
  });

  it('should handle false as a value', () => {
    const object = {};
    setValueAtPath(object, 'settings.notifications', false);
    expect(object).toEqual({
      settings: {
        notifications: false,
      },
    });
  });
});

describe('set function (deprecated)', () => {
  it('should set a value in an object at the correct path', () => {
    const obj = {};
    set(obj, 'address.city', 'New York');
    expect(obj).toEqual({
      address: {
        city: 'New York',
      },
    });
  });

  it('should work identically to setValueAtPath', () => {
    const obj1 = {};
    const obj2 = {};

    set(obj1, 'user.profile.name', 'John');
    setValueAtPath(obj2, 'user.profile.name', 'John');

    expect(obj1).toEqual(obj2);
  });
});

describe('cloneDeep', () => {
  it('should clone primitive values', () => {
    expect(cloneDeep(42)).toBe(42);
    expect(cloneDeep('test')).toBe('test');
    expect(cloneDeep(true)).toBe(true);
    expect(cloneDeep(null)).toBe(null);
    expect(cloneDeep(undefined)).toBeUndefined();
  });

  it('should clone Date objects', () => {
    const date = new Date('2025-01-01');
    const cloned = cloneDeep(date);
    expect(cloned).toBeInstanceOf(Date);
    expect(cloned).toEqual(date);
    expect(cloned).not.toBe(date);
  });

  it('should clone arrays', () => {
    const arr = [1, 2, { nested: 'value' }];
    const cloned = cloneDeep(arr);
    expect(cloned).toEqual(arr);
    expect(cloned).not.toBe(arr);
    expect(cloned[2]).not.toBe(arr[2]);
  });

  it('should clone objects', () => {
    const obj = { a: 1, b: { nested: 'value' } };
    const cloned = cloneDeep(obj);
    expect(cloned).toEqual(obj);
    expect(cloned).not.toBe(obj);
    expect(cloned.b).not.toBe(obj.b);
  });

  it('should handle deeply nested structures', () => {
    const obj = {
      level1: {
        level2: {
          level3: [1, 2, { deep: 'value' }],
        },
      },
    };
    const cloned = cloneDeep(obj);
    expect(cloned).toEqual(obj);
    expect(cloned.level1.level2.level3[2]).not.toBe(
      obj.level1.level2.level3[2]
    );
  });
});

describe('getAllFormErrors', () => {
  it('should return empty object when form is undefined', () => {
    expect(getAllFormErrors(undefined)).toEqual({});
  });

  it('should collect root form errors', () => {
    const form = new FormGroup({});
    form.setErrors({ errors: ['Root error'] });
    const errors = getAllFormErrors(form);
    expect(errors[ROOT_FORM]).toEqual(['Root error']);
  });

  it('should collect errors from nested FormGroups', () => {
    const form = new FormGroup({
      user: new FormGroup({
        name: new FormControl('', {
          validators: () => ({ errors: ['Name error'] }),
        }),
      }),
    });
    form.updateValueAndValidity();
    const errors = getAllFormErrors(form);
    expect(errors['user.name']).toEqual(['Name error']);
  });

  it('should not collect errors from disabled controls', () => {
    const control = new FormControl('', {
      validators: () => ({ errors: ['Error'] }),
    });
    const form = new FormGroup({ field: control });
    control.disable();
    control.updateValueAndValidity();
    const errors = getAllFormErrors(form);
    expect(errors['field']).toBeUndefined();
  });

  it('should collect warnings as non-enumerable property', () => {
    const control = new FormControl('', {
      validators: () => ({
        errors: ['Error'],
        warnings: ['Warning'],
      }),
    });
    const form = new FormGroup({ field: control });
    control.updateValueAndValidity();
    const errors = getAllFormErrors(form);
    expect(errors['field']).toEqual(['Error']);
    expect((errors['field'] as any).warnings).toEqual(['Warning']);
    expect(Object.keys(errors['field'])).not.toContain('warnings');
  });

  it('should handle controls with only warnings', () => {
    const control = new FormControl('', {
      validators: () => ({ warnings: ['Warning'] }),
    });
    const form = new FormGroup({ field: control });
    control.updateValueAndValidity();
    const errors = getAllFormErrors(form);
    expect(errors['field']).toEqual([]);
    expect((errors['field'] as any).warnings).toEqual(['Warning']);
  });

  it('should collect errors from deeply nested structures', () => {
    const deepControl = new FormControl('', {
      validators: () => ({ errors: ['Deep error'] }),
    });
    const form = new FormGroup({
      level1: new FormGroup({
        level2: new FormGroup({
          level3: deepControl,
        }),
      }),
    });
    deepControl.updateValueAndValidity();
    const errors = getAllFormErrors(form);
    expect(errors['level1.level2.level3']).toEqual(['Deep error']);
  });
});
