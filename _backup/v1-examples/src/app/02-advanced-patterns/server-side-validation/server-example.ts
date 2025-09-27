/**
 * Express.js Server Example with Vest.js Validation
 *
 * This file demonstrates how to use the shared validation suites
 * in an Express.js server environment. This is a complete working
 * example that could be used as a starting point for a real API server.
 *
 * 🚀 To run this server:
 *
 * 1. Install dependencies:
 *    npm install express cors helmet morgan
 *    npm install -D @types/express @types/cors @types/morgan
 *
 * 2. Install Vest.js:
 *    npm install vest
 *
 * 3. Run the server:
 *    npx ts-node server-example.ts
 *
 * 📋 Features:
 * - Express.js middleware for Vest.js validation
 * - CORS support for frontend integration
 * - Error handling and logging
 * - Database simulation patterns
 * - RESTful API design
 * - Security headers with Helmet
 * - Request logging with Morgan
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import {
  createValidationMiddleware,
  createMultiStepValidationMiddleware,
  ValidationError,
  validateAndCreate,
  validateAndUpdate,
  userRegistrationValidationSuite,
  userProfileValidationSuite,
  productValidationSuite,
  type UserRegistrationModel,
  type UserProfileModel,
  type ProductModel
} from './server-side-validation.validations';

/**
 * === EXPRESS.JS SERVER SETUP ===
 */

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration for frontend integration
app.use(cors({
  origin: ['http://localhost:4200', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(morgan('combined'));

/**
 * === DATABASE SIMULATION ===
 *
 * In a real application, replace these with actual database operations
 * using MongoDB, PostgreSQL, MySQL, etc.
 */

// In-memory database simulation
const database = {
  users: new Map<string, UserRegistrationModel & { id: string }>(),
  profiles: new Map<string, UserProfileModel>(),
  products: new Map<string, ProductModel & { id: string }>()
};

// Database helper functions
const databaseHelpers = {
  async findUserByUsername(username: string) {
    return [...database.users.values()]
      .find(user => user.username === username);
  },

  async findUserByEmail(email: string) {
    return [...database.users.values()]
      .find(user => user.email === email);
  },

  async createUser(userData: UserRegistrationModel) {
    const id = Math.random().toString(36).slice(2, 11);
    const user = { ...userData, id };
    database.users.set(id, user);
    return user;
  },

  async updateProfile(userId: string, profileData: Partial<UserProfileModel>) {
    const existingProfile = database.profiles.get(userId);
    const updatedProfile = { ...existingProfile, ...profileData, id: userId };
    database.profiles.set(userId, updatedProfile as UserProfileModel);
    return updatedProfile;
  },

  async createProduct(productData: ProductModel) {
    const id = Math.random().toString(36).slice(2, 11);
    const product = { ...productData, id };
    database.products.set(id, product);
    return product;
  },

  async findProducts(filters: Partial<ProductModel> = {}) {
    return [...database.products.values()]
      .filter(product => {
        return Object.entries(filters).every(([key, value]) =>
          product[key as keyof ProductModel] === value
        );
      });
  }
};

/**
 * === ERROR HANDLING MIDDLEWARE ===
 */

// Global error handler
app.use((error: Error, request: Request, res: Response, next: NextFunction) => {
  console.error('Error occurred:', error);

  if (error instanceof ValidationError) {
    return res.status(error.statusCode).json(error.toJSON());
  }

  if (error.name === 'SyntaxError') {
    return res.status(400).json({
      message: 'Invalid JSON in request body',
      error: 'Bad Request'
    });
  }

  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

/**
 * === HEALTH CHECK ENDPOINT ===
 */

app.get('/health', (request: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * === USER MANAGEMENT ROUTES ===
 */

/**
 * POST /api/users/register
 *
 * User registration with comprehensive validation
 */
app.post('/api/users/register',
  createValidationMiddleware(userRegistrationValidationSuite),
  async (request: Request, res: Response, next: NextFunction) => {
    try {
      const userData: UserRegistrationModel = request.body;

      // Check for existing username
      const existingUsername = await databaseHelpers.findUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(409).json({
          message: 'Username already exists',
          errors: {
            username: ['This username is already taken']
          }
        });
      }

      // Check for existing email
      const existingEmail = await databaseHelpers.findUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(409).json({
          message: 'Email already registered',
          errors: {
            email: ['This email is already registered']
          }
        });
      }

      // Create user using validation helper
      const newUser = await validateAndCreate(
        userData,
        userRegistrationValidationSuite,
        databaseHelpers.createUser
      );

      // Remove sensitive data from response
      const { password, confirmPassword, ...safeUser } = newUser;

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: safeUser
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/users/:id/profile
 *
 * Update user profile with validation
 */
app.put('/api/users/:id/profile',
  createValidationMiddleware(userProfileValidationSuite),
  async (request: Request, res: Response, next: NextFunction) => {
    try {
      const userId = request.params.id;
      const profileData: Partial<UserProfileModel> = {
        ...request.body,
        id: userId
      };

      // Validate profile data including ID
      const updatedProfile = await validateAndUpdate(
        profileData,
        userProfileValidationSuite,
        (data) => databaseHelpers.updateProfile(userId, data)
      );

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedProfile
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/users
 *
 * List all users (for demo purposes)
 */
app.get('/api/users', (request: Request, res: Response) => {
  const users = [...database.users.values()].map(user => {
    const { password, confirmPassword, ...safeUser } = user;
    return safeUser;
  });

  res.json({
    success: true,
    data: users,
    count: users.length
  });
});

/**
 * === PRODUCT MANAGEMENT ROUTES ===
 */

/**
 * POST /api/products
 *
 * Create product with comprehensive validation
 */
app.post('/api/products',
  createValidationMiddleware(productValidationSuite),
  async (request: Request, res: Response, next: NextFunction) => {
    try {
      const productData: ProductModel = request.body;

      const newProduct = await validateAndCreate(
        productData,
        productValidationSuite,
        databaseHelpers.createProduct
      );

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: newProduct
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/products
 *
 * List products with optional filtering
 */
app.get('/api/products', async (request: Request, res: Response, next: NextFunction) => {
  try {
    const filters: Partial<ProductModel> = {};

    // Apply filters from query parameters
    if (request.query.category) {
      filters.category = request.query.category as string;
    }
    if (request.query.isActive !== undefined) {
      filters.isActive = request.query.isActive === 'true';
    }

    const products = await databaseHelpers.findProducts(filters);

    res.json({
      success: true,
      data: products,
      count: products.length,
      filters
    });

  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/products/:id
 *
 * Update product with validation
 */
app.put('/api/products/:id',
  createValidationMiddleware(productValidationSuite),
  async (request: Request, res: Response, next: NextFunction) => {
    try {
      const productId = request.params.id;
      const productData: ProductModel = { ...request.body, id: productId };

      const existingProduct = database.products.get(productId);
      if (!existingProduct) {
        return res.status(404).json({
          message: 'Product not found'
        });
      }

      const updatedProduct = await validateAndUpdate(
        productData,
        productValidationSuite,
        async (data) => {
          database.products.set(productId, data as ProductModel & { id: string });
          return database.products.get(productId)!;
        }
      );

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: updatedProduct
      });

    } catch (error) {
      next(error);
    }
  }
);

/**
 * === ADVANCED VALIDATION EXAMPLES ===
 */

/**
 * POST /api/advanced/multi-step-validation
 *
 * Demonstrates multi-step validation middleware
 */
app.post('/api/advanced/multi-step-validation',
  createMultiStepValidationMiddleware([
    {
      suite: userRegistrationValidationSuite,
      source: 'body',
      name: 'user'
    },
    {
      suite: productValidationSuite,
      source: 'body',
      name: 'product'
    }
  ]),
  (request: Request, res: Response) => {
    res.json({
      success: true,
      message: 'Multi-step validation passed',
      data: {
        user: request.body.user,
        product: request.body.product
      }
    });
  }
);

/**
 * === VALIDATION TESTING ENDPOINTS ===
 */

/**
 * POST /api/test/validate-user
 *
 * Test user validation without creating a user
 */
app.post('/api/test/validate-user', (request: Request, res: Response) => {
  const result = userRegistrationValidationSuite(request.body);

  res.json({
    valid: result.isValid(),
    errors: result.getErrors(),
    warnings: result.hasWarnings() ? result.getWarnings() : undefined
  });
});

/**
 * POST /api/test/validate-product
 *
 * Test product validation without creating a product
 */
app.post('/api/test/validate-product', (request: Request, res: Response) => {
  const result = productValidationSuite(request.body);

  res.json({
    valid: result.isValid(),
    errors: result.getErrors(),
    warnings: result.hasWarnings() ? result.getWarnings() : undefined
  });
});

/**
 * === SERVER STARTUP ===
 */

// 404 handler for unknown routes
app.use('*', (request: Request, res: Response) => {
  res.status(404).json({
    message: 'Route not found',
    path: request.originalUrl,
    method: request.method
  });
});

// Start the server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log('📁 Available routes:');
  console.log('  POST /api/users/register');
  console.log('  PUT  /api/users/:id/profile');
  console.log('  GET  /api/users');
  console.log('  POST /api/products');
  console.log('  GET  /api/products');
  console.log('  PUT  /api/products/:id');
  console.log('  POST /api/test/validate-user');
  console.log('  POST /api/test/validate-product');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('🔚 Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('📴 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('🔚 Process terminated');
  });
});

export default app;

/**
 * === USAGE EXAMPLES ===
 *
 * 1. Register a user:
 * ```bash
 * curl -X POST http://localhost:3000/api/users/register \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "username": "johndoe",
 *     "email": "john@example.com",
 *     "password": "SecurePass123",
 *     "confirmPassword": "SecurePass123",
 *     "firstName": "John",
 *     "lastName": "Doe",
 *     "agreeToTerms": true
 *   }'
 * ```
 *
 * 2. Create a product:
 * ```bash
 * curl -X POST http://localhost:3000/api/products \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "name": "Amazing Product",
 *     "description": "This is an amazing product with great features",
 *     "price": 29.99,
 *     "category": "electronics",
 *     "tags": ["tech", "gadget", "awesome"],
 *     "isActive": true,
 *     "inventory": 100
 *   }'
 * ```
 *
 * 3. Test validation only:
 * ```bash
 * curl -X POST http://localhost:3000/api/test/validate-user \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "username": "ab",
 *     "email": "invalid-email"
 *   }'
 * ```
 */
