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
  it('should merge values and raw values correctly', () => {
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
      name: 'John',
      age: 30,
      address: {
        city: 'New York',
        zip: 12_345,
      },
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
