import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgxControlWrapper } from 'ngx-vest-forms/control-wrapper';
import { ngxVestForms } from 'ngx-vest-forms/core';
import { enforce, omitWhen, only, staticSuite, test } from 'vest';
import { CardComponent, ExampleCardsComponent } from '../../ui';
import { SERVER_SIDE_VALIDATION_CONTENT } from './server-side-validation.content';

type UserRegistrationModel = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  agreeToTerms: boolean;
};

type ProductModel = {
  name: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  isActive: boolean;
  inventory?: number;
};

type ValidationResult = {
  isValid: boolean;
  errors: Record<string, string[]>;
  warnings?: Record<string, string[]>;
};

// Simple validation suites compatible with ngx-vest-forms
const userValidationSuite = staticSuite(
  (data: Partial<UserRegistrationModel> = {}, field?: string) => {
    only(field);

    test('username', 'Username is required', () => {
      enforce(data.username).isNotEmpty();
    });

    test('username', 'Username must be 3-20 characters', () => {
      enforce(data.username).longerThanOrEquals(3).shorterThanOrEquals(20);
    });

    test('email', 'Email is required', () => {
      enforce(data.email).isNotEmpty();
    });

    test('email', 'Email format is invalid', () => {
      enforce(data.email).matches(/^[^@]+@[^@]+\.[^@]+$/);
    });

    test('password', 'Password is required', () => {
      enforce(data.password).isNotEmpty();
    });

    test('password', 'Password must be at least 8 characters', () => {
      enforce(data.password).longerThanOrEquals(8);
    });

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

    test('firstName', 'First name is required', () => {
      enforce(data.firstName).isNotEmpty();
    });

    test('lastName', 'Last name is required', () => {
      enforce(data.lastName).isNotEmpty();
    });

    test('agreeToTerms', 'You must agree to the terms and conditions', () => {
      enforce(data.agreeToTerms).isTruthy();
    });
  },
);

const productValidationSuite = staticSuite(
  (data: Partial<ProductModel> = {}, field?: string) => {
    only(field);

    test('name', 'Product name is required', () => {
      enforce(data.name).isNotEmpty();
    });

    test('name', 'Product name must be 3-100 characters', () => {
      enforce(data.name).longerThanOrEquals(3).shorterThanOrEquals(100);
    });

    test('description', 'Product description is required', () => {
      enforce(data.description).isNotEmpty();
    });

    test('description', 'Description must be 10-1000 characters', () => {
      enforce(data.description)
        .longerThanOrEquals(10)
        .shorterThanOrEquals(1000);
    });

    test('price', 'Price is required', () => {
      enforce(data.price).isNumber();
    });

    test('price', 'Price must be greater than 0', () => {
      enforce(data.price).greaterThan(0);
    });

    test('category', 'Category is required', () => {
      enforce(data.category).isNotEmpty();
    });

    omitWhen(data.inventory === undefined, () => {
      test('inventory', 'Inventory must be a positive number', () => {
        enforce(data.inventory).isNumber().greaterThanOrEquals(0);
      });
    });
  },
);

type VestSuiteLikeResult = {
  isValid(): boolean;
  getErrors(): Record<string, string[]>;
  hasWarnings(): boolean;
  getWarnings(): Record<string, string[]>;
};

function createValidationResult(
  suiteResult: VestSuiteLikeResult,
): ValidationResult {
  return {
    isValid: suiteResult.isValid(),
    errors: suiteResult.getErrors(),
    warnings: suiteResult.hasWarnings() ? suiteResult.getWarnings() : undefined,
  };
}

/**
 * Server-Side Validation Demo Component
 *
 * This component demonstrates how to use the same Vest.js validation suites
 * on both the client-side (Angular) and server-side (Node.js/Express).
 *
 * 🎯 Key Demonstrations:
 * - Shared validation logic between frontend and backend
 * - Client-side pre-validation before API calls
 * - Server response validation and error handling
 * - Type-safe validation with shared models
 * - Real-world API integration patterns
 *
 * 📋 Features Shown:
 * - User registration form with comprehensive validation
 * - Product creation form with business rules
 * - Error handling and user feedback
 * - Loading states and async validation
 * - Validation result visualization
 */
@Component({
  selector: 'ngx-server-side-validation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ngxVestForms,
    NgxControlWrapper,
    ExampleCardsComponent,
    CardComponent,
  ],
  template: `
    <!-- Server-Side Validation Example with Educational Structure -->
    <ngx-example-cards
      [demonstrated]="content.demonstrated"
      [learning]="content.learning"
    >
      <div class="grid gap-6 lg:grid-cols-2">
        <!-- User Registration Form -->
        <ngx-card variant="primary-outline">
          <div card-header>
            <h3 class="text-lg font-semibold text-gray-900">
              👤 User Registration
            </h3>
            <p class="text-sm text-gray-600">
              Complete user registration with password complexity, email
              validation, and terms agreement verification.
            </p>
          </div>

          <form
            ngxVestForm
            [vestSuite]="userValidationSuite"
            [(formValue)]="userData"
            #userForm="ngxVestForm"
            (ngSubmit)="submitUserRegistration()"
            class="space-y-4"
            novalidate
          >
            <!-- Username -->
            <ngx-control-wrapper>
              <label for="username">Username *</label>
              <input
                id="username"
                name="username"
                type="text"
                [ngModel]="userData().username"
                placeholder="Enter username"
              />
            </ngx-control-wrapper>

            <!-- Email -->
            <ngx-control-wrapper>
              <label for="email">Email Address *</label>
              <input
                id="email"
                name="email"
                type="email"
                [ngModel]="userData().email"
                placeholder="Enter email address"
              />
            </ngx-control-wrapper>

            <!-- Password -->
            <ngx-control-wrapper>
              <label for="password">Password *</label>
              <input
                id="password"
                name="password"
                type="password"
                [ngModel]="userData().password"
                placeholder="Enter password"
              />
            </ngx-control-wrapper>

            <!-- Confirm Password -->
            <ngx-control-wrapper>
              <label for="confirmPassword">Confirm Password *</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                [ngModel]="userData().confirmPassword"
                placeholder="Confirm password"
              />
            </ngx-control-wrapper>

            <!-- First Name -->
            <ngx-control-wrapper>
              <label for="firstName">First Name *</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                [ngModel]="userData().firstName"
                placeholder="Enter first name"
              />
            </ngx-control-wrapper>

            <!-- Last Name -->
            <ngx-control-wrapper>
              <label for="lastName">Last Name *</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                [ngModel]="userData().lastName"
                placeholder="Enter last name"
              />
            </ngx-control-wrapper>

            <!-- Date of Birth -->
            <ngx-control-wrapper>
              <label for="dateOfBirth">Date of Birth (Optional)</label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                [ngModel]="userData().dateOfBirth"
              />
            </ngx-control-wrapper>

            <!-- Terms Agreement -->
            <ngx-control-wrapper>
              <label class="flex items-center space-x-2">
                <input
                  name="agreeToTerms"
                  type="checkbox"
                  [ngModel]="userData().agreeToTerms"
                  class="form-checkbox"
                />
                <span>I agree to the terms and conditions *</span>
              </label>
            </ngx-control-wrapper>

            <!-- Submit Button -->
            <button
              type="submit"
              [disabled]="!userForm.formState().valid || userApiLoading()"
              class="btn-primary w-full"
            >
              @if (userApiLoading()) {
                Registering...
              } @else {
                Register User
              }
            </button>

            @if (userApiError()) {
              <div class="form-error" role="alert">
                {{ userApiError() }}
              </div>
            }

            @if (userApiSuccess()) {
              <div
                class="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800"
              >
                ✅ User registered successfully!
              </div>
            }
          </form>
        </ngx-card>

        <!-- Product Creation Form -->
        <ngx-card variant="primary-outline">
          <div card-header>
            <h3 class="text-lg font-semibold text-gray-900">
              📦 Product Creation
            </h3>
            <p class="text-sm text-gray-600">
              Create a new product with business validation rules and category
              restrictions.
            </p>
          </div>

          <form
            ngxVestForm
            [vestSuite]="productValidationSuite"
            [(formValue)]="productData"
            #productForm="ngxVestForm"
            (ngSubmit)="submitProductCreation()"
            class="space-y-4"
            novalidate
          >
            <!-- Product Name -->
            <ngx-control-wrapper>
              <label for="productName">Product Name *</label>
              <input
                id="productName"
                name="name"
                type="text"
                [ngModel]="productData().name"
                placeholder="Enter product name"
              />
            </ngx-control-wrapper>

            <!-- Description -->
            <ngx-control-wrapper>
              <label for="description">Description *</label>
              <textarea
                id="description"
                name="description"
                [ngModel]="productData().description"
                placeholder="Enter product description"
                rows="3"
                class="form-input"
              ></textarea>
            </ngx-control-wrapper>

            <!-- Price -->
            <ngx-control-wrapper>
              <label for="price">Price *</label>
              <input
                id="price"
                name="price"
                type="number"
                step="0.01"
                [ngModel]="productData().price"
                placeholder="0.00"
              />
            </ngx-control-wrapper>

            <!-- Category -->
            <ngx-control-wrapper>
              <label for="category">Category *</label>
              <select
                id="category"
                name="category"
                [ngModel]="productData().category"
                class="form-input"
              >
                <option value="">Select category</option>
                <option value="electronics">Electronics</option>
                <option value="clothing">Clothing</option>
                <option value="books">Books</option>
                <option value="home">Home & Garden</option>
                <option value="sports">Sports</option>
              </select>
            </ngx-control-wrapper>

            <!-- Inventory -->
            <ngx-control-wrapper>
              <label for="inventory">Inventory *</label>
              <input
                id="inventory"
                name="inventory"
                type="number"
                [ngModel]="productData().inventory"
                placeholder="Enter inventory quantity"
              />
            </ngx-control-wrapper>

            <!-- Submit Button -->
            <button
              type="submit"
              [disabled]="!productForm.formState().valid || productApiLoading()"
              class="btn-primary w-full"
            >
              @if (productApiLoading()) {
                Creating...
              } @else {
                Create Product
              }
            </button>

            @if (productApiError()) {
              <div class="form-error" role="alert">
                {{ productApiError() }}
              </div>
            }

            @if (productApiSuccess()) {
              <div
                class="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800"
              >
                ✅ Product created successfully!
              </div>
            }
          </form>
        </ngx-card>
      </div>

      <!-- Validation Results Demonstration -->
      <ngx-card>
        <div card-header>
          <h3 class="text-lg font-semibold text-gray-900">
            🔍 Client vs Server Validation Results
          </h3>
          <p class="text-sm text-gray-600">
            Compare validation results between client-side and server-side
            validation
          </p>
        </div>

        <div class="grid gap-6 md:grid-cols-2">
          <!-- Client-Side Results -->
          <div>
            <h4 class="mb-3 font-medium text-gray-900">
              Client-Side Validation:
            </h4>
            <div class="space-y-3">
              <div class="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <h5 class="mb-2 font-medium text-blue-900">
                  User Registration:
                </h5>
                <div class="text-sm text-blue-800">
                  Valid: {{ userValidationResult().isValid ? 'Yes' : 'No'
                  }}<br />
                  Errors: {{ userErrorCount() }}<br />
                  Fields: {{ userFieldCount() }}
                </div>
              </div>

              <div class="rounded-lg border border-green-200 bg-green-50 p-3">
                <h5 class="mb-2 font-medium text-green-900">
                  Product Creation:
                </h5>
                <div class="text-sm text-green-800">
                  Valid: {{ productValidationResult().isValid ? 'Yes' : 'No'
                  }}<br />
                  Errors: {{ productErrorCount() }}<br />
                  Fields: {{ productFieldCount() }}
                </div>
              </div>
            </div>
          </div>

          <!-- Server-Side Simulation -->
          <div>
            <h4 class="mb-3 font-medium text-gray-900">
              Server-Side Simulation:
            </h4>
            <div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h5 class="mb-2 font-medium text-gray-900">
                API Integration Status:
              </h5>
              <div class="space-y-1 text-sm text-gray-700">
                <div>User API: {{ userApiStatus() }}</div>
                <div>Product API: {{ productApiStatus() }}</div>
                <div class="mt-3 rounded bg-yellow-100 p-2 text-yellow-800">
                  💡 In a real application, these would be actual API calls to
                  your backend running the same Vest.js validation suites for
                  consistent validation.
                </div>
              </div>
            </div>
          </div>
        </div>
      </ngx-card>
    </ngx-example-cards>
  `,
  styles: [
    `
      /* Minimal styling for server-side validation demo */
    `,
  ],
})
export class ServerSideValidationComponent {
  protected readonly content = SERVER_SIDE_VALIDATION_CONTENT;

  private readonly http = inject(HttpClient);

  // User registration data
  protected readonly userData = signal<UserRegistrationModel>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    agreeToTerms: false,
  });

  // Product creation data
  protected readonly productData = signal<ProductModel>({
    name: '',
    description: '',
    price: 0,
    category: '',
    tags: [],
    isActive: true,
    inventory: 0,
  });

  // API loading states
  protected readonly userApiLoading = signal(false);
  protected readonly productApiLoading = signal(false);

  // API error states
  protected readonly userApiError = signal<string | null>(null);
  protected readonly productApiError = signal<string | null>(null);

  // API success states
  protected readonly userApiSuccess = signal(false);
  protected readonly productApiSuccess = signal(false);

  // Validation suites
  protected readonly userValidationSuite = userValidationSuite;
  protected readonly productValidationSuite = productValidationSuite;

  // Computed validation results
  protected readonly userValidationResult = computed(() => {
    const result = this.userValidationSuite(this.userData());
    return createValidationResult(result);
  });

  protected readonly productValidationResult = computed(() => {
    const result = this.productValidationSuite(this.productData());
    return createValidationResult(result);
  });

  // API status computed properties
  protected readonly userApiStatus = computed(() => {
    if (this.userApiLoading()) return 'Loading...';
    if (this.userApiError()) return 'Error';
    if (this.userApiSuccess()) return 'Success';
    return 'Ready';
  });

  protected readonly productApiStatus = computed(() => {
    if (this.productApiLoading()) return 'Loading...';
    if (this.productApiError()) return 'Error';
    if (this.productApiSuccess()) return 'Success';
    return 'Ready';
  });

  // Helper computed properties for template
  protected readonly userErrorCount = computed(
    () => Object.keys(this.userValidationResult().errors).length,
  );
  protected readonly productErrorCount = computed(
    () => Object.keys(this.productValidationResult().errors).length,
  );
  protected readonly userFieldCount = computed(
    () => Object.keys(this.userData()).length,
  );
  protected readonly productFieldCount = computed(
    () => Object.keys(this.productData()).length,
  );

  /**
   * Simulates user registration API call
   */
  protected async submitUserRegistration(): Promise<void> {
    this.userApiLoading.set(true);
    this.userApiError.set(null);
    this.userApiSuccess.set(false);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simulate validation on server
      const serverResult = this.userValidationSuite(this.userData());

      if (!serverResult.isValid()) {
        // Simulate server validation error
        this.userApiError.set(
          'Server validation failed: ' +
            Object.values(serverResult.getErrors()).flat().join(', '),
        );
        return;
      }

      // Simulate random server error (10% chance)
      if (Math.random() < 0.1) {
        this.userApiError.set('Server error: Username already exists');
        return;
      }

      this.userApiSuccess.set(true);
      console.log('User registration successful:', this.userData());
    } catch (error: unknown) {
      this.userApiError.set('Network error occurred');
      console.error('User registration error:', error);
    } finally {
      this.userApiLoading.set(false);
    }
  }

  /**
   * Simulates product creation API call
   */
  protected async submitProductCreation(): Promise<void> {
    this.productApiLoading.set(true);
    this.productApiError.set(null);
    this.productApiSuccess.set(false);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simulate validation on server
      const serverResult = this.productValidationSuite(this.productData());

      if (!serverResult.isValid()) {
        // Simulate server validation error
        this.productApiError.set(
          'Server validation failed: ' +
            Object.values(serverResult.getErrors()).flat().join(', '),
        );
        return;
      }

      // Simulate random server error (5% chance)
      if (Math.random() < 0.05) {
        this.productApiError.set('Server error: Product name already exists');
        return;
      }

      this.productApiSuccess.set(true);
      console.log('Product creation successful:', this.productData());
    } catch (error: unknown) {
      this.productApiError.set('Network error occurred');
      console.error('Product creation error:', error);
    } finally {
      this.productApiLoading.set(false);
    }
  }
}
