/**
 * Unit tests for invalid() and dirty() signals and markAs methods
 */

import { signal } from '@angular/core';
import { enforce, test } from 'vest';
import { describe, expect, it } from 'vitest';
import { createVestForm } from './create-vest-form';
import { staticSafeSuite } from './utils/safe-suite';

type TestModel = {
  email: string;
  password: string;
  age: number;
};

const testSuite = staticSafeSuite<TestModel>((data = {}) => {
  test('email', 'Email is required', () => {
    enforce(data.email).isNotEmpty();
  });
  test('email', 'Invalid email format', () => {
    enforce(data.email).matches(/^[^@]+@[^@]+\.[^@]+$/);
  });
  test('password', 'Password is required', () => {
    enforce(data.password).isNotEmpty();
  });
  test('age', 'Age must be at least 18', () => {
    enforce(data.age).greaterThanOrEquals(18);
  });
});

describe('Invalid/Dirty Signals and markAs Methods', () => {
  describe('form.invalid() - form-level', () => {
    it('should return true when any field has errors', () => {
      const form = createVestForm(
        signal<TestModel>({ email: '', password: '', age: 0 }),
        { suite: testSuite, errorStrategy: 'immediate' },
      );

      // Initial state - has errors (empty email, empty password, age < 18)
      expect(form.invalid()).toBe(true);
    });

    it('should return false when all fields are valid', () => {
      const form = createVestForm(
        signal<TestModel>({
          email: 'test@example.com',
          password: 'pass123',
          age: 25,
        }),
        { suite: testSuite, errorStrategy: 'immediate' },
      );

      expect(form.invalid()).toBe(false);
    });

    it('should react to value changes via field setters', () => {
      const model = signal<TestModel>({ email: '', password: '', age: 0 });
      const form = createVestForm(model, {
        suite: testSuite,
        errorStrategy: 'immediate',
      });

      expect(form.invalid()).toBe(true);

      // Fix all fields using field API
      form.field('email').set('test@example.com');
      form.field('password').set('pass123');
      form.field('age').set(25);
      expect(form.invalid()).toBe(false);

      // Break one field
      form.field('email').set('');
      expect(form.invalid()).toBe(true);
    });

    it('should be the inverse of valid()', () => {
      const model = signal<TestModel>({ email: '', password: '', age: 0 });
      const form = createVestForm(model, {
        suite: testSuite,
        errorStrategy: 'immediate',
      });

      expect(form.invalid()).toBe(!form.valid());

      model.set({ email: 'test@example.com', password: 'pass123', age: 25 });
      expect(form.invalid()).toBe(!form.valid());
    });
  });

  describe('field.invalid() - field-level', () => {
    it('should return true when field has errors', () => {
      const form = createVestForm(
        signal<TestModel>({ email: '', password: 'pass123', age: 25 }),
        { suite: testSuite, errorStrategy: 'immediate' },
      );

      const emailField = form.field('email');
      expect(emailField.invalid()).toBe(true);

      const passwordField = form.field('password');
      expect(passwordField.invalid()).toBe(false);
    });

    it('should react to field value changes', () => {
      const model = signal<TestModel>({ email: '', password: '', age: 0 });
      const form = createVestForm(model, {
        suite: testSuite,
        errorStrategy: 'immediate',
      });
      const emailField = form.field('email');

      expect(emailField.invalid()).toBe(true);

      form.field('email').set('test@example.com');
      expect(emailField.invalid()).toBe(false);

      form.field('email').set('');
      expect(emailField.invalid()).toBe(true);
    });

    it('should be the inverse of valid()', () => {
      const form = createVestForm(
        signal<TestModel>({ email: '', password: '', age: 0 }),
        { suite: testSuite, errorStrategy: 'immediate' },
      );
      const emailField = form.field('email');

      expect(emailField.invalid()).toBe(!emailField.valid());

      form.field('email').set('test@example.com');
      expect(emailField.invalid()).toBe(!emailField.valid());
    });

    it('should work with Enhanced Proxy API', () => {
      const form = createVestForm(
        signal<TestModel>({ email: '', password: '', age: 0 }),
        { suite: testSuite, errorStrategy: 'immediate' },
      );

      expect(form.emailInvalid()).toBe(true);
      expect(form.passwordInvalid()).toBe(true);

      form.field('email').set('test@example.com');
      expect(form.emailInvalid()).toBe(false);
    });
  });

  describe('form.dirty() - form-level', () => {
    it('should return false initially', () => {
      const form = createVestForm(
        signal<TestModel>({ email: '', password: '', age: 0 }),
        { suite: testSuite },
      );

      expect(form.dirty()).toBe(false);
    });

    it('should return true after any field is modified', () => {
      const form = createVestForm(
        signal<TestModel>({ email: '', password: '', age: 0 }),
        { suite: testSuite },
      );

      form.field('email').set('test@example.com');
      expect(form.dirty()).toBe(true);
    });

    it('should track multiple dirty fields', () => {
      const form = createVestForm(
        signal<TestModel>({ email: '', password: '', age: 0 }),
        { suite: testSuite },
      );

      form.field('email').set('test@example.com');
      expect(form.dirty()).toBe(true);

      form.field('password').set('pass123');
      expect(form.dirty()).toBe(true);
    });

    it('should reset when form is reset', () => {
      const form = createVestForm(
        signal<TestModel>({ email: '', password: '', age: 0 }),
        { suite: testSuite },
      );

      form.field('email').set('test@example.com');
      expect(form.dirty()).toBe(true);

      form.reset();
      expect(form.dirty()).toBe(false);
    });

    it('should NOT mark as dirty when setting to same value', () => {
      const form = createVestForm(
        signal<TestModel>({ email: 'test@example.com', password: '', age: 0 }),
        { suite: testSuite },
      );

      form.field('email').set('test@example.com'); // Same as initial
      expect(form.dirty()).toBe(false);
    });

    it('should mark as dirty when setting to different value', () => {
      const form = createVestForm(
        signal<TestModel>({ email: 'test@example.com', password: '', age: 0 }),
        { suite: testSuite },
      );

      form.field('email').set('different@example.com');
      expect(form.dirty()).toBe(true);
    });
  });

  describe('field.dirty() - field-level', () => {
    it('should return false initially', () => {
      const form = createVestForm(
        signal<TestModel>({ email: '', password: '', age: 0 }),
        { suite: testSuite },
      );
      const emailField = form.field('email');

      expect(emailField.dirty()).toBe(false);
    });

    it('should return true after field is modified', () => {
      const form = createVestForm(
        signal<TestModel>({ email: '', password: '', age: 0 }),
        { suite: testSuite },
      );
      const emailField = form.field('email');

      form.field('email').set('test@example.com');
      expect(emailField.dirty()).toBe(true);
    });

    it('should not affect other fields', () => {
      const form = createVestForm(
        signal<TestModel>({ email: '', password: '', age: 0 }),
        { suite: testSuite },
      );
      const emailField = form.field('email');
      const passwordField = form.field('password');

      form.field('email').set('test@example.com');
      expect(emailField.dirty()).toBe(true);
      expect(passwordField.dirty()).toBe(false);
    });

    it('should reset when form is reset', () => {
      const form = createVestForm(
        signal<TestModel>({ email: '', password: '', age: 0 }),
        { suite: testSuite },
      );
      const emailField = form.field('email');

      form.field('email').set('test@example.com');
      expect(emailField.dirty()).toBe(true);

      form.reset();
      expect(emailField.dirty()).toBe(false);
    });

    it('should work with Enhanced Proxy API', () => {
      const form = createVestForm(
        signal<TestModel>({ email: '', password: '', age: 0 }),
        { suite: testSuite },
      );

      expect(form.emailDirty()).toBe(false);
      form.field('email').set('test@example.com');
      expect(form.emailDirty()).toBe(true);
    });
  });

  describe('field.markAsTouched()', () => {
    it('should mark field as touched', () => {
      const form = createVestForm(
        signal<TestModel>({ email: '', password: '', age: 0 }),
        { suite: testSuite },
      );
      const emailField = form.field('email');

      expect(emailField.touched()).toBe(false);
      emailField.markAsTouched();
      expect(emailField.touched()).toBe(true);
    });

    it('should trigger validation', () => {
      const form = createVestForm(
        signal<TestModel>({ email: '', password: '', age: 0 }),
        { suite: testSuite },
      );
      const emailField = form.field('email');

      emailField.markAsTouched();
      expect(emailField.validation().errors.length).toBeGreaterThan(0);
    });

    it('should be an alias for touch()', () => {
      const form = createVestForm(
        signal<TestModel>({ email: '', password: '', age: 0 }),
        { suite: testSuite },
      );
      const emailField = form.field('email');

      emailField.markAsTouched();
      expect(emailField.touched()).toBe(true);

      form.reset();
      emailField.markAsTouched();
      expect(emailField.touched()).toBe(true);
    });

    it('should work with Enhanced Proxy API', () => {
      const form = createVestForm(
        signal<TestModel>({ email: '', password: '', age: 0 }),
        { suite: testSuite },
      );

      expect(form.emailTouched()).toBe(false);
      form.markAsTouchedEmail();
      expect(form.emailTouched()).toBe(true);
    });
  });

  describe('field.markAsDirty()', () => {
    it('should mark field as dirty', () => {
      const form = createVestForm(
        signal<TestModel>({ email: '', password: '', age: 0 }),
        { suite: testSuite },
      );
      const emailField = form.field('email');

      expect(emailField.dirty()).toBe(false);
      emailField.markAsDirty();
      expect(emailField.dirty()).toBe(true);
    });

    it('should mark form as dirty', () => {
      const form = createVestForm(
        signal<TestModel>({ email: '', password: '', age: 0 }),
        { suite: testSuite },
      );

      expect(form.dirty()).toBe(false);
      form.field('email').markAsDirty();
      expect(form.dirty()).toBe(true);
    });

    it('should not trigger validation', () => {
      const form = createVestForm(
        signal<TestModel>({ email: '', password: '', age: 0 }),
        { suite: testSuite, errorStrategy: 'on-touch' },
      );
      const emailField = form.field('email');

      // With on-touch strategy, errors should not show until touched
      emailField.markAsDirty();
      expect(emailField.showErrors()).toBe(false);
    });

    it('should work with Enhanced Proxy API', () => {
      const form = createVestForm(
        signal<TestModel>({ email: '', password: '', age: 0 }),
        { suite: testSuite },
      );

      expect(form.emailDirty()).toBe(false);
      form.markAsDirtyEmail();
      expect(form.emailDirty()).toBe(true);
    });
  });

  describe('combined dirty and touched behavior', () => {
    it('should track dirty and touched independently', () => {
      const form = createVestForm(
        signal<TestModel>({ email: '', password: '', age: 0 }),
        { suite: testSuite },
      );
      const emailField = form.field('email');

      emailField.markAsDirty();
      expect(emailField.dirty()).toBe(true);
      expect(emailField.touched()).toBe(false);

      emailField.markAsTouched();
      expect(emailField.dirty()).toBe(true);
      expect(emailField.touched()).toBe(true);
    });

    it('should reset both dirty and touched', () => {
      const form = createVestForm(
        signal<TestModel>({ email: '', password: '', age: 0 }),
        { suite: testSuite },
      );
      const emailField = form.field('email');

      emailField.markAsDirty();
      emailField.markAsTouched();
      expect(emailField.dirty()).toBe(true);
      expect(emailField.touched()).toBe(true);

      form.reset();
      expect(emailField.dirty()).toBe(false);
      expect(emailField.touched()).toBe(false);
    });

    it('should allow setting value to mark dirty without touching', () => {
      const form = createVestForm(
        signal<TestModel>({ email: '', password: '', age: 0 }),
        { suite: testSuite },
      );
      const emailField = form.field('email');

      form.field('email').set('test@example.com');
      expect(emailField.dirty()).toBe(true);
      expect(emailField.touched()).toBe(false);
    });
  });
});
