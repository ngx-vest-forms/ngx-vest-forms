import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  isDevMode,
  signal,
  viewChild,
} from '@angular/core';
import {
  NgxErrorDisplayMode,
  NgxFormDirective,
  NgxFormErrorDisplayDirective,
  ngxVestForms,
} from 'ngx-vest-forms/core';
import {
  ProductFeedbackModel,
  productFeedbackValidationSuite,
} from './error-display-modes.validations';

/**
 * Error Display Modes Interactive Demo Form
 *
 * Demonstrates how different error display modes affect user experience
 * using a realistic product feedback form scenario.
 */
@Component({
  selector: 'ngx-error-display-modes-form',
  imports: [ngxVestForms, NgxFormErrorDisplayDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Product Feedback Form -->
    <form
      ngxVestForm
      [vestSuite]="suite"
      [(formValue)]="model"
      #vestForm="ngxVestForm"
      (ngSubmit)="onSubmit()"
      class="form-container"
      aria-labelledby="productFeedbackHeading"
    >
      <!-- Personal Information Section -->
      <fieldset class="mb-8">
        <legend
          class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100"
        >
          👤 Personal Information
        </legend>

        <!-- Name Field -->
        <div
          class="form-field"
          ngxFormErrorDisplay
          [errorDisplayMode]="errorDisplayMode()"
          #nameDisplay="formErrorDisplay"
        >
          <label class="form-label" for="name">Full Name *</label>
          <input
            class="form-input"
            id="name"
            name="name"
            type="text"
            [ngModel]="model().name"
            placeholder="Your full name"
            [attr.aria-invalid]="nameDisplay.shouldShowErrors() ? 'true' : null"
            [attr.aria-describedby]="
              'name-hint ' +
              (nameDisplay.shouldShowErrors() ? 'name-errors' : '')
            "
            autocomplete="name"
          />
          <div class="form-hint" id="name-hint">
            We use this to personalize our response
          </div>
          @if (nameDisplay.shouldShowErrors() && nameDisplay.errors().length) {
            <div class="form-error" id="name-errors" role="alert">
              {{ nameDisplay.errors()[0] }}
            </div>
          }
        </div>

        <!-- Email Field -->
        <div
          class="form-field"
          ngxFormErrorDisplay
          [errorDisplayMode]="errorDisplayMode()"
          #emailDisplay="formErrorDisplay"
        >
          <label class="form-label" for="email">Email Address *</label>
          <input
            class="form-input"
            id="email"
            name="email"
            type="email"
            [ngModel]="model().email"
            placeholder="your.email@company.com"
            [attr.aria-invalid]="
              emailDisplay.shouldShowErrors() ? 'true' : null
            "
            [attr.aria-describedby]="
              'email-hint ' +
              (emailDisplay.shouldShowErrors() ? 'email-errors' : '')
            "
            autocomplete="email"
          />
          <div class="form-hint" id="email-hint">
            For follow-up questions (we respect your privacy)
          </div>
          @if (
            emailDisplay.shouldShowErrors() && emailDisplay.errors().length
          ) {
            <div class="form-error" id="email-errors" role="alert">
              {{ emailDisplay.errors()[0] }}
            </div>
          }
        </div>

        <!-- Company Field -->
        <div
          class="form-field"
          ngxFormErrorDisplay
          [errorDisplayMode]="errorDisplayMode()"
          #companyDisplay="formErrorDisplay"
        >
          <label class="form-label" for="company">Company</label>
          <input
            class="form-input"
            id="company"
            name="company"
            type="text"
            [ngModel]="model().company"
            placeholder="Your company (optional)"
            [attr.aria-invalid]="
              companyDisplay.shouldShowErrors() ? 'true' : null
            "
            [attr.aria-describedby]="
              'company-hint ' +
              (companyDisplay.shouldShowErrors() ? 'company-errors' : '')
            "
            autocomplete="organization"
          />
          <div class="form-hint" id="company-hint">
            Helps us understand your use case
          </div>
          @if (
            companyDisplay.shouldShowErrors() && companyDisplay.errors().length
          ) {
            <div class="form-error" id="company-errors" role="alert">
              {{ companyDisplay.errors()[0] }}
            </div>
          }
        </div>
      </fieldset>

      <!-- Feedback Section -->
      <fieldset class="mb-8">
        <legend
          class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100"
        >
          📝 Your Feedback
        </legend>

        <!-- Product Used -->
        <div
          class="form-field"
          ngxFormErrorDisplay
          [errorDisplayMode]="errorDisplayMode()"
          #productDisplay="formErrorDisplay"
        >
          <label class="form-label" for="productUsed"
            >Which product did you use? *</label
          >
          <select
            class="form-input"
            id="productUsed"
            name="productUsed"
            [ngModel]="model().productUsed"
            [attr.aria-invalid]="
              productDisplay.shouldShowErrors() ? 'true' : null
            "
            [attr.aria-describedby]="
              'product-hint ' +
              (productDisplay.shouldShowErrors() ? 'product-errors' : '')
            "
          >
            <option value="">Select a product...</option>
            <option value="Web App">Web Application</option>
            <option value="Mobile App">Mobile Application</option>
            <option value="API">API Documentation</option>
            <option value="Documentation">User Documentation</option>
            <option value="Other">Other</option>
          </select>
          <div class="form-hint" id="product-hint">
            Which product are you providing feedback about?
          </div>
          @if (
            productDisplay.shouldShowErrors() && productDisplay.errors().length
          ) {
            <div class="form-error" id="product-errors" role="alert">
              {{ productDisplay.errors()[0] }}
            </div>
          }
        </div>

        <!-- Overall Rating -->
        <div
          class="form-field"
          ngxFormErrorDisplay
          [errorDisplayMode]="errorDisplayMode()"
          #ratingDisplay="formErrorDisplay"
        >
          <label class="form-label" for="overallRating">Overall Rating *</label>
          <input
            class="form-input"
            id="overallRating"
            name="overallRating"
            type="number"
            min="1"
            max="5"
            [ngModel]="model().overallRating"
            placeholder="Rate 1-5 stars"
            [attr.aria-invalid]="
              ratingDisplay.shouldShowErrors() ? 'true' : null
            "
            [attr.aria-describedby]="
              'rating-hint ' +
              (ratingDisplay.shouldShowErrors() ? 'rating-errors' : '')
            "
          />
          <div class="form-hint" id="rating-hint">1 = Poor, 5 = Excellent</div>
          @if (
            ratingDisplay.shouldShowErrors() && ratingDisplay.errors().length
          ) {
            <div class="form-error" id="rating-errors" role="alert">
              {{ ratingDisplay.errors()[0] }}
            </div>
          }
        </div>

        <!-- Conditional Improvement Suggestions -->
        @if (model().overallRating && model().overallRating <= 3) {
          <div
            class="form-field"
            ngxFormErrorDisplay
            [errorDisplayMode]="errorDisplayMode()"
            #improvementDisplay="formErrorDisplay"
          >
            <label class="form-label" for="improvementSuggestions">
              What could we improve? *
            </label>
            <textarea
              class="form-input"
              id="improvementSuggestions"
              name="improvementSuggestions"
              rows="4"
              [ngModel]="model().improvementSuggestions"
              placeholder="Please help us understand what went wrong..."
              [attr.aria-invalid]="
                improvementDisplay.shouldShowErrors() ? 'true' : null
              "
              [attr.aria-describedby]="
                'improvement-hint improvement-counter ' +
                (improvementDisplay.shouldShowErrors()
                  ? 'improvement-errors'
                  : '')
              "
            ></textarea>
            <div class="mt-1 flex items-center justify-between">
              <div class="form-hint" id="improvement-hint">
                Please help us understand what went wrong
              </div>
              <span
                id="improvement-counter"
                class="text-xs text-gray-500 dark:text-gray-400"
                [class.text-red-600]="
                  (model().improvementSuggestions.length || 0) > 500
                "
                [class.dark:text-red-400]="
                  (model().improvementSuggestions.length || 0) > 500
                "
              >
                {{ model().improvementSuggestions.length || 0 }}/500
              </span>
            </div>
            @if (
              improvementDisplay.shouldShowErrors() &&
              improvementDisplay.errors().length
            ) {
              <div class="form-error" id="improvement-errors" role="alert">
                {{ improvementDisplay.errors()[0] }}
              </div>
            }
          </div>
        }

        <!-- Detailed Feedback -->
        <div
          class="form-field"
          ngxFormErrorDisplay
          [errorDisplayMode]="errorDisplayMode()"
          #detailedDisplay="formErrorDisplay"
        >
          <label class="form-label" for="detailedFeedback">
            Additional Comments
          </label>
          <textarea
            class="form-input"
            id="detailedFeedback"
            name="detailedFeedback"
            rows="4"
            [ngModel]="model().detailedFeedback"
            placeholder="Share your detailed experience..."
            [attr.aria-invalid]="
              detailedDisplay.shouldShowErrors() ? 'true' : null
            "
            [attr.aria-describedby]="
              'detailed-hint detailed-counter ' +
              (detailedDisplay.shouldShowErrors() ? 'detailed-errors' : '')
            "
          ></textarea>
          <div class="mt-1 flex items-center justify-between">
            <div class="form-hint" id="detailed-hint">
              Any additional thoughts or suggestions
            </div>
            <span
              id="detailed-counter"
              class="text-xs text-gray-500 dark:text-gray-400"
              [class.text-red-600]="
                (model().detailedFeedback.length || 0) > 1000
              "
              [class.dark:text-red-400]="
                (model().detailedFeedback.length || 0) > 1000
              "
            >
              {{ model().detailedFeedback.length || 0 }}/1000
            </span>
          </div>
          @if (
            detailedDisplay.shouldShowErrors() &&
            detailedDisplay.errors().length
          ) {
            <div class="form-error" id="detailed-errors" role="alert">
              {{ detailedDisplay.errors()[0] }}
            </div>
          }
        </div>
      </fieldset>

      <!-- Preferences Section -->
      <fieldset class="mb-8">
        <legend
          class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100"
        >
          ⚙️ Preferences
        </legend>

        <!-- Allow Follow Up -->
        <div class="form-field">
          <label class="form-checkbox-label">
            <input
              type="checkbox"
              name="allowFollowUp"
              [ngModel]="model().allowFollowUp"
              class="form-checkbox"
            />
            <span class="ml-2"
              >Allow us to contact you for follow-up questions</span
            >
          </label>
          <div class="form-hint ml-6">We promise not to spam you</div>
        </div>

        <!-- Newsletter -->
        <div class="form-field">
          <label class="form-checkbox-label">
            <input
              type="checkbox"
              name="newsletter"
              [ngModel]="model().newsletter"
              class="form-checkbox"
            />
            <span class="ml-2">Subscribe to product updates</span>
          </label>
          <div class="form-hint ml-6">
            Monthly digest of new features and improvements
          </div>
        </div>
      </fieldset>

      <!-- Submit Section -->
      <div class="form-actions">
        @if (showSubmissionError()) {
          <div
            class="mb-4 rounded-lg bg-red-50 p-4 dark:bg-red-900/20"
            role="alert"
          >
            <div class="text-sm font-medium text-red-800 dark:text-red-200">
              Please fix the errors above before submitting.
            </div>
          </div>
        }

        @if (showPendingMessage()) {
          <div
            class="mb-4 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20"
            role="alert"
          >
            <div class="text-sm font-medium text-blue-800 dark:text-blue-200">
              Still validating... Please wait a moment.
            </div>
          </div>
        }

        <button
          type="submit"
          class="btn-primary"
          [attr.aria-describedby]="
            showSubmissionError() ? 'submission-error' : null
          "
        >
          @if (isSubmitting()) {
            <span class="inline-block animate-spin">⏳</span>
            Submitting Feedback...
          } @else {
            Submit Feedback
          }
        </button>
      </div>
    </form>
  `,
})
export class ErrorDisplayModesFormComponent {
  /** The error display mode to use for form validation */
  readonly errorDisplayMode = input.required<NgxErrorDisplayMode>();

  protected readonly model = signal<ProductFeedbackModel>({
    name: '',
    email: '',
    company: '',
    productUsed: '',
    overallRating: 0,
    improvementSuggestions: '',
    detailedFeedback: '',
    allowFollowUp: false,
    newsletter: false,
  });

  protected readonly suite = productFeedbackValidationSuite;
  protected readonly isSubmitting = signal(false);
  protected readonly showSubmissionError = signal(false);
  protected readonly showPendingMessage = signal(false);
  protected readonly vestFormRef =
    viewChild.required<NgxFormDirective>('vestForm');

  readonly formState = computed(() => this.vestFormRef().formState());

  protected onSubmit(): void {
    const formState = this.vestFormRef().formState();

    // Reset previous messages
    this.showSubmissionError.set(false);
    this.showPendingMessage.set(false);

    // WCAG 2.2 Compliant: Handle validation in code, not UI
    if (!formState.valid) {
      this.showSubmissionError.set(true);
      this.focusFirstInvalidField();
      return;
    }

    if (formState.pending) {
      this.showPendingMessage.set(true);
      return;
    }

    // Valid submission
    const formData = this.model();
    if (isDevMode()) {
      console.group('📋 Product Feedback Submission');
      console.log('Form Data:', formData);
      console.log('Current Error Display Mode:', this.errorDisplayMode());
      console.groupEnd();
    }

    this.isSubmitting.set(true);
    setTimeout(() => {
      this.isSubmitting.set(false);
      // In a real app, this would redirect or show success
      alert('Thank you for your feedback! 🎉');
    }, 1500);
  }

  private focusFirstInvalidField(): void {
    // Find the first field with errors and focus it
    const formState = this.vestFormRef().formState();
    const firstErrorField = Object.keys(formState.errors)[0];

    if (firstErrorField) {
      const element = document.querySelector<HTMLElement>(
        `#${firstErrorField}`,
      );
      element?.focus();
    }
  }
}
