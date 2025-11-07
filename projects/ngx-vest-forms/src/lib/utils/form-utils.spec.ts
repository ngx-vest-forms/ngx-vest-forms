import {
  EmailValidator,
  FormArray,
  FormControl,
  FormGroup,
  RequiredValidator,
  Validators,
} from '@angular/forms';
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
});
