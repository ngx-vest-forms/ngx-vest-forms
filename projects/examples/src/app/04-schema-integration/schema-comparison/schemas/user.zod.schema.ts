import { z } from 'zod';

/**
 * Zod Schema for User Profile
 *
 * Demonstrates Zod's elegant TypeScript-first validation approach.
 * Zod provides excellent type inference and a clean API for complex validations.
 */
export const zodUserProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters'),

  email: z.string().email('Invalid email format').min(1, 'Email is required'),

  age: z
    .number()
    .int('Age must be a whole number')
    .min(13, 'Must be at least 13 years old')
    .max(120, 'Age must be realistic'),

  website: z.string().url('Invalid URL format').optional().or(z.literal('')),

  bio: z
    .string()
    .min(10, 'Bio must be at least 10 characters')
    .max(500, 'Bio must not exceed 500 characters'),

  preferences: z.object({
    newsletter: z.boolean(),
    notifications: z.boolean(),
  }),
});

// Type inference from schema (should match UserProfile)
export type ZodUserProfile = z.infer<typeof zodUserProfileSchema>;

/**
 * Example code string for display in the UI
 */
export const ZOD_SCHEMA_CODE = `import { z } from 'zod';

export const zodUserProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters'),

  email: z
    .string()
    .email('Invalid email format')
    .min(1, 'Email is required'),

  age: z
    .number()
    .int('Age must be a whole number')
    .min(13, 'Must be at least 13 years old')
    .max(120, 'Age must be realistic'),

  website: z
    .string()
    .url('Invalid URL format')
    .optional()
    .or(z.literal('')),

  bio: z
    .string()
    .min(10, 'Bio must be at least 10 characters')
    .max(500, 'Bio must not exceed 500 characters'),

  preferences: z.object({
    newsletter: z.boolean(),
    notifications: z.boolean(),
  }),
});

// Type inference from schema
export type UserProfile = z.infer<typeof zodUserProfileSchema>;`;
