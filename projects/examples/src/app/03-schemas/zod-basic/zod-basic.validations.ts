/**
 * Two-Layer Validation for User Registration
 *
 * LAYER 1: Zod Schema (Type & Structure Validation)
 * - Validates data types and required fields
 * - Runs first and blocks Layer 2 if invalid
 * - Implements StandardSchemaV1 interface
 *
 * LAYER 2: Vest.js Suite (Business Logic Validation)
 * - Validates domain-specific rules
 * - Async username availability check
 * - Cross-field password confirmation
 * - Only runs after schema passes
 */

import { staticSafeSuite } from 'ngx-vest-forms/core';
import type { InferOutput } from 'ngx-vest-forms/schemas';
import { enforce, include, skipWhen, test, warn } from 'vest';
import { z } from 'zod';

/**
 * User registration form model (inferred from Zod schema)
 *
 * ✨ NEW: Using InferOutput from ngx-vest-forms/schemas for cleaner syntax
 * This is equivalent to: z.infer<typeof userRegistrationSchema>
 *
 * Benefits:
 * - Works with any StandardSchemaV1-compatible library (Zod, Valibot, ArkType)
 * - Shorter, more readable syntax
 * - Framework-agnostic code
 */
export type UserRegistrationModel = InferOutput<typeof userRegistrationSchema>;

/**
 * LAYER 1: Zod Schema - Type & Structure Validation
 *
 * Validates:
 * - Email format
 * - Username min length (3 chars)
 * - Password strength (min 8 chars)
 * - Age requirement (18+)
 *
 * ✨ Uses .default() for initial values - single source of truth!
 */
export const userRegistrationSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .default(''),

  username: z
    .string()
    .min(1, 'Username is required')
    .min(3, 'Username must be at least 3 characters')
    .default(''),

  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .default(''),

  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password')
    .default(''),

  age: z
    .number()
    .int('Age must be a whole number')
    .min(18, 'You must be at least 18 years old')
    .max(120, 'Please enter a valid age')
    .default(18),

  agreeToTerms: z
    .boolean()
    .refine((value) => value === true, 'You must accept the terms')
    .default(false),
});

/**
 * Helper function to create initial form values from schema
 * This leverages Zod's .default() values - single source of truth!
 */
export function createInitialUserRegistration(): UserRegistrationModel {
  return userRegistrationSchema.parse({});
}

/**
 * LAYER 2: Vest.js Suite - Business Logic Validation
 *
 * Runs ONLY after schema validation passes.
 * Provides:
 * - Async username availability check
 * - Cross-field password confirmation
 * - Warning for weak passwords (non-blocking)
 */
export const userRegistrationSuite = staticSafeSuite<UserRegistrationModel>(
  (data = {}) => {
    // ========================================
    // EMAIL - Domain-specific validation
    // ========================================
    // Skip expensive async check until email format is valid (schema layer passed)
    skipWhen(
      // Condition: Only run async check if schema passed (no schema errors)
      (result) => result.hasErrors('email'),
      () => {
        test('email', 'Email domain is not allowed', async () => {
          // Simulate async domain check
          await new Promise((resolve) => setTimeout(resolve, 300));
          // Example: Block certain domains
          const blockedDomains = ['tempmail.com', 'throwaway.email'];
          const domain = data.email?.split('@')[1];
          if (domain && blockedDomains.includes(domain)) {
            throw new Error('Domain blocked');
          }
        });
      },
    );

    // ========================================
    // USERNAME - Availability check
    // ========================================
    // ✅ FIX: Skip async validation until username is valid AND not empty
    // This prevents "Checking availability..." from showing on empty/invalid usernames
    skipWhen(
      (result) => result.hasErrors('username') || !data.username?.trim(),
      () => {
        test('username', 'Username is already taken', async () => {
          // Simulate async API call
          await new Promise((resolve) => setTimeout(resolve, 500));
          // Example: Check against existing usernames
          const existingUsernames = ['admin', 'user', 'test'];
          if (
            data.username &&
            existingUsernames.includes(data.username.toLowerCase())
          ) {
            throw new Error('Username taken');
          }
        });
      },
    );

    // ========================================
    // PASSWORD - Strength recommendations
    // ========================================
    // Warning (non-blocking) for password strength
    test('password', 'Consider adding special characters for security', () => {
      warn(); // Makes this a warning, not an error
      enforce(data.password).matches(/[!@#$%^&*(),.?":{}|<>]/);
    });

    test('password', 'Consider adding numbers for security', () => {
      warn(); // Makes this a warning, not an error
      enforce(data.password).matches(/\d/);
    });

    // ========================================
    // PASSWORD CONFIRMATION - Cross-field validation
    // ========================================
    // Re-validate confirmPassword whenever password changes
    include('confirmPassword').when('password');

    test('confirmPassword', 'Passwords must match', () => {
      enforce(data.confirmPassword).equals(data.password);
    });
  },
);
