import { type } from 'arktype';

/**
 * ArkType Schema Implementation
 *
 * ArkType uses string-based type definitions with runtime validation.
 * Known for:
 * - String-based syntax that's close to TypeScript
 * - Strong performance (compiled validation)
 * - Expressive constraint syntax
 * - Good TypeScript integration
 */
export const arktypeUserProfileSchema = type({
  name: 'string > 1',
  email: 'string.email',
  age: 'number >= 13',
  'website?': 'string | ""',
  bio: 'string >= 10',
  preferences: {
    newsletter: 'boolean',
    theme: '"light" | "dark"',
  },
});

// Type inference from schema
export type ArktypeUserProfile = typeof arktypeUserProfileSchema.infer;

/**
 * Example code string for display in the UI
 */
export const ARKTYPE_SCHEMA_CODE = `import { type } from 'arktype';

export const arktypeUserProfileSchema = type({
  name: 'string > 1',
  email: 'string.email',
  age: 'number >= 13',
  'website?': 'string | ""',
  bio: 'string >= 10',
  preferences: {
    newsletter: 'boolean',
    theme: '"light" | "dark"',
  },
});

// Type inference
export type UserProfile = typeof arktypeUserProfileSchema.infer;`;
