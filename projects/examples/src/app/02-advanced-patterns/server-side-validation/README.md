# Server-Side Validation with Vest.js and ngx-vest-forms

This example demonstrates how to use the same Vest.js validation suites on both the client-side (Angular) and server-side (Node.js/Express.js) for consistent validation across your entire application.

## 📋 Files Overview

- `server-side-validation.validations.ts` - Shared validation suites that work on both client and server
- `server-side-validation.component.ts` - Angular component demonstrating client-side validation
- `server-example.ts` - Complete Express.js server implementation (reference only)

## 🎯 Key Features

### Frontend Benefits
- ✅ Pre-validation before API calls reduces server load
- ✅ Instant user feedback improves UX
- ✅ Type-safe validation results with TypeScript
- ✅ Consistent error messages across UI and API

### Backend Benefits
- ✅ Same validation rules as frontend (DRY principle)
- ✅ Stateless validation with `staticSuite` for server environments
- ✅ Easy Express.js middleware integration
- ✅ Database validation patterns included

## 🚀 Implementation Guide

### 1. Shared Validation Suite

Create validation suites that work on both client and server:

```typescript
// shared/validation.ts
import { staticSuite, test, enforce } from 'vest';

export const userValidationSuite = staticSuite((data = {}) => {
  test('email', 'Email is required', () => {
    enforce(data.email).isNotEmpty();
  });

  test('email', 'Email format is invalid', () => {
    enforce(data.email).matches(/^[^@]+@[^@]+\\.[^@]+$/);
  });
});
```

### 2. Angular Component (Client-Side)

```typescript
// user-form.component.ts
import { Component, signal } from '@angular/core';
import { ngxVestForms } from 'ngx-vest-forms/core';
import { userValidationSuite } from './shared/validation';

@Component({
  imports: [ngxVestForms],
  template: \`
    <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
      <input name="email" [ngModel]="model().email" />
      <button type="submit">Submit</button>
    </form>
  \`
})
export class UserFormComponent {
  protected readonly model = signal({ email: '' });
  protected readonly suite = userValidationSuite;
}
```

### 3. Express.js Server (Server-Side)

```typescript
// server.ts
import express from 'express';
import { createValidationMiddleware, userValidationSuite } from './shared/validation';

const app = express();

app.post('/api/users',
  createValidationMiddleware(userValidationSuite),
  (req, res) => {
    // Validation passed, create user
    const userData = req.body;
    res.json({ success: true, user: userData });
  }
);
```
## 🛠 Validation Middleware

The shared validation file includes Express.js middleware factory:

```typescript
export function createValidationMiddleware<T>(
  validationSuite: (data: Partial<T>) => any,
  source: 'body' | 'query' | 'params' = 'body'
) {
  return (req: any, res: any, next: any) => {
    const data = req[source];
    const result = validationSuite(data);

    if (!result.isValid()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: result.getErrors()
      });
    }

    next();
  };
}
```
## 📊 Error Response Format

Both client and server return consistent error formats:

```json
{
  "success": false,
  "message": "Validation failed with 2 error(s)",
  "errors": {
    "email": ["Email is required", "Email format is invalid"],
    "password": ["Password must be at least 8 characters"]
  }
}
```

## 🧪 Testing Validation

The component includes test scenarios to demonstrate validation:

### User Registration Tests
- Username: "ab" (too short)
- Email: "invalid-email" (bad format)
- Password: "weak" (doesn't meet requirements)
- Confirm Password: "different" (doesn't match)

### Product Creation Tests
- Name: "AB" (too short)
- Price: -10 (negative value)
- Price: 15000 (exceeds $10,000 limit)
- Category: invalid selection
- Tags: empty array or more than 10 tags

## 🔧 Advanced Patterns

### Database Integration

```typescript
import { validateAndCreate, ValidationError } from './validation';

export async function createUser(userData: UserData) {
  try {
    return await validateAndCreate(
      userData,
      userValidationSuite,
      async (validData) => {
        // Database operation
        return await db.users.create(validData);
      }
    );
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error; // Let middleware handle validation errors
    }
    throw new Error('Database error occurred');
  }
}
```

### Multi-Step Validation

```typescript
app.post('/api/complex-form',
  createMultiStepValidationMiddleware([
    { suite: userValidationSuite, source: 'body', name: 'user' },
    { suite: addressValidationSuite, source: 'body', name: 'address' }
  ]),
  handleComplexForm
);
```

### Conditional Validation

```typescript
app.put('/api/profile/:id',
  createConditionalValidationMiddleware(
    profileValidationSuite,
    (req) => req.user.id === req.params.id // Only validate if updating own profile
  ),
  updateProfile
);
```

## 🎯 Benefits Summary

1. **Consistency**: Same validation rules across frontend and backend
2. **Type Safety**: Shared TypeScript models and validation
3. **Performance**: Client-side pre-validation reduces server load
4. **Security**: Server-side validation prevents malicious bypass attempts
5. **Maintainability**: Single source of truth for business rules
6. **Developer Experience**: Consistent error handling patterns
7. **Scalability**: Easy to add new validation rules across the stack

## 📝 Best Practices

1. **Always validate on both client and server**
2. **Use `staticSuite` for server-side (stateless) validation**
3. **Share validation logic between frontend and backend**
4. **Provide meaningful error messages for users**
5. **Use TypeScript for type safety across the stack**
6. **Handle validation errors consistently**
7. **Test validation rules with edge cases**
8. **Log validation failures for monitoring**

## 🚦 Production Considerations

- Add rate limiting to prevent validation DOS attacks
- Use proper logging and monitoring for validation failures
- Implement proper error sanitization for production
- Add validation caching for frequently validated data
- Consider validation performance with large datasets
- Implement proper authentication and authorization
- Use environment-specific validation rules when needed

This example provides a complete foundation for implementing shared validation between Angular frontend and Node.js backend using Vest.js and ngx-vest-forms.
