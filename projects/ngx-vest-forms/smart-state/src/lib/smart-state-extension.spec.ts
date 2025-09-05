import { signal, WritableSignal } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SmartStateExtension } from './smart-state-extension';
import {
  ConflictState,
  SmartStateOptions,
} from './smart-state-extension.types';

// Test model types
type UserProfile = {
  name: string;
  email: string;
  preferences?: {
    theme: string;
    notifications: boolean;
  };
};

type SimpleModel = {
  field1: string;
  field2: number;
};

describe('SmartStateExtension', () => {
  let smartState: SmartStateExtension<UserProfile>;
  let conflictSignal: WritableSignal<ConflictState<UserProfile>>;

  beforeEach(() => {
    conflictSignal = signal<ConflictState<UserProfile>>(null);
    smartState = new SmartStateExtension<UserProfile>(conflictSignal);
  });

  describe('Constructor and Basic Setup', () => {
    it('should create instance without conflict signal', () => {
      const instance = new SmartStateExtension<UserProfile>();
      expect(instance).toBeDefined();
      expect(instance.hasConflict()).toBe(false);
    });

    it('should create instance with conflict signal', () => {
      expect(smartState).toBeDefined();
      expect(smartState.hasConflict()).toBe(false);
    });

    it('should detect conflicts when conflict signal has value', () => {
      const conflict: ConflictState<UserProfile> = {
        local: { name: 'John', email: 'john@local.com' },
        external: { name: 'Jane', email: 'jane@external.com' },
        timestamp: Date.now(),
      };

      conflictSignal.set(conflict);
      expect(smartState.hasConflict()).toBe(true);
    });
  });

  describe('deepEqual', () => {
    const extension = new SmartStateExtension<unknown>();

    it('should return true for identical primitive values', () => {
      expect(extension.deepEqual('test', 'test')).toBe(true);
      expect(extension.deepEqual(42, 42)).toBe(true);
      expect(extension.deepEqual(true, true)).toBe(true);
      expect(extension.deepEqual(null, null)).toBe(true);
      expect(extension.deepEqual()).toBe(true);
    });

    it('should return false for different primitive values', () => {
      expect(extension.deepEqual('test', 'other')).toBe(false);
      expect(extension.deepEqual(42, 43)).toBe(false);
      expect(extension.deepEqual(true, false)).toBe(false);
      expect(extension.deepEqual(null)).toBe(false);
    });

    it('should handle null and undefined correctly', () => {
      expect(extension.deepEqual(null, 'test')).toBe(false);
      expect(extension.deepEqual(undefined, 'test')).toBe(false);
      expect(extension.deepEqual('test', null)).toBe(false);
      expect(extension.deepEqual('test')).toBe(false);
    });

    it('should return true for deeply equal objects', () => {
      const object1 = { name: 'John', preferences: { theme: 'dark' } };
      const object2 = { name: 'John', preferences: { theme: 'dark' } };
      expect(extension.deepEqual(object1, object2)).toBe(true);
    });

    it('should return false for objects with different values', () => {
      const object1 = { name: 'John', preferences: { theme: 'dark' } };
      const object2 = { name: 'John', preferences: { theme: 'light' } };
      expect(extension.deepEqual(object1, object2)).toBe(false);
    });

    it('should handle arrays correctly', () => {
      expect(extension.deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(extension.deepEqual([1, 2, 3], [1, 2, 4])).toBe(false);
      expect(extension.deepEqual([1, 2], [1, 2, 3])).toBe(false);
      expect(extension.deepEqual(['a', 'b'], ['a', 'b'])).toBe(true);
    });

    it('should handle nested arrays and objects', () => {
      const object1 = { items: [{ id: 1, name: 'test' }], meta: { count: 1 } };
      const object2 = { items: [{ id: 1, name: 'test' }], meta: { count: 1 } };
      const object3 = { items: [{ id: 1, name: 'test' }], meta: { count: 2 } };

      expect(extension.deepEqual(object1, object2)).toBe(true);
      expect(extension.deepEqual(object1, object3)).toBe(false);
    });

    it('should return false for objects vs arrays', () => {
      expect(extension.deepEqual({}, [])).toBe(false);
      expect(extension.deepEqual([], {})).toBe(false);
    });

    it('should handle objects with different key counts', () => {
      const object1 = { name: 'John' };
      const object2 = { name: 'John', email: 'john@example.com' };
      expect(extension.deepEqual(object1, object2)).toBe(false);
    });
  });

  describe('getNestedValue', () => {
    const extension = new SmartStateExtension<unknown>();
    const testObject = {
      user: {
        profile: {
          email: 'test@example.com',
          settings: {
            theme: 'dark',
            notifications: true,
          },
        },
        name: 'John Doe',
      },
      tags: ['admin', 'user'],
    };

    it('should get top-level properties', () => {
      expect(extension.getNestedValue(testObject, 'tags')).toEqual([
        'admin',
        'user',
      ]);
    });

    it('should get nested properties with dot notation', () => {
      expect(extension.getNestedValue(testObject, 'user.name')).toBe(
        'John Doe',
      );
      expect(extension.getNestedValue(testObject, 'user.profile.email')).toBe(
        'test@example.com',
      );
      expect(
        extension.getNestedValue(testObject, 'user.profile.settings.theme'),
      ).toBe('dark');
      expect(
        extension.getNestedValue(
          testObject,
          'user.profile.settings.notifications',
        ),
      ).toBe(true);
    });

    it('should return undefined for non-existent paths', () => {
      expect(
        extension.getNestedValue(testObject, 'nonexistent'),
      ).toBeUndefined();
      expect(
        extension.getNestedValue(testObject, 'user.nonexistent'),
      ).toBeUndefined();
      expect(
        extension.getNestedValue(testObject, 'user.profile.nonexistent'),
      ).toBeUndefined();
    });

    it('should handle null/undefined objects gracefully', () => {
      expect(extension.getNestedValue(null, 'user.name')).toBeUndefined();
      expect(extension.getNestedValue(undefined, 'user.name')).toBeUndefined();
      expect(extension.getNestedValue('string', 'user.name')).toBeUndefined();
      expect(extension.getNestedValue(42, 'user.name')).toBeUndefined();
    });

    it('should handle paths with null/undefined intermediate values', () => {
      const objectWithNulls = { user: null, admin: { profile: undefined } };
      expect(
        extension.getNestedValue(objectWithNulls, 'user.name'),
      ).toBeUndefined();
      expect(
        extension.getNestedValue(objectWithNulls, 'admin.profile.email'),
      ).toBeUndefined();
    });

    it('should handle empty path', () => {
      expect(extension.getNestedValue(testObject, '')).toBe(testObject);
    });
  });

  describe('setNestedValue', () => {
    const extension = new SmartStateExtension<unknown>();

    it('should set top-level properties', () => {
      const target = { name: 'John' };
      extension.setNestedValue(target, 'email', 'john@example.com');
      expect(target).toEqual({ name: 'John', email: 'john@example.com' });
    });

    it('should set nested properties', () => {
      const target = { user: { name: 'John' } };
      extension.setNestedValue(target, 'user.email', 'john@example.com');
      expect(target).toEqual({
        user: { name: 'John', email: 'john@example.com' },
      });
    });

    it('should create intermediate objects when needed', () => {
      const target = {};
      extension.setNestedValue(
        target,
        'user.profile.email',
        'test@example.com',
      );
      expect(target).toEqual({
        user: { profile: { email: 'test@example.com' } },
      });
    });

    it('should overwrite non-object intermediate values', () => {
      const target = { user: 'string' };
      extension.setNestedValue(
        target,
        'user.profile.email',
        'test@example.com',
      );
      expect(target).toEqual({
        user: { profile: { email: 'test@example.com' } },
      });
    });

    it('should handle null intermediate values', () => {
      const target = { user: null };
      extension.setNestedValue(
        target,
        'user.profile.email',
        'test@example.com',
      );
      expect(target).toEqual({
        user: { profile: { email: 'test@example.com' } },
      });
    });

    it('should handle invalid targets gracefully', () => {
      // Should not throw for invalid targets
      expect(() =>
        extension.setNestedValue(null, 'user.name', 'John'),
      ).not.toThrow();
      expect(() =>
        extension.setNestedValue(undefined, 'user.name', 'John'),
      ).not.toThrow();
      expect(() =>
        extension.setNestedValue('string', 'user.name', 'John'),
      ).not.toThrow();
      expect(() =>
        extension.setNestedValue(42, 'user.name', 'John'),
      ).not.toThrow();
    });

    it('should handle empty path gracefully', () => {
      const target = { name: 'John' };
      // Empty path should be handled gracefully
      expect(() => extension.setNestedValue(target, '', 'value')).not.toThrow();
      // Object should remain unchanged
      expect(target).toEqual({ name: 'John' });
    });

    it('should handle complex nested structures', () => {
      const target = {};
      extension.setNestedValue(target, 'a.b.c.d.e', 'deep value');
      expect(target).toEqual({
        a: { b: { c: { d: { e: 'deep value' } } } },
      });
    });
  });

  describe('hasUserEditedField', () => {
    it('should return true when field has been modified', () => {
      const current: UserProfile = {
        name: 'John Doe',
        email: 'john@example.com',
      };
      const original: UserProfile = { name: 'John', email: 'john@example.com' };

      expect(smartState.hasUserEditedField(current, original, 'name')).toBe(
        true,
      );
      expect(smartState.hasUserEditedField(current, original, 'email')).toBe(
        false,
      );
    });

    it('should return true when original is null', () => {
      const current: UserProfile = { name: 'John', email: 'john@example.com' };

      expect(smartState.hasUserEditedField(current, null, 'name')).toBe(true);
      expect(smartState.hasUserEditedField(current, null, 'email')).toBe(true);
    });

    it('should handle nested field paths', () => {
      const current: UserProfile = {
        name: 'John',
        email: 'john@example.com',
        preferences: { theme: 'dark', notifications: true },
      };
      const original: UserProfile = {
        name: 'John',
        email: 'john@example.com',
        preferences: { theme: 'light', notifications: true },
      };

      expect(
        smartState.hasUserEditedField(current, original, 'preferences.theme'),
      ).toBe(true);
      expect(
        smartState.hasUserEditedField(
          current,
          original,
          'preferences.notifications',
        ),
      ).toBe(false);
    });

    it('should handle non-existent fields', () => {
      const current: UserProfile = { name: 'John', email: 'john@example.com' };
      const original: UserProfile = { name: 'John', email: 'john@example.com' };

      expect(
        smartState.hasUserEditedField(current, original, 'nonexistent'),
      ).toBe(false);
      expect(
        smartState.hasUserEditedField(current, original, 'preferences.theme'),
      ).toBe(false);
    });
  });

  describe('smartMerge', () => {
    const formValue: UserProfile = {
      name: 'John Local',
      email: 'john@local.com',
    };
    const newExternal: UserProfile = {
      name: 'Jane External',
      email: 'jane@external.com',
    };
    const currentValue: UserProfile = {
      name: 'John Local',
      email: 'john@local.com',
    };
    const oldExternal: UserProfile = {
      name: 'John External',
      email: 'john@external.com',
    };

    it('should return formValue when newExternal is null', () => {
      const result = smartState.smartMerge(
        formValue,
        null,
        currentValue,
        oldExternal,
        {},
        true,
        true,
      );
      expect(result).toBe(formValue);
    });

    it('should return newExternal when currentValue is null', () => {
      const result = smartState.smartMerge(
        formValue,
        newExternal,
        null,
        oldExternal,
        {},
        true,
        true,
      );
      expect(result).toBe(newExternal);
    });

    it('should return formValue when no external change detected', () => {
      const result = smartState.smartMerge(
        formValue,
        oldExternal,
        currentValue,
        oldExternal,
        {},
        true,
        true,
      );
      expect(result).toBe(formValue);
    });

    it('should handle replace merge strategy', () => {
      const options: SmartStateOptions<UserProfile> = {
        mergeStrategy: 'replace',
      };
      const result = smartState.smartMerge(
        formValue,
        newExternal,
        currentValue,
        oldExternal,
        options,
        true,
        true,
      );
      expect(result).toEqual({ ...newExternal, ...formValue });
    });

    it('should preserve specified fields when form is dirty and valid', () => {
      const options: SmartStateOptions<UserProfile> = {
        mergeStrategy: 'smart',
        preserveFields: ['name'],
      };

      const result = smartState.smartMerge(
        formValue,
        newExternal,
        currentValue,
        oldExternal,
        options,
        true,
        true,
      );

      expect(result).toEqual({
        name: 'John Local', // Preserved from current
        email: 'jane@external.com', // From external
      });
    });

    it('should handle nested field preservation', () => {
      const formValue_ = {
        name: 'John',
        email: 'john@example.com',
        preferences: { theme: 'dark', notifications: true },
      };
      const newExtension = {
        name: 'Jane',
        email: 'jane@example.com',
        preferences: { theme: 'light', notifications: false },
      };
      const current = {
        name: 'John',
        email: 'john@example.com',
        preferences: { theme: 'dark', notifications: true },
      };
      const oldExtension = {
        name: 'John',
        email: 'john@original.com',
        preferences: { theme: 'light', notifications: true },
      };

      const options: SmartStateOptions<UserProfile> = {
        mergeStrategy: 'smart',
        preserveFields: ['preferences.theme'],
      };

      const result = smartState.smartMerge(
        formValue_,
        newExtension,
        current,
        oldExtension,
        options,
        true,
        true,
      );

      expect(result?.preferences?.theme).toBe('dark'); // Preserved
      expect(result?.preferences?.notifications).toBe(false); // From external
    });

    it('should handle conflict resolution with callback', () => {
      const onConflictSpy = vi
        .fn()
        .mockReturnValue({ name: 'Resolved', email: 'resolved@example.com' });
      const options: SmartStateOptions<UserProfile> = {
        conflictResolution: true,
        onConflict: onConflictSpy,
      };

      const result = smartState.smartMerge(
        formValue,
        newExternal,
        currentValue,
        oldExternal,
        options,
        true,
        true,
      );

      expect(onConflictSpy).toHaveBeenCalledWith(currentValue, newExternal);
      expect(result).toEqual({
        name: 'Resolved',
        email: 'resolved@example.com',
      });
    });

    it('should set conflict state when onConflict returns "prompt-user"', () => {
      const onConflictSpy = vi.fn().mockReturnValue('prompt-user');
      const options: SmartStateOptions<UserProfile> = {
        conflictResolution: true,
        onConflict: onConflictSpy,
      };

      const result = smartState.smartMerge(
        formValue,
        newExternal,
        currentValue,
        oldExternal,
        options,
        true,
        true,
      );

      expect(onConflictSpy).toHaveBeenCalledWith(currentValue, newExternal);
      expect(result).toBe(currentValue);
      expect(conflictSignal()).not.toBeNull();
      expect(conflictSignal()?.local).toBe(currentValue);
      expect(conflictSignal()?.external).toBe(newExternal);
    });

    it('should apply default merge strategy when no specific options', () => {
      const result = smartState.smartMerge(
        formValue,
        newExternal,
        currentValue,
        oldExternal,
        {},
        true,
        true,
      );

      expect(result).toEqual({ ...newExternal, ...formValue });
    });
  });

  describe('resolveConflict', () => {
    const localData: UserProfile = {
      name: 'John Local',
      email: 'john@local.com',
    };
    const externalData: UserProfile = {
      name: 'Jane External',
      email: 'jane@external.com',
    };
    let formValueSignal: WritableSignal<UserProfile | null>;

    beforeEach(() => {
      formValueSignal = signal<UserProfile | null>(null);
      const conflict: ConflictState<UserProfile> = {
        local: localData,
        external: externalData,
        timestamp: Date.now(),
      };
      conflictSignal.set(conflict);
    });

    it('should return null when no conflict exists', () => {
      conflictSignal.set(null);
      const result = smartState.resolveConflict('local');
      expect(result).toBeNull();
    });

    it('should resolve with local strategy', () => {
      const result = smartState.resolveConflict('local', formValueSignal);

      expect(result).toEqual(localData);
      expect(formValueSignal()).toEqual(localData);
      expect(conflictSignal()).toBeNull();
    });

    it('should resolve with external strategy', () => {
      const result = smartState.resolveConflict('external', formValueSignal);

      expect(result).toEqual(externalData);
      expect(formValueSignal()).toEqual(externalData);
      expect(conflictSignal()).toBeNull();
    });

    it('should resolve with merge strategy', () => {
      const result = smartState.resolveConflict('merge', formValueSignal);
      const expected = { ...externalData, ...localData };

      expect(result).toEqual(expected);
      expect(formValueSignal()).toEqual(expected);
      expect(conflictSignal()).toBeNull();
    });

    it('should work without formValueSignal', () => {
      const result = smartState.resolveConflict('local');

      expect(result).toEqual(localData);
      expect(conflictSignal()).toBeNull();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty strings in field paths', () => {
      const object = { '': 'empty key', normal: 'value' };
      expect(smartState.getNestedValue(object, '')).toBe(object);
      expect(smartState.getNestedValue(object, 'normal')).toBe('value');
    });

    it('should handle circular references in deepEqual', () => {
      type CircularReference = { name: string; self?: CircularReference };
      const object1: CircularReference = { name: 'test' };
      object1.self = object1;

      const object2: CircularReference = { name: 'test' };
      object2.self = object2;

      // Note: This test verifies the function doesn't crash with circular references
      // The actual behavior may vary, but it should not throw an error
      expect(() => smartState.deepEqual(object1, object2)).not.toThrow();
    });

    it('should handle very deep nesting', () => {
      const deepPath = 'a.b.c.d.e.f.g.h.i.j';
      const target = {};

      smartState.setNestedValue(target, deepPath, 'deep value');
      expect(smartState.getNestedValue(target, deepPath)).toBe('deep value');
    });

    it('should handle special characters in property names', () => {
      const target = {};
      const specialPath = 'user.settings.theme-color';

      smartState.setNestedValue(target, specialPath, 'blue');
      expect(smartState.getNestedValue(target, specialPath)).toBe('blue');
    });

    it('should maintain type safety with generic models', () => {
      const simpleExtension = new SmartStateExtension<SimpleModel>();
      const model: SimpleModel = { field1: 'test', field2: 42 };

      expect(simpleExtension.getNestedValue(model, 'field1')).toBe('test');
      expect(simpleExtension.getNestedValue(model, 'field2')).toBe(42);
    });
  });

  describe('Performance Edge Cases', () => {
    it('should handle large objects efficiently', () => {
      const largeObject: Record<string, string> = {};
      const extension = new SmartStateExtension<unknown>();

      // Create an object with many properties
      for (let index = 0; index < 1000; index++) {
        largeObject[`property${index}`] = `value${index}`;
      }

      const startTime = performance.now();
      const result = extension.deepEqual(largeObject, { ...largeObject });
      const endTime = performance.now();

      expect(result).toBe(true);
      // Should complete within reasonable time (< 100ms for this size)
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should handle deeply nested objects efficiently', () => {
      const extension = new SmartStateExtension<unknown>();
      type DeepObject = { next?: DeepObject; value?: string };
      const deep: DeepObject = {};
      let current: DeepObject = deep;

      // Create deeply nested object
      for (let index = 0; index < 100; index++) {
        current.next = {};
        current = current.next;
      }
      current.value = 'deep';

      const startTime = performance.now();
      const result = extension.getNestedValue(
        deep,
        Array.from({ length: 100 }).fill('next').join('.') + '.value',
      );
      const endTime = performance.now();

      expect(result).toBe('deep');
      // Should complete within reasonable time (< 50ms for this depth)
      expect(endTime - startTime).toBeLessThan(50);
    });
  });

  describe('Real-world Integration Scenarios', () => {
    it('should work with form-like data structures', () => {
      type FormData = {
        user: {
          firstName: string;
          lastName: string;
          contact: {
            email: string;
            phone?: string;
          };
        };
        preferences: {
          newsletter: boolean;
          notifications: {
            email: boolean;
            sms: boolean;
          };
        };
      };

      const conflictSig = signal<ConflictState<FormData>>(null);
      const smartForm = new SmartStateExtension<FormData>(conflictSig);

      const formData: FormData = {
        user: {
          firstName: 'John',
          lastName: 'Doe',
          contact: { email: 'john@example.com', phone: '123-456-7890' },
        },
        preferences: {
          newsletter: true,
          notifications: { email: true, sms: false },
        },
      };

      const externalData: FormData = {
        user: {
          firstName: 'John',
          lastName: 'Smith', // Changed
          contact: { email: 'john.smith@example.com' }, // Changed, phone removed
        },
        preferences: {
          newsletter: false, // Changed
          notifications: { email: true, sms: true }, // SMS changed
        },
      };

      const originalExternal: FormData = {
        user: {
          firstName: 'John',
          lastName: 'Doe',
          contact: { email: 'john@example.com' },
        },
        preferences: {
          newsletter: true,
          notifications: { email: true, sms: false },
        },
      };

      // Test smart merge with field preservation
      const options: SmartStateOptions<FormData> = {
        mergeStrategy: 'smart',
        preserveFields: ['user.contact.phone', 'preferences.newsletter'],
      };

      const result = smartForm.smartMerge(
        formData,
        externalData,
        formData,
        originalExternal,
        options,
        true,
        true,
      );

      expect(result?.user.lastName).toBe('Smith'); // External change
      expect(result?.user.contact.email).toBe('john.smith@example.com'); // External change
      expect(result?.user.contact.phone).toBe('123-456-7890'); // Preserved local
      expect(result?.preferences.newsletter).toBe(true); // Preserved local
      expect(result?.preferences.notifications.sms).toBe(true); // External change
    });

    it('should handle dynamic field preservation lists', () => {
      const userEditedFields: string[] = [];

      // Simulate tracking user edits
      const trackEdit = (field: string) => {
        if (!userEditedFields.includes(field)) {
          userEditedFields.push(field);
        }
      };

      trackEdit('name');
      trackEdit('preferences.theme');

      const options: SmartStateOptions<UserProfile> = {
        mergeStrategy: 'smart',
        preserveFields: userEditedFields,
      };

      const formData: UserProfile = {
        name: 'John Edited',
        email: 'john@example.com',
        preferences: { theme: 'dark', notifications: true },
      };
      const externalData: UserProfile = {
        name: 'Jane External',
        email: 'jane@external.com',
        preferences: { theme: 'light', notifications: false },
      };
      const originalExternal: UserProfile = {
        name: 'John Original',
        email: 'john@original.com',
        preferences: { theme: 'light', notifications: true },
      };

      const result = smartState.smartMerge(
        formData,
        externalData,
        formData,
        originalExternal,
        options,
        true,
        true,
      );

      expect(result?.name).toBe('John Edited'); // Preserved (user edited)
      expect(result?.email).toBe('jane@external.com'); // External (not user edited)
      expect(result?.preferences?.theme).toBe('dark'); // Preserved (user edited)
      expect(result?.preferences?.notifications).toBe(false); // External (not user edited)
    });
  });
});
