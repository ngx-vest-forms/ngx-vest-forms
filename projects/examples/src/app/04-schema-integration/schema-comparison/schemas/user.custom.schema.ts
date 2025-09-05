import { ngxModelToStandardSchema } from 'ngx-vest-forms/schemas';
import type { UserProfile } from '../user-profile.model';

/**
 * Custom Schema for User Profile
 *
 * Demonstrates a simple custom schema implementation using ngx-vest-forms'
 * built-in `ngxModelToStandardSchema` utility. This provides basic type checking
 * without external dependencies.
 */

/**
 * User Profile Template with default values
 */
const userProfileTemplate: UserProfile = {
  name: '',
  email: '',
  age: 0,
  website: '',
  bio: '',
  preferences: {
    newsletter: false,
    notifications: false,
  },
};

/**
 * Custom User Profile Schema using ngxModelToStandardSchema
 *
 * This creates a StandardSchemaV1-compatible schema with basic type checking.
 * It's lightweight and doesn't require external schema libraries.
 */
export const customUserProfileSchema =
  ngxModelToStandardSchema(userProfileTemplate);

// Type inference helper
export type CustomUserProfile = UserProfile;

/**
 * Example code string for display in the UI
 */
export const CUSTOM_SCHEMA_CODE = `import { ngxModelToStandardSchema } from 'ngx-vest-forms/schemas';

// Define a template object with default values
const userProfileTemplate: UserProfile = {
  name: '',
  email: '',
  age: 0,
  website: '',
  bio: '',
  preferences: {
    newsletter: false,
    notifications: false,
  },
};

// Create a StandardSchema from the template
export const customUserProfileSchema = ngxModelToStandardSchema(userProfileTemplate);

// The schema provides:
// - Type inference from your template
// - StandardSchemaV1 compatibility
// - Lightweight runtime validation
// - Zero external dependencies

// Use with ngx-vest-forms:
// <form ngxVestFormWithSchema [formSchema]="customUserProfileSchema">
//   <!-- form fields -->
// </form>`;
