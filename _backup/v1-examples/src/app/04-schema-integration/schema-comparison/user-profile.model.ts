/**
 * User Profile Type for Schema Integration Example
 *
 * This type represents the complete user profile form data structure
 * that will be validated using different schema libraries.
 */
export type UserProfile = {
  name: string;
  email: string;
  age: number;
  website?: string;
  bio: string;
  preferences: {
    newsletter: boolean;
    notifications: boolean;
  };
};

/**
 * Schema types supported in this example
 */
export type SchemaType = 'zod' | 'valibot' | 'arktype' | 'custom';

/**
 * Schema metadata for display purposes
 */
export type SchemaInfo = {
  name: string;
  description: string;
  bundleSize: string;
  performance: string;
  ecosystem: string;
  typeInference: string;
  learningCurve: string;
};

/**
 * Schema comparison data
 */
export const SCHEMA_COMPARISON: Record<SchemaType, SchemaInfo> = {
  zod: {
    name: 'Zod',
    description: 'Popular TypeScript-first schema validation library',
    bundleSize: '~12KB',
    performance: 'Good',
    ecosystem: '🌟 Large',
    typeInference: '✅ Excellent',
    learningCurve: 'Low',
  },
  valibot: {
    name: 'Valibot',
    description: 'Lightweight, fast, and modular validation library',
    bundleSize: '~8KB',
    performance: 'Excellent',
    ecosystem: '📈 Growing',
    typeInference: '✅ Excellent',
    learningCurve: 'Low',
  },
  arktype: {
    name: 'ArkType',
    description: 'Advanced type system with runtime validation',
    bundleSize: '~15KB',
    performance: 'Good',
    ecosystem: '🆕 New',
    typeInference: '✅ Advanced',
    learningCurve: 'Medium',
  },
  custom: {
    name: 'Custom Schema',
    description: 'Simple custom schema implementation',
    bundleSize: '~1KB',
    performance: 'Excellent',
    ecosystem: '🏠 Internal',
    typeInference: '⚠️ Basic',
    learningCurve: 'Minimal',
  },
};
