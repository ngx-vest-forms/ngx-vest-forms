/**
 * Server-Side Validation with Vest.js
 *
 * This file demonstrates how to use Vest.js validation on the server-side
 * with Node.js and Express.js. The patterns shown here can be used in:
 *
 * 🚀 Use Cases:
 * - API endpoint validation
 * - Shared validation logic between client and server
 * - Database validation before persistence
 * - Microservice validation patterns
 * - Form submission validation on backend
 *
 * 📋 Patterns Demonstrated:
 * - Express.js middleware for validation
 * - Stateless validation with staticSuite
 * - Error response formatting
 * - Shared validation schemas
 * - Database integration patterns
 * - API route validation helpers
 *
 * 🎯 Key Benefits:
 * - Consistent validation rules across frontend/backend
 * - Type-safe validation with TypeScript
 * - Performance optimized with staticSuite
 * - Easy error handling and response formatting
 * - Reusable validation middleware
 */

import { enforce, omitWhen, staticSuite, test } from 'vest';

/**
 * === SHARED VALIDATION MODELS ===
 *
 * These types are shared between client and server for consistency
 */

export type UserRegistrationModel = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  agreeToTerms: boolean;
};

export type UserProfileModel = {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  bio?: string;
  website?: string;
  location?: string;
  isPublic: boolean;
};

export type ProductModel = {
  id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  isActive: boolean;
  inventory?: number;
};

/**
 * Field names for type-safe validation
 */
type UserRegistrationFieldNames = keyof UserRegistrationModel;
type UserProfileFieldNames = keyof UserProfileModel;
type ProductFieldNames = keyof ProductModel;

/**
 * === SHARED VALIDATION SUITES ===
 *
 * These validation suites can be used on both client and server
 */

/**
 * User Registration Validation
 *
 * Comprehensive validation for user registration that works on server-side
 */
export const userRegistrationValidationSuite = staticSuite<
  UserRegistrationFieldNames,
  never,
  (data: Partial<UserRegistrationModel>) => void
>((data: Partial<UserRegistrationModel> = {}) => {
  // Username validation
  test('username', 'Username is required', () => {
    enforce(data.username).isNotEmpty();
  });

  test('username', 'Username must be 3-20 characters', () => {
    enforce(data.username).longerThanOrEquals(3).shorterThanOrEquals(20);
  });

  test(
    'username',
    'Username can only contain letters, numbers, and underscores',
    () => {
      enforce(data.username).matches(/^[a-zA-Z0-9_]+$/);
    },
  );

  // Email validation
  test('email', 'Email is required', () => {
    enforce(data.email).isNotEmpty();
  });

  test('email', 'Email format is invalid', () => {
    enforce(data.email).matches(/^[^@]+@[^@]+\.[^@]+$/);
  });

  // Password validation
  test('password', 'Password is required', () => {
    enforce(data.password).isNotEmpty();
  });

  test('password', 'Password must be at least 8 characters', () => {
    enforce(data.password).longerThanOrEquals(8);
  });

  test('password', 'Password must contain uppercase letter', () => {
    enforce(data.password).matches(/[A-Z]/);
  });

  test('password', 'Password must contain lowercase letter', () => {
    enforce(data.password).matches(/[a-z]/);
  });

  test('password', 'Password must contain number', () => {
    enforce(data.password).matches(/\d/);
  });

  // Password confirmation
  test('confirmPassword', 'Password confirmation is required', () => {
    if (data.password) {
      enforce(data.confirmPassword).isNotEmpty();
    }
  });

  test('confirmPassword', 'Passwords do not match', () => {
    if (data.password && data.confirmPassword) {
      enforce(data.confirmPassword).equals(data.password);
    }
  });

  // Name validation
  test('firstName', 'First name is required', () => {
    enforce(data.firstName).isNotEmpty();
  });

  test('firstName', 'First name must be 2-50 characters', () => {
    enforce(data.firstName).longerThanOrEquals(2).shorterThanOrEquals(50);
  });

  test('lastName', 'Last name is required', () => {
    enforce(data.lastName).isNotEmpty();
  });

  test('lastName', 'Last name must be 2-50 characters', () => {
    enforce(data.lastName).longerThanOrEquals(2).shorterThanOrEquals(50);
  });

  // Date of birth (optional)
  omitWhen(!data.dateOfBirth, () => {
    test('dateOfBirth', 'Invalid date format', () => {
      const date = new Date(data.dateOfBirth!);
      enforce(date.toString()).notEquals('Invalid Date');
    });

    test('dateOfBirth', 'Must be at least 13 years old', () => {
      const date = new Date(data.dateOfBirth!);
      const thirteenYearsAgo = new Date();
      thirteenYearsAgo.setFullYear(thirteenYearsAgo.getFullYear() - 13);

      enforce(date.getTime()).lessThanOrEquals(thirteenYearsAgo.getTime());
    });
  });

  // Terms agreement
  test('agreeToTerms', 'You must agree to the terms and conditions', () => {
    enforce(data.agreeToTerms).isTruthy();
  });
});

/**
 * User Profile Validation
 *
 * Validation for user profile updates
 */
export const userProfileValidationSuite = staticSuite<
  UserProfileFieldNames,
  never,
  (data: Partial<UserProfileModel>) => void
>((data: Partial<UserProfileModel> = {}) => {
  // ID validation (for updates)
  test('id', 'User ID is required for updates', () => {
    enforce(data.id).isNotEmpty();
  });

  test('id', 'Invalid user ID format', () => {
    enforce(data.id).matches(/^[a-f\d]{24}$/i); // MongoDB ObjectId format
  });

  // Username validation
  test('username', 'Username is required', () => {
    enforce(data.username).isNotEmpty();
  });

  test('username', 'Username must be 3-20 characters', () => {
    enforce(data.username).longerThanOrEquals(3).shorterThanOrEquals(20);
  });

  // Email validation
  test('email', 'Email is required', () => {
    enforce(data.email).isNotEmpty();
  });

  test('email', 'Email format is invalid', () => {
    enforce(data.email).matches(/^[^@]+@[^@]+\.[^@]+$/);
  });

  // Name validation
  test('firstName', 'First name is required', () => {
    enforce(data.firstName).isNotEmpty();
  });

  test('lastName', 'Last name is required', () => {
    enforce(data.lastName).isNotEmpty();
  });

  // Optional fields
  omitWhen(!data.bio, () => {
    test('bio', 'Bio must be less than 500 characters', () => {
      enforce(data.bio!).shorterThanOrEquals(500);
    });
  });

  omitWhen(!data.website, () => {
    test('website', 'Website must be a valid URL', () => {
      try {
        new URL(data.website!);
      } catch {
        throw new Error('Invalid URL');
      }
    });
  });

  omitWhen(!data.location, () => {
    test('location', 'Location must be less than 100 characters', () => {
      enforce(data.location!).shorterThanOrEquals(100);
    });
  });

  // Privacy setting
  test('isPublic', 'Privacy setting is required', () => {
    enforce(data.isPublic).isBoolean();
  });
});

/**
 * Product Validation
 *
 * Validation for e-commerce products
 */
export const productValidationSuite = staticSuite<
  ProductFieldNames,
  never,
  (data: Partial<ProductModel>) => void
>((data: Partial<ProductModel> = {}) => {
  // Product name
  test('name', 'Product name is required', () => {
    enforce(data.name).isNotEmpty();
  });

  test('name', 'Product name must be 3-100 characters', () => {
    enforce(data.name).longerThanOrEquals(3).shorterThanOrEquals(100);
  });

  // Description
  test('description', 'Product description is required', () => {
    enforce(data.description).isNotEmpty();
  });

  test('description', 'Description must be 10-1000 characters', () => {
    enforce(data.description).longerThanOrEquals(10).shorterThanOrEquals(1000);
  });

  // Price validation
  test('price', 'Price is required', () => {
    enforce(data.price).isNumber();
  });

  test('price', 'Price must be greater than 0', () => {
    enforce(data.price).greaterThan(0);
  });

  test('price', 'Price cannot exceed $10,000', () => {
    enforce(data.price).lessThanOrEquals(10_000);
  });

  // Category
  test('category', 'Category is required', () => {
    enforce(data.category).isNotEmpty();
  });

  const validCategories = [
    'electronics',
    'clothing',
    'books',
    'home',
    'sports',
    'toys',
    'other',
  ];
  test('category', 'Invalid category', () => {
    enforce(data.category).inside(validCategories);
  });

  // Tags validation
  test('tags', 'At least one tag is required', () => {
    enforce(data.tags).isArray().longerThanOrEquals(1);
  });

  test('tags', 'Maximum 10 tags allowed', () => {
    enforce(data.tags).shorterThanOrEquals(10);
  });

  if (data.tags && Array.isArray(data.tags)) {
    for (const [index, tag] of data.tags.entries()) {
      test(`tags[${index}]`, 'Tag cannot be empty', () => {
        enforce(tag).isNotEmpty();
      });

      test(`tags[${index}]`, 'Tag must be 2-20 characters', () => {
        enforce(tag).longerThanOrEquals(2).shorterThanOrEquals(20);
      });
    }
  }

  // Inventory (optional)
  omitWhen(data.inventory === undefined, () => {
    test('inventory', 'Inventory must be a non-negative number', () => {
      enforce(data.inventory!).isNumber().greaterThanOrEquals(0);
    });
  });

  // Active status
  test('isActive', 'Active status is required', () => {
    enforce(data.isActive).isBoolean();
  });
});

/**
 * === VALIDATION RESULT TYPES ===
 */
export type ValidationResult = {
  isValid: boolean;
  errors: Record<string, string[]>;
  warnings?: Record<string, string[]>;
};

/**
 * === VALIDATION HELPERS ===
 */

/**
 * Convert Vest suite result to standardized validation result
 */
export function createValidationResult(suiteResult: any): ValidationResult {
  return {
    isValid: suiteResult.isValid(),
    errors: suiteResult.getErrors(),
    warnings: suiteResult.hasWarnings() ? suiteResult.getWarnings() : undefined,
  };
}

/**
 * Validation error class for HTTP responses
 */
export class ValidationError extends Error {
  readonly statusCode = 400;
  readonly errors: Record<string, string[]>;

  constructor(errors: Record<string, string[]>) {
    const errorCount = Object.keys(errors).length;
    super(`Validation failed with ${errorCount} error(s)`);
    this.name = 'ValidationError';
    this.errors = errors;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      errors: this.errors,
    };
  }
}

/**
 * === EXPRESS.JS MIDDLEWARE PATTERNS ===
 */

/**
 * Generic validation middleware factory
 */
export function createValidationMiddleware<T>(
  validationSuite: (data: Partial<T>) => any,
  source: 'body' | 'query' | 'params' = 'body',
) {
  return (request: any, res: any, next: any) => {
    try {
      const data = request[source];
      const result = validationSuite(data);

      if (!result.isValid()) {
        const validationError = new ValidationError(result.getErrors());
        return res.status(400).json(validationError.toJSON());
      }

      // Attach validation result to request for downstream use
      request.validationResult = createValidationResult(result);
      next();
    } catch (error) {
      console.error('Validation middleware error:', error);
      res.status(500).json({
        message: 'Internal server error during validation',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };
}

/**
 * === USAGE EXAMPLES FOR EXPRESS.JS ROUTES ===
 */

/**
 * Example Express.js route implementations
 *
 * These would be used in your actual Express.js server:
 *
 * Example code for Express.js integration:
 *
 * import express from 'express';
 * import {
 *   createValidationMiddleware,
 *   userRegistrationValidationSuite,
 *   userProfileValidationSuite,
 *   productValidationSuite
 * } from './server-side-validation.validations';
 *
 * const app = express();
 * app.use(express.json());
 *
 * // User registration route
 * app.post('/api/users/register',
 *   createValidationMiddleware(userRegistrationValidationSuite),
 *   async (req, res) => {
 *     try {
 *       const userData = req.body;
 *       const user = await createUser(userData);
 *       res.status(201).json({ success: true, user });
 *     } catch (error) {
 *       res.status(500).json({ message: 'Registration failed' });
 *     }
 *   }
 * );
 *
 * // User profile update route
 * app.put('/api/users/:id',
 *   createValidationMiddleware(userProfileValidationSuite),
 *   async (req, res) => {
 *     try {
 *       const userId = req.params.id;
 *       const profileData = req.body;
 *       const user = await updateUser(userId, profileData);
 *       res.json({ success: true, user });
 *     } catch (error) {
 *       res.status(500).json({ message: 'Profile update failed' });
 *     }
 *   }
 * );
 *
 * // Product creation route
 * app.post('/api/products',
 *   createValidationMiddleware(productValidationSuite),
 *   async (req, res) => {
 *     try {
 *       const productData = req.body;
 *       const product = await createProduct(productData);
 *       res.status(201).json({ success: true, product });
 *     } catch (error) {
 *       res.status(500).json({ message: 'Product creation failed' });
 *     }
 *   }
 * );
 */

/**
 * === ADVANCED PATTERNS ===
 */

/**
 * Conditional validation middleware
 *
 * Validates only when certain conditions are met
 */
export function createConditionalValidationMiddleware<T>(
  validationSuite: (data: Partial<T>) => any,
  condition: (request: any) => boolean,
  source: 'body' | 'query' | 'params' = 'body',
) {
  return (request: any, res: any, next: any) => {
    if (!condition(request)) {
      return next(); // Skip validation
    }

    return createValidationMiddleware(validationSuite, source)(
      request,
      res,
      next,
    );
  };
}

/**
 * Multi-step validation middleware
 *
 * Validates different parts of the request in sequence
 */
export function createMultiStepValidationMiddleware<T>(
  validationSteps: {
    suite: (data: Partial<T>) => any;
    source: 'body' | 'query' | 'params';
    name: string;
  }[],
) {
  return (request: any, res: any, next: any) => {
    const allErrors: Record<string, string[]> = {};

    for (const step of validationSteps) {
      const data = request[step.source];
      const result = step.suite(data);

      if (!result.isValid()) {
        const stepErrors = result.getErrors();
        for (const field of Object.keys(stepErrors)) {
          const prefixedField = `${step.name}.${field}`;
          allErrors[prefixedField] = stepErrors[field];
        }
      }
    }

    if (Object.keys(allErrors).length > 0) {
      const validationError = new ValidationError(allErrors);
      return res.status(400).json(validationError.toJSON());
    }

    next();
  };
}

/**
 * === DATABASE INTEGRATION PATTERNS ===
 */

/**
 * Validate before database operations
 */
export async function validateAndCreate<T>(
  data: Partial<T>,
  validationSuite: (data: Partial<T>) => any,
  createFunction: (validData: T) => Promise<T>,
): Promise<T> {
  const result = validationSuite(data);

  if (!result.isValid()) {
    throw new ValidationError(result.getErrors());
  }

  return await createFunction(data as T);
}

export async function validateAndUpdate<T>(
  data: Partial<T>,
  validationSuite: (data: Partial<T>) => any,
  updateFunction: (validData: Partial<T>) => Promise<T>,
): Promise<T> {
  const result = validationSuite(data);

  if (!result.isValid()) {
    throw new ValidationError(result.getErrors());
  }

  return await updateFunction(data);
}

/**
 * === TESTING UTILITIES ===
 */

/**
 * Test validation suite with sample data
 */
export function testValidationSuite<T>(
  validationSuite: (data: Partial<T>) => any,
  testData: Partial<T>,
): ValidationResult {
  const result = validationSuite(testData);
  return createValidationResult(result);
}

/**
 * Generate test data for validation
 */
export const testData = {
  validUserRegistration: {
    username: 'testuser123',
    email: 'test@example.com',
    password: 'SecurePass123',
    confirmPassword: 'SecurePass123',
    firstName: 'John',
    lastName: 'Doe',
    agreeToTerms: true,
  } as UserRegistrationModel,

  invalidUserRegistration: {
    username: 'ab', // too short
    email: 'invalid-email', // invalid format
    password: 'weak', // doesn't meet requirements
    confirmPassword: 'different', // doesn't match
    firstName: '', // empty
    lastName: '', // empty
    agreeToTerms: false, // not agreed
  } as UserRegistrationModel,

  validProduct: {
    name: 'Test Product',
    description: 'This is a test product with a good description',
    price: 29.99,
    category: 'electronics',
    tags: ['test', 'sample', 'demo'],
    isActive: true,
    inventory: 100,
  } as ProductModel,

  invalidProduct: {
    name: 'AB', // too short
    description: 'Short', // too short
    price: -10, // negative price
    category: 'invalid-category', // not in allowed list
    tags: [], // empty array
    isActive: 'true' as any, // should be boolean
    inventory: -5, // negative inventory
  } as ProductModel,
};

/**
 * === EXPORT SUMMARY ===
 *
 * This module provides:
 *
 * 1. **Shared Validation Suites**: Can be used on both client and server
 * 2. **Express.js Middleware**: Easy integration with Express routes
 * 3. **Error Handling**: Standardized error responses and classes
 * 4. **Database Integration**: Validation helpers for DB operations
 * 5. **Testing Utilities**: Tools for testing validation logic
 * 6. **Advanced Patterns**: Conditional and multi-step validation
 *
 * Key benefits of using Vest.js on the server:
 * - ✅ Consistent validation across client/server
 * - ✅ Type-safe validation with TypeScript
 * - ✅ Performance optimized with staticSuite
 * - ✅ Easy error handling and response formatting
 * - ✅ Reusable validation middleware
 * - ✅ Database integration patterns
 * - ✅ Comprehensive testing utilities
 */
