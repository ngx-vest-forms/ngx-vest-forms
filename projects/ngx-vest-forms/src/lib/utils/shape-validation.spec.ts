import { ShapeMismatchError, validateShape } from './shape-validation';

describe('validateShape function', () => {
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

  it('should throw ShapeMismatchError with correct ngModel error message', () => {
    const formValue = {
      name: 'John',
      age: 30,
      addresss: {
        city: 'New York',
        zip: 12_345,
      },
    };

    const shape = {
      name: '',
      age: 0,
      // Intentional typo, should throw error
      address: {
        city: '',
        zip: 0,
      },
    };

    try {
      validateShape(formValue, shape);
    } catch (error) {
      expect(error).toBeInstanceOf(ShapeMismatchError);
      expect((error as ShapeMismatchError).message).toContain(
        `[ngModelGroup] Mismatch: 'addresss'`,
      );
      expect((error as ShapeMismatchError).message).toContain(
        `[ngModel] Mismatch 'addresss.city'`,
      );
      expect((error as ShapeMismatchError).message).toContain(
        `[ngModel] Mismatch 'addresss.zip'`,
      );
    }
  });

  it('should throw ShapeMismatchError with correct ngModelGroup error message', () => {
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
      // Intentional typo, should throw error
      address: {
        city: '',
        zip: 0,
      },
      // Intentional typo, should throw error
      contact: {
        email: '',
        phone: '',
      },
    };

    try {
      validateShape(formValue, shape);
    } catch (error) {
      expect(error).toBeInstanceOf(ShapeMismatchError);
      expect((error as ShapeMismatchError).message).toContain(
        "[ngModelGroup] Mismatch: 'contact'",
      );
    }
  });
});
