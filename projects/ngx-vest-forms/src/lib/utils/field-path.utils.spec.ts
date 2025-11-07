import { parseFieldPath, stringifyFieldPath } from './field-path.utils';

describe('field-path.utils', () => {
  describe('parseFieldPath', () => {
    it('should handle empty string', () => {
      expect(parseFieldPath('')).toEqual([]);
    });

    it('should parse simple property paths', () => {
      expect(parseFieldPath('email')).toEqual(['email']);
      expect(parseFieldPath('firstName')).toEqual(['firstName']);
    });

    it('should parse nested property paths', () => {
      expect(parseFieldPath('user.email')).toEqual(['user', 'email']);
      expect(parseFieldPath('user.profile.name')).toEqual([
        'user',
        'profile',
        'name',
      ]);
      expect(parseFieldPath('a.b.c.d.e')).toEqual(['a', 'b', 'c', 'd', 'e']);
    });

    it('should parse array indices', () => {
      expect(parseFieldPath('items[0]')).toEqual(['items', 0]);
      expect(parseFieldPath('items[42]')).toEqual(['items', 42]);
      expect(parseFieldPath('items[123]')).toEqual(['items', 123]);
    });

    it('should parse nested array paths', () => {
      expect(parseFieldPath('items[0][1]')).toEqual(['items', 0, 1]);
      expect(parseFieldPath('matrix[0][1][2]')).toEqual(['matrix', 0, 1, 2]);
    });

    it('should parse mixed property and array paths', () => {
      expect(parseFieldPath('users[0].email')).toEqual(['users', 0, 'email']);
      expect(parseFieldPath('users[0].addresses[1].street')).toEqual([
        'users',
        0,
        'addresses',
        1,
        'street',
      ]);
      expect(parseFieldPath('form.sections[2].fields[3].value')).toEqual([
        'form',
        'sections',
        2,
        'fields',
        3,
        'value',
      ]);
    });

    it('should handle complex real-world paths', () => {
      expect(
        parseFieldPath('generalInfo.addresses.billingAddress.street')
      ).toEqual(['generalInfo', 'addresses', 'billingAddress', 'street']);

      expect(parseFieldPath('phoneNumbers[0].number')).toEqual([
        'phoneNumbers',
        0,
        'number',
      ]);

      expect(parseFieldPath('profile.socialLinks[2].url')).toEqual([
        'profile',
        'socialLinks',
        2,
        'url',
      ]);
    });

    it('should convert numeric string segments to numbers', () => {
      const result = parseFieldPath('items[0].nested[1]');
      expect(result[1]).toBe(0);
      expect(result[3]).toBe(1);
      expect(typeof result[1]).toBe('number');
      expect(typeof result[3]).toBe('number');
    });

    it('should preserve non-numeric string segments as strings', () => {
      const result = parseFieldPath('user.profile.name');
      expect(typeof result[0]).toBe('string');
      expect(typeof result[1]).toBe('string');
      expect(typeof result[2]).toBe('string');
    });
  });

  describe('stringifyFieldPath', () => {
    it('should handle empty array', () => {
      expect(stringifyFieldPath([])).toBe('');
    });

    it('should stringify simple property paths', () => {
      expect(stringifyFieldPath(['email'])).toBe('email');
      expect(stringifyFieldPath(['firstName'])).toBe('firstName');
    });

    it('should stringify nested property paths', () => {
      expect(stringifyFieldPath(['user', 'email'])).toBe('user.email');
      expect(stringifyFieldPath(['user', 'profile', 'name'])).toBe(
        'user.profile.name'
      );
      expect(stringifyFieldPath(['a', 'b', 'c', 'd', 'e'])).toBe('a.b.c.d.e');
    });

    it('should stringify array indices', () => {
      expect(stringifyFieldPath(['items', 0])).toBe('items[0]');
      expect(stringifyFieldPath(['items', 42])).toBe('items[42]');
      expect(stringifyFieldPath(['items', 123])).toBe('items[123]');
    });

    it('should stringify nested array paths', () => {
      expect(stringifyFieldPath(['items', 0, 1])).toBe('items[0][1]');
      expect(stringifyFieldPath(['matrix', 0, 1, 2])).toBe('matrix[0][1][2]');
    });

    it('should stringify mixed property and array paths', () => {
      expect(stringifyFieldPath(['users', 0, 'email'])).toBe('users[0].email');
      expect(stringifyFieldPath(['users', 0, 'addresses', 1, 'street'])).toBe(
        'users[0].addresses[1].street'
      );
      expect(
        stringifyFieldPath(['form', 'sections', 2, 'fields', 3, 'value'])
      ).toBe('form.sections[2].fields[3].value');
    });

    it('should handle complex real-world paths', () => {
      expect(
        stringifyFieldPath([
          'generalInfo',
          'addresses',
          'billingAddress',
          'street',
        ])
      ).toBe('generalInfo.addresses.billingAddress.street');

      expect(stringifyFieldPath(['phoneNumbers', 0, 'number'])).toBe(
        'phoneNumbers[0].number'
      );

      expect(stringifyFieldPath(['profile', 'socialLinks', 2, 'url'])).toBe(
        'profile.socialLinks[2].url'
      );
    });

    it('should not add dot before array index', () => {
      expect(stringifyFieldPath(['items', 0])).toBe('items[0]');
      expect(stringifyFieldPath(['items', 0])).not.toBe('items.[0]');
    });

    it('should add dot after array index when followed by property', () => {
      expect(stringifyFieldPath(['items', 0, 'name'])).toBe('items[0].name');
    });
  });

  describe('round-trip conversion', () => {
    it('should maintain equivalence through parse → stringify', () => {
      const paths = [
        'email',
        'user.email',
        'user.profile.name',
        'items[0]',
        'items[0].name',
        'users[0].addresses[1].street',
        'form.sections[2].fields[3].value',
        'generalInfo.addresses.billingAddress.street',
      ];

      paths.forEach((path) => {
        const parsed = parseFieldPath(path);
        const stringified = stringifyFieldPath(parsed);
        expect(stringified).toBe(path);
      });
    });

    it('should maintain equivalence through stringify → parse', () => {
      const pathArrays: (string | number)[][] = [
        ['email'],
        ['user', 'email'],
        ['user', 'profile', 'name'],
        ['items', 0],
        ['items', 0, 'name'],
        ['users', 0, 'addresses', 1, 'street'],
        ['form', 'sections', 2, 'fields', 3, 'value'],
      ];

      pathArrays.forEach((pathArray) => {
        const stringified = stringifyFieldPath(pathArray);
        const parsed = parseFieldPath(stringified);
        expect(parsed).toEqual(pathArray);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle paths with numeric property names', () => {
      // Note: Numeric strings in property position become numbers
      const result = parseFieldPath('obj.123.value');
      expect(result).toEqual(['obj', 123, 'value']);
    });

    it('should handle single array index', () => {
      expect(parseFieldPath('[0]')).toEqual([0]);
      expect(stringifyFieldPath([0])).toBe('[0]');
    });

    it('should handle consecutive array indices', () => {
      expect(parseFieldPath('[0][1][2]')).toEqual([0, 1, 2]);
      expect(stringifyFieldPath([0, 1, 2])).toBe('[0][1][2]');
    });
  });
});
