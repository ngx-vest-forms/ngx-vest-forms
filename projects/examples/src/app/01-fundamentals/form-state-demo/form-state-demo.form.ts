import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { createVestForm } from 'ngx-vest-forms/core';

// Simple form model for demo
export type FormStateDemoModel = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

// Simple validation suite for demo
import { enforce, only, staticSuite, test } from 'vest';

export const formStateDemoSuite = staticSuite(
  (data: Partial<FormStateDemoModel> = {}, field?: string) => {
    if (field) only(field);

    test('username', 'Username is required', () => {
      enforce(data.username).isNotEmpty();
    });

    test('username', 'Username must be at least 3 characters', () => {
      enforce(data.username).longerThanOrEquals(3);
    });

    test('email', 'Email is required', () => {
      enforce(data.email).isNotEmpty();
    });

    test('email', 'Email format is invalid', () => {
      enforce(data.email).matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    test('password', 'Password is required', () => {
      enforce(data.password).isNotEmpty();
    });

    test('password', 'Password must be at least 8 characters', () => {
      enforce(data.password).longerThanOrEquals(8);
    });

    test('confirmPassword', 'Please confirm your password', () => {
      enforce(data.confirmPassword).isNotEmpty();
    });

    test('confirmPassword', 'Passwords must match', () => {
      enforce(data.confirmPassword).equals(data.password);
    });
  },
);

/**
 * Form State Demo Component using Vest.js-first approach
 *
 * Demonstrates comprehensive form state management with Enhanced Field Signals API.
 * Shows real-time form state monitoring and interactive state visualization.
 */
@Component({
  selector: 'ngx-form-state-demo-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <!-- Form Section -->
      <div class="min-w-0">
        <form
          (ngSubmit)="onSubmit()"
          class="form-container"
          aria-labelledby="formStateDemoHeading"
        >
          <!-- Username Field -->
          <div class="form-field">
            <label class="form-label" for="username">Username *</label>
            <input
              id="username"
              class="form-input"
              type="text"
              [value]="form.username()"
              (input)="form.setUsername($event)"
              placeholder="Enter username (min 3 chars)"
              [attr.aria-invalid]="
                form.usernameShowErrors() && !form.usernameValid()
              "
              [attr.aria-describedby]="
                form.usernameShowErrors() ? 'username-error' : null
              "
            />
            @if (form.usernameShowErrors() && form.usernameErrors().length) {
              <div class="form-error" id="username-error" role="alert">
                {{ form.usernameErrors()[0] }}
              </div>
            }
          </div>

          <!-- Email Field -->
          <div class="form-field">
            <label class="form-label" for="email">Email Address *</label>
            <input
              id="email"
              class="form-input"
              type="email"
              [value]="form.email()"
              (input)="form.setEmail($event)"
              placeholder="your@email.com"
              [attr.aria-invalid]="form.emailShowErrors() && !form.emailValid()"
              [attr.aria-describedby]="
                form.emailShowErrors() ? 'email-error' : null
              "
            />
            @if (form.emailShowErrors() && form.emailErrors().length) {
              <div class="form-error" id="email-error" role="alert">
                {{ form.emailErrors()[0] }}
              </div>
            }
          </div>

          <!-- Password Field -->
          <div class="form-field">
            <label class="form-label" for="password">Password *</label>
            <input
              id="password"
              class="form-input"
              type="password"
              [value]="form.password()"
              (input)="form.setPassword($event)"
              placeholder="Enter password (min 8 chars)"
              [attr.aria-invalid]="
                form.passwordShowErrors() && !form.passwordValid()
              "
              [attr.aria-describedby]="
                form.passwordShowErrors() ? 'password-error' : null
              "
            />
            @if (form.passwordShowErrors() && form.passwordErrors().length) {
              <div class="form-error" id="password-error" role="alert">
                {{ form.passwordErrors()[0] }}
              </div>
            }
          </div>

          <!-- Confirm Password Field -->
          <div class="form-field">
            <label class="form-label" for="confirmPassword"
              >Confirm Password *</label
            >
            <input
              id="confirmPassword"
              class="form-input"
              type="password"
              [value]="form.confirmPassword()"
              (input)="form.setConfirmPassword($event)"
              placeholder="Confirm your password"
              [attr.aria-invalid]="
                form.confirmPasswordShowErrors() && !form.confirmPasswordValid()
              "
              [attr.aria-describedby]="
                form.confirmPasswordShowErrors()
                  ? 'confirmPassword-error'
                  : null
              "
            />
            @if (
              form.confirmPasswordShowErrors() &&
              form.confirmPasswordErrors().length
            ) {
              <div class="form-error" id="confirmPassword-error" role="alert">
                {{ form.confirmPasswordErrors()[0] }}
              </div>
            }
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <button
              class="btn-primary"
              type="submit"
              [disabled]="!form.valid() || form.submitting()"
            >
              @if (form.submitting()) {
                Creating Account...
              } @else {
                Create Account
              }
            </button>

            <button class="btn-secondary" type="button" (click)="resetForm()">
              Reset Form
            </button>
          </div>
        </form>
      </div>

      <!-- Form State Visualization -->
      <div class="min-w-0">
        <div class="state-monitor">
          <h3 class="mb-4 text-lg font-semibold">📊 Form State Monitor</h3>

          <!-- Overall Form State -->
          <div class="state-section">
            <h4 class="mb-2 font-medium">Overall Form State</h4>
            <div class="state-grid">
              <div class="state-item">
                <span class="state-label">Valid</span>
                <span
                  class="state-value"
                  [class]="form.valid() ? 'text-green-600' : 'text-red-600'"
                >
                  {{ form.valid() ? '✅' : '❌' }}
                </span>
              </div>
              <div class="state-item">
                <span class="state-label">Pending</span>
                <span
                  class="state-value"
                  [class]="form.pending() ? 'text-yellow-600' : 'text-gray-600'"
                >
                  {{ form.pending() ? '⏳' : '✅' }}
                </span>
              </div>
              <div class="state-item">
                <span class="state-label">Submitting</span>
                <span
                  class="state-value"
                  [class]="
                    form.submitting() ? 'text-blue-600' : 'text-gray-600'
                  "
                >
                  {{ form.submitting() ? '🚀' : '⏸️' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Field States -->
          <div class="state-section">
            <h4 class="mb-2 font-medium">Field States</h4>
            <div class="space-y-2">
              <div class="field-state">
                <span class="field-name">Username</span>
                <div class="field-indicators">
                  <span
                    [class]="
                      form.usernameValid() ? 'text-green-600' : 'text-red-600'
                    "
                  >
                    {{ form.usernameValid() ? '✅' : '❌' }}
                  </span>
                  <span
                    [class]="
                      form.usernameTouched() ? 'text-blue-600' : 'text-gray-400'
                    "
                  >
                    {{ form.usernameTouched() ? '👆' : '⭕' }}
                  </span>
                  <span
                    [class]="
                      form.usernameShowErrors()
                        ? 'text-red-600'
                        : 'text-gray-400'
                    "
                  >
                    {{ form.usernameShowErrors() ? '⚠️' : '🔇' }}
                  </span>
                </div>
              </div>

              <div class="field-state">
                <span class="field-name">Email</span>
                <div class="field-indicators">
                  <span
                    [class]="
                      form.emailValid() ? 'text-green-600' : 'text-red-600'
                    "
                  >
                    {{ form.emailValid() ? '✅' : '❌' }}
                  </span>
                  <span
                    [class]="
                      form.emailTouched() ? 'text-blue-600' : 'text-gray-400'
                    "
                  >
                    {{ form.emailTouched() ? '👆' : '⭕' }}
                  </span>
                  <span
                    [class]="
                      form.emailShowErrors() ? 'text-red-600' : 'text-gray-400'
                    "
                  >
                    {{ form.emailShowErrors() ? '⚠️' : '🔇' }}
                  </span>
                </div>
              </div>

              <div class="field-state">
                <span class="field-name">Password</span>
                <div class="field-indicators">
                  <span
                    [class]="
                      form.passwordValid() ? 'text-green-600' : 'text-red-600'
                    "
                  >
                    {{ form.passwordValid() ? '✅' : '❌' }}
                  </span>
                  <span
                    [class]="
                      form.passwordTouched() ? 'text-blue-600' : 'text-gray-400'
                    "
                  >
                    {{ form.passwordTouched() ? '👆' : '⭕' }}
                  </span>
                  <span
                    [class]="
                      form.passwordShowErrors()
                        ? 'text-red-600'
                        : 'text-gray-400'
                    "
                  >
                    {{ form.passwordShowErrors() ? '⚠️' : '🔇' }}
                  </span>
                </div>
              </div>

              <div class="field-state">
                <span class="field-name">Confirm Password</span>
                <div class="field-indicators">
                  <span
                    [class]="
                      form.confirmPasswordValid()
                        ? 'text-green-600'
                        : 'text-red-600'
                    "
                  >
                    {{ form.confirmPasswordValid() ? '✅' : '❌' }}
                  </span>
                  <span
                    [class]="
                      form.confirmPasswordTouched()
                        ? 'text-blue-600'
                        : 'text-gray-400'
                    "
                  >
                    {{ form.confirmPasswordTouched() ? '👆' : '⭕' }}
                  </span>
                  <span
                    [class]="
                      form.confirmPasswordShowErrors()
                        ? 'text-red-600'
                        : 'text-gray-400'
                    "
                  >
                    {{ form.confirmPasswordShowErrors() ? '⚠️' : '🔇' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Legend -->
          <div class="state-section">
            <h4 class="mb-2 font-medium">Legend</h4>
            <div class="space-y-1 text-sm">
              <div>✅ Valid/True | ❌ Invalid/False | ⏳ Pending</div>
              <div>
                👆 Touched | ⭕ Untouched | ⚠️ Showing Errors | 🔇 Hiding Errors
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class FormStateDemoFormComponent {
  // Create form instance using new Vest.js-first approach
  protected readonly form = createVestForm(
    formStateDemoSuite,
    signal<FormStateDemoModel>({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    }),
  );

  /**
   * Reactive form state accessor for parent components
   */
  readonly formState = () => this.form;

  // Form submission handler
  async onSubmit() {
    try {
      const validData = await this.form.submit();
      console.log('✅ Account created successfully:', validData);
    } catch (error) {
      console.error('❌ Account creation failed:', error);
    }
  }

  protected resetForm(): void {
    this.form.reset();
    console.log('🔄 Form reset to initial state');
  }
}
