/**
 * Unit tests for schema error filtering with error display strategies
 * Tests the visibleSchemaErrors() feature that makes schema errors respect touch/submit state
 */

import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';
import type { StandardSchema } from '../../../schemas/src/lib/standard-schema.helpers';
import { createVestForm } from './create-vest-form';
import { staticSafeSuite } from './utils/safe-suite';

type TestModel = {
  email: string;
  username: string;
  password: string;
};

describe('Schema Error Filtering (visibleSchemaErrors)', () => {
  // Mock schema that validates all fields
  const createMockSchema = (): StandardSchema<TestModel, TestModel> => ({
    '~standard': {
      version: 1,
      vendor: 'zod',
      validate: (data) => {
        const issues: {
          message: string;
          path: (string | number | { key: string | number })[];
        }[] = [];

        if (!data || typeof data !== 'object') {
          return { issues };
        }

        const typedData = data as Partial<TestModel>;

        if (!typedData.email) {
          issues.push({
            message: 'Email is required',
            path: ['email'],
          });
        } else if (!typedData.email.includes('@')) {
          issues.push({
            message: 'Invalid email format',
            path: ['email'],
          });
        }

        if (!typedData.username) {
          issues.push({
            message: 'Username is required',
            path: ['username'],
          });
        }

        if (!typedData.password) {
          issues.push({
            message: 'Password is required',
            path: ['password'],
          });
        }

        return issues.length > 0 ? { issues } : { value: data as TestModel };
      },
    },
  });

  const emptyVestSuite = staticSafeSuite<TestModel>(() => {
    // No Vest validations - schema only
  });

  describe('Error display strategy: on-touch (default)', () => {
    it('shows no schema errors initially (no fields touched)', () => {
      const model = signal<TestModel>({
        email: '',
        username: '',
        password: '',
      });
      const form = createVestForm(model, {
        suite: emptyVestSuite,
        schema: createMockSchema(),
        errorStrategy: 'on-touch',
      });

      // Schema has validated and found errors
      expect(Object.keys(form.schemaErrors())).toHaveLength(3);
      expect(form.schemaErrors()).toEqual({
        email: ['Email is required'],
        username: ['Username is required'],
        password: ['Password is required'],
      });

      // But visibleSchemaErrors respects touch state
      expect(form.visibleSchemaErrors()).toEqual({});
    });

    it('shows schema errors only for touched fields', () => {
      const model = signal<TestModel>({
        email: '',
        username: '',
        password: '',
      });
      const form = createVestForm(model, {
        suite: emptyVestSuite,
        schema: createMockSchema(),
        errorStrategy: 'on-touch',
      });

      // Touch email field
      const emailField = form.field('email');
      emailField.markAsTouched();

      // Only email errors should be visible
      expect(form.visibleSchemaErrors()).toEqual({
        email: ['Email is required'],
      });

      // Other errors exist but are not visible
      expect(form.schemaErrors()).toHaveProperty('username');
      expect(form.visibleSchemaErrors()).not.toHaveProperty('username');
    });

    it('shows all schema errors after form submission', async () => {
      const model = signal<TestModel>({
        email: '',
        username: '',
        password: '',
      });
      const form = createVestForm(model, {
        suite: emptyVestSuite,
        schema: createMockSchema(),
        errorStrategy: 'on-touch',
      });

      // Initially no visible errors
      expect(form.visibleSchemaErrors()).toEqual({});

      // Submit form
      await form.submit();

      // All schema errors should now be visible
      expect(form.visibleSchemaErrors()).toEqual({
        email: ['Email is required'],
        username: ['Username is required'],
        password: ['Password is required'],
      });
    });

    it('updates visible errors when field value changes after touch', () => {
      const model = signal<TestModel>({
        email: '',
        username: '',
        password: '',
      });
      const form = createVestForm(model, {
        suite: emptyVestSuite,
        schema: createMockSchema(),
        errorStrategy: 'on-touch',
      });

      // Touch and see error
      const emailField = form.field('email');
      emailField.markAsTouched();
      expect(form.visibleSchemaErrors()).toEqual({
        email: ['Email is required'],
      });

      // Fix the error
      emailField.set('test@example.com');
      expect(form.visibleSchemaErrors()).toEqual({});

      // Break it again
      emailField.set('invalid');
      expect(form.visibleSchemaErrors()).toEqual({
        email: ['Invalid email format'],
      });
    });
  });

  describe('Error display strategy: immediate', () => {
    it('shows all schema errors immediately without touch', () => {
      const model = signal<TestModel>({
        email: '',
        username: '',
        password: '',
      });
      const form = createVestForm(model, {
        suite: emptyVestSuite,
        schema: createMockSchema(),
        errorStrategy: 'immediate',
      });

      // All errors visible immediately
      expect(form.visibleSchemaErrors()).toEqual({
        email: ['Email is required'],
        username: ['Username is required'],
        password: ['Password is required'],
      });
    });

    it('updates visible errors immediately when values change', () => {
      const model = signal<TestModel>({
        email: '',
        username: '',
        password: '',
      });
      const form = createVestForm(model, {
        suite: emptyVestSuite,
        schema: createMockSchema(),
        errorStrategy: 'immediate',
      });

      // Fix one error
      const emailField = form.field('email');
      emailField.set('test@example.com');

      expect(form.visibleSchemaErrors()).toEqual({
        username: ['Username is required'],
        password: ['Password is required'],
      });
    });
  });

  describe('Error display strategy: on-submit', () => {
    it('shows no schema errors until form is submitted', () => {
      const model = signal<TestModel>({
        email: '',
        username: '',
        password: '',
      });
      const form = createVestForm(model, {
        suite: emptyVestSuite,
        schema: createMockSchema(),
        errorStrategy: 'on-submit',
      });

      // Touch field
      const emailField = form.field('email');
      emailField.markAsTouched();

      // Still no visible errors (on-submit strategy)
      expect(form.visibleSchemaErrors()).toEqual({});
    });

    it('shows all schema errors after submit', async () => {
      const model = signal<TestModel>({
        email: '',
        username: '',
        password: '',
      });
      const form = createVestForm(model, {
        suite: emptyVestSuite,
        schema: createMockSchema(),
        errorStrategy: 'on-submit',
      });

      // Submit
      await form.submit();

      // All errors now visible
      expect(form.visibleSchemaErrors()).toEqual({
        email: ['Email is required'],
        username: ['Username is required'],
        password: ['Password is required'],
      });
    });
  });

  describe('Error display strategy: manual', () => {
    it('never shows schema errors automatically', () => {
      const model = signal<TestModel>({
        email: '',
        username: '',
        password: '',
      });
      const form = createVestForm(model, {
        suite: emptyVestSuite,
        schema: createMockSchema(),
        errorStrategy: 'manual',
      });

      // Touch and submit
      form.field('email').markAsTouched();
      form.submit();

      // Still no visible errors (manual strategy)
      expect(form.visibleSchemaErrors()).toEqual({});

      // But raw errors are still there
      expect(Object.keys(form.schemaErrors())).toHaveLength(3);
    });
  });

  describe('Reactive error strategy', () => {
    it('updates visible errors when strategy changes', () => {
      const model = signal<TestModel>({
        email: '',
        username: '',
        password: '',
      });
      const errorStrategy = signal<'on-touch' | 'immediate'>('on-touch');

      const form = createVestForm(model, {
        suite: emptyVestSuite,
        schema: createMockSchema(),
        errorStrategy,
      });

      // Initially no visible errors
      expect(form.visibleSchemaErrors()).toEqual({});

      // Switch to immediate
      errorStrategy.set('immediate');

      // All errors now visible
      expect(form.visibleSchemaErrors()).toEqual({
        email: ['Email is required'],
        username: ['Username is required'],
        password: ['Password is required'],
      });

      // Switch back to on-touch
      errorStrategy.set('on-touch');

      // Errors hidden again
      expect(form.visibleSchemaErrors()).toEqual({});
    });
  });

  describe('Integration with visibleErrors()', () => {
    it('visibleErrors includes visible schema errors', () => {
      const model = signal<TestModel>({
        email: '',
        username: '',
        password: '',
      });
      const form = createVestForm(model, {
        suite: emptyVestSuite,
        schema: createMockSchema(),
        errorStrategy: 'immediate',
      });

      // visibleErrors should match visibleSchemaErrors when no Vest errors
      expect(form.visibleErrors()).toEqual(form.visibleSchemaErrors());
      expect(form.visibleErrors()).toEqual({
        email: ['Email is required'],
        username: ['Username is required'],
        password: ['Password is required'],
      });
    });
  });

  describe('Vendor detection compatibility', () => {
    it('works with schema vendor detection', () => {
      const model = signal<TestModel>({
        email: '',
        username: '',
        password: '',
      });
      const schema = createMockSchema();

      const form = createVestForm(model, {
        suite: emptyVestSuite,
        schema,
        errorStrategy: 'immediate',
      });

      // Can detect vendor from schema
      expect(schema['~standard'].vendor).toBe('zod');

      // Filtering still works regardless of vendor
      expect(form.visibleSchemaErrors()).toEqual({
        email: ['Email is required'],
        username: ['Username is required'],
        password: ['Password is required'],
      });
    });
  });
});
