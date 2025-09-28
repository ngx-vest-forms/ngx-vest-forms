/**
 * Unit tests for createVestForm factory function
 * Tests form creation, validation, field management, and Enhanced Field Signals API
 */

import { signal } from '@angular/core';
import { enforce, only, staticSuite, test } from 'vest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createVestForm } from './create-vest-form';
import type { VestFormOptions } from './vest-form.types';

/**
 * Mock validation suite for testing
 * Tests email and password fields with various validation rules
 */
function createMockSuite() {
  return staticSuite((data = {}, field?: string) => {
    if (field) {
      only(field);
    }

    test('email', 'Email is required', () => {
      enforce(data.email).isNotEmpty();
    });

    test('email', 'Email format is invalid', () => {
      enforce(data.email).matches(/^[^@]+@[^@]+\.[^@]+$/);
    });

    test('password', 'Password is required', () => {
      enforce(data.password).isNotEmpty();
    });

    test('password', 'Password must be at least 8 characters', () => {
      enforce(data.password).longerThanOrEquals(8);
    });
  });
}

/**
 * Test model interface
 */
type TestUserModel = {
  email: string;
  password: string;
  profile?: {
    name: string;
    age: number;
  };
};

describe('createVestForm', () => {
  let mockSuite: ReturnType<typeof createMockSuite>;
  let initialModel: TestUserModel;

  beforeEach(() => {
    (globalThis as Record<string, unknown>)['__VEST_DEBUG_REGISTRY__'] = true;
    mockSuite = createMockSuite();
    initialModel = {
      email: '',
      password: '',
      profile: {
        name: '',
        age: 0,
      },
    };
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>)['__VEST_DEBUG_REGISTRY__'];
    vi.clearAllMocks();
  });

  describe('Form Creation', () => {
    it('should create form with plain object model', () => {
      const form = createVestForm(mockSuite, initialModel);

      expect(form).toBeDefined();
      expect(form.model()).toEqual(initialModel);
      expect(form.valid()).toBe(false); // Should be invalid initially
      expect(form.pending()).toBe(false);
      expect(form.submitting()).toBe(false);
      expect(form.hasSubmitted()).toBe(false);
    });

    it('should create form with signal model', () => {
      const modelSignal = signal(initialModel);
      const form = createVestForm(mockSuite, modelSignal);

      expect(form).toBeDefined();
      expect(form.model()).toEqual(initialModel);
      expect(form.model).toBe(modelSignal); // Should reuse the same signal
    });

    it('should accept custom options', () => {
      const options: VestFormOptions = {
        errorStrategy: 'immediate',
        enhancedFieldSignals: false,
        debounceMs: 500,
      };

      const form = createVestForm(mockSuite, initialModel, options);

      expect(form).toBeDefined();
      // Enhanced Field Signals should be disabled, so proxy methods shouldn't exist
      // Note: Testing this is tricky since TypeScript doesn't know about disabled features
    });
  });

  describe('Field Access', () => {
    it('should provide field access via field() method', () => {
      const form = createVestForm(mockSuite, initialModel);

      const emailField = form.field('email');
      const passwordField = form.field('password');

      expect(emailField).toBeDefined();
      expect(emailField.value()).toBe('');
      expect(emailField.valid()).toBe(false);
      expect(emailField.errors()).toContain('Email is required');
      expect(emailField.touched()).toBe(false);

      expect(passwordField).toBeDefined();
      expect(passwordField.value()).toBe('');
      expect(passwordField.valid()).toBe(false);
    });

    it('should cache field instances', () => {
      const form = createVestForm(mockSuite, initialModel);

      const field1 = form.field('email');
      const field2 = form.field('email');

      expect(field1).toBe(field2); // Should be the same cached instance
    });

    it('should support nested field paths', () => {
      const form = createVestForm(mockSuite, initialModel);

      const nameField = form.field('profile.name');
      const ageField = form.field('profile.age');

      expect(nameField.value()).toBe('');
      expect(ageField.value()).toBe(0);
    });
  });

  describe('Enhanced Field Signals API', () => {
    it('should provide automatic field signals', () => {
      const form = createVestForm(mockSuite, initialModel);

      // Field value signals
      expect(form.email()).toBe('');
      expect(form.password()).toBe('');

      // Field validity signals
      expect(form.emailValid()).toBe(false);
      expect(form.passwordValid()).toBe(false);

      // Field error signals
      expect(form.emailErrors()).toContain('Email is required');
      expect(form.passwordErrors()).toContain('Password is required');

      // Field state signals
      expect(form.emailTouched()).toBe(false); // staticSuite doesn't mark fields as tested until explicitly validated
      expect(form.emailPending()).toBe(false);
      expect(form.emailShowErrors()).toBe(false); // showErrors depends on error strategy
    });

    it('should provide automatic field operations', () => {
      const form = createVestForm(mockSuite, initialModel);

      // Set field values
      form.setEmail('test@example.com');
      form.setPassword('password123');

      expect(form.email()).toBe('test@example.com');
      expect(form.password()).toBe('password123');
      expect(form.emailValid()).toBe(true);
      expect(form.emailTouched()).toBe(true);
      expect(form.passwordTouched()).toBe(true);

      // Touch fields
      form.touchEmail();
      form.touchPassword();

      expect(form.emailTouched()).toBe(true);
      expect(form.passwordTouched()).toBe(true);

      // Reset fields
      form.resetEmail();
      form.resetPassword();

      expect(form.email()).toBe('');
      expect(form.password()).toBe('');
      expect(form.emailValid()).toBe(false);
      expect(form.emailTouched()).toBe(false);
      expect(form.passwordTouched()).toBe(false);
    });

    it('should respect includeFields option', () => {
      const form = createVestForm(mockSuite, initialModel, {
        includeFields: ['email'],
      });

      // Email should have enhanced API
      expect(typeof form.email).toBe('function');
      expect(typeof form.setEmail).toBe('function');

      // Password should not have enhanced API (only accessible via field())
      expect(typeof form.password).toBe('undefined');
      expect(typeof form.setPassword).toBe('undefined');

      // But should still be accessible via field()
      const passwordField = form.field('password');
      expect(passwordField.value()).toBe('');
    });

    it('should respect excludeFields option', () => {
      const form = createVestForm(mockSuite, initialModel, {
        excludeFields: ['password'],
      });

      // Email should have enhanced API
      expect(typeof form.email).toBe('function');
      expect(typeof form.setEmail).toBe('function');

      // Password should not have enhanced API
      expect(typeof form.password).toBe('undefined');
      expect(typeof form.setPassword).toBe('undefined');
    });

    it('should support nested field access via camelCase properties', () => {
      const form = createVestForm(mockSuite, initialModel);

      expect(typeof form.profileName).toBe('function');
      expect(typeof form.profileAge).toBe('function');
      expect(form.profileName()).toBe('');
      expect(form.profileAge()).toBe(0);

      form.setProfileName('Jane');
      form.setProfileAge(42);
      expect(form.profileName()).toBe('Jane');
      expect(form.profileAge()).toBe(42);
    });
  });

  describe('Form Operations', () => {
    it('should refresh suite result after field updates', () => {
      const form = createVestForm(mockSuite, initialModel);

      expect(form.emailValid()).toBe(false);

      form.setEmail('test@example.com');

      expect(form.emailValid()).toBe(true);
      expect(form.result().isValid('email')).toBe(true);
    });

    it('should validate specific fields', () => {
      const form = createVestForm(mockSuite, initialModel);

      // Initially invalid (staticSuite runs validation immediately)
      expect(form.emailErrors()).toContain('Email is required');
      expect(form.result().getErrors('email')).toContain('Email is required');
      expect(form.emailValid()).toBe(false);

      // Set valid email
      form.setEmail('test@example.com');
      form.validate('email');

      expect(form.emailValid()).toBe(true);
      expect(form.emailErrors()).toHaveLength(0);
    });

    it('should validate entire form', () => {
      const form = createVestForm(mockSuite, initialModel);

      // Set valid data
      form.setEmail('test@example.com');
      form.setPassword('password123');

      form.validate();

      expect(form.valid()).toBe(true);
      expect(form.emailValid()).toBe(true);
      expect(form.passwordValid()).toBe(true);
    });

    it('should handle form submission', async () => {
      const form = createVestForm(mockSuite, initialModel);

      // Set valid data
      form.setEmail('test@example.com');
      form.setPassword('password123');

      const result = await form.submit();

      expect(result).toEqual({
        email: 'test@example.com',
        password: 'password123',
        profile: {
          name: '',
          age: 0,
        },
      });
    });

    it('should reject submission with invalid data', async () => {
      const form = createVestForm(mockSuite, initialModel);

      // Keep invalid data (empty fields)
      await expect(form.submit()).rejects.toThrow('Form validation failed');
      expect(form.hasSubmitted()).toBe(true);
    });

    it('should manage submitting state', async () => {
      const form = createVestForm(mockSuite, initialModel);

      // Set valid data
      form.setEmail('test@example.com');
      form.setPassword('password123');

      expect(form.submitting()).toBe(false);
      expect(form.hasSubmitted()).toBe(false);

      const submitPromise = form.submit();
      // Submitting state might be true briefly, but hard to test in sync code

      await submitPromise;
      expect(form.submitting()).toBe(false);
      expect(form.hasSubmitted()).toBe(true);
    });

    it('should reset form to initial state', () => {
      const form = createVestForm(mockSuite, initialModel);

      // Change form data
      form.setEmail('changed@example.com');
      form.setPassword('changedpassword');
      form.validate();
      expect(form.hasSubmitted()).toBe(false);

      expect(form.email()).toBe('changed@example.com');

      // Reset form
      form.reset();

      expect(form.email()).toBe('');
      expect(form.password()).toBe('');
      expect(form.hasSubmitted()).toBe(false);
    });

    it('should reset specific fields', () => {
      const form = createVestForm(mockSuite, initialModel);

      // Change email
      form.setEmail('changed@example.com');
      expect(form.email()).toBe('changed@example.com');

      // Reset only email
      form.resetField('email');

      expect(form.email()).toBe(''); // Reset to initial
    });
  });

  describe('Form Arrays', () => {
    it('should provide array access', () => {
      const modelWithArrays = {
        tags: ['tag1', 'tag2'],
        contacts: [
          { name: 'John', email: 'john@example.com' },
          { name: 'Jane', email: 'jane@example.com' },
        ],
      };

      const form = createVestForm(mockSuite, modelWithArrays);

      const tagsArray = form.array('tags');
      const contactsArray = form.array('contacts');

      // NOTE: Array functionality is not fully implemented yet
      expect(tagsArray).toBeDefined();
      expect(contactsArray).toBeDefined();

      // TODO: Implement these array operations
      // expect(typeof tagsArray.push).toBe('function');
      // expect(typeof tagsArray.remove).toBe('function');
      // expect(typeof contactsArray.at).toBe('function');
    });
  });

  describe('Memory Management', () => {
    it('should dispose form resources', () => {
      const form = createVestForm(mockSuite, initialModel);

      // Create some fields to populate cache
      form.field('email');
      form.field('password');

      // Dispose should clean up
      expect(() => form.dispose()).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle Event objects in field setters', () => {
      const form = createVestForm(mockSuite, initialModel);

      // Mock DOM event
      const mockEvent = {
        target: { value: 'test@example.com' },
      } as unknown as Event;

      expect(() => form.setEmail(mockEvent)).not.toThrow();
      // The actual value extraction is tested in value-extraction.spec.ts
    });
  });
});
