/**
 * Schema Validation Service
 *
 * Demonstrates standalone validation using ngx-vest-forms/schemas utilities
 * for non-form use cases like API request/response validation.
 *
 * ✨ NEW utilities showcased:
 * - validateStandardSchema() - Async/sync validation
 * - validateStandardSchemaSync() - Sync-only validation (throws if async)
 * - isSuccessResult() - Type guard for success
 * - isFailureResult() - Type guard for failure
 * - InferOutput<T> - Universal type inference
 */

import { Injectable } from '@angular/core';
import type { InferOutput } from 'ngx-vest-forms/schemas';
import {
  isFailureResult,
  isSuccessResult,
  validateStandardSchema,
  validateStandardSchemaSync,
} from 'ngx-vest-forms/schemas';
import { z } from 'zod';

/**
 * User profile schema for API responses
 */
export const userProfileSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  username: z.string().min(3),
  displayName: z.string().optional(),
  avatar: z.string().url().optional(),
  createdAt: z.string().datetime(),
});

export type UserProfile = InferOutput<typeof userProfileSchema>;

/**
 * API request schema for creating a user
 */
export const createUserRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().optional(),
});

export type CreateUserRequest = InferOutput<typeof createUserRequestSchema>;

/**
 * API response wrapper schema
 */
export const apiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    timestamp: z.string().datetime(),
  });

@Injectable({
  providedIn: 'root',
})
export class SchemaValidationService {
  /**
   * Example 1: Validate API response with type guards
   *
   * ✨ Uses validateStandardSchema() and isSuccessResult()
   */
  async validateUserResponse(response: unknown): Promise<UserProfile | null> {
    const result = await validateStandardSchema(userProfileSchema, response);

    // ✨ Type guard provides type safety
    if (isSuccessResult(result)) {
      // TypeScript knows result.value is UserProfile
      console.log('✅ Valid user profile:', result.value);
      return result.value;
    }

    // TypeScript knows result.issues exists
    console.error('❌ Invalid user response:', result.issues);
    return null;
  }

  /**
   * Example 2: Validate request data synchronously
   *
   * ✨ Uses validateStandardSchemaSync() - throws if schema is async
   */
  validateCreateUserRequest(data: unknown): CreateUserRequest | null {
    try {
      const result = validateStandardSchemaSync(createUserRequestSchema, data);

      if (isSuccessResult(result)) {
        console.log('✅ Valid request:', result.value);
        return result.value;
      }

      // Log validation errors
      console.error('❌ Invalid request:', result.issues);
      return null;
    } catch (error) {
      // This would only happen if the schema uses async validation
      console.error('⚠️ Schema uses async validation:', error);
      return null;
    }
  }

  /**
   * Example 3: Validate with detailed error handling
   *
   * ✨ Uses isFailureResult() for error-first approach
   */
  async validateWithDetails(
    data: unknown,
  ): Promise<
    { success: true; user: UserProfile } | { success: false; errors: string[] }
  > {
    const result = await validateStandardSchema(userProfileSchema, data);

    // ✨ Error-first approach with type guard
    if (isFailureResult(result)) {
      // Extract error messages
      const errors = result.issues.map((issue) => issue.message);
      return { success: false, errors };
    }

    // Success path
    return { success: true, user: result.value };
  }

  /**
   * Example 4: Batch validation with aggregated results
   *
   * ✨ Demonstrates parallel validation with Promise.all
   */
  async validateBatch(items: unknown[]): Promise<{
    valid: UserProfile[];
    invalid: { data: unknown; errors: string[] }[];
  }> {
    const results = await Promise.all(
      items.map((item) => validateStandardSchema(userProfileSchema, item)),
    );

    const valid: UserProfile[] = [];
    const invalid: { data: unknown; errors: string[] }[] = [];

    for (const [index, result] of results.entries()) {
      if (isSuccessResult(result)) {
        valid.push(result.value);
      } else {
        invalid.push({
          data: items[index],
          errors: result.issues.map((issue) => issue.message),
        });
      }
    }

    return { valid, invalid };
  }

  /**
   * Example 5: Validate API response wrapper
   *
   * ✨ Demonstrates generic schema composition
   */
  async validateApiResponse<T extends z.ZodType>(
    response: unknown,
    dataSchema: T,
  ): Promise<InferOutput<ReturnType<typeof apiResponseSchema<T>>> | null> {
    const schema = apiResponseSchema(dataSchema);
    const result = await validateStandardSchema(schema, response);

    if (isSuccessResult(result)) {
      return result.value;
    }

    console.error('❌ Invalid API response:', result.issues);
    return null;
  }

  /**
   * Example 6: Transform and validate in one step
   *
   * ✨ Demonstrates Zod transformations with validation
   */
  async parseAndValidateDate(data: unknown): Promise<Date | null> {
    const dateSchema = z.object({
      timestamp: z
        .string()
        .datetime()
        .transform((dateString) => new Date(dateString)),
    });

    const result = await validateStandardSchema(dateSchema, data);

    if (isSuccessResult(result)) {
      // result.value.timestamp is already a Date object
      return result.value.timestamp;
    }

    return null;
  }
}
