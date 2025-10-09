/**
 * Utility for converting Vest string error messages into structured validation errors
 * compatible with Angular Signal Forms API.
 *
 * @module structured-errors
 */

import type { StructuredValidationError } from '../vest-form.types';

/**
 * Pattern matchers for common validation error types.
 * These patterns detect validation kinds from error messages.
 * ORDER MATTERS - more specific patterns must come before general ones!
 */
const ERROR_PATTERNS: {
  kind: string;
  pattern: RegExp;
  extractParams?: (match: RegExpMatchArray) => Record<string, unknown>;
}[] = [
  // Required - must be first to avoid conflicting with 'format' in 'invalid format'
  {
    kind: 'required',
    pattern: /\b(required|cannot be empty|must not be empty|is required)\b/i,
  },
  // Email
  {
    kind: 'email',
    pattern:
      /\b(email|invalid email|must be.+email|email.+(invalid|format))\b/i,
  },
  // Minlength with params (more specific than min)
  {
    kind: 'minlength',
    pattern: /\b(must be at least|minimum|min).+?(\d+).+(character|char)/i,
    extractParams: (match) => ({
      minlength: Number.parseInt(match[2] || '0', 10),
    }),
  },
  // Maxlength with params (more specific than max)
  {
    kind: 'maxlength',
    pattern: /\b(must be at most|maximum|max).+?(\d+).+(character|char)/i,
    extractParams: (match) => ({
      maxlength: Number.parseInt(match[2] || '0', 10),
    }),
  },
  // Integer - must come before number
  {
    kind: 'integer',
    pattern: /\b(must be.+integer|whole number|integer)\b/i,
  },
  // Number
  {
    kind: 'number',
    pattern: /\b(must be.+number|invalid number|numeric)\b/i,
  },
  // Match - must come before pattern
  {
    kind: 'match',
    pattern: /\b(must match|does not match|do not match|passwords.+match)\b/i,
  },
  // Min without 'character' (less specific, comes after minlength)
  {
    kind: 'min',
    pattern: /\b(must be at least|minimum|min)\s+(\d+)(?!\s+(character|char))/i,
    extractParams: (match) => ({ min: Number.parseInt(match[2] || '0', 10) }),
  },
  // Max without 'character' (less specific, comes after maxlength)
  {
    kind: 'max',
    pattern: /\b(must be at most|maximum|max)\s+(\d+)(?!\s+(character|char))/i,
    extractParams: (match) => ({ max: Number.parseInt(match[2] || '0', 10) }),
  },
  // URL
  {
    kind: 'url',
    pattern: /\b(url|must be.+url|invalid url)\b/i,
  },
  // Pattern (generic, comes last before custom)
  {
    kind: 'pattern',
    pattern: /\b(invalid format|pattern|must match.+pattern)\b/i,
  },
];

/**
 * Converts a Vest error message string into a structured validation error.
 *
 * This function uses pattern matching to detect the validation kind from the message.
 * If no pattern matches, it defaults to 'custom' kind.
 *
 * @param message - The error message from Vest
 * @returns A structured validation error with kind, message, and optional params
 *
 * @example
 * ```typescript
 * const error = parseStructuredError('Email is required');
 * // { kind: 'required', message: 'Email is required' }
 *
 * const error2 = parseStructuredError('Must be at least 8 characters');
 * // { kind: 'minlength', message: 'Must be at least 8 characters', params: { minlength: 8 } }
 * ```
 */
export function parseStructuredError(
  message: string,
): StructuredValidationError {
  // Try to match against known patterns
  for (const { kind, pattern, extractParams } of ERROR_PATTERNS) {
    const match = message.match(pattern);
    if (match) {
      if (extractParams) {
        return {
          kind,
          message,
          params: extractParams(match),
        };
      }

      return {
        kind,
        message,
      };
    }
  }

  // Default to 'custom' kind if no pattern matches
  return {
    kind: 'custom',
    message,
  };
}

/**
 * Converts an array of Vest error messages into structured validation errors.
 *
 * @param messages - Array of error message strings from Vest
 * @returns Array of structured validation errors
 *
 * @example
 * ```typescript
 * const errors = parseStructuredErrors([
 *   'Email is required',
 *   'Invalid email format'
 * ]);
 * // [
 * //   { kind: 'required', message: 'Email is required' },
 * //   { kind: 'email', message: 'Invalid email format' }
 * // ]
 * ```
 */
export function parseStructuredErrors(
  messages: string[],
): StructuredValidationError[] {
  return messages.map((message) => parseStructuredError(message));
}
