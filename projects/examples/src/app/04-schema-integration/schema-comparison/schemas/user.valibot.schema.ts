import * as v from 'valibot';

/**
 * Valibot Schema for User Profile
 *
 * Demonstrates Valibot's modular, tree-shakable approach to validation.
 * Valibot offers excellent performance and bundle size optimization.
 */
export const valibotUserProfileSchema = v.object({
  name: v.pipe(
    v.string(),
    v.minLength(2, 'Name must be at least 2 characters'),
    v.maxLength(50, 'Name must not exceed 50 characters'),
  ),

  email: v.pipe(
    v.string(),
    v.minLength(1, 'Email is required'),
    v.email('Invalid email format'),
  ),

  age: v.pipe(
    v.number(),
    v.integer('Age must be a whole number'),
    v.minValue(13, 'Must be at least 13 years old'),
    v.maxValue(120, 'Age must be realistic'),
  ),

  website: v.optional(
    v.union([v.pipe(v.string(), v.url('Invalid URL format')), v.literal('')]),
  ),

  bio: v.pipe(
    v.string(),
    v.minLength(10, 'Bio must be at least 10 characters'),
    v.maxLength(500, 'Bio must not exceed 500 characters'),
  ),

  preferences: v.object({
    newsletter: v.boolean(),
    notifications: v.boolean(),
  }),
});

// Type inference from schema
export type ValibotUserProfile = v.InferOutput<typeof valibotUserProfileSchema>;

/**
 * Example code string for display in the UI
 */
export const VALIBOT_SCHEMA_CODE = `import * as v from 'valibot';

export const valibotUserProfileSchema = v.object({
  name: v.pipe(
    v.string(),
    v.minLength(2, 'Name must be at least 2 characters'),
    v.maxLength(50, 'Name must not exceed 50 characters'),
  ),

  email: v.pipe(
    v.string(),
    v.minLength(1, 'Email is required'),
    v.email('Invalid email format'),
  ),

  age: v.pipe(
    v.number(),
    v.integer('Age must be a whole number'),
    v.minValue(13, 'Must be at least 13 years old'),
    v.maxValue(120, 'Age must be realistic'),
  ),

  website: v.optional(
    v.union([
      v.pipe(v.string(), v.url('Invalid URL format')),
      v.literal(''),
    ]),
  ),

  bio: v.pipe(
    v.string(),
    v.minLength(10, 'Bio must be at least 10 characters'),
    v.maxLength(500, 'Bio must not exceed 500 characters'),
  ),

  preferences: v.object({
    newsletter: v.boolean(),
    notifications: v.boolean(),
  }),
});

// Type inference from schema
export type UserProfile = v.InferOutput<typeof valibotUserProfileSchema>;`;
