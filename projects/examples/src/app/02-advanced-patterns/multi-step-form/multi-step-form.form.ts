import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import { NgxControlWrapper } from 'ngx-vest-forms/control-wrapper';
import { NgxFormDirective, ngxVestForms } from 'ngx-vest-forms/core';
import {
  FormSteps,
  MultiStepFormModel,
  multiStepFormValidationSuite,
  validateAllSteps,
  validateStep,
} from './multi-step-form.validations';

/**
 * Extracted form component for the Multi-Step Form example.
 * Demonstrates advanced Vest.js group validation with step isolation.
 */
@Component({
  selector: 'ngx-multi-step-form',
  imports: [ngxVestForms, NgxControlWrapper],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-2xl">
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
                  aria-required="true"
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
                  aria-required="true"
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
                aria-required="true"
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
                placeholder="you@example.com"
                aria-required="true"
                (keyup.enter)="onEnterFromEmail()"
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
                aria-required="true"
              />
              <p class="mt-1 text-sm text-gray-600">
                Must be 3-20 characters, letters and numbers only
              </p>
            </ngx-control-wrapper>

            <ngx-control-wrapper>
              <label for="password">Password *</label>
              <input
                id="password"
                name="password"
                type="password"
                [ngModel]="formData().password"
                class="form-input"
                placeholder="Enter a strong password"
                aria-required="true"
              />
              <p class="mt-1 text-sm text-gray-600">
                Must be 8+ characters with uppercase, lowercase, and number
              </p>
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
                aria-required="true"
              />
            </ngx-control-wrapper>
          </div>
        }

        <!-- Step 3: Profile & Preferences -->
        @if (currentStep() === 'profile') {
          <div class="space-y-4">
            <ngx-control-wrapper>
              <label for="bio">Bio (Optional)</label>
              <textarea
                id="bio"
                name="bio"
                rows="4"
                [ngModel]="formData().bio"
                class="form-input"
                placeholder="Tell us about yourself..."
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
                placeholder="https://yourwebsite.com"
              />
            </ngx-control-wrapper>

            <ngx-control-wrapper>
              <label for="preferredLanguage">Preferred Language *</label>
              <select
                id="preferredLanguage"
                name="preferredLanguage"
                [ngModel]="formData().preferredLanguage"
                class="form-input"
                aria-required="true"
              >
                <option value="">Select a language</option>
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="it">Italian</option>
                <option value="pt">Portuguese</option>
              </select>
            </ngx-control-wrapper>

            <div class="space-y-3">
              <ngx-control-wrapper>
                <div class="flex items-center">
                  <input
                    id="receiveNewsletter"
                    name="receiveNewsletter"
                    type="checkbox"
                    [ngModel]="formData().receiveNewsletter"
                    class="form-checkbox"
                  />
                  <label for="receiveNewsletter" class="ml-2 text-sm">
                    I want to receive newsletters and updates
                  </label>
                </div>
              </ngx-control-wrapper>

              <ngx-control-wrapper>
                <div class="flex items-center">
                  <input
                    id="agreeToTerms"
                    name="agreeToTerms"
                    type="checkbox"
                    [ngModel]="formData().agreeToTerms"
                    class="form-checkbox"
                    aria-required="true"
                  />
                  <label for="agreeToTerms" class="ml-2 text-sm">
                    I agree to the Terms of Service and Privacy Policy *
                  </label>
                </div>
              </ngx-control-wrapper>
            </div>
          </div>
        }

        <!-- Step Navigation -->
        <div class="flex items-center justify-between border-t pt-6">
          <button
            type="button"
            (click)="previousStep()"
            [disabled]="currentStepIndex() === 0"
            class="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            @if (currentStepIndex() === 2) {
              Back to Account Setup
            } @else if (currentStepIndex() === 1) {
              Back to Personal Info
            } @else {
              Previous
            }
          </button>

          <div class="mx-4 flex-1">
            <div class="text-center text-sm text-gray-600">
              Step {{ currentStepIndex() + 1 }} of {{ steps.length }}
            </div>
          </div>

          @if (currentStepIndex() === steps.length - 1) {
            <button
              type="button"
              (click)="onSubmit()"
              [disabled]="!canSubmit()"
              class="rounded-md bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              @if (isSubmitting()) {
                <span class="flex items-center">
                  <svg
                    class="mr-2 -ml-1 h-4 w-4 animate-spin text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Submitting...
                </span>
              } @else {
                Submit Registration
              }
            </button>
          } @else {
            <button
              type="button"
              (click)="nextStep()"
              [disabled]="!canProceedToNextStep()"
              class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              @if (currentStepIndex() === 0) {
                Next: Account Setup
              } @else if (currentStepIndex() === 1) {
                Next: Profile & Preferences
              } @else {
                Next
              }
            </button>
          }
        </div>
      </form>

      <!-- Step Validation Status -->
      @if (showValidationStatus()) {
        <div class="mt-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
          <h3 class="mb-3 text-sm font-medium text-gray-900 dark:text-white">
            Step Validation Status
          </h3>
          <div class="space-y-2">
            @for (step of steps; track step.key) {
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-700 dark:text-gray-300">{{
                  step.title
                }}</span>
                <span [class]="getStepValidationStatusClass(step.key)">
                  {{ getStepValidationStatus(step.key) }}
                </span>
              </div>
            }
          </div>
        </div>
      }

      <!-- Form Submission Result -->
      @if (submissionResult()) {
        <div
          class="mt-6 rounded-lg p-4"
          [class]="
            submissionResult()?.success
              ? 'border border-green-200 bg-green-50'
              : 'border border-red-200 bg-red-50'
          "
        >
          @if (submissionResult()?.success) {
            <div class="flex">
              <div class="flex-shrink-0">
                <svg
                  class="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-green-800">
                  Registration submitted successfully!
                </h3>
                <p class="mt-1 text-sm text-green-700">
                  Thank you for registering
                </p>
              </div>
            </div>
          } @else {
            <div class="flex">
              <div class="flex-shrink-0">
                <svg
                  class="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">
                  Registration Failed
                </h3>
                <p class="mt-1 text-sm text-red-700">
                  {{ submissionResult()?.message }}
                </p>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .form-input {
        @apply w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white;
      }

      .form-checkbox {
        @apply h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700;
      }

      .ng-invalid.ng-touched {
        @apply border-red-300 ring-red-500;
      }

      .ng-valid.ng-touched {
        @apply border-green-300 ring-green-500;
      }
    `,
  ],
})
export class MultiStepFormComponent {
  // Form reference
  protected readonly vestForm = viewChild(NgxFormDirective);

  // Form state for parent access (return the actual state object, not the signal)
  readonly formState = computed(() => {
    const formDirective = this.vestForm();
    return formDirective ? formDirective.formState() : ({} as unknown);
  });

  // Validation suite
  protected readonly suite = multiStepFormValidationSuite;

  // Form data
  protected readonly formData = signal<MultiStepFormModel>({
    // Personal Information
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    email: '',

    // Account Setup
    username: '',
    password: '',
    confirmPassword: '',

    // Profile & Preferences
    bio: '',
    website: '',
    preferredLanguage: '',
    receiveNewsletter: false,
    agreeToTerms: false,
  });

  // UI state
  protected readonly currentStepIndex = signal(0);
  protected readonly isSubmitting = signal(false);
  protected readonly submissionResult = signal<{
    success: boolean;
    message: string;
  } | null>(null);

  // Step definitions
  protected readonly steps = [
    {
      key: 'personal' as FormSteps,
      title: 'Personal Information',
      description: 'Basic information about you',
    },
    {
      key: 'account' as FormSteps,
      title: 'Account Setup',
      description: 'Create your account credentials',
    },
    {
      key: 'profile' as FormSteps,
      title: 'Profile & Preferences',
      description: 'Customize your profile and settings',
    },
  ];

  // Computed properties
  protected readonly currentStep = computed(
    () => this.steps[this.currentStepIndex()].key,
  );

  protected readonly canProceedToNextStep = computed(() => {
    const currentStep = this.currentStep();
    const stepValidation = validateStep(this.formData(), currentStep);
    return stepValidation.isValid();
  });

  protected readonly canSubmit = computed(() => {
    const allStepsValidation = validateAllSteps(this.formData());
    return allStepsValidation.isValid() && !this.isSubmitting();
  });

  protected readonly showValidationStatus = computed(
    () => this.currentStepIndex() > 0 || this.submissionResult() !== null,
  );

  // Step navigation
  protected nextStep(): void {
    if (
      this.currentStepIndex() < this.steps.length - 1 &&
      this.canProceedToNextStep()
    ) {
      this.currentStepIndex.update((index) => index + 1);
      this.submissionResult.set(null);
    }
  }

  protected previousStep(): void {
    if (this.currentStepIndex() > 0) {
      this.currentStepIndex.update((index) => index - 1);
      this.submissionResult.set(null);
    }
  }

  // Form submission
  protected async onSubmit(): Promise<void> {
    if (!this.canSubmit()) {
      return;
    }

    this.isSubmitting.set(true);
    this.submissionResult.set(null);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simulate success/failure
      const success = Math.random() > 0.2; // 80% success rate

      if (success) {
        this.submissionResult.set({
          success: true,
          message:
            'Your account has been created successfully! Welcome aboard.',
        });
      } else {
        this.submissionResult.set({
          success: false,
          message: 'Registration failed. Please try again.',
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      this.submissionResult.set({
        success: false,
        message: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      this.isSubmitting.set(false);
    }
  }

  // Helper methods
  protected getStepClasses(stepKey: FormSteps, index: number): string {
    const current = this.currentStepIndex();
    const stepValidation = validateStep(this.formData(), stepKey);

    if (index === current) {
      return 'bg-blue-500 border-blue-500 text-white';
    } else if (index < current) {
      return stepValidation.isValid()
        ? 'bg-green-500 border-green-500 text-white'
        : 'bg-red-500 border-red-500 text-white';
    } else {
      return 'bg-gray-200 border-gray-300 text-gray-600';
    }
  }

  protected getStepValidationStatus(stepKey: FormSteps): string {
    const stepValidation = validateStep(this.formData(), stepKey);

    if (stepKey === this.currentStep()) {
      return stepValidation.isValid() ? '✓ Valid' : '⚠ Incomplete';
    }

    return stepValidation.isValid() ? '✓ Complete' : '✗ Invalid';
  }

  protected getStepValidationStatusClass(stepKey: FormSteps): string {
    const stepValidation = validateStep(this.formData(), stepKey);
    const isValid = stepValidation.isValid();
    const isCurrent = stepKey === this.currentStep();

    if (isCurrent) {
      return isValid
        ? 'text-green-600 font-medium'
        : 'text-yellow-600 font-medium';
    }

    return isValid ? 'text-green-600' : 'text-red-600';
  }

  // Keyboard: pressing Enter in Email moves to next step if allowed
  protected onEnterFromEmail(): void {
    if (this.currentStep() === 'personal' && this.canProceedToNextStep()) {
      this.nextStep();
    }
  }
}
