import { KeyValuePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { NgxControlWrapper } from 'ngx-vest-forms/control-wrapper';
import { ngxVestForms } from 'ngx-vest-forms/core';
import {
  FormSteps,
  MultiStepFormModel,
  multiStepFormValidationSuite,
  validateAllSteps,
  validateStep,
} from './multi-step-form.validations';

/**
 * Multi-Step Form Component
 *
 * Demonstrates advanced Vest.js features in a real-world multi-step form:
 *
 * 🚀 Features Showcased:
 * - Group-based validation for multi-step forms
 * - Step-by-step validation with immediate feedback
 * - TypeScript generics for compile-time safety
 * - Performance optimization with conditional validation
 * - Advanced async validation patterns
 * - Final validation before submission
 *
 * 📋 Form Structure:
 * - Step 1: Personal information (name, date of birth, email)
 * - Step 2: Account setup (username, password, confirmation)
 * - Step 3: Profile & preferences (bio, website, settings)
 *
 * 🎯 Key Patterns:
 * - Real-time step validation
 * - Navigation validation (can't proceed with errors)
 * - Final form submission with all-step validation
 */
@Component({
  selector: 'ngx-multi-step-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ngxVestForms, NgxControlWrapper, KeyValuePipe],
  template: `
    <div class="mx-auto max-w-2xl p-6">
      <div class="mb-8">
        <h1 class="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
          Multi-Step Registration
        </h1>
        <p class="text-gray-600 dark:text-gray-300">
          Complete all steps to create your account. Advanced Vest.js validation
          with groups and performance optimization.
        </p>
      </div>

      <!-- Progress Indicator -->
      <div class="mb-8">
        <div class="mb-4 flex items-center justify-between">
          @for (step of steps; track step.key; let i = $index) {
            <div
              class="flex items-center"
              [class.flex-1]="i < steps.length - 1"
            >
              <div
                class="flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors"
                [class]="getStepClasses(step.key, i)"
              >
                {{ i + 1 }}
              </div>
              @if (i < steps.length - 1) {
                <div
                  class="mx-4 h-1 flex-1 transition-colors"
                  [class.bg-blue-500]="currentStepIndex() > i"
                  [class.bg-gray-300]="currentStepIndex() <= i"
                ></div>
              }
            </div>
          }
        </div>
        <div class="text-center">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            {{ steps[currentStepIndex()].title }}
          </h2>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {{ steps[currentStepIndex()].description }}
          </p>
        </div>
      </div>

      <form
        ngxVestForm
        [vestSuite]="suite"
        [(formValue)]="formData"
        #vestForm="ngxVestForm"
        class="space-y-6"
      >
        <!-- Step 1: Personal Information -->
        @if (currentStep() === 'personal') {
          <div class="space-y-4">
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <ngx-control-wrapper>
                <label for="firstName">First Name *</label>
                <input
                  id="firstName"
                  name="firstName"
                  [ngModel]="formData().firstName"
                  class="form-input"
                  placeholder="Enter your first name"
                />
              </ngx-control-wrapper>

              <ngx-control-wrapper>
                <label for="lastName">Last Name *</label>
                <input
                  id="lastName"
                  name="lastName"
                  [ngModel]="formData().lastName"
                  class="form-input"
                  placeholder="Enter your last name"
                />
              </ngx-control-wrapper>
            </div>

            <ngx-control-wrapper>
              <label for="dateOfBirth">Date of Birth *</label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                [ngModel]="formData().dateOfBirth"
                class="form-input"
              />
            </ngx-control-wrapper>

            <ngx-control-wrapper>
              <label for="email">Email Address *</label>
              <input
                id="email"
                name="email"
                type="email"
                [ngModel]="formData().email"
                class="form-input"
                placeholder="Enter your email address"
              />
            </ngx-control-wrapper>
          </div>
        }

        <!-- Step 2: Account Setup -->
        @if (currentStep() === 'account') {
          <div class="space-y-4">
            <ngx-control-wrapper>
              <label for="username">Username *</label>
              <input
                id="username"
                name="username"
                [ngModel]="formData().username"
                class="form-input"
                placeholder="Choose a unique username"
              />
              <div class="form-hint">
                3-20 characters, letters, numbers, and underscores only
              </div>
            </ngx-control-wrapper>

            <ngx-control-wrapper>
              <label for="password">Password *</label>
              <input
                id="password"
                name="password"
                type="password"
                [ngModel]="formData().password"
                class="form-input"
                placeholder="Create a secure password"
              />
              <div class="form-hint">
                At least 8 characters with uppercase, lowercase, and number
              </div>
            </ngx-control-wrapper>

            <ngx-control-wrapper>
              <label for="confirmPassword">Confirm Password *</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                [ngModel]="formData().confirmPassword"
                class="form-input"
                placeholder="Confirm your password"
              />
            </ngx-control-wrapper>
          </div>
        }

        <!-- Step 3: Profile & Preferences -->
        @if (currentStep() === 'profile') {
          <div class="space-y-4">
            <ngx-control-wrapper>
              <label for="bio">Bio *</label>
              <textarea
                id="bio"
                name="bio"
                rows="4"
                [ngModel]="formData().bio"
                class="form-input resize-none"
                placeholder="Tell us about yourself (at least 20 characters)"
              >
              </textarea>
            </ngx-control-wrapper>

            <ngx-control-wrapper>
              <label for="website">Website (Optional)</label>
              <input
                id="website"
                name="website"
                type="url"
                [ngModel]="formData().website"
                class="form-input"
                placeholder="https://your-website.com"
              />
            </ngx-control-wrapper>

            <div class="space-y-3">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                Preferences
              </h3>

              <ngx-control-wrapper>
                <label class="flex items-center space-x-3">
                  <input
                    name="receiveNewsletter"
                    type="checkbox"
                    [ngModel]="formData().receiveNewsletter"
                    class="form-checkbox"
                  />
                  <span>Subscribe to newsletter</span>
                </label>
              </ngx-control-wrapper>

              <ngx-control-wrapper>
                <label for="preferredLanguage">Preferred Language *</label>
                <select
                  id="preferredLanguage"
                  name="preferredLanguage"
                  class="form-input"
                  [ngModel]="formData().preferredLanguage"
                >
                  <option value="" disabled>Select a language</option>
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
              </ngx-control-wrapper>

              <ngx-control-wrapper>
                <label class="flex items-center space-x-3">
                  <input
                    name="agreeToTerms"
                    type="checkbox"
                    [ngModel]="formData().agreeToTerms"
                    class="form-checkbox"
                  />
                  <span>I agree to the terms and conditions *</span>
                </label>
              </ngx-control-wrapper>
            </div>
          </div>
        }

        <!-- Navigation Buttons -->
        <div
          class="flex justify-between border-t border-gray-200 pt-6 dark:border-gray-700"
        >
          <button
            type="button"
            (click)="previousStep()"
            [disabled]="currentStepIndex() === 0"
            class="btn-secondary"
            [class.opacity-50]="currentStepIndex() === 0"
            [class.cursor-not-allowed]="currentStepIndex() === 0"
          >
            Previous
          </button>

          <div class="flex space-x-3">
            @if (currentStepIndex() < steps.length - 1) {
              <button
                type="button"
                (click)="nextStep()"
                [disabled]="!canProceedToNextStep()"
                class="btn-primary"
              >
                Next Step
              </button>
            } @else {
              <button
                type="submit"
                (click)="onSubmit()"
                [disabled]="!canSubmitForm()"
                class="btn-primary"
              >
                Create Account
              </button>
            }
          </div>
        </div>
      </form>

      <!-- Form State Debug Panel -->
      <div class="mt-8 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
        <h3 class="mb-2 text-sm font-medium text-gray-900 dark:text-white">
          Form State Debug
        </h3>
        <div class="space-y-1 text-xs text-gray-600 dark:text-gray-300">
          <div>Current Step: {{ currentStep() }}</div>
          <div>Step Valid: {{ isCurrentStepValid() }}</div>
          <div>Form Valid: {{ vestForm.formState().valid }}</div>
          <div>Pending: {{ vestForm.formState().pending }}</div>
          @if (vestForm.formState().errors | keyvalue; as errors) {
            <div>Errors: {{ errors.length }}</div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .form-input {
        @apply w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-400 dark:focus:ring-blue-400;
      }

      .form-checkbox {
        @apply h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-blue-400;
      }

      .form-hint {
        @apply mt-1 text-sm text-gray-500 dark:text-gray-400;
      }

      .btn {
        @apply rounded-md px-4 py-2 text-sm font-medium transition-colors duration-200 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50;
      }

      .btn-primary {
        @apply bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:hover:bg-blue-600;
      }

      .btn-secondary {
        @apply bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-700;
      }
    `,
  ],
})
export class MultiStepFormComponent {
  protected readonly formData = signal<Partial<MultiStepFormModel>>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    bio: '',
    website: '',
    preferredLanguage: '',
    receiveNewsletter: false,
    agreeToTerms: false,
  });

  protected readonly suite = multiStepFormValidationSuite;

  protected readonly currentStep = signal<FormSteps>('personal');

  protected readonly steps = [
    {
      key: 'personal' as FormSteps,
      title: 'Personal Information',
      description: 'Basic information about you',
    },
    {
      key: 'account' as FormSteps,
      title: 'Account Setup',
      description: 'Create your login credentials',
    },
    {
      key: 'profile' as FormSteps,
      title: 'Profile & Preferences',
      description: 'Complete your profile setup',
    },
  ];

  protected readonly currentStepIndex = computed(() => {
    return this.steps.findIndex((step) => step.key === this.currentStep());
  });

  /**
   * Check if current step is valid for navigation
   */
  protected readonly isCurrentStepValid = computed(() => {
    const stepResult = validateStep(this.formData(), this.currentStep());
    return stepResult.isValid();
  });

  /**
   * Check if we can proceed to the next step
   */
  protected readonly canProceedToNextStep = computed(() => {
    return this.isCurrentStepValid();
  });

  /**
   * Check if the entire form can be submitted
   */
  protected readonly canSubmitForm = computed(() => {
    const allStepsResult = validateAllSteps(this.formData());
    return allStepsResult.isValid();
  });

  /**
   * Get CSS classes for step indicator
   */
  protected getStepClasses(step: FormSteps, index: number): string {
    const current = this.currentStepIndex();
    const isCompleted = index < current;
    const isCurrent = index === current;

    if (isCompleted) {
      return 'bg-green-500 border-green-500 text-white';
    } else if (isCurrent) {
      return 'bg-blue-500 border-blue-500 text-white';
    } else {
      return 'bg-gray-200 border-gray-300 text-gray-600 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-300';
    }
  }

  /**
   * Navigate to previous step
   */
  protected previousStep(): void {
    const currentIndex = this.currentStepIndex();
    if (currentIndex > 0) {
      this.currentStep.set(this.steps[currentIndex - 1].key);
    }
  }

  /**
   * Navigate to next step (only if current step is valid)
   */
  protected nextStep(): void {
    if (!this.canProceedToNextStep()) {
      return;
    }

    const currentIndex = this.currentStepIndex();
    if (currentIndex < this.steps.length - 1) {
      this.currentStep.set(this.steps[currentIndex + 1].key);
    }
  }

  /**
   * Handle form submission
   */
  protected onSubmit(): void {
    if (!this.canSubmitForm()) {
      console.warn('Form is not valid for submission');
      return;
    }

    const formData = this.formData();

    console.group('🚀 Multi-Step Form Submission');
    console.log('📋 Form Data:', formData);
    console.log('✅ Validation Status:', 'All steps valid');
    console.groupEnd();

    // Here you would typically send the data to your API
    alert('Registration completed successfully!');
  }
}
