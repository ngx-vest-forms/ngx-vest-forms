/**
 * MSW handlers for ngx-vest-forms E2E tests
 * These handlers mock API responses for form submissions and related operations
 */

type FormSubmissionResponse = {
  success: boolean;
  message: string;
  id?: string;
  data?: unknown;
};

type ValidationResponse = {
  valid: boolean;
  errors: Record<string, string[]>;
};

type EmailCheckResponse = {
  exists: boolean;
  email: string;
};

type ErrorResponse = {
  error: string;
  code: string;
};

export const handlers = [
  // Mock successful form submission
  {
    method: 'POST',
    path: '/api/forms/submit',
    handler: async (request: Request): Promise<Response> => {
      const body = await request.json();

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 100));

      const response: FormSubmissionResponse = {
        success: true,
        message: 'Form submitted successfully',
        id: Date.now().toString(),
        data: body
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  // Mock form validation endpoint
  {
    method: 'POST',
    path: '/api/forms/validate',
    handler: async (request: Request): Promise<Response> => {
      const body = await request.json() as Record<string, unknown>;

      // Simulate server-side validation
      const errors: Record<string, string[]> = {};

      if (!body.email || typeof body.email !== 'string' || !body.email.includes('@')) {
        errors['email'] = ['Please provide a valid email address'];
      }

      if (!body.name || typeof body.name !== 'string' || body.name.length < 2) {
        errors['name'] = ['Name must be at least 2 characters long'];
      }

      // Cross-field validation example
      if (body.password && body.confirmPassword && body.password !== body.confirmPassword) {
        errors['_root'] = ['Passwords do not match'];
      }

      const isValid = Object.keys(errors).length === 0;

      const response: ValidationResponse = {
        valid: isValid,
        errors: isValid ? {} : errors
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  // Mock user lookup for dynamic validation
  {
    method: 'GET',
    path: '/api/users/check-email',
    handler: (request: Request): Response => {
      const url = new URL(request.url);
      const email = url.searchParams.get('email') || '';
      const existingEmails = ['admin@example.com', 'test@test.com'];

      const response: EmailCheckResponse = {
        exists: existingEmails.includes(email),
        email
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  // Mock error response for testing error handling
  {
    method: 'POST',
    path: '/api/forms/submit-error',
    handler: (): Response => {
      const response: ErrorResponse = {
        error: 'Server error occurred',
        code: 'INTERNAL_SERVER_ERROR'
      };

      return new Response(JSON.stringify(response), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  // Mock slow response for testing loading states
  {
    method: 'POST',
    path: '/api/forms/submit-slow',
    handler: async (request: Request): Promise<Response> => {
      const body = await request.json();

      // Simulate slow response
      await new Promise(resolve => setTimeout(resolve, 2000));

      const response: FormSubmissionResponse = {
        success: true,
        message: 'Slow form submitted successfully',
        data: body
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
];
