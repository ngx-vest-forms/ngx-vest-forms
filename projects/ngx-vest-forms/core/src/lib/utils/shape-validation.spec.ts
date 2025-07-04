import * as angularCore from '@angular/core'; // Import to mock
import { describe, expect, it, vi } from 'vitest'; // Import vi for mocking isDevMode
import {
  ModelTemplateMismatchError,
  ShapeMismatchError,
  validateModelTemplate, // Deprecated alias
  validateShape, // Deprecated alias
} from './shape-validation';

// Mock the @angular/core module to control isDevMode
vi.mock('@angular/core', async (importOriginal) => {
  const actual = await importOriginal<typeof angularCore>();
  return {
    ...actual, // Keep original exports
    isDevMode: () => true, // Mock isDevMode to always return true for tests
  };
});

describe('validateModelTemplate function', () => {
  it('should not throw error when form value matches the model template', () => {
    const formValue = {
      name: 'John',
      age: 30,
      address: {
        city: 'New York',
        zip: 12_345,
      },
    };

    const modelTemplate = {
      name: '',
      age: 0,
      address: {
        city: '',
        zip: 0,
      },
    };

    expect(() => {
      validateModelTemplate(formValue, modelTemplate);
    }).not.toThrow();
  });

  it('should throw ModelTemplateMismatchError with correct ngModelGroup/ngModel error message for extra fields in value', () => {
    const formValue = {
      name: 'John',
      age: 30,
      extraField: 'unexpected value',
      address: {
        city: 'New York',
        zip: 12_345,
        country: 'USA',
      },
      extraGroup: {
        data: 'some data',
      },
    };

    const modelTemplate = {
      name: '',
      age: 0,
      address: {
        city: '',
        zip: 0,
      },
    };

    try {
      validateModelTemplate(formValue, modelTemplate);
      expect.fail('validateModelTemplate should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(ModelTemplateMismatchError);
      const messages = (error as ModelTemplateMismatchError).errors.join('\n');
      expect(messages).toContain("[ngModel] Mismatch 'extraField'");
      expect(messages).toContain("[ngModel] Mismatch 'address.country'");
      expect(messages).toContain("[ngModelGroup] Mismatch: 'extraGroup'");
    }
  });
});

describe('validateShape function (deprecated)', () => {
  it('should not throw error when form value matches the shape', () => {
    const formValue = {
      name: 'John',
      age: 30,
      address: {
        city: 'New York',
        zip: 12_345,
      },
    };

    const shape = {
      name: '',
      age: 0,
      address: {
        city: '',
        zip: 0,
      },
    };

    expect(() => {
      validateShape(formValue, shape);
    }).not.toThrow();
  });

  it('should throw ShapeMismatchError with correct ngModelGroup/ngModel error message for extra fields in value', () => {
    const formValue = {
      name: 'John',
      age: 30,
      extraField: 'unexpected value',
      address: {
        city: 'New York',
        zip: 12_345,
        country: 'USA',
      },
      extraGroup: {
        data: 'some data',
      },
    };

    const shape = {
      name: '',
      age: 0,
      address: {
        city: '',
        zip: 0,
      },
    };

    try {
      validateShape(formValue, shape);
      expect.fail('validateShape should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(ShapeMismatchError);
      const messages = (error as ShapeMismatchError).errors.join('\n');
      expect(messages).toContain("[ngModel] Mismatch 'extraField'");
      expect(messages).toContain("[ngModel] Mismatch 'address.country'");
      expect(messages).toContain("[ngModelGroup] Mismatch: 'extraGroup'");
    }
  });
});
