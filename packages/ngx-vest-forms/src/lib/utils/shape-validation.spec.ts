import { vi } from 'vitest';
import { validateShape } from './shape-validation';

describe('validateShape function', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  describe('matching shapes', () => {
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
  });

  describe('extra properties (typos)', () => {
    it('should warn when formValue has extra property (typo in name attribute)', () => {
      const formValue = {
        name: 'John',
        age: 30,
        addresss: {
          // Typo: extra 's'
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
      expect(consoleWarnSpy).toHaveBeenCalled();
      const calls = consoleWarnSpy.mock.calls.map((call: unknown[]) => call[0]);
      expect(
        calls.some((msg: unknown) => String(msg).includes('addresss'))
      ).toBe(true);
    });

    it('should warn when nested property has typo', () => {
      const formValue = {
        address: {
          citty: 'New York', // Typo: extra 't'
        },
      };

      const shape = {
        address: {
          city: '',
        },
      };

      validateShape(formValue, shape);
      expect(consoleWarnSpy).toHaveBeenCalled();
      const calls = consoleWarnSpy.mock.calls.map((call: unknown[]) => call[0]);
      expect(
        calls.some((msg: unknown) => String(msg).includes('address.citty'))
      ).toBe(true);
    });
  });

  describe('missing properties (intentional - dynamic forms)', () => {
    it('should NOT warn when formValue is missing properties from shape', () => {
      // This is intentional: forms build incrementally with NgxDeepPartial,
      // and @if conditionally renders fields
      const formValue = {
        name: 'John',
        age: 30,
      };

      const shape = {
        name: '',
        age: 0,
        address: {
          city: '',
          zip: 0,
        },
        contact: {
          email: '',
          phone: '',
        },
      };

      validateShape(formValue, shape);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should NOT warn when nested formValue is missing properties', () => {
      const formValue = {
        address: {
          city: 'New York',
          // zip is missing - this is fine
        },
      };

      const shape = {
        address: {
          city: '',
          zip: 0,
        },
      };

      validateShape(formValue, shape);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });

  describe('type mismatches', () => {
    it('should warn when formValue has object but shape expects primitive', () => {
      const formValue = {
        name: { first: 'John' }, // Object instead of string
      };

      const shape = {
        name: '',
      };

      validateShape(formValue, shape);
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should warn when formValue has opaque leaf (Date) but shape expects primitive', () => {
      const formValue = {
        birthDate: new Date(),
      };

      const shape = {
        birthDate: '', // Shape declares a string primitive
      };

      validateShape(formValue, shape);
      expect(consoleWarnSpy).toHaveBeenCalled();
      const calls = consoleWarnSpy.mock.calls.map((call: unknown[]) => call[0]);
      expect(
        calls.some(
          (msg: unknown) =>
            String(msg).includes('birthDate') &&
            String(msg).toLowerCase().includes('type')
        )
      ).toBe(true);
    });
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

    it('should treat opaque leaf values as non-recursive objects', () => {
      const opaqueLeafCases: Array<{
        label: string;
        value: unknown;
        shape: unknown;
      }> = [
        {
          label: 'Date',
          value: Object.assign(new Date('2000-01-01'), {
            accidental: { deep: 'value' },
          }),
          shape: new Date(),
        },
        {
          label: 'Map',
          value: Object.assign(new Map([['key', 'value']]), {
            accidental: { deep: 'value' },
          }),
          shape: new Map(),
        },
        {
          label: 'Set',
          value: Object.assign(new Set(['value']), {
            accidental: { deep: 'value' },
          }),
          shape: new Set(),
        },
        {
          label: 'RegExp',
          value: Object.assign(/test/u, {
            accidental: { deep: 'value' },
          }),
          shape: /shape/u,
        },
      ];

      if (typeof File !== 'undefined') {
        opaqueLeafCases.push({
          label: 'File',
          value: Object.assign(new File(['value'], 'test.txt'), {
            accidental: { deep: 'value' },
          }),
          shape: new File(['shape'], 'shape.txt'),
        });
      }

      if (typeof Blob !== 'undefined') {
        opaqueLeafCases.push({
          label: 'Blob',
          value: Object.assign(new Blob(['value']), {
            accidental: { deep: 'value' },
          }),
          shape: new Blob(['shape']),
        });
      }

      opaqueLeafCases.forEach(({ value, shape }) => {
        validateShape({ leaf: value }, { leaf: shape });
        expect(consoleWarnSpy.mock.calls).toHaveLength(0);
      });
    });
  });

  describe('null and undefined handling', () => {
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

  describe('array handling', () => {
    it('should validate array items against first shape item', () => {
      const formValue = {
        items: {
          '0': { name: 'Item 1' },
          '1': { name: 'Item 2' },
          '2': { name: 'Item 3' },
        },
      };

      const shape = {
        items: {
          '0': { name: '' },
        },
      };

      validateShape(formValue, shape);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should warn for typos in array items', () => {
      const formValue = {
        items: {
          '0': { namee: 'Item 1' }, // Typo
        },
      };

      const shape = {
        items: {
          '0': { name: '' },
        },
      };

      validateShape(formValue, shape);
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it("should not treat partially numeric keys like '123abc' as array indices", () => {
      const formValue = {
        items: {
          '123abc': { name: 'Item 123' },
        },
      };

      const shape = {
        items: {
          '0': { name: '' },
        },
      };

      validateShape(formValue, shape);

      expect(consoleWarnSpy).toHaveBeenCalled();
      const calls = consoleWarnSpy.mock.calls.map((call: unknown[]) => call[0]);
      expect(
        calls.some((msg: unknown) => String(msg).includes('items.123abc'))
      ).toBe(true);
    });
  });

  describe('edge cases', () => {
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

    it('should handle empty formValue', () => {
      const formValue = {};

      const shape = {
        name: '',
        age: 0,
      };

      validateShape(formValue, shape);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should handle deeply nested structures', () => {
      const formValue = {
        level1: {
          level2: {
            level3: {
              value: 'deep',
            },
          },
        },
      };

      const shape = {
        level1: {
          level2: {
            level3: {
              value: '',
            },
          },
        },
      };

      validateShape(formValue, shape);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });
});
