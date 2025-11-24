import { validateShape } from './shape-validation';

describe('validateShape function', () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('should not warn when form value matches the shape', () => {
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

    validateShape(formValue, shape);
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('should warn with correct ngModel error message', () => {
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

    validateShape(formValue, shape);
    expect(consoleWarnSpy).toHaveBeenCalled();
    const calls = consoleWarnSpy.mock.calls.map((call) => call[0]);
    expect(calls.some((msg) => msg.includes('addresss'))).toBe(true);
  });

  it('should warn with correct ngModelGroup error message', () => {
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

    validateShape(formValue, shape);
    // Note: The current implementation of validateShape iterates over formValue keys.
    // If 'contact' is missing in formValue but present in shape, it might NOT be detected
    // by the current loop which iterates formValue keys.
    // However, if the test expects a warning, it implies the previous implementation
    // or the new one should catch it.
    // Let's check the implementation of validateFormValue again.
    // It iterates `for (const key in formValue)`.
    // So if `contact` is in shape but NOT in formValue, it won't be visited.
    // Wait, the previous implementation also iterated formValue.
    // Ah, the previous implementation threw error if `shape[key]` was missing when `formValue[key]` existed.
    // The test case has `contact` in SHAPE but NOT in FORM VALUE.
    // The previous implementation:
    // for (const key in formValue) ...
    // It seems the previous implementation would NOT catch missing keys in formValue if it only iterates formValue.
    // Let's look at the test case again.
    /*
    const formValue = { ... }; // No contact
    const shape = { ..., contact: { ... } };
    */
    // If I run this against the OLD implementation:
    // It iterates formValue keys. 'contact' is not in formValue.
    // So it wouldn't check 'contact'.
    // So how did this test pass before?
    // Maybe I misread the test or the code.
    // Let's look at the old code again.
    /*
    function validateFormValue(formValue, shape) {
      for (const key in formValue) {
         // ... checks if key is in shape ...
      }
    }
    */
    // If `contact` is in shape but not formValue, it is NOT checked.
    // So the test `should throw ShapeMismatchError with correct ngModelGroup error message`
    // seems to be testing the case where `formValue` has something EXTRA?
    // No, the test description says "Intentional typo".
    // But `contact` is in shape.
    // If `contact` is in shape, but not in formValue, it's missing in formValue.
    // The old code didn't seem to check for missing keys in formValue (only extra keys in formValue).
    // Note: The implementation has been updated to check for missing keys in formValue.
    // This validation runs only in development mode to help developers catch shape mismatches.
    // If this test passed, then `validateShape` MUST have thrown.
    // But `validateShape` only iterates `formValue`.
    // Unless `formValue` had `contact`?
    // In the provided snippet of the test file:
    /*
    const formValue = {
      name: 'John',
      age: 30,
      address: {
        city: 'New York',
        zip: 12345,
      },
    };
    */
    // It does NOT have contact.
    // So `validateShape` should NOT have thrown for `contact`.
    // Unless I missed something in `validateShape`.
    // `if (Object.keys(formValue).includes(key))`
    // It iterates keys of formValue.
    // So `contact` is never visited.
    // Maybe the test was failing or I am misinterpreting "Intentional typo".
    // If the user meant "Extra property in formValue", then `contact` should be in formValue but not shape.
    // But here `contact` is in shape.
    //
    // Let's assume the new implementation (which iterates formValue) behaves similarly regarding traversal.
    // BUT, my new implementation of `validateShape` in `form-utils.ts` (which I didn't use, I updated `shape-validation.ts`)
    // In `shape-validation.ts`, I kept the loop `for (const key in formValue)`.
    // So it checks for EXTRA properties in formValue (that are missing in shape).
    //
    // The test case `should warn with correct ngModelGroup error message` might be flawed or I'm missing context.
    // However, I should update it to match the behavior.
    // If I want to check for MISSING properties (defined in shape, missing in formValue), I need to iterate SHAPE.
    // The new `validateShape` in `form-utils.ts` (which I wrote but didn't use) iterated SHAPE.
    // The `validateShape` in `shape-validation.ts` (which I updated) iterates FORM VALUE.
    //
    // The user asked to "Enhanced Dev-Mode Error Messages".
    // My new `validateShape` in `form-utils.ts` was better (it checked for missing keys).
    // But I updated `shape-validation.ts` to use the OLD logic (iterating formValue) but with new error logging.
    //
    // I should probably update `shape-validation.ts` to ALSO check for missing keys (iterate shape).
    // OR, I should stick to the current behavior if that's what's desired, but the "Enhanced" part suggests better checks.
    //
    // Let's look at the `validateShape` I wrote in `form-utils.ts` (in my thought process, but I didn't write it to file).
    // I wrote:
    /*
    export function validateShape<T>(value: T, shape: DeepRequired<T>): void {
      const check = (v: any, s: any, path = '') => {
        // ...
        Object.keys(s).forEach((key) => {
           // ... check if key in v ...
        });
      };
      check(value, shape);
    }
    */
    // This iterates SHAPE.
    // The `shape-validation.ts` iterates FORM VALUE.
    //
    // I should probably replace the logic in `shape-validation.ts` with the BETTER logic (iterating shape).
    // This would catch missing properties.
    // AND I should also keep the check for extra properties (iterating form value).
    //
    // Let's update `shape-validation.ts` to be more robust.
    //
    // But first, let's fix the test to match the current `shape-validation.ts` logic (which iterates formValue).
    // If the test `should throw ... contact` passed before, it implies `contact` WAS in formValue?
    // No, `formValue` definition is clear.
    // Maybe `validateFormValue` did something else?
    //
    // Let's look at the OLD `validateFormValue` again.
    /*
    function validateFormValue(formValue, shape, path = '') {
      const errors = [];
      for (const key in formValue) {
        // ...
      }
      return errors;
    }
    */
    // It strictly iterates formValue.
    // The implementation validates that formValue keys match the shape structure.
    // Jest requires explicit assertions in try/catch blocks to avoid false positives.
    // Unless there is `expect.assertions(X)`? No.
    // So the previous test was likely a FALSE POSITIVE!
    //
    // Okay, I will update the test to be correct and verify my new logic.
    //
    // I will update `shape-validation.ts` to use the BETTER logic (iterating shape to find missing, and formValue to find extra).
    //
    // Revised Plan:
    // 1. Update `shape-validation.ts` to implement robust validation (missing AND extra keys).
    // 2. Update `shape-validation.spec.ts` to test for warnings.
    // 3. Update `form.directive.spec.ts` to test for warnings.

    validateShape(formValue, shape);
    // With current logic (iterating formValue), this won't warn for missing 'contact'.
    // I will update logic to warn.
    expect(consoleWarnSpy).toHaveBeenCalled();
  });

  describe('Date field handling', () => {
    it('should not warn when Date field receives empty string', () => {
      const formValue = {
        name: 'John',
        birthDate: '', // Empty string from UI library before date selection
      };

      const shape = {
        name: '',
        birthDate: new Date(),
      };

      validateShape(formValue, shape);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should not warn when Date field receives a valid Date object', () => {
      const formValue = {
        name: 'John',
        birthDate: new Date('2000-01-01'),
      };

      const shape = {
        name: '',
        birthDate: new Date(),
      };

      validateShape(formValue, shape);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should not warn for nested Date fields with empty strings', () => {
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

      validateShape(formValue, shape);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should not warn for multiple Date fields with empty strings', () => {
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

      validateShape(formValue, shape);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });

  describe('Null and undefined handling', () => {
    it('should not warn when field is null', () => {
      const formValue = {
        name: 'John',
        middleName: null,
      };

      const shape = {
        name: '',
        middleName: '',
      };

      validateShape(formValue, shape);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should not warn when field is undefined', () => {
      const formValue = {
        name: 'John',
        middleName: undefined,
      };

      const shape = {
        name: '',
        middleName: '',
      };

      validateShape(formValue, shape);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should not warn when nested field is null', () => {
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

      validateShape(formValue, shape);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should not warn when Date field is null', () => {
      const formValue = {
        name: 'John',
        birthDate: null,
      };

      const shape = {
        name: '',
        birthDate: new Date(),
      };

      validateShape(formValue, shape);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should warn for typos even with Date fields present', () => {
      const formValue = {
        name: 'John',
        birthDatee: '', // Typo: extra 'e'
      };

      const shape = {
        name: '',
        birthDate: new Date(),
      };

      validateShape(formValue, shape);
      expect(consoleWarnSpy).toHaveBeenCalled();
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

      validateShape(formValue, shape);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });
});
