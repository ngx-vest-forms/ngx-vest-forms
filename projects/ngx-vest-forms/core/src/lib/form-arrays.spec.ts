/**
 * Unit tests for form arrays implementation
 * Tests dynamic collection management, validation, and reset behavior
 */

import { signal } from '@angular/core';
import type { SuiteResult } from 'vest';
import { enforce, staticSuite, test as vestTest } from 'vest';
import { describe, expect, it, vi } from 'vitest';
import { runInAngular } from '../../../test-utilities';
import { createVestForm } from './create-vest-form';
import {
  createEnhancedVestFormArray,
  createVestFormArray,
} from './form-arrays';
import { staticSafeSuite } from './utils/safe-suite';
import type { VestField } from './vest-form.types';

describe('Form Arrays', () => {
  describe('createVestFormArray', () => {
    it('should create a form array with initial empty state', () => {
      const model = signal<{ items: string[] }>({ items: [] });
      const suite = staticSuite((data: { items: string[] }) => {
        vestTest('items', 'Items required', () => {
          enforce(data.items).isNotEmpty();
        });
      });
      const suiteResult = signal(suite(model()));
      const createField = vi.fn(() => ({
        value: signal(),
        valid: signal(true),
        errors: signal([]),
      })) as unknown as (path: string) => VestField<string>;

      const formArray = createVestFormArray<string>(
        model,
        'items',
        suite,
        suiteResult,
        createField,
      );

      expect(formArray.items()).toEqual([]);
      expect(formArray.length()).toBe(0);
    });

    it('should create a form array with initial items', () => {
      const model = signal<{ items: string[] }>({ items: ['a', 'b', 'c'] });
      const suite = staticSuite((data: { items: string[] }) => {
        vestTest('items', 'Items required', () => {
          enforce(data.items).isNotEmpty();
        });
      });
      const suiteResult = signal(suite(model()));
      const createField = vi.fn(() => ({
        value: signal(),
        valid: signal(true),
        errors: signal([]),
      })) as unknown as (path: string) => VestField<string>;

      const formArray = createVestFormArray<string>(
        model,
        'items',
        suite,
        suiteResult,
        createField,
      );

      expect(formArray.items()).toEqual(['a', 'b', 'c']);
      expect(formArray.length()).toBe(3);
    });

    it('should push new items to the array', () => {
      const model = signal<{ items: string[] }>({ items: ['a'] });
      const suite = staticSuite((data: { items: string[] }) => {
        vestTest('items', 'Items required', () => {
          enforce(data.items).isNotEmpty();
        });
      });
      const suiteResult = signal(suite(model()));
      const createField = vi.fn(() => ({
        value: signal(),
        valid: signal(true),
        errors: signal([]),
      })) as unknown as (path: string) => VestField<string>;

      const formArray = createVestFormArray<string>(
        model,
        'items',
        suite,
        suiteResult,
        createField,
      );

      formArray.push('b');

      expect(formArray.items()).toEqual(['a', 'b']);
      expect(formArray.length()).toBe(2);
      expect(model().items).toEqual(['a', 'b']);
    });

    it('should remove items from the array', () => {
      const model = signal<{ items: string[] }>({ items: ['a', 'b', 'c'] });
      const suite = staticSuite((data: { items: string[] }) => {
        vestTest('items', 'Items required', () => {
          enforce(data.items).isNotEmpty();
        });
      });
      const suiteResult = signal(suite(model()));
      const createField = vi.fn(() => ({
        value: signal(),
        valid: signal(true),
        errors: signal([]),
      })) as unknown as (path: string) => VestField<string>;

      const formArray = createVestFormArray<string>(
        model,
        'items',
        suite,
        suiteResult,
        createField,
      );

      formArray.remove(1); // Remove 'b'

      expect(formArray.items()).toEqual(['a', 'c']);
      expect(formArray.length()).toBe(2);
      expect(model().items).toEqual(['a', 'c']);
    });

    it('should handle remove with invalid index gracefully', () => {
      const model = signal<{ items: string[] }>({ items: ['a', 'b'] });
      const suite = vi.fn();
      const suiteResult = signal(suite(model()));
      const createField = vi.fn(() => ({
        value: signal(),
        valid: signal(true),
        errors: signal([]),
      })) as unknown as (path: string) => VestField<string>;

      const formArray = createVestFormArray<string>(
        model,
        'items',
        suite,
        suiteResult,
        createField,
      );

      // Try to remove invalid indices
      formArray.remove(-1);
      formArray.remove(10);

      expect(formArray.items()).toEqual(['a', 'b']);
      expect(formArray.length()).toBe(2);
    });

    it('should reset array to empty', () => {
      const model = signal<{ items: string[] }>({ items: ['a', 'b', 'c'] });
      const suite = vi.fn();
      const suiteResult = signal(suite(model()));
      const createField = vi.fn(() => ({
        value: signal(),
        valid: signal(true),
        errors: signal([]),
      })) as unknown as (path: string) => VestField<string>;

      const formArray = createVestFormArray<string>(
        model,
        'items',
        suite,
        suiteResult,
        createField,
      );

      formArray.reset();

      expect(formArray.items()).toEqual([]);
      expect(formArray.length()).toBe(0);
      expect(model().items).toEqual([]);
    });

    it('should provide field access via at() method', () => {
      const model = signal<{ items: string[] }>({ items: ['a', 'b', 'c'] });
      const suite = vi.fn();
      const suiteResult = signal(suite(model()));
      const mockField = {
        value: signal('a'),
        valid: signal(true),
        errors: signal([]),
      } as VestField<string>;
      const createField = vi.fn(() => mockField);

      const formArray = createVestFormArray<string>(
        model,
        'items',
        suite,
        suiteResult,
        createField,
      );

      const field = formArray.at(0);

      expect(createField).toHaveBeenCalledWith('items.0');
      expect(field).toBe(mockField);
    });

    it('should move items in the array', () => {
      const model = signal<{ items: string[] }>({ items: ['a', 'b', 'c'] });
      const suite = vi.fn();
      const suiteResult = signal(suite(model()));
      const createField = vi.fn(() => ({
        value: signal(),
        valid: signal(true),
        errors: signal([]),
      })) as unknown as (path: string) => VestField<string>;

      const formArray = createVestFormArray<string>(
        model,
        'items',
        suite,
        suiteResult,
        createField,
      );

      formArray.move(0, 2); // Move 'a' to end

      expect(formArray.items()).toEqual(['b', 'c', 'a']);
    });

    it('should insert items at specific index', () => {
      const model = signal<{ items: string[] }>({ items: ['a', 'c'] });
      const suite = vi.fn();
      const suiteResult = signal(suite(model()));
      const createField = vi.fn(() => ({
        value: signal(),
        valid: signal(true),
        errors: signal([]),
      })) as unknown as (path: string) => VestField<string>;

      const formArray = createVestFormArray<string>(
        model,
        'items',
        suite,
        suiteResult,
        createField,
      );

      formArray.insert(1, 'b');

      expect(formArray.items()).toEqual(['a', 'b', 'c']);
    });

    it('should delegate validation to runSuite when provided', () => {
      const model = signal<{ items: string[] }>({ items: [] });
      const suite = vi.fn();
      const suiteResultStub = {
        hasErrors: vi.fn().mockReturnValue(false),
        isValid: vi.fn().mockReturnValue(true),
        isPending: vi.fn().mockReturnValue(false),
        getErrors: vi.fn().mockReturnValue([]),
        isTested: vi.fn().mockReturnValue(true),
      } as unknown as SuiteResult<string, string>;
      const suiteResult = signal(suiteResultStub);
      const createField = vi.fn(() => ({
        value: signal(),
        valid: signal(true),
        errors: signal([]),
      })) as unknown as (path: string) => VestField<string>;
      const runSuite = vi.fn();

      const formArray = createVestFormArray<string>(
        model,
        'items',
        suite,
        suiteResult,
        createField,
        runSuite,
      );

      formArray.push('test');

      expect(runSuite).toHaveBeenCalledTimes(1);
      // runSuite is called without arguments to ensure array item tests run
      // (calling with 'items' would use only('items') and skip item.0, item.1, etc.)
      expect(runSuite).toHaveBeenCalledWith(undefined);
      expect(suite).not.toHaveBeenCalled();
    });

    describe('Reset Edge Cases', () => {
      it('should handle reset when array is already empty', () => {
        const model = signal<{ items: string[] }>({ items: [] });
        const suite = vi.fn();
        const suiteResult = signal(suite(model()));
        const createField = vi.fn(() => ({
          value: signal(),
          valid: signal(true),
          errors: signal([]),
        })) as unknown as (path: string) => VestField<string>;

        const formArray = createVestFormArray<string>(
          model,
          'items',
          suite,
          suiteResult,
          createField,
        );

        expect(() => formArray.reset()).not.toThrow();
        expect(formArray.items()).toEqual([]);
      });

      it('should handle reset with nested objects', () => {
        type Item = { id: number; name: string };
        const model = signal<{ items: Item[] }>({
          items: [
            { id: 1, name: 'Item 1' },
            { id: 2, name: 'Item 2' },
          ],
        });
        const suite = vi.fn();
        const suiteResult = signal(suite(model()));
        const createField = vi.fn(() => ({
          value: signal(),
          valid: signal(true),
          errors: signal([]),
        })) as unknown as (path: string) => VestField<Item>;

        const formArray = createVestFormArray<Item>(
          model,
          'items',
          suite,
          suiteResult,
          createField,
        );

        formArray.reset();

        expect(formArray.items()).toEqual([]);
        expect(formArray.length()).toBe(0);
      });

      it('should not throw when accessing items() after reset', () => {
        const model = signal<{ items: string[] }>({ items: ['a', 'b', 'c'] });
        const suite = vi.fn();
        const suiteResult = signal(suite(model()));
        const createField = vi.fn(() => ({
          value: signal(),
          valid: signal(true),
          errors: signal([]),
        })) as unknown as (path: string) => VestField<string>;

        const formArray = createVestFormArray<string>(
          model,
          'items',
          suite,
          suiteResult,
          createField,
        );

        formArray.reset();

        // This should not throw "Cannot read properties of undefined (reading 'length')"
        expect(() => formArray.items()).not.toThrow();
        expect(() => formArray.length()).not.toThrow();
        expect(formArray.items()).toEqual([]);
        expect(formArray.length()).toBe(0);
      });

      it('should handle model being set to undefined during reset', () => {
        const model = signal<{ items?: string[] }>({ items: ['a', 'b'] });
        const suite = vi.fn();
        const suiteResult = signal(suite(model()));
        const createField = vi.fn(() => ({
          value: signal(),
          valid: signal(true),
          errors: signal([]),
        })) as unknown as (path: string) => VestField<string>;

        const formArray = createVestFormArray<string>(
          model,
          'items',
          suite,
          suiteResult,
          createField,
        );

        // Simulate what happens during form reset - model path becomes undefined
        model.set({ items: undefined });

        // This should not throw - items() should return empty array
        expect(() => formArray.items()).not.toThrow();
        expect(formArray.items()).toEqual([]);
        expect(formArray.length()).toBe(0);
      });

      it('should handle rapid reset calls', () => {
        const model = signal<{ items: string[] }>({ items: ['a', 'b', 'c'] });
        const suite = vi.fn();
        const suiteResult = signal(suite(model()));
        const createField = vi.fn(() => ({
          value: signal(),
          valid: signal(true),
          errors: signal([]),
        })) as unknown as (path: string) => VestField<string>;

        const formArray = createVestFormArray<string>(
          model,
          'items',
          suite,
          suiteResult,
          createField,
        );

        // Call reset multiple times rapidly
        expect(() => {
          formArray.reset();
          formArray.reset();
          formArray.reset();
        }).not.toThrow();

        expect(formArray.items()).toEqual([]);
      });
    });
  });

  describe('createEnhancedVestFormArray', () => {
    it('should provide isEmpty computed', () => {
      const model = signal<{ items: string[] }>({ items: [] });
      const suite = vi.fn();
      const suiteResult = signal(suite(model()));
      const createField = vi.fn(() => ({
        value: signal(),
        valid: signal(true),
        errors: signal([]),
      })) as unknown as (path: string) => VestField<string>;

      const formArray = createEnhancedVestFormArray<string>(
        model,
        'items',
        suite,
        suiteResult,
        createField,
      );

      expect(formArray.isEmpty()).toBe(true);

      formArray.push('item');

      expect(formArray.isEmpty()).toBe(false);
    });

    it('should provide first and last computed', () => {
      const model = signal<{ items: string[] }>({
        items: ['first', 'middle', 'last'],
      });
      const suite = vi.fn();
      const suiteResult = signal(suite(model()));
      const createField = vi.fn(() => ({
        value: signal(),
        valid: signal(true),
        errors: signal([]),
      })) as unknown as (path: string) => VestField<string>;

      const formArray = createEnhancedVestFormArray<string>(
        model,
        'items',
        suite,
        suiteResult,
        createField,
      );

      expect(formArray.first()).toBe('first');
      expect(formArray.last()).toBe('last');
    });

    it('should provide clear() method', () => {
      const model = signal<{ items: string[] }>({ items: ['a', 'b', 'c'] });
      const suite = vi.fn();
      const suiteResult = signal(suite(model()));
      const createField = vi.fn(() => ({
        value: signal(),
        valid: signal(true),
        errors: signal([]),
      })) as unknown as (path: string) => VestField<string>;

      const formArray = createEnhancedVestFormArray<string>(
        model,
        'items',
        suite,
        suiteResult,
        createField,
      );

      formArray.clear();

      expect(formArray.items()).toEqual([]);
      expect(formArray.isEmpty()).toBe(true);
    });

    it('should reuse runSuite callback for enhanced mutators', () => {
      const model = signal<{ items: string[] }>({ items: ['a', 'b'] });
      const suite = vi.fn();
      const suiteResultStub = {
        hasErrors: vi.fn().mockReturnValue(false),
        isValid: vi.fn().mockReturnValue(true),
        isPending: vi.fn().mockReturnValue(false),
        getErrors: vi.fn().mockReturnValue([]),
        isTested: vi.fn().mockReturnValue(true),
      } as unknown as SuiteResult<string, string>;
      const suiteResult = signal(suiteResultStub);
      const createField = vi.fn(() => ({
        value: signal(''),
        valid: signal(true),
        errors: signal([]),
      })) as unknown as (path: string) => VestField<string>;
      const runSuite = vi.fn();

      const formArray = createEnhancedVestFormArray<string>(
        model,
        'items',
        suite,
        suiteResult,
        createField,
        runSuite,
      );

      formArray.replace(0, 'x');
      formArray.swap(0, 1);
      formArray.clear();

      expect(runSuite).toHaveBeenCalledTimes(3);
      // Enhanced methods call runSuite without arguments to ensure array item tests run
      // (calling with path would use only(path) and skip item.0, item.1, etc.)
      expect(runSuite).toHaveBeenNthCalledWith(1);
      expect(runSuite).toHaveBeenNthCalledWith(2);
      expect(runSuite).toHaveBeenNthCalledWith(3);
      expect(suite).not.toHaveBeenCalled();
    });

    it('should provide duplicate() method', () => {
      const model = signal<{ items: { id: number; name: string }[] }>({
        items: [{ id: 1, name: 'Item 1' }],
      });
      const suite = vi.fn();
      const suiteResult = signal(suite(model()));
      const createField = vi.fn(() => ({
        value: signal(),
        valid: signal(true),
        errors: signal([]),
      })) as unknown as (
        path: string,
      ) => VestField<{ id: number; name: string }>;

      const formArray = createEnhancedVestFormArray<{
        id: number;
        name: string;
      }>(model, 'items', suite, suiteResult, createField);

      formArray.duplicate(0);

      expect(formArray.length()).toBe(2);
      expect(formArray.items()[0]).toEqual({ id: 1, name: 'Item 1' });
      expect(formArray.items()[1]).toEqual({ id: 1, name: 'Item 1' });
      // Verify it's a deep clone, not the same reference
      expect(formArray.items()[0]).not.toBe(formArray.items()[1]);
    });

    it('should handle reset without throwing errors', () => {
      const model = signal<{ items: string[] }>({ items: ['a', 'b', 'c'] });
      const suite = vi.fn();
      const suiteResult = signal(suite(model()));
      const createField = vi.fn(() => ({
        value: signal(),
        valid: signal(true),
        errors: signal([]),
      })) as unknown as (path: string) => VestField<string>;

      const formArray = createEnhancedVestFormArray<string>(
        model,
        'items',
        suite,
        suiteResult,
        createField,
      );

      expect(() => formArray.reset()).not.toThrow();
      expect(formArray.isEmpty()).toBe(true);
      expect(formArray.first()).toBeUndefined();
      expect(formArray.last()).toBeUndefined();
    });
  });

  describe('integration with createVestForm', () => {
    it('restores form validity after correcting an invalid array item', async () => {
      type FormModel = { interests: string[] };

      const suite = staticSafeSuite<FormModel>((data = {}) => {
        const interests = data.interests ?? [];

        vestTest('interests', 'Interests must be an array', () => {
          enforce(interests).isArray();
        });

        for (const [index, interest] of interests.entries()) {
          const path = `interests.${index}` as const;

          vestTest(path, 'Interest cannot be empty', () => {
            enforce(interest).isNotEmpty();
          });

          vestTest(path, 'Interest must be at least two characters', () => {
            enforce(interest).longerThan(1);
          });
        }
      });

      const form = createVestForm<FormModel>(signal({ interests: [] }), {
        suite,
      });
      const interestsArray = form.array('interests');

      await runInAngular(() => {
        interestsArray.push('A');
      });

      expect(form.valid()).toBe(false);
      expect(form.errors()).toMatchObject({
        'interests.0': expect.arrayContaining([
          expect.stringContaining('least two characters'),
        ]),
      });

      await runInAngular(() => {
        interestsArray.at(0).set('Reading');
      });

      expect(form.errors()).toEqual({});
      expect(form.valid()).toBe(true);
      expect(interestsArray.valid()).toBe(true);
    });
  });
});
