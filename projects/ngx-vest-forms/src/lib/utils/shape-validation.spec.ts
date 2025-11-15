import { ShapeMismatchError, validateShape } from './shape-validation';

describe('validateShape function', () => {
  it('should not throw error when form value matches the shape', () => {
    const formValue = {
      name: 'John',
      age: 30,
      address: {
        city: 'New York',
        zip: 12345,
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
        zip: 12345,
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
        `[ngModelGroup] Mismatch: 'addresss'`
      );
      expect((error as ShapeMismatchError).message).toContain(
        `[ngModel] Mismatch 'addresss.city'`
      );
      expect((error as ShapeMismatchError).message).toContain(
        `[ngModel] Mismatch 'addresss.zip'`
      );
    }
  });

  it('should throw ShapeMismatchError with correct ngModelGroup error message', () => {
    const formValue = {
      name: 'John',
      age: 30,
      address: {
        city: 'New York',
        zip: 12345,
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
        "[ngModelGroup] Mismatch: 'contact'"
      );
    }
  });

  describe('Date field handling', () => {
    it('should not throw error when Date field receives empty string', () => {
      const formValue = {
        name: 'John',
        birthDate: '', // Empty string from UI library before date selection
      };

      const shape = {
        name: '',
        birthDate: new Date(),
      };

      expect(() => {
        validateShape(formValue, shape);
      }).not.toThrow();
    });

    it('should not throw error when Date field receives a valid Date object', () => {
      const formValue = {
        name: 'John',
        birthDate: new Date('2000-01-01'),
      };

      const shape = {
        name: '',
        birthDate: new Date(),
      };

      expect(() => {
        validateShape(formValue, shape);
      }).not.toThrow();
    });

    it('should not throw error for nested Date fields with empty strings', () => {
      const formValue = {
        person: {
          name: 'John',
          birthDate: '',
          appointments: {
            nextVisit: '',
          },
        },
      };

      const shape = {
        person: {
          name: '',
          birthDate: new Date(),
          appointments: {
            nextVisit: new Date(),
          },
        },
      };

      expect(() => {
        validateShape(formValue, shape);
      }).not.toThrow();
    });

    it('should not throw error for multiple Date fields with empty strings', () => {
      const formValue = {
        startDate: '',
        endDate: '',
        eventDate: '',
      };

      const shape = {
        startDate: new Date(),
        endDate: new Date(),
        eventDate: new Date(),
      };

      expect(() => {
        validateShape(formValue, shape);
      }).not.toThrow();
    });
  });

  describe('Null and undefined handling', () => {
    it('should not throw error when field is null', () => {
      const formValue = {
        name: 'John',
        middleName: null,
      };

      const shape = {
        name: '',
        middleName: '',
      };

      expect(() => {
        validateShape(formValue, shape);
      }).not.toThrow();
    });

    it('should not throw error when field is undefined', () => {
      const formValue = {
        name: 'John',
        middleName: undefined,
      };

      const shape = {
        name: '',
        middleName: '',
      };

      expect(() => {
        validateShape(formValue, shape);
      }).not.toThrow();
    });

    it('should not throw error when nested field is null', () => {
      const formValue = {
        person: {
          name: 'John',
          address: null,
        },
      };

      const shape = {
        person: {
          name: '',
          address: {
            city: '',
          },
        },
      };

      expect(() => {
        validateShape(formValue, shape);
      }).not.toThrow();
    });

    it('should not throw error when Date field is null', () => {
      const formValue = {
        name: 'John',
        birthDate: null,
      };

      const shape = {
        name: '',
        birthDate: new Date(),
      };

      expect(() => {
        validateShape(formValue, shape);
      }).not.toThrow();
    });
  });

  describe('Edge cases', () => {
    it('should throw error for typos even with Date fields present', () => {
      const formValue = {
        name: 'John',
        birthDatee: '', // Typo: extra 'e'
      };

      const shape = {
        name: '',
        birthDate: new Date(),
      };

      expect(() => {
        validateShape(formValue, shape);
      }).toThrow(ShapeMismatchError);
    });

    it('should handle mixed Date fields and regular fields correctly', () => {
      const formValue = {
        name: 'John',
        age: 30,
        birthDate: '',
        email: null,
        phoneNumber: undefined,
      };

      const shape = {
        name: '',
        age: 0,
        birthDate: new Date(),
        email: '',
        phoneNumber: '',
      };

      expect(() => {
        validateShape(formValue, shape);
      }).not.toThrow();
    });
  });
});
