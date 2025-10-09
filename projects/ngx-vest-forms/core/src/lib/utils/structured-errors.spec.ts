/**
 * Unit tests for structured error parsing utilities
 */

import { describe, expect, it } from 'vitest';
import {
  parseStructuredError,
  parseStructuredErrors,
} from './structured-errors';

describe('Structured Errors', () => {
  describe('parseStructuredError', () => {
    it('should detect required errors', () => {
      const tests = [
        'Email is required',
        'Field cannot be empty',
        'This field must not be empty',
        'Username is Required',
      ];

      for (const message of tests) {
        const error = parseStructuredError(message);
        expect(error.kind).toBe('required');
        expect(error.message).toBe(message);
        expect(error.params).toBeUndefined();
      }
    });

    it('should detect email errors', () => {
      const tests = [
        'Invalid email address',
        'Email format is invalid',
        'Must be a valid email',
        'The email is not valid',
      ];

      for (const message of tests) {
        const error = parseStructuredError(message);
        expect(error.kind).toBe('email');
        expect(error.message).toBe(message);
      }
    });

    it('should detect minlength errors with params', () => {
      const error = parseStructuredError('Must be at least 8 characters');
      expect(error.kind).toBe('minlength');
      expect(error.message).toBe('Must be at least 8 characters');
      expect(error.params).toEqual({ minlength: 8 });
    });

    it('should detect maxlength errors with params', () => {
      const error = parseStructuredError('Must be at most 100 characters');
      expect(error.kind).toBe('maxlength');
      expect(error.message).toBe('Must be at most 100 characters');
      expect(error.params).toEqual({ maxlength: 100 });
    });

    it('should detect min errors with params', () => {
      const error = parseStructuredError('Must be at least 18');
      expect(error.kind).toBe('min');
      expect(error.message).toBe('Must be at least 18');
      expect(error.params).toEqual({ min: 18 });
    });

    it('should detect max errors with params', () => {
      const error = parseStructuredError('Must be at most 100');
      expect(error.kind).toBe('max');
      expect(error.message).toBe('Must be at most 100');
      expect(error.params).toEqual({ max: 100 });
    });

    it('should detect pattern errors', () => {
      const error = parseStructuredError('Invalid format');
      expect(error.kind).toBe('pattern');
      expect(error.message).toBe('Invalid format');
    });

    it('should detect url errors', () => {
      const tests = [
        'Invalid URL',
        'Must be a valid url',
        'The url is not valid',
      ];

      for (const message of tests) {
        const error = parseStructuredError(message);
        expect(error.kind).toBe('url');
        expect(error.message).toBe(message);
      }
    });

    it('should detect number errors', () => {
      const tests = [
        'Must be a number',
        'Invalid number',
        'Value must be numeric',
      ];

      for (const message of tests) {
        const error = parseStructuredError(message);
        expect(error.kind).toBe('number');
        expect(error.message).toBe(message);
      }
    });

    it('should detect integer errors', () => {
      const tests = [
        'Must be an integer',
        'Must be a whole number',
        'Value must be an integer',
      ];

      for (const message of tests) {
        const error = parseStructuredError(message);
        expect(error.kind).toBe('integer');
        expect(error.message).toBe(message);
      }
    });

    it('should detect match errors', () => {
      const tests = [
        'Passwords must match',
        'Values do not match',
        'Fields must match',
      ];

      for (const message of tests) {
        const error = parseStructuredError(message);
        expect(error.kind).toBe('match');
        expect(error.message).toBe(message);
      }
    });

    it('should default to custom kind for unknown patterns', () => {
      const error = parseStructuredError('Some custom validation error');
      expect(error.kind).toBe('custom');
      expect(error.message).toBe('Some custom validation error');
      expect(error.params).toBeUndefined();
    });

    it('should be case-insensitive', () => {
      const error1 = parseStructuredError('EMAIL IS REQUIRED');
      expect(error1.kind).toBe('required');

      const error2 = parseStructuredError('invalid Email');
      expect(error2.kind).toBe('email');
    });

    it('should match partial words', () => {
      const error = parseStructuredError('This field cannot be empty');
      expect(error.kind).toBe('required');
    });
  });

  describe('parseStructuredErrors', () => {
    it('should parse array of messages', () => {
      const messages = [
        'Email is required',
        'Invalid email format',
        'Must be at least 8 characters',
      ];

      const errors = parseStructuredErrors(messages);

      expect(errors).toHaveLength(3);
      expect(errors[0].kind).toBe('required');
      expect(errors[1].kind).toBe('email');
      expect(errors[2].kind).toBe('minlength');
      expect(errors[2].params).toEqual({ minlength: 8 });
    });

    it('should handle empty array', () => {
      const errors = parseStructuredErrors([]);
      expect(errors).toEqual([]);
    });

    it('should preserve message order', () => {
      const messages = ['Error 1', 'Error 2', 'Error 3'];
      const errors = parseStructuredErrors(messages);

      expect(errors[0].message).toBe('Error 1');
      expect(errors[1].message).toBe('Error 2');
      expect(errors[2].message).toBe('Error 3');
    });
  });
});
